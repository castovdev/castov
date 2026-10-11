/**
 * @castov/sdk — zero-dependency, zero-server developer utilities.
 * Runs in Node.js >= 20, Deno, Bun, Cloudflare Workers and modern browsers.
 * Everything relies on the standard Web Crypto API (globalThis.crypto).
 */

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function getCrypto(): Crypto {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (!c || typeof c.getRandomValues !== "function") {
    throw new Error(
      "@castov/sdk: Web Crypto API is not available. Use Node.js >= 20 or a modern browser.",
    );
  }
  return c;
}

const HEX: string[] = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));

function bytesToUuid(b: Uint8Array): string {
  return (
    HEX[b[0]] + HEX[b[1]] + HEX[b[2]] + HEX[b[3]] + "-" +
    HEX[b[4]] + HEX[b[5]] + "-" +
    HEX[b[6]] + HEX[b[7]] + "-" +
    HEX[b[8]] + HEX[b[9]] + "-" +
    HEX[b[10]] + HEX[b[11]] + HEX[b[12]] + HEX[b[13]] + HEX[b[14]] + HEX[b[15]]
  );
}

// ---------------------------------------------------------------------------
// IDs
// ---------------------------------------------------------------------------

/** RFC 9562 UUID v4 (random). Uses native `crypto.randomUUID()` when available. */
export function uuid(): string {
  const c = getCrypto();
  if (typeof c.randomUUID === "function") return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10xx
  return bytesToUuid(b);
}

/** RFC 9562 UUID v7 (Unix-ms timestamp + random). Lexicographically sortable by creation time. */
export function uuidv7(timestampMs: number = Date.now()): string {
  const b = getCrypto().getRandomValues(new Uint8Array(16));
  const ts = Math.floor(timestampMs);
  // 48-bit big-endian millisecond timestamp
  b[0] = Math.floor(ts / 2 ** 40) & 0xff;
  b[1] = Math.floor(ts / 2 ** 32) & 0xff;
  b[2] = (ts >>> 24) & 0xff;
  b[3] = (ts >>> 16) & 0xff;
  b[4] = (ts >>> 8) & 0xff;
  b[5] = ts & 0xff;
  b[6] = (b[6] & 0x0f) | 0x70; // version 7
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10xx
  return bytesToUuid(b);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Returns true if `value` is a valid RFC 9562 UUID (versions 1–8). */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

const URL_ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

/** URL-safe random ID (nanoid-compatible alphabet). Default length: 21. */
export function nanoid(size = 21): string {
  if (!Number.isInteger(size) || size <= 0) throw new RangeError("nanoid: size must be a positive integer");
  const bytes = getCrypto().getRandomValues(new Uint8Array(size));
  let id = "";
  for (let i = 0; i < size; i++) id += URL_ALPHABET[bytes[i] & 63];
  return id;
}

// ---------------------------------------------------------------------------
// Base64 (UTF-8 safe)
// ---------------------------------------------------------------------------

export interface Base64Options {
  /** Use the URL-safe alphabet (`-`/`_`) without padding. */
  url?: boolean;
}

export function base64Encode(text: string, options: Base64Options = {}): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  const out = btoa(bin);
  return options.url ? out.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : out;
}

/** Decodes standard or URL-safe Base64 into a UTF-8 string. Throws on invalid input. */
export function base64Decode(input: string): string {
  let s = input.trim().replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------

/** Current Unix timestamp in seconds. */
export function unix(): number {
  return Math.floor(Date.now() / 1000);
}

/** Converts a Unix timestamp to ISO 8601. Auto-detects milliseconds (values > 1e11). */
export function unixToIso(timestamp: number): string {
  const ms = Math.abs(timestamp) > 1e11 ? timestamp : timestamp * 1000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) throw new RangeError(`unixToIso: invalid timestamp ${timestamp}`);
  return d.toISOString();
}

/** Parses any Date-compatible string (e.g. ISO 8601) to Unix seconds. */
export function isoToUnix(iso: string): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) throw new RangeError(`isoToUnix: invalid date "${iso}"`);
  return Math.floor(t / 1000);
}

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

export type HashAlgorithm = "sha1" | "sha256" | "sha384" | "sha512";

const SUBTLE_NAMES: Record<HashAlgorithm, string> = {
  sha1: "SHA-1",
  sha256: "SHA-256",
  sha384: "SHA-384",
  sha512: "SHA-512",
};

/** Hex digest of `text` using Web Crypto. Async because SubtleCrypto is async. */
export async function hash(text: string, algorithm: HashAlgorithm = "sha256"): Promise<string> {
  const name = SUBTLE_NAMES[algorithm];
  if (!name) throw new Error(`hash: unsupported algorithm "${algorithm}". Use sha1, sha256, sha384 or sha512.`);
  const digest = await getCrypto().subtle.digest(name, new TextEncoder().encode(text));
  const b = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < b.length; i++) hex += HEX[b[i]];
  return hex;
}

// ---------------------------------------------------------------------------
// JWT (decode only — never verifies signatures)
// ---------------------------------------------------------------------------

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

/** Decodes a JWT locally. Does NOT verify the signature. */
export function jwtDecode(token: string): DecodedJwt {
  const parts = token.trim().split(".");
  if (parts.length !== 3) throw new Error("jwtDecode: token must have 3 parts");
  try {
    return {
      header: JSON.parse(base64Decode(parts[0])),
      payload: JSON.parse(base64Decode(parts[1])),
      signature: parts[2],
    };
  } catch {
    throw new Error("jwtDecode: malformed token");
  }
}

// ---------------------------------------------------------------------------
// Public namespace
// ---------------------------------------------------------------------------

export const castov = {
  uuid,
  uuidv7,
  isUuid,
  nanoid,
  base64: { encode: base64Encode, decode: base64Decode },
  unix,
  unixToIso,
  isoToUnix,
  hash,
  jwtDecode,
} as const;

export default castov;
