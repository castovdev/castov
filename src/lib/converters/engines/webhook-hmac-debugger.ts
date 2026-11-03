import { convert as jsonToZodConvert } from "./json-to-zod";

export interface WebhookHmacOptions {
  provider?: "auto" | "shopify" | "stripe" | "github" | "custom";
  framework?: "nextjs-app" | "express";
  zodVersion?: "v4" | "v3";
}

// Pure synchronous UTF-8 & SHA-256 / HMAC-SHA256 implementation so the engine
// runs identically in Browser, SSR, and Vitest without async Web Crypto locks.
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(n: number, x: number): number {
  return (x >>> n) | (x << (32 - n));
}

function sha256Bytes(msg: Uint8Array): Uint8Array {
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const bitLen = msg.length * 8;
  const padLen = ((msg.length + 9 + 63) & ~63);
  const padded = new Uint8Array(padLen);
  padded.set(msg);
  padded[msg.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(padLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(padLen - 4, bitLen >>> 0, false);

  const w = new Uint32Array(64);

  for (let offset = 0; offset < padLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, h0, false);
  outView.setUint32(4, h1, false);
  outView.setUint32(8, h2, false);
  outView.setUint32(12, h3, false);
  outView.setUint32(16, h4, false);
  outView.setUint32(20, h5, false);
  outView.setUint32(24, h6, false);
  outView.setUint32(28, h7, false);
  return out;
}

export function hmacSha256(keyStr: string, messageStr: string): { hex: string; base64: string } {
  const enc = new TextEncoder();
  let keyBytes: Uint8Array = enc.encode(keyStr);
  const msgBytes: Uint8Array = enc.encode(messageStr);

  if (keyBytes.length > 64) {
    keyBytes = sha256Bytes(keyBytes);
  }

  const blockKey = new Uint8Array(64);
  blockKey.set(keyBytes);

  const oKeyPad = new Uint8Array(64);
  const iKeyPad = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    oKeyPad[i] = blockKey[i] ^ 0x5c;
    iKeyPad[i] = blockKey[i] ^ 0x36;
  }

  const innerInput = new Uint8Array(64 + msgBytes.length);
  innerInput.set(iKeyPad);
  innerInput.set(msgBytes, 64);
  const innerHash = sha256Bytes(innerInput);

  const outerInput = new Uint8Array(64 + 32);
  outerInput.set(oKeyPad);
  outerInput.set(innerHash, 64);
  const digest = sha256Bytes(outerInput);

  const hex = Array.from(digest)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let base64 = "";
  for (let i = 0; i < digest.length; i += 3) {
    const b0 = digest[i];
    const b1 = i + 1 < digest.length ? digest[i + 1] : 0;
    const b2 = i + 2 < digest.length ? digest[i + 2] : 0;
    base64 += base64Chars[b0 >> 2];
    base64 += base64Chars[((b0 & 3) << 4) | (b1 >> 4)];
    base64 += i + 1 < digest.length ? base64Chars[((b1 & 15) << 2) | (b2 >> 6)] : "=";
    base64 += i + 2 < digest.length ? base64Chars[b2 & 63] : "=";
  }

  return { hex, base64 };
}

interface ParsedWebhookEnvelope {
  provider: "shopify" | "stripe" | "github" | "custom";
  secret: string;
  signatureHeader: string;
  timestamp: string;
  rawBody: string;
}

function parseEnvelope(input: string, providerOpt: string): ParsedWebhookEnvelope {
  let parsedObj: any = null;
  try {
    parsedObj = JSON.parse(input);
  } catch {
    throw new Error(
      'Invalid JSON input. Provide a JSON object with {"secret", "signature", "payload"} or raw webhook payload JSON.'
    );
  }

  if (
    parsedObj &&
    typeof parsedObj === "object" &&
    !Array.isArray(parsedObj) &&
    ("payload" in parsedObj || "secret" in parsedObj || "signature" in parsedObj)
  ) {
    const secret = String(parsedObj.secret || "whsec_sample_secret_key");
    const sig = String(parsedObj.signature || parsedObj.receivedSignature || "");
    const ts = String(parsedObj.timestamp || "1714500000");
    const rawBody =
      typeof parsedObj.payload === "string"
        ? parsedObj.payload
        : JSON.stringify(parsedObj.payload ?? {});

    let detectedProvider: "shopify" | "stripe" | "github" | "custom" = "shopify";
    if (providerOpt && providerOpt !== "auto") {
      detectedProvider = providerOpt as any;
    } else if (sig.includes("t=") && sig.includes("v1=")) {
      detectedProvider = "stripe";
    } else if (sig.startsWith("sha256=")) {
      detectedProvider = "github";
    } else if ( parsedObj.provider && ["shopify", "stripe", "github", "custom"].includes(String(parsedObj.provider).toLowerCase())) {
      detectedProvider = String(parsedObj.provider).toLowerCase() as any;
    }

    return {
      provider: detectedProvider,
      secret,
      signatureHeader: sig,
      timestamp: ts,
      rawBody,
    };
  }

  // Fallback if user pasted a raw webhook JSON payload directly
  return {
    provider: providerOpt !== "auto" ? (providerOpt as any) : "shopify",
    secret: "whsec_sample_secret_key",
    signatureHeader: "",
    timestamp: "1714500000",
    rawBody: input.trim(),
  };
}

export function convert(input: string, options?: WebhookHmacOptions): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Input is empty. Provide a webhook diagnostic JSON envelope or payload.");
  }

  const providerOpt = options?.provider ?? "auto";
  const framework = options?.framework ?? "nextjs-app";
  const zodVersion = options?.zodVersion ?? "v4";

  const env = parseEnvelope(trimmed, providerOpt);

  // Extract clean received signature(s) & timestamp if Stripe header format `t=123,v1=abc,v1=def`
  const rawSigHeader = env.signatureHeader.trim();
  const receivedSigs: string[] = [];
  let stripeTimestamp = env.timestamp;
  if (rawSigHeader.includes("v1=")) {
    const parts = rawSigHeader.split(",");
    for (const p of parts) {
      const eqIdx = p.indexOf("=");
      if (eqIdx === -1) continue;
      const k = p.slice(0, eqIdx).trim();
      const v = p.slice(eqIdx + 1).trim();
      if (k === "t" && v) stripeTimestamp = v;
      if (k === "v1" && v) receivedSigs.push(v);
    }
  } else if (rawSigHeader.startsWith("sha256=")) {
    receivedSigs.push(rawSigHeader.slice("sha256=".length));
  } else if (rawSigHeader) {
    receivedSigs.push(rawSigHeader);
  }

  // Prepare candidate mutations of rawBody to diagnose 401 signature mismatches
  let minifiedBody = env.rawBody;
  let pretty2Body = env.rawBody;
  try {
    const parsedJson = JSON.parse(env.rawBody);
    minifiedBody = JSON.stringify(parsedJson);
    pretty2Body = JSON.stringify(parsedJson, null, 2);
  } catch {
    // Non-JSON raw body
  }

  const candidates: Array<{
    label: string;
    bodyUsed: string;
    encoding: "base64" | "hex";
    computed: string;
    fixHint: string;
  }> = [];

  const exactHmac = hmacSha256(env.secret, env.rawBody);
  const minifiedHmac = hmacSha256(env.secret, minifiedBody);
  const prettyHmac = hmacSha256(env.secret, pretty2Body);
  const stripeSignedPayload = `${stripeTimestamp}.${env.rawBody}`;
  const stripeHmac = hmacSha256(env.secret, stripeSignedPayload);
  const stripeMinifiedHmac = hmacSha256(env.secret, `${stripeTimestamp}.${minifiedBody}`);
  const newlineHmac = hmacSha256(env.secret, env.rawBody + "\n");

  candidates.push(
    {
      label: "Shopify Exact Raw Body (Base64)",
      bodyUsed: "rawBody",
      encoding: "base64",
      computed: exactHmac.base64,
      fixHint: "Matches Shopify X-Shopify-Hmac-Sha256 on exact raw body bytes.",
    },
    {
      label: "GitHub / Generic Exact Raw Body (Hex)",
      bodyUsed: "rawBody",
      encoding: "hex",
      computed: exactHmac.hex,
      fixHint: "Matches GitHub X-Hub-Signature-256 (sha256=<hex>) on exact raw body.",
    },
    {
      label: "Stripe Timestamped Payload `${t}.${rawBody}` (Hex)",
      bodyUsed: `${stripeTimestamp}.<rawBody>`,
      encoding: "hex",
      computed: stripeHmac.hex,
      fixHint: "Matches Stripe-Signature v1=HMAC(secret, `${t}.${rawBody}`).",
    },
    {
      label: "Parsed & Re-serialized JSON.stringify(req.body) (Base64)",
      bodyUsed: "minified JSON",
      encoding: "base64",
      computed: minifiedHmac.base64,
      fixHint: "MISMATCH CAUSE: Your server parsed JSON before verifying HMAC, stripping original whitespace!",
    },
    {
      label: "Parsed & Re-serialized JSON.stringify(req.body) (Hex)",
      bodyUsed: "minified JSON",
      encoding: "hex",
      computed: minifiedHmac.hex,
      fixHint: "MISMATCH CAUSE: Middleware ran JSON.parse() before HMAC verification.",
    },
    {
      label: "Pretty-Printed JSON (2-space indent) (Base64)",
      bodyUsed: "pretty JSON (2 spaces)",
      encoding: "base64",
      computed: prettyHmac.base64,
      fixHint: "MISMATCH CAUSE: Payload was formatted with 2-space indentation before hashing.",
    },
    {
      label: "Stripe Timestamped + Minified JSON (Hex)",
      bodyUsed: `${stripeTimestamp}.<minified>`,
      encoding: "hex",
      computed: stripeMinifiedHmac.hex,
      fixHint: "Matches Stripe v1 signature over compact JSON.",
    },
    {
      label: "Raw Body with Trailing Newline (\\n) (Hex)",
      bodyUsed: "rawBody + '\\n'",
      encoding: "hex",
      computed: newlineHmac.hex,
      fixHint: "MISMATCH CAUSE: A trailing newline (\\n) was added or stripped by your editor/proxy.",
    }
  );

  const matchedCandidate =
    receivedSigs.length > 0
      ? candidates.find((c) =>
          receivedSigs.some((sig) => c.computed.toLowerCase() === sig.toLowerCase())
        )
      : undefined;

  // Build diagnostic comment block
  const diagLines: string[] = [
    "// ============================================================================",
    "// 🔍 WEBHOOK HMAC-SHA256 DIAGNOSTIC REPORT (100% Client-Side Verification)",
    "// ============================================================================",
    `// Provider Mode        : ${env.provider.toUpperCase()}`,
    `// Expected Shopify Hmac: ${minifiedHmac.base64}`,
    `// Expected GitHub Hmac : sha256=${minifiedHmac.hex}`,
    `// Expected Stripe Hmac : t=${stripeTimestamp},v1=${stripeMinifiedHmac.hex}`,
  ];

  if (receivedSigs.length > 0) {
    if (matchedCandidate) {
      diagLines.push(`// ✅ SIGNATURE MATCHED : ${matchedCandidate.label}`);
      diagLines.push(`// 💡 Diagnosis         : ${matchedCandidate.fixHint}`);
    } else {
      diagLines.push(`// ❌ SIGNATURE MISMATCH: Received '${env.signatureHeader}' did not match any mutation.`);
      diagLines.push(`// 💡 Check that you are using the Webhook Signing Secret (not API Secret Key).`);
    }
  }
  diagLines.push("// ============================================================================\n");

  // Generate Zod Schema from payload
  let zodSchemaCode = "";
  try {
    zodSchemaCode = jsonToZodConvert(minifiedBody, {
      zodVersion,
      rootName: "webhookPayloadSchema",
      strictMode: false,
    }).trim();
  } catch {
    zodSchemaCode = `import { z } from "zod";\n\nexport const webhookPayloadSchema = z.record(z.string(), z.unknown());`;
  }

  // Generate Handler Code
  let handlerCode = "";
  if (framework === "nextjs-app") {
    if (env.provider === "shopify") {
      handlerCode = `// Official Docs: https://shopify.dev/docs/apps/build/webhooks/subscribe/https#step-5-verify-the-webhook
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
}`;
    } else if (env.provider === "stripe") {
      handlerCode = `// Official Docs: https://docs.stripe.com/webhooks/signature#verify-manually
// Production Tip: Prefer stripe.webhooks.constructEvent(rawBody, sigHeader, secret) when using the official 'stripe' SDK.
import crypto from "node:crypto";
import { NextResponse } from "next/server";

const STRIPE_TIMESTAMP_TOLERANCE_SEC = 300; // 5 minutes replay protection window

export async function POST(req: Request) {
  // CRITICAL: Read exact raw bytes via req.text() for Stripe v1 HMAC verification
  const rawBody = await req.text();
  const sigHeader = req.headers.get("stripe-signature") ?? "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  // Extract timestamp (t=) and ALL v1= signatures (Stripe sends multiple v1 values during secret rotation)
  let timestamp = "";
  const v1Signatures: string[] = [];
  for (const part of sigHeader.split(",")) {
    const [k, v] = part.trim().split("=", 2);
    if (k === "t" && v) timestamp = v;
    if (k === "v1" && v) v1Signatures.push(v);
  }

  // 1. Enforce Timestamp Tolerance (300s) against Replay Attacks
  const timestampSec = Number(timestamp);
  const nowSec = Math.floor(Date.now() / 1000);
  if (!Number.isInteger(timestampSec) || Math.abs(nowSec - timestampSec) > STRIPE_TIMESTAMP_TOLERANCE_SEC) {
    return NextResponse.json({ error: "Stripe webhook timestamp outside 300s tolerance window" }, { status: 401 });
  }

  // 2. Compute HMAC-SHA256 over \`\${timestamp}.\${rawBody}\` and check if ANY v1 signature matches in constant time
  const computedHex = crypto
    .createHmac("sha256", secret)
    .update(\`\${timestamp}.\${rawBody}\`, "utf8")
    .digest("hex");

  const a = Buffer.from(computedHex, "utf8");
  const isVerified = v1Signatures.some((sig) => {
    const b = Buffer.from(sig, "utf8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
  if (!isVerified) {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 401 });
  }

  const parsed = webhookPayloadSchema.safeParse(JSON.parse(rawBody));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid Stripe event payload" }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}`;
    } else {
      handlerCode = `// Official Docs: https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
import crypto from "node:crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sigHeader = (req.headers.get("x-hub-signature-256") ?? "").replace(/^sha256=/, "");
  const secret = process.env.GITHUB_WEBHOOK_SECRET ?? "";

  const computedHex = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  const a = Buffer.from(computedHex, "utf8");
  const b = Buffer.from(sigHeader, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Invalid GitHub webhook signature" }, { status: 401 });
  }

  const parsed = webhookPayloadSchema.safeParse(JSON.parse(rawBody));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}`;
    }
  } else {
    // Express raw body handler
    if (env.provider === "stripe") {
      handlerCode = `// Official Docs: https://docs.stripe.com/webhooks/signature#verify-manually
// Production Tip: Prefer stripe.webhooks.constructEvent(req.body, sigHeader, secret) when using the official 'stripe' SDK.
import crypto from "node:crypto";
import express from "express";

const app = express();
const STRIPE_TIMESTAMP_TOLERANCE_SEC = 300; // 5 minutes replay protection window

// CRITICAL: Use express.raw() on the webhook route BEFORE global express.json()!
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const rawBody = (req.body as Buffer).toString("utf8");
    const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
    const sigHeader = String(req.headers["stripe-signature"] ?? "");

    // Extract timestamp (t=) and ALL v1= signatures (Stripe sends multiple v1 values during secret rotation)
    let timestamp = "";
    const v1Signatures: string[] = [];
    for (const part of sigHeader.split(",")) {
      const [k, v] = part.trim().split("=", 2);
      if (k === "t" && v) timestamp = v;
      if (k === "v1" && v) v1Signatures.push(v);
    }

    // 1. Enforce Timestamp Tolerance (300s) against Replay Attacks
    const timestampSec = Number(timestamp);
    const nowSec = Math.floor(Date.now() / 1000);
    if (!Number.isInteger(timestampSec) || Math.abs(nowSec - timestampSec) > STRIPE_TIMESTAMP_TOLERANCE_SEC) {
      return res.status(401).json({ error: "Stripe webhook timestamp outside 300s tolerance window" });
    }

    // 2. Compute HMAC-SHA256 over \`\${timestamp}.\${rawBody}\` and check if ANY v1 signature matches in constant time
    const computedHex = crypto
      .createHmac("sha256", secret)
      .update(\`\${timestamp}.\${rawBody}\`, "utf8")
      .digest("hex");

    const a = Buffer.from(computedHex, "utf8");
    const isVerified = v1Signatures.some((sig) => {
      const b = Buffer.from(sig, "utf8");
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    });
    if (!isVerified) {
      return res.status(401).json({ error: "Invalid Stripe signature" });
    }

    const parsed = webhookPayloadSchema.safeParse(JSON.parse(rawBody));
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    }

    return res.status(200).json({ received: true });
  }
);`;
    } else {
      const docUrl =
        env.provider === "shopify"
          ? "https://shopify.dev/docs/apps/build/webhooks/subscribe/https#step-5-verify-the-webhook"
          : "https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries";
      handlerCode = `// Official Docs: ${docUrl}
import crypto from "node:crypto";
import express from "express";

const app = express();

// CRITICAL: Use express.raw() on the webhook route BEFORE global express.json()!
app.post(
  "/api/webhooks/${env.provider}",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const rawBody = (req.body as Buffer).toString("utf8");
    const secret = process.env.WEBHOOK_SECRET ?? "";
    const receivedSig = String(req.headers["x-shopify-hmac-sha256"] ?? req.headers["x-hub-signature-256"] ?? "").replace(/^sha256=/, "");

    const computed = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("${env.provider === "shopify" ? "base64" : "hex"}");

    const a = Buffer.from(computed, "utf8");
    const b = Buffer.from(receivedSig, "utf8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ error: "Invalid HMAC signature" });
    }

    const parsed = webhookPayloadSchema.safeParse(JSON.parse(rawBody));
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    }

    return res.status(200).json({ received: true });
  }
);`;
    }
  }

  return `${diagLines.join("\n")}\n${zodSchemaCode}\n\n${handlerCode}\n`;
}
