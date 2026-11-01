/**
 * Castov Secret Shield - Linear-Time Secret Detection Patterns
 *
 * Rules:
 * - Linear-time regular expressions ONLY (O(N) runtime, no catastrophic backtracking / ReDoS).
 * - Exact offset tracking (startIndex and endIndex) for surgical redaction.
 * - Ignore known documentation examples and placeholders (e.g. AKIAIOSFODNN7EXAMPLE).
 */

import { SecretType, SecretFinding } from "./types";
import { isExampleOrPlaceholder, maskSecret, calculateShannonEntropy, calculateCharacterDiversity } from "./entropy";

export interface PatternDefinition {
  type: SecretType;
  label: string;
  regex: RegExp;
  validate?: (match: RegExpExecArray, text: string) => boolean;
  extractRange?: (match: RegExpExecArray) => { start: number; end: number; raw: string };
}

export const DETECTOR_PATTERNS: readonly PatternDefinition[] = [
  // 1. AWS Access Key ID (AKIA / ASIA / ACCA / ABIA)
  {
    type: "AWS_KEY",
    label: "AWS Access Key ID",
    regex: /\b(?:AKIA|ASIA|ACCA|ABIA)[0-9A-Z]{16}\b/g,
    validate: (match) => !isExampleOrPlaceholder(match[0]),
  },

  // 2. Anthropic API Keys (checked before OpenAI to prevent sk- prefix collision)
  {
    type: "ANTHROPIC_KEY",
    label: "Anthropic API Key",
    regex: /\bsk-ant-(?:api03|admin01)-[a-zA-Z0-9_-]{80,}\b/g,
    validate: (match) => !isExampleOrPlaceholder(match[0]),
  },

  // 3. OpenAI API Keys (legacy and modern sk-proj keys; explicitly excludes sk-ant-)
  {
    type: "OPENAI_KEY",
    label: "OpenAI API Key",
    regex: /\bsk-(?:proj-)?[a-zA-Z0-9_-]{32,}\b/g,
    validate: (match) => !match[0].startsWith("sk-ant-") && !isExampleOrPlaceholder(match[0]),
  },

  // 4. GitHub Personal Access Tokens (Classic & Fine-grained)
  {
    type: "GITHUB_TOKEN",
    label: "GitHub Personal Access Token",
    regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[0-9a-zA-Z]{36,}\b/g,
    validate: (match) => !isExampleOrPlaceholder(match[0]),
  },
  {
    type: "GITHUB_TOKEN",
    label: "GitHub Fine-Grained Personal Access Token",
    regex: /\bgithub_pat_[0-9a-zA-Z_]{60,100}\b/g,
    validate: (match) => !isExampleOrPlaceholder(match[0]),
  },

  // 5. Stripe Live Secret Keys (live & restricted keys; skips test keys)
  {
    type: "STRIPE_KEY",
    label: "Stripe Live Secret Key",
    regex: /\b(?:sk|rk)_live_[0-9a-zA-Z]{24,}\b/g,
    validate: (match) => !isExampleOrPlaceholder(match[0]),
  },

  // 6. Google Cloud / Gemini API Keys
  {
    type: "GOOGLE_KEY",
    label: "Google Cloud / Gemini API Key",
    regex: /\bAIza[0-9A-Za-z_-]{35}\b/g,
    validate: (match) => !isExampleOrPlaceholder(match[0]),
  },

  // 7. Slack API Tokens (User, Bot, App)
  {
    type: "SLACK_TOKEN",
    label: "Slack API Token",
    regex: /\bxox[baprs]-[0-9a-zA-Z-]{10,64}\b/g,
    validate: (match) => !isExampleOrPlaceholder(match[0]),
  },

  // 8. PEM / SSH / EC Private Key Blocks (Unencrypted & OpenSSL Encrypted with Headers)
  {
    type: "PRIVATE_KEY",
    label: "Private Key (PEM/SSH)",
    regex: /-----BEGIN (?:RSA |OPENSSH |EC |DSA |PGP |ENCRYPTED )?PRIVATE KEY-----[\r\n\t A-Za-z0-9+/=,: -]{20,8192}-----END (?:RSA |OPENSSH |EC |DSA |PGP |ENCRYPTED )?PRIVATE KEY-----/g,
    validate: (match) => !isExampleOrPlaceholder(match[0]),
  },

  // 9. JSON Web Tokens (JWT) - 3 base64url segments starting with standard eyJ
  {
    type: "JWT",
    label: "JSON Web Token (JWT)",
    regex: /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g,
    validate: (match) => {
      const parts = match[0].split(".");
      return parts.length === 3 && parts.every((p) => p.length >= 8);
    },
  },

  // 10. Database Connection Strings with Passwords
  {
    type: "DATABASE_URI",
    label: "Database Connection String with Password",
    regex: /(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis|rediss):\/\/[^:\s/]+:([^@\s]{3,})@[^\s"']+/g,
    validate: (match) => {
      const pass = match[1];
      if (!pass || isExampleOrPlaceholder(pass)) return false;
      const lower = pass.toLowerCase();
      if (lower === "password" || lower === "root" || lower === "admin" || lower === "test") {
        return false;
      }
      return true;
    },
  },

  // 11. Authorization Bearer Tokens
  {
    type: "BEARER_TOKEN",
    label: "Authorization Bearer Token",
    regex: /\bBearer\s+([a-zA-Z0-9_\-\.]{20,})\b/g,
    validate: (match) => {
      const token = match[1];
      if (!token || isExampleOrPlaceholder(token)) return false;
      if (calculateCharacterDiversity(token) < 0.25) return false;
      return true;
    },
    extractRange: (match) => {
      const full = match[0];
      const start = match.index;
      return { start, end: start + full.length, raw: full };
    },
  },
];

/**
 * Scans text line-by-line for .env-style KEY=VALUE pairs containing high-entropy secret values.
 */
export function scanEnvHighEntropyLines(
  text: string,
  existingMatches: SecretFinding[]
): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const lines = text.split("\n");
  let currentOffset = 0;

  // Pattern for KEY=VALUE lines
  // Allows optional export prefix, variable name (>= 3 chars), optional quotes around value
  const envLineRegex = /^(?:export\s+)?([A-Za-z0-9_]{3,})\s*=\s*(?:'([^'\r\n]+)'|"([^"\r\n]+)"|([^\s#\r\n]+))/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const match = envLineRegex.exec(trimmed);
      if (match) {
        const key = match[1];
        const val = match[2] ?? match[3] ?? match[4];

        if (val && val.length >= 20) {
          // Exclude URLs, file paths, UUIDs, comments, or documented placeholders
          const isUrl = /^https?:\/\//i.test(val);
          const isPath = /^[/.\\]/i.test(val) || /^[A-Za-z]:[/\\]/i.test(val);
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

          if (!isUrl && !isPath && !isUuid && !isExampleOrPlaceholder(val)) {
            const entropy = calculateShannonEntropy(val);
            const diversity = calculateCharacterDiversity(val);

            // High entropy threshold for secrets: >= 3.2 bits/char and >= 25% distinct characters
            if (entropy >= 3.2 && diversity >= 0.25) {
              // Locate exact position of val within the original un-trimmed line
              const valIndexInLine = line.indexOf(val);
              if (valIndexInLine !== -1) {
                const start = currentOffset + valIndexInLine;
                const end = start + val.length;

                // Check if this range was already captured by a specific provider detector
                const alreadyCovered = existingMatches.some(
                  (m) => Math.max(m.startIndex, start) < Math.min(m.endIndex, end)
                );

                if (!alreadyCovered) {
                  findings.push({
                    type: "ENV_SECRET",
                    label: `.env High-Entropy Secret (${key})`,
                    startIndex: start,
                    endIndex: end,
                    raw: val,
                    masked: maskSecret(val),
                  });
                }
              }
            }
          }
        }
      }
    }
    // Advance offset by line length plus the newline char
    currentOffset += line.length + 1;
  }

  return findings;
}
