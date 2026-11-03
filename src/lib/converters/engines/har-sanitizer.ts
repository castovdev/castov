export interface HarSanitizerOptions {
  scrubBodies?: boolean;
  scrubEmails?: boolean;
  includeAuditHeader?: boolean;
}

const SENSITIVE_HEADER_NAMES = new Set([
  "authorization",
  "proxy-authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-auth-token",
  "x-access-token",
  "x-csrf-token",
  "x-xsrf-token",
  "x-shopify-access-token",
  "x-shopify-hmac-sha256",
  "stripe-signature",
  "x-hub-signature",
  "x-hub-signature-256",
  "cf-access-jwt-assertion",
  "api-key",
  "apikey",
]);

const SENSITIVE_KEY_PATTERN =
  /^(password|passwd|pwd|secret|client_secret|api_key|apikey|access_token|refresh_token|id_token|auth_token|private_key|session_id|sessionid|credit_card|card_number|cvv|cvc|ssn|authorization|cookie|set-cookie|stripe_secret|webhook_secret)$/i;

const SENSITIVE_QUERY_PARAM_PATTERN =
  /^(token|access_token|refresh_token|id_token|api_key|apikey|key|secret|password|sig|signature|x-amz-signature|x-amz-security-token|code|state|session_id)$/i;

interface RedactionCounters {
  headersRedacted: number;
  cookiesRedacted: number;
  queryParamsRedacted: number;
  bodySecretsRedacted: number;
  emailsRedacted: number;
}

function scrubStringValue(
  str: string,
  scrubEmails: boolean,
  counters: RedactionCounters
): string {
  if (!str || typeof str !== "string") return str;

  // If the string itself is a serialized JSON object or array (like HAR postData.text or content.text),
  // recursively parse and sanitize it while keeping it serialized as valid JSON!
  const trimmed = str.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      const parsedInner = JSON.parse(str);
      const sanitizedInner = sanitizeNode(parsedInner, true, scrubEmails, counters);
      return JSON.stringify(sanitizedInner);
    } catch {
      // Not valid JSON, fall through to regex scrubbing
    }
  }

  let out = str;

  // 1. Bearer / Basic Authorization values
  out = out.replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi, (_m, scheme) => {
    counters.bodySecretsRedacted++;
    return `${scheme} [REDACTED_AUTH_TOKEN]`;
  });

  // 2. JWT tokens (eyJ... . eyJ... . sig)
  out = out.replace(
    /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
    () => {
      counters.bodySecretsRedacted++;
      return "[REDACTED_JWT_TOKEN]";
    }
  );

  // 3. Stripe keys (sk_live_, rk_live_, whsec_, sk_test_)
  out = out.replace(/\b(sk_live_|rk_live_|whsec_|sk_test_|rk_test_)[A-Za-z0-9_]{6,}\b/g, (m) => {
    counters.bodySecretsRedacted++;
    const prefix = m.split("_").slice(0, 2).join("_");
    return `[REDACTED_${prefix.toUpperCase()}_KEY]`;
  });

  // 4. AWS Access Key IDs (AKIA / ASIA + 16 chars)
  out = out.replace(/\b(AKIA|ASIA)[0-9A-Z]{16}\b/g, () => {
    counters.bodySecretsRedacted++;
    return "[REDACTED_AWS_ACCESS_KEY]";
  });

  // 5. GitHub & Slack & Shopify tokens
  out = out.replace(
    /\b(ghp_[A-Za-z0-9]{10,}|github_pat_[A-Za-z0-9_]{10,}|xox[baprs]-[A-Za-z0-9-]{10,}|shpat_[A-Za-z0-9_]{10,}|shpss_[A-Za-z0-9_]{10,})\b/g,
    () => {
      counters.bodySecretsRedacted++;
      return "[REDACTED_API_TOKEN]";
    }
  );

  // 6. OpenAI / Anthropic keys
  out = out.replace(/\b(sk-proj-[A-Za-z0-9_-]{10,}|sk-ant-[A-Za-z0-9_-]{10,})\b/g, () => {
    counters.bodySecretsRedacted++;
    return "[REDACTED_AI_API_KEY]";
  });

  // 7. PEM Private Keys
  out = out.replace(
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
    () => {
      counters.bodySecretsRedacted++;
      return "[REDACTED_PRIVATE_KEY]";
    }
  );

  // 8. URL query string secrets inside URLs
  out = out.replace(
    /([?&])(token|access_token|refresh_token|api_key|apikey|secret|password|sig|signature|x-amz-signature)=([^&#\s]+)/gi,
    (_m, sep, key) => {
      counters.queryParamsRedacted++;
      return `${sep}${key}=[REDACTED_QUERY_SECRET]`;
    }
  );

  // 9. Optional email scrubbing
  if (scrubEmails) {
    out = out.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, () => {
      counters.emailsRedacted++;
      return "[REDACTED_EMAIL]";
    });
  }

  return out;
}

function sanitizeNode(
  node: any,
  scrubBodies: boolean,
  scrubEmails: boolean,
  counters: RedactionCounters
): any {
  if (node === null || node === undefined) return node;

  if (typeof node === "string") {
    return scrubStringValue(node, scrubEmails, counters);
  }

  if (typeof node !== "object") {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map((item) => sanitizeNode(item, scrubBodies, scrubEmails, counters));
  }

  // Check if this object is a HAR name/value pair `{ name: "...", value: "..." }`
  if (
    typeof node.name === "string" &&
    "value" in node &&
    Object.keys(node).length <= 5
  ) {
    const lowerName = node.name.toLowerCase();
    if (SENSITIVE_HEADER_NAMES.has(lowerName)) {
      counters.headersRedacted++;
      return {
        ...node,
        value: `[REDACTED_HEADER_${node.name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}]`,
      };
    }
    if (SENSITIVE_QUERY_PARAM_PATTERN.test(lowerName) || SENSITIVE_KEY_PATTERN.test(lowerName)) {
      counters.queryParamsRedacted++;
      return {
        ...node,
        value: `[REDACTED_${node.name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}]`,
      };
    }
  }

  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(node)) {
    const lowerKey = key.toLowerCase();

    // HAR cookies array
    if (lowerKey === "cookies" && Array.isArray(val)) {
      result[key] = val.map((cookieObj: any) => {
        if (cookieObj && typeof cookieObj === "object") {
          counters.cookiesRedacted++;
          return {
            ...cookieObj,
            value: "[REDACTED_COOKIE_VALUE]",
          };
        }
        return cookieObj;
      });
      continue;
    }

    // HAR headers array
    if (lowerKey === "headers" && Array.isArray(val)) {
      result[key] = val.map((h: any) => {
        if (h && typeof h === "object" && typeof h.name === "string") {
          const hName = h.name.toLowerCase();
          if (SENSITIVE_HEADER_NAMES.has(hName) || SENSITIVE_KEY_PATTERN.test(hName)) {
            counters.headersRedacted++;
            return {
              ...h,
              value: `[REDACTED_${h.name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}]`,
            };
          }
        }
        return sanitizeNode(h, scrubBodies, scrubEmails, counters);
      });
      continue;
    }

    // HAR queryString array
    if (lowerKey === "querystring" && Array.isArray(val)) {
      result[key] = val.map((q: any) => {
        if (q && typeof q === "object" && typeof q.name === "string") {
          if (SENSITIVE_QUERY_PARAM_PATTERN.test(q.name.toLowerCase())) {
            counters.queryParamsRedacted++;
            return {
              ...q,
              value: "[REDACTED_QUERY_SECRET]",
            };
          }
        }
        return sanitizeNode(q, scrubBodies, scrubEmails, counters);
      });
      continue;
    }

    // Direct sensitive property key in JSON object
    if (SENSITIVE_KEY_PATTERN.test(lowerKey) || SENSITIVE_HEADER_NAMES.has(lowerKey)) {
      if (typeof val === "string") {
        counters.bodySecretsRedacted++;
        result[key] = `[REDACTED_${key.toUpperCase().replace(/[^A-Z0-9]/g, "_")}]`;
        continue;
      }
    }

    // HAR postData or content blocks when scrubBodies is false
    if (!scrubBodies && (lowerKey === "postdata" || lowerKey === "content")) {
      result[key] = val;
      continue;
    }

    result[key] = sanitizeNode(val, scrubBodies, scrubEmails, counters);
  }

  return result;
}

export function convert(input: string, options?: HarSanitizerOptions): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Input HAR or JSON log is empty.");
  }

  const scrubBodies = options?.scrubBodies ?? true;
  const scrubEmails = options?.scrubEmails ?? true;
  const includeAuditHeader = options?.includeAuditHeader ?? false;

  let parsed: any;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err: any) {
    throw new Error(`Invalid HAR/JSON syntax: ${err?.message || "Failed to parse JSON"}`);
  }

  const counters: RedactionCounters = {
    headersRedacted: 0,
    cookiesRedacted: 0,
    queryParamsRedacted: 0,
    bodySecretsRedacted: 0,
    emailsRedacted: 0,
  };

  const sanitized = sanitizeNode(parsed, scrubBodies, scrubEmails, counters);
  const jsonOutput = JSON.stringify(sanitized, null, 2);

  if (includeAuditHeader) {
    const total =
      counters.headersRedacted +
      counters.cookiesRedacted +
      counters.queryParamsRedacted +
      counters.bodySecretsRedacted +
      counters.emailsRedacted;
    const summary = [
      `// 🛡️ Castov HAR & JSON Secret Sanitizer Summary: ${total} item(s) redacted`,
      `// Headers: ${counters.headersRedacted} | Cookies: ${counters.cookiesRedacted} | Query Params: ${counters.queryParamsRedacted} | Body Secrets: ${counters.bodySecretsRedacted} | Emails: ${counters.emailsRedacted}`,
    ].join("\n");
    return `${summary}\n${jsonOutput}\n`;
  }

  return jsonOutput + "\n";
}
