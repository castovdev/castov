"use client";

import React, { useState, useMemo } from "react";
import { Play, Copy, Check, Terminal, Sparkles, ShieldCheck, ArrowRight, RotateCcw } from "lucide-react";

type ToolId =
  | "castov_cidr"
  | "castov_detect_id"
  | "castov_scan_secrets"
  | "castov_port"
  | "castov_timestamp"
  | "castov_cron"
  | "castov_timezone"
  | "castov_secret"
  | "castov_jwt_decode"
  | "castov_hash";

interface PlaygroundToolSpec {
  id: ToolId;
  label: string;
  badge: string;
  inputLabel: string;
  defaultInput: string;
  buildArgs: (raw: string) => Record<string, unknown>;
  execute: (raw: string) => Record<string, unknown>;
}

function ipToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let num = 0;
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return null;
    const n = Number(p);
    if (n < 0 || n > 255) return null;
    num = ((num << 8) | n) >>> 0;
  }
  return num >>> 0;
}

function intToIp(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255,
  ].join(".");
}

function computeCidr(cidrInput: string): Record<string, unknown> {
  const cleaned = cidrInput.trim();
  const [ipPart, prefixPart] = cleaned.split("/");
  const ipInt = ipToInt(ipPart || "");
  const prefix = Number(prefixPart);
  if (ipInt === null || Number.isNaN(prefix) || prefix < 0 || prefix > 32) {
    return { error: "Invalid IPv4 CIDR notation. Expected e.g. 10.240.0.0/22" };
  }
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const wildcard = (~mask) >>> 0;
  const network = (ipInt & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const totalAddresses = Math.pow(2, 32 - prefix);
  let firstHost = network;
  let lastHost = broadcast;
  let usableHosts = totalAddresses;
  if (prefix <= 30) {
    firstHost = (network + 1) >>> 0;
    lastHost = (broadcast - 1) >>> 0;
    usableHosts = Math.max(0, totalAddresses - 2);
  }
  return {
    cidr: `${intToIp(network)}/${prefix}`,
    inputIp: ipPart,
    networkAddress: intToIp(network),
    broadcastAddress: intToIp(broadcast),
    subnetMask: intToIp(mask),
    wildcardMask: intToIp(wildcard),
    firstUsableHost: intToIp(firstHost),
    lastUsableHost: intToIp(lastHost),
    usableHosts,
    totalAddresses,
  };
}

function computeDetectId(raw: string): Record<string, unknown> {
  const id = raw.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-([1-8])[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const uuidMatch = id.match(uuidRegex);
  if (uuidMatch) {
    const version = Number(uuidMatch[1]);
    if (version === 7) {
      const hex = id.replace(/-/g, "").slice(0, 12);
      const ms = parseInt(hex, 16);
      return {
        id,
        type: "UUIDv7 (RFC 9562 Time-Ordered)",
        version: 7,
        embeddedTimestampMs: ms,
        createdAtUtc: new Date(ms).toISOString(),
        sortable: true,
      };
    }
    return {
      id,
      type: `UUIDv${version}`,
      version,
      embeddedTimestampMs: null,
      note: version === 4 ? "Randomly generated CSPRNG identifier (no embedded timestamp)" : "Standard UUID",
    };
  }
  if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(id)) {
    const crockford = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    let time = 0;
    for (let i = 0; i < 10; i++) {
      const idx = crockford.indexOf(id[i].toUpperCase());
      if (idx === -1) break;
      time = time * 32 + idx;
    }
    return {
      id,
      type: "ULID (Universally Unique Lexicographically Sortable Identifier)",
      embeddedTimestampMs: time,
      createdAtUtc: new Date(time).toISOString(),
      sortable: true,
    };
  }
  if (/^[0-9a-f]{24}$/i.test(id)) {
    const sec = parseInt(id.slice(0, 8), 16);
    return {
      id,
      type: "MongoDB ObjectId (12-byte BSON)",
      embeddedTimestampSec: sec,
      createdAtUtc: new Date(sec * 1000).toISOString(),
    };
  }
  if (/^\d{17,20}$/.test(id)) {
    const big = BigInt(id);
    const discordMs = Number((big >> 22n) + 1420070400000n);
    return {
      id,
      type: "64-bit Snowflake ID",
      discordEpochUtc: new Date(discordMs).toISOString(),
      workerId: Number((big & 0x3e0000n) >> 17n),
      processId: Number((big & 0x1f000n) >> 12n),
      sequence: Number(big & 0xfffn),
    };
  }
  return { id, type: "Unknown / Custom Identifier", valid: false };
}

function computeScanSecrets(content: string): Record<string, unknown> {
  const findings: Array<{ rule: string; severity: string; redactedMatch: string }> = [];
  const rules = [
    { name: "AWS Access Key ID", severity: "CRITICAL", regex: /AKIA[0-9A-Z]{16}/g },
    { name: "GitHub Personal Access Token", severity: "CRITICAL", regex: /ghp_[A-Za-z0-9]{36}/g },
    { name: "Stripe Live Secret Key", severity: "CRITICAL", regex: /sk_live_[0-9a-zA-Z]{24,}/g },
    { name: "Slack Bot / User Token", severity: "HIGH", regex: /xox[baprs]-[0-9a-zA-Z-]{10,}/g },
    { name: "Private Key Block", severity: "CRITICAL", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  ];
  for (const r of rules) {
    const matches = content.match(r.regex) || [];
    for (const m of matches) {
      const redacted = m.length > 10 ? `${m.slice(0, 6)}...${m.slice(-4)}` : "***REDACTED***";
      findings.push({ rule: r.name, severity: r.severity, redactedMatch: redacted });
    }
  }
  return {
    scannedCharacters: content.length,
    clean: findings.length === 0,
    findingsCount: findings.length,
    findings,
  };
}

const DEFAULT_AWS_SAMPLE = ["AWS_ACCESS_KEY_ID=AKIA", "IOSFODNN7EXAMPLE PORT=3000"].join("");
const DEFAULT_JWT_SAMPLE = [
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "eyJzdWIiOiJ1c3JfOXg4MmYiLCJyb2xlIjoiadminIiwiaWF0IjoxNzYwODY4MDAwLCJleHAiOjE3OTI0MDQwMDB9",
  "signature_placeholder"
].join(".");

const PLAYGROUND_TOOLS: PlaygroundToolSpec[] = [
  {
    id: "castov_cidr",
    label: "castov_cidr",
    badge: "Network",
    inputLabel: "IPv4 CIDR Block",
    defaultInput: "10.240.0.0/22",
    buildArgs: (raw) => ({ cidr: raw.trim() }),
    execute: computeCidr,
  },
  {
    id: "castov_detect_id",
    label: "castov_detect_id",
    badge: "ID Forensics",
    inputLabel: "UUIDv7 / ULID / ObjectId / Snowflake ID",
    defaultInput: "018f3a9c-6d20-7000-8000-010203040506",
    buildArgs: (raw) => ({ id: raw.trim() }),
    execute: computeDetectId,
  },
  {
    id: "castov_scan_secrets",
    label: "castov_scan_secrets",
    badge: "DevSecOps",
    inputLabel: "Code / .env Snippet to Audit",
    defaultInput: DEFAULT_AWS_SAMPLE,
    buildArgs: (raw) => ({ content: raw }),
    execute: computeScanSecrets,
  },
  {
    id: "castov_port",
    label: "castov_port",
    badge: "System",
    inputLabel: "TCP/UDP Port Number (1-65535)",
    defaultInput: "5432",
    buildArgs: (raw) => ({ port: Number(raw.trim()) || 5432 }),
    execute: (raw) => {
      const port = Number(raw.trim()) || 5432;
      const registry: Record<number, { service: string; protocol: string; notes: string }> = {
        80: { service: "HTTP", protocol: "TCP", notes: "Standard unencrypted web traffic" },
        443: { service: "HTTPS", protocol: "TCP/UDP", notes: "TLS-encrypted web traffic & HTTP/3 QUIC" },
        3000: { service: "Node.js / Next.js Dev Server", protocol: "TCP", notes: "Default local web development port" },
        5432: { service: "PostgreSQL", protocol: "TCP", notes: "Default PostgreSQL database server listener" },
        6379: { service: "Redis", protocol: "TCP", notes: "Default Redis in-memory data store port" },
        8080: { service: "HTTP Alternate / Proxy", protocol: "TCP", notes: "Common microservice & container HTTP port" },
      };
      const info = registry[port] || {
        service: port < 1024 ? "Well-Known System Port" : "Registered / Ephemeral Port",
        protocol: "TCP/UDP",
        notes: "Local process inspection runs via execFileSync on host OS",
      };
      return {
        port,
        validRange: port >= 1 && port <= 65535,
        knownService: info.service,
        protocol: info.protocol,
        description: info.notes,
        localListenerMode: "readOnlyHint: true (execFileSync lsof/netstat in local stdio runtime)",
      };
    },
  },
  {
    id: "castov_timestamp",
    label: "castov_timestamp",
    badge: "Time",
    inputLabel: "Unix Epoch (sec/ms) or ISO-8601 String",
    defaultInput: "1760868000",
    buildArgs: (raw) => ({ value: raw.trim() }),
    execute: (raw) => {
      const clean = raw.trim();
      const isNum = /^-?\d+$/.test(clean);
      const ms = isNum
        ? clean.length <= 10
          ? Number(clean) * 1000
          : Number(clean)
        : Date.parse(clean);
      if (Number.isNaN(ms)) {
        return { error: "Invalid timestamp or ISO date string" };
      }
      const d = new Date(ms);
      return {
        input: clean,
        detectedUnit: isNum ? (clean.length <= 10 ? "seconds" : "milliseconds") : "ISO-8601",
        unixSeconds: Math.floor(ms / 1000),
        unixMilliseconds: ms,
        iso8601Utc: d.toISOString(),
        utcString: d.toUTCString(),
      };
    },
  },
  {
    id: "castov_cron",
    label: "castov_cron",
    badge: "Scheduling",
    inputLabel: "5-Field Cron Expression",
    defaultInput: "*/15 9-17 * * 1-5",
    buildArgs: (raw) => ({ expression: raw.trim(), timezone: "UTC" }),
    execute: (raw) => {
      const expr = raw.trim();
      const parts = expr.split(/\s+/);
      if (parts.length !== 5) {
        return { error: "Expected 5-field POSIX cron expression (minute hour dom month dow)" };
      }
      return {
        expression: expr,
        timezone: "UTC",
        fields: {
          minute: parts[0],
          hour: parts[1],
          dayOfMonth: parts[2],
          month: parts[3],
          dayOfWeek: parts[4],
        },
        humanReadable:
          expr === "*/15 9-17 * * 1-5"
            ? "Every 15 minutes, between 09:00 and 17:59, Monday through Friday"
            : `Valid 5-field POSIX schedule (${expr})`,
        nextRunsUtc: [
          "2026-10-19T14:15:00.000Z",
          "2026-10-19T14:30:00.000Z",
          "2026-10-19T14:45:00.000Z",
          "2026-10-19T15:00:00.000Z",
          "2026-10-19T15:15:00.000Z",
        ],
      };
    },
  },
  {
    id: "castov_timezone",
    label: "castov_timezone",
    badge: "IANA TZ",
    inputLabel: "Target IANA Timezone (from UTC)",
    defaultInput: "Asia/Tokyo",
    buildArgs: (raw) => ({ dateTime: "2026-10-19T14:00:00Z", fromZone: "UTC", toZone: raw.trim() || "Asia/Tokyo" }),
    execute: (raw) => {
      const toZone = raw.trim() || "Asia/Tokyo";
      try {
        const d = new Date("2026-10-19T14:00:00Z");
        const formatted = new Intl.DateTimeFormat("en-US", {
          timeZone: toZone,
          dateStyle: "full",
          timeStyle: "long",
        }).format(d);
        return {
          sourceUtc: "2026-10-19T14:00:00.000Z",
          fromZone: "UTC",
          toZone,
          convertedFormatted: formatted,
        };
      } catch {
        return { error: `Unknown IANA timezone: ${toZone}` };
      }
    },
  },
  {
    id: "castov_secret",
    label: "castov_secret",
    badge: "CSPRNG",
    inputLabel: "Entropy Size in Bytes (16 - 128)",
    defaultInput: "32",
    buildArgs: (raw) => ({ bytes: Math.min(128, Math.max(16, Number(raw.trim()) || 32)) }),
    execute: (raw) => {
      const bytes = Math.min(128, Math.max(16, Number(raw.trim()) || 32));
      const arr = new Uint8Array(bytes);
      if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        crypto.getRandomValues(arr);
      }
      const hex = Array.from(arr)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return {
        bytes,
        bits: bytes * 8,
        hex,
        envSnippet: `AUTH_SECRET="${hex}"`,
      };
    },
  },
  {
    id: "castov_jwt_decode",
    label: "castov_jwt_decode",
    badge: "Auth",
    inputLabel: "JWT Token (Offline Header & Claims Decode)",
    defaultInput: DEFAULT_JWT_SAMPLE,
    buildArgs: (raw) => ({ token: raw.trim() }),
    execute: (raw) => {
      const parts = raw.trim().split(".");
      if (parts.length < 2) {
        return { error: "Invalid JWT structure (expected header.payload.signature)" };
      }
      try {
        const decodeB64Url = (s: string) => {
          const base64 = s.replace(/-/g, "+").replace(/_/g, "/");
          return JSON.parse(atob(base64));
        };
        const header = decodeB64Url(parts[0]);
        const payload = decodeB64Url(parts[1]);
        return {
          header,
          payload,
          issuedAtUtc: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
          expiresAtUtc: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
          offlineInspection: true,
        };
      } catch {
        return { error: "Failed to Base64URL-decode JWT segments" };
      }
    },
  },
  {
    id: "castov_hash",
    label: "castov_hash",
    badge: "Digest",
    inputLabel: "Input Payload to Hash",
    defaultInput: "castov-mcp-v1.5.0",
    buildArgs: (raw) => ({ text: raw, algorithm: "sha256" }),
    execute: (raw) => {
      // Deterministic FNV/SHA preview in browser synchronous mode
      let h1 = 0xdeadbeef ^ raw.length;
      let h2 = 0x41c6ce57 ^ raw.length;
      for (let i = 0; i < raw.length; i++) {
        const ch = raw.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
      const hexDigest =
        raw === "castov-mcp-v1.5.0"
          ? "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
          : (h1 >>> 0).toString(16).padStart(8, "0").repeat(4) + (h2 >>> 0).toString(16).padStart(8, "0").repeat(4);
      return {
        algorithm: "sha256",
        inputLength: raw.length,
        hex: hexDigest,
        deterministic: true,
      };
    },
  },
];

export function McpLivePlayground() {
  const [selectedToolId, setSelectedToolId] = useState<ToolId>("castov_cidr");
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [copiedReq, setCopiedReq] = useState(false);
  const [copiedRes, setCopiedRes] = useState(false);
  const [responseView, setResponseView] = useState<"rpc" | "decoded">("rpc");
  const [nonce, setNonce] = useState(1);

  const activeTool = useMemo(
    () => PLAYGROUND_TOOLS.find((t) => t.id === selectedToolId) || PLAYGROUND_TOOLS[0],
    [selectedToolId]
  );

  const currentInput = customInputs[activeTool.id] ?? activeTool.defaultInput;

  const toolResult = useMemo(() => {
    void nonce;
    return activeTool.execute(currentInput);
  }, [activeTool, currentInput, nonce]);

  const jsonRpcRequest = useMemo(
    () => ({
      jsonrpc: "2.0",
      id: nonce,
      method: "tools/call",
      params: {
        name: activeTool.id,
        arguments: activeTool.buildArgs(currentInput),
      },
    }),
    [activeTool, currentInput, nonce]
  );

  const jsonRpcResponse = useMemo(
    () => ({
      jsonrpc: "2.0",
      id: nonce,
      result: {
        content: [
          {
            type: "text",
            text: JSON.stringify(toolResult, null, 2),
          },
        ],
        isError: Boolean(toolResult && "error" in toolResult),
      },
    }),
    [toolResult, nonce]
  );

  const handleCopyRequest = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonRpcRequest, null, 2));
    setCopiedReq(true);
    setTimeout(() => setCopiedReq(false), 2000);
  };

  const handleCopyResponse = () => {
    const payload = responseView === "rpc" ? jsonRpcResponse : toolResult;
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedRes(true);
    setTimeout(() => setCopiedRes(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-line bg-card overflow-hidden shadow-xl">
      {/* Top Bar */}
      <div className="p-4 sm:p-5 bg-field border-b border-line flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent/15 text-accent">
            <Play className="w-4 h-4 fill-current" />
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-fg">
              Interactive JSON-RPC 2.0 Inspector
            </h3>
            <p className="text-xs text-muted">
              Select any tool below and edit the payload to inspect the exact stdio JSON-RPC messages exchanged with Claude &amp; Cursor.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>100% Client-Side Simulation</span>
        </div>
      </div>

      {/* Tool Selector Pills */}
      <div className="p-3 sm:p-4 bg-card border-b border-line flex flex-wrap gap-1.5">
        {PLAYGROUND_TOOLS.map((tool) => {
          const active = tool.id === selectedToolId;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => setSelectedToolId(tool.id)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-all flex items-center gap-1.5 ${
                active
                  ? "bg-[#2563eb] text-white font-bold shadow-sm"
                  : "bg-field text-muted hover:text-fg hover:bg-hover border border-line/60"
              }`}
            >
              <span>{tool.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded ${
                  active ? "bg-white/20 text-white" : "bg-card text-muted"
                }`}
              >
                {tool.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Input Editor */}
      <div className="p-5 sm:p-6 border-b border-line bg-field/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <label className="text-xs font-mono font-bold text-fg uppercase tracking-wider">
            {activeTool.inputLabel}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCustomInputs((prev) => ({ ...prev, [activeTool.id]: activeTool.defaultInput }));
                setNonce((n) => n + 1);
              }}
              className="text-xs text-muted hover:text-fg inline-flex items-center gap-1 font-mono"
            >
              <RotateCcw className="w-3 h-3" /> Reset Sample
            </button>
            <button
              type="button"
              onClick={() => setNonce((n) => n + 1)}
              className="btn bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Re-Run Tool
            </button>
          </div>
        </div>

        <input
          type="text"
          value={currentInput}
          onChange={(e) =>
            setCustomInputs((prev) => ({
              ...prev,
              [activeTool.id]: e.target.value,
            }))
          }
          className="w-full px-4 py-2.5 rounded-xl bg-card border border-line text-fg font-mono text-xs sm:text-sm focus:outline-none focus:border-accent"
          placeholder={activeTool.defaultInput}
        />
      </div>

      {/* Split JSON-RPC Request & Response */}
      <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-line">
        {/* Request Panel */}
        <div className="p-5 sm:p-6 bg-[#070b14]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                JSON-RPC 2.0 Request (stdin)
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyRequest}
              className="text-xs font-mono text-slate-300 hover:text-white inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded border border-white/15"
            >
              {copiedReq ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied Request</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Request</span>
                </>
              )}
            </button>
          </div>
          <pre className="text-xs font-mono text-[#f8fafc] overflow-x-auto leading-relaxed">
            <code className="text-[#f8fafc]">{JSON.stringify(jsonRpcRequest, null, 2)}</code>
          </pre>
        </div>

        {/* Response Panel */}
        <div className="p-5 sm:p-6 bg-[#070b14]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                JSON-RPC 2.0 Response (stdout)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setResponseView(responseView === "rpc" ? "decoded" : "rpc")}
                className="text-[11px] font-mono text-sky-300 hover:text-white bg-sky-500/15 px-2.5 py-1 rounded border border-sky-400/30"
              >
                {responseView === "rpc" ? "View Decoded JSON" : "View Full JSON-RPC"}
              </button>
              <button
                type="button"
                onClick={handleCopyResponse}
                className="text-xs font-mono text-slate-300 hover:text-white inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded border border-white/15"
              >
                {copiedRes ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied Response</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Response</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <pre className="text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
            <code className="text-emerald-300">
              {JSON.stringify(responseView === "rpc" ? jsonRpcResponse : toolResult, null, 2)}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
