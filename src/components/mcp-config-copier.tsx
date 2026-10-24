"use client";

import React, { useState } from "react";
import {
  Check,
  Copy,
  Cpu,
  ShieldCheck,
  Sparkles,
  Monitor,
  Apple,
  Info,
  CheckCircle2
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";

type ClientId = "claude" | "cursor" | "windsurf" | "vscode" | "docker";
type VersionChoice = "latest" | "pinned";
type PlatformChoice = "standard" | "windows";

const CURRENT_VERSION = "1.5.0";

interface ClientConfig {
  id: ClientId;
  name: string;
  badge: string;
  configPath: string;
  notes: string;
  supportsWindowsCmd?: boolean;
}

const MCP_CLIENTS: ClientConfig[] = [
  {
    id: "claude",
    name: "Claude Desktop",
    badge: "Works with Claude Desktop",
    configPath:
      "macOS: ~/Library/Application Support/Claude/claude_desktop_config.json\nWindows: %APPDATA%\\Claude\\claude_desktop_config.json",
    notes:
      "Restart Claude Desktop after saving. Look for the 🔨 hammer icon showing 10 Castov local tools.",
    supportsWindowsCmd: true,
  },
  {
    id: "cursor",
    name: "Cursor IDE",
    badge: ".cursor/mcp.json",
    configPath: "Project root: .cursor/mcp.json • Or Cursor Settings → Features → MCP Servers",
    notes:
      "Works automatically in Cursor Agent & Composer mode with readOnlyHint safety annotations enabled.",
    supportsWindowsCmd: true,
  },
  {
    id: "windsurf",
    name: "Windsurf (Codeium)",
    badge: "mcp_config.json",
    configPath: "~/.codeium/windsurf/mcp_config.json",
    notes: "Cascade agent can invoke all 10 deterministic Castov tools without cloud roundtrips.",
    supportsWindowsCmd: true,
  },
  {
    id: "vscode",
    name: "VS Code (Copilot MCP)",
    badge: ".vscode/mcp.json",
    configPath: "Workspace root: .vscode/mcp.json",
    notes: "Compatible with VS Code GitHub Copilot Agent mode using native stdio transport.",
    supportsWindowsCmd: true,
  },
  {
    id: "docker",
    name: "Docker Container",
    badge: "Isolated Alpine Runtime",
    configPath: "Zero-host-dependency containerized stdio execution",
    notes: "Runs inside an isolated non-root Alpine Linux container (USER node).",
    supportsWindowsCmd: false,
  },
];

function generateConfig(
  client: ClientId,
  platform: PlatformChoice,
  version: VersionChoice
): string {
  const pkgSpec = version === "pinned" ? `castov@${CURRENT_VERSION}` : "castov@latest";

  if (client === "docker") {
    const tag = version === "pinned" ? CURRENT_VERSION : "latest";
    return JSON.stringify(
      {
        mcpServers: {
          castov: {
            command: "docker",
            args: ["run", "-i", "--rm", `castovdev/castov:${tag}`, "mcp"],
          },
        },
      },
      null,
      2
    );
  }

  if (client === "vscode") {
    if (platform === "windows") {
      return JSON.stringify(
        {
          servers: {
            castov: {
              type: "stdio",
              command: "cmd",
              args: ["/c", "npx", "-y", pkgSpec, "mcp"],
            },
          },
        },
        null,
        2
      );
    }
    return JSON.stringify(
      {
        servers: {
          castov: {
            type: "stdio",
            command: "npx",
            args: ["-y", pkgSpec, "mcp"],
          },
        },
      },
      null,
      2
    );
  }

  // Claude, Cursor, Windsurf
  if (platform === "windows") {
    return JSON.stringify(
      {
        mcpServers: {
          castov: {
            command: "cmd",
            args: ["/c", "npx", "-y", pkgSpec, "mcp"],
          },
        },
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      mcpServers: {
        castov: {
          command: "npx",
          args: ["-y", pkgSpec, "mcp"],
        },
      },
    },
    null,
    2
  );
}

export function McpConfigCopier() {
  const [activeClient, setActiveClient] = useState<ClientId>("claude");
  const [platform, setPlatform] = useState<PlatformChoice>("standard");
  const [versionChoice, setVersionChoice] = useState<VersionChoice>("latest");
  const [copied, setCopied] = useState(false);
  const [copiedWin, setCopiedWin] = useState(false);

  const current = MCP_CLIENTS.find((c) => c.id === activeClient)!;
  const currentCode = generateConfig(activeClient, platform, versionChoice);

  const handleTabChange = (id: ClientId) => {
    setActiveClient(id);
    trackEvent("mcp_switch_tab", { client: id });
  };

  const handleCopy = (overridePlatform?: PlatformChoice) => {
    const targetPlatform = overridePlatform ?? platform;
    const codeToCopy = generateConfig(activeClient, targetPlatform, versionChoice);

    navigator.clipboard.writeText(codeToCopy);
    trackEvent("mcp_copy_config", {
      client: activeClient,
      platform: targetPlatform,
      version: versionChoice,
      pinnedVersion: CURRENT_VERSION,
    });

    if (overridePlatform === "windows") {
      setCopiedWin(true);
      setTimeout(() => setCopiedWin(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-card overflow-hidden shadow-xl">
      {/* Top Client Navigation Tabs */}
      <div className="p-3 sm:p-4 bg-field border-b border-line flex flex-wrap gap-2">
        {MCP_CLIENTS.map((client) => {
          const isActive = client.id === activeClient;
          return (
            <button
              key={client.id}
              type="button"
              onClick={() => handleTabChange(client.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-card text-accent border border-accent/30 shadow-sm"
                  : "text-muted hover:text-fg hover:bg-hover/60"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{client.name}</span>
            </button>
          );
        })}
      </div>

      <div className="p-5 sm:p-7">
        {/* Controls Bar: Badge & Options */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-line/60 mb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                {current.badge}
              </span>
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Local Stdio • Air-Gapped
              </span>
            </div>
            <pre className="text-[11px] font-mono text-muted whitespace-pre-wrap leading-relaxed">
              {current.configPath}
            </pre>
          </div>

          {/* Version & OS Toggles */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Version Pinning Selector */}
            {activeClient !== "docker" && (
              <div className="inline-flex items-center rounded-xl border border-line bg-field p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setVersionChoice("latest")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    versionChoice === "latest"
                      ? "bg-card text-accent shadow-xs font-semibold"
                      : "text-muted hover:text-fg"
                  }`}
                  title="Always fetch latest release"
                >
                  @latest
                </button>
                <button
                  type="button"
                  onClick={() => setVersionChoice("pinned")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                    versionChoice === "pinned"
                      ? "bg-card text-accent shadow-xs font-semibold"
                      : "text-muted hover:text-fg"
                  }`}
                  title="Recommended for engineering teams requiring reproducible environments"
                >
                  <span>@{CURRENT_VERSION}</span>
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1 py-0.2 rounded font-mono">
                    Team
                  </span>
                </button>
              </div>
            )}

            {/* Platform Toggle (Standard vs Windows cmd wrapper) */}
            {current.supportsWindowsCmd && (
              <div className="inline-flex items-center rounded-xl border border-line bg-field p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setPlatform("standard")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    platform === "standard"
                      ? "bg-card text-accent shadow-xs font-semibold"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  <Apple className="w-3 h-3" />
                  <span>macOS / Linux</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform("windows")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    platform === "windows"
                      ? "bg-card text-accent shadow-xs font-semibold"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  <span>Windows</span>
                </button>
              </div>
            )}

            {/* Primary Copy Button */}
            <button
              type="button"
              onClick={() => handleCopy()}
              className="btn bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shrink-0 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied JSON!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Team Pinning Explanation Note */}
        {versionChoice === "pinned" && (
          <div className="mb-4 rounded-xl bg-accent/5 border border-accent/20 p-3 flex items-start gap-2.5 text-xs text-muted">
            <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-fg font-semibold">Recommended for Engineering Teams:</strong> Pinning{" "}
              <code className="text-accent bg-field px-1.5 py-0.5 rounded font-mono">
                castov@{CURRENT_VERSION}
              </code>{" "}
              ensures consistent CI/CD execution, avoids breaking upstream changes, and satisfies enterprise supply-chain audit policies.
            </p>
          </div>
        )}

        {/* Main Code Box */}
        <div className="rounded-xl bg-[#070b14] border border-white/10 p-4 sm:p-5 font-mono text-xs sm:text-sm text-[#f8fafc] overflow-x-auto shadow-inner">
          <pre className="leading-relaxed text-[#f8fafc] break-words whitespace-pre">
            <code className="text-emerald-300">{currentCode}</code>
          </pre>
        </div>

        {/* Dedicated Windows Claude Desktop Callout when in Standard mode on Claude */}
        {activeClient === "claude" && platform === "standard" && (
          <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/25 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">Using Windows with Claude Desktop?</p>
                <p className="text-muted leading-relaxed mt-0.5">
                  Direct <code className="text-fg bg-field px-1 py-0.5 rounded">npx</code> often fails to spawn on Windows. Use the CMD wrapper:{" "}
                  <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded">
                    &quot;command&quot;: &quot;cmd&quot;, &quot;args&quot;: [&quot;/c&quot;, &quot;npx&quot;, ...]
                  </code>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy("windows")}
              className="btn bg-card border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shrink-0 self-start sm:self-center"
            >
              {copiedWin ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied Windows JSON!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Windows Config</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-4 flex items-center gap-2 text-xs text-muted">
          <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>{current.notes}</span>
        </div>
      </div>
    </div>
  );
}
