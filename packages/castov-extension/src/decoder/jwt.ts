/**
 * Castov Secret Shield - Local JWT Decoder
 *
 * Decodes JWT Header & Payload offline without external network calls.
 * Calculates expiration status and human-readable UTC/local times.
 */

export interface DecodedJwtResult {
  header: Record<string, any>;
  payload: Record<string, any>;
  isExpired: boolean | null;
  expiresAtIso: string | null;
  issuedAtIso: string | null;
  expiresInSummary: string | null;
  rawHeaderJson: string;
  rawPayloadJson: string;
}

export function decodeJwtLocally(jwtString: string): DecodedJwtResult | null {
  if (!jwtString || typeof jwtString !== "string") return null;

  const parts = jwtString.trim().split(".");
  if (parts.length !== 3) return null;

  try {
    const headerJson = base64UrlDecodeUtf8(parts[0]);
    const payloadJson = base64UrlDecodeUtf8(parts[1]);

    const header = JSON.parse(headerJson);
    const payload = JSON.parse(payloadJson);

    let isExpired: boolean | null = null;
    let expiresAtIso: string | null = null;
    let expiresInSummary: string | null = null;
    let issuedAtIso: string | null = null;

    const nowSeconds = Math.floor(Date.now() / 1000);

    if (typeof payload.exp === "number") {
      const expMs = payload.exp * 1000;
      expiresAtIso = new Date(expMs).toISOString();
      const diffSeconds = payload.exp - nowSeconds;

      if (diffSeconds < 0) {
        isExpired = true;
        expiresInSummary = `Expired ${formatRelativeDuration(-diffSeconds)} ago`;
      } else {
        isExpired = false;
        expiresInSummary = `Unexpired (${formatRelativeDuration(diffSeconds)} remaining) — signature not verified`;
      }
    }

    if (typeof payload.iat === "number") {
      issuedAtIso = new Date(payload.iat * 1000).toISOString();
    }

    return {
      header,
      payload,
      isExpired,
      expiresAtIso,
      issuedAtIso,
      expiresInSummary,
      rawHeaderJson: JSON.stringify(header, null, 2),
      rawPayloadJson: JSON.stringify(payload, null, 2),
    };
  } catch {
    return null;
  }
}

export function base64UrlDecodeUtf8(base64url: string): string {
  // Convert base64url to standard base64
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  // Pad with '='
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }

  // Cross-environment Base64 decode with proper UTF-8 decoding
  let binary: string;
  if (typeof atob === "function") {
    binary = atob(base64);
  } else if (typeof Buffer !== "undefined") {
    binary = Buffer.from(base64, "base64").toString("binary");
  } else {
    throw new Error("No Base64 decoder available");
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new TextDecoder("utf-8").decode(bytes);
}

function formatRelativeDuration(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
