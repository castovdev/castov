"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal, Cpu, ShieldCheck, Sparkles } from "lucide-react";

type ClientId = "claude" | "cursor" | "windsurf" | "vscode" | "docker";

interface ClientConfig {
  id: ClientId;
  name: string;
  badge: string;
  configPath: string;
  code: string;
  notes: string;
}

const MCP_CLIENTS: ClientConfig[] = [
  {
    id: "claude",
    name: "Claude Desktop",
    badge: "Anthropic Official",
    configPath: "~/Library/Application Support/Claude/claude_desktop_config.json (macOS) • %APPDATA%\\Claude\\claude_desktop_config.json (Windows)",
    code: `{
  "mcpServers": {
    "castov": {
      "command": "npx",
      "args": ["-y", "castov@latest", "mcp"]
    }
  }
}`,
    notes: "Restart Claude Desktop after saving. Look for the 🔨 hammer icon showing 10 Castov local tools."
  },
  {
    id: "cursor",
    name: "Cursor IDE",
    badge: ".cursor/mcp.json",
    configPath: "Project root: .cursor/mcp.json • Or Cursor Settings → Features → MCP Servers",
    code: `{
  "mcpServers": {
    "castov": {
      "command": "npx",
      "args": ["-y", "castov@latest", "mcp"]
    }
  }
}`,
    notes: "Works automatically in Cursor Agent & Composer mode with readOnlyHint safety annotations enabled."
  },
  {
    id: "windsurf",
    name: "Windsurf (Codeium)",
    badge: "mcp_config.json",
    configPath: "~/.codeium/windsurf/mcp_config.json",
    code: `{
  "mcpServers": {
    "castov": {
      "command": "npx",
      "args": ["-y", "castov@latest", "mcp"]
    }
  }
}`,
    notes: "Cascade agent can invoke all 10 deterministic Castov tools without cloud roundtrips."
  },
  {
    id: "vscode",
    name: "VS Code (Copilot MCP)",
    badge: ".vscode/mcp.json",
    configPath: "Workspace: .vscode/mcp.json",
    code: `{
  "servers": {
    "castov": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "castov@latest", "mcp"]
    }
  }
}`,
    notes: "Compatible with VS Code GitHub Copilot Agent mode using native stdio transport."
  },
  {
    id: "docker",
    name: "Docker Container",
    badge: "Isolated Alpine Runtime",
    configPath: "Zero-host-dependency containerized stdio execution",
    code: `{
  "mcpServers": {
    "castov": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "castovdev/castov:latest", "mcp"]
    }
  }
}`,
    notes: "Runs inside an isolated non-root Alpine Linux container (USER node)."
  }
];

export function McpConfigCopier() {
  const [activeClient, setActiveClient] = useState<ClientId>("claude");
  const [copied, setCopied] = useState(false);

  const current = MCP_CLIENTS.find((c) => c.id === activeClient)!;

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-line bg-card overflow-hidden shadow-xl">
      <div className="p-3 sm:p-4 bg-field border-b border-line flex flex-wrap gap-2">
        {MCP_CLIENTS.map((client) => {
          const isActive = client.id === activeClient;
          return (
            <button
              key={client.id}
              type="button"
              onClick={() => setActiveClient(client.id)}
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

      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                {current.badge}
              </span>
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Zero-Telemetry Stdio
              </span>
            </div>
            <p className="text-xs font-mono text-muted break-all">{current.configPath}</p>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="btn bg-accent text-white hover:bg-accent/90 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 self-start sm:self-center shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied Config!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy JSON Config</span>
              </>
            )}
          </button>
        </div>

        <div className="rounded-xl bg-[#070b14] border border-white/10 p-4 sm:p-5 font-mono text-xs sm:text-sm text-[#f4f4f5] overflow-x-auto">
          <pre className="leading-relaxed">
            <code>{current.code}</code>
          </pre>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted">
          <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>{current.notes}</span>
        </div>
      </div>
    </div>
  );
}
