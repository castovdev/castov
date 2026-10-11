import type { TimeZoneConversionResult } from "./types.js";

interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function parseDateTimeString(s: string): WallClock {
  const trimmed = s.trim();
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/.exec(trimmed);
  if (!match) {
    throw new RangeError(
      `tz: invalid date-time format "${s}". Expected "YYYY-MM-DD HH:mm:ss" or ISO format.`
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = match[4] !== undefined ? Number(match[4]) : 0;
  const minute = match[5] !== undefined ? Number(match[5]) : 0;
  const second = match[6] !== undefined ? Number(match[6]) : 0;

  if (month < 1 || month > 12) {
    throw new RangeError(`tz: month must be between 1 and 12, received ${month}`);
  }
  if (day < 1 || day > 31) {
    throw new RangeError(`tz: day must be between 1 and 31, received ${day}`);
  }
  if (hour < 0 || hour > 23) {
    throw new RangeError(`tz: hour must be between 0 and 23, received ${hour}`);
  }
  if (minute < 0 || minute > 59) {
    throw new RangeError(`tz: minute must be between 0 and 59, received ${minute}`);
  }
  if (second < 0 || second > 59) {
    throw new RangeError(`tz: second must be between 0 and 59, received ${second}`);
  }

  return { year, month, day, hour, minute, second };
}

function assertValidTimeZone(tz: string, argName: string): void {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
  } catch {
    throw new RangeError(
      `tz: invalid time zone "${tz}" for ${argName}. Must be a valid IANA time zone like "America/New_York", "UTC", or "Europe/Paris".`
    );
  }
}

function getZonedParts(ms: number, timeZone: string): WallClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(ms));

  const find = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: find("year"),
    month: find("month"),
    day: find("day"),
    hour: find("hour") % 24,
    minute: find("minute"),
    second: find("second"),
  };
}

function getOffsetMs(ms: number, timeZone: string): number {
  if (timeZone === "UTC") return 0;
  const p = getZonedParts(ms, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const floored = ms - (((ms % 1000) + 1000) % 1000);
  return asUtc - floored;
}

function formatOffset(offsetMs: number): string {
  const sign = offsetMs >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMs);
  const hours = Math.floor(abs / 3_600_000);
  const minutes = Math.floor((abs % 3_600_000) / 60_000);
  return `UTC${sign}${pad(hours)}:${pad(minutes)}`;
}

function getAbbreviation(ms: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short",
  }).formatToParts(new Date(ms));
  return parts.find((p) => p.type === "timeZoneName")?.value ?? timeZone;
}

function formatWallClock(w: WallClock): string {
  return `${w.year}-${pad(w.month)}-${pad(w.day)} ${pad(w.hour)}:${pad(w.minute)}:${pad(w.second)}`;
}

function sameWallClock(a: WallClock, b: WallClock): boolean {
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day &&
    a.hour === b.hour &&
    a.minute === b.minute &&
    a.second === b.second
  );
}

/**
 * Converts a date and time from one IANA time zone to another.
 * Handles daylight saving time (DST) gaps and overlaps with clear warnings.
 */
export function tz(dateTime: string, fromZone: string, toZone: string): TimeZoneConversionResult {
  const from = fromZone.trim();
  const to = toZone.trim();
  assertValidTimeZone(from, "from-zone");
  assertValidTimeZone(to, "to-zone");

  const targetWall = parseDateTimeString(dateTime);
  const guess = Date.UTC(
    targetWall.year,
    targetWall.month - 1,
    targetWall.day,
    targetWall.hour,
    targetWall.minute,
    targetWall.second
  );

  let finalMs: number;
  let hasDstWarning = false;
  let dstWarningType: "gap" | "overlap" | undefined;
  let warning: string | undefined;

  if (from === "UTC") {
    finalMs = guess;
  } else {
    const beforeOffset = getOffsetMs(guess - 86_400_000, from);
    const afterOffset = getOffsetMs(guess + 86_400_000, from);
    const candidateInstants = Array.from(
      new Set([guess - beforeOffset, guess - afterOffset])
    ).sort((a, b) => a - b);

    const validMatches = candidateInstants.filter((inst) =>
      sameWallClock(getZonedParts(inst, from), targetWall)
    );

    if (validMatches.length === 0) {
      // DST Gap: The clock jumped forward (time did not exist)
      hasDstWarning = true;
      dstWarningType = "gap";
      finalMs = guess - beforeOffset; // Adjust forward by gap
      const adjustedWall = getZonedParts(finalMs, from);
      const gapMinutes = Math.round(Math.abs(afterOffset - beforeOffset) / 60_000);
      warning = `Warning: "${dateTime}" does not exist in ${from} due to a DST spring-forward gap (+${gapMinutes}m). Clocks skipped this time. Adjusted forward to ${formatWallClock(adjustedWall)}.`;
    } else if (validMatches.length > 1) {
      // DST Overlap: The clock repeated (ambiguous time occurs twice)
      hasDstWarning = true;
      dstWarningType = "overlap";
      finalMs = validMatches[0]; // Earlier occurrence (daylight time)
      warning = `Warning: "${dateTime}" is ambiguous in ${from} due to a DST fall-back overlap. This wall-clock time occurs twice. Resolved to the earlier (daylight time) occurrence.`;
    } else {
      finalMs = validMatches[0];
    }
  }

  const fromParts = getZonedParts(finalMs, from);
  const toParts = getZonedParts(finalMs, to);

  const fromOffsetMs = getOffsetMs(finalMs, from);
  const toOffsetMs = getOffsetMs(finalMs, to);

  const fromAbbr = getAbbreviation(finalMs, from);
  const toAbbr = getAbbreviation(finalMs, to);

  return {
    originalInput: dateTime,
    fromZone: from,
    toZone: to,
    timestampMs: finalMs,
    iso: new Date(finalMs).toISOString(),
    fromFormatted: formatWallClock(fromParts),
    fromAbbreviation: fromAbbr,
    fromOffset: formatOffset(fromOffsetMs),
    toFormatted: formatWallClock(toParts),
    toAbbreviation: toAbbr,
    toOffset: formatOffset(toOffsetMs),
    hasDstWarning,
    dstWarningType,
    warning,
  };
}
