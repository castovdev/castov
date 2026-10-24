"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, Activity, Cpu, Monitor, RotateCcw, ShieldCheck } from "lucide-react";

interface StatsData {
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
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    fetch("/api/analytics/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.stats) {
          setStats(data.stats);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let mounted = true;
    fetch("/api/analytics/stats")
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data.ok && data.stats) {
          setStats(data.stats);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-fg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            <span>Developer Analytics &amp; Tool Telemetry</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Real-time privacy-respecting client event insights across MCP config copies, platforms, and tool inspectors.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchStats}
          disabled={loading}
          className="btn bg-field border border-line text-xs font-semibold px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 self-start sm:self-center hover:bg-hover"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {loading && !stats ? (
        <div className="p-8 text-center text-xs font-mono text-muted animate-pulse">
          Computing analytics...
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-line bg-card p-5">
              <div className="flex items-center justify-between text-muted mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Recorded Events</span>
                <Activity className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-bold text-fg font-mono">{stats.totalEvents}</div>
              <p className="text-xs text-muted mt-1">Live buffer session</p>
            </div>

            <div className="rounded-xl border border-line bg-card p-5">
              <div className="flex items-center justify-between text-muted mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">MCP Config Copies</span>
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-fg font-mono">{stats.configCopies.total}</div>
              <p className="text-xs text-muted mt-1">Cursor, Claude &amp; VS Code</p>
            </div>

            <div className="rounded-xl border border-line bg-card p-5">
              <div className="flex items-center justify-between text-muted mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Windows vs Mac</span>
                <Monitor className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-sm font-mono font-bold text-fg flex items-center gap-2 mt-1">
                <span className="text-amber-400">Win: {stats.configCopies.byPlatform.windows}</span>
                <span className="text-muted">•</span>
                <span className="text-emerald-400">Mac/Linux: {stats.configCopies.byPlatform.standard}</span>
              </div>
              <p className="text-xs text-muted mt-1">OS config selection</p>
            </div>

            <div className="rounded-xl border border-line bg-card p-5">
              <div className="flex items-center justify-between text-muted mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Privacy Posture</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-sm font-bold text-emerald-400 mt-1">Zero Payload Storage</div>
              <p className="text-xs text-muted mt-1">No cookies, no PII tracking</p>
            </div>
          </div>

          {/* Breakdown Panels */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* By Client Breakdown */}
            <div className="rounded-2xl border border-line bg-card p-5 space-y-3">
              <h3 className="text-sm font-bold text-fg uppercase tracking-wider font-mono text-muted">
                Config Copies by AI Client
              </h3>
              {Object.keys(stats.configCopies.byClient).length === 0 ? (
                <p className="text-xs text-muted italic">No copy events captured yet.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(stats.configCopies.byClient).map(([client, count]) => (
                    <div key={client} className="flex items-center justify-between text-xs font-mono">
                      <span className="capitalize text-fg">{client}</span>
                      <span className="text-accent font-bold bg-accent/10 px-2 py-0.5 rounded">
                        {count} copies
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Inspected Tools */}
            <div className="rounded-2xl border border-line bg-card p-5 space-y-3">
              <h3 className="text-sm font-bold text-fg uppercase tracking-wider font-mono text-muted">
                Most Inspected / Re-Run Tools
              </h3>
              {Object.keys(stats.topTools).length === 0 ? (
                <p className="text-xs text-muted italic">No tool inspections captured yet.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(stats.topTools).map(([tool, count]) => (
                    <div key={tool} className="flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-400">{tool}</span>
                      <span className="text-fg font-bold bg-field px-2 py-0.5 rounded">
                        {count} runs
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Event Stream */}
          <div className="rounded-2xl border border-line bg-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-fg uppercase tracking-wider font-mono text-muted">
              Live Event Activity Stream (Latest 15)
            </h3>
            {stats.recentEvents.length === 0 ? (
              <p className="text-xs text-muted italic">No recent events.</p>
            ) : (
              <div className="space-y-1.5 font-mono text-[11px] overflow-x-auto">
                {stats.recentEvents.map((ev, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-field/60 border border-line/60 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-accent font-bold">{ev.name}</span>
                      <span className="text-muted">
                        {JSON.stringify(ev.props || {})}
                      </span>
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
  );
}
