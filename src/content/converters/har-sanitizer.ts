import type { ConverterMeta } from "@/lib/converters/types";

export const harSanitizerMeta: ConverterMeta = {
  slug: "har-sanitizer",
  name: "HAR & JSON Secret Sanitizer",
  title: "HAR File & JSON Log Secret Sanitizer",
  metaDescription:
    "Scrub session cookies, Authorization headers, JWTs, Stripe/AWS API keys, and embedded JSON body secrets from HAR files and logs 100% locally in your browser.",
  category: "DevOps & Network",
  inputLanguage: "json",
  outputLanguage: "json",
  outputExtension: ".har",
  copyButtonLabel: "Copy Sanitized HAR/JSON",
  isQualityApproved: true,
  isIndexed: true,

  defaultSample: `{
  "log": {
    "version": "1.2",
    "entries": [
      {
        "request": {
          "method": "POST",
          "url": "https://api.example.com/v1/checkout?api_key=sk_live_dummy_key_998877",
          "headers": [
            { "name": "Authorization", "value": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEyMyJ9.sig123456" },
            { "name": "Cookie", "value": "session_id=s%3A998877665544; theme=dark" }
          ],
          "cookies": [
            { "name": "session_id", "value": "s%3A998877665544" }
          ],
          "postData": {
            "mimeType": "application/json",
            "text": "{\\"email\\":\\"admin@company.io\\",\\"password\\":\\"SuperSecret123!\\",\\"stripeKey\\":\\"rk_live_dummy_991122\\"}"
          }
        }
      }
    ]
  }
}`,

  initialOutput: `{
  "log": {
    "version": "1.2",
    "entries": [
      {
        "request": {
          "method": "POST",
          "url": "https://api.example.com/v1/checkout?api_key=[REDACTED_QUERY_SECRET]",
          "headers": [
            {
              "name": "Authorization",
              "value": "[REDACTED_AUTHORIZATION]"
            },
            {
              "name": "Cookie",
              "value": "[REDACTED_COOKIE]"
            }
          ],
          "cookies": [
            {
              "name": "session_id",
              "value": "[REDACTED_COOKIE_VALUE]"
            }
          ],
          "postData": {
            "mimeType": "application/json",
            "text": "{\\"email\\":\\"[REDACTED_EMAIL]\\",\\"password\\":\\"[REDACTED_PASSWORD]\\",\\"stripeKey\\":\\"[REDACTED_RK_LIVE_KEY]\\"}"
          }
        }
      }
    ]
  }
}
`,

  optionsConfig: [
    {
      id: "scrubBodies",
      label: "Deep-Scrub Embedded JSON Bodies",
      type: "boolean",
      defaultValue: true,
      description: "Recursively parse and redact secrets inside postData.text and content.text",
    },
    {
      id: "scrubEmails",
      label: "Redact Email Addresses (PII)",
      type: "boolean",
      defaultValue: true,
      description: "Replace customer and developer email addresses with [REDACTED_EMAIL]",
    },
    {
      id: "includeAuditHeader",
      label: "Prepend Redaction Summary Comment",
      type: "boolean",
      defaultValue: false,
      description: "Add a summary comment showing exact counts of redacted items",
    },
  ],

  deepDive: {
    overview:
      "HTTP Archive (`.har`) files exported from Chrome DevTools or Firefox Network panels capture a complete forensic snapshot of your browser session. Even when Chrome's 'Export HAR (sanitized)' option is used, it only strips standard `Cookie`, `Set-Cookie`, and `Authorization` headers—leaving custom headers (`X-Shopify-Access-Token`, `X-Api-Key`), URL query string tokens (`?api_key=...`), and serialized JSON request/response bodies (`postData.text` and `response.content.text`) completely exposed. Sharing an unsanitized HAR file with third-party support teams or pasting it into an LLM allows immediate session hijacking. Castov's HAR Sanitizer runs 100% client-side and recursively parses stringified JSON payloads to scrub credentials while preserving valid `.har` structure.",
    whyDevelopersUseThis: [
      "Recursively parses stringified JSON inside `postData.text` and `response.content.text` to redact nested `password`, `client_secret`, `access_token`, Stripe (`sk_live_`), AWS (`AKIA`), and JWT values.",
      "Redacts 18+ sensitive HTTP headers (`Authorization`, `Cookie`, `Set-Cookie`, `X-Api-Key`, `X-Shopify-Access-Token`, `Stripe-Signature`) and `cookies` arrays.",
      "Scrubs URL query parameters (`?token=...`, `&api_key=...`, `&x-amz-signature=...`) both in `request.url` strings and `queryString` arrays.",
      "Executes 100% locally in your browser memory—you never upload a sensitive HAR file to an external server in order to sanitize it.",
    ],
    commonPitfalls: [
      {
        pitfall: "Relying solely on Chrome DevTools 'Export HAR (sanitized)' before sharing a capture",
        solution:
          "Chrome's built-in sanitizer only removes `Cookie`, `Set-Cookie`, and `Authorization` headers. Any OAuth tokens returned in `response.content.text`, passwords sent in `postData.text`, or API keys in query parameters remain in plain text. Always run deep body scrubbing before sharing.",
      },
      {
        pitfall: "Breaking HAR file import in Chrome DevTools by corrupting stringified JSON inside postData.text",
        solution:
          "Naively running regex replacements across a raw `.har` file often breaks escaped quotes (`\\\"`) inside `postData.text`. Our engine parses the inner JSON, sanitizes the AST nodes, and re-serializes it cleanly so the `.har` file still opens in Chrome DevTools and HAR analyzers.",
      },
    ],
  },

  edgeCases: [
    {
      title: "Nested Stringified JSON Inside HAR postData.text and content.text",
      scenario:
        "A GraphQL or REST login request stores a serialized JSON string inside `request.postData.text` containing a `password` and a Stripe `sk_live_` key.",
      inputSnippet: `{
  "postData": {
    "mimeType": "application/json",
    "text": "{\\"password\\":\\"MyPass123\\",\\"token\\":\\"ghp_1234567890abcdef\\"}"
  }
}`,
      outputSnippet: `{
  "postData": {
    "mimeType": "application/json",
    "text": "{\\"password\\":\\"[REDACTED_PASSWORD]\\",\\"token\\":\\"[REDACTED_TOKEN]\\"}"
  }
}`,
      explanation:
        "The sanitizer detects that `text` is a serialized JSON document, parses it recursively, scrubs sensitive keys and token patterns, and re-serializes it without breaking outer JSON escaping.",
    },
    {
      title: "Pre-Signed S3 URLs and Query Parameter Tokens",
      scenario:
        "A request URL contains inline query parameters like `?access_token=eyJ...&X-Amz-Signature=99aabb`.",
      inputSnippet: `{
  "url": "https://bucket.s3.amazonaws.com/file.pdf?X-Amz-Signature=abcdef123456&token=secret99"
}`,
      outputSnippet: `{
  "url": "https://bucket.s3.amazonaws.com/file.pdf?X-Amz-Signature=[REDACTED_QUERY_SECRET]&token=[REDACTED_QUERY_SECRET]"
}`,
      explanation:
        "Sensitive query parameter values are replaced in-place while keeping the URL structure and endpoint path intact for debugging.",
    },
  ],

  faqs: [
    {
      question: "Does Castov upload my HAR file to any server?",
      answer:
        "No. HAR files contain live session cookies and bearer tokens, so uploading them to an online sanitizer defeats the purpose of security. Castov processes the entire file locally inside your browser tab.",
    },
    {
      question: "Can I re-import the sanitized HAR file back into Chrome DevTools?",
      answer:
        "Yes. Leave 'Prepend Redaction Summary Comment' unchecked (the default) so the output remains 100% valid JSON conforming to the HAR 1.2 specification, then drag and drop it directly into the Chrome DevTools Network panel.",
    },
    {
      question: "Does this also work on regular JSON application logs (Pino, Winston, Datadog)?",
      answer:
        "Yes. You can paste any structured JSON log object or array and the engine will recursively redact sensitive keys, JWTs, API keys, and emails.",
    },
  ],

  relatedSlugs: ["env-to-zod", "curl-to-fetch", "json-to-zod"],
};
