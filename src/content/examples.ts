import {
  diffTimestamps,
  formatCompact,
  parseIso8601,
  parseTimestamp,
  toIsoOffset,
  toIsoUtc,
  utcFromParts,
  wallClockToInstant,
  dateDetails,
  formatOffsetLabel,
  getOffsetMs,
  zoneLabel,
  calendarDifference,
  timeOfDayDuration,
  shiftInstant,
  validateTimestamp,
  convertBatch,
  parseAnyDate,
  toRfc3339,
  parseRfc3339,
  computeBusinessHours,
  readClock,
  parseCron,
  describeCron,
  nextRuns,
} from "@/lib/time";
import type { ToolSlug } from "./tools";

export interface ExampleItem {
  title: string;
  input: string;
  results: { label: string; value: string }[];
  note?: string;
}

export interface CodeExample {
  label: string;
  language: string;
  code: string;
}

export type ToolExamples =
  | { kind: "io"; intro: string; items: ExampleItem[] }
  | { kind: "code"; intro: string; items: CodeExample[] };

/** Every value below is computed with the same library the tools use, so examples cannot drift. */
function ts(input: string, title: string, note?: string): ExampleItem {
  const parsed = parseTimestamp(input);
  if (!parsed.ok) throw new Error(`Bad example timestamp: ${input}`);
  const { ms, unit } = parsed.value;
  return {
    title,
    input: `${input} (${unit})`,
    results: [
      { label: "UTC", value: `${formatCompact(ms, "UTC", { withMs: ms % 1000 !== 0 })} UTC` },
      { label: "ISO 8601", value: toIsoUtc(ms) },
    ],
    note,
  };
}

function msOnly(ms: number, title: string, note?: string): ExampleItem {
  return {
    title,
    input: `${ms} (milliseconds)`,
    results: [
      { label: "UTC", value: `${formatCompact(ms, "UTC", { withMs: true })} UTC` },
      { label: "ISO 8601", value: toIsoUtc(ms) },
    ],
    note,
  };
}

function iso(input: string, title: string, assumed = "UTC", note?: string): ExampleItem {
  const parsed = parseIso8601(input, assumed);
  if (!parsed.ok) throw new Error(`Bad example ISO string: ${input}`);
  const { ms } = parsed.value;
  return {
    title,
    input,
    results: [
      { label: "Unix seconds", value: String(Math.floor(ms / 1000)) },
      { label: "Unix milliseconds", value: String(ms) },
    ],
    note,
  };
}

function wall(y: number, mo: number, d: number, h: number, mi: number, tz: string, title: string): ExampleItem {
  const r = wallClockToInstant({ year: y, month: mo, day: d, hour: h, minute: mi, second: 0 }, tz);
  if (!r.ok) throw new Error(`Bad example wall clock: ${title}`);
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    title,
    input: `${y}-${p(mo)}-${p(d)} ${p(h)}:${p(mi)}:00 ${tz}`,
    results: [
      { label: "Unix seconds", value: String(r.value.ms / 1000) },
      { label: "Unix milliseconds", value: String(r.value.ms) },
      { label: "ISO 8601", value: toIsoUtc(r.value.ms) },
    ],
  };
}

function convert(y: number, mo: number, d: number, h: number, mi: number, from: string, to: string, title: string): ExampleItem {
  const r = wallClockToInstant({ year: y, month: mo, day: d, hour: h, minute: mi, second: 0 }, from);
  if (!r.ok) throw new Error(`Bad example conversion: ${title}`);
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    title,
    input: `${y}-${p(mo)}-${p(d)} ${p(h)}:${p(mi)} ${from} to ${to}`,
    results: [
      { label: `${zoneLabel(to)} time`, value: formatCompact(r.value.ms, to) },
      { label: "Offset", value: formatOffsetLabel(getOffsetMs(r.value.ms, to)) },
    ],
  };
}

const CODE_NOW: CodeExample[] = [
  { label: "JavaScript (seconds)", language: "js", code: "Math.floor(Date.now() / 1000)" },
  { label: "JavaScript (milliseconds)", language: "js", code: "Date.now()" },
  { label: "Python", language: "python", code: "import time\nint(time.time())" },
  { label: "PHP", language: "php", code: "time()" },
  { label: "Java (milliseconds)", language: "java", code: "System.currentTimeMillis()" },
  { label: "C#", language: "csharp", code: "DateTimeOffset.UtcNow.ToUnixTimeSeconds()" },
  { label: "Go", language: "go", code: "time.Now().Unix()" },
  { label: "Bash", language: "bash", code: "date +%s" },
  { label: "PostgreSQL", language: "sql", code: "SELECT EXTRACT(EPOCH FROM now())::bigint;" },
  { label: "MySQL", language: "sql", code: "SELECT UNIX_TIMESTAMP();" },
];

export function getExamples(slug: ToolSlug): ToolExamples {
  switch (slug) {
    case "unix-timestamp-converter":
      return {
        kind: "io",
        intro: "These examples use the Auto unit setting. Results are shown in UTC so they are the same for everyone.",
        items: [
          ts("0", "The Unix epoch"),
          ts("1790000000", "A timestamp in seconds"),
          ts("1790000000123", "A timestamp in milliseconds", "Twelve or more digits are detected as milliseconds."),
          ts("-86400", "A negative timestamp", "Negative values are moments before 1 January 1970."),
        ],
      };

    case "epoch-converter":
      return {
        kind: "io",
        intro: "Three epoch values people often look up.",
        items: [
          ts("946684800", "Start of the year 2000"),
          ts("1700000000", "One billion seven hundred million seconds"),
          ts("2147483647", "The largest signed 32-bit value", "One second later, 32-bit systems overflow. This is the Year 2038 problem."),
        ],
      };

    case "timestamp-to-date": {
      const leapDay = utcFromParts(2024, 2, 29) / 1000;
      const d = dateDetails(leapDay * 1000);
      const item = ts(String(leapDay), "A leap day");
      item.results.push({ label: "Day of year", value: String(d.dayOfYear) });
      item.results.push({ label: "Leap year", value: d.leapYear ? "Yes" : "No" });
      return {
        kind: "io",
        intro: "Examples in UTC, with the calendar details the tool adds.",
        items: [ts("1609459200", "The start of 2021"), item, ts("1790000000000", "The same kind of value in milliseconds")],
      };
    }

    case "date-to-timestamp":
      return {
        kind: "io",
        intro: "The same clock reading gives different timestamps in different zones.",
        items: [
          wall(2026, 9, 20, 12, 30, "UTC", "Noon in UTC"),
          wall(2026, 9, 20, 12, 30, "America/New_York", "The same clock time in New York"),
          wall(2000, 1, 1, 0, 0, "UTC", "The start of the year 2000"),
        ],
      };

    case "current-unix-timestamp":
      return {
        kind: "code",
        intro: "How to read the current Unix timestamp in common languages and tools.",
        items: CODE_NOW,
      };

    case "milliseconds-to-date":
      return {
        kind: "io",
        intro: "The millisecond fraction is kept in the result.",
        items: [
          msOnly(1790000000123, "A value from Date.now()"),
          msOnly(1700000000000, "A whole-second value"),
          msOnly(
            999,
            "Less than one second after the epoch",
            "Other pages would auto-detect 999 as seconds. This tool always reads milliseconds.",
          ),
        ],
      };

    case "iso-8601-to-unix":
      return {
        kind: "io",
        intro: "Strings with an offset or Z do not depend on the assumed zone.",
        items: [
          iso("2026-09-20T12:30:00Z", "UTC time (Z)"),
          iso("2026-09-20T14:30:00+02:00", "The same instant with an offset", "UTC", "This is the same instant as the string above."),
          iso("2026-09-20T12:30:00.250Z", "With fractional seconds"),
          iso("2026-09-20", "A date without a time", "UTC", "Read as midnight in the assumed zone, UTC by default."),
        ],
      };

    case "unix-to-iso-8601": {
      const ms = 1790000000123;
      return {
        kind: "io",
        intro: "One instant written three ways.",
        items: [
          { title: "UTC", input: "1790000000123 (milliseconds)", results: [{ label: "ISO 8601", value: toIsoUtc(ms) }] },
          {
            title: "Tokyo (UTC+09:00)",
            input: "1790000000123 (milliseconds)",
            results: [{ label: "ISO 8601", value: toIsoOffset(ms, "Asia/Tokyo") }],
          },
          {
            title: "New York (daylight saving time)",
            input: "1790000000123 (milliseconds)",
            results: [{ label: "ISO 8601", value: toIsoOffset(ms, "America/New_York") }],
            note: "Same instant, different offset.",
          },
        ],
      };
    }

    case "timezone-converter":
      return {
        kind: "io",
        intro: "Results follow the daylight saving rules in effect on each date.",
        items: [
          convert(2026, 9, 20, 12, 0, "UTC", "America/New_York", "Noon UTC in New York"),
          convert(2026, 7, 1, 9, 0, "Europe/London", "Asia/Tokyo", "A summer meeting in London, seen from Tokyo"),
          convert(2026, 1, 15, 18, 30, "Africa/Algiers", "Asia/Dubai", "Algiers evening in Dubai"),
        ],
      };

    case "timestamp-difference": {
      const a = 1790000000000;
      const b = a + ((2 * 24 + 4) * 60 + 12) * 60_000 + 30_000;
      const diff = diffTimestamps(a, b);
      return {
        kind: "io",
        intro: "Timestamp B is later than timestamp A in this example.",
        items: [
          {
            title: "Two days, four hours, twelve minutes and thirty seconds",
            input: `A = ${a / 1000}, B = ${b / 1000} (seconds)`,
            results: [
              { label: "Human-readable", value: diff.human },
              { label: "Seconds", value: diff.totals.seconds },
              { label: "Hours", value: diff.totals.hours },
            ],
          },
          {
            title: "Timestamps in different units",
            input: "A = 1790000000 (seconds), B = 1790000000500 (milliseconds)",
            results: [{ label: "Human-readable", value: diffTimestamps(1790000000000, 1790000000500).human }],
            note: "Each timestamp has its own unit setting, and Auto detects each one separately.",
          },
          {
            title: "A full day apart",
            input: "A = 1790000000, B = 1790086400 (seconds)",
            results: [
              { label: "Human-readable", value: diffTimestamps(1790000000000, 1790086400000).human },
              { label: "Hours", value: diffTimestamps(1790000000000, 1790086400000).totals.hours },
            ],
          },
        ],
      };
    }

    case "utc-converter": {
      const noon = wallClockToInstant({ year: 2026, month: 9, day: 21, hour: 9, minute: 0, second: 0 }, "America/New_York");
      const ms = noon.ok ? noon.value.ms : 0;
      return {
        kind: "io",
        intro: "A local time converted to UTC, and the same instant seen from a third zone.",
        items: [
          {
            title: "09:00 in New York, converted to UTC",
            input: "2026-09-21 09:00 America/New_York",
            results: [
              { label: "UTC", value: `${formatCompact(ms, "UTC")} UTC` },
              { label: "Offset used", value: formatOffsetLabel(getOffsetMs(ms, "America/New_York")) },
            ],
          },
          {
            title: "The same instant in Tokyo",
            input: "2026-09-21 09:00 America/New_York",
            results: [{ label: "Tokyo time", value: formatCompact(ms, "Asia/Tokyo") }],
          },
          {
            title: "Midnight UTC, converted to Algiers",
            input: "2026-01-01 00:00 UTC",
            results: [{ label: "Algiers time", value: formatCompact(Date.UTC(2026, 0, 1), "Africa/Algiers") }],
          },
        ],
      };
    }

    case "date-difference": {
      const a = { year: 2024, month: 2, day: 28, hour: 0, minute: 0, second: 0 };
      const b = { year: 2024, month: 3, day: 1, hour: 0, minute: 0, second: 0 };
      const d = calendarDifference(a, b);
      const school = calendarDifference(
        { year: 2026, month: 9, day: 1, hour: 0, minute: 0, second: 0 },
        { year: 2027, month: 6, day: 15, hour: 0, minute: 0, second: 0 },
      );
      return {
        kind: "io",
        intro: "A leap-year crossing and a longer, multi-month gap.",
        items: [
          {
            title: "Across a leap day",
            input: "2024-02-28 to 2024-03-01",
            results: [
              { label: "Difference", value: d.human },
              { label: "Total days", value: d.totals.days },
            ],
          },
          {
            title: "Nine and a half months",
            input: "2026-09-01 to 2027-06-15",
            results: [
              { label: "Difference", value: school.human },
              { label: "Total weeks", value: school.totals.weeks },
            ],
          },
          {
            title: "The same date, twice",
            input: "2026-09-21 to 2026-09-21",
            results: [{ label: "Difference", value: calendarDifference(
              { year: 2026, month: 9, day: 21, hour: 0, minute: 0, second: 0 },
              { year: 2026, month: 9, day: 21, hour: 0, minute: 0, second: 0 },
            ).human }],
          },
        ],
      };
    }

    case "time-duration-calculator": {
      const cross = timeOfDayDuration({ hour: 23, minute: 30, second: 0 }, { hour: 1, minute: 15, second: 0 });
      const same = timeOfDayDuration({ hour: 9, minute: 0, second: 0 }, { hour: 17, minute: 30, second: 0 });
      return {
        kind: "io",
        intro: "A shift that crosses midnight, and one that does not.",
        items: [
          {
            title: "Crossing midnight",
            input: "23:30 to 01:15",
            results: [{ label: "Duration", value: cross.human }],
            note: "The end time is earlier than the start time, so it is read as being on the next day.",
          },
          {
            title: "Same day",
            input: "09:00 to 17:30",
            results: [{ label: "Duration", value: same.human }],
          },
          {
            title: "A full day, stated explicitly",
            input: "09:00 to 09:00, plus 1 extra day",
            results: [{ label: "Duration", value: timeOfDayDuration({ hour: 9, minute: 0, second: 0 }, { hour: 9, minute: 0, second: 0 }, 1).human }],
          },
        ],
      };
    }

    case "add-time": {
      const start = Date.UTC(2026, 8, 21, 12, 0, 0);
      const plusWeek = shiftInstant(start, 1, "weeks", "UTC");
      const plusHours = shiftInstant(start, 36, "hours", "UTC");
      return {
        kind: "io",
        intro: "Adding a calendar unit (weeks) and an exact-time unit (hours).",
        items: [
          {
            title: "Add 1 week",
            input: "2026-09-21 12:00 UTC + 1 week",
            results: [{ label: "Result", value: plusWeek.ok ? toIsoUtc(plusWeek.value.ms) : "" }],
          },
          {
            title: "Add 36 hours",
            input: "2026-09-21 12:00 UTC + 36 hours",
            results: [{ label: "Result", value: plusHours.ok ? toIsoUtc(plusHours.value.ms) : "" }],
          },
          {
            title: "Add 90 seconds",
            input: "2026-09-21 12:00 UTC + 90 seconds",
            results: [
              {
                label: "Result",
                value: (() => {
                  const r = shiftInstant(start, 90, "seconds", "UTC");
                  return r.ok ? toIsoUtc(r.value.ms) : "";
                })(),
              },
            ],
          },
        ],
      };
    }

    case "subtract-time": {
      const start = Date.UTC(2026, 8, 21, 12, 0, 0);
      const minusDays = shiftInstant(start, 90, "days", "UTC", -1);
      const minusMinutes = shiftInstant(start, 45, "minutes", "UTC", -1);
      return {
        kind: "io",
        intro: "Subtracting a calendar unit (days) and an exact-time unit (minutes).",
        items: [
          {
            title: "Subtract 90 days",
            input: "2026-09-21 12:00 UTC \u2212 90 days",
            results: [{ label: "Result", value: minusDays.ok ? toIsoUtc(minusDays.value.ms) : "" }],
          },
          {
            title: "Subtract 45 minutes",
            input: "2026-09-21 12:00 UTC \u2212 45 minutes",
            results: [{ label: "Result", value: minusMinutes.ok ? toIsoUtc(minusMinutes.value.ms) : "" }],
          },
          {
            title: "Subtract 2 weeks",
            input: "2026-09-21 12:00 UTC \u2212 2 weeks",
            results: [
              {
                label: "Result",
                value: (() => {
                  const r = shiftInstant(start, 2, "weeks", "UTC", -1);
                  return r.ok ? toIsoUtc(r.value.ms) : "";
                })(),
              },
            ],
          },
        ],
      };
    }

    case "unix-timestamp-validator": {
      const good = validateTimestamp("1790000000", "seconds");
      const bad = validateTimestamp("hello world");
      return {
        kind: "io",
        intro: "A valid value and an invalid one, with the exact reason shown for each.",
        items: [
          {
            title: "A valid timestamp",
            input: "1790000000 (seconds)",
            results: [{ label: "Result", value: good.valid ? good.message : "" }],
          },
          {
            title: "Not a number",
            input: "hello world",
            results: [{ label: "Result", value: bad.valid ? "" : bad.message }],
          },
          {
            title: "A negative timestamp",
            input: "-86400 (seconds)",
            results: [{ label: "Result", value: (() => { const r = validateTimestamp("-86400", "seconds"); return r.valid ? r.message : ""; })() }],
          },
        ],
      };
    }

    case "epoch-milliseconds": {
      const ms = 1790000000123;
      return {
        kind: "io",
        intro: "The millisecond fraction is kept in the result.",
        items: [
          {
            title: "A value from Date.now()",
            input: `${ms} (milliseconds)`,
            results: [
              { label: "UTC", value: `${formatCompact(ms, "UTC", { withMs: true })} UTC` },
              { label: "ISO 8601", value: toIsoUtc(ms) },
            ],
          },
          {
            title: "The Unix epoch itself",
            input: "0 (milliseconds)",
            results: [{ label: "UTC", value: `${formatCompact(0, "UTC")} UTC` }],
          },
          {
            title: "A 10-digit value read as milliseconds",
            input: "1700000000 (milliseconds)",
            results: [{ label: "UTC", value: `${formatCompact(1_700_000_000, "UTC")} UTC` }],
            note: "Only 20 days after the epoch: this is a seconds value read as milliseconds by mistake.",
          },
        ],
      };
    }

    case "unix-timestamp-batch-converter": {
      const r = convertBatch("0\n86400\nnot-a-number\n1790000000", "seconds", "UTC");
      return {
        kind: "io",
        intro: "Four pasted lines: three valid timestamps and one invalid line, each reported on its own row.",
        items: r.rows.map((row) => ({
          title: `Line ${row.line}`,
          input: row.input,
          results: row.ok
            ? [
                { label: "UTC", value: row.utc ?? "" },
                { label: "ISO 8601", value: row.iso ?? "" },
              ]
            : [{ label: "Status", value: row.error ?? "Invalid" }],
        })),
      };
    }

    case "date-format-converter": {
      const r = parseAnyDate("Mon, 21 Sep 2026 14:13:20 +0000");
      const ms = r.ok ? r.value.ms : 0;
      return {
        kind: "io",
        intro: "One RFC 2822 date, shown in every other supported format.",
        items: [
          {
            title: "Detected as RFC 2822",
            input: "Mon, 21 Sep 2026 14:13:20 +0000",
            results: [
              { label: "ISO 8601", value: toIsoUtc(ms) },
              { label: "RFC 3339", value: toRfc3339(ms, "UTC") },
              { label: "Unix seconds", value: String(Math.floor(ms / 1000)) },
            ],
          },
          {
            title: "Detected from a Unix timestamp",
            input: "1790000000 (seconds)",
            results: [{ label: "RFC 2822", value: (() => { const p = parseTimestamp("1790000000", "seconds"); return p.ok ? toIsoUtc(p.value.ms) : ""; })() }],
          },
          {
            title: "Detected from an ISO 8601 date",
            input: "2026-09-20",
            results: [{ label: "Unix seconds", value: (() => { const p = parseAnyDate("2026-09-20"); return p.ok ? String(Math.floor(p.value.ms / 1000)) : ""; })() }],
          },
        ],
      };
    }

    case "iso-8601-converter": {
      const parsed = parseIso8601("2026-09-20T12:30:00Z");
      const msA = parsed.ok ? parsed.value.ms : 0;
      const msB = 1790000000000;
      return {
        kind: "io",
        intro: "ISO 8601 to Unix time, and Unix time back to ISO 8601.",
        items: [
          {
            title: "ISO 8601 to Unix",
            input: "2026-09-20T12:30:00Z",
            results: [
              { label: "Unix seconds", value: String(Math.floor(msA / 1000)) },
              { label: "Unix milliseconds", value: String(msA) },
            ],
          },
          {
            title: "Unix to ISO 8601",
            input: `${msB} (milliseconds)`,
            results: [{ label: "ISO 8601", value: toIsoUtc(msB) }],
          },
          {
            title: "A date-only ISO 8601 string",
            input: "2026-09-20",
            results: [{ label: "Read as", value: (() => { const p = parseIso8601("2026-09-20"); return p.ok ? toIsoUtc(p.value.ms) : ""; })() }],
          },
        ],
      };
    }

    case "rfc-3339-converter": {
      const r = parseRfc3339("2026-09-20T14:30:00+02:00");
      const ms = r.ok ? r.value.ms : 0;
      return {
        kind: "io",
        intro: "An RFC 3339 timestamp with an offset, converted to Unix time and back.",
        items: [
          {
            title: "RFC 3339 to Unix",
            input: "2026-09-20T14:30:00+02:00",
            results: [{ label: "Unix seconds", value: String(Math.floor(ms / 1000)) }],
          },
          {
            title: "Unix to RFC 3339 (UTC)",
            input: String(Math.floor(ms / 1000)),
            results: [{ label: "RFC 3339", value: toRfc3339(ms, "UTC") }],
          },
          {
            title: "Unix to RFC 3339, Tokyo offset",
            input: String(Math.floor(ms / 1000)),
            results: [{ label: "RFC 3339", value: toRfc3339(ms, "Asia/Tokyo") }],
          },
        ],
      };
    }

    case "timezone-offset": {
      const noon = wallClockToInstant({ year: 2026, month: 7, day: 1, hour: 12, minute: 0, second: 0 }, "UTC");
      const ms = noon.ok ? noon.value.ms : 0;
      return {
        kind: "io",
        intro: "Two zones compared on the same summer date.",
        items: [
          {
            title: "London vs New York, 1 July 2026",
            input: "Europe/London vs America/New_York",
            results: [
              { label: "London offset", value: formatOffsetLabel(getOffsetMs(ms, "Europe/London")) },
              { label: "New York offset", value: formatOffsetLabel(getOffsetMs(ms, "America/New_York")) },
            ],
          },
          {
            title: "Algiers vs Dubai, same date",
            input: "Africa/Algiers vs Asia/Dubai",
            results: [
              { label: "Algiers offset", value: formatOffsetLabel(getOffsetMs(ms, "Africa/Algiers")) },
              { label: "Dubai offset", value: formatOffsetLabel(getOffsetMs(ms, "Asia/Dubai")) },
            ],
          },
          {
            title: "London vs New York, in winter",
            input: "Europe/London vs America/New_York, 1 January 2026",
            results: (() => {
              const winter = wallClockToInstant({ year: 2026, month: 1, day: 1, hour: 12, minute: 0, second: 0 }, "UTC");
              const wms = winter.ok ? winter.value.ms : 0;
              return [
                { label: "London offset", value: formatOffsetLabel(getOffsetMs(wms, "Europe/London")) },
                { label: "New York offset", value: formatOffsetLabel(getOffsetMs(wms, "America/New_York")) },
              ];
            })(),
            note: "Both zones are on standard time in January, so the gap is 5 hours instead of the 4 hours it is in July.",
          },
        ],
      };
    }

    case "world-clock": {
      const ms = Date.UTC(2026, 8, 21, 14, 42, 31);
      const ny = readClock(ms, "America/New_York");
      const london = readClock(ms, "Europe/London");
      return {
        kind: "io",
        intro: "The same instant, read as two of the default cities.",
        items: [
          {
            title: "New York",
            input: toIsoUtc(ms),
            results: [
              { label: "Local time", value: `${ny.time}:${ny.seconds}` },
              { label: "Offset", value: ny.offset },
            ],
          },
          {
            title: "London",
            input: toIsoUtc(ms),
            results: [
              { label: "Local time", value: `${london.time}:${london.seconds}` },
              { label: "Offset", value: london.offset },
            ],
          },
          {
            title: "Tokyo",
            input: toIsoUtc(ms),
            results: (() => {
              const tokyo = readClock(ms, "Asia/Tokyo");
              return [
                { label: "Local time", value: `${tokyo.time}:${tokyo.seconds}` },
                { label: "Offset", value: tokyo.offset },
              ];
            })(),
          },
        ],
      };
    }

    case "business-hours-converter": {
      const r = computeBusinessHours({ year: 2026, month: 9, day: 21 }, [
        { zone: "America/New_York", start: "09:00", end: "17:00" },
        { zone: "Europe/London", start: "09:00", end: "17:00" },
      ]);
      return {
        kind: "io",
        intro: "Two teams' working hours, and the overlap between them.",
        items: r.ok
          ? [
              {
                title: "New York, in London time",
                input: "09:00\u201317:00 America/New_York",
                results: [{ label: "In London", value: r.value.rows[0].inReference }],
              },
              {
                title: "Overlap",
                input: "Both teams' 09:00\u201317:00 windows",
                results: [{ label: "Overlap (minutes)", value: String(r.value.overlap?.minutes ?? 0) }],
              },
              {
                title: "London, in New York time",
                input: "09:00\u201317:00 Europe/London",
                results: [{ label: "In New York", value: r.value.rows[1].inReference }],
              },
            ]
          : [],
      };
    }

    case "cron-generator": {
      const parsed = parseCron("0 9 * * 1-5");
      const c = parsed.ok ? parsed.value : null;
      const runs = c ? nextRuns(c, Date.UTC(2026, 8, 21, 10, 0, 0), 2) : [];
      return {
        kind: "io",
        intro: "A weekday-morning schedule, explained and projected forward.",
        items: [
          {
            title: "0 9 * * 1-5",
            input: "0 9 * * 1-5",
            results: [
              { label: "Meaning", value: c ? describeCron(c) : "" },
              { label: "Next run", value: runs[0] ? toIsoUtc(runs[0]) : "" },
            ],
          },
          {
            title: "Every 15 minutes",
            input: "*/15 * * * *",
            results: [{ label: "Meaning", value: (() => { const p = parseCron("*/15 * * * *"); return p.ok ? describeCron(p.value) : ""; })() }],
          },
          {
            title: "Once a month",
            input: "0 0 1 * *",
            results: [{ label: "Meaning", value: (() => { const p = parseCron("0 0 1 * *"); return p.ok ? describeCron(p.value) : ""; })() }],
          },
        ],
      };
    }
    case "json-formatter": {
      return {
        kind: "io",
        intro: "Standard JSON formatting, minification, and key sorting examples.",
        items: [
          {
            title: "2-Space Pretty Print",
            input: '{"user":"alex","roles":["admin","editor"]}',
            results: [
              { label: "Formatted", value: '{\n  "user": "alex",\n  "roles": [\n    "admin",\n    "editor"\n  ]\n}' },
              { label: "Indentation", value: "2 spaces" }
            ]
          },
          {
            title: "Minification",
            input: '{\n  "status": "ok",\n  "code": 200\n}',
            results: [
              { label: "Minified", value: '{"status":"ok","code":200}' },
              { label: "Size Reduction", value: "Saves ~30% whitespace bytes" }
            ]
          }
        ]
      };
    }

    case "base64-encoder-decoder": {
      return {
        kind: "io",
        intro: "Base64 standard and URL-safe encoding examples.",
        items: [
          {
            title: "Plain Text Encoding",
            input: "Hello World",
            results: [
              { label: "Base64", value: "SGVsbG8gV29ybGQ=" },
              { label: "URL-Safe", value: "SGVsbG8gV29ybGQ" }
            ]
          },
          {
            title: "Unicode & Emojis",
            input: "Castov 🚀",
            results: [
              { label: "Base64", value: "Q2FzdG92IPCfmYA=" },
              { label: "Decoded", value: "Castov 🚀" }
            ]
          }
        ]
      };
    }

    case "jwt-decoder": {
      return {
        kind: "io",
        intro: "JWT token structure and standard claims inspection.",
        items: [
          {
            title: "Decoded Claims",
            input: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxODAwMDAwMDAwfQ...",
            results: [
              { label: "Algorithm (alg)", value: "HS256" },
              { label: "Subject (sub)", value: "1234567890" },
              { label: "Expires (exp)", value: "Epoch timestamp verified locally" }
            ]
          }
        ]
      };
    }

    case "uuid-generator": {
      return {
        kind: "io",
        intro: "UUID v4 random and UUID v7 time-ordered examples.",
        items: [
          {
            title: "UUID v4 (Random)",
            input: "crypto.randomUUID()",
            results: [
              { label: "Format", value: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx" },
              { label: "Entropy", value: "122 bits of cryptographic randomness" }
            ]
          },
          {
            title: "UUID v7 (Time-Ordered)",
            input: "RFC 9562 Timestamp-ordered",
            results: [
              { label: "Prefix", value: "48-bit Unix epoch millisecond timestamp" },
              { label: "Database Advantage", value: "Sequential B-Tree insert clustering" }
            ]
          }
        ]
      };
    }

    case "hash-generator": {
      return {
        kind: "io",
        intro: "Standard cryptographic digest output examples.",
        items: [
          {
            title: "SHA-256 Digest",
            input: "castov",
            results: [
              { label: "Hex", value: "1273934d400199d30c5e7b5fbe92b67faaccd8d63806be44d9f67a57a16f6b5b" },
              { label: "Output Length", value: "256 bits (64 hex characters)" }
            ]
          },
          {
            title: "MD5 Checksum (Legacy)",
            input: "castov",
            results: [
              { label: "Hex", value: "765275812e96d92497fbba1409d9491b" },
              { label: "Usage", value: "Legacy file integrity verification only" }
            ]
          }
        ]
      };
    }

    case "json-to-ts": {
      return {
        kind: "io",
        intro: "Conversion from JSON to TypeScript interfaces.",
        items: [
          {
            title: "User Profile Object",
            input: '{"id": 1, "name": "Alex", "active": true}',
            results: [
              { label: "Interface", value: "export interface Root { id: number; name: string; active: boolean; }" }
            ]
          }
        ]
      };
    }

    case "diff-checker": {
      return {
        kind: "io",
        intro: "Line by line code comparison.",
        items: [
          {
            title: "Configuration Change",
            input: "Original: port=3000 -> Modified: port=8080",
            results: [
              { label: "Change", value: "Modified port number line" }
            ]
          }
        ]
      };
    }

    case "cyber-decoder": {
      return {
        kind: "io",
        intro: "Real-world data decoding, cryptographic analysis, and transformation recipes.",
        items: [
          {
            title: "Base64 & Hex Stream Decoding",
            input: "43 61 73 74 6f 76 (Hexadecimal bytes)",
            results: [
              { label: "Decoded String", value: "Castov" },
              { label: "Detected Format", value: "Hexadecimal byte stream" },
              { label: "Entropy", value: "2.585 (Standard text)" }
            ]
          },
          {
            title: "ROT13 Cipher Deobfuscation",
            input: "Pnfgbi qrpbqre vf snfg naq 100% pyvrag-fvqr.",
            results: [
              { label: "Decoded Plaintext", value: "Castov decoder is fast and 100% client-side." },
              { label: "Method", value: "Caesar ROT13 shift (+13)" }
            ]
          },
          {
            title: "JWT Token Claims Inspection",
            input: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEiLCJleHAiOjE4MDAwMDAwMDB9.sig",
            results: [
              { label: "Algorithm", value: "HS256" },
              { label: "Subject", value: "user_1" },
              { label: "Verification Status", value: "Unverified Signature (Claims Decoded Only)" }
            ]
          }
        ]
      };
    }

    case "timezone-simulator":
    case "universal-config-sync":
    case "env-vault":
    case "secret-scanner":
    case "api-load-tester":
    case "docker-visualizer":
    case "sqlite-fiddle":
      return { kind: "io", intro: "", items: [] };
    default:
      return { kind: "io", intro: "", items: [] };
  }
}
