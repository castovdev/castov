"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Terminal,
  Copy,
  Check,
  Zap,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";

interface InstantTerminalFixBoxProps {
  slug: string;
  category: string;
  diagnosticCommands: string[];
  errorMessage: string;
}

export function InstantTerminalFixBox({
  slug,
  category,
  diagnosticCommands,
  errorMessage,
}: InstantTerminalFixBoxProps) {
  const [activeTab, setActiveTab] = useState<"cli" | "posix" | "windows" | "diag">("cli");
  const [copied, setCopied] = useState(false);

  // Derive OS-specific commands based on error slug or defaults
  let cliCmd = `npx castov fix "${slug}"`;
  let posixCmd = diagnosticCommands[0] || `curl -sSf https://castov.com/api/fix/${slug} | bash`;
  let winCmd = diagnosticCommands[0] || `irm https://castov.com/fix/${slug} | iex`;

  if (slug.includes("eaddrinuse") || slug.includes("port")) {
    cliCmd = `npx castov kill-port 3000`;
    posixCmd = `lsof -ti :3000 | xargs kill -9`;
    winCmd = `Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force`;
  } else if (slug.includes("docker")) {
    cliCmd = `npx castov doctor docker`;
    posixCmd = `sudo systemctl restart docker && sudo chmod 666 /var/run/docker.sock`;
    winCmd = `Restart-Service *docker* -Force`;
  } else if (slug.includes("cors")) {
    cliCmd = `npx castov proxy --cors --target http://localhost:8000`;
    posixCmd = `curl -I -X OPTIONS http://localhost:3000 -H "Origin: http://localhost:3000"`;
    winCmd = `Invoke-RestMethod -Uri "http://localhost:3000" -Method Options -Headers @{Origin="http://localhost:3000"}`;
  } else if (slug.includes("hydration") || slug.includes("react")) {
    cliCmd = `npx castov lint --hydration`;
    posixCmd = `npm run build`;
    winCmd = `npm run build`;
  }

  const currentCommand =
    activeTab === "cli"
      ? cliCmd
      : activeTab === "posix"
      ? posixCmd
      : activeTab === "windows"
      ? winCmd
      : diagnosticCommands.join(" && ");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCommand);
      setCopied(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("castov:track", {
            detail: { name: "instant_fix_copy", slug, tab: activeTab },
          })
        );
      }
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignored
    }
  };

  return (
    <div className="my-8 rounded-2xl border border-line bg-card shadow-sm overflow-hidden">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-field/60 border-b border-line">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-fg flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-accent" />
            Instant Terminal Resolution
          </span>
          <span className="text-[11px] font-mono text-muted bg-card px-2 py-0.5 rounded border border-line hidden sm:inline-block">
            0ms Fix
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("cli")}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
              activeTab === "cli"
                ? "bg-accent text-accent-fg font-bold shadow-xs"
                : "text-muted hover:text-fg hover:bg-card"
            }`}
          >
            Castov CLI
          </button>
          <button
            onClick={() => setActiveTab("posix")}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
              activeTab === "posix"
                ? "bg-accent text-accent-fg font-bold shadow-xs"
                : "text-muted hover:text-fg hover:bg-card"
            }`}
          >
            macOS / Linux
          </button>
          <button
            onClick={() => setActiveTab("windows")}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
              activeTab === "windows"
                ? "bg-accent text-accent-fg font-bold shadow-xs"
                : "text-muted hover:text-fg hover:bg-card"
            }`}
          >
            Windows
          </button>
          {diagnosticCommands.length > 0 && (
            <button
              onClick={() => setActiveTab("diag")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors hidden md:inline-block ${
                activeTab === "diag"
                  ? "bg-accent text-accent-fg font-bold shadow-xs"
                  : "text-muted hover:text-fg hover:bg-card"
              }`}
            >
              Diagnostics
            </button>
          )}
        </div>
      </div>

      {/* Terminal Command Output */}
      <div className="p-5 font-mono text-xs sm:text-sm bg-bg/95 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-x-auto select-all">
          <span className="text-emerald-400 font-bold shrink-0">$</span>
          <code className="text-fg font-bold break-all">{currentCommand}</code>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-mono bg-field hover:bg-line border border-line text-fg transition-all active:scale-95 shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-muted" />
                <span>Copy Command</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-5 py-2.5 bg-field/30 border-t border-line flex flex-wrap items-center justify-between text-[11px] font-mono text-muted gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>Cross-platform verified • Zero telemetry</span>
        </div>
        <Link
          href="/cli"
          className="text-accent hover:underline inline-flex items-center gap-1 font-semibold"
        >
          Explore Castov CLI docs <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
