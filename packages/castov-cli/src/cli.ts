#!/usr/bin/env node
import { parseArgs } from "node:util";
import { createRequire } from "node:module";
import { randomBytes, createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, lstatSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative, extname } from "node:path";
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
const green = paint(32);
const yellow = paint(33);
const red = (s: string) => (process.stderr.isTTY && !process.env.NO_COLOR ? `\x1b[31m${s}\x1b[0m` : s);

class UsageError extends Error {}

// ---------------------------------------------------------------------------
// Castov CLI Config & Authentication Persistence
// ---------------------------------------------------------------------------
function getConfigDir(): string {
  const custom = process.env.CASTOV_CONFIG_DIR;
  if (custom) return custom;
  return join(homedir(), ".castov");
}

function getConfigPath(): string {
  return join(getConfigDir(), "config.json");
}

interface CastovCliConfig {
  token: string;
  apiUrl?: string;
  loggedInAt?: string;
}

function readCliConfig(): CastovCliConfig | null {
  try {
    const file = getConfigPath();
    if (!existsSync(file)) return null;
    const content = readFileSync(file, "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function writeCliConfig(config: CastovCliConfig): void {
  const dir = getConfigDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), { mode: 0o600 });
}

function removeCliConfig(): boolean {
  try {
    const file = getConfigPath();
    if (existsSync(file)) {
      unlinkSync(file);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Built-in Port Encyclopedia (Instant Offline Lookup)
// ---------------------------------------------------------------------------
const KNOWN_PORTS: Record<number, { service: string; proto: string; desc: string }> = {
  21: { service: "FTP", proto: "TCP", desc: "File Transfer Protocol control port" },
  22: { service: "SSH", proto: "TCP", desc: "Secure Shell remote administration & SFTP" },
  25: { service: "SMTP", proto: "TCP", desc: "Simple Mail Transfer Protocol" },
  53: { service: "DNS", proto: "TCP/UDP", desc: "Domain Name System resolver" },
  80: { service: "HTTP", proto: "TCP", desc: "Unencrypted Hypertext Transfer Protocol" },
  443: { service: "HTTPS", proto: "TCP/UDP", desc: "TLS/SSL encrypted web traffic & HTTP/3 QUIC" },
  1433: { service: "SQL Server", proto: "TCP", desc: "Microsoft SQL Server database engine" },
  3000: { service: "Node.js / Next.js / React", proto: "TCP", desc: "Default development server for Next.js, Express, and Grafana" },
  3306: { service: "MySQL / MariaDB", proto: "TCP", desc: "MySQL and MariaDB relational database server" },
  4200: { service: "Angular CLI", proto: "TCP", desc: "Default ng serve development server" },
  5000: { service: "Flask / AirPlay / Registry", proto: "TCP", desc: "Python Flask dev server, Docker Registry, and macOS AirPlay" },
  5173: { service: "Vite", proto: "TCP", desc: "Default Vite frontend bundler development server" },
  5432: { service: "PostgreSQL", proto: "TCP", desc: "PostgreSQL relational database server" },
  5672: { service: "RabbitMQ", proto: "TCP", desc: "AMQP message broker protocol" },
  6379: { service: "Redis / Valkey", proto: "TCP", desc: "In-memory key-value datastore and cache" },
  8000: { service: "Django / FastAPI / Uvicorn", proto: "TCP", desc: "Python ASGI/WSGI local web server" },
  8080: { service: "HTTP Proxy / Spring Boot", proto: "TCP", desc: "Alternate HTTP port for Tomcat, Jenkins, and reverse proxies" },
  8443: { service: "Alt HTTPS", proto: "TCP", desc: "Alternate HTTPS TLS port" },
  9000: { service: "MinIO / PHP-FPM / SonarQube", proto: "TCP", desc: "S3-compatible object storage and FastCGI process manager" },
  9090: { service: "Prometheus", proto: "TCP", desc: "Prometheus metrics time-series server" },
  9200: { service: "Elasticsearch", proto: "TCP", desc: "Elasticsearch REST API search engine" },
  11434: { service: "Ollama Local LLM", proto: "TCP", desc: "Local AI model inference server" },
  27017: { service: "MongoDB", proto: "TCP", desc: "MongoDB NoSQL document database daemon" },
};

// ---------------------------------------------------------------------------
// Built-in AI Rules Templates (Instant Offline + Remote Fallback)
// ---------------------------------------------------------------------------
const BUILTIN_RULES: Record<string, string> = {
  nextjs: `# Next.js 15+ & React 19 Engineering Rules (Generated by Castov — https://www.castov.com/cursorrules)
- Default to React Server Components (RSC). Only add "use client" when using browser APIs or React state/effect hooks.
- Always await dynamic route params and searchParams in Next.js 15+: \`const { slug } = await params;\`.
- Use strict TypeScript interfaces; avoid \`any\`. Validate external inputs and server actions with Zod.
- Keep secrets strictly server-side; never expose sensitive keys with NEXT_PUBLIC_.
- Full interactive rules & templates: https://www.castov.com/cursorrules
`,
  react: `# React 19 & TypeScript Rules (Generated by Castov — https://www.castov.com/cursorrules)
- Prefer functional components with explicit TypeScript prop interfaces.
- Avoid unnecessary useEffect calls for derived state; compute values during render or with useMemo.
- Ensure full keyboard accessibility (ARIA labels, semantic buttons, focus rings).
- Full interactive rules & templates: https://www.castov.com/cursorrules
`,
  fastapi: `# Python FastAPI & Pydantic v2 Rules (Generated by Castov — https://www.castov.com/cursorrules)
- Use async def for I/O bound routes and Pydantic v2 BaseModel with ConfigDict for strict validation.
- Use Dependency Injection (Depends) for database sessions and auth verification.
- Return typed response_model schemas and raise explicit HTTPException status codes.
- Full interactive rules & templates: https://www.castov.com/cursorrules
`,
  rust: `# Rust Systems & Tokio Rules (Generated by Castov — https://www.castov.com/cursorrules)
- Never use .unwrap() or .expect() in production paths; propagate errors with ? using thiserror or anyhow.
- Prefer borrowing (&str, &[T]) over cloning where lifetime ergonomics permit.
- Keep async tasks non-blocking in Tokio; use spawn_blocking for CPU-intensive work.
- Full interactive rules & templates: https://www.castov.com/cursorrules
`,
  go: `# Go (Golang) Production Rules (Generated by Castov — https://www.castov.com/cursorrules)
- Always handle errors explicitly and wrap with fmt.Errorf("context: %w", err).
- Pass context.Context as the first argument to all I/O, DB, and network functions.
- Avoid goroutine leaks by tying lifecycle to context cancellation or errgroup.
- Full interactive rules & templates: https://www.castov.com/cursorrules
`,
};

// ---------------------------------------------------------------------------
// Help Text
// ---------------------------------------------------------------------------

const MAIN_HELP = `
${bold("castov")} ${dim(`v${version}`)} — zero-server developer utilities in your terminal

${bold("Usage")}
  castov <command> [options]

${bold("Commands")}
  ${cyan("fix")} <error...>               Diagnose terminal error or piped crash log with 1-line fix
  ${cyan("port")} <number> [--kill]       Inspect port service, check active PID, or terminate occupying process
  ${cyan("secret")} [--len <bytes>]       Generate cryptographic .env secrets (256-bit Hex, Base64URL, API keys)
  ${cyan("cidr")} <ip/prefix|/prefix>     Calculate IPv4 subnet mask, wildcard, usable IP range, and host count
  ${cyan("scan")} [dir]                   Scan project directory for leaked API keys, JWTs, and private keys
  ${cyan("rules")} [stack] [--write]      Generate .cursorrules / CLAUDE.md AI coding guidelines
  ${cyan("mcp")}                          Start stdio Model Context Protocol (MCP) server for Claude / Cursor
  ${cyan("ts")} <value>                   Unix seconds or milliseconds (auto-detect) -> UTC, ISO, local
  ${cyan("detect")} <value>               Identify timestamp or ID format (ObjectId, Snowflake, UUIDv7, ULID)
  ${cyan("cron")} "<expr>" [timezone]     Plain-English cron explanation + next 5 runs
  ${cyan("tz")} "<datetime>" <from> <to>  Convert between IANA time zones with DST gap & overlap handling
  ${cyan("uuid")}                         Generate UUID v4 or v7        ${dim("-n <count>  --v7  --upper")}
  ${cyan("nanoid")} [size]                Generate URL-safe ID          ${dim("-n <count>")}
  ${cyan("encode")} <text>                Base64-encode text            ${dim("--url")}
  ${cyan("decode")} <base64>              Base64-decode text
  ${cyan("hash")} <text>                  Hex digest                    ${dim("-a sha1|sha256|sha384|sha512")}
  ${cyan("now")}                          Current Unix timestamp + ISO
  ${cyan("unix")} <ts|iso>                Convert Unix <-> ISO 8601
  ${cyan("jwt")} <token>                  Decode a JWT locally (no verification)
  ${cyan("login")} --token <token>       Authenticate CLI with Personal Access Token (PAT)
  ${cyan("logout")}                       Remove stored credentials and log out
  ${cyan("whoami")}                       Check current authentication status

${bold("Global Options")}
  -h, --help           Show help (run "castov <command> --help" for command details)
  -v, --version        Show version

${bold("Examples")}
  castov fix "EADDRINUSE: address already in use :::3000"
  castov port 3000 --kill
  castov secret
  castov cidr 192.168.1.0/24
  castov scan .
  castov rules nextjs --write
  castov ts 1700000000
  castov uuid -n 3 --v7
`;

const COMMAND_HELP: Record<string, string> = {
  login: `
${bold("castov login")} — authenticate Castov CLI with your Personal Access Token (PAT)

${bold("Usage")}
  castov login --token <token>
  castov login <token>

${bold("Options")}
  -t, --token <token>   Personal Access Token generated in https://castov.com/account

${bold("Examples")}
  castov login --token cst_live_57528c970fe37e7a707e31cd47d560f1
`,

  logout: `
${bold("castov logout")} — remove stored authentication credentials from your machine

${bold("Usage")}
  castov logout
`,

  whoami: `
${bold("castov whoami")} — display active authentication status and credentials path

${bold("Usage")}
  castov whoami
`,

  fix: `
${bold("castov fix")} — diagnose terminal errors and stack traces with instant 1-line solutions

${bold("Usage")}
  castov fix "<error message>"
  <command> 2>&1 | castov fix

${bold("Examples")}
  castov fix "EADDRINUSE: address already in use :::3000"
  castov fix "Hydration failed because the initial UI does not match"
`,

  port: `
${bold("castov port")} — inspect network port service, find occupying PID, and optionally kill it

${bold("Usage")}
  castov port <port> [--kill]

${bold("Options")}
  -k, --kill    Terminate the process currently listening on <port>

${bold("Examples")}
  castov port 3000
  castov port 5432
  castov port 3000 --kill
`,

  secret: `
${bold("castov secret")} — generate high-entropy cryptographic secrets for .env files

${bold("Usage")}
  castov secret [--len <bytes>]

${bold("Options")}
  -l, --len <bytes>   Entropy byte length (default: 32 bytes / 256-bit)

${bold("Examples")}
  castov secret
  castov secret --len 64
`,

  cidr: `
${bold("castov cidr")} — IPv4 CIDR subnet mask, wildcard, and host range calculator

${bold("Usage")}
  castov cidr <ip/prefix | /prefix | prefix>

${bold("Examples")}
  castov cidr 192.168.1.0/24
  castov cidr 10.0.0.0/16
  castov cidr /24
`,

  scan: `
${bold("castov scan")} — local scanner with no behavioral telemetry for hardcoded secrets and API keys

${bold("Usage")}
  castov scan [directory]

${bold("Examples")}
  castov scan
  castov scan ./src
`,

  rules: `
${bold("castov rules")} — generate .cursorrules / CLAUDE.md AI coding rules for your stack

${bold("Usage")}
  castov rules [nextjs|react|fastapi|rust|go] [--write]

${bold("Options")}
  -w, --write   Write directly to .cursorrules in the current working directory

${bold("Examples")}
  castov rules nextjs
  castov rules nextjs --write
`,

  ts: `
${bold("castov ts")} — parse Unix timestamp with automatic unit detection

${bold("Usage")}
  castov ts <value>

${bold("Examples")}
  castov ts 1700000000
  castov ts 1700000000000
  echo "1700000000" | castov ts
`,

  detect: `
${bold("castov detect")} — identify timestamp or ID format and decode its embedded date

${bold("Usage")}
  castov detect <value>

${bold("Examples")}
  castov detect 1700000000
  castov detect 507f1f77bcf86cd799439011
  castov detect 018bcfe5-6800-7d90-bc4e-2895f32a762c
`,

  cron: `
${bold("castov cron")} — explain cron expression in plain English and preview upcoming runs

${bold("Usage")}
  castov cron "<expression>" [timezone]

${bold("Examples")}
  castov cron "*/15 * * * *"
  castov cron "0 9 * * 1-5" "America/New_York"
`,

  tz: `
${bold("castov tz")} — convert date & time between IANA time zones with DST gap & overlap handling

${bold("Usage")}
  castov tz "<date time>" <from> <to>

${bold("Examples")}
  castov tz "2026-10-11 14:00:00" America/New_York Europe/Paris
`,

  uuid: `
${bold("castov uuid")} — generate RFC 9562 UUIDs

${bold("Usage")}
  castov uuid [options]

${bold("Options")}
  -n, --count <n>   Generate multiple UUIDs (1-100000)
  --v7              Generate time-sortable UUIDv7 instead of random UUIDv4
  -u, --upper       Output in uppercase
`,

  nanoid: `
${bold("castov nanoid")} — generate URL-safe random IDs

${bold("Usage")}
  castov nanoid [size] [options]
`,

  encode: `
${bold("castov encode")} — Base64-encode text with UTF-8 support

${bold("Usage")}
  castov encode <text> [--url]
`,

  decode: `
${bold("castov decode")} — Base64-decode to UTF-8 text

${bold("Usage")}
  castov decode <base64>
`,

  hash: `
${bold("castov hash")} — compute cryptographic hash hex digest

${bold("Usage")}
  castov hash <text> [-a sha1|sha256|sha384|sha512]
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

function ipToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
    throw new UsageError(`invalid IPv4 address "${ip}"`);
  }
  return (((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
}

function intToIp(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255,
  ].join(".");
}

interface CidrResult {
  baseIp: string;
  prefix: number;
  netInt: number;
  maskInt: number;
  wildcardInt: number;
  bcastInt: number;
  networkAddress: string;
  subnetMask: string;
  wildcardMask: string;
  broadcastAddress: string;
  firstUsable: string;
  lastUsable: string;
  usableHosts: number;
  totalAddresses: number;
}

function calculateCidr(ip: string, prefix: number): CidrResult {
  const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const wildcardInt = (~maskInt) >>> 0;
  const ipInt = ipToInt(ip);
  const netInt = (ipInt & maskInt) >>> 0;
  const bcastInt = (netInt | wildcardInt) >>> 0;

  const totalAddresses = Math.pow(2, 32 - prefix);

  let usableHosts: number;
  let firstHostInt: number;
  let lastHostInt: number;
  let broadcastAddress: string;

  if (prefix === 32) {
    usableHosts = 1;
    firstHostInt = netInt;
    lastHostInt = netInt;
    broadcastAddress = "None (/32 Single Host)";
  } else if (prefix === 31) {
    usableHosts = 2;
    firstHostInt = netInt;
    lastHostInt = bcastInt;
    broadcastAddress = "None (RFC 3021 Point-to-Point)";
  } else if (prefix === 0) {
    usableHosts = totalAddresses - 2; // 4,294,967,294
    firstHostInt = (netInt + 1) >>> 0;
    lastHostInt = (bcastInt - 1) >>> 0;
    broadcastAddress = intToIp(bcastInt);
  } else {
    usableHosts = Math.max(0, totalAddresses - 2);
    firstHostInt = (netInt + 1) >>> 0;
    lastHostInt = (bcastInt - 1) >>> 0;
    broadcastAddress = intToIp(bcastInt);
  }

  return {
    baseIp: ip,
    prefix,
    netInt,
    maskInt,
    wildcardInt,
    bcastInt,
    networkAddress: intToIp(netInt),
    subnetMask: intToIp(maskInt),
    wildcardMask: intToIp(wildcardInt),
    broadcastAddress,
    firstUsable: intToIp(firstHostInt),
    lastUsable: intToIp(lastHostInt),
    usableHosts,
    totalAddresses,
  };
}

function findListeningPids(port: number): string[] {
  if (!Number.isInteger(port) || port < 1 || port > 65535) return [];
  try {
    if (process.platform === "win32") {
      const stdout = execFileSync("netstat", ["-ano", "-p", "tcp"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      const pids = new Set<string>();
      for (const line of stdout.split(/\r?\n/)) {
        if (!line.includes("LISTENING")) continue;
        const cols = line.trim().split(/\s+/);
        const localAddr = cols[1] || "";
        const pid = cols[cols.length - 1];
        if (localAddr.endsWith(`:${port}`) && pid && /^\d+$/.test(pid) && pid !== "0") {
          pids.add(pid);
        }
      }
      return [...pids];
    } else {
      const stdout = execFileSync("lsof", ["-ti", `tcp:${port}`, "-sTCP:LISTEN"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      return stdout
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => /^\d+$/.test(s));
    }
  } catch {
    return [];
  }
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
      kill: { type: "boolean", short: "k" },
      len: { type: "string", short: "l" },
      write: { type: "boolean", short: "w" },
      help: { type: "boolean", short: "h" },
      token: { type: "string", short: "t" },
    },
  });

  const out: string[] = [];

  switch (command) {
    case "login": {
      const token = (values.token as string | undefined) ?? positionals[0];
      if (!token || !token.trim()) {
        throw new UsageError(
          `missing token for "castov login".\n\nUsage:\n  castov login --token <token>\n  castov login <token>\n\nGenerate your Personal Access Token in your browser at:\n  https://castov.com/account (Preferences & CLI)`
        );
      }
      const trimmedToken = token.trim();
      writeCliConfig({
        token: trimmedToken,
        apiUrl: "https://castov.com",
        loggedInAt: new Date().toISOString(),
      });
      const masked =
        trimmedToken.length > 15
          ? `${trimmedToken.slice(0, 9)}${"•".repeat(Math.max(8, trimmedToken.length - 13))}${trimmedToken.slice(-4)}`
          : trimmedToken;
      out.push(green(`✔ Successfully authenticated with Castov Developer Workspace!`));
      out.push(`  ${bold("Token:")}   ${masked}`);
      out.push(`  ${bold("Config:")}  ${getConfigPath()}`);
      out.push(`  ${bold("Status:")}  Logged in to https://castov.com`);
      break;
    }

    case "logout": {
      const removed = removeCliConfig();
      if (removed) {
        out.push(green(`✔ Successfully logged out. Removed configuration from ${getConfigPath()}`));
      } else {
        out.push(`No active authentication session found.`);
      }
      break;
    }

    case "whoami":
    case "status": {
      const cfg = readCliConfig();
      if (!cfg || !cfg.token) {
        out.push(`Not logged in.`);
        out.push(`Run ${cyan("castov login --token <token>")} to authenticate.`);
      } else {
        const masked =
          cfg.token.length > 15
            ? `${cfg.token.slice(0, 9)}${"•".repeat(Math.max(8, cfg.token.length - 13))}${cfg.token.slice(-4)}`
            : cfg.token;
        out.push(green(`✔ Authenticated`));
        out.push(`  ${bold("Token:")}        ${masked}`);
        if (cfg.loggedInAt) {
          out.push(`  ${bold("Logged In:")}    ${cfg.loggedInAt}`);
        }
        out.push(`  ${bold("Server:")}       ${cfg.apiUrl || "https://castov.com"}`);
        out.push(`  ${bold("Config Path:")}  ${getConfigPath()}`);
      }
      break;
    }

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

    case "fix": {
      const errText = positionals.join(" ") || (await readStdin());
      if (!errText.trim()) throw new UsageError(`missing error text. Usage: castov fix "<error message>" or pipe to castov fix.`);

      const ERRORS = [
        { regex: /hydration failed|initial UI does not match/i, name: "Next.js / React Hydration Mismatch", fix: "Wrap client-only reads in useEffect() or add suppressHydrationWarning.", url: "https://www.castov.com/error-fixes/nextjs-hydration-failed" },
        { regex: /EADDRINUSE|address already in use/i, name: "Port / Address Conflict (EADDRINUSE)", fix: "Run: npx castov port <port> --kill (or lsof -ti:<port> | xargs kill -9)", url: "https://www.castov.com/error-fixes/docker-bind-address-already-in-use" },
        { regex: /Access-Control-Allow-Origin|CORS/i, name: "CORS Header Missing", fix: 'Return header: "Access-Control-Allow-Origin": "*" and handle preflight OPTIONS.', url: "https://www.castov.com/error-fixes/cors-access-control-allow-origin-missing" },
        { regex: /heap out of memory/i, name: "Node.js Heap Out of Memory", fix: 'export NODE_OPTIONS="--max-old-space-size=4096"', url: "https://www.castov.com/error-fixes" },
        { regex: /ModuleNotFoundError|No module named/i, name: "Python Module Missing", fix: "Activate your venv and run: pip install <package>", url: "https://www.castov.com/error-fixes" },
        { regex: /ENOENT: no such file/i, name: "File Not Found (ENOENT)", fix: "Check path relative to current working directory or run: mkdir -p <dir>", url: "https://www.castov.com/error-fixes" },
        { regex: /ERESOLVE/i, name: "NPM Peer Dependency Conflict", fix: "Run: npm install --legacy-peer-deps", url: "https://www.castov.com/error-fixes" },
      ];

      let matched = false;
      for (const item of ERRORS) {
        if (item.regex.test(errText)) {
          out.push(`⚡ Castov Error Diagnosis:`);
          out.push(`  • Issue:    ${bold(item.name)}`);
          out.push(`  • 1-Line:   ${cyan(item.fix)}`);
          out.push(`  • Guide:    ${item.url}`);
          matched = true;
          break;
        }
      }
      if (!matched) {
        out.push(`🔍 Castov Error Diagnosis:`);
        out.push(`  No exact match. Search full encyclopedia: https://www.castov.com/error-fixes`);
      }
      break;
    }

    case "port": {
      const rawPort = positionals[0];
      if (!rawPort) throw new UsageError(`missing <port> number. Usage: castov port <number> [--kill]`);
      const portNum = Number(rawPort);
      if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
        throw new UsageError(`port must be an integer between 1 and 65535`);
      }

      const known = KNOWN_PORTS[portNum];
      out.push(`${bold(`Port ${portNum}`)} ${known ? `— ${cyan(known.service)} (${known.proto})` : `— Custom / Ephemeral Port`}`);
      if (known) {
        out.push(`Purpose:      ${known.desc}`);
      }

      const pids = findListeningPids(portNum);
      if (pids.length > 0) {
        out.push(`Status:       ${yellow(`ACTIVE (Listening PID: ${pids.join(", ")})`)}`);
        if (values.kill) {
          for (const pid of pids) {
            if (!/^\d+$/.test(pid)) continue;
            try {
              if (process.platform === "win32") {
                execFileSync("taskkill", ["/PID", pid, "/F"], { stdio: "ignore" });
              } else {
                execFileSync("kill", ["-9", pid], { stdio: "ignore" });
              }
              out.push(`Action:       ${green(`✓ Terminated process PID ${pid} on port ${portNum}`)}`);
            } catch {
              out.push(`Action:       ${yellow(`⚠ Failed to kill PID ${pid} (try running with sudo/Administrator)`)}`);
            }
          }
        } else {
          out.push(`Kill Cmd:     ${cyan(`npx castov port ${portNum} --kill`)}`);
        }
      } else {
        out.push(`Status:       ${green("FREE (No local process listening)")}`);
      }

      out.push(`OS Commands:  Linux/macOS: lsof -i :${portNum}  |  Windows: netstat -ano | findstr :${portNum}`);
      out.push(`Reference:    https://www.castov.com/ports/${portNum}`);
      break;
    }

    case "secret": {
      const byteLen = values.len ? Number(values.len) : 32;
      if (!Number.isInteger(byteLen) || byteLen < 8 || byteLen > 512) {
        throw new UsageError(`--len must be an integer between 8 and 512 bytes`);
      }
      const hexSecret = randomBytes(byteLen).toString("hex");
      const b64UrlSecret = randomBytes(byteLen).toString("base64url");
      const apiKey = `sk_live_${randomBytes(24).toString("base64url")}`;
      const uuidV7 = castov.uuidv7();

      out.push(`${bold(`🔐 Castov Cryptographic Secret Generator (${byteLen * 8}-bit Entropy)`)}`);
      out.push(``);
      out.push(`Hex (${byteLen * 2} chars):       ${cyan(hexSecret)}`);
      out.push(`Base64URL:            ${cyan(b64UrlSecret)}`);
      out.push(`API Key Format:       ${cyan(apiKey)}`);
      out.push(`UUID v7 (Sortable):   ${cyan(uuidV7)}`);
      out.push(``);
      out.push(`${dim("# Ready-to-copy .env snippet:")}`);
      out.push(`AUTH_SECRET="${b64UrlSecret}"`);
      out.push(`JWT_SECRET="${hexSecret}"`);
      out.push(``);
      out.push(`Share .env securely (AES-GCM 256-bit Zero-Knowledge): https://www.castov.com/env-vault`);
      break;
    }

    case "cidr": {
      const rawCidr = positionals[0];
      if (!rawCidr) throw new UsageError(`missing <cidr> argument. Usage: castov cidr 192.168.1.0/24 or castov cidr /24`);

      let baseIp = "192.168.1.0";
      let prefixStr = rawCidr.trim();
      if (prefixStr.includes("/")) {
        const parts = prefixStr.split("/");
        if (parts[0]) baseIp = parts[0].trim();
        const sub = (parts[1] ?? "").trim();
        if (!sub) {
          throw new UsageError(`Missing prefix after '/' in CIDR "${rawCidr}".`);
        }
        prefixStr = sub;
      }

      if (!/^\d+$/.test(prefixStr)) {
        throw new UsageError(`CIDR prefix must be an integer between 0 and 32, got "${prefixStr}".`);
      }

      const prefix = Number(prefixStr);
      if (prefix < 0 || prefix > 32) {
        throw new UsageError(`CIDR prefix must be an integer between 0 and 32, got "${prefixStr}".`);
      }

      const res = calculateCidr(baseIp, prefix);

      out.push(`${bold(`🌐 IPv4 CIDR Calculation: ${res.networkAddress}/${prefix}`)}`);
      out.push(`Subnet Mask:     ${cyan(res.subnetMask)}`);
      out.push(`Wildcard Mask:   ${res.wildcardMask}`);
      out.push(`Network Address: ${res.networkAddress}`);
      out.push(`Broadcast Addr:  ${res.broadcastAddress}`);
      out.push(`Usable Range:    ${green(`${res.firstUsable} - ${res.lastUsable}`)}`);
      out.push(`Total IPs:       ${res.totalAddresses.toLocaleString("en-US")}`);
      out.push(`Usable Hosts:    ${bold(res.usableHosts.toLocaleString("en-US"))}`);
      out.push(`Reference:       https://www.castov.com/cidr/${prefix >= 8 ? prefix : 24}`);
      break;
    }

    case "scan": {
      const targetDir = positionals[0] || ".";
      const SECRET_PATTERNS = [
        { name: "AWS Access Key ID", regex: /\bAKIA[0-9A-Z]{16}\b/ },
        { name: "Stripe Live Secret Key", regex: /\bsk_live_[0-9a-zA-Z]{24,}\b/ },
        { name: "OpenAI API Key", regex: /\bsk-(?:proj-)?[a-zA-Z0-9]{32,}\b/ },
        { name: "GitHub Personal Access Token", regex: /\bghp_[0-9a-zA-Z]{36}\b/ },
        { name: "Slack Token", regex: /\bxox[baprs]-[0-9a-zA-Z-]{10,48}\b/ },
        { name: "RSA / OpenSSH Private Key", regex: /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/ },
      ];
      const IGNORE_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage", ".vercel"]);
      const ALLOWED_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".env", ".yml", ".yaml", ".py", ".go", ".rs", ".sh"]);
      const MAX_DEPTH = 12;
      const MAX_FILES = 5000;

      let scannedFiles = 0;
      const findings: { file: string; line: number; type: string }[] = [];

      const walk = (dir: string, depth = 0) => {
        if (depth > MAX_DEPTH || scannedFiles >= MAX_FILES) return;
        let entries: string[] = [];
        try {
          entries = readdirSync(dir);
        } catch {
          return;
        }
        for (const entry of entries) {
          if (scannedFiles >= MAX_FILES) break;
          if (IGNORE_DIRS.has(entry)) continue;
          const fullPath = join(dir, entry);
          let st;
          try {
            st = lstatSync(fullPath);
          } catch {
            continue;
          }
          if (st.isSymbolicLink()) continue;
          if (st.isDirectory()) {
            walk(fullPath, depth + 1);
          } else if (st.isFile() && st.size < 1_000_000) {
            const ext = extname(entry).toLowerCase();
            if (!ALLOWED_EXT.has(ext) && !entry.startsWith(".env")) continue;
            scannedFiles++;
            try {
              const content = readFileSync(fullPath, "utf8");
              const lines = content.split(/\r?\n/);
              lines.forEach((lineText, idx) => {
                if (lineText.length > 4096) return;
                for (const pat of SECRET_PATTERNS) {
                  if (pat.regex.test(lineText)) {
                    findings.push({
                      file: relative(process.cwd(), fullPath) || entry,
                      line: idx + 1,
                      type: pat.name,
                    });
                  }
                }
              });
            } catch {
              // ignore binary/unreadable files
            }
          }
        }
      };

      walk(targetDir);

      out.push(`${bold("🛡️ Castov Local Secret Scanner (100% Offline)")}`);
      out.push(`Scanned ${scannedFiles} source files in "${targetDir}"`);
      if (findings.length === 0) {
        out.push(`${green("✓ Zero hardcoded secrets or private keys detected.")}`);
      } else {
        out.push(`${yellow(`⚠ Found ${findings.length} potential secret leak(s):`)}`);
        for (const f of findings.slice(0, 25)) {
          out.push(`  • ${bold(f.type)} in ${cyan(`${f.file}:${f.line}`)}`);
        }
      }
      out.push(`Encrypt & share .env files safely: https://www.castov.com/env-vault`);
      break;
    }

    case "rules": {
      const stack = (positionals[0] || "nextjs").toLowerCase();
      const template =
        BUILTIN_RULES[stack] ||
        `# ${stack.toUpperCase()} AI Coding Guidelines (Generated by Castov)\n- You are a principal engineer specializing in ${stack}.\n- Write modular, type-safe, and production-hardened code with comprehensive error handling.\n- Full interactive builder: https://www.castov.com/cursorrules\n`;

      if (values.write) {
        const targetPath = join(process.cwd(), ".cursorrules");
        writeFileSync(targetPath, template, "utf8");
        out.push(`${green("✓")} Wrote ${bold(".cursorrules")} (${stack}) to ${targetPath}`);
        out.push(`Customize more stacks at: https://www.castov.com/cursorrules`);
      } else {
        out.push(template.trim());
      }
      break;
    }

    case "mcp": {
      // Start JSON-RPC 2.0 stdio MCP Server for Claude Desktop, Cursor, Windsurf & Glama
      const READONLY_ANNOTATIONS = {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      };

      const MCP_TOOLS = [
        {
          name: "castov_timestamp",
          description: "Inspect and convert a Unix epoch timestamp (seconds or milliseconds) to UTC, ISO 8601, and localized human time.",
          annotations: { title: "Unix Timestamp Converter", ...READONLY_ANNOTATIONS },
          inputSchema: {
            type: "object",
            properties: {
              value: { type: "string", description: "Unix epoch timestamp in seconds (10 digits) or milliseconds (13 digits), e.g. '1713456789'" },
            },
            required: ["value"],
            additionalProperties: false,
          },
        },
        {
          name: "castov_detect_id",
          description: "Detect identifier format and decode embedded creation timestamp from MongoDB ObjectId, UUIDv7, ULID, or Twitter/Discord Snowflake ID.",
          annotations: { title: "Distributed ID & Timestamp Detector", ...READONLY_ANNOTATIONS },
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string", description: "Identifier string (UUIDv7, ULID, 24-hex ObjectId, or numeric Snowflake ID)" },
            },
            required: ["id"],
            additionalProperties: false,
          },
        },
        {
          name: "castov_cidr",
          description: "Calculate IPv4 CIDR subnet mask, wildcard mask, network address, broadcast address, usable IP range, and total host count.",
          annotations: { title: "IPv4 CIDR Subnet Calculator", ...READONLY_ANNOTATIONS },
          inputSchema: {
            type: "object",
            properties: {
              cidr: { type: "string", description: "IPv4 CIDR block such as '192.168.1.0/24', '10.0.0.0/16', or '/24'" },
            },
            required: ["cidr"],
            additionalProperties: false,
          },
        },
        {
          name: "castov_port",
          description: "Inspect network port number (1-65535) for standard IANA service assignment, transport protocol (TCP/UDP), and typical application purpose.",
          annotations: { title: "Network Port Inspector", ...READONLY_ANNOTATIONS },
          inputSchema: {
            type: "object",
            properties: {
              port: { type: "number", description: "TCP/UDP port number between 1 and 65535 (e.g. 3000, 5432, 6379)" },
            },
            required: ["port"],
            additionalProperties: false,
          },
        },
        {
          name: "castov_cron",
          description: "Parse a 5-field cron expression into plain English and calculate the next 5 upcoming execution times in a specified IANA timezone.",
          annotations: { title: "Cron Expression Explainer & Schedule Calculator", ...READONLY_ANNOTATIONS },
          inputSchema: {
            type: "object",
            properties: {
              expression: { type: "string", description: "5-field cron expression (minute hour day-of-month month day-of-week), e.g. '*/15 * * * *' or '0 9 * * 1-5'" },
              timezone: { type: "string", description: "Optional IANA timezone name (defaults to 'UTC', e.g. 'America/New_York', 'Europe/London')" },
            },
            required: ["expression"],
            additionalProperties: false,
          },
        },
        {
          name: "castov_timezone",
          description: "Convert a date/time string between two IANA time zones with exact UTC offset, timezone abbreviation, and Daylight Saving Time (DST) transition warnings.",
          annotations: { title: "IANA Timezone & DST Converter", ...READONLY_ANNOTATIONS },
          inputSchema: {
            type: "object",
            properties: {
              dateTime: { type: "string", description: "Date/time string in 'YYYY-MM-DD HH:mm' or ISO 8601 format, e.g. '2026-03-29 14:30'" },
              fromZone: { type: "string", description: "Source IANA timezone (e.g. 'America/New_York' or 'UTC')" },
              toZone: { type: "string", description: "Target IANA timezone (e.g. 'Europe/Paris' or 'Asia/Tokyo')" },
            },
            required: ["dateTime", "fromZone", "toZone"],
            additionalProperties: false,
          },
        },
        {
          name: "castov_secret",
          description: "Generate cryptographically secure random secrets (CSPRNG) in Hex, Base64URL, API Key ('sk_live_...'), and sortable UUIDv7 formats for .env files and JWT signing.",
          annotations: { title: "Cryptographic Secret & Key Generator", readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
          inputSchema: {
            type: "object",
            properties: {
              bytes: { type: "number", description: "Optional entropy length in bytes between 8 and 512 (default: 32 bytes / 256 bits)" },
            },
            additionalProperties: false,
          },
        },
        {
          name: "castov_jwt_decode",
          description: "Decode a JSON Web Token (JWT) header and payload locally offline without external network calls, inspecting claims (exp, iat, nbf, sub, iss) and expiration status.",
          annotations: { title: "Local Offline JWT Decoder", ...READONLY_ANNOTATIONS },
          inputSchema: {
            type: "object",
            properties: {
              token: { type: "string", description: "Encoded JWT string (header.payload.signature)" },
            },
            required: ["token"],
            additionalProperties: false,
          },
        },
        {
          name: "castov_hash",
          description: "Compute deterministic cryptographic hashes (sha256, sha384, sha512, sha1, md5) and Base64 / Base64URL encodings of input text locally.",
          annotations: { title: "Cryptographic Hash & Base64 Computer", ...READONLY_ANNOTATIONS },
          inputSchema: {
            type: "object",
            properties: {
              text: { type: "string", description: "Input text string to hash and encode" },
              algorithm: {
                type: "string",
                enum: ["sha256", "sha384", "sha512", "sha1", "md5"],
                description: "Hash algorithm to use (default: 'sha256')",
              },
            },
            required: ["text"],
            additionalProperties: false,
          },
        },
        {
          name: "castov_scan_secrets",
          description: "Scan a code snippet, git diff, or .env configuration text locally for leaked credentials (AWS Access Keys, Stripe Live Keys, OpenAI API Keys, GitHub PATs, Slack Tokens, and RSA/OpenSSH Private Keys).",
          annotations: { title: "Offline Secret & Credential Leak Scanner", ...READONLY_ANNOTATIONS },
          inputSchema: {
            type: "object",
            properties: {
              content: { type: "string", description: "Code snippet, configuration file text, or git diff to audit for hardcoded secrets" },
            },
            required: ["content"],
            additionalProperties: false,
          },
        },
      ];

      // ---------------------------------------------------------------------
      // Model Context Protocol (MCP) Server - Dual Transport (ndjson & framed)
      // ---------------------------------------------------------------------
      const MAX_HEADER_SIZE = 8192;           // 8 KiB max header limit
      const MAX_BODY_SIZE = 4 * 1024 * 1024;  // 4 MiB max payload limit
      const SUPPORTED_PROTOCOL_VERSIONS = new Set(["2024-11-05", "2025-03-26", "2025-06-18"]);

      type Mode = "ndjson" | "framed";

      const sendRpc = (msg: unknown, mode: Mode, cb?: () => void) => {
        const json = Buffer.from(JSON.stringify(msg), "utf8");
        const out = mode === "framed"
          ? Buffer.concat([Buffer.from(`Content-Length: ${json.length}\r\n\r\n`, "utf8"), json])
          : Buffer.concat([json, Buffer.from("\n", "utf8")]);
        process.stdout.write(out, cb);
      };

      let dead = false;

      const fatal = (mode: Mode, message: string) => {
        dead = true;
        setTimeout(() => process.exit(1), 1000).unref();
        sendRpc(
          { jsonrpc: "2.0", id: null, error: { code: -32700, message } },
          mode,
          () => process.exit(1)
        );
      };

      const handleRpcMessage = (raw: string, mode: Mode) => {
        let req: any;
        try {
          req = JSON.parse(raw);
        } catch {
          sendRpc({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, mode);
          return;
        }

        if (!req || typeof req !== "object" || Array.isArray(req)) {
          sendRpc({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } }, mode);
          return;
        }

        const { id, method, params } = req;

        if (method === "initialize") {
          const requestedVersion = params?.protocolVersion;
          const protocolVersion =
            typeof requestedVersion === "string" && SUPPORTED_PROTOCOL_VERSIONS.has(requestedVersion)
              ? requestedVersion
              : "2024-11-05";

          sendRpc({
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion,
              capabilities: { tools: { listChanged: false } },
              serverInfo: { name: "castov-mcp-server", version },
            },
          }, mode);
        } else if (method === "ping") {
          sendRpc({ jsonrpc: "2.0", id, result: {} }, mode);
        } else if (method === "prompts/list") {
          sendRpc({ jsonrpc: "2.0", id, result: { prompts: [] } }, mode);
        } else if (method === "resources/list") {
          sendRpc({ jsonrpc: "2.0", id, result: { resources: [] } }, mode);
        } else if (method === "tools/list") {
          sendRpc({
            jsonrpc: "2.0",
            id,
            result: { tools: MCP_TOOLS },
          }, mode);
        } else if (method === "tools/call") {
          const toolName = params?.name;
          const args = params?.arguments && typeof params.arguments === "object" ? params.arguments : {};
          let toolText = "";
          let isError = false;

          try {
            if (toolName === "castov_timestamp") {
              if (args.value === undefined || args.value === null || (typeof args.value !== "string" && typeof args.value !== "number")) {
                toolText = "Error: missing or invalid 'value' argument for timestamp.";
                isError = true;
              } else {
                try {
                  const res = parseTs(String(args.value));
                  toolText = JSON.stringify(res, null, 2);
                } catch (err: any) {
                  toolText = `Error: ${err?.message || "invalid numeric timestamp"}`;
                  isError = true;
                }
              }
            } else if (toolName === "castov_detect_id") {
              if (typeof args.id !== "string" || !args.id.trim() || args.id.length > 256) {
                toolText = "Error: missing or invalid 'id' argument (must be a non-empty string up to 256 chars).";
                isError = true;
              } else {
                try {
                  const matches = detectId(args.id);
                  toolText = JSON.stringify(matches, null, 2);
                } catch (err: any) {
                  toolText = `Error: ${err?.message || "failed to detect id"}`;
                  isError = true;
                }
              }
            } else if (toolName === "castov_cidr") {
              if (!args.cidr || typeof args.cidr !== "string" || args.cidr.length > 64) {
                toolText = "Error: missing or invalid 'cidr' argument (expected format: '192.168.1.0/24' or '/24').";
                isError = true;
              } else {
                let baseIp = "192.168.1.0";
                let prefixStr = args.cidr.trim();
                if (prefixStr.includes("/")) {
                  const parts = prefixStr.split("/");
                  if (parts[0]) baseIp = parts[0].trim();
                  const sub = (parts[1] ?? "").trim();
                  if (!sub) {
                    toolText = `Error: Missing prefix after '/' in CIDR "${args.cidr}".`;
                    isError = true;
                  } else {
                    prefixStr = sub;
                  }
                }
                if (!isError) {
                  if (!/^\d+$/.test(prefixStr)) {
                    toolText = `Error: CIDR prefix must be an integer between 0 and 32, got "${prefixStr}".`;
                    isError = true;
                  } else {
                    const prefix = Number(prefixStr);
                    if (prefix < 0 || prefix > 32) {
                      toolText = `Error: CIDR prefix must be an integer between 0 and 32, got "${prefixStr}".`;
                      isError = true;
                    } else {
                      try {
                        const res = calculateCidr(baseIp, prefix);
                        toolText = [
                          `Network Address: ${res.networkAddress}`,
                          `Subnet Mask: ${res.subnetMask}`,
                          `Wildcard: ${res.wildcardMask}`,
                          `Broadcast Address: ${res.broadcastAddress}`,
                          `First Usable: ${res.firstUsable}`,
                          `Last Usable: ${res.lastUsable}`,
                          `Usable Hosts: ${res.usableHosts}`,
                        ].join("\n");
                      } catch (err: any) {
                        toolText = `Error: ${err?.message || "invalid CIDR"}`;
                        isError = true;
                      }
                    }
                  }
                }
              }
            } else if (toolName === "castov_port") {
              const rawPort = args.port;
              const isStrictNumeric =
                (typeof rawPort === "number" && Number.isInteger(rawPort)) ||
                (typeof rawPort === "string" && /^\s*-?\d+\s*$/.test(rawPort));
              const portNum = Number(rawPort);

              if (!isStrictNumeric || portNum < 1 || portNum > 65535) {
                toolText = `Error: Port must be an integer between 1 and 65535, got "${rawPort}".`;
                isError = true;
              } else {
                const p = KNOWN_PORTS[portNum];
                toolText = p ? `Port ${portNum}: ${p.service} (${p.proto}) - ${p.desc}` : `Port ${portNum}: Custom / Ephemeral Port`;
              }
            } else if (toolName === "castov_cron") {
              if (typeof args.expression !== "string" || !args.expression.trim() || args.expression.length > 128) {
                toolText = "Error: missing or invalid 'expression' argument (expected 5-field cron expression).";
                isError = true;
              } else {
                const tzArg = typeof args.timezone === "string" && args.timezone.trim() ? args.timezone.trim() : undefined;
                try {
                  const res = explainCron(args.expression.trim(), tzArg);
                  toolText = JSON.stringify(res, null, 2);
                } catch (err: any) {
                  toolText = `Error: ${err?.message || "invalid cron expression or timezone"}`;
                  isError = true;
                }
              }
            } else if (toolName === "castov_timezone") {
              if (
                typeof args.dateTime !== "string" || !args.dateTime.trim() ||
                typeof args.fromZone !== "string" || !args.fromZone.trim() ||
                typeof args.toZone !== "string" || !args.toZone.trim()
              ) {
                toolText = "Error: 'dateTime', 'fromZone', and 'toZone' are required string arguments.";
                isError = true;
              } else {
                try {
                  const res = convertTz(args.dateTime.trim(), args.fromZone.trim(), args.toZone.trim());
                  toolText = JSON.stringify(res, null, 2);
                } catch (err: any) {
                  toolText = `Error: ${err?.message || "invalid date/time or IANA timezone"}`;
                  isError = true;
                }
              }
            } else if (toolName === "castov_secret") {
              const rawBytes = args.bytes !== undefined ? Number(args.bytes) : 32;
              if (!Number.isInteger(rawBytes) || rawBytes < 8 || rawBytes > 512) {
                toolText = "Error: 'bytes' must be an integer between 8 and 512.";
                isError = true;
              } else {
                const hexSecret = randomBytes(rawBytes).toString("hex");
                const base64UrlSecret = randomBytes(rawBytes).toString("base64url");
                const apiKey = `sk_live_${randomBytes(24).toString("base64url")}`;
                const uuidV7 = castov.uuidv7();
                toolText = JSON.stringify(
                  {
                    entropyBits: rawBytes * 8,
                    hex: hexSecret,
                    base64url: base64UrlSecret,
                    apiKey,
                    uuidv7: uuidV7,
                  },
                  null,
                  2
                );
              }
            } else if (toolName === "castov_jwt_decode") {
              if (typeof args.token !== "string" || !args.token.trim() || args.token.length > 16384) {
                toolText = "Error: 'token' must be a non-empty JWT string.";
                isError = true;
              } else {
                try {
                  const decoded = castov.jwtDecode(args.token.trim());
                  const payload = decoded.payload as Record<string, unknown> | null;
                  let expired: boolean | null = null;
                  let expiresIso: string | null = null;
                  if (payload && typeof payload.exp === "number") {
                    expired = payload.exp * 1000 < Date.now();
                    expiresIso = new Date(payload.exp * 1000).toISOString();
                  }
                  toolText = JSON.stringify({ ...decoded, expired, expiresIso }, null, 2);
                } catch (err: any) {
                  toolText = `Error: ${err?.message || "invalid JWT format"}`;
                  isError = true;
                }
              }
            } else if (toolName === "castov_hash") {
              if (typeof args.text !== "string" || args.text.length > 1_000_000) {
                toolText = "Error: 'text' must be a string (up to 1 MB).";
                isError = true;
              } else {
                const algo = typeof args.algorithm === "string" ? args.algorithm.toLowerCase().replace("-", "") : "sha256";
                const allowedAlgos = new Set(["sha256", "sha384", "sha512", "sha1", "md5"]);
                if (!allowedAlgos.has(algo)) {
                  toolText = `Error: unsupported algorithm "${args.algorithm}". Allowed: sha256, sha384, sha512, sha1, md5.`;
                  isError = true;
                } else {
                  const digestHex = createHash(algo).update(args.text, "utf8").digest("hex");
                  const base64 = Buffer.from(args.text, "utf8").toString("base64");
                  const base64url = Buffer.from(args.text, "utf8").toString("base64url");
                  toolText = JSON.stringify({ algorithm: algo, hashHex: digestHex, base64, base64url }, null, 2);
                }
              }
            } else if (toolName === "castov_scan_secrets") {
              if (typeof args.content !== "string" || args.content.length > 524288) {
                toolText = "Error: 'content' must be a string (up to 512 KB).";
                isError = true;
              } else {
                const SECRET_PATTERNS = [
                  { name: "AWS Access Key ID", regex: /\bAKIA[0-9A-Z]{16}\b/ },
                  { name: "Stripe Live Secret Key", regex: /\bsk_live_[0-9a-zA-Z]{24,99}\b/ },
                  { name: "OpenAI API Key", regex: /\bsk-(?:proj-)?[a-zA-Z0-9]{32,128}\b/ },
                  { name: "GitHub Personal Access Token", regex: /\bghp_[0-9a-zA-Z]{36}\b/ },
                  { name: "Slack Token", regex: /\bxox[baprs]-[0-9a-zA-Z-]{10,48}\b/ },
                  { name: "RSA / OpenSSH Private Key", regex: /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/ },
                ];
                const lines = String(args.content).split(/\r?\n/).slice(0, 10000);
                const findings: { line: number; type: string }[] = [];
                lines.forEach((lineText: string, idx: number) => {
                  const boundedLine = lineText.slice(0, 2048);
                  for (const pat of SECRET_PATTERNS) {
                    if (pat.regex.test(boundedLine)) {
                      findings.push({ line: idx + 1, type: pat.name });
                    }
                  }
                });
                toolText = JSON.stringify(
                  {
                    clean: findings.length === 0,
                    findingCount: findings.length,
                    findings,
                  },
                  null,
                  2
                );
              }
            } else {
              toolText = `Error: Unknown tool "${toolName}".`;
              isError = true;
            }
          } catch (err: any) {
            toolText = `Internal error executing tool ${toolName}: ${err?.message || String(err)}`;
            isError = true;
          }

          sendRpc({
            jsonrpc: "2.0",
            id,
            result: {
              content: [{ type: "text", text: toolText }],
              ...(isError ? { isError: true } : {}),
            },
          }, mode);
        } else if (method === "notifications/initialized" || method === "notifications/cancelled") {
          // No response needed for notifications
        } else if (id !== undefined) {
          sendRpc({
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Method not found: ${method}` },
          }, mode);
        }
      };

      let buffer = Buffer.alloc(0);

      process.stdin.on("data", (chunk: Buffer) => {
        if (dead) return;
        buffer = Buffer.concat([buffer, chunk]);

        while (buffer.length > 0) {
          if (dead) return;

          // 1. تجاوز المسافات والأسطر الفارغة الفاصلة بين الرسائل
          while (buffer.length > 0 && (buffer[0] === 0x20 || buffer[0] === 0x09 || buffer[0] === 0x0d || buffer[0] === 0x0a)) {
            buffer = buffer.subarray(1);
          }
          if (buffer.length === 0) break;

          const firstByte = buffer[0];
          const isExplicitJson = firstByte === 0x7b || firstByte === 0x5b; // { or [
          const isLatin = (firstByte >= 0x41 && firstByte <= 0x5a) || (firstByte >= 0x61 && firstByte <= 0x7a); // A-Z or a-z

          const firstNewline = buffer.indexOf(0x0a);
          const firstLineBuf = firstNewline !== -1 ? buffer.subarray(0, firstNewline) : buffer;
          const firstLineStr = firstLineBuf.toString("utf8");

          const hasColon = firstLineStr.includes(":");

          let mode: Mode;

          if (isExplicitJson) {
            mode = "ndjson";
          } else if (isLatin && hasColon) {
            mode = "framed";
          } else if (firstNewline !== -1) {
            // ndjson إذا اكتمل السطر الأول (\n موجود) ولم ينطبق ما سبق
            mode = "ndjson";
          } else {
            // غير محسوم (لا \n ولا ":")، انتظر مع حد MAX_HEADER_SIZE كما هو
            if (buffer.length > MAX_HEADER_SIZE) {
              fatal("ndjson", "Header/line size limit exceeded without delimiter");
              return;
            }
            break; // انتظر المزيد من البيانات لحسم النمط
          }

          if (mode === "ndjson") {
            const newlineIdx = buffer.indexOf(0x0a);
            if (newlineIdx === -1) {
              if (buffer.length > MAX_BODY_SIZE) {
                fatal("ndjson", "Message line exceeds maximum size of 4MB");
                return;
              }
              break; // انتظر اكتمال السطر
            }
            if (newlineIdx > MAX_BODY_SIZE) {
              fatal("ndjson", "Message line exceeds maximum size of 4MB");
              return;
            }
            const line = buffer.subarray(0, newlineIdx).toString("utf8").trim();
            buffer = buffer.subarray(newlineIdx + 1);
            if (line) handleRpcMessage(line, "ndjson");
            continue;
          }

          // نمط framed
          const headerEnd = buffer.indexOf("\r\n\r\n");
          if (headerEnd === -1) {
            if (buffer.length > MAX_HEADER_SIZE) {
              fatal("framed", "Header size limit exceeded");
              return;
            }
            break; // انتظر اكتمال الترويسة بأمان
          }

          const headerStr = buffer.subarray(0, headerEnd).toString("utf8");
          const m = headerStr.match(/^Content-Length:[ \t]*(\d+)[ \t]*$/im);
          if (!m) {
            fatal("framed", "Framing error: missing or invalid Content-Length header");
            return;
          }

          const contentLength = Number(m[1]);
          if (!Number.isSafeInteger(contentLength)) {
            fatal("framed", "Framing error: Content-Length exceeds safe integer range");
            return;
          }

          if (contentLength > MAX_BODY_SIZE) {
            fatal("framed", "Message body exceeds maximum size of 4MB");
            return;
          }

          const bodyStart = headerEnd + 4;
          if (buffer.length < bodyStart + contentLength) {
            break; // انتظر اكتمال بايتات الجسم كاملة
          }

          const body = buffer.subarray(bodyStart, bodyStart + contentLength).toString("utf8");
          buffer = buffer.subarray(bodyStart + contentLength);
          handleRpcMessage(body, "framed");
        }
      });

      return;
    }

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
