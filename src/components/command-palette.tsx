"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  SearchIcon,
  BoxIcon,
  CodeIcon,
  SettingsIcon,
  ClockIcon,
  HashIcon,
  TypeIcon,
  LinkIcon,
  PaletteIcon,
  CpuIcon,
  TerminalIcon,
  CopyIcon,
  ShieldIcon,
  UserIcon,
  KeyboardIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { AI_TOOLS } from "@/lib/ai-tools";
import { AI_HUB_LIVE } from "@/lib/flags";
import { TOOLS } from "@/content/tools";
import { toIsoUtc } from "@/lib/time/format";
import { describeCron, parseCron, nextRuns } from "@/lib/time";
import { ArrowRight, Workflow } from "lucide-react";

function formatRelativeTime(ms: number, nowMs: number): string {
  const diffSec = Math.round((ms - nowMs) / 1000);
  const absSec = Math.abs(diffSec);
  if (absSec < 45) return "just now";
  if (absSec < 90) return diffSec > 0 ? "in 1 minute" : "1 minute ago";
  if (absSec < 3600) {
    const mins = Math.round(absSec / 60);
    return diffSec > 0 ? `in ${mins} minutes` : `${mins} minutes ago`;
  }
  if (absSec < 86400) {
    const hrs = Math.round(absSec / 3600);
    return diffSec > 0 ? `in ${hrs} hours` : `${hrs} hours ago`;
  }
  const days = Math.round(absSec / 86400);
  return diffSec > 0 ? `in ${days} days` : `${days} days ago`;
}

const MCP_STDIO_JSON_CONFIG = `{
  "mcpServers": {
    "castov": {
      "command": "npx",
      "args": ["-y", "castov@latest", "mcp"]
    }
  }
}`;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setNowMs(Date.now());
        setOpen((prev) => !prev);
      }
    };

    const openPalette = () => {
      setNowMs(Date.now());
      setOpen(true);
    };

    document.addEventListener("keydown", down);
    window.addEventListener("open-command-palette", openPalette);

    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-palette", openPalette);
    };
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setOpen(false);
    setSearch("");
  };

  if (!open) return null;

  const rawSearch = search.trim();

  // 1. Unix Timestamp Detection (10-digit seconds or 13-digit ms)
  const isTimestamp = /^\d{10}(\d{3})?$/.test(rawSearch);
  let timestampData: { ms: number; utc: string; local: string; relative: string; isMs: boolean } | null = null;
  if (isTimestamp) {
    const num = Number(rawSearch);
    const ms = rawSearch.length === 10 ? num * 1000 : num;
    if (!isNaN(ms) && ms > 0 && ms < 4102444800000) {
      timestampData = {
        ms,
        utc: toIsoUtc(ms),
        local: new Date(ms).toLocaleString(),
        relative: formatRelativeTime(ms, nowMs),
        isMs: rawSearch.length === 13,
      };
    }
  }

  // 2. JWT Detection (3 parts starting with eyJ)
  const jwtParts = rawSearch.split(".");
  const isJwt = (jwtParts.length === 3 || jwtParts.length === 2) && rawSearch.startsWith("eyJ");
  let jwtData: {
    alg: string;
    sub?: string;
    iss?: string;
    isExpired: boolean;
    ttlText: string;
    payloadStr: string;
  } | null = null;
  if (isJwt) {
    try {
      const b64Header = jwtParts[0].replace(/-/g, "+").replace(/_/g, "/");
      const b64Payload = jwtParts[1].replace(/-/g, "+").replace(/_/g, "/");
      const header = JSON.parse(atob(b64Header));
      const payload = JSON.parse(atob(b64Payload));
      const nowSec = Math.floor(nowMs / 1000);
      const exp = typeof payload.exp === "number" ? payload.exp : null;
      const isExpired = exp !== null ? exp < nowSec : false;
      let ttlText = "No expiration";
      if (exp !== null) {
        const diff = exp - nowSec;
        if (diff > 0) {
          ttlText = `Valid for ${formatRelativeTime(exp * 1000, nowMs).replace("in ", "")}`;
        } else {
          ttlText = `Expired ${formatRelativeTime(exp * 1000, nowMs)}`;
        }
      }
      jwtData = {
        alg: header.alg || "Unknown",
        sub: payload.sub,
        iss: payload.iss,
        isExpired,
        ttlText,
        payloadStr: JSON.stringify(payload, null, 2),
      };
    } catch {
      // not valid JWT
    }
  }

  // 3. Cron Expression Detection (5 tokens)
  const cronTokens = rawSearch.trim().split(/\s+/);
  let cronData: { description: string; nextRunIso: string; nextRunRelative: string } | null = null;
  if (cronTokens.length === 5) {
    const parsedCron = parseCron(rawSearch.trim());
    if (parsedCron.ok) {
      const desc = describeCron(parsedCron.value);
      const runs = nextRuns(parsedCron.value, nowMs, 1);
      if (runs.length > 0) {
        cronData = {
          description: desc,
          nextRunIso: toIsoUtc(runs[0]),
          nextRunRelative: formatRelativeTime(runs[0], nowMs),
        };
      }
    }
  }

  // 4. JSON Payload Detection
  let jsonData: { keyCount: number; formatted: string; isArray: boolean } | null = null;
  if (
    (rawSearch.startsWith("{") && rawSearch.endsWith("}")) ||
    (rawSearch.startsWith("[") && rawSearch.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(rawSearch);
      if (typeof parsed === "object" && parsed !== null) {
        jsonData = {
          keyCount: Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length,
          formatted: JSON.stringify(parsed, null, 2),
          isArray: Array.isArray(parsed),
        };
      }
    } catch {
      // not JSON
    }
  }

  // 5. Base64 String Detection (Pure base64 or b64 prefix)
  const isBase64Prefix = rawSearch.toLowerCase().startsWith("b64 ");
  const base64Str = isBase64Prefix ? rawSearch.slice(4) : "";
  let base64Encoded = "";
  try {
    if (isBase64Prefix) base64Encoded = btoa(base64Str);
  } catch {
    // ignore
  }

  let plainBase64Decoded: string | null = null;
  if (
    !isTimestamp &&
    !isJwt &&
    !jsonData &&
    !isBase64Prefix &&
    rawSearch.length >= 8 &&
    rawSearch.length % 4 === 0 &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(rawSearch)
  ) {
    try {
      const dec = atob(rawSearch);
      if (dec && /^[\x20-\x7E\s]+$/.test(dec)) {
        plainBase64Decoded = dec;
      }
    } catch {
      // ignore
    }
  }

  // Terminal Error Log Detection
  const isErrorLog =
    rawSearch.includes("EADDRINUSE") ||
    rawSearch.includes("ECONNREFUSED") ||
    rawSearch.includes("Hydration failed") ||
    rawSearch.includes("Cannot find module") ||
    rawSearch.toLowerCase().startsWith("error:");

  // Uuid & Mcp Query
  const isUuid = rawSearch.toLowerCase() === "uuid";
  const isMcpQuery = ["mcp", "claude", "cursor", "windsurf"].includes(rawSearch.toLowerCase());

  // Color Hex detection
  const isHex = /^#([0-9A-F]{3}){1,2}$/i.test(rawSearch);
  let rgbColor = "";
  if (isHex) {
    const hex = rawSearch.replace("#", "");
    const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
    rgbColor = `rgb(${r}, ${g}, ${b})`;
  }

  // URL Encode
  const isUrl = rawSearch.toLowerCase().startsWith("url ");
  const urlStr = isUrl ? rawSearch.slice(4) : "";
  const urlEncoded = isUrl ? encodeURIComponent(urlStr) : "";

  const hasInlineActions =
    Boolean(timestampData) ||
    Boolean(jwtData) ||
    Boolean(cronData) ||
    Boolean(jsonData) ||
    Boolean(plainBase64Decoded) ||
    isUuid ||
    isMcpQuery ||
    isErrorLog ||
    isBase64Prefix ||
    isHex ||
    isUrl;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setOpen(false)}
      />

      <Command
        className="relative w-full max-w-2xl bg-card border border-line/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        label="Global Command Menu"
        shouldFilter={true}
      >
        <div className="flex items-center border-b border-line/50 px-4">
          <SearchIcon className="w-5 h-5 text-muted shrink-0" />
          <Command.Input
            autoFocus
            value={search}
            onValueChange={setSearch}
            className="flex-1 bg-transparent border-none outline-none h-14 px-4 text-fg placeholder:text-muted/60 text-lg"
            placeholder="Search tools, paste tokens, errors, or type 'uuid', 'mcp'..."
          />
          <kbd className="hidden sm:inline-flex items-center h-6 px-2 text-[10px] font-medium bg-field text-muted rounded border border-line/40 font-mono">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[350px] overflow-y-auto p-2 scrollbar-thin">
          <Command.Empty className="p-6 text-center text-sm text-muted">
            No results found. Try typing &apos;mcp&apos;, &apos;uuid&apos;, or paste a timestamp/JWT.
          </Command.Empty>

          {/* Smart Omni-Detector & Auto-Preview Cards */}
          {hasInlineActions && (
            <Command.Group heading="⚡ Smart Omni-Detector (Instant Auto-Preview)" className="text-xs font-medium text-muted/60 px-2 py-1">
              {/* 1. Timestamp Detection Card */}
              {timestampData && (
                <div className="p-3 mb-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-fg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-xs text-emerald-400">Unix Epoch Timestamp Detected</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {timestampData.isMs ? "Milliseconds (13-digit)" : "Seconds (10-digit)"}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-muted">{timestampData.relative}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-card/90 p-2.5 rounded-lg border border-line">
                    <div>
                      <span className="text-muted block text-[10px]">UTC Time</span>
                      <span className="text-fg font-semibold select-all truncate block">{timestampData.utc}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">Local Time</span>
                      <span className="text-fg font-semibold select-all truncate block">{timestampData.local}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(timestampData.utc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-card border border-line text-xs font-medium hover:bg-hover text-fg cursor-pointer"
                    >
                      <CopyIcon className="w-3 h-3 text-emerald-400" />
                      <span>Copy UTC</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => runCommand(() => router.push(`/timestamp-to-date#timestamp=${rawSearch}`))}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent text-accent-fg text-xs font-medium hover:bg-accent-hover ml-auto cursor-pointer"
                    >
                      <span>Open in Timestamp Converter</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* 2. JWT Detection Card */}
              {jwtData && (
                <div className="p-3 mb-2 rounded-xl border border-purple-500/30 bg-purple-500/10 text-fg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CodeIcon className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-xs text-purple-400">JSON Web Token (JWT) Detected</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        jwtData.isExpired ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                      }`}>
                        {jwtData.isExpired ? "EXPIRED" : "VALID"}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-muted">{jwtData.ttlText}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-card/90 p-2.5 rounded-lg border border-line">
                    <div>
                      <span className="text-muted block text-[10px]">Algorithm</span>
                      <span className="text-fg font-semibold">{jwtData.alg}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">Subject (sub)</span>
                      <span className="text-fg font-semibold truncate block">{jwtData.sub || "None"}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">Issuer (iss)</span>
                      <span className="text-fg font-semibold truncate block">{jwtData.iss || "None"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(jwtData.payloadStr)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-card border border-line text-xs font-medium hover:bg-hover text-fg cursor-pointer"
                    >
                      <CopyIcon className="w-3 h-3 text-purple-400" />
                      <span>Copy Payload JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => runCommand(() => router.push(`/jwt-decoder#token=${encodeURIComponent(rawSearch)}`))}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent text-accent-fg text-xs font-medium hover:bg-accent-hover ml-auto cursor-pointer"
                    >
                      <span>Open in JWT Decoder</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Cron Expression Card */}
              {cronData && (
                <div className="p-3 mb-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-fg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-blue-400" />
                      <span className="font-bold text-xs text-blue-400">Cron Schedule Expression</span>
                    </div>
                    <span className="text-xs font-mono text-muted">Next run {cronData.nextRunRelative}</span>
                  </div>
                  <div className="bg-card/90 p-2.5 rounded-lg border border-line space-y-1">
                    <p className="text-xs font-semibold text-fg">{cronData.description}</p>
                    <p className="text-[11px] font-mono text-muted truncate">Upcoming run (UTC): {cronData.nextRunIso}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(cronData.description)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-card border border-line text-xs font-medium hover:bg-hover text-fg cursor-pointer"
                    >
                      <CopyIcon className="w-3 h-3 text-blue-400" />
                      <span>Copy Explanation</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => runCommand(() => router.push(`/cron-generator#expression=${encodeURIComponent(rawSearch)}`))}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent text-accent-fg text-xs font-medium hover:bg-accent-hover ml-auto cursor-pointer"
                    >
                      <span>Open in Cron Generator</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* 4. JSON Payload Quick Actions */}
              {jsonData && (
                <>
                  <Command.Item
                    value={`${rawSearch} json viewer format open`}
                    onSelect={() => runCommand(() => router.push(`/json-viewer#json=${encodeURIComponent(rawSearch)}`))}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
                  >
                    <CodeIcon className="w-4 h-4 text-accent shrink-0" />
                    <span className="font-semibold text-accent">Format &amp; Open in JSON Viewer</span>
                    <span className="text-xs font-mono text-muted ml-2">
                      ({jsonData.keyCount} {jsonData.isArray ? "items" : "keys"})
                    </span>
                    <span className="text-xs text-muted ml-auto shrink-0">Press Enter &rarr;</span>
                  </Command.Item>
                  <Command.Item
                    value={`${rawSearch} json to typescript interfaces pipeline`}
                    onSelect={() => runCommand(() => router.push(`/json-to-ts#json=${encodeURIComponent(rawSearch)}`))}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
                  >
                    <Workflow className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-emerald-400">Convert directly to TypeScript Interfaces</span>
                    <span className="text-xs text-muted ml-auto shrink-0">Open Pipeline &rarr;</span>
                  </Command.Item>
                </>
              )}

              {/* 5. Plain Base64 Quick Action */}
              {plainBase64Decoded && (
                <Command.Item
                  value={`${rawSearch} base64 decode`}
                  onSelect={() => copyToClipboard(plainBase64Decoded)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
                >
                  <TypeIcon className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold text-amber-400">Decoded Base64:</span>
                  <span className="text-xs text-fg font-mono truncate max-w-xs">{plainBase64Decoded}</span>
                  <span className="text-xs text-muted ml-auto shrink-0">Press Enter to copy</span>
                </Command.Item>
              )}

              {/* Terminal Error Action */}
              {isErrorLog && (
                <Command.Item
                  value={search}
                  onSelect={() => runCommand(() => router.push(`/error-fixes?q=${encodeURIComponent(rawSearch)}`))}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
                >
                  <AlertTriangleIcon className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-semibold text-amber-500">Terminal Error Detected</span>
                  <span className="text-xs text-muted ml-auto shrink-0">Diagnose with Castov Fix &rarr;</span>
                </Command.Item>
              )}

              {/* MCP Query Action */}
              {isMcpQuery && (
                <Command.Item
                  value={`${rawSearch} copy npx command mcp server`}
                  onSelect={() => copyToClipboard("npx -y castov@latest mcp")}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
                >
                  <CpuIcon className="w-4 h-4 text-accent" />
                  <span className="font-semibold text-accent font-mono">npx -y castov@latest mcp</span>
                  <span className="text-xs text-muted ml-auto">Press Enter to copy command</span>
                </Command.Item>
              )}

              {/* UUID Generator Action */}
              {isUuid && (
                <Command.Item
                  value="generate uuid"
                  onSelect={() => copyToClipboard(crypto.randomUUID())}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
                >
                  <HashIcon className="w-4 h-4 text-accent" />
                  <span className="font-semibold text-accent">Generate UUID</span>
                  <span className="text-xs text-muted ml-auto">Press Enter to copy</span>
                </Command.Item>
              )}

              {/* Base64 Prefix Encode */}
              {isBase64Prefix && base64Encoded && (
                <Command.Item
                  value={search}
                  onSelect={() => copyToClipboard(base64Encoded)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
                >
                  <TypeIcon className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold font-mono truncate max-w-sm">{base64Encoded}</span>
                  <span className="text-xs text-muted ml-auto shrink-0">Press Enter to copy Base64</span>
                </Command.Item>
              )}

              {/* URL Encode */}
              {isUrl && urlEncoded && (
                <Command.Item
                  value={search}
                  onSelect={() => copyToClipboard(urlEncoded)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
                >
                  <LinkIcon className="w-4 h-4 text-accent" />
                  <span className="font-semibold font-mono truncate max-w-sm">{urlEncoded}</span>
                  <span className="text-xs text-muted ml-auto shrink-0">Press Enter to copy</span>
                </Command.Item>
              )}

              {/* Hex Color */}
              {isHex && rgbColor && (
                <Command.Item
                  value={search}
                  onSelect={() => copyToClipboard(rgbColor)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
                >
                  <PaletteIcon className="w-4 h-4" style={{ color: rawSearch }} />
                  <span className="font-semibold font-mono">{rgbColor}</span>
                  <span className="text-xs text-muted ml-auto">Press Enter to copy RGB</span>
                </Command.Item>
              )}
            </Command.Group>
          )}

          {/* Developer Quick Actions */}
          <Command.Group heading="Developer Quick Actions" className="text-xs font-medium text-muted/60 px-2 py-1">
            <Command.Item
              value="keyboard shortcuts hotkeys cheatsheet help"
              onSelect={() => {
                setOpen(false);
                window.dispatchEvent(new CustomEvent("open-shortcuts-modal"));
              }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
            >
              <KeyboardIcon className="w-4 h-4 text-accent" />
              <span>Keyboard Shortcuts Cheatsheet</span>
              <kbd className="text-[10px] font-mono bg-field border border-line px-1.5 py-0.5 rounded ml-auto">?</kbd>
            </Command.Item>

            <Command.Item
              value="account developer workspace preferences cli token"
              onSelect={() => runCommand(() => router.push("/account"))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
            >
              <UserIcon className="w-4 h-4 text-accent" />
              <span>Developer Account &amp; Workspaces</span>
            </Command.Item>

            <Command.Item
              value="team vaults secrets zero knowledge env"
              onSelect={() => runCommand(() => router.push("/env-vault/team"))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
            >
              <ShieldIcon className="w-4 h-4 text-emerald-500" />
              <span>Zero-Knowledge Team Vaults</span>
            </Command.Item>
          </Command.Group>

          {/* MCP Server */}
          <Command.Group heading="MCP Server &amp; Ecosystem (v1.5.0)" className="text-xs font-medium text-muted/60 px-2 py-1 mt-1">
            <Command.Item
              value="mcp server claude desktop cursor windsurf model context protocol playground"
              onSelect={() => runCommand(() => router.push("/mcp"))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
            >
              <CpuIcon className="w-4 h-4 text-accent" />
              <span className="font-semibold">Castov MCP Server &amp; Live Playground</span>
              <span className="text-[11px] font-mono bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded ml-auto">Grade A • v1.5.0</span>
            </Command.Item>
            <Command.Item
              value="copy mcp command npx castov mcp"
              onSelect={() => copyToClipboard("npx -y castov@latest mcp")}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
            >
              <CopyIcon className="w-4 h-4 text-accent" />
              <span>Copy MCP Command: <code className="font-mono text-xs text-accent">npx -y castov@latest mcp</code></span>
            </Command.Item>
            <Command.Item
              value="copy mcp json config claude desktop cursor windsurf"
              onSelect={() => copyToClipboard(MCP_STDIO_JSON_CONFIG)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
            >
              <CopyIcon className="w-4 h-4 text-accent" />
              <span>Copy MCP JSON Config (Claude / Cursor / Windsurf)</span>
            </Command.Item>
            <Command.Item
              value="cli command line interface terminal npx castov"
              onSelect={() => runCommand(() => router.push("/cli"))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
            >
              <TerminalIcon className="w-4 h-4" />
              <span>Castov CLI (v1.5.0)</span>
            </Command.Item>
            <Command.Item
              value="developer hub sdk vscode extension"
              onSelect={() => runCommand(() => router.push("/developer"))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
            >
              <CodeIcon className="w-4 h-4" />
              <span>Developer Hub &amp; SDK</span>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="General" className="text-xs font-medium text-muted/60 px-2 py-1 mt-1">
            <Command.Item
              onSelect={() => runCommand(() => router.push("/"))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
            >
              <BoxIcon className="w-4 h-4" /> Home
            </Command.Item>
            {AI_HUB_LIVE && (
              <Command.Item
                onSelect={() => runCommand(() => router.push("/ai"))}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
              >
                <CodeIcon className="w-4 h-4" /> AI Developer Directory
              </Command.Item>
            )}
            <Command.Item
              onSelect={() => runCommand(() => router.push("/cheatsheets"))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
            >
              <CodeIcon className="w-4 h-4" /> Developer Cheat Sheets
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router.push("/sponsor"))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
            >
              <SettingsIcon className="w-4 h-4" /> Sponsor &amp; Advertise
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Developer Tools" className="text-xs font-medium text-muted/60 px-2 py-1 mt-2">
            {TOOLS.map((tool) => (
              <Command.Item
                key={tool.slug}
                value={tool.name + " " + tool.category}
                onSelect={() => runCommand(() => router.push(`/${tool.slug}`))}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
              >
                <div className="flex flex-col pointer-events-none">
                  <span className="font-semibold">{tool.name}</span>
                  <span className="text-xs text-muted font-normal capitalize">
                    {tool.category.replace("-", " ")}
                  </span>
                </div>
              </Command.Item>
            ))}
          </Command.Group>

          {AI_HUB_LIVE && (
            <Command.Group heading="AI Tools" className="text-xs font-medium text-muted/60 px-2 py-1 mt-2">
              {AI_TOOLS.map((tool) => (
                <Command.Item
                  key={tool.slug}
                  value={tool.name}
                  onSelect={() => runCommand(() => router.push(`/ai/${tool.slug}`))}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{tool.name}</span>
                    <span className="text-xs text-muted font-normal">{tool.category}</span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  );
}
