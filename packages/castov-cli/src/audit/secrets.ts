/**
 * Secret Detection & Strict Masking Engine.
 * 
 * Masking Guarantee:
 * - If length < 16: masked completely as `… (${len} chars)`
 * - If length >= 16: first 4 chars + `… (${len} chars)`
 * 
 * False-Positive Immunity:
 * - Immune to UUIDs (v4, v7), Git commit SHAs, localhost URLs, standard base64/hex digests,
 *   and environment variable substitutions (${env:X}, ${input:X}, $VAR).
 */

export interface SecretPattern {
  name: string;
  provider: string;
  regex: RegExp;
  isKnownProvider: boolean;
}

/**
 * Strict Masking Utility:
 * - If length < 16: completely masked as `… (${len} chars)`
 * - If length >= 16: first 4 chars + `…` + `(${len} chars)`
 */
export function maskSecret(val: string): string {
  if (!val) return "";
  const len = val.length;
  if (len < 16) {
    return `… (${len} chars)`;
  }
  return `${val.slice(0, 4)}… (${len} chars)`;
}

/**
 * Recognizes safe non-secret values to prevent false positives:
 * - Standard UUIDs
 * - Standalone hex digests / git commit SHAs
 * - Localhost URLs
 * - Environment variable substitution expressions (${env:X}, ${input:X}, $VAR, %VAR%)
 */
export function isSafeOrVariableReference(val: string): boolean {
  if (!val || typeof val !== "string") return true;
  const trimmed = val.trim();

  // 1. Variable references (Full or with common prefixes like 'Bearer')
  if (/\$\{[^}]+\}/.test(trimmed)) return true; // contains ${env:VAR}, ${input:VAR}
  if (/^(?:Bearer\s+)?\$[A-Z0-9_]+$/i.test(trimmed)) return true; // $VAR or Bearer $VAR
  if (/^%[A-Z0-9_]+%$/i.test(trimmed)) return true; // %VAR%
  if (/^<[^>]+>$/.test(trimmed)) return true; // <YOUR_KEY_HERE>
  if (/^(?:placeholder|your[-_]?key|todo|xxx+|\*{4,})$/i.test(trimmed)) return true;

  // 2. Standard UUIDs (e.g. 123e4567-e89b-12d3-a456-426614174000)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return true;
  }

  // 3. Standalone Git commit SHA-1 (40 hex chars) or SHA-256 (64 hex chars) without secret prefixes
  if (/^[0-9a-f]{40}$/i.test(trimmed) || /^[0-9a-f]{64}$/i.test(trimmed)) {
    return true;
  }

  // 4. Localhost or 127.0.0.1 URLs without credentials
  if (/^https?:\/\/(?:localhost|127\.0\.0\.1|::1)(?::\d+)?(?:\/.*)?$/i.test(trimmed)) {
    return true;
  }

  return false;
}

export const isVariableReference = isSafeOrVariableReference;

/**
 * Reused & expanded secret detection patterns
 */
export const SECRET_PATTERNS: SecretPattern[] = [
  // 1. AWS Access Key ID
  {
    name: "AWS Access Key ID",
    provider: "AWS",
    regex: /\bAKIA[0-9A-Z]{16}\b/,
    isKnownProvider: true,
  },
  // 2. Stripe Secret Keys (Live & Restricted)
  {
    name: "Stripe Live Secret Key",
    provider: "Stripe",
    regex: /\b(?:sk_live|rk_live)_[0-9a-zA-Z]{24,}\b/,
    isKnownProvider: true,
  },
  // 3. OpenAI API Key
  {
    name: "OpenAI API Key",
    provider: "OpenAI",
    regex: /\bsk-(?:proj-)?[a-zA-Z0-9_-]{32,}\b/,
    isKnownProvider: true,
  },
  // 4. Anthropic API Key
  {
    name: "Anthropic API Key",
    provider: "Anthropic",
    regex: /\bsk-ant-api03-[a-zA-Z0-9_-]{80,}\b/,
    isKnownProvider: true,
  },
  // 5. GitHub Personal Access Token / Fine-grained Token
  {
    name: "GitHub Personal Access Token",
    provider: "GitHub",
    regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[0-9a-zA-Z]{36,}\b/,
    isKnownProvider: true,
  },
  // 6. Slack Token & Webhook
  {
    name: "Slack Token",
    provider: "Slack",
    regex: /\bxox[baprs]-[0-9a-zA-Z-]{10,64}\b/,
    isKnownProvider: true,
  },
  {
    name: "Slack Incoming Webhook",
    provider: "Slack",
    regex: /https:\/\/hooks\.slack\.com\/services\/T[0-9A-Z]+\/B[0-9A-Z]+\/[0-9a-zA-Z]+/,
    isKnownProvider: true,
  },
  // 7. Discord Webhook
  {
    name: "Discord Webhook URL",
    provider: "Discord",
    regex: /https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d{17,20}\/[A-Za-z0-9_-]{60,}/,
    isKnownProvider: true,
  },
  // 8. Google Cloud API Key & Service Account
  {
    name: "Google Cloud API Key",
    provider: "Google Cloud",
    regex: /\bAIza[0-9A-Za-z-_]{35}\b/,
    isKnownProvider: true,
  },
  {
    name: "Google Cloud Service Account Key",
    provider: "Google Cloud",
    regex: /"type":\s*"service_account"[\s\S]*?"private_key":\s*"-----BEGIN PRIVATE KEY/,
    isKnownProvider: true,
  },
  // 9. Azure Storage & Connection String
  {
    name: "Azure Storage Account Key / Connection String",
    provider: "Azure",
    regex: /DefaultEndpointsProtocol=https;AccountName=[^;]+;AccountKey=[0-9a-zA-Z+/=]{64,88}/,
    isKnownProvider: true,
  },
  // 10. Database Connection URI with password
  {
    name: "Database Connection URI with Password",
    provider: "Database",
    regex: /(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis|rediss):\/\/[^:]+:[^@\s]{3,}@[^\s"']+/,
    isKnownProvider: true,
  },
  // 11. JSON Web Token (JWT) - requires three valid base64 segments
  {
    name: "JSON Web Token (JWT)",
    provider: "JWT",
    regex: /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/,
    isKnownProvider: true,
  },
  // 12. RSA / OpenSSH / EC Private Keys
  {
    name: "Private Key (PEM / OpenSSH / EC)",
    provider: "Crypto",
    regex: /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/,
    isKnownProvider: true,
  },
];

/**
 * Generic Sensitive Key Names (e.g. in env or config)
 */
export const SENSITIVE_KEY_NAMES = [
  "API_KEY",
  "APIKEY",
  "SECRET",
  "SECRET_KEY",
  "AUTH_TOKEN",
  "ACCESS_TOKEN",
  "BEARER_TOKEN",
  "PASSWORD",
  "PASSWD",
  "PRIVATE_KEY",
  "CREDENTIALS",
];

export interface SecretMatch {
  patternName: string;
  provider: string;
  isKnownProvider: boolean;
  rawMatched: string;
  masked: string;
}

/**
 * Detect secrets in a string. Returns matches with strictly masked representations.
 */
export function detectSecrets(text: string): SecretMatch[] {
  if (!text || typeof text !== "string") return [];
  if (isSafeOrVariableReference(text)) return [];

  const matches: SecretMatch[] = [];

  for (const pat of SECRET_PATTERNS) {
    const match = pat.regex.exec(text);
    if (match) {
      const raw = match[0];
      matches.push({
        patternName: pat.name,
        provider: pat.provider,
        isKnownProvider: pat.isKnownProvider,
        rawMatched: raw,
        masked: maskSecret(raw),
      });
    }
  }

  return matches;
}
