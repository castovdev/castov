import type { TimestampResult } from "./types.js";

/** Current Unix timestamp in seconds. */
export function unix(): number {
  return Math.floor(Date.now() / 1000);
}

/** Converts a Unix timestamp to ISO 8601. Auto-detects milliseconds (values > 1e11). */
export function unixToIso(timestamp: number): string {
  const ms = Math.abs(timestamp) > 1e11 ? timestamp : timestamp * 1000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) {
    throw new RangeError(`unixToIso: invalid timestamp ${timestamp}`);
  }
  return d.toISOString();
}

/** Parses any Date-compatible string (e.g. ISO 8601) to Unix seconds. */
export function isoToUnix(iso: string): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) {
    throw new RangeError(`isoToUnix: invalid date "${iso}"`);
  }
  return Math.floor(t / 1000);
}

/**
 * Parses and formats a Unix timestamp (seconds or milliseconds with auto-detection).
 * Returns UTC, ISO 8601, and local representations.
 */
export function ts(value: string | number): TimestampResult {
  let rawNum: number;
  if (typeof value === "number") {
    rawNum = value;
  } else {
    const trimmed = String(value).trim();
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
      throw new RangeError(`ts: invalid numeric timestamp "${value}"`);
    }
    rawNum = Number(trimmed);
  }

  if (!Number.isFinite(rawNum)) {
    throw new RangeError(`ts: timestamp must be a finite number, received "${value}"`);
  }

  // Threshold: 100 billion (1e11).
  // In seconds, 1e11 corresponds to the year 5138.
  // In milliseconds, 1e11 corresponds to March 1973.
  const isMs = Math.abs(rawNum) > 1e11;
  const unit = isMs ? ("milliseconds" as const) : ("seconds" as const);
  const ms = isMs ? Math.round(rawNum) : Math.round(rawNum * 1000);
  const seconds = isMs ? Math.floor(rawNum / 1000) : Math.floor(rawNum);

  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`ts: value "${value}" results in an invalid Date`);
  }

  const iso = date.toISOString();
  const utc = date.toUTCString();
  let local: string;
  try {
    local = date.toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "long",
    });
  } catch {
    local = date.toString();
  }

  return {
    unit,
    seconds,
    milliseconds: ms,
    iso,
    utc,
    local,
    date,
  };
}
