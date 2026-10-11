#!/usr/bin/env node
import { parseArgs } from "node:util";
import { createRequire } from "node:module";
import { castov, type HashAlgorithm } from "@castov/sdk";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

// ---------------------------------------------------------------------------
// Tiny ANSI helpers (respect NO_COLOR and non-TTY output so piping stays clean)
// ---------------------------------------------------------------------------
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code: number) => (s: string) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = paint(1);
const dim = paint(2);
const cyan = paint(36);
const red = (s: string) => (process.stderr.isTTY && !process.env.NO_COLOR ? `\x1b[31m${s}\x1b[0m` : s);

const HELP = `
${bold("castov")} ${dim(`v${version}`)} — zero-server developer utilities in your terminal

${bold("Usage")}
  castov <command> [options]

${bold("Commands")}
  ${cyan("uuid")}                 Generate a UUID v4            ${dim("-n <count>  --v7  --upper")}
  ${cyan("nanoid")} [size]        Generate a URL-safe ID        ${dim("-n <count>")}
  ${cyan("encode")} <text>        Base64-encode text            ${dim("--url")}
  ${cyan("decode")} <base64>      Base64-decode text
  ${cyan("hash")} <text>          Hex digest                    ${dim("-a sha1|sha256|sha384|sha512")}
  ${cyan("now")}                  Current Unix timestamp + ISO
  ${cyan("unix")} <ts|iso>        Convert Unix <-> ISO 8601
  ${cyan("jwt")} <token>          Decode a JWT locally (no verification)

${bold("Global")}
  -h, --help           Show help
  -v, --version        Show version

${bold("Examples")}
  castov uuid
  castov uuid -n 5 --v7
  export ID=$(castov uuid)
  echo -n "hello" | castov hash
`;

class UsageError extends Error {}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return "";
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");
}

/** Positional argument, or piped stdin as a fallback. */
async function input(positionals: string[], name: string): Promise<string> {
  const value = positionals.length ? positionals.join(" ") : await readStdin();
  if (!value) throw new UsageError(`missing <${name}>`);
  return value;
}

function count(raw: string | undefined): number {
  const n = raw === undefined ? 1 : Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 100_000) throw new UsageError("--count must be an integer between 1 and 100000");
  return n;
}

async function main(argv: string[]): Promise<void> {
  const [command, ...rest] = argv;

  if (!command || command === "-h" || command === "--help" || command === "help") {
    process.stdout.write(HELP + "\n");
    return;
  }
  if (command === "-v" || command === "--version") {
    process.stdout.write(version + "\n");
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

  if (values.help) {
    process.stdout.write(HELP + "\n");
    return;
  }

  const out: string[] = [];

  switch (command) {
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
      const ts = castov.unix();
      out.push(String(ts), castov.unixToIso(ts));
      break;
    }
    case "unix": {
      const value = await input(positionals, "timestamp|iso");
      out.push(/^-?\d+(\.\d+)?$/.test(value) ? castov.unixToIso(Number(value)) : String(castov.isoToUnix(value)));
      break;
    }
    case "jwt":
      out.push(JSON.stringify(castov.jwtDecode(await input(positionals, "token")), null, 2));
      break;
    default:
      throw new UsageError(`unknown command "${command}". Run "castov --help".`);
  }

  // Raw output only — keeps `$(castov uuid)` and pipes working.
  process.stdout.write(out.join("\n") + "\n");
}

main(process.argv.slice(2)).catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(red(`castov: ${msg}`) + "\n");
  process.exit(err instanceof UsageError || (err as { code?: string })?.code?.startsWith("ERR_PARSE_ARGS") ? 2 : 1);
});
