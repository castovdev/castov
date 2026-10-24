import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!email || !emailRegex.test(email) || email.length > 255) {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid developer email address." },
        { status: 400 }
      );
    }

    const safeSource = typeof body.source === "string" ? body.source.slice(0, 64) : "footer_1click";

    // 1. Save to Supabase newsletter_subscribers if configured
    try {
      const supabase = await createClient();
      await supabase.from("newsletter_subscribers").upsert(
        {
          email,
          subscribed_at: new Date().toISOString(),
          status: "active",
          source: safeSource,
        },
        { onConflict: "email" }
      );
    } catch {
      // Gracefully continue even if table does not exist yet
    }

    // 2. Dispatch email via Resend if RESEND_API_KEY is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Castov Developer Updates <updates@castov.com>",
            to: [email],
            subject: "Welcome to Castov Developer Releases & Security Advisories",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff;">
                <h2 style="color: #0f172a; margin-bottom: 12px;">You're subscribed to Castov Updates</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                  You'll receive notifications for major CLI releases (v1.5+), new MCP tools, and local DevSecOps security advisories.
                </p>
                <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
                  No tracking pixels, no behavioral telemetry, and no third-party ad networks. You can unsubscribe at any time from your account dashboard.
                </p>
              </div>
            `,
          }),
        });
      } catch {
        // Resend delivery error logged without blocking response
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Successfully subscribed to developer updates.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred while subscribing." },
      { status: 500 }
    );
  }
}
