import { NextResponse } from "next/server";
import { getEventsBuffer } from "../track/route";

export async function GET() {
  try {
    const events = getEventsBuffer();

    const stats = {
      totalEvents: events.length,
      configCopies: {
        total: 0,
        byClient: {} as Record<string, number>,
        byPlatform: { windows: 0, standard: 0 },
      },
      topTools: {} as Record<string, number>,
      recentEvents: events.slice(0, 15),
    };

    for (const ev of events) {
      if (ev.name === "mcp_copy_config") {
        stats.configCopies.total++;
        const client = String(ev.props?.client || "unknown");
        stats.configCopies.byClient[client] = (stats.configCopies.byClient[client] || 0) + 1;

        const platform = String(ev.props?.platform || "standard");
        if (platform === "windows") {
          stats.configCopies.byPlatform.windows++;
        } else {
          stats.configCopies.byPlatform.standard++;
        }
      }

      if (ev.name === "mcp_rerun_tool" || ev.name === "mcp_inspect_tool") {
        const tool = String(ev.props?.tool || "unknown");
        stats.topTools[tool] = (stats.topTools[tool] || 0) + 1;
      }
    }

    return NextResponse.json({ ok: true, stats });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to compute stats" }, { status: 500 });
  }
}
