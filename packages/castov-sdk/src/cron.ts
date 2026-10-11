import type { CronResult, CronRun } from "./types.js";

export interface CronField {
  raw: string;
  values: number[];
  starred: boolean;
}

export interface ParsedCron {
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
  expression: string;
}

interface FieldSpec {
  name: string;
  min: number;
  max: number;
  names?: Record<string, number>;
}

const MONTH_NAMES: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

const DOW_NAMES: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

const SPECS: FieldSpec[] = [
  { name: "minute", min: 0, max: 59 },
  { name: "hour", min: 0, max: 23 },
  { name: "day-of-month", min: 1, max: 31 },
  { name: "month", min: 1, max: 12, names: MONTH_NAMES },
  { name: "day-of-week", min: 0, max: 7, names: DOW_NAMES },
];

const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAY_LABELS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function parseValue(token: string, spec: FieldSpec): number {
  if (/^\d+$/.test(token)) {
    const n = Number(token);
    if (n < spec.min || n > spec.max) {
      throw new RangeError(`${n} is out of range for the ${spec.name} field (${spec.min}-${spec.max})`);
    }
    return n;
  }
  const named = spec.names?.[token.toUpperCase()];
  if (named !== undefined) return named;
  throw new RangeError(`"${token}" is not a valid value for the ${spec.name} field`);
}

function parseField(raw: string, spec: FieldSpec): CronField {
  if (raw === "?") {
    throw new RangeError(`"?" is not valid in standard 5-field cron. Use * in the ${spec.name} field.`);
  }
  const values = new Set<number>();
  for (const part of raw.split(",")) {
    if (!part) {
      throw new RangeError(`The ${spec.name} field has an empty value (extra comma).`);
    }
    const [rangePart, stepPart, ...extra] = part.split("/");
    if (extra.length) {
      throw new RangeError(`"${part}" has more than one step (/) in the ${spec.name} field.`);
    }
    let step = 1;
    if (stepPart !== undefined) {
      if (!/^\d+$/.test(stepPart) || Number(stepPart) < 1) {
        throw new RangeError(`The step in "${part}" must be a whole number of 1 or more.`);
      }
      step = Number(stepPart);
    }
    let from: number;
    let to: number;
    if (rangePart === "*") {
      from = spec.name === "day-of-week" ? 0 : spec.min;
      to = spec.name === "day-of-week" ? 6 : spec.max;
    } else if (rangePart.includes("-")) {
      const bounds = rangePart.split("-");
      if (bounds.length !== 2 || !bounds[0] || !bounds[1]) {
        throw new RangeError(`"${rangePart}" is not a valid range in the ${spec.name} field.`);
      }
      const a = parseValue(bounds[0], spec);
      const b = parseValue(bounds[1], spec);
      if (a > b) {
        throw new RangeError(`The range "${rangePart}" in the ${spec.name} field starts after it ends.`);
      }
      from = a;
      to = b;
    } else {
      const v = parseValue(rangePart, spec);
      from = v;
      to = stepPart !== undefined ? (spec.name === "day-of-week" ? 6 : spec.max) : v;
    }
    for (let v = from; v <= to; v += step) {
      values.add(spec.name === "day-of-week" && v === 7 ? 0 : v);
    }
  }
  return {
    raw,
    values: [...values].sort((a, b) => a - b),
    starred: raw.startsWith("*"),
  };
}

export function parseCronExpression(input: string): ParsedCron {
  let expression = input.trim().replace(/\s+/g, " ");
  if (!expression) {
    throw new Error("Enter a cron expression with 5 fields, for example '*/15 * * * *'.");
  }
  if (expression.startsWith("@")) {
    if (expression.toLowerCase() === "@reboot") {
      throw new Error("@reboot runs once at startup and has no schedule to explain.");
    }
    const macro = MACROS[expression.toLowerCase()];
    if (!macro) {
      throw new Error(`"${expression}" is not a known shortcut. Try @hourly, @daily, @weekly, @monthly or @yearly.`);
    }
    expression = macro;
  }

  const fields = expression.split(" ");
  if (fields.length > 5) {
    throw new Error("This looks like a 6 or 7 field expression. Standard cron has 5 fields: minute hour day-of-month month day-of-week.");
  }
  if (fields.length < 5) {
    throw new Error("A cron expression needs exactly 5 fields: minute hour day-of-month month day-of-week.");
  }

  const parsed: CronField[] = [];
  for (let i = 0; i < 5; i++) {
    parsed.push(parseField(fields[i], SPECS[i]));
  }

  return {
    minute: parsed[0],
    hour: parsed[1],
    dayOfMonth: parsed[2],
    month: parsed[3],
    dayOfWeek: parsed[4],
    expression,
  };
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function isStepOfAll(f: CronField, step: RegExp): number | null {
  const m = step.exec(f.raw);
  return m ? Number(m[1]) : null;
}

function describeTime(c: ParsedCron): string {
  const { minute, hour } = c;
  const hourAll = hour.raw === "*";
  const minuteAll = minute.raw === "*";
  const minStep = isStepOfAll(minute, /^\*\/(\d+)$/);
  const hourStep = isStepOfAll(hour, /^\*\/(\d+)$/);
  const single = (f: CronField) =>
    f.values.length === 1 && !f.raw.includes("-") && !f.raw.includes("/") && !f.raw.includes("*");
  const hourRange = /^(\d+)-(\d+)$/.exec(hour.raw);

  if (minuteAll && hourAll) return "Every minute";
  if (minStep && hourAll) return minStep === 1 ? "Every minute" : `Every ${minStep} minutes`;
  if (single(minute) && hourAll) {
    return minute.values[0] === 0 ? "At the start of every hour" : `At minute ${minute.values[0]} past every hour`;
  }
  if (single(minute) && single(hour)) return `At ${pad(hour.values[0])}:${pad(minute.values[0])}`;
  if (single(minute) && hour.values.length <= 6 && !hour.raw.includes("*") && !hourRange && !hour.raw.includes("/")) {
    return `At ${joinList(hour.values.map((h) => `${pad(h)}:${pad(minute.values[0])}`))}`;
  }
  if (hourRange && (minuteAll || minStep)) {
    const lead = minuteAll ? "Every minute" : `Every ${minStep} minutes`;
    return `${lead}, between ${pad(Number(hourRange[1]))}:00 and ${pad(Number(hourRange[2]))}:59`;
  }
  if (hourRange && single(minute)) {
    return `At minute ${minute.values[0]} past every hour from ${hourRange[1]} through ${hourRange[2]}`;
  }
  if (minuteAll && single(hour)) return `Every minute, from ${pad(hour.values[0])}:00 to ${pad(hour.values[0])}:59`;
  if (hourStep && single(minute)) return `At minute ${minute.values[0]} past every ${hourStep === 1 ? "hour" : `${hourStep} hours`}`;
  if (minStep && hour.values.length === 1) return `Every ${minStep} minutes, from ${pad(hour.values[0])}:00 to ${pad(hour.values[0])}:59`;

  const minutes = minuteAll ? "every minute" : `minute ${joinList(minute.values.map(String))}`;
  const hours = hourAll ? "every hour" : `hour ${joinList(hour.values.map(String))}`;
  return `At ${minutes} past ${hours}`;
}

function describeDayOfMonth(f: CronField): string {
  if (f.raw === "*") return "";
  const step = isStepOfAll(f, /^\*\/(\d+)$/);
  if (step) return `on every ${ordinal(step)} day-of-month`;
  const range = /^(\d+)-(\d+)$/.exec(f.raw);
  if (range) return `on every day-of-month from ${range[1]} through ${range[2]}`;
  return `on day-of-month ${joinList(f.values.map(String))}`;
}

function describeMonth(f: CronField): string {
  if (f.raw === "*") return "";
  const step = isStepOfAll(f, /^\*\/(\d+)$/);
  if (step) return `in every ${ordinal(step)} month`;
  const names = f.values.map((v) => MONTH_LABELS[v - 1]);
  if (f.values.length > 2 && f.values.every((v, i) => i === 0 || v === f.values[i - 1] + 1)) {
    return `in ${names[0]} through ${names[names.length - 1]}`;
  }
  return `in ${joinList(names)}`;
}

function describeDayOfWeek(f: CronField): string {
  if (f.raw === "*") return "";
  const names = f.values.map((v) => WEEKDAY_LABELS[v]);
  if (f.values.length > 2 && f.values.every((v, i) => i === 0 || v === f.values[i - 1] + 1)) {
    return `on ${names[0]} through ${names[names.length - 1]}`;
  }
  return `on ${joinList(names)}`;
}

export function describeCron(c: ParsedCron): string {
  const dom = describeDayOfMonth(c.dayOfMonth);
  const dow = describeDayOfWeek(c.dayOfWeek);
  const month = describeMonth(c.month);
  const bothDays = !c.dayOfMonth.starred && !c.dayOfWeek.starred;
  const days = bothDays ? `${dom} or ${dow}` : [dom, dow].filter(Boolean).join(", ");
  const parts = [describeTime(c), days, month].filter(Boolean);
  return parts.join(", ");
}

function dayMatches(c: ParsedCron, day: number, weekday: number): boolean {
  const domOk = c.dayOfMonth.values.includes(day);
  const dowOk = c.dayOfWeek.values.includes(weekday);
  return c.dayOfMonth.starred || c.dayOfWeek.starred ? domOk && dowOk : domOk || dowOk;
}

function getZonedWallClock(ms: number, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(ms));
  const find = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return {
    year: find("year"),
    month: find("month"),
    day: find("day"),
    hour: find("hour") % 24,
    minute: find("minute"),
  };
}

function wallClockToUtcMs(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  tz: string
): number {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  if (tz === "UTC") return guess;

  const testInstants = [guess - 86400000, guess, guess + 86400000];
  let bestMs = guess;
  for (const t of testInstants) {
    const parts = getZonedWallClock(t, tz);
    const offset = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0) - t;
    const candidate = guess - offset;
    const candParts = getZonedWallClock(candidate, tz);
    if (
      candParts.year === year &&
      candParts.month === month &&
      candParts.day === day &&
      candParts.hour === hour &&
      candParts.minute === minute
    ) {
      return candidate;
    }
    bestMs = candidate;
  }
  return bestMs;
}

/**
 * Calculates the next `count` run times for `c` starting after `fromMs` in timezone `timeZone`.
 */
export function calculateNextRuns(c: ParsedCron, fromMs: number, timeZone: string, count = 5): CronRun[] {
  const runs: CronRun[] = [];
  const current = getZonedWallClock(fromMs, timeZone);
  let curYear = current.year;
  let curMonth = current.month;
  let curDay = current.day;

  // Search ahead up to 5 years (approx 1826 days)
  for (let d = 0; d < 1826 && runs.length < count; d++) {
    // Generate date for this day
    const dayDate = new Date(Date.UTC(curYear, curMonth - 1, curDay + d));
    const year = dayDate.getUTCFullYear();
    const month = dayDate.getUTCMonth() + 1;
    const day = dayDate.getUTCDate();
    const weekday = dayDate.getUTCDay();

    if (!c.month.values.includes(month)) continue;
    if (!dayMatches(c, day, weekday)) continue;

    for (const h of c.hour.values) {
      for (const m of c.minute.values) {
        const utcMs = wallClockToUtcMs(year, month, day, h, m, timeZone);
        if (utcMs > fromMs) {
          const date = new Date(utcMs);
          let localFormatted: string;
          try {
            localFormatted = new Intl.DateTimeFormat("en-US", {
              timeZone,
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              timeZoneName: "short",
              hourCycle: "h23",
            }).format(date);
          } catch {
            localFormatted = date.toISOString();
          }

          runs.push({
            timestampMs: utcMs,
            iso: date.toISOString(),
            utc: date.toUTCString(),
            local: localFormatted,
          });

          if (runs.length === count) return runs;
        }
      }
    }
  }

  return runs;
}

/**
 * Explains a cron expression in plain English and calculates the next 5 run times.
 * @param expression A 5-field cron expression or standard macro (e.g. '@daily', '0 9 * * 1-5')
 * @param timezone Optional IANA time zone (e.g. 'America/New_York', 'UTC'). Defaults to host local time zone.
 */
export function cron(expression: string, timezone?: string): CronResult {
  const parsed = parseCronExpression(expression);
  let resolvedTz = timezone?.trim() || "";
  if (!resolvedTz) {
    try {
      resolvedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      resolvedTz = "UTC";
    }
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: resolvedTz });
  } catch {
    throw new RangeError(`cron: invalid time zone "${resolvedTz}". Must be a valid IANA time zone.`);
  }

  const description = describeCron(parsed);
  const nextRuns = calculateNextRuns(parsed, Date.now(), resolvedTz, 5);

  return {
    expression: parsed.expression,
    description,
    timezone: resolvedTz,
    nextRuns,
  };
}
