import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let cliVersion = "1.5.0";
try {
  const pkg = require("../package.json") as { version: string };
  if (pkg?.version) cliVersion = pkg.version;
} catch {
  // fallback to default
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FLUSH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const PING_TIMEOUT_MS = 1500; // 1.5 seconds

export function isTelemetryDisabled(): boolean {
  if (process.env.CASTOV_TELEMETRY === "0") return true;
  if (process.env.DO_NOT_TRACK === "1") return true;
  const ci = process.env.CI;
  if (ci !== undefined && ci !== "" && ci !== "0" && ci !== "false") return true;
  return false;
}

function getCastovDir(): string {
  const custom = process.env.CASTOV_CONFIG_DIR;
  if (custom) return custom;
  return join(homedir(), ".castov");
}

function getAnonIdPath(): string {
  return join(getCastovDir(), "anon-id");
}

/**
 * Returns the persistent anonymous install ID (~/.castov/anon-id).
 * Returns null if telemetry is disabled. Never collects machine name or usernames.
 */
export function getAnonId(): string | null {
  if (isTelemetryDisabled()) return null;

  try {
    const filePath = getAnonIdPath();
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, "utf8").trim();
      if (UUID_REGEX.test(content)) {
        return content;
      }
    }

    // Generate new random UUID v4
    const dir = getCastovDir();
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
    const newId = randomUUID();
    writeFileSync(filePath, newId, { mode: 0o600 });
    return newId;
  } catch {
    return null;
  }
}

export function getOsFamily(): "darwin" | "win32" | "linux" | "other" {
  const p = process.platform;
  if (p === "darwin" || p === "win32" || p === "linux") return p;
  return "other";
}

interface ToolAggregateStats {
  calls: number;
  errors: number;
  totalDurationMs: number;
}

export class TelemetryClient {
  private sessionId = randomUUID();
  private toolAggregates = new Map<string, ToolAggregateStats>();
  private flushTimer: NodeJS.Timeout | null = null;
  private endpoint: string;
  private disabled: boolean;
  private cleanedUp = false;

  constructor(endpoint?: string) {
    this.endpoint =
      endpoint ||
      process.env.CASTOV_TELEMETRY_URL ||
      "https://castov.com/api/analytics/mcp";
    this.disabled = isTelemetryDisabled();

    if (!this.disabled) {
      // Periodic flush once per hour (unref'd to avoid keeping process alive)
      this.flushTimer = setInterval(() => {
        this.flushToolAggregates().catch(() => {});
      }, FLUSH_INTERVAL_MS);
      if (typeof this.flushTimer.unref === "function") {
        this.flushTimer.unref();
      }

      // Auto-flush on clean process exit
      const exitHandler = () => {
        this.destroy();
      };
      process.once("beforeExit", exitHandler);
    }
  }

  private async postJson(payload: Record<string, unknown>): Promise<void> {
    if (this.disabled) return;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
      if (typeof timer.unref === "function") timer.unref();

      await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": `castov-cli/${cliVersion} (${process.platform})`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).catch(() => {
        // Silent failure: NEVER write to stdout or stderr
      });

      clearTimeout(timer);
    } catch {
      // Silent failure
    }
  }

  /**
   * Track one MCP session initialize event
   */
  public trackMcpInitialize(clientInfo?: { name?: string; version?: string }): void {
    if (this.disabled) return;

    const anonId = getAnonId();
    const payload = {
      event_type: "initialize",
      anon_id: anonId,
      session_id: this.sessionId,
      client_name: clientInfo?.name?.slice(0, 64) || "unknown",
      client_version: clientInfo?.version?.slice(0, 32) || undefined,
      castov_version: cliVersion,
      os_family: getOsFamily(),
      node_version: process.version?.slice(0, 32),
      command_name: "mcp",
    };

    // Fire and forget
    this.postJson(payload).catch(() => {});
  }

  /**
   * Record tool call in-memory (batched, flushed at most once per hour or on exit)
   */
  public recordToolCall(toolName: string, durationMs: number, success: boolean): void {
    if (this.disabled) return;

    const safeName = toolName.slice(0, 64);
    const existing = this.toolAggregates.get(safeName) || {
      calls: 0,
      errors: 0,
      totalDurationMs: 0,
    };

    existing.calls += 1;
    if (!success) existing.errors += 1;
    existing.totalDurationMs += Math.max(0, durationMs);

    this.toolAggregates.set(safeName, existing);
  }

  /**
   * Flush in-memory tool aggregates
   */
  public async flushToolAggregates(): Promise<void> {
    if (this.disabled || this.toolAggregates.size === 0) return;

    const tools = Array.from(this.toolAggregates.entries()).map(([tool_name, s]) => ({
      tool_name,
      call_count: s.calls,
      error_count: s.errors,
      total_duration_ms: Math.round(s.totalDurationMs),
    }));

    // Clear local map immediately
    this.toolAggregates.clear();

    const anonId = getAnonId();
    const payload = {
      event_type: "tools_aggregate",
      anon_id: anonId,
      session_id: this.sessionId,
      castov_version: cliVersion,
      os_family: getOsFamily(),
      node_version: process.version?.slice(0, 32),
      command_name: "mcp",
      tools,
    };

    await this.postJson(payload);
  }

  /**
   * Track a single CLI command run (non-MCP)
   */
  public trackCliPing(commandName: string): void {
    if (this.disabled) return;

    const anonId = getAnonId();
    const payload = {
      event_type: "cli_ping",
      anon_id: anonId,
      castov_version: cliVersion,
      os_family: getOsFamily(),
      node_version: process.version?.slice(0, 32),
      command_name: commandName.slice(0, 32),
    };

    this.postJson(payload).catch(() => {});
  }

  public destroy(): void {
    if (this.cleanedUp) return;
    this.cleanedUp = true;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    // Flush remaining tool metrics
    if (this.toolAggregates.size > 0) {
      this.flushToolAggregates().catch(() => {});
    }
  }
}

let globalClient: TelemetryClient | null = null;

export function getTelemetry(endpoint?: string): TelemetryClient {
  if (!globalClient) {
    globalClient = new TelemetryClient(endpoint);
  }
  return globalClient;
}
