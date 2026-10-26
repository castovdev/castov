/**
 * Secret Detection & Strict Masking Engine.
 *
 * Masking Rules:
 * - If length < 16: masked completely as `… (${len} chars)`
 * - If length >= 16: first 4 chars + `… (${len} chars)`
 *
 * Contextual Safe-Value Rules (isSafeOrVariableReference):
 * - Variable references must match the ENTIRE value (no partial substring bypass).
 * - If a variable reference uses default fallback syntax `${VAR:-default}`, the `default` part
 *   is recursively analyzed as a normal value (so a literal secret in `default` is NOT safe and triggers a finding).
 * - 40/64-char hex strings are NEVER safe if the key/context contains SECRET, KEY, TOKEN, PASSWORD, PASS, CREDENTIAL, or AUTH;
 *   they are only safe in revision/commit/sha/digest/hash contexts or Docker @sha256: digests.
 * - UUIDs are NEVER safe if the key/context contains SECRET, KEY, TOKEN, PASSWORD, PASS, CREDENTIAL, or AUTH.
 * - localhost URLs are inspected for userinfo and query parameters; any secret-like query parameter or userinfo marks it unsafe.
 */

export interface SecretPattern {
  name: string;
  provider: string;
  regex: RegExp;
  isKnownProvider: boolean;
}

export const SENSITIVE_KEY_REGEX = /(?:SECRET|KEY|TOKEN|PASSWORD|PASS|CREDENTIAL|AUTH)/i;
export const SAFE_HASH_CONTEXT_REGEX = /(?:revision|commit|sha|digest|hash|checksum)/i;
export const SAFE_UUID_CONTEXT_REGEX = /(?:^id$|_id$|^uuid$|session|trace|request|correlation|workspace|project|tenant|org|user_id|client_id)/i;

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
 * Extract the default fallback value from a `${VAR:-default}` or `${env:VAR:-default}` expression, if present.
 * Returns null if the string is not a `${...:-...}` expression.
 */
export function extractDefaultFromVarSubstitution(val: string): { varName: string; defaultValue: string } | null {
  if (!val || typeof val !== "string") return null;
  const trimmed = val.trim();
  const match = /^(?:(?:Bearer|Basic)\s+)?\$\{([A-Za-z0-9_.:/]+):-([\s\S]*)\}$/i.exec(trimmed);
  if (!match) return null;
  return {
    varName: match[1],
    defaultValue: match[2],
  };
}

/**
 * Checks whether a value is a pure, full-string environment/input variable reference WITHOUT a literal secret default,
 * or an explicit non-secret placeholder.
 * Does NOT allow partial matches mixed with literal secrets (e.g., "Bearer real_secret ${X}").
 * For `${VAR:-default}`, returns true ONLY if `default` is empty or a safe placeholder/variable reference.
 */
export function isPureVariableReferenceOrPlaceholder(val: string, keyOrContext?: string): boolean {
  if (!val || typeof val !== "string") return true;
  const trimmed = val.trim();
  if (!trimmed) return true;

  // Check ${VAR:-default} first: analyze the part after ":-" as a normal value!
  const withDefault = extractDefaultFromVarSubstitution(trimmed);
  if (withDefault !== null) {
    const defVal = withDefault.defaultValue.trim();
    if (!defVal) return true; // ${VAR:-} has empty default -> safe
    // Recursively check if the default value itself is safe in this key/context
    return isSafeOrVariableReference(defVal, keyOrContext || withDefault.varName);
  }

  // Full-value variable reference WITHOUT ":-" fallback: ${env:VAR}, ${input:VAR}, ${VAR}, $VAR, %VAR%
  // Optionally prefixed ONLY by "Bearer " or "Basic " with no other literal characters
  if (/^(?:(?:Bearer|Basic)\s+)?\$\{[A-Za-z0-9_.:/]+\}$/i.test(trimmed)) return true;
  if (/^(?:(?:Bearer|Basic)\s+)?\$[A-Za-z_][A-Za-z0-9_]*$/i.test(trimmed)) return true;
  if (/^(?:(?:Bearer|Basic)\s+)?%[A-Za-z_][A-Za-z0-9_]*%$/i.test(trimmed)) return true;

  // Explicit placeholders
  if (/^<[^>]+>$/.test(trimmed)) return true;
  if (/^(?:placeholder|your[-_]?[a-z0-9_]*[-_]?here|your[-_]?key|todo|changeme|xxx+|\*{4,})$/i.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Context-aware check for safe non-secret values:
 * - Full-string variable references (${env:X}, ${input:X}, ${X}, $VAR, %VAR%), with `${VAR:-default}` inspecting `default`
 * - Docker image @sha256:<64-hex> digests
 * - 40/64-char hex ONLY when key/context is revision/commit/sha/digest/hash and NOT a sensitive key name
 * - UUIDs ONLY when key/context does NOT contain SECRET/KEY/TOKEN/PASSWORD/PASS/CREDENTIAL/AUTH
 * - Localhost URLs ONLY when they have no userinfo and no secret-like query parameters
 */
export function isSafeOrVariableReference(val: string, keyOrContext?: string): boolean {
  if (!val || typeof val !== "string") return true;
  const trimmed = val.trim();
  if (!trimmed) return true;

  const ctx = (keyOrContext || "").trim();
  const isSensitiveKey = ctx.length > 0 && SENSITIVE_KEY_REGEX.test(ctx);

  // If ${VAR:-default}, evaluate the default value directly with context
  const withDefault = extractDefaultFromVarSubstitution(trimmed);
  if (withDefault !== null) {
    const defVal = withDefault.defaultValue.trim();
    if (!defVal) return true;
    const effectiveCtx = ctx || withDefault.varName;
    if (matchesKnownProviderPattern(defVal) !== null) return false;
    return isSafeOrVariableReference(defVal, effectiveCtx);
  }

  // 1. Full-string variable references or placeholders
  if (isPureVariableReferenceOrPlaceholder(trimmed, ctx)) {
    return true;
  }

  // 2. Docker image @sha256: digest reference (e.g. image@sha256:64hex)
  if (!isSensitiveKey && /^(?:[a-z0-9._/-]+)?@sha256:[0-9a-f]{64}$/i.test(trimmed)) {
    return true;
  }

  // 3. 40-char (SHA-1) or 64-char (SHA-256) hex strings:
  // Never safe if key name is sensitive. Safe ONLY in revision/commit/sha/digest/hash contexts.
  if (/^[0-9a-f]{40}$/i.test(trimmed) || /^[0-9a-f]{64}$/i.test(trimmed)) {
    if (isSensitiveKey) return false;
    if (ctx.length > 0 && SAFE_HASH_CONTEXT_REGEX.test(ctx)) {
      return true;
    }
    return false;
  }

  // 4. Standard UUIDs (v4/v7):
  // Never safe if key name contains SECRET, KEY, TOKEN, PASSWORD, PASS, CREDENTIAL, or AUTH.
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    if (isSensitiveKey) return false;
    if (!ctx || SAFE_UUID_CONTEXT_REGEX.test(ctx) || SAFE_HASH_CONTEXT_REGEX.test(ctx)) {
      return true;
    }
    return false;
  }

  // 5. Localhost URLs (http/https/ws/wss): inspect userinfo and query string
  if (/^(?:https?|wss?):\/\/(?:localhost|127\.0\.0\.1|\[::1\]|::1)(?::\d+)?(?:\/.*)?$/i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      // Reject if URL has username or password in userinfo
      if (parsed.username || parsed.password) {
        return false;
      }
      // Inspect query parameters
      for (const [qKey, qVal] of parsed.searchParams.entries()) {
        if (!qVal || isPureVariableReferenceOrPlaceholder(qVal, qKey)) continue;
        if (SENSITIVE_KEY_REGEX.test(qKey)) {
          return false;
        }
        // Also reject if query param value matches any known provider secret or long token
        if (matchesKnownProviderPattern(qVal) !== null) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

export const isVariableReference = isSafeOrVariableReference;

/**
 * Known provider and structural secret patterns
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
    regex: /\b(?:sk|rk)_live_[0-9a-zA-Z]{24,}\b/,
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
    regex: /(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis|rediss):\/\/[^:\s/]+:([^@\s]{3,})@[^\s"']+/,
    isKnownProvider: true,
  },
  // 11. JSON Web Token (JWT) - requires three valid base64url segments
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
 * Generic Sensitive Key Names (e.g. in env, headers, or query params)
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
  "PASS",
  "PRIVATE_KEY",
  "CREDENTIAL",
  "CREDENTIALS",
  "TOKEN",
  "AUTH",
];

export interface SecretMatch {
  patternName: string;
  provider: string;
  isKnownProvider: boolean;
  rawMatched: string;
  masked: string;
}

function matchesKnownProviderPattern(text: string): SecretMatch | null {
  for (const pat of SECRET_PATTERNS) {
    const match = pat.regex.exec(text);
    if (match) {
      // For Database Connection URI with password capture group, verify password isn't a pure variable ref
      if (pat.provider === "Database" && match[1]) {
        if (isPureVariableReferenceOrPlaceholder(match[1])) {
          continue;
        }
        const raw = match[0];
        return {
          patternName: pat.name,
          provider: pat.provider,
          isKnownProvider: pat.isKnownProvider,
          rawMatched: raw,
          masked: maskSecret(raw),
        };
      }
      const raw = match[0];
      return {
        patternName: pat.name,
        provider: pat.provider,
        isKnownProvider: pat.isKnownProvider,
        rawMatched: raw,
        masked: maskSecret(raw),
      };
    }
  }
  return null;
}

/**
 * Detect secrets in a string, optionally considering the key/field name context.
 * Returns matches with strictly masked representations.
 */
export function detectSecrets(text: string, keyOrContext?: string): SecretMatch[] {
  if (!text || typeof text !== "string") return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  // If the value is a ${VAR:-default} expression, analyze the default portion directly!
  const withDefault = extractDefaultFromVarSubstitution(trimmed);
  if (withDefault !== null) {
    const defVal = withDefault.defaultValue.trim();
    if (!defVal) return [];
    return detectSecrets(defVal, keyOrContext || withDefault.varName);
  }

  if (isSafeOrVariableReference(trimmed, keyOrContext)) return [];

  const matches: SecretMatch[] = [];

  // 1. Check known provider patterns
  for (const pat of SECRET_PATTERNS) {
    const match = pat.regex.exec(trimmed);
    if (match) {
      if (pat.provider === "Database" && match[1]) {
        if (isPureVariableReferenceOrPlaceholder(match[1])) continue;
      }
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

  if (matches.length > 0) return matches;

  // 2. Check URL userinfo & query parameters for embedded secrets (including localhost)
  if (/^(?:https?|wss?):\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.password && !isPureVariableReferenceOrPlaceholder(parsed.password)) {
        matches.push({
          patternName: "URL Userinfo Password",
          provider: "URL",
          isKnownProvider: false,
          rawMatched: parsed.password,
          masked: maskSecret(parsed.password),
        });
      }
      for (const [qKey, qVal] of parsed.searchParams.entries()) {
        if (!qVal || isPureVariableReferenceOrPlaceholder(qVal, qKey)) continue;
        if (SENSITIVE_KEY_REGEX.test(qKey) && qVal.trim().length >= 6) {
          matches.push({
            patternName: `Secret in URL query parameter (${qKey})`,
            provider: "URL Query",
            isKnownProvider: false,
            rawMatched: qVal,
            masked: maskSecret(qVal),
          });
        }
      }
      if (matches.length > 0) return matches;
    } catch {
      // Not a valid standard URL; fall through
    }
  }

  // 3. Check Bearer / Basic authorization strings containing literal tokens (even if mixed with ${X})
  const bearerMatch = /^(?:Bearer|Basic)\s+(.+)$/i.exec(trimmed);
  if (bearerMatch) {
    const tokenPart = bearerMatch[1].trim();
    if (!isPureVariableReferenceOrPlaceholder(tokenPart, keyOrContext) && tokenPart.length >= 6) {
      matches.push({
        patternName: "Hardcoded Authorization Bearer/Basic Token",
        provider: "HTTP Auth",
        isKnownProvider: false,
        rawMatched: tokenPart,
        masked: maskSecret(tokenPart),
      });
      return matches;
    }
  }

  // 4. Context-sensitive detection: when keyOrContext contains SECRET, KEY, TOKEN, PASSWORD, PASS, CREDENTIAL, or AUTH
  const ctx = (keyOrContext || "").trim();
  if (ctx && SENSITIVE_KEY_REGEX.test(ctx)) {
    if (/^[0-9a-f]{40}$/i.test(trimmed) || /^[0-9a-f]{64}$/i.test(trimmed)) {
      matches.push({
        patternName: `Hex Secret in ${ctx}`,
        provider: "Generic Secret",
        isKnownProvider: false,
        rawMatched: trimmed,
        masked: maskSecret(trimmed),
      });
      return matches;
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
      matches.push({
        patternName: `UUID Credential in ${ctx}`,
        provider: "Generic Secret",
        isKnownProvider: false,
        rawMatched: trimmed,
        masked: maskSecret(trimmed),
      });
      return matches;
    }
    if (trimmed.length >= 8) {
      matches.push({
        patternName: `Literal Secret in ${ctx}`,
        provider: "Generic Secret",
        isKnownProvider: false,
        rawMatched: trimmed,
        masked: maskSecret(trimmed),
      });
      return matches;
    }
  }

  return matches;
}
