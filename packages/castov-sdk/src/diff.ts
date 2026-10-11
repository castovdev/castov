export interface DateDiffResult {
  start: { timestamp: number; iso: string };
  end: { timestamp: number; iso: string };
  milliseconds: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  weeks: number;
  human: string;
  isNegative: boolean;
}

function parseDateInput(input: string | number | Date): number {
  if (input instanceof Date) {
    if (isNaN(input.getTime())) throw new Error("diff: invalid Date object");
    return input.getTime();
  }
  if (typeof input === "number") {
    // If under 10000000000, treat as seconds
    return input < 10000000000 ? input * 1000 : input;
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      return num < 10000000000 ? num * 1000 : num;
    }
    const parsed = Date.parse(trimmed);
    if (isNaN(parsed)) throw new Error(`diff: could not parse date "${input}"`);
    return parsed;
  }
  throw new TypeError("diff: expected Date, timestamp number, or ISO string");
}

/**
 * Formats a duration in milliseconds into a concise, human-readable string.
 * Example: 3661000 -> "1h 1m 1s"
 */
export function duration(ms: number): string {
  if (isNaN(ms)) throw new Error("duration: invalid number");
  const isNegative = ms < 0;
  let remaining = Math.abs(Math.floor(ms));

  if (remaining === 0) return "0s";

  const days = Math.floor(remaining / 86400000);
  remaining %= 86400000;

  const hours = Math.floor(remaining / 3600000);
  remaining %= 3600000;

  const mins = Math.floor(remaining / 60000);
  remaining %= 60000;

  const secs = Math.floor(remaining / 1000);
  const millis = remaining % 1000;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0) parts.push(`${secs}s`);
  if (parts.length === 0 && millis > 0) parts.push(`${millis}ms`);

  const formatted = parts.join(" ");
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Calculates the exact difference between two dates/timestamps with human breakdown.
 */
export function diff(date1: string | number | Date, date2: string | number | Date): DateDiffResult {
  const t1 = parseDateInput(date1);
  const t2 = parseDateInput(date2);

  const deltaMs = t2 - t1;
  const isNegative = deltaMs < 0;
  const absMs = Math.abs(deltaMs);

  const seconds = Math.floor(absMs / 1000);
  const minutes = Math.floor(absMs / 60000);
  const hours = Math.floor(absMs / 3600000);
  const days = Math.floor(absMs / 86400000);
  const weeks = Math.floor(days / 7);

  // Human composite string
  let remaining = absMs;
  const cDays = Math.floor(remaining / 86400000);
  remaining %= 86400000;
  const cHours = Math.floor(remaining / 3600000);
  remaining %= 3600000;
  const cMins = Math.floor(remaining / 60000);
  remaining %= 60000;
  const cSecs = Math.floor(remaining / 1000);

  const humanParts: string[] = [];
  if (cDays > 0) humanParts.push(`${cDays} day${cDays === 1 ? "" : "s"}`);
  if (cHours > 0) humanParts.push(`${cHours} hour${cHours === 1 ? "" : "s"}`);
  if (cMins > 0) humanParts.push(`${cMins} minute${cMins === 1 ? "" : "s"}`);
  if (cSecs > 0 || humanParts.length === 0) humanParts.push(`${cSecs} second${cSecs === 1 ? "" : "s"}`);

  const humanStr = humanParts.join(", ");

  return {
    start: { timestamp: t1, iso: new Date(t1).toISOString() },
    end: { timestamp: t2, iso: new Date(t2).toISOString() },
    milliseconds: deltaMs,
    seconds: isNegative ? -seconds : seconds,
    minutes: isNegative ? -minutes : minutes,
    hours: isNegative ? -hours : hours,
    days: isNegative ? -days : days,
    weeks: isNegative ? -weeks : weeks,
    human: isNegative ? `-${humanStr}` : humanStr,
    isNegative,
  };
}
