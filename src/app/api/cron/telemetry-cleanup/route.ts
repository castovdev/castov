import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(request: Request) {
  try {
    // 1. Authorization guard via CRON_SECRET (fails closed if unconfigured or mismatched)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 2. Execute the roll_up_mcp_telemetry_daily function in PostgreSQL
    const { data, error } = await supabase.rpc("roll_up_mcp_telemetry_daily");

    if (error) {
      // If RPC is unavailable or failed, fallback to direct query cleanup
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { error: deleteError } = await supabase
        .from("mcp_telemetry_events")
        .delete()
        .lt("created_at", ninetyDaysAgo);

      if (deleteError) {
        return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        mode: "direct_cleanup",
        olderThan: ninetyDaysAgo,
      });
    }

    return NextResponse.json({
      ok: true,
      result: data,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Cron error" }, { status: 500 });
  }
}
