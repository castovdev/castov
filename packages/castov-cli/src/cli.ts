#!/usr/bin/env node
import { parseArgs } from "node:util";
import { createRequire } from "node:module";
import {
  castov,
  type HashAlgorithm,
  ts as parseTs,
  detect as detectId,
  cron as explainCron,
  tz as convertTz,
} from "castov-sdk";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

// ---------------------------------------------------------------------------
// ANSI color helpers (respects NO_COLOR and non-TTY output)
// ---------------------------------------------------------------------------
const useColor = Boolean(process.stdout.isTTY && !process.env.NO_COLOR);
const paint = (code: number) => (s: string) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = paint(1);
const dim = paint(2);
const cyan = paint(36);
const yellow = paint(33);
const red = (s: string) => (process.stderr.isTTY && !process.env.NO_COLOR ? `\x1b[31m${s}\x1b[0m` : s);

class UsageError extends Error {}

// ---------------------------------------------------------------------------
// Help Text
// ---------------------------------------------------------------------------

const MAIN_HELP = `
${bold("castov")} ${dim(`v${version}`)} — zero-server developer utilities in your terminal

${bold("Usage")}
  castov <command> [options]

${bold("Commands")}
  ${cyan("ts")} <value>                 Unix seconds or milliseconds (auto-detect) -> UTC, ISO, local
  ${cyan("detect")} <value>             Identify timestamp or ID format (ObjectId, Snowflake, UUIDv7, ULID, etc.)
  ${cyan("cron")} "<expr>" [timezone]   Plain-English cron explanation + next 5 runs
  ${cyan("tz")} "<datetime>" <from> <to> Convert between IANA time zones with DST gap & overlap handling
  ${cyan("uuid")}                       Generate UUID v4 or v7        ${dim("-n <count>  --v7  --upper")}
  ${cyan("nanoid")} [size]              Generate URL-safe ID          ${dim("-n <count>")}
  ${cyan("encode")} <text>              Base64-encode text            ${dim("--url")}
  ${cyan("decode")} <base64>            Base64-decode text
  ${cyan("hash")} <text>                Hex digest                    ${dim("-a sha1|sha256|sha384|sha512")}
  ${cyan("now")}                        Current Unix timestamp + ISO
  ${cyan("unix")} <ts|iso>              Convert Unix <-> ISO 8601
  ${cyan("jwt")} <token>                Decode a JWT locally (no verification)

${bold("Global Options")}
  -h, --help           Show help (run "castov <command> --help" for command details)
  -v, --version        Show version

${bold("Examples")}
  castov ts 1700000000
  castov detect 018bcfe5-6800-7d90-bc4e-2895f32a762c
  castov cron "0 9 * * 1-5" "America/New_York"
  castov tz "2026-03-08 02:30:00" America/New_York Europe/Paris
  castov uuid -n 3 --v7
`;

const COMMAND_HELP: Record<string, string> = {
  ts: `
${bold("castov ts")} — parse Unix timestamp with automatic unit detection

${bold("Usage")}
  castov ts <value>

${bold("Arguments")}
  <value>    Unix timestamp in seconds (e.g. 1700000000) or milliseconds (e.g. 1700000000000).
             Can also be passed via stdin pipe.

${bold("Examples")}
  castov ts 1700000000
  castov ts 1700000000000
  echo "1700000000" | castov ts
`,

  detect: `
${bold("castov detect")} — identify timestamp or ID format and decode its embedded date

${bold("Usage")}
  castov detect <value>

${bold("Supported Formats")}
  • Unix timestamp (seconds)
  • Unix timestamp (milliseconds)
  • MongoDB ObjectId (24 hex characters)
  • Twitter Snowflake (64-bit ID, custom 2010 epoch)
  • Discord Snowflake (64-bit ID, custom 2015 epoch)
  • UUIDv7 (RFC 9562 time-sortable UUID)
  • ULID (26-character Crockford Base32 ID)

${bold("Examples")}
  castov detect 1700000000
  castov detect 507f1f77bcf86cd799439011
  castov detect 018bcfe5-6800-7d90-bc4e-2895f32a762c
  castov detect 01ARZ3NDEKTSV4RRFFQ69G5FAV
`,

  cron: `
${bold("castov cron")} — explain cron expression in plain English and preview upcoming runs

${bold("Usage")}
  castov cron "<expression>" [timezone]

${bold("Arguments")}
  <expression>  Standard 5-field cron (minute hour day-of-month month day-of-week) or macro (@daily, @hourly, etc.)
  [timezone]    Optional IANA time zone (e.g. "America/New_York", "UTC", "Europe/Paris"). Defaults to local time.

${bold("Examples")}
  castov cron "*/15 * * * *"
  castov cron "0 9 * * 1-5" "America/New_York"
  castov cron "@daily" UTC
`,

  tz: `
${bold("castov tz")} — convert date & time between IANA time zones with DST gap & overlap handling

${bold("Usage")}
  castov tz "<date time>" <from> <to>

${bold("Arguments")}
  <date time>   Date and time in "YYYY-MM-DD HH:mm:ss" or ISO format.
  <from>        Source IANA time zone (e.g. "America/New_York", "UTC", "Asia/Tokyo").
  <to>          Target IANA time zone.

${bold("DST Handling")}
  • Gaps (spring forward, nonexistent hour): Adjusts forward by gap length and outputs a clear warning.
  • Overlaps (fall back, repeated hour): Resolves to the earlier occurrence and outputs a clear warning.

${bold("Examples")}
  castov tz "2026-10-11 14:00:00" America/New_York Europe/Paris
  castov tz "2026-03-08 02:30:00" America/New_York UTC
`,

  uuid: `
${bold("castov uuid")} — generate RFC 9562 UUIDs

${bold("Usage")}
  castov uuid [options]

${bold("Options")}
  -n, --count <n>   Generate multiple UUIDs (1-100000)
  --v7              Generate time-sortable UUIDv7 instead of random UUIDv4
  -u, --upper       Output in uppercase

${bold("Examples")}
  castov uuid
  castov uuid --v7
  castov uuid -n 5 --v7 --upper
`,

  nanoid: `
${bold("castov nanoid")} — generate URL-safe random IDs

${bold("Usage")}
  castov nanoid [size] [options]

${bold("Options")}
  -n, --count <n>   Generate multiple IDs
`,

  encode: `
${bold("castov encode")} — Base64-encode text with UTF-8 support

${bold("Usage")}
  castov encode <text> [options]

${bold("Options")}
  --url             Use URL-safe alphabet (- and _) without padding
`,

  decode: `
${bold("castov decode")} — Base64-decode to UTF-8 text

${bold("Usage")}
  castov decode <base64>
`,

  hash: `
${bold("castov hash")} — compute cryptographic hash hex digest

${bold("Usage")}
  castov hash <text> [options]

${bold("Options")}
  -a, --algorithm <algo>   sha1, sha256 (default), sha384, or sha512
`,

  now: `
${bold("castov now")} — print current Unix timestamp and ISO 8601 string

${bold("Usage")}
  castov now
`,

  unix: `
${bold("castov unix")} — convert Unix timestamp to ISO 8601 or ISO 8601 to Unix seconds

${bold("Usage")}
  castov unix <timestamp|iso>
`,

  jwt: `
${bold("castov jwt")} — decode JWT header and payload locally (no verification)

${bold("Usage")}
  castov jwt <token>
`,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return "";
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");
}

async function input(positionals: string[], name: string): Promise<string> {
  const value = positionals.length ? positionals.join(" ") : await readStdin();
  if (!value) throw new UsageError(`missing <${name}> argument. Run "castov --help".`);
  return value;
}

function count(raw: string | undefined): number {
  const n = raw === undefined ? 1 : Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 100_000) {
    throw new UsageError("--count must be an integer between 1 and 100000");
  }
  return n;
}

// ---------------------------------------------------------------------------
// Main CLI Runner
// ---------------------------------------------------------------------------

async function main(argv: string[]): Promise<void> {
  const [command, ...rest] = argv;

  if (!command || command === "-h" || command === "--help" || command === "help") {
    process.stdout.write(MAIN_HELP.trim() + "\n");
    return;
  }
  if (command === "-v" || command === "--version") {
    process.stdout.write(version + "\n");
    return;
  }

  // Check command-specific help: `castov <cmd> --help` or `castov <cmd> -h`
  if (rest.includes("-h") || rest.includes("--help")) {
    const specificHelp = COMMAND_HELP[command];
    if (specificHelp) {
      process.stdout.write(specificHelp.trim() + "\n");
      return;
    }
    process.stdout.write(MAIN_HELP.trim() + "\n");
    return;
  }

  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    strict: true,
    options: {
      count: { type: "string", short: "n" },
      v7: { type: "boolean" },
      upper: { type: "boolean", short: "u" },
      url: { type: "boolean" },
      algorithm: { type: "string", short: "a" },
      help: { type: "boolean", short: "h" },
    },
  });

  const out: string[] = [];

  switch (command) {
    case "ts": {
      const rawVal = positionals[0] ?? (await readStdin());
      if (!rawVal) throw new UsageError(`missing <value> for "castov ts". Run "castov ts --help".`);
      const res = parseTs(rawVal);
      out.push(`UTC:      ${res.utc}`);
      out.push(`ISO 8601: ${res.iso}`);
      out.push(`Local:    ${res.local}`);
      break;
    }

    case "detect": {
      const rawVal = positionals[0] ?? (await readStdin());
      if (!rawVal) throw new UsageError(`missing <value> for "castov detect". Run "castov detect --help".`);
      const matches = detectId(rawVal);
      if (matches.length === 0) {
        out.push(`No recognized timestamp or ID format found for "${rawVal.trim()}".`);
      } else if (matches.length === 1) {
        const m = matches[0];
        out.push(`Detected 1 format for "${rawVal.trim()}":`);
        out.push(`  • ${bold(m.label)}: ${m.iso} (UTC: ${m.utc})`);
      } else {
        out.push(`Detected ${matches.length} formats for "${rawVal.trim()}":`);
        for (const m of matches) {
          out.push(`  • ${bold(m.label.padEnd(28))}: ${m.iso} (UTC: ${m.utc})`);
        }
      }
      break;
    }

    case "cron": {
      const expr = positionals[0];
      if (!expr) throw new UsageError(`missing "<expression>" for "castov cron". Run "castov cron --help".`);
      const timezone = positionals[1];
      const res = explainCron(expr, timezone);
      out.push(`Schedule:  ${bold(res.description)}`);
      out.push(`Timezone:  ${res.timezone}`);
      out.push(``);
      out.push(`Next 5 runs:`);
      res.nextRuns.forEach((run, i) => {
        out.push(`  ${i + 1}. ${run.local} (${dim(run.iso)})`);
      });
      break;
    }

    case "tz": {
      const dateTime = positionals[0];
      const fromZone = positionals[1];
      const toZone = positionals[2];
      if (!dateTime || !fromZone || !toZone) {
        throw new UsageError(`Usage: castov tz "<date time>" <from> <to>. Run "castov tz --help".`);
      }
      const res = convertTz(dateTime, fromZone, toZone);
      out.push(`From:     ${res.fromFormatted} ${res.fromZone} (${res.fromAbbreviation}, ${res.fromOffset})`);
      out.push(`To:       ${bold(res.toFormatted)} ${bold(res.toZone)} (${res.toAbbreviation}, ${res.toOffset})`);
      out.push(`ISO 8601: ${res.iso}`);
      if (res.hasDstWarning && res.warning) {
        out.push(``);
        out.push(`${yellow("⚠")} ${res.warning}`);
      }
      break;
    }

    case "uuid": {
      const n = count(values.count);
      for (let i = 0; i < n; i++) {
        const id = values.v7 ? castov.uuidv7() : castov.uuid();
        out.push(values.upper ? id.toUpperCase() : id);
      }
      break;
    }

    case "nanoid": {
      const size = positionals[0] ? Number(positionals[0]) : 21;
      const n = count(values.count);
      for (let i = 0; i < n; i++) out.push(castov.nanoid(size));
      break;
    }

    case "encode":
      out.push(castov.base64.encode(await input(positionals, "text"), { url: values.url }));
      break;

    case "decode":
      out.push(castov.base64.decode(await input(positionals, "base64")));
      break;

    case "hash": {
      const algo = (values.algorithm ?? "sha256").toLowerCase().replace("-", "") as HashAlgorithm;
      out.push(await castov.hash(await input(positionals, "text"), algo));
      break;
    }

    case "now": {
      const timestamp = castov.unix();
      out.push(String(timestamp), castov.unixToIso(timestamp));
      break;
    }

    case "unix": {
      const val = await input(positionals, "timestamp|iso");
      out.push(/^-?\d+(\.\d+)?$/.test(val) ? castov.unixToIso(Number(val)) : String(castov.isoToUnix(val)));
      break;
    }

    case "jwt":
      out.push(JSON.stringify(castov.jwtDecode(await input(positionals, "token")), null, 2));
      break;

    default:
      throw new UsageError(`unknown command "${command}". Run "castov --help".`);
  }

  process.stdout.write(out.join("\n") + "\n");
}

main(process.argv.slice(2)).catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(red(`castov: ${msg}`) + "\n");
  process.exit(err instanceof UsageError || (err as { code?: string })?.code?.startsWith("ERR_PARSE_ARGS") ? 2 : 1);
});
