"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Check,
  Copy,
  Share2,
  ShieldCheck,
  Sparkles,
  Code2,
  ExternalLink,
} from "lucide-react";

type IdeTarget = "cursor" | "claude" | "windsurf" | "vscode";

interface McpRegistryEntry {
  id: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  featured?: boolean;
  config: {
    command: string;
    args: string[];
    env?: Record<string, string>;
  };
}

const POPULAR_MCP_SERVERS: McpRegistryEntry[] = [
  {
    id: "castov",
    name: "Castov DevSecOps & Time Suite",
    category: "Core DevSecOps",
    badge: "Grade A • 10 Tools",
    description:
      "Zero-telemetry local CIDR subnet calculator, port & process inspector, UUIDv7/ULID/Snowflake decoder, Cron predictor, offline JWT inspector, and secret leak scanner.",
    featured: true,
    config: {
      command: "npx",
      args: ["-y", "castov@latest", "mcp"],
    },
  },
  {
    id: "github",
    name: "GitHub Official MCP",
    category: "Version Control",
    badge: "PRs & Issues",
    description:
      "Search repositories, manage pull requests, inspect issues, and read commit histories via the GitHub API.",
    config: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: "<YOUR_GITHUB_PAT>",
      },
    },
  },
  {
    id: "postgres",
    name: "PostgreSQL Database Inspector",
    category: "Database",
    badge: "Read-Only SQL",
    description:
      "Inspect database schemas, table structures, and run read-only SQL queries against local or staging PostgreSQL instances.",
    config: {
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://localhost:5432/mydb",
      ],
    },
  },
  {
    id: "filesystem",
    name: "Local Filesystem Workspace",
    category: "System",
    badge: "Sandboxed FS",
    description:
      "Read, search, and manage local project directories with explicit directory allowlisting.",
    config: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "./src"],
    },
  },
  {
    id: "playwright",
    name: "Playwright Browser Automation",
    category: "Testing & QA",
    badge: "Headless E2E",
    description:
      "Automate browser interactions, capture DOM snapshots, and verify UI flows directly from your AI coding assistant.",
    config: {
      command: "npx",
      args: ["-y", "@playwright/mcp@latest"],
    },
  },
  {
    id: "memory",
    name: "Knowledge Graph Memory",
    category: "AI Context",
    badge: "Persistent Graph",
    description:
      "Persistent local entity-relation graph so Claude and Cursor remember architectural decisions across sessions.",
    config: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-memory"],
    },
  },
  {
    id: "sequential-thinking",
    name: "Sequential Thinking Engine",
    category: "Reasoning",
    badge: "Chain-of-Thought",
    description:
      "Structured multi-step problem decomposition and reflective debugging for complex system refactors.",
    config: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    },
  },
  {
    id: "brave-search",
    name: "Brave Web & Docs Search",
    category: "Web Search",
    badge: "Live Docs",
    description:
      "Query real-time web documentation, RFCs, and package changelogs using the Brave Search API.",
    config: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-brave-search"],
      env: {
        BRAVE_API_KEY: "<YOUR_BRAVE_API_KEY>",
      },
    },
  },
];

export function McpStackBuilder() {
  const [selectedIds, setSelectedIds] = useState<string[]>([
    "castov",
    "github",
    "postgres",
  ]);
  const [ideTarget, setIdeTarget] = useState<IdeTarget>("cursor");
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);

  // Hydration-safe query param loader
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const stackParam = params.get("stack");
      if (stackParam) {
        const validIds = POPULAR_MCP_SERVERS.map((s) => s.id);
        const parsed = stackParam
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter((id) => validIds.includes(id));
        if (!parsed.includes("castov")) {
          parsed.unshift("castov");
        }
        if (parsed.length > 0) {
          setSelectedIds(Array.from(new Set(parsed)));
        }
      }
    } catch {
      // ignore URL parsing errors
    }
  }, []);

  const toggleServer = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least 1 selected
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const generatedJson = useMemo(() => {
    const chosen = POPULAR_MCP_SERVERS.filter((s) => selectedIds.includes(s.id));
    if (ideTarget === "vscode") {
      const serversObj: Record<string, unknown> = {};
      for (const s of chosen) {
        serversObj[s.id] = {
          type: "stdio",
          command: s.config.command,
          args: s.config.args,
          ...(s.config.env ? { env: s.config.env } : {}),
        };
      }
      return JSON.stringify({ servers: serversObj }, null, 2);
    }

    const mcpServersObj: Record<string, unknown> = {};
    for (const s of chosen) {
      mcpServersObj[s.id] = {
        command: s.config.command,
        args: s.config.args,
        ...(s.config.env ? { env: s.config.env } : {}),
      };
    }
    return JSON.stringify({ mcpServers: mcpServersObj }, null, 2);
  }, [selectedIds, ideTarget]);

  const shareUrl = useMemo(() => {
    const stackQuery = selectedIds.join(",");
    return `https://castov.com/mcp?stack=${encodeURIComponent(stackQuery)}`;
  }, [selectedIds]);

  const markdownBadge = `[![MCP Server: Castov Grade A](https://castov.com/api/badge/mcp.svg)](https://castov.com/mcp)`;

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(generatedJson);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareUrl(true);
    setTimeout(() => setCopiedShareUrl(false), 2000);
  };

  const handleCopyBadge = () => {
    navigator.clipboard.writeText(markdownBadge);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
  };

  const xShareHref = useMemo(() => {
    const text = `My AI Coding Agent MCP Stack (${selectedIds.length} servers including @castovdev Grade-A DevSecOps MCP):\n\nBuild & copy your 1-click Cursor / Claude config 👇`;
    return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
  }, [selectedIds.length, shareUrl]);

  return (
    <div className="space-y-8">
      {/* Main Stack Composer Card */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden shadow-xl">
        <div className="p-5 sm:p-6 bg-field border-b border-line flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-accent uppercase tracking-wider mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Multi-Server Config Generator</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-fg">
              MCP Stack Composer (Cursor, Claude &amp; Windsurf)
            </h3>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Select the MCP servers you use to generate a unified{" "}
              <code className="text-fg bg-card px-1.5 py-0.5 rounded border border-line">
                mcp.json
              </code>{" "}
              configuration file and shareable team link.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyShareUrl}
              className="btn bg-card border border-line text-fg hover:border-accent text-xs font-bold px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5"
            >
              {copiedShareUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied Stack Link!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-accent" />
                  <span>Share Stack URL</span>
                </>
              )}
            </button>

            <a
              href={xShareHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-bold px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Share on X</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Server Selection Grid */}
        <div className="p-5 sm:p-6 grid sm:grid-cols-2 gap-3 border-b border-line">
          {POPULAR_MCP_SERVERS.map((server) => {
            const isSelected = selectedIds.includes(server.id);
            return (
              <button
                key={server.id}
                type="button"
                onClick={() => toggleServer(server.id)}
                className={`text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
                  isSelected
                    ? "bg-[#2563eb]/10 border-[#2563eb]/50 shadow-sm"
                    : "bg-field/40 border-line hover:border-line/80 opacity-80 hover:opacity-100"
                }`}
              >
                <div
                  className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? "bg-[#2563eb] border-[#2563eb] text-white"
                      : "border-muted/40 bg-card"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-sm text-fg truncate">
                      {server.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                        server.featured
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-card text-muted border border-line"
                      }`}
                    >
                      {server.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                    {server.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Generated Config Output */}
        <div className="p-5 sm:p-6 bg-[#070b14]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: "cursor", label: "Cursor (.cursor/mcp.json)" },
                  { id: "claude", label: "Claude Desktop" },
                  { id: "windsurf", label: "Windsurf" },
                  { id: "vscode", label: "VS Code (.vscode/mcp.json)" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setIdeTarget(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    ideTarget === tab.id
                      ? "bg-[#2563eb] text-white font-bold"
                      : "bg-white/10 text-slate-300 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCopyConfig}
              className="btn bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-1.5"
            >
              {copiedConfig ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied Combined Config ({selectedIds.length} Servers)!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Combined Config ({selectedIds.length})</span>
                </>
              )}
            </button>
          </div>

          <pre className="text-xs sm:text-sm font-mono text-emerald-300 overflow-x-auto leading-relaxed p-4 rounded-xl bg-black/40 border border-white/10">
            <code className="text-emerald-300">{generatedJson}</code>
          </pre>
        </div>
      </div>

      {/* GitHub README Badge Generator for Viral Backlinks */}
      <div className="rounded-2xl border border-line bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Open-Source Repository Badge</span>
          </div>
          <h4 className="text-base sm:text-lg font-bold text-fg">
            Add the Official &ldquo;MCP Ready&rdquo; Badge to your GitHub README
          </h4>
          <p className="text-xs text-muted mt-1">
            Show contributors that your project uses deterministic local DevSecOps &amp; MCP tooling:
          </p>
          <code className="mt-2 block text-xs font-mono text-accent bg-field px-3 py-2 rounded-lg border border-line break-all">
            {markdownBadge}
          </code>
        </div>

        <button
          type="button"
          onClick={handleCopyBadge}
          className="btn bg-field border border-line text-fg hover:border-accent text-xs font-bold px-4 py-2.5 rounded-xl shrink-0 inline-flex items-center gap-2"
        >
          {copiedBadge ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Copied Markdown!</span>
            </>
          ) : (
            <>
              <Code2 className="w-4 h-4 text-accent" />
              <span>Copy README Badge</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
