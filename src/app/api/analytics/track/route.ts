import { NextResponse } from "next/server";

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
    const body = await request.json().catch(() => null);
    if (!body || typeof body.name !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const event: AnalyticsEvent = {
      name: body.name,
      props: typeof body.props === "object" && body.props !== null ? body.props : {},
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
