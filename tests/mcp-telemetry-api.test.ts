import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/analytics/mcp/route";
import { GET as CRON_GET } from "@/app/api/cron/telemetry-cleanup/route";
import { GET as STATS_GET } from "@/app/api/analytics/mcp/stats/route";

const VALID_TEST_PEPPER = "test_super_secure_pepper_secret_123456789";

describe("POST /api/analytics/mcp - Hardened Ingestion API", () => {
  let prevPepper: string | undefined;

  beforeEach(() => {
    prevPepper = process.env.TELEMETRY_PEPPER;
    process.env.TELEMETRY_PEPPER = VALID_TEST_PEPPER;
  });

  afterEach(() => {
    if (prevPepper) process.env.TELEMETRY_PEPPER = prevPepper;
    else delete process.env.TELEMETRY_PEPPER;
  });

  it("FAIL CLOSED: rejects with 503 if TELEMETRY_PEPPER is missing or too short", async () => {
    delete process.env.TELEMETRY_PEPPER;

    const req = new Request("http://localhost/api/analytics/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_type: "cli_ping",
        anon_id: "11111111-2222-4333-8444-555555555555",
        command_name: "uuid",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toMatch(/missing TELEMETRY_PEPPER/i);
  });

  it("rejects oversized body (>16KB) with status 413", async () => {
    const huge = "a".repeat(17 * 1024);
    const req = new Request("http://localhost/api/analytics/mcp", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": String(huge.length) },
      body: huge,
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it("rejects invalid event_type with status 400", async () => {
    const req = new Request("http://localhost/api/analytics/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event_type: "unknown_hack_type" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("rejects invalid anon_id (non-UUID) with status 400", async () => {
    const req = new Request("http://localhost/api/analytics/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_type: "cli_ping",
        anon_id: "not-a-valid-uuid-12345",
        command_name: "uuid",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/UUID/i);
  });

  it("strictly enforces error_code allowlist and rejects unapproved error text with status 400", async () => {
    const req = new Request("http://localhost/api/analytics/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_type: "error",
        anon_id: "11111111-2222-4333-8444-555555555555",
        error_code: "RAW_LEAKED_PATH_C:/Users/secret/file.ts", // invalid freeform text
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid error_code/i);
  });

  it("accepts approved error_code from allowlist (e.g. E_TIMEOUT)", async () => {
    const req = new Request("http://localhost/api/analytics/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_type: "error",
        anon_id: "11111111-2222-4333-8444-555555555555",
        error_code: "E_TIMEOUT",
        command_name: "mcp",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("silently ignores requests from known web scrapers/bots", async () => {
    const req = new Request("http://localhost/api/analytics/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
      body: JSON.stringify({
        event_type: "cli_ping",
        anon_id: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d",
        command_name: "uuid",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.ignored).toBe("bot");
  });

  it("accepts valid tools_aggregate payload with schema conformity", async () => {
    const req = new Request("http://localhost/api/analytics/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "castov-cli/1.5.0 (linux)",
      },
      body: JSON.stringify({
        event_type: "tools_aggregate",
        anon_id: "11111111-2222-4333-8444-555555555555",
        client_name: "cursor",
        castov_version: "1.5.0",
        os_family: "linux",
        tools: [
          { tool_name: "castov_timestamp", call_count: 5, error_count: 0, total_duration_ms: 25 },
          { tool_name: "castov_port", call_count: 2, error_count: 1, total_duration_ms: 110 },
        ],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});

describe("GET /api/cron/telemetry-cleanup - Retention Endpoint", () => {
  it("rejects unauthorized requests if CRON_SECRET is missing or wrong", async () => {
    const prevSecret = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "super_secret_cron_token_123";

    try {
      const req = new Request("http://localhost/api/cron/telemetry-cleanup", {
        headers: { authorization: "Bearer wrong_token" },
      });
      const res = await CRON_GET(req);
      expect(res.status).toBe(401);
    } finally {
      if (prevSecret) process.env.CRON_SECRET = prevSecret;
      else delete process.env.CRON_SECRET;
    }
  });
});

describe("GET /api/analytics/mcp/stats - Owner-Only Telemetry Dashboard API", () => {
  it("SERVER-SIDE OWNER GUARD: returns 404 for unauthenticated or non-owner requests", async () => {
    const req = new Request("http://localhost/api/analytics/mcp/stats");
    const res = await STATS_GET(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });
});
