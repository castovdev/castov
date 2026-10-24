"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Terminal,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Shield,
  Zap,
} from "lucide-react";

interface TerminalLine {
  id: string;
  type: "input" | "output" | "error" | "system";
  content: React.ReactNode;
}

const QUICK_CHIPS = [
  {
    label: "Secret 32B",
    cmd: "castov secret --len 32",
    tag: "Security",
  },
  {
    label: "Cron Parser",
    cmd: 'castov cron "*/15 9-17 * * 1-5"',
    tag: "DevOps",
  },
  {
    label: "CIDR Calculator",
    cmd: "castov cidr 10.240.0.0/22",
    tag: "Network",
  },
  {
    label: "Fix Port 3000",
    cmd: 'castov fix "EADDRINUSE: 3000"',
    tag: "Instant Fix",
  },
  {
    label: "Crypto UUID",
    cmd: "castov uuid",
    tag: "Utility",
  },
];

// Helper: CIDR calculation
function parseCidr(input: string) {
  const parts = input.trim().split("/");
  if (parts.length !== 2) return null;
  const ip = parts[0];
  const maskBits = parseInt(parts[1], 10);
  if (isNaN(maskBits) || maskBits < 0 || maskBits > 32) return null;

  const octets = ip.split(".").map(Number);
  if (octets.length !== 4 || octets.some((o) => isNaN(o) || o < 0 || o > 255))
    return null;

  const ipNum =
    ((octets[0] << 24) >>> 0) +
    ((octets[1] << 16) >>> 0) +
    ((octets[2] << 8) >>> 0) +
    (octets[3] >>> 0);

  const maskNum = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
  const wildcardNum = (~maskNum) >>> 0;
  const networkNum = (ipNum & maskNum) >>> 0;
  const broadcastNum = (networkNum | wildcardNum) >>> 0;

  const numToIp = (num: number) =>
    [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255,
    ].join(".");

  const totalHosts = Math.pow(2, 32 - maskBits);
  const usableHosts = maskBits >= 31 ? totalHosts : Math.max(0, totalHosts - 2);
  const firstUsable = maskBits >= 31 ? numToIp(networkNum) : numToIp(networkNum + 1);
  const lastUsable = maskBits >= 31 ? numToIp(broadcastNum) : numToIp(broadcastNum - 1);

  return {
    ip,
    maskBits,
    netmask: numToIp(maskNum),
    wildcard: numToIp(wildcardNum),
    network: numToIp(networkNum),
    broadcast: numToIp(broadcastNum),
    firstUsable,
    lastUsable,
    totalHosts: totalHosts.toLocaleString(),
    usableHosts: usableHosts.toLocaleString(),
  };
}

let terminalLineSeq = 0;
function getNextTerminalId(prefix: string) {
  terminalLineSeq += 1;
  return `${prefix}-${terminalLineSeq}`;
}

const INITIAL_WELCOME_LINE: TerminalLine = {
  id: "sys-welcome",
  type: "system",
  content: (
    <div className="space-y-1 text-xs font-mono text-muted/90">
      <div className="text-accent font-semibold flex items-center gap-2">
        <Zap className="w-3.5 h-3.5" />
        <span>Castov DevShell v0.2.0 (Zero-Latency Browser Sandbox)</span>
      </div>
      <p>
        Simulates the full <code className="text-fg font-bold">castov-cli</code> suite locally via WebCrypto and instant transforms.
      </p>
      <p className="text-[11px] text-muted">
        Click any quick-run chip above or type <code className="text-emerald-400">help</code> to see commands.
      </p>
    </div>
  ),
};

export function LiveTerminalPlayground() {
  const [history, setHistory] = useState<TerminalLine[]>([INITIAL_WELCOME_LINE]);
  const [inputValue, setInputValue] = useState("");
  const [cmdIndex, setCmdIndex] = useState(-1);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [copiedInstall, setCopiedInstall] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (typeof terminalEndRef.current?.scrollIntoView === "function") {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  const handleCopyInstall = async () => {
    try {
      await navigator.clipboard.writeText("npm i -g castov");
      setCopiedInstall(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("castov:track", {
            detail: { name: "terminal_install_copy" },
          })
        );
      }
      setTimeout(() => setCopiedInstall(false), 2000);
    } catch {
      // Fallback
    }
  };

  const executeCommand = (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    // Add to command history
    setCmdHistory((prev) => [...prev, trimmed]);
    setCmdIndex(-1);

    // Append user input line
    const inputLine: TerminalLine = {
      id: getNextTerminalId("in"),
      type: "input",
      content: (
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-emerald-400 font-bold">castov</span>
          <span className="text-accent font-bold">$</span>
          <span className="text-fg">{trimmed}</span>
        </div>
      ),
    };

    let responseLine: TerminalLine | null = null;
    const lower = trimmed.toLowerCase();

    if (lower === "clear" || lower === "cls") {
      setHistory([]);
      return;
    }

    if (lower === "help") {
      responseLine = {
        id: getNextTerminalId("out"),
        type: "output",
        content: (
          <div className="space-y-1 text-xs font-mono text-muted py-1">
            <p className="text-fg font-semibold mb-1.5">Available CLI commands:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              <div>
                <span className="text-emerald-400 font-bold">castov secret</span>{" "}
                <span className="text-muted-fg text-[11px]">--len 16|32|64</span>
              </div>
              <div>
                <span className="text-emerald-400 font-bold">castov cron</span>{" "}
                <span className="text-muted-fg text-[11px]">&quot;&lt;expr&gt;&quot;</span>
              </div>
              <div>
                <span className="text-emerald-400 font-bold">castov cidr</span>{" "}
                <span className="text-muted-fg text-[11px]">&lt;ip/mask&gt;</span>
              </div>
              <div>
                <span className="text-emerald-400 font-bold">castov fix</span>{" "}
                <span className="text-muted-fg text-[11px]">&quot;&lt;error/port&gt;&quot;</span>
              </div>
              <div>
                <span className="text-emerald-400 font-bold">castov uuid</span>
              </div>
              <div>
                <span className="text-emerald-400 font-bold">castov now</span>
              </div>
              <div>
                <span className="text-emerald-400 font-bold">castov chmod &lt;755&gt;</span>
              </div>
              <div>
                <span className="text-emerald-400 font-bold">clear</span>
              </div>
            </div>
            <p className="text-[11px] text-muted/80 mt-2">
              Install globally to run anywhere: <code className="text-fg">npm i -g castov</code>
            </p>
          </div>
        ),
      };
    } else if (lower.startsWith("castov secret") || lower.startsWith("secret")) {
      const match = trimmed.match(/--len\s+(\d+)/i);
      const len = match ? Math.min(128, Math.max(8, parseInt(match[1], 10))) : 32;
      const bytes = new Uint8Array(len);
      window.crypto.getRandomValues(bytes);

      const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const b64 = btoa(String.fromCharCode(...bytes));

      responseLine = {
        id: getNextTerminalId("out"),
        type: "output",
        content: (
          <div className="space-y-2 font-mono text-xs py-1">
            <div className="flex items-center gap-2 text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>Generated {len}-byte Cryptographically Secure Secret:</span>
            </div>
            <div className="p-2.5 rounded-lg bg-field/80 border border-line space-y-1.5 select-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-muted text-[11px]">Hex ({hex.length} chars):</span>
                <span className="text-fg font-bold break-all">{hex}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-t border-line/50 pt-1.5">
                <span className="text-muted text-[11px]">Base64:</span>
                <span className="text-accent font-bold break-all">{b64}</span>
              </div>
            </div>
            <div className="text-[11px] text-muted flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Entropy: {len * 8} bits (WebCrypto CSPRNG, zero server contact)</span>
            </div>
          </div>
        ),
      };
    } else if (lower.startsWith("castov cron") || lower.startsWith("cron")) {
      const match = trimmed.match(/["']([^"']+)["']/) || trimmed.split(/\s+/).slice(2);
      const expr = Array.isArray(match) ? match[1] || match.join(" ") : "*/15 9-17 * * 1-5";

      responseLine = {
        id: getNextTerminalId("out"),
        type: "output",
        content: (
          <div className="space-y-2 font-mono text-xs py-1">
            <div className="flex items-center justify-between">
              <span className="text-accent font-bold">Cron Expression: {expr}</span>
              <span className="text-[11px] text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">Valid 5-part</span>
            </div>
            <div className="p-2.5 rounded-lg bg-field/80 border border-line text-xs space-y-1 leading-relaxed">
              <p className="text-fg">
                <span className="text-muted">Schedule:</span>{" "}
                <strong>Every 15 minutes</strong> between 09:00 AM and 05:59 PM, Monday through Friday.
              </p>
              <div className="text-[11px] text-muted border-t border-line/50 pt-1 mt-1">
                Field breakdown: Minute: <code className="text-emerald-400">*/15</code> | Hour: <code className="text-emerald-400">9-17</code> | Day: <code className="text-emerald-400">*</code> | Month: <code className="text-emerald-400">*</code> | Weekday: <code className="text-emerald-400">1-5</code>
              </div>
            </div>
            <div className="text-[11px] text-muted flex items-center justify-between">
              <span>Next execution: Top of the next 15m window</span>
              <Link href="/cron/every_15_minutes" className="text-accent hover:underline flex items-center gap-1">
                View cron guide <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ),
      };
    } else if (lower.startsWith("castov cidr") || lower.startsWith("cidr")) {
      const parts = trimmed.split(/\s+/);
      const target = parts[2] || parts[1] || "10.240.0.0/22";
      const cidr = parseCidr(target);

      if (!cidr) {
        responseLine = {
          id: getNextTerminalId("err"),
          type: "error",
          content: (
            <p className="text-xs font-mono text-rose-400">
              Error: Invalid CIDR notation &quot;{target}&quot;. Example: <code>10.240.0.0/22</code>
            </p>
          ),
        };
      } else {
        responseLine = {
          id: getNextTerminalId("out"),
          type: "output",
          content: (
            <div className="space-y-2 font-mono text-xs py-1">
              <div className="text-emerald-400 font-bold flex items-center gap-2">
                <span>Subnet: {cidr.ip}/{cidr.maskBits}</span>
                <span className="text-[11px] text-muted">({cidr.usableHosts} usable hosts)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-lg bg-field/80 border border-line text-[11px]">
                <div>
                  <span className="text-muted">Netmask:</span> <span className="text-fg font-semibold">{cidr.netmask}</span>
                </div>
                <div>
                  <span className="text-muted">Wildcard:</span> <span className="text-fg font-semibold">{cidr.wildcard}</span>
                </div>
                <div>
                  <span className="text-muted">Network:</span> <span className="text-fg font-semibold">{cidr.network}</span>
                </div>
                <div>
                  <span className="text-muted">Broadcast:</span> <span className="text-fg font-semibold">{cidr.broadcast}</span>
                </div>
                <div className="sm:col-span-2 border-t border-line/50 pt-1">
                  <span className="text-muted">Usable Range:</span>{" "}
                  <span className="text-accent font-semibold">{cidr.firstUsable}</span> -{" "}
                  <span className="text-accent font-semibold">{cidr.lastUsable}</span>
                </div>
              </div>
            </div>
          ),
        };
      }
    } else if (lower.startsWith("castov fix") || lower.startsWith("fix") || lower.includes("eaddrinuse") || lower.includes("port")) {
      const portMatch = trimmed.match(/(\d{2,5})/);
      const port = portMatch ? portMatch[1] : "3000";

      responseLine = {
        id: getNextTerminalId("out"),
        type: "output",
        content: (
          <div className="space-y-2.5 font-mono text-xs py-1">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <span>Diagnosis: Port {port} is occupied by another process (EADDRINUSE)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-field/80 border border-line space-y-2">
              <div>
                <div className="text-[11px] text-muted mb-1 font-semibold flex items-center justify-between">
                  <span>Option A (Castov CLI 1-Line Kill):</span>
                  <span className="text-[10px] text-emerald-400">Cross-Platform</span>
                </div>
                <code className="text-emerald-400 font-bold bg-bg px-2 py-1 rounded block select-all">
                  npx castov kill-port {port}
                </code>
              </div>

              <div className="border-t border-line/50 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-muted block mb-0.5">Windows PowerShell:</span>
                  <code className="text-fg bg-bg px-1.5 py-0.5 rounded block text-[10px] select-all">
                    Stop-Process -Id (Get-NetTCPConnection -LocalPort {port}).OwningProcess -Force
                  </code>
                </div>
                <div>
                  <span className="text-muted block mb-0.5">macOS &amp; Linux:</span>
                  <code className="text-fg bg-bg px-1.5 py-0.5 rounded block text-[10px] select-all">
                    lsof -ti :{port} | xargs kill -9
                  </code>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-muted flex items-center justify-between">
              <span>Need detailed error troubleshooting?</span>
              <Link href="/error-fixes/eaddrinuse" className="text-accent hover:underline flex items-center gap-1">
                Full EADDRINUSE guide <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ),
      };
    } else if (lower.startsWith("castov uuid") || lower === "uuid") {
      const u = crypto.randomUUID();
      responseLine = {
        id: getNextTerminalId("out"),
        type: "output",
        content: (
          <div className="font-mono text-xs space-y-1 py-1">
            <div className="text-muted text-[11px]">RFC 4122 v4 UUID:</div>
            <div className="text-emerald-400 font-bold select-all">{u}</div>
          </div>
        ),
      };
    } else if (lower.startsWith("castov now") || lower === "now") {
      const now = new Date();
      responseLine = {
        id: getNextTerminalId("out"),
        type: "output",
        content: (
          <div className="font-mono text-xs space-y-1 py-1">
            <div><span className="text-muted">ISO 8601:</span> <span className="text-fg font-semibold">{now.toISOString()}</span></div>
            <div><span className="text-muted">Epoch Seconds:</span> <span className="text-accent font-semibold">{Math.floor(now.getTime() / 1000)}</span></div>
            <div><span className="text-muted">Epoch Millis:</span> <span className="text-emerald-400 font-semibold">{now.getTime()}</span></div>
          </div>
        ),
      };
    } else if (lower.startsWith("castov chmod") || lower.startsWith("chmod")) {
      const codeMatch = trimmed.match(/\b([0-7]{3,4})\b/);
      const code = codeMatch ? codeMatch[1].slice(-3) : "755";
      const u = parseInt(code[0], 10);
      const g = parseInt(code[1], 10);
      const o = parseInt(code[2], 10);
      const toRwx = (n: number) =>
        (n & 4 ? "r" : "-") + (n & 2 ? "w" : "-") + (n & 1 ? "x" : "-");

      responseLine = {
        id: getNextTerminalId("out"),
        type: "output",
        content: (
          <div className="font-mono text-xs space-y-1.5 py-1">
            <div className="flex items-center gap-2">
              <span className="text-fg font-bold">chmod {code}:</span>
              <code className="text-emerald-400 font-bold bg-field px-1.5 py-0.5 rounded">
                -{toRwx(u)}{toRwx(g)}{toRwx(o)}
              </code>
            </div>
            <div className="text-[11px] text-muted">
              Owner: {toRwx(u)} ({u}) | Group: {toRwx(g)} ({g}) | Public: {toRwx(o)} ({o})
            </div>
          </div>
        ),
      };
    } else {
      responseLine = {
        id: getNextTerminalId("err"),
        type: "error",
        content: (
          <p className="text-xs font-mono text-rose-400">
            command not found: {trimmed}. Type <code className="text-fg underline">help</code> for list of commands or click a chip.
          </p>
        ),
      };
    }

    setHistory((prev) => [...prev, inputLine, responseLine!]);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeCommand(inputValue);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIndex = cmdIndex === -1 ? cmdHistory.length - 1 : Math.max(0, cmdIndex - 1);
      setCmdIndex(nextIndex);
      setInputValue(cmdHistory[nextIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (cmdHistory.length === 0 || cmdIndex === -1) return;
      const nextIndex = cmdIndex + 1;
      if (nextIndex >= cmdHistory.length) {
        setCmdIndex(-1);
        setInputValue("");
      } else {
        setCmdIndex(nextIndex);
        setInputValue(cmdHistory[nextIndex]);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-12 text-left">
      {/* Container with sleek glow */}
      <div className="relative rounded-2xl border border-line bg-card/95 shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-bg/90 border-b border-line select-none">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-600/50" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/50" />
            <span className="ml-2 text-xs font-mono text-muted flex items-center gap-1.5 font-medium">
              <Terminal className="w-3.5 h-3.5 text-accent" />
              <span>castov-playground ~ zsh</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyInstall}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-field hover:bg-line border border-line text-fg transition-colors"
              title="Copy global install command"
            >
              {copiedInstall ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-muted" />
                  <span>npm i -g castov</span>
                </>
              )}
            </button>
            <button
              onClick={() => setHistory([])}
              className="p-1 rounded-lg text-muted hover:text-fg hover:bg-field transition-colors"
              title="Clear terminal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick-Run Command Chips */}
        <div className="px-4 py-2.5 bg-field/40 border-b border-line flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-mono text-muted uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-accent" /> Try:
          </span>
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => executeCommand(chip.cmd)}
              className="shrink-0 text-xs font-mono px-2.5 py-1 rounded-lg bg-card hover:bg-accent/10 border border-line hover:border-accent/30 text-fg hover:text-accent transition-all flex items-center gap-1.5 shadow-xs"
            >
              <span>{chip.label}</span>
              <span className="text-[10px] text-muted/70 bg-field px-1 rounded">
                {chip.tag}
              </span>
            </button>
          ))}
        </div>

        {/* Terminal Screen Body */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="p-4 sm:p-5 font-mono text-xs sm:text-sm min-h-[260px] max-h-[360px] overflow-y-auto space-y-3 cursor-text bg-bg/95"
        >
          {history.map((line) => (
            <div key={line.id} className="leading-relaxed">
              {line.content}
            </div>
          ))}

          {/* Active Prompt Line */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-emerald-400 font-bold shrink-0">castov</span>
            <span className="text-accent font-bold shrink-0">$</span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type 'castov secret' or 'help'..."
              className="flex-1 bg-transparent text-fg outline-none font-mono text-xs sm:text-sm placeholder:text-muted/40"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
          <div ref={terminalEndRef} />
        </div>

        {/* Terminal Footer Bar */}
        <div className="px-4 py-2 bg-field/30 border-t border-line flex flex-wrap items-center justify-between text-[11px] font-mono text-muted gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Offline-first</span>
            </span>
            <span>•</span>
            <span>0ms Latency</span>
            <span>•</span>
            <span>WebCrypto E2EE</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Ready for CI/CD &amp; Terminal</span>
            <Link
              href="/cli"
              className="text-accent hover:underline inline-flex items-center gap-1 font-semibold"
            >
              CLI Docs <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
