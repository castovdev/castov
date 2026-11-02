/**
 * .env to Zod & T3 Env Schema Engine (100% Client-Side, Zero-Network)
 *
 * Privacy-First Guarantee:
 * - Raw secret values from the input .env are NEVER included in the generated TypeScript schema.
 * - Only inferred types (URL, number, boolean, email, enum, optional string) and key names are emitted.
 * - Includes one-click safe `.env.example` generation that replaces values with safe placeholders.
 *
 * Supported Output Modes:
 * - `zod-v4`: Zod v4 (Stable) (`z.url()`, `z.email()`, `z.coerce.number()`, `z.stringbool()`)
 * - `zod-v3`: Zod v3 (Standard) (`z.string().url()`, `z.string().email()`, `z.coerce.number()`, `z.enum(["true", "false"]).transform(...)`)
 * - `t3-env`: `@t3-oss/env-nextjs` (`createEnv` with `server`, `client`, `runtimeEnv` or `experimental__runtimeEnv`)
 * - `env-example`: Safe `.env.example` template with all secret values scrubbed
 */

export interface EnvToZodOptions {
  outputMode?: "zod-v4" | "zod-v3" | "t3-env" | "env-example";
  zodVersion?: "v4" | "v3";
  t3RuntimeStyle?: "experimental__runtimeEnv" | "runtimeEnv";
  nodeEnvAsEnum?: boolean;
  schemaName?: string;
}

export interface ParsedEnvEntry {
  key: string;
  value: string;
  isEmpty: boolean;
  quoteType: "none" | "single" | "double" | "backtick";
  sectionComment?: string;
  inlineComment?: string;
  line: number;
  overriddenCount: number;
}

export interface EnvParseResult {
  entries: ParsedEnvEntry[];
  duplicateKeys: string[];
  publicSecretWarnings: string[];
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Accepts any RFC-3986 URI scheme followed by :// (http://, https://, postgresql://, mysql://, redis://, rediss://, mongodb+srv://, amqp://, wss://, s3://, etc.)
const ANY_SCHEME_URL_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s]+$/;
const NUMBER_REGEX = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;
const BOOLEAN_VALUES = new Set(["true", "false"]);

// Secret value prefixes (Stripe, Webhook, GitHub, Slack, AWS, OpenAI, Anthropic, Private Keys)
const SENSITIVE_VALUE_PREFIX_REGEX =
  /^(?:sk_live_|sk_test_|rk_live_|rk_test_|whsec_|ghp_|gho_|ghu_|ghs_|ghr_|github_pat_|xox[baprs]-|AKIA[0-9A-Z]{16}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|shpat_|shpca_|shpss_|-----BEGIN [A-Z ]+PRIVATE KEY-----)/;

// Key name patterns that indicate a secret
const SENSITIVE_KEY_NAME_REGEX =
  /(?:^|_)(?:SECRET|PASSWORD|PASSWD|PRIVATE_KEY|ACCESS_KEY|AUTH_TOKEN|API_KEY|WEBHOOK_SECRET|SIGNING_KEY|CLIENT_SECRET|MASTER_KEY|JWT_SECRET|SESSION_SECRET|ENCRYPTION_KEY)(?:$|_)/i;

// NEXT_PUBLIC_ keys whose names suggest a secret Leak Risk
const PUBLIC_SECRET_KEY_REGEX =
  /^NEXT_PUBLIC_.*(?:SECRET|PRIVATE|PASSWORD|PASSWD|TOKEN|KEY|WEBHOOK|CREDENTIAL|BEARER)/i;

export function isSensitiveVariable(key: string, value: string): boolean {
  if (SENSITIVE_VALUE_PREFIX_REGEX.test(value.trim())) return true;
  if (SENSITIVE_KEY_NAME_REGEX.test(key)) return true;
  return false;
}

export function isPublicSecretWarning(key: string): boolean {
  return PUBLIC_SECRET_KEY_REGEX.test(key);
}

/**
 * Full-featured .env parser supporting:
 * - `export KEY=VALUE`
 * - Full-line comments (`# ...`) and section header comments
 * - Unquoted values with inline `# comments` (only when preceded by whitespace)
 * - Single-quoted (`'...'`), double-quoted (`"..."`), and backtick (`` `...` ``) values
 * - `#` characters preserved inside quoted strings (`"p@ss#word#123"`)
 * - Multiline quoted values (`"line1\nline2"` or `-----BEGIN PRIVATE KEY-----\n...`)
 * - Duplicate keys (last definition wins, while recording overridden duplicates)
 */
export function parseEnvFile(input: string): EnvParseResult {
  const normalized = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");

  const entriesByKey = new Map<string, ParsedEnvEntry>();
  const keyOrder: string[] = [];
  const duplicateSet = new Set<string>();

  let pendingSectionComment: string | undefined = undefined;
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Blank line resets nothing or keeps section comment attached to next variable
    if (!trimmed) {
      i++;
      continue;
    }

    // Comment line
    if (trimmed.startsWith("#")) {
      const commentText = trimmed.replace(/^#+\s*/, "").trim();
      if (commentText) {
        pendingSectionComment = pendingSectionComment
          ? `${pendingSectionComment} — ${commentText}`
          : commentText;
      }
      i++;
      continue;
    }

    // Match optional `export ` prefix + variable name + `=`
    const match = rawLine.match(/^\s*(?:export\s+)?([a-zA-Z_][a-zA-Z0-9_.]*)\s*=(.*)$/);
    if (!match) {
      i++;
      continue;
    }

    const key = match[1].trim();
    const rhsRaw = match[2];
    const startLineNumber = i + 1;

    let value = "";
    let quoteType: ParsedEnvEntry["quoteType"] = "none";
    let inlineComment: string | undefined = undefined;

    const rhsTrimmedStart = rhsRaw.trimStart();

    if (
      rhsTrimmedStart.startsWith('"') ||
      rhsTrimmedStart.startsWith("'") ||
      rhsTrimmedStart.startsWith("`")
    ) {
      const quoteChar = rhsTrimmedStart[0];
      quoteType =
        quoteChar === '"' ? "double" : quoteChar === "'" ? "single" : "backtick";

      // Parse quoted string (potentially multiline)
      let currentLineRest = rhsTrimmedStart.slice(1);
      const collectedLines: string[] = [];
      let closed = false;

      while (true) {
        let buf = "";
        let j = 0;
        while (j < currentLineRest.length) {
          const ch = currentLineRest[j];
          if (ch === "\\" && quoteChar === '"' && j + 1 < currentLineRest.length) {
            const nextCh = currentLineRest[j + 1];
            if (nextCh === "n") {
              buf += "\n";
              j += 2;
              continue;
            }
            if (nextCh === "r") {
              buf += "\r";
              j += 2;
              continue;
            }
            if (nextCh === "t") {
              buf += "\t";
              j += 2;
              continue;
            }
            if (nextCh === '"' || nextCh === "\\") {
              buf += nextCh;
              j += 2;
              continue;
            }
          }
          if (ch === quoteChar) {
            closed = true;
            // Check for inline comment after closing quote
            const afterQuote = currentLineRest.slice(j + 1).trim();
            if (afterQuote.startsWith("#")) {
              inlineComment = afterQuote.replace(/^#+\s*/, "").trim();
            }
            break;
          }
          buf += ch;
          j++;
        }

        collectedLines.push(buf);
        if (closed) {
          break;
        }

        // Advance to next line for multiline quoted value
        i++;
        if (i >= lines.length) {
          break;
        }
        currentLineRest = lines[i];
      }

      value = collectedLines.join("\n");
    } else {
      // Unquoted value: strip inline comment only if `#` is preceded by whitespace or at start
      let rawVal = rhsRaw;
      let commentIdx = -1;
      for (let j = 0; j < rawVal.length; j++) {
        if (rawVal[j] === "#" && (j === 0 || /\s/.test(rawVal[j - 1]))) {
          commentIdx = j;
          break;
        }
      }
      if (commentIdx !== -1) {
        inlineComment = rawVal
          .slice(commentIdx + 1)
          .replace(/^#*\s*/, "")
          .trim();
        rawVal = rawVal.slice(0, commentIdx);
      }
      value = rawVal.trim();
    }

    const isEmpty = quoteType === "none" && value === "";
    const existing = entriesByKey.get(key);
    const overriddenCount = existing ? existing.overriddenCount + 1 : 0;

    if (existing) {
      duplicateSet.add(key);
    } else {
      keyOrder.push(key);
    }

    entriesByKey.set(key, {
      key,
      value,
      isEmpty,
      quoteType,
      sectionComment: pendingSectionComment ?? existing?.sectionComment,
      inlineComment,
      line: startLineNumber,
      overriddenCount,
    });

    pendingSectionComment = undefined;
    i++;
  }

  const entries = keyOrder.map((k) => entriesByKey.get(k)!);
  const publicSecretWarnings = entries
    .filter((e) => isPublicSecretWarning(e.key))
    .map((e) => e.key);

  return {
    entries,
    duplicateKeys: Array.from(duplicateSet),
    publicSecretWarnings,
  };
}

export function inferEnvZodValidator(
  entry: ParsedEnvEntry,
  zodVersion: "v4" | "v3",
  nodeEnvAsEnum: boolean
): string {
  const { key, value, isEmpty } = entry;
  const trimmedVal = value.trim();

  // 1. Empty value -> optional string
  if (isEmpty || trimmedVal === "") {
    return "z.string().optional()";
  }

  // 2. NODE_ENV special handling when enabled
  if (
    nodeEnvAsEnum &&
    (key === "NODE_ENV" || key === "APP_ENV" || key === "NEXT_PUBLIC_APP_ENV")
  ) {
    const standardEnvs = ["development", "production", "test"];
    const lower = trimmedVal.toLowerCase();
    const enumValues = standardEnvs.includes(lower)
      ? standardEnvs
      : [...standardEnvs, trimmedVal];
    const formattedList = enumValues.map((v) => `"${v}"`).join(", ");
    return `z.enum([${formattedList}])`;
  }

  // 3. Boolean (`true` / `false` case-insensitive)
  if (BOOLEAN_VALUES.has(trimmedVal.toLowerCase())) {
    if (zodVersion === "v4") {
      return "z.stringbool()";
    }
    return 'z.enum(["true", "false"]).transform((v) => v === "true")';
  }

  // 4. Number (`3000`, `0.75`, `-10`)
  if (NUMBER_REGEX.test(trimmedVal)) {
    const num = Number(trimmedVal);
    if (Number.isInteger(num)) {
      if (key === "PORT" || key.endsWith("_PORT")) {
        return "z.coerce.number().int().positive()";
      }
      return "z.coerce.number().int()";
    }
    return "z.coerce.number()";
  }

  // 5. Any URI with scheme:// (http://, https://, postgresql://, redis://, mongodb+srv://, amqp://, etc.)
  if (ANY_SCHEME_URL_REGEX.test(trimmedVal)) {
    return zodVersion === "v4" ? "z.url()" : "z.string().url()";
  }

  // 6. Email address
  if (EMAIL_REGEX.test(trimmedVal)) {
    return zodVersion === "v4" ? "z.email()" : "z.string().email()";
  }

  // 7. Non-empty string default
  return "z.string().min(1)";
}

/**
 * Generates a safe `.env.example` template with zero real secrets exposed.
 */
export function generateSafeEnvExample(entries: ParsedEnvEntry[]): string {
  const lines: string[] = [
    "# ============================================================================",
    "# Safe .env.example Template (Generated Client-Side by Castov)",
    "# All secret values have been scrubbed and replaced with safe placeholders.",
    "# ============================================================================",
    "",
  ];

  for (const entry of entries) {
    if (entry.sectionComment) {
      lines.push(`# ${entry.sectionComment}`);
    }

    const { key, value, isEmpty } = entry;
    const trimmed = value.trim();
    let placeholder = "";

    if (isEmpty || trimmed === "") {
      placeholder = "";
    } else if (key === "NODE_ENV") {
      placeholder = "development";
    } else if (BOOLEAN_VALUES.has(trimmed.toLowerCase())) {
      placeholder = trimmed.toLowerCase();
    } else if (NUMBER_REGEX.test(trimmed)) {
      placeholder = trimmed;
    } else if (ANY_SCHEME_URL_REGEX.test(trimmed)) {
      const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);
      const scheme = schemeMatch ? schemeMatch[1].toLowerCase() : "https";
      if (scheme.startsWith("postgres")) {
        placeholder = `${scheme}://user:password@localhost:5432/dbname`;
      } else if (scheme.startsWith("mysql")) {
        placeholder = `${scheme}://user:password@localhost:3306/dbname`;
      } else if (scheme.startsWith("redis")) {
        placeholder = `${scheme}://localhost:6379`;
      } else if (scheme.startsWith("mongodb")) {
        placeholder = `${scheme}://user:password@localhost:27017/dbname`;
      } else {
        placeholder = `${scheme}://example.com`;
      }
    } else if (EMAIL_REGEX.test(trimmed)) {
      placeholder = "admin@example.com";
    } else if (trimmed.startsWith("sk_live_") || trimmed.startsWith("sk_test_")) {
      placeholder = "sk_test_your_stripe_secret_key_here";
    } else if (trimmed.startsWith("whsec_")) {
      placeholder = "whsec_your_webhook_signing_secret_here";
    } else if (trimmed.includes("\n")) {
      placeholder = '"-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_HERE\\n-----END PRIVATE KEY-----"';
    } else if (isSensitiveVariable(key, trimmed)) {
      placeholder = `your_${key.toLowerCase()}_here`;
    } else {
      placeholder = `your_${key.toLowerCase()}_here`;
    }

    lines.push(`${key}=${placeholder}`);
  }

  return lines.join("\n") + "\n";
}

function formatKey(key: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

function buildFieldLines(
  entries: ParsedEnvEntry[],
  zodVersion: "v4" | "v3",
  nodeEnvAsEnum: boolean,
  indent: string
): string[] {
  const lines: string[] = [];

  for (const entry of entries) {
    if (entry.sectionComment) {
      lines.push(`${indent}/** ${entry.sectionComment} */`);
    }
    if (isPublicSecretWarning(entry.key)) {
      lines.push(
        `${indent}/** ⚠️ SECURITY WARNING: NEXT_PUBLIC_ exposes '${entry.key}' to browser bundles! */`
      );
    } else if (isSensitiveVariable(entry.key, entry.value)) {
      lines.push(
        `${indent}/** ⚠️ Sensitive — never log or expose to client bundles */`
      );
    }

    const validator = inferEnvZodValidator(entry, zodVersion, nodeEnvAsEnum);
    const safeKey = formatKey(entry.key);
    lines.push(`${indent}${safeKey}: ${validator},`);
  }

  return lines;
}

export function convert(input: string, userOptions: EnvToZodOptions = {}): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Input .env file is empty.");
  }

  const parsed = parseEnvFile(input);
  if (parsed.entries.length === 0) {
    throw new Error("No valid KEY=VALUE environment variables found in input.");
  }

  const outputMode = userOptions.outputMode || "zod-v4";
  const zodVersion: "v4" | "v3" =
    outputMode === "zod-v3"
      ? "v3"
      : outputMode === "zod-v4"
      ? "v4"
      : userOptions.zodVersion || "v4";
  const t3RuntimeStyle =
    userOptions.t3RuntimeStyle || "experimental__runtimeEnv";
  const nodeEnvAsEnum =
    userOptions.nodeEnvAsEnum !== undefined ? Boolean(userOptions.nodeEnvAsEnum) : true;
  const rawSchemaName = userOptions.schemaName?.trim() || "envSchema";

  // Mode 4: Safe .env.example output
  if (outputMode === "env-example") {
    return generateSafeEnvExample(parsed.entries);
  }

  const warningHeaderLines: string[] = [];
  if (parsed.publicSecretWarnings.length > 0) {
    warningHeaderLines.push(
      `// ⚠️ PUBLIC SECRET WARNING (${parsed.publicSecretWarnings.join(", ")}): Variables prefixed with NEXT_PUBLIC_ are inlined into client-side JavaScript bundles!`
    );
  }
  if (parsed.duplicateKeys.length > 0) {
    warningHeaderLines.push(
      `// ℹ️ Duplicate keys detected (${parsed.duplicateKeys.join(", ")}): Using the last defined value for type inference.`
    );
  }

  // Mode 3: @t3-oss/env-nextjs (createEnv)
  if (outputMode === "t3-env") {
    const serverEntries = parsed.entries.filter(
      (e) => !e.key.startsWith("NEXT_PUBLIC_")
    );
    const clientEntries = parsed.entries.filter((e) =>
      e.key.startsWith("NEXT_PUBLIC_")
    );

    const serverFieldLines = buildFieldLines(
      serverEntries,
      zodVersion,
      nodeEnvAsEnum,
      "    "
    );
    const clientFieldLines = buildFieldLines(
      clientEntries,
      zodVersion,
      nodeEnvAsEnum,
      "    "
    );

    const blocks: string[] = [];
    blocks.push(
      `// Target: @t3-oss/env-nextjs + Zod ${zodVersion} (Values scrubbed — types only)`
    );
    for (const w of warningHeaderLines) {
      blocks.push(w);
    }
    blocks.push(`import { createEnv } from "@t3-oss/env-nextjs";`);
    blocks.push(`import { z } from "zod";`);
    blocks.push("");
    blocks.push(`export const env = createEnv({`);

    if (serverFieldLines.length > 0) {
      blocks.push(`  server: {`);
      blocks.push(...serverFieldLines);
      blocks.push(`  },`);
    } else {
      blocks.push(`  server: {},`);
    }

    if (clientFieldLines.length > 0) {
      blocks.push(`  client: {`);
      blocks.push(...clientFieldLines);
      blocks.push(`  },`);
    } else {
      blocks.push(`  client: {},`);
    }

    if (t3RuntimeStyle === "experimental__runtimeEnv") {
      blocks.push(
        `  // Next.js >= 13.4.4 only requires destructuring client-side NEXT_PUBLIC_ variables:`
      );
      blocks.push(`  experimental__runtimeEnv: {`);
      for (const c of clientEntries) {
        const k = formatKey(c.key);
        const propAccess = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(c.key)
          ? `process.env.${c.key}`
          : `process.env[${JSON.stringify(c.key)}]`;
        blocks.push(`    ${k}: ${propAccess},`);
      }
      blocks.push(`  },`);
    } else {
      blocks.push(
        `  // Explicit runtimeEnv mapping for all server and client variables:`
      );
      blocks.push(`  runtimeEnv: {`);
      for (const e of parsed.entries) {
        const k = formatKey(e.key);
        const propAccess = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(e.key)
          ? `process.env.${e.key}`
          : `process.env[${JSON.stringify(e.key)}]`;
        blocks.push(`    ${k}: ${propAccess},`);
      }
      blocks.push(`  },`);
    }

    blocks.push(`});\n`);
    return blocks.join("\n");
  }

  // Modes 1 & 2: Standard Zod v4 or Zod v3 schema
  const fieldLines = buildFieldLines(
    parsed.entries,
    zodVersion,
    nodeEnvAsEnum,
    "  "
  );

  const schemaIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(rawSchemaName)
    ? rawSchemaName
    : "envSchema";

  const headerComment =
    zodVersion === "v4"
      ? `// Target: Zod v4 (Stable) — Values scrubbed, only types inferred`
      : `// Target: Zod v3 (Standard) — Values scrubbed, only types inferred`;

  const blocks: string[] = [headerComment];
  for (const w of warningHeaderLines) {
    blocks.push(w);
  }
  blocks.push(`import { z } from "zod";`);
  blocks.push("");
  blocks.push(`export const ${schemaIdentifier} = z.object({`);
  blocks.push(...fieldLines);
  blocks.push(`});`);
  blocks.push("");
  blocks.push(`export type Env = z.infer<typeof ${schemaIdentifier}>;`);
  blocks.push("");
  blocks.push(`export const env = ${schemaIdentifier}.parse(process.env);\n`);

  return blocks.join("\n");
}
