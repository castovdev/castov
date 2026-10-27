import { NextResponse } from "next/server";
import crypto from "crypto";
import { getClientIp } from "@/lib/rate-limiter";
import { createAdminClient } from "@/utils/supabase/admin";

const MAX_BODY_BYTES = 16 * 1024; // 16 KB
const PEPPER_SECRET =
  process.env.TELEMETRY_PEPPER ||
  process.env.SECRET_VAULT_KEY ||
  "castov_mcp_pepper_2026_default_salt";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAFE_STRING_REGEX = /^[a-zA-Z0-9_\-\. /]+$/;
const TOOL_NAME_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

const ALLOWED_EVENT_TYPES = new Set(["initialize", "tools_aggregate", "cli_ping", "error"]);
const ALLOWED_OS_FAMILIES = new Set(["darwin", "win32", "linux", "other"]);

// Known bots regex
const BOT_USER_AGENT_REGEX =
  /googlebot|bingbot|yandex|duckduckbot|baiduspider|petalbot|semrush|ahrefs|mj12bot|dotbot|screaming\s*frog/i;

// In-memory rate limiting map for install_hash and IP
interface RateLimitEntry {
  timestamps: number[];
}
const MCP_RATE_LIMIT = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  let entry = MCP_RATE_LIMIT.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    MCP_RATE_LIMIT.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (entry.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  entry.timestamps.push(now);

  // Periodic eviction
  if (MCP_RATE_LIMIT.size > 5000) {
    for (const [k, v] of MCP_RATE_LIMIT.entries()) {
      v.timestamps = v.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (v.timestamps.length === 0) MCP_RATE_LIMIT.delete(k);
    }
  }

  return false;
}

function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function getDailySalt(): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  return sha256(`${PEPPER_SECRET}:${today}`);
}

interface ToolAggregateItem {
  tool_name: string;
  call_count: number;
  error_count: number;
  total_duration_ms: number;
}

export async function POST(request: Request) {
  try {
    // 1. Content-Length Guard
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
    }

    const rawText = await request.text();
    if (rawText.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
    }

    let body: any;
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ ok: false, error: "Invalid payload body" }, { status: 400 });
    }

    // 2. Strict Schema Validation
    const {
      event_type,
      anon_id,
      client_name,
      client_version,
      castov_version,
      os_family,
      node_version,
      command_name,
      session_id,
      tool_name,
      duration_ms,
      success,
      tools,
    } = body;

    if (!event_type || typeof event_type !== "string" || !ALLOWED_EVENT_TYPES.has(event_type)) {
      return NextResponse.json({ ok: false, error: "Invalid or unsupported event_type" }, { status: 400 });
    }

    // Validate anon_id format if provided
    if (anon_id !== undefined && anon_id !== null) {
      if (typeof anon_id !== "string" || !UUID_REGEX.test(anon_id)) {
        return NextResponse.json({ ok: false, error: "Invalid anon_id format (must be UUID)" }, { status: 400 });
      }
    }

    // Validate string fields length and charset
    const validateField = (name: string, val: unknown, maxLen: number) => {
      if (val === undefined || val === null) return true;
      if (typeof val !== "string" || val.length > maxLen || !SAFE_STRING_REGEX.test(val)) {
        return false;
      }
      return true;
    };

    if (!validateField("client_name", client_name, 64)) {
      return NextResponse.json({ ok: false, error: "Invalid client_name" }, { status: 400 });
    }
    if (!validateField("client_version", client_version, 32)) {
      return NextResponse.json({ ok: false, error: "Invalid client_version" }, { status: 400 });
    }
    if (!validateField("castov_version", castov_version, 32)) {
      return NextResponse.json({ ok: false, error: "Invalid castov_version" }, { status: 400 });
    }
    if (!validateField("node_version", node_version, 32)) {
      return NextResponse.json({ ok: false, error: "Invalid node_version" }, { status: 400 });
    }
    if (!validateField("command_name", command_name, 32)) {
      return NextResponse.json({ ok: false, error: "Invalid command_name" }, { status: 400 });
    }
    if (!validateField("session_id", session_id, 64)) {
      return NextResponse.json({ ok: false, error: "Invalid session_id" }, { status: 400 });
    }

    let sanitizedOs: string = "other";
    if (typeof os_family === "string" && ALLOWED_OS_FAMILIES.has(os_family.toLowerCase())) {
      sanitizedOs = os_family.toLowerCase();
    }

    // Validate tools array for 'tools_aggregate'
    const validatedTools: ToolAggregateItem[] = [];
    if (event_type === "tools_aggregate") {
      if (!Array.isArray(tools) || tools.length === 0 || tools.length > 50) {
        return NextResponse.json({ ok: false, error: "Invalid tools array in tools_aggregate" }, { status: 400 });
      }
      for (const t of tools) {
        if (!t || typeof t !== "object") {
          return NextResponse.json({ ok: false, error: "Malformed tool aggregate item" }, { status: 400 });
        }
        if (typeof t.tool_name !== "string" || !TOOL_NAME_REGEX.test(t.tool_name)) {
          return NextResponse.json({ ok: false, error: "Invalid tool_name in aggregate" }, { status: 400 });
        }
        const callCount = Number(t.call_count);
        const errorCount = Number(t.error_count ?? 0);
        const duration = Number(t.total_duration_ms ?? 0);

        if (!Number.isInteger(callCount) || callCount < 1 || callCount > 1_000_000) {
          return NextResponse.json({ ok: false, error: "Invalid call_count in aggregate" }, { status: 400 });
        }
        if (!Number.isInteger(errorCount) || errorCount < 0 || errorCount > callCount) {
          return NextResponse.json({ ok: false, error: "Invalid error_count in aggregate" }, { status: 400 });
        }
        if (!Number.isInteger(duration) || duration < 0 || duration > 100_000_000) {
          return NextResponse.json({ ok: false, error: "Invalid total_duration_ms in aggregate" }, { status: 400 });
        }

        validatedTools.push({
          tool_name: t.tool_name,
          call_count: callCount,
          error_count: errorCount,
          total_duration_ms: duration,
        });
      }
    }

    // 3. Client IP & Bot Filtering
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "";

    if (BOT_USER_AGENT_REGEX.test(userAgent)) {
      // Silently ignore bots without erroring
      return NextResponse.json({ ok: true, ignored: "bot" });
    }

    // 4. Owner & Internal Traffic Exclusion (env-configurable)
    const excludedIps = (process.env.TELEMETRY_EXCLUDE_IPS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (excludedIps.includes(clientIp.toLowerCase())) {
      return NextResponse.json({ ok: true, ignored: "excluded_ip" });
    }

    // 5. Identity & Cryptographic Hashing
    // install_hash = SHA-256(anon_id + server_pepper)
    const installHash = anon_id ? sha256(`${anon_id}:${PEPPER_SECRET}`) : null;

    if (installHash) {
      const excludedHashes = (process.env.TELEMETRY_EXCLUDE_INSTALL_HASHES || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      if (excludedHashes.includes(installHash.toLowerCase())) {
        return NextResponse.json({ ok: true, ignored: "excluded_install" });
      }
    }

    // visitor_hash = SHA-256(IP + User-Agent + daily_rotating_salt)
    const visitorHash = sha256(`${clientIp}:${userAgent}:${getDailySalt()}`);
    const sessionIdHash = session_id ? sha256(String(session_id)) : null;

    // 6. Rate Limiting per IP & per install_hash
    if (isRateLimited(`ip:${clientIp}`)) {
      return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
    }
    if (installHash && isRateLimited(`install:${installHash}`)) {
      return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
    }

    // 7. Insert Into Database (Never trust client timestamps, use server now())
    try {
      const supabase = createAdminClient();

      if (event_type === "tools_aggregate") {
        const rowsToInsert = validatedTools.map((t) => ({
          event_type: "tools_aggregate",
          install_hash: installHash,
          visitor_hash: visitorHash,
          client_name: client_name || "unknown",
          client_version: client_version || null,
          tool_name: t.tool_name,
          castov_version: castov_version || "1.5.0",
          os_family: sanitizedOs,
          node_version: node_version || null,
          command_name: command_name || "mcp",
          session_id_hash: sessionIdHash,
          call_count: t.call_count,
          error_count: t.error_count,
          total_duration_ms: t.total_duration_ms,
          success: t.error_count === 0,
        }));

        const { error: dbError } = await supabase.from("mcp_telemetry_events").insert(rowsToInsert);
        if (dbError) {
          console.warn("mcp_telemetry_events insert error:", dbError.message);
        }
      } else {
        const singleRow = {
          event_type,
          install_hash: installHash,
          visitor_hash: visitorHash,
          client_name: client_name || null,
          client_version: client_version || null,
          tool_name: typeof tool_name === "string" && TOOL_NAME_REGEX.test(tool_name) ? tool_name : null,
          castov_version: castov_version || "1.5.0",
          os_family: sanitizedOs,
          node_version: node_version || null,
          command_name: command_name || null,
          session_id_hash: sessionIdHash,
          call_count: 1,
          error_count: success === false ? 1 : 0,
          total_duration_ms: typeof duration_ms === "number" && duration_ms >= 0 ? Math.min(duration_ms, 100_000_000) : 0,
          success: success !== false,
        };

        const { error: dbError } = await supabase.from("mcp_telemetry_events").insert(singleRow);
        if (dbError) {
          console.warn("mcp_telemetry_events insert error:", dbError.message);
        }
      }
    } catch (dbErr: any) {
      console.warn("mcp_telemetry_events database catch error:", dbErr?.message || dbErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
