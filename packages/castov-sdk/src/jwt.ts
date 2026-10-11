import type { DecodedJwt } from "./types.js";

function decodeBase64Url(input: string): string {
  let s = input.trim().replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export interface JwtTimestampInfo {
  timestamp: number;
  iso: string;
  relative: string;
}

export interface JwtInspectionResult {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  isExpired: boolean | null;
  issuedAt?: JwtTimestampInfo;
  expiresAt?: JwtTimestampInfo;
  notBefore?: JwtTimestampInfo;
  status: "active" | "expired" | "not_yet_valid" | "no_expiry";
  statusText: string;
}

function formatRelative(diffSeconds: number): string {
  const isPast = diffSeconds < 0;
  const absSec = Math.abs(diffSeconds);

  let desc = "";
  if (absSec < 60) {
    desc = `${absSec}s`;
  } else if (absSec < 3600) {
    const mins = Math.floor(absSec / 60);
    const secs = absSec % 60;
    desc = secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  } else if (absSec < 86400) {
    const hours = Math.floor(absSec / 3600);
    const mins = Math.floor((absSec % 3600) / 60);
    desc = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  } else {
    const days = Math.floor(absSec / 86400);
    const hours = Math.floor((absSec % 86400) / 3600);
    desc = hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  return isPast ? `${desc} ago` : `in ${desc}`;
}

function makeTimestampInfo(sec: number, nowSec: number): JwtTimestampInfo {
  const ms = sec * 1000;
  const iso = new Date(ms).toISOString();
  const relative = formatRelative(sec - nowSec);
  return { timestamp: sec, iso, relative };
}

/**
 * Decodes and inspects a JSON Web Token (JWT) locally without verifying signature.
 * Computes expiration status and relative times for `iat`, `exp`, and `nbf`.
 */
export function jwtInspect(token: string, options: { now?: number } = {}): JwtInspectionResult {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    throw new Error("jwt: token must consist of exactly 3 parts separated by dots");
  }

  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(decodeBase64Url(parts[0]));
    payload = JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    throw new Error("jwt: malformed token or base64 decoding failed");
  }

  const nowSec = Math.floor((options.now ?? Date.now()) / 1000);

  let issuedAt: JwtTimestampInfo | undefined;
  if (typeof payload.iat === "number") {
    issuedAt = makeTimestampInfo(payload.iat, nowSec);
  }

  let expiresAt: JwtTimestampInfo | undefined;
  let isExpired: boolean | null = null;
  if (typeof payload.exp === "number") {
    expiresAt = makeTimestampInfo(payload.exp, nowSec);
    isExpired = payload.exp <= nowSec;
  }

  let notBefore: JwtTimestampInfo | undefined;
  if (typeof payload.nbf === "number") {
    notBefore = makeTimestampInfo(payload.nbf, nowSec);
  }

  let status: JwtInspectionResult["status"] = "no_expiry";
  let statusText = "No expiration date (token does not expire)";

  if (notBefore && typeof payload.nbf === "number" && payload.nbf > nowSec) {
    status = "not_yet_valid";
    statusText = `Not yet valid (${notBefore.relative})`;
  } else if (isExpired === true && expiresAt) {
    status = "expired";
    statusText = `Expired (${expiresAt.relative})`;
  } else if (isExpired === false && expiresAt) {
    status = "active";
    statusText = `Active (expires ${expiresAt.relative})`;
  }

  return {
    header,
    payload,
    signature: parts[2],
    isExpired,
    issuedAt,
    expiresAt,
    notBefore,
    status,
    statusText,
  };
}
