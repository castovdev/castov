export interface McpToolDefinition {
  name: string;
  title: string;
  category: "core" | "pipeline";
  description: string;
  promptExample: string;
  inputParams: string;
}

export const MCP_TOOLS_CATALOG: McpToolDefinition[] = [
  // --- 10 Core Deterministic Tools ---
  {
    name: "castov_port",
    title: "Port & Process Inspector",
    category: "core",
    description:
      "Identifies standard service registrations for TCP/UDP ports (1–65535) and inspects active local processes listening on the port across Linux, macOS, and Windows.",
    promptExample: "Check if port 3000 is currently in use and tell me which process owns it.",
    inputParams: "{ port: number }",
  },
  {
    name: "castov_cidr",
    title: "IPv4 CIDR & Subnet Calculator",
    category: "core",
    description:
      "Calculates exact IPv4 network address, subnet mask, wildcard mask, broadcast address, first/last usable host IPs, and total host capacity (including RFC 3021 /31 and /32).",
    promptExample: "Calculate the usable IP range, broadcast address, and wildcard mask for 10.240.0.0/22.",
    inputParams: "{ cidr: string }",
  },
  {
    name: "castov_detect_id",
    title: "Distributed ID & Timestamp Decoder",
    category: "core",
    description:
      "Detects and extracts embedded creation timestamps from UUIDv7, UUIDv1/v4, ULID, MongoDB ObjectId, and Discord/Twitter Snowflake IDs.",
    promptExample: "Decode when this ID was generated: 018f3a9c-6d20-7000-8000-010203040506",
    inputParams: "{ id: string }",
  },
  {
    name: "castov_timestamp",
    title: "Unix Epoch & ISO 8601 Converter",
    category: "core",
    description:
      "Converts Unix epoch timestamps (seconds or milliseconds) or ISO date strings into UTC, ISO 8601, local time, and relative time offsets.",
    promptExample: "Convert Unix timestamp 1760868000 to ISO 8601 and UTC.",
    inputParams: "{ value: string }",
  },
  {
    name: "castov_cron",
    title: "Cron Schedule Explainer & Next Run Predictor",
    category: "core",
    description:
      "Parses 5-field POSIX cron expressions into human-readable descriptions and computes the exact next 5 execution timestamps in any IANA timezone.",
    promptExample: "When are the next 5 runs for '*/15 9-17 * * 1-5' in America/New_York?",
    inputParams: "{ expression: string, timezone?: string }",
  },
  {
    name: "castov_timezone",
    title: "IANA Timezone Converter",
    category: "core",
    description:
      "Converts dates, times, or timestamps accurately between any two IANA timezones with automatic DST offset calculation.",
    promptExample: "Convert 2026-06-15 14:30 from Europe/London to Asia/Tokyo.",
    inputParams: "{ dateTime: string, fromZone: string, toZone: string }",
  },
  {
    name: "castov_secret",
    title: "CSPRNG Cryptographic Secret Generator",
    category: "core",
    description:
      "Generates high-entropy cryptographic secrets (16 to 128 bytes) in Hex, Base64, Base64URL, and ready-to-use .env key formats via Node.js crypto.randomBytes.",
    promptExample: "Generate a 256-bit cryptographic secret for my AUTH_SECRET and JWT_SECRET.",
    inputParams: "{ bytes?: number }",
  },
  {
    name: "castov_jwt_decode",
    title: "Offline JWT Header & Claims Inspector",
    category: "core",
    description:
      "Decodes JWT header and payload claims locally, formatting issued-at (iat), not-before (nbf), and expiration (exp) timestamps without transmitting tokens over the network.",
    promptExample: "Inspect the payload claims and expiration status of this JWT token.",
    inputParams: "{ token: string }",
  },
  {
    name: "castov_hash",
    title: "Cryptographic Digest Calculator",
    category: "core",
    description:
      "Computes deterministic cryptographic digests (MD5, SHA-1, SHA-256, SHA-384, SHA-512) in both hexadecimal and Base64 encodings.",
    promptExample: "Compute the SHA-256 hex and Base64 digest of this webhook payload.",
    inputParams: "{ text: string, algorithm?: 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512' }",
  },
  {
    name: "castov_scan_secrets",
    title: "In-Memory Secret & Credential Leak Scanner",
    category: "core",
    description:
      "Audits code snippets, .env files, or terminal logs in-memory for leaked AWS keys, GitHub PATs, Stripe live keys, OpenAI keys, Slack tokens, and PEM private keys with redacted output.",
    promptExample: "Scan this configuration snippet for any accidentally hardcoded API keys before I commit.",
    inputParams: "{ content: string }",
  },

  // --- 3 Chained Multi-Step Pipeline Tools ---
  {
    name: "castov_json_to_ts_pipeline",
    title: "JSON to TypeScript Pipeline",
    category: "pipeline",
    description:
      "Decodes Base64/raw JSON, formats and validates syntax, and compiles complete TypeScript interfaces in a single roundtrip.",
    promptExample: "Convert this raw JSON payload directly into strongly-typed TypeScript interfaces.",
    inputParams: "{ json: string, rootInterfaceName?: string }",
  },
  {
    name: "castov_cron_timezone_pipeline",
    title: "Cron Multi-Timezone Pipeline",
    category: "pipeline",
    description:
      "Parses a Cron expression and projects the next 5 execution timestamps across UTC, America/New_York, Europe/London, and Asia/Tokyo simultaneously.",
    promptExample: "Calculate the next 5 runs of '0 9 * * 1' across all major engineering team timezones.",
    inputParams: "{ expression: string, timezone?: string }",
  },
  {
    name: "castov_jwt_inspect_pipeline",
    title: "JWT Security & Expiry Pipeline",
    category: "pipeline",
    description:
      "Decodes JWT claims, audits token lifetime, checks expiration threshold warnings, and validates algorithm signature strength completely offline.",
    promptExample: "Inspect this JWT token for expiration time, subject claims, and algorithm vulnerabilities.",
    inputParams: "{ token: string }",
  },
];

export const TOTAL_MCP_TOOLS_COUNT = MCP_TOOLS_CATALOG.length; // 13
