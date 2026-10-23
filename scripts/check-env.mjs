#!/usr/bin/env node
/**
 * Production environment guard. Runs automatically before `npm run build` (npm "prebuild").
 *
 * Fails the build when the public site URL or contact email is missing or still a placeholder,
 * so a build with the wrong canonical domain or without a contact address can never ship.
 *
 * ALLOW_PLACEHOLDER_ENV=1 downgrades the errors to warnings. Use it ONLY for local QA builds; the
 * build is then NOT production-ready and the SEO audit will say so.
 */
import { existsSync } from "node:fs";
try {
  if (typeof process.loadEnvFile === "function") {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    else if (existsSync(".env")) process.loadEnvFile(".env");
  }
} catch { /* optional: env file may be missing or unreadable */ }

const env = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://www.castov.com",
  NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@castov.com",
  ...process.env
};
const allow = env.ALLOW_PLACEHOLDER_ENV === "1" || env.ALLOW_PLACEHOLDER_ENV === "true";

const PLACEHOLDER_HOST = /(^|\.)(example\.(com|net|org)|localhost|local|invalid|test|example)$|your-?domain|placeholder/i;

export function checkSiteUrl(value) {
  if (!value) return "NEXT_PUBLIC_SITE_URL is not set. Set it to your public origin, e.g. https://www.yourdomain.com";
  let url;
  try {
    url = new URL(value);
  } catch {
    return `NEXT_PUBLIC_SITE_URL is not a valid URL: ${value}`;
  }
  if (url.protocol !== "https:") return `NEXT_PUBLIC_SITE_URL must use https:// (got ${url.protocol}//).`;
  if (url.pathname !== "/" || url.search || url.hash) return "NEXT_PUBLIC_SITE_URL must be an origin only (no path, query or hash).";
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(url.hostname) || PLACEHOLDER_HOST.test(url.hostname)) {
    return `NEXT_PUBLIC_SITE_URL points to a placeholder or local host (${url.hostname}). Use your real domain.`;
  }
  return null;
}

export function checkContactEmail(value) {
  if (!value) return "NEXT_PUBLIC_CONTACT_EMAIL is not set. The /contact page needs a real mailbox, e.g. hello@yourdomain.com";
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(value)) return `NEXT_PUBLIC_CONTACT_EMAIL is not a valid email address: ${value}`;
  const host = value.split("@")[1];
  if (PLACEHOLDER_HOST.test(host)) return `NEXT_PUBLIC_CONTACT_EMAIL uses a placeholder domain (${host}). Use a real mailbox.`;
  return null;
}

export function checkAds(client, slots) {
  const problems = [];
  if (client && !/^ca-pub-\d{10,20}$/.test(client)) problems.push(`NEXT_PUBLIC_ADSENSE_CLIENT must look like ca-pub-1234567890123456 (got ${client}).`);
  for (const [name, v] of Object.entries(slots)) {
    if (v && !/^\d{6,20}$/.test(v)) problems.push(`${name} must be a numeric AdSense slot id (got ${v}).`);
    if (v && !client) problems.push(`${name} is set but NEXT_PUBLIC_ADSENSE_CLIENT is not.`);
  }
  return problems;
}

export function collectProblems(e) {
  return [
    checkSiteUrl(e.NEXT_PUBLIC_SITE_URL?.trim()),
    checkContactEmail(e.NEXT_PUBLIC_CONTACT_EMAIL?.trim()),
    ...checkAds(e.NEXT_PUBLIC_ADSENSE_CLIENT?.trim(), {
      NEXT_PUBLIC_ADSENSE_SLOT_TOOL_TOP: e.NEXT_PUBLIC_ADSENSE_SLOT_TOOL_TOP?.trim(),
      NEXT_PUBLIC_ADSENSE_SLOT_CONTENT_MIDDLE: e.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT_MIDDLE?.trim(),
      NEXT_PUBLIC_ADSENSE_SLOT_CONTENT_BOTTOM: e.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT_BOTTOM?.trim(),
    }),
  ].filter(Boolean);
}

import { fileURLToPath } from "node:url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = collectProblems(env);
  if (problems.length === 0) {
    console.log("Environment OK.");
  } else if (allow) {
    console.warn("\nWARNING: placeholder environment allowed by ALLOW_PLACEHOLDER_ENV. This build is NOT production-ready:");
    for (const p of problems) console.warn(`  - ${p}`);
    console.warn("");
  } else {
    console.error("\nEnvironment check failed. Fix these before building for production:");
    for (const p of problems) console.error(`  - ${p}`);
    console.error("\nSee .env.example. (For local QA only: ALLOW_PLACEHOLDER_ENV=1)\n");
    process.exit(1);
  }
}
