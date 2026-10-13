import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function getSafeRedirectUrl(target: string | null, fallback = "/tools"): string {
  if (!target) return fallback;
  const trimmed = target.trim();
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\") &&
    !trimmed.includes(":")
  ) {
    return trimmed;
  }
  return fallback;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const safeNext = getSafeRedirectUrl(rawNext, "/tools");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(safeNext, origin));
    }
  }

  // Return the user to login with error feedback if exchange fails
  return NextResponse.redirect(new URL("/login?error=auth_callback_failed", origin));
}
