/**
 * Enterprise-grade in-memory Sliding Window Rate Limiter.
 * Complies with RFC 6585 and IETF Draft RateLimit Headers.
 * Automatically cleans up expired windows to keep memory strictly bounded.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const RATE_LIMIT_STORE = new Map<string, RateLimitRecord>();
const STORE_MAX_SIZE = 10000;

// Periodic cleanup of stale client records (every 60 seconds)
let lastCleanup = Date.now();
function cleanupExpired(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < 60000) return;
  lastCleanup = now;

  for (const [key, record] of RATE_LIMIT_STORE.entries()) {
    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);
    if (record.timestamps.length === 0) {
      RATE_LIMIT_STORE.delete(key);
    }
  }

  // Hard safety limit on map size
  if (RATE_LIMIT_STORE.size > STORE_MAX_SIZE) {
    RATE_LIMIT_STORE.clear();
  }
}

export interface RateLimitOptions {
  limit: number;     // Maximum allowed requests in the time window
  windowMs: number;  // Window duration in milliseconds
  identifier?: string; // Optional custom key prefix (e.g. route name)
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

/**
 * Extracts the real client IP address from standard reverse-proxy headers.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  return "127.0.0.1";
}

/**
 * Checks whether the request is within its sliding rate limit window.
 */
export function checkRateLimit(
  request: Request,
  options: RateLimitOptions
): RateLimitResult {
  const { limit, windowMs, identifier = "global" } = options;
  cleanupExpired(windowMs);

  const ip = getClientIp(request);
  const key = `${identifier}:${ip}`;
  const now = Date.now();

  let record = RATE_LIMIT_STORE.get(key);
  if (!record) {
    record = { timestamps: [] };
    RATE_LIMIT_STORE.set(key, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0] || now;
    const resetMs = Math.max(0, oldest + windowMs - now);
    return {
      success: false,
      limit,
      remaining: 0,
      resetMs,
    };
  }

  record.timestamps.push(now);
  const remaining = Math.max(0, limit - record.timestamps.length);
  const oldest = record.timestamps[0] || now;
  const resetMs = Math.max(0, oldest + windowMs - now);

  return {
    success: true,
    limit,
    remaining,
    resetMs,
  };
}

/**
 * Generates an RFC 6585 compliant HTTP 429 Too Many Requests response.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfterSec = Math.max(1, Math.ceil(result.resetMs / 1000));
  return new Response(
    JSON.stringify({
      ok: false,
      error: "Too Many Requests",
      message: `Rate limit exceeded. Please wait ${retryAfterSec} seconds before retrying.`,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil((Date.now() + result.resetMs) / 1000)),
      },
    }
  );
}
