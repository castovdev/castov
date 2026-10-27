-- ==============================================================================
-- Migration: 20261027_mcp_telemetry.sql
-- Description: Privacy-Friendly Usage Analytics for Castov MCP Server and CLI
-- Enables tracking MCP adoption, unique installs, tool execution stats,
-- and daily aggregation with automated 90-day retention cleanup.
-- ==============================================================================

-- 1. Raw Telemetry Events Table
CREATE TABLE IF NOT EXISTS public.mcp_telemetry_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    event_type TEXT NOT NULL CHECK (event_type IN ('initialize', 'tools_aggregate', 'cli_ping', 'error')),
    install_hash TEXT,             -- SHA-256(anon_id + server_pepper)
    visitor_hash TEXT,             -- SHA-256(ip + user_agent + daily_rotating_salt)
    client_name TEXT,              -- e.g. 'claude-desktop', 'cursor', 'vscode', 'cli'
    client_version TEXT,           -- client version string from initialize clientInfo
    tool_name TEXT,                -- tool name for single tool events or primary tool
    castov_version TEXT,           -- e.g. '1.5.0'
    os_family TEXT,                -- 'darwin', 'win32', 'linux', 'other'
    node_version TEXT,             -- 'v20.x'
    command_name TEXT,             -- e.g. 'mcp', 'ts', 'cron', etc.
    session_id_hash TEXT,          -- SHA-256(session_id)
    call_count INTEGER NOT NULL DEFAULT 1,
    error_count INTEGER NOT NULL DEFAULT 0,
    total_duration_ms INTEGER NOT NULL DEFAULT 0,
    success BOOLEAN NOT NULL DEFAULT true
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_mcp_telemetry_created_at ON public.mcp_telemetry_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_telemetry_event_type ON public.mcp_telemetry_events (event_type);
CREATE INDEX IF NOT EXISTS idx_mcp_telemetry_install_hash ON public.mcp_telemetry_events (install_hash) WHERE install_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mcp_telemetry_client_name ON public.mcp_telemetry_events (client_name) WHERE client_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mcp_telemetry_tool_name ON public.mcp_telemetry_events (tool_name) WHERE tool_name IS NOT NULL;

-- 2. Daily Aggregates Table (for long-term trend analysis beyond 90 days)
CREATE TABLE IF NOT EXISTS public.mcp_daily_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    event_type TEXT NOT NULL,
    client_name TEXT NOT NULL DEFAULT 'unknown',
    tool_name TEXT NOT NULL DEFAULT 'all',
    castov_version TEXT NOT NULL DEFAULT 'unknown',
    os_family TEXT NOT NULL DEFAULT 'unknown',
    total_calls BIGINT NOT NULL DEFAULT 0,
    total_errors BIGINT NOT NULL DEFAULT 0,
    total_duration_ms BIGINT NOT NULL DEFAULT 0,
    unique_installs INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_mcp_daily_rollup UNIQUE (date, event_type, client_name, tool_name, castov_version, os_family)
);

CREATE INDEX IF NOT EXISTS idx_mcp_daily_aggregates_date ON public.mcp_daily_aggregates (date DESC);

-- 3. Enable Row-Level Security
ALTER TABLE public.mcp_telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_daily_aggregates ENABLE ROW LEVEL SECURITY;

-- 4. Strict Security Policies: Only Service Role can insert & read
DROP POLICY IF EXISTS "Service role has full access to mcp_telemetry_events" ON public.mcp_telemetry_events;
CREATE POLICY "Service role has full access to mcp_telemetry_events"
    ON public.mcp_telemetry_events
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role has full access to mcp_daily_aggregates" ON public.mcp_daily_aggregates;
CREATE POLICY "Service role has full access to mcp_daily_aggregates"
    ON public.mcp_daily_aggregates
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- 5. Rollup and 90-Day Retention Cleanup Function
CREATE OR REPLACE FUNCTION public.roll_up_mcp_telemetry_daily(target_date DATE DEFAULT (CURRENT_DATE - INTERVAL '1 day')::DATE)
RETURNS TABLE(rolled_rows INTEGER, deleted_events INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r_count INTEGER := 0;
    d_count INTEGER := 0;
BEGIN
    -- Rollup raw events for target_date into mcp_daily_aggregates
    INSERT INTO public.mcp_daily_aggregates (
        date,
        event_type,
        client_name,
        tool_name,
        castov_version,
        os_family,
        total_calls,
        total_errors,
        total_duration_ms,
        unique_installs,
        updated_at
    )
    SELECT
        target_date AS date,
        event_type,
        COALESCE(client_name, 'unknown') AS client_name,
        COALESCE(tool_name, 'all') AS tool_name,
        COALESCE(castov_version, 'unknown') AS castov_version,
        COALESCE(os_family, 'unknown') AS os_family,
        SUM(call_count) AS total_calls,
        SUM(error_count) AS total_errors,
        SUM(total_duration_ms) AS total_duration_ms,
        COUNT(DISTINCT install_hash) AS unique_installs,
        timezone('utc'::text, now()) AS updated_at
    FROM public.mcp_telemetry_events
    WHERE created_at >= target_date::TIMESTAMPTZ
      AND created_at < (target_date + INTERVAL '1 day')::TIMESTAMPTZ
    GROUP BY
        event_type,
        COALESCE(client_name, 'unknown'),
        COALESCE(tool_name, 'all'),
        COALESCE(castov_version, 'unknown'),
        COALESCE(os_family, 'unknown')
    ON CONFLICT (date, event_type, client_name, tool_name, castov_version, os_family)
    DO UPDATE SET
        total_calls = EXCLUDED.total_calls,
        total_errors = EXCLUDED.total_errors,
        total_duration_ms = EXCLUDED.total_duration_ms,
        unique_installs = EXCLUDED.unique_installs,
        updated_at = timezone('utc'::text, now());

    GET DIAGNOSTICS r_count = ROW_COUNT;

    -- Delete raw events older than 90 days
    DELETE FROM public.mcp_telemetry_events
    WHERE created_at < (CURRENT_DATE - INTERVAL '90 days')::TIMESTAMPTZ;

    GET DIAGNOSTICS d_count = ROW_COUNT;

    RETURN QUERY SELECT r_count, d_count;
END;
$$;

-- 6. Schedule daily cron if pg_cron extension exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'castov_mcp_telemetry_rollup',
            '15 2 * * *', -- Daily at 02:15 UTC
            'SELECT public.roll_up_mcp_telemetry_daily();'
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Safely ignore if pg_cron is not configured in this project
        NULL;
END;
$$;
