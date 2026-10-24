import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";

interface AnalyticsEvent {
  name: string;
  props?: Record<string, unknown>;
  timestamp: number;
}

// In-memory ring buffer of events for immediate dashboard inspection
const MAX_EVENTS = 500;
const EVENT_BUFFER: AnalyticsEvent[] = [];

export function getEventsBuffer(): AnalyticsEvent[] {
  return EVENT_BUFFER;
}

export async function POST(request: Request) {
  try {
    const rateCheck = checkRateLimit(request, {
      limit: 120,
      windowMs: 60000,
      identifier: "analytics_track",
    });
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ ok: false, error: "Invalid event name" }, { status: 400 });
    }

    const safeName = body.name.trim().slice(0, 64);
    const sanitizedProps: Record<string, string | number | boolean> = {};

    if (typeof body.props === "object" && body.props !== null && !Array.isArray(body.props)) {
      const entries = Object.entries(body.props).slice(0, 20);
      for (const [key, val] of entries) {
        const safeKey = String(key).slice(0, 64);
        if (typeof val === "string") {
          sanitizedProps[safeKey] = val.slice(0, 256);
        } else if (typeof val === "number" && Number.isFinite(val)) {
          sanitizedProps[safeKey] = val;
        } else if (typeof val === "boolean") {
          sanitizedProps[safeKey] = val;
        }
      }
    }

    const event: AnalyticsEvent = {
      name: safeName,
      props: sanitizedProps,
      timestamp: Date.now(),
    };

    EVENT_BUFFER.unshift(event);
    if (EVENT_BUFFER.length > MAX_EVENTS) {
      EVENT_BUFFER.pop();
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
