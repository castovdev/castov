"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, Copy, Check, Terminal, ExternalLink, ArrowRight, ShieldCheck } from "lucide-react";

interface SavedStack {
  id: string;
  name: string;
  servers: string[];
  createdAt: number;
}

export function DashboardMcpStacks() {
  const [stacks, setStacks] = useState<SavedStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/mcp-stacks")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.stacks)) {
          setStacks(data.stacks);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCopyCmd = (name: string, id: string) => {
    navigator.clipboard.writeText(`castov mcp pull ${name} --write`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-fg flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent" />
            <span>Saved Cloud MCP Stacks</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Synchronized configurations accessible directly in terminal via{" "}
            <code className="text-accent bg-field px-1.5 py-0.5 rounded font-mono">
              castov mcp pull &lt;name&gt;
            </code>
          </p>
        </div>
        <Link
          href="/mcp"
          className="btn bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-1.5 self-start sm:self-center shadow-sm"
        >
          <span>Compose New Stack</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs font-mono text-muted animate-pulse">
          Loading cloud stacks...
        </div>
      ) : stacks.length === 0 ? (
        <div className="p-8 rounded-2xl border border-line bg-card text-center">
          <Layers className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-fg">No saved MCP stacks yet</p>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto mb-4">
            Create custom multi-server toolchains for Cursor, Claude Desktop, and VS Code in the Stack Composer.
          </p>
          <Link
            href="/mcp"
            className="btn bg-field border border-line text-xs font-semibold px-4 py-2 rounded-xl inline-flex items-center gap-1.5"
          >
            <span>Open MCP Stack Composer</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {stacks.map((st) => (
            <div
              key={st.id}
              className="p-5 rounded-2xl border border-line bg-card hover:border-line/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-accent bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-lg">
                    {st.name}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> {st.servers.length} servers
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {st.servers.map((srv) => (
                    <span
                      key={srv}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-field border border-line text-fg"
                    >
                      {srv}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyCmd(st.name, st.id)}
                  className="btn bg-field border border-line hover:border-accent text-fg text-xs font-mono font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5"
                  title="Copy terminal command"
                >
                  {copiedId === st.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Terminal className="w-3.5 h-3.5 text-accent" />
                      <span>castov mcp pull {st.name}</span>
                      <Copy className="w-3 h-3 text-muted ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
