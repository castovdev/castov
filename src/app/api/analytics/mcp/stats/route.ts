import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isVerifiedOwner, getConfiguredOwnerEmail } from "@/lib/owner-auth";

const NOT_FOUND = () => NextResponse.json({ ok: false, error: "Not Found" }, { status: 404 });

/** Neutralize CSV/formula injection: prefix cells starting with = + - @ (or tab/CR) with a quote. */
export function csvSafeCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  try {
    // 1. Strict server-side owner guard: ADMIN_EMAIL unset or non-owner => 404
    if (!getConfiguredOwnerEmail()) return NOT_FOUND();

    let user = null;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {
      return NOT_FOUND();
    }
    if (!isVerifiedOwner(user)) return NOT_FOUND();

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");

    const adminDb = createAdminClient();
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: "Service unavailable" }, { status: 503 });
    }

    // 2. CSV Export Handler
    if (format === "csv") {
      const { data: rawEvents } = await adminDb
        .from("mcp_telemetry_events")
        .select("created_at,event_type,client_name,tool_name,castov_version,os_family,call_count,error_count,total_duration_ms,success")
        .order("created_at", { ascending: false })
        .limit(5000);

      const rows = [
        ["timestamp", "event_type", "client_name", "tool_name", "castov_version", "os_family", "call_count", "error_count", "total_duration_ms", "success"],
      ];

      for (const ev of rawEvents || []) {
        rows.push([
          ev.created_at,
          ev.event_type || "",
          ev.client_name || "",
          ev.tool_name || "",
          ev.castov_version || "",
          ev.os_family || "",
          String(ev.call_count ?? 1),
          String(ev.error_count ?? 0),
          String(ev.total_duration_ms ?? 0),
          String(ev.success ?? true),
        ]);
      }

      const csvContent = rows
        .map((r) => r.map((cell) => csvSafeCell(cell)).join(","))
        .join("\n");

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="castov_mcp_analytics_${new Date().toISOString().slice(0, 10)}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // 3. Compute Aggregated Metrics
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch raw recent events (last 30 days)
    const { data: recentEvents, error } = await adminDb
      .from("mcp_telemetry_events")
      .select("*")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(10000);

    if (error) {
      // Return empty stats structure if table not populated yet
      return NextResponse.json({
        ok: true,
        stats: {
          wau: 0,
          mau: 0,
          totalCalls: 0,
          totalErrors: 0,
          errorRate: 0,
          clients: {},
          tools: [],
          osFamily: {},
          versions: {},
          recentPings: [],
        },
      });
    }

    const events = recentEvents || [];

    // Unique installs (WAU / MAU)
    const wauInstalls = new Set<string>();
    const mauInstalls = new Set<string>();

    let totalCalls = 0;
    let totalErrors = 0;
    const clientCounts: Record<string, number> = {};
    const osCounts: Record<string, number> = {};
    const versionCounts: Record<string, number> = {};
    const toolMap = new Map<string, { calls: number; errors: number; totalDurationMs: number }>();

    for (const ev of events) {
      if (ev.install_hash) {
        mauInstalls.add(ev.install_hash);
        if (ev.created_at >= sevenDaysAgo) {
          wauInstalls.add(ev.install_hash);
        }
      }

      const calls = ev.call_count || 1;
      const errors = ev.error_count || (ev.success === false ? 1 : 0);
      totalCalls += calls;
      totalErrors += errors;

      const client = ev.client_name || "unknown";
      clientCounts[client] = (clientCounts[client] || 0) + calls;

      const os = ev.os_family || "other";
      osCounts[os] = (osCounts[os] || 0) + calls;

      const ver = ev.castov_version || "unknown";
      versionCounts[ver] = (versionCounts[ver] || 0) + calls;

      if (ev.tool_name) {
        const existing = toolMap.get(ev.tool_name) || { calls: 0, errors: 0, totalDurationMs: 0 };
        existing.calls += calls;
        existing.errors += errors;
        existing.totalDurationMs += ev.total_duration_ms || 0;
        toolMap.set(ev.tool_name, existing);
      }
    }

    const toolsRanking = Array.from(toolMap.entries())
      .map(([name, s]) => ({
        name,
        calls: s.calls,
        errors: s.errors,
        errorRate: s.calls > 0 ? Number(((s.errors / s.calls) * 100).toFixed(1)) : 0,
        avgDurationMs: s.calls > 0 ? Math.round(s.totalDurationMs / s.calls) : 0,
      }))
      .sort((a, b) => b.calls - a.calls);

    const errorRate = totalCalls > 0 ? Number(((totalErrors / totalCalls) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      ok: true,
      stats: {
        wau: wauInstalls.size,
        mau: mauInstalls.size,
        totalCalls,
        totalErrors,
        errorRate,
        clients: clientCounts,
        tools: toolsRanking,
        osFamily: osCounts,
        versions: versionCounts,
        recentPings: events.slice(0, 10).map((e) => ({
          created_at: e.created_at,
          event_type: e.event_type,
          client_name: e.client_name,
          tool_name: e.tool_name,
          os_family: e.os_family,
          success: e.success,
        })),
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
