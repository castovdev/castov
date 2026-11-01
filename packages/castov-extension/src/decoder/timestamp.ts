/**
 * Castov Secret Shield - Local Timestamp Decoder
 *
 * Converts Unix epoch timestamps (seconds & milliseconds) to UTC and local times.
 */

export interface DecodedTimestampResult {
  numericValue: number;
  unit: "seconds" | "milliseconds";
  utcIso: string;
  utcString: string;
  localString: string;
  relative: string;
}

export function decodeTimestampLocally(input: string): DecodedTimestampResult | null {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim();
  // Match integer timestamp between 9 and 16 digits
  if (!/^\d{9,16}$/.test(trimmed)) return null;

  const num = Number(trimmed);
  if (!Number.isFinite(num)) return null;

  let epochMs: number;
  let unit: "seconds" | "milliseconds";

  if (trimmed.length <= 11) {
    unit = "seconds";
    epochMs = num * 1000;
  } else {
    unit = "milliseconds";
    epochMs = num;
  }

  const date = new Date(epochMs);
  if (isNaN(date.getTime())) return null;

  // Sanity check year between 1980 and 2100 to avoid non-timestamp numbers
  const year = date.getUTCFullYear();
  if (year < 1980 || year > 2100) return null;

  const nowMs = Date.now();
  const diffSeconds = Math.round((epochMs - nowMs) / 1000);

  let relative: string;
  if (Math.abs(diffSeconds) < 60) {
    relative = diffSeconds >= 0 ? "just now" : "just now";
  } else if (diffSeconds < 0) {
    relative = `${formatDuration(-diffSeconds)} ago`;
  } else {
    relative = `in ${formatDuration(diffSeconds)}`;
  }

  return {
    numericValue: num,
    unit,
    utcIso: date.toISOString(),
    utcString: date.toUTCString(),
    localString: date.toLocaleString(),
    relative,
  };
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
