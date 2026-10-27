-- ==============================================================================
-- Migration: 20261027_mcp_telemetry.sql
-- Description: Privacy-Friendly Usage Analytics for Castov MCP Server and CLI
-- Enables tracking MCP adoption, unique installs, tool execution stats,
-- persistent atomic rate limiting, and daily aggregation with automated 90-day retention cleanup.
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
    error_code TEXT CHECK (error_code IS NULL OR error_code IN ('E_SYNTAX', 'E_TIMEOUT', 'E_VALIDATION', 'E_RATE_LIMIT', 'E_NOT_FOUND', 'E_INTERNAL', 'E_NETWORK', 'E_IO', 'E_TOOL_EXEC', 'E_UNKNOWN')),
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

-- 3. Persistent Serverless Rate Limiting Table
CREATE TABLE IF NOT EXISTS public.mcp_rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_mcp_rate_limits_window ON public.mcp_rate_limits (window_start);

-- 4. Enable Row-Level Security
ALTER TABLE public.mcp_telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_daily_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_rate_limits ENABLE ROW LEVEL SECURITY;

-- 5. Strict Security Policies: Only Service Role has direct access
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

DROP POLICY IF EXISTS "Service role has full access to mcp_rate_limits" ON public.mcp_rate_limits;
CREATE POLICY "Service role has full access to mcp_rate_limits"
    ON public.mcp_rate_limits
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- 6. Atomic Persistent Rate Limiter Function for Serverless Lambdas
CREATE OR REPLACE FUNCTION public.check_and_increment_mcp_rate_limit(
    p_key TEXT,
    p_limit INT DEFAULT 60,
    p_window_seconds INT DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_count INT;
    v_window_start TIMESTAMPTZ;
BEGIN
    SELECT count, window_start INTO v_count, v_window_start
    FROM public.mcp_rate_limits
    WHERE key = p_key
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.mcp_rate_limits (key, count, window_start)
        VALUES (p_key, 1, v_now)
        ON CONFLICT (key) DO UPDATE
        SET count = 1, window_start = v_now;
        RETURN TRUE;
    END IF;

    IF v_now - v_window_start > (p_window_seconds || ' seconds')::INTERVAL THEN
        UPDATE public.mcp_rate_limits
        SET count = 1, window_start = v_now
        WHERE key = p_key;
        RETURN TRUE;
    END IF;

    IF v_count >= p_limit THEN
        RETURN FALSE;
    END IF;

    UPDATE public.mcp_rate_limits
    SET count = count + 1
    WHERE key = p_key;
    RETURN TRUE;
END;
$$;

-- 7. Rollup and 90-Day Retention Cleanup Function
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

    -- Clean stale rate limit keys older than 1 hour
    DELETE FROM public.mcp_rate_limits
    WHERE window_start < (timezone('utc'::text, now()) - INTERVAL '1 hour');

    RETURN QUERY SELECT r_count, d_count;
END;
$$;
