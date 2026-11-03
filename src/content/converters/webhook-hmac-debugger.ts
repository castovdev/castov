import type { ConverterMeta } from "@/lib/converters/types";

export const webhookHmacDebuggerMeta: ConverterMeta = {
  slug: "webhook-hmac-debugger",
  name: "Webhook HMAC Debugger",
  title: "Webhook HMAC Debugger & Zod Handler",
  metaDescription:
    "Diagnose 401 Invalid Signature webhook errors for Shopify, Stripe, and GitHub locally. Generates raw-body verification handlers and Zod v4/v3 payload schemas.",
  category: "API & Network",
  inputLanguage: "json",
  outputLanguage: "typescript",
  outputExtension: ".ts",
  copyButtonLabel: "Copy Webhook Handler",
  isQualityApproved: true,
  isIndexed: true,

  defaultSample: `{
  "provider": "shopify",
  "secret": "shpss_dummy_webhook_secret_key",
  "signature": "mK8mE0wY2/q61V7Q6O3pX0B+Z+M8k0W2U9x8n6G7y8M=",
  "timestamp": "1714500000",
  "payload": {
    "id": 820982911946154500,
    "email": "customer@example.com",
    "total_price": "149.99",
    "currency": "USD",
    "financial_status": "paid"
  }
}`,

  initialOutput: `// ============================================================================
// 🔍 WEBHOOK HMAC-SHA256 DIAGNOSTIC REPORT (100% Client-Side Verification)
// ============================================================================
// Provider Mode        : SHOPIFY
// Expected Shopify Hmac: 4hF7vA92c2mE45rL8tQ3k0jN5pX7vB1wZ9yM6cK4dQo=
// Expected GitHub Hmac : sha256=e2117bBc0f76736984e39acbe834934a6a7f97eff075c19f72cf9bc2b874a38d
// Expected Stripe Hmac : t=1714500000,v1=9f4a8b21c03d44e18a9b77c25d66e32f11a08b99c44d22e17a66b33c88d11e22
// ============================================================================

import { z } from "zod";

export const webhookPayloadSchema = z.object({
  id: z.number().int(),
  email: z.email(),
  total_price: z.string(),
  currency: z.string(),
  financial_status: z.string(),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

// Official Docs: https://shopify.dev/docs/apps/build/webhooks/subscribe/https#step-5-verify-the-webhook
import crypto from "node:crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // CRITICAL: Read raw text via req.text() — NEVER call req.json() before HMAC check!
  const rawBody = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256") ?? "";
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET ?? "";

  const computedBase64 = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  const a = Buffer.from(computedBase64, "utf8");
  const b = Buffer.from(hmacHeader, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Invalid Shopify HMAC signature" }, { status: 401 });
  }

  const parsed = webhookPayloadSchema.safeParse(JSON.parse(rawBody));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid webhook payload", issues: parsed.error.issues }, { status: 400 });
  }

  return NextResponse.json({ received: true, data: parsed.data });
}
`,

  optionsConfig: [
    {
      id: "provider",
      label: "Webhook Provider",
      type: "select",
      defaultValue: "auto",
      options: [
        { label: "Auto-Detect (Shopify / Stripe / GitHub)", value: "auto" },
        { label: "Shopify (Base64 X-Shopify-Hmac-Sha256)", value: "shopify" },
        { label: "Stripe (Timestamped Hex Stripe-Signature)", value: "stripe" },
        { label: "GitHub (Hex X-Hub-Signature-256)", value: "github" },
      ],
      description: "Target webhook signature scheme and header format",
    },
    {
      id: "framework",
      label: "Server Handler Framework",
      type: "select",
      defaultValue: "nextjs-app",
      options: [
        { label: "Next.js App Router (req.text())", value: "nextjs-app" },
        { label: "Express.js (express.raw())", value: "express" },
      ],
      description: "Generate raw-body verification route for Next.js or Express",
    },
    {
      id: "zodVersion",
      label: "Payload Zod Version",
      type: "select",
      defaultValue: "v4",
      options: [
        { label: "Zod v4 (z.email(), z.url())", value: "v4" },
        { label: "Zod v3 (z.string().email())", value: "v3" },
      ],
      description: "Target Zod version for webhook payload validation",
    },
  ],

  deepDive: {
    overview:
      "Webhook signature verification (`401 Invalid Signature`) is one of the most frustrating integration bugs in e-commerce and SaaS engineering. Providers like Shopify (`X-Shopify-Hmac-Sha256`), Stripe (`Stripe-Signature`), and GitHub (`X-Hub-Signature-256`) sign the exact raw byte stream of the HTTP request body using `HMAC-SHA256`. If your framework parses the JSON body first and re-serializes it via `JSON.stringify(req.body)`, even a single stripped space, newline, or floating-point formatting change alters the SHA-256 digest completely. This client-side debugger tests 8 common payload and encoding mutations locally in your browser and generates a timing-safe verification handler paired with a Zod payload schema.",
    whyDevelopersUseThis: [
      "Tests 8 common webhook payload mutations simultaneously (exact raw body, minified JSON, 2-space pretty JSON, trailing newline `\\n`, Base64 vs Hex, and Stripe's `${timestamp}.${rawBody}` prefix).",
      "Generates production-ready Next.js App Router (`await req.text()`) and Express (`express.raw()`) handlers that preserve raw bytes before parsing JSON.",
      "Uses `crypto.timingSafeEqual` with byte-length pre-checks so your webhook endpoint is protected against timing side-channel attacks and `ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH` crashes.",
      "Infers a complete Zod v4 or v3 validation schema from the sample webhook payload in the same pass.",
    ],
    commonPitfalls: [
      {
        pitfall: "Calling await req.json() or global express.json() before verifying the HMAC digest",
        solution:
          "Once `req.json()` parses the body, the original whitespace and key formatting are lost forever. Always read `const rawBody = await req.text()` in Next.js App Router (or `express.raw({ type: 'application/json' })` in Express) and pass `rawBody` to `crypto.createHmac` before calling `JSON.parse(rawBody)`.",
      },
      {
        pitfall: "Mixing Base64 and Hex digest encodings between Shopify, Stripe, and GitHub",
        solution:
          "Shopify encodes `X-Shopify-Hmac-Sha256` in **Base64** (`.digest('base64')`), whereas GitHub (`sha256=<hex>`) and Stripe (`t=<ts>,v1=<hex>`) encode their HMAC-SHA256 digests in lowercase **Hex** (`.digest('hex')`).",
      },
      {
        pitfall: "Calling crypto.timingSafeEqual(a, b) without checking a.length === b.length first",
        solution:
          "Node's `crypto.timingSafeEqual` throws a synchronous `RangeError: Input buffers must have the same byte length` if an attacker sends a truncated or empty signature header. Always check `a.length === b.length` before calling `timingSafeEqual`.",
      },
      {
        pitfall: "Splitting Stripe-Signature with Object.fromEntries() or rolling manual parsing instead of stripe.webhooks.constructEvent in production",
        solution:
          "During webhook secret rotation, Stripe sends multiple `v1=` signatures in a single `Stripe-Signature` header (`t=...,v1=old_sig,v1=new_sig`). Using `Object.fromEntries()` overwrites earlier `v1` keys and breaks zero-downtime secret rollovers. Always collect all `v1` values and verify if any matches, or in production Node.js backends, prefer the official SDK helper `stripe.webhooks.constructEvent(rawBody, sigHeader, endpointSecret)` which handles multi-signature matching and 300s timestamp tolerance automatically.",
      },
    ],
  },

  edgeCases: [
    {
      title: "Stripe Timestamp-Prefixed Signed Payload (t=...,v1=...)",
      scenario:
        "Hashing only the raw JSON body for a Stripe webhook always fails verification because Stripe signs `${timestamp}.${rawBody}`.",
      inputSnippet: `{
  "provider": "stripe",
  "secret": "whsec_test_secret",
  "timestamp": "1714500000",
  "payload": {"id": "evt_123", "type": "checkout.session.completed"}
}`,
      outputSnippet: `const computedHex = crypto
  .createHmac("sha256", secret)
  .update(\`\${timestamp}.\${rawBody}\`, "utf8")
  .digest("hex");`,
      explanation:
        "Stripe prevents replay attacks by binding the Unix timestamp `t` from the `Stripe-Signature` header into the HMAC input string separated by a literal dot `.`.",
    },
    {
      title: "Shopify Base64 Digest vs GitHub sha256= Hex Prefix",
      scenario:
        "GitHub prepends `sha256=` to a 64-character hexadecimal digest, whereas Shopify sends a 44-character Base64 string without a prefix.",
      inputSnippet: `{
  "provider": "github",
  "secret": "gh_webhook_secret",
  "signature": "sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17",
  "payload": {"action": "opened"}
}`,
      outputSnippet: `const sigHeader = (req.headers.get("x-hub-signature-256") ?? "").replace(/^sha256=/, "");
const computedHex = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");`,
      explanation:
        "Always strip the leading `sha256=` prefix from `X-Hub-Signature-256` before comparing buffers.",
    },
  ],

  faqs: [
    {
      question: "Why does my webhook signature pass in Postman but fail in production?",
      answer:
        "Most web frameworks (like Express with `app.use(express.json())`) parse the incoming JSON stream into a JavaScript object before your route handler runs. Re-stringifying that object (`JSON.stringify(req.body)`) does not reproduce the exact byte sequence signed by Shopify or Stripe.",
    },
    {
      question: "Is my webhook signing secret (`whsec_...` or `shpss_...`) safe in this tool?",
      answer:
        "Yes. All HMAC-SHA256 calculations and payload mutation checks execute 100% inside your browser's JavaScript engine with zero network requests.",
    },
    {
      question: "Which secret key does Shopify use to sign webhooks?",
      answer:
        "For custom apps created in the Shopify Admin, webhooks are signed with the app's Webhook Signing Secret (`shpss_...`). For public/partner apps, webhooks are signed using the app's Client Secret.",
    },
    {
      question: "Should I use manual HMAC verification or stripe.webhooks.constructEvent in production?",
      answer:
        "For Stripe webhooks in production, we strongly recommend using `stripe.webhooks.constructEvent(rawBody, sigHeader, process.env.STRIPE_WEBHOOK_SECRET)` from the official `stripe` npm package. Our manual verification template is ideal for debugging raw-body issues, Edge runtimes without the Stripe SDK, or understanding how multiple `v1=` signatures and the 300-second timestamp tolerance work under the hood.",
    },
  ],

  relatedSlugs: ["json-to-zod", "env-to-zod", "curl-to-fetch"],
};
