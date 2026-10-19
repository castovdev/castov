import { HTTP_STATUS_CODES } from "@/lib/http-statuses";
import { NULL_BODY_STATUSES, REDIRECT_STATUSES, isMockableStatus, recommendedHeaders } from "@/lib/http-status-guides";

/**
 * Public HTTP status mock endpoint.
 *   GET|POST|PUT|PATCH|DELETE|HEAD /api/mock/{200-599}?delay=1500
 * Returns the requested status with realistic headers so developers can test
 * how their client handles errors, retries, redirects, and timeouts.
 */

export const dynamic = "force-dynamic";

const MAX_DELAY_MS = 5000;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "Retry-After, Location, WWW-Authenticate, Allow, X-Castov-Mock, X-Castov-Delay",
  "Access-Control-Max-Age": "86400",
};

type Ctx = { params: Promise<{ code: string }> };

async function handle(request: Request, { params }: Ctx): Promise<Response> {
  const { code } = await params;
  const url = new URL(request.url);
  const isHead = request.method === "HEAD";

  const baseHeaders: Record<string, string> = {
    ...CORS_HEADERS,
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
  };

  if (!isMockableStatus(code)) {
    return Response.json(
      {
        error: "Unsupported status code",
        message: "Use a 3-digit status code between 200 and 599, e.g. /api/mock/429. 1xx codes cannot be sent as final responses.",
      },
      { status: 400, headers: baseHeaders }
    );
  }

  const status = Number(code);

  const rawDelay = Number(url.searchParams.get("delay") ?? "0");
  const delay = Number.isFinite(rawDelay) ? Math.min(Math.max(Math.floor(rawDelay), 0), MAX_DELAY_MS) : 0;
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  const headers: Record<string, string> = {
    ...baseHeaders,
    ...recommendedHeaders(status),
    "X-Castov-Mock": String(status),
    "X-Castov-Delay": String(delay),
  };

  if (REDIRECT_STATUSES.has(status)) {
    headers.Location = new URL("/api/mock/200", url.origin).toString();
  }

  if (NULL_BODY_STATUSES.has(status) || isHead) {
    return new Response(null, { status, headers });
  }

  const info = HTTP_STATUS_CODES[code];
  return Response.json(
    {
      status,
      statusText: info ? info.title.replace(`${code} `, "") : "Custom Status",
      method: request.method,
      delayMs: delay,
      description: info?.description ?? "Custom status code returned by the Castov mock endpoint.",
      docs: new URL(info ? `/http-status/${code}` : "/http-status", url.origin).toString(),
      timestamp: new Date().toISOString(),
    },
    { status, headers }
  );
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
