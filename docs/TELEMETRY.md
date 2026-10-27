# Castov Telemetry — Deployment Checklist

Privacy-friendly usage analytics for the Castov MCP server and CLI.
See `packages/castov-cli/README.md#telemetry` for what is (and is never) collected.

## 1. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Required | Purpose | If missing |
| --- | --- | --- | --- |
| `TELEMETRY_PEPPER` | Yes | Server-side secret (≥16 chars) used for `install_hash = SHA-256(anon_id + pepper)` and the daily visitor salt. | `POST /api/analytics/mcp` returns **503** (fail closed). |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service-role key for writing/reading telemetry tables. Server-only. | Ingestion, stats and cron return **503** and log a server-side error. No anon-key fallback. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. | Same as above (**503**). |
| `CRON_SECRET` | Yes | Bearer token Vercel Cron sends to `/api/cron/telemetry-cleanup`. | Cron endpoint returns **401** (fail closed). |
| `ADMIN_EMAIL` | Yes | Owner email for the private dashboard. Must match a **verified** Supabase session email (case-insensitive). | Stats API returns **404** for everyone. |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Optional | UI hint only: shows the "Admin Analytics" tab. Authorization is always enforced server-side. | Tab is hidden for everyone. |
| `TELEMETRY_EXCLUDE_IPS` | Optional | Comma-separated IPs to ignore (e.g. your own). | Nothing excluded. |
| `TELEMETRY_EXCLUDE_INSTALL_HASHES` | Optional | Comma-separated `install_hash` values to ignore. | Nothing excluded. |

Generate secrets locally, e.g. `npx castov secret`. Never commit real values.

## 2. Apply the database migration

1. Open Supabase Dashboard → your project → **SQL Editor** → **New query**.
2. Paste the full contents of `supabase/migrations/20261027_mcp_telemetry.sql` and click **Run**.
3. Verify the tables exist: `mcp_telemetry_events`, `mcp_daily_aggregates`, `mcp_rate_limits`.

## 3. Manual security check: RPCs are denied to anon/authenticated

Run with the **anon** (publishable) key — both calls must fail with a permission error (`42501` / "permission denied for function"):

```bash
curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/check_and_increment_mcp_rate_limit" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" -d '{"p_key":"probe"}'

curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/roll_up_mcp_telemetry_daily" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" -d '{}'
```

Also in SQL Editor (should return `false` for anon and authenticated, `true` for service_role):

```sql
SELECT r.rolname,
       has_function_privilege(r.rolname, 'public.check_and_increment_mcp_rate_limit(text,int,int)', 'EXECUTE') AS rate_limit,
       has_function_privilege(r.rolname, 'public.roll_up_mcp_telemetry_daily(date)', 'EXECUTE') AS rollup
FROM pg_roles r WHERE r.rolname IN ('anon', 'authenticated', 'service_role');
```

## 4. Cron

`vercel.json` schedules `GET /api/cron/telemetry-cleanup` daily at 02:00 UTC. It rolls raw events into `mcp_daily_aggregates`, deletes raw events older than 90 days, and prunes stale rate-limit keys.

## 5. Smoke test after deploy

- `POST /api/analytics/mcp` with `{"event_type":"cli_ping","command_name":"uuid"}` → `200 {"ok":true}`.
- `GET /api/analytics/mcp/stats` while logged out → `404`.
- Server logs should **not** show `IN-MEMORY fallback` warnings in steady state (that means the persistent rate limiter RPC is failing).
