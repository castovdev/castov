"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Activity,
  Cpu,
  Monitor,
  RotateCcw,
  ShieldCheck,
  Download,
  Users,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  Layers,
} from "lucide-react";

interface McpStatsData {
  wau: number;
  mau: number;
  totalCalls: number;
  totalErrors: number;
  errorRate: number;
  clients: Record<string, number>;
  tools: Array<{
    name: string;
    calls: number;
    errors: number;
    errorRate: number;
    avgDurationMs: number;
  }>;
  osFamily: Record<string, number>;
  versions: Record<string, number>;
  recentPings: Array<{
    created_at: string;
    event_type: string;
    client_name?: string;
    tool_name?: string;
    os_family?: string;
    success?: boolean;
  }>;
}

interface LegacyWebStatsData {
  totalEvents: number;
  configCopies: {
    total: 0;
    byClient: Record<string, number>;
    byPlatform: { windows: number; standard: number };
  };
  topTools: Record<string, number>;
  recentEvents: Array<{
    name: string;
    props?: Record<string, unknown>;
    timestamp: number;
  }>;
}

export function DashboardAnalytics() {
  const [activeSubTab, setActiveSubTab] = useState<"mcp" | "web">("mcp");

  // Phase 3 MCP Stats
  const [mcpStats, setMcpStats] = useState<McpStatsData | null>(null);
  const [mcpLoading, setMcpLoading] = useState(true);
  const [is404, setIs404] = useState(false);

  // Existing In-Memory Web Stats (Kept intact)
  const [webStats, setWebStats] = useState<LegacyWebStatsData | null>(null);
  const [webLoading, setWebLoading] = useState(true);

  const fetchMcpStats = () => {
    setMcpLoading(true);
    fetch("/api/analytics/mcp/stats")
      .then((res) => {
        if (res.status === 404) {
          setIs404(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.ok && data.stats) {
          setMcpStats(data.stats);
        }
      })
      .catch(() => {})
      .finally(() => setMcpLoading(false));
  };

  const fetchWebStats = () => {
    setWebLoading(true);
    fetch("/api/analytics/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.stats) {
          setWebStats(data.stats);
        }
      })
      .catch(() => {})
      .finally(() => setWebLoading(false));
  };

  useEffect(() => {
    fetchMcpStats();
    fetchWebStats();
  }, []);

  if (is404) {
    return (
      <div className="rounded-2xl border border-line bg-card p-12 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-danger/10 text-danger flex items-center justify-center font-bold">
          404
        </div>
        <h3 className="text-lg font-bold text-fg">Analytics Dashboard Not Found</h3>
        <p className="text-xs text-muted max-w-sm mx-auto">
          This telemetry panel is restricted strictly to the verified platform owner.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold text-fg">Developer Usage &amp; MCP Telemetry</h2>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Privacy-preserving telemetry measuring real-world Castov MCP Server and CLI adoption.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
          {activeSubTab === "mcp" && (
            <a
              href="/api/analytics/mcp/stats?format=csv"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-field hover:bg-hover text-xs font-semibold text-fg transition-colors"
              title="Download Telemetry raw CSV export"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span>Export CSV</span>
            </a>
          )}

          <button
            type="button"
            onClick={activeSubTab === "mcp" ? fetchMcpStats : fetchWebStats}
            disabled={mcpLoading || webLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-field hover:bg-hover text-xs font-semibold text-fg transition-colors cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${(mcpLoading || webLoading) ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Selector */}
      <div className="flex items-center gap-2 border-b border-line/60 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab("mcp")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "mcp"
              ? "bg-accent text-accent-fg"
              : "text-muted hover:text-fg bg-transparent"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>MCP Server &amp; CLI Analytics</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("web")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "web"
              ? "bg-accent text-accent-fg"
              : "text-muted hover:text-fg bg-transparent"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Web Client Buffer</span>
        </button>
      </div>

      {/* TAB 1: PERSISTENT MCP & CLI ANALYTICS */}
      {activeSubTab === "mcp" && (
        <div className="space-y-6">
          {mcpLoading && !mcpStats ? (
            <div className="p-8 text-center text-xs font-mono text-muted animate-pulse">
              Computing persistent MCP telemetry metrics...
            </div>
          ) : mcpStats ? (
            <div className="space-y-6">
              {/* Top 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between text-muted mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Weekly Active Users (WAU)</span>
                    <Users className="w-4 h-4 text-accent" />
                  </div>
                  <div className="text-2xl font-bold text-fg font-mono">{mcpStats.wau}</div>
                  <p className="text-[11px] text-muted mt-1">Unique install hashes (last 7d)</p>
                </div>

                <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between text-muted mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Monthly Active Users (MAU)</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-fg font-mono">{mcpStats.mau}</div>
                  <p className="text-[11px] text-muted mt-1">Unique install hashes (last 30d)</p>
                </div>

                <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between text-muted mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total MCP Invocations</span>
                    <Terminal className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-2xl font-bold text-fg font-mono">{mcpStats.totalCalls}</div>
                  <p className="text-[11px] text-muted mt-1">Aggregated tool executions</p>
                </div>

                <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between text-muted mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Tool Error Rate</span>
                    {mcpStats.errorRate > 10 ? (
                      <AlertTriangle className="w-4 h-4 text-danger" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div className={`text-2xl font-bold font-mono ${mcpStats.errorRate > 10 ? "text-danger" : "text-fg"}`}>
                    {mcpStats.errorRate}%
                  </div>
                  <p className="text-[11px] text-muted mt-1">{mcpStats.totalErrors} total failures reported</p>
                </div>
              </div>

              {/* Client Breakdown & OS Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Breakdown */}
                <div className="rounded-2xl border border-line bg-card p-5 space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold text-fg uppercase tracking-wider font-mono text-muted flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-accent" />
                    <span>MCP Client Breakdown (Claude, Cursor, CLI)</span>
                  </h3>
                  {Object.keys(mcpStats.clients).length === 0 ? (
                    <p className="text-xs text-muted italic">No client usage recorded yet.</p>
                  ) : (
                    <div className="space-y-3 font-mono text-xs">
                      {Object.entries(mcpStats.clients).map(([client, count]) => {
                        const pct = mcpStats.totalCalls > 0 ? ((count / mcpStats.totalCalls) * 100).toFixed(1) : "0";
                        return (
                          <div key={client} className="space-y-1">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-fg font-semibold">{client}</span>
                              <span className="text-muted">{count} calls ({pct}%)</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-field overflow-hidden">
                              <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* OS & Version Distribution */}
                <div className="rounded-2xl border border-line bg-card p-5 space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold text-fg uppercase tracking-wider font-mono text-muted flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-emerald-400" />
                    <span>OS Platform &amp; CLI Versions</span>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] text-muted uppercase font-mono">Operating Systems:</span>
                      <div className="flex gap-2 flex-wrap mt-1.5 font-mono text-xs">
                        {Object.entries(mcpStats.osFamily).map(([os, count]) => (
                          <span key={os} className="px-2.5 py-1 rounded-lg border border-line bg-field text-fg">
                            {os === "darwin" ? "macOS" : os === "win32" ? "Windows" : os}: <strong className="text-accent">{count}</strong>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-line/60">
                      <span className="text-[11px] text-muted uppercase font-mono">CLI Versions:</span>
                      <div className="flex gap-2 flex-wrap mt-1.5 font-mono text-xs">
                        {Object.entries(mcpStats.versions).map(([ver, count]) => (
                          <span key={ver} className="px-2.5 py-1 rounded-lg border border-line bg-field text-fg">
                            v{ver}: <strong className="text-accent">{count}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tool Performance Ranking Table */}
              <div className="rounded-2xl border border-line bg-card p-5 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-fg uppercase tracking-wider font-mono text-muted flex items-center gap-2">
                  <Layers className="w-4 h-4 text-accent" />
                  <span>Tool Usage Ranking &amp; Performance</span>
                </h3>

                {mcpStats.tools.length === 0 ? (
                  <p className="text-xs text-muted italic">No tool calls logged yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="border-b border-line text-[11px] text-muted uppercase">
                          <th className="pb-2">Tool Name</th>
                          <th className="pb-2 text-right">Invocations</th>
                          <th className="pb-2 text-right">Errors</th>
                          <th className="pb-2 text-right">Error %</th>
                          <th className="pb-2 text-right">Avg Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {mcpStats.tools.map((t) => (
                          <tr key={t.name} className="hover:bg-hover/40 transition-colors">
                            <td className="py-2.5 font-bold text-fg">{t.name}</td>
                            <td className="py-2.5 text-right text-fg">{t.calls}</td>
                            <td className="py-2.5 text-right text-muted">{t.errors}</td>
                            <td className={`py-2.5 text-right font-semibold ${t.errorRate > 10 ? "text-danger" : "text-emerald-500"}`}>
                              {t.errorRate}%
                            </td>
                            <td className="py-2.5 text-right text-muted">{t.avgDurationMs}ms</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: EXISTING IN-MEMORY WEB BUFFER (KEPT INTACT) */}
      {activeSubTab === "web" && (
        <div className="space-y-6">
          {webLoading && !webStats ? (
            <div className="p-8 text-center text-xs font-mono text-muted animate-pulse">
              Computing web event analytics...
            </div>
          ) : webStats ? (
            <div className="space-y-6">
              {/* Top 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-line bg-card p-5">
                  <div className="flex items-center justify-between text-muted mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Recorded Events</span>
                    <Activity className="w-4 h-4 text-accent" />
                  </div>
                  <div className="text-2xl font-bold text-fg font-mono">{webStats.totalEvents}</div>
                  <p className="text-xs text-muted mt-1">Live buffer session</p>
                </div>

                <div className="rounded-xl border border-line bg-card p-5">
                  <div className="flex items-center justify-between text-muted mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">MCP Config Copies</span>
                    <Cpu className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-fg font-mono">{webStats.configCopies.total}</div>
                  <p className="text-xs text-muted mt-1">Web UI clicks</p>
                </div>

                <div className="rounded-xl border border-line bg-card p-5">
                  <div className="flex items-center justify-between text-muted mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Platform: Windows</span>
                    <Monitor className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-2xl font-bold text-fg font-mono">{webStats.configCopies.byPlatform.windows}</div>
                  <p className="text-xs text-muted mt-1">cmd /c wrapper clicks</p>
                </div>

                <div className="rounded-xl border border-line bg-card p-5">
                  <div className="flex items-center justify-between text-muted mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Zero-Data Logging</span>
                    <ShieldCheck className="w-4 h-4 text-accent" />
                  </div>
                  <div className="text-2xl font-bold text-fg font-mono">100%</div>
                  <p className="text-xs text-muted mt-1">Zero secrets retained</p>
                </div>
              </div>

              {/* Live Event Stream */}
              <div className="rounded-2xl border border-line bg-card p-5 space-y-3">
                <h3 className="text-sm font-bold text-fg uppercase tracking-wider font-mono text-muted">
                  Live Web Event Activity Stream (Latest 15)
                </h3>
                {webStats.recentEvents.length === 0 ? (
                  <p className="text-xs text-muted italic">No recent events.</p>
                ) : (
                  <div className="space-y-1.5 font-mono text-[11px] overflow-x-auto">
                    {webStats.recentEvents.map((ev, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-field/60 border border-line/60 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-accent font-bold">{ev.name}</span>
                          <span className="text-muted">{JSON.stringify(ev.props || {})}</span>
                        </div>
                        <span className="text-muted text-[10px] shrink-0">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
