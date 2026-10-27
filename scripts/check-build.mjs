#!/usr/bin/env node
/**
 * Post-build checks. Run after `npm run build`:  npm run check:seo
 * Reads the prerendered HTML in .next/server/app and verifies SEO, structured data,
 * internal links, form labels and that no secrets ended up in the client bundle.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const APP = ".next/server/app";
const errors = [];
const warnings = [];
const fail = (page, msg) => errors.push(`${page}: ${msg}`);
const warn = (page, msg) => warnings.push(`${page}: ${msg}`);

if (!existsSync(APP)) {
  console.error("No build found. Run `npm run build` first.");
  process.exit(1);
}

// ---- sitemap ---------------------------------------------------------------
const sitemap = readFileSync(join(APP, "sitemap.xml.body"), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urls.length === 0) fail("sitemap.xml", "no URLs found");
const origin = new URL(urls[0]).origin;
const paths = urls.map((u) => new URL(u).pathname);
const pathSet = new Set(paths);
if (new Set(urls).size !== urls.length) fail("sitemap.xml", "duplicate URLs");

const robots = readFileSync(join(APP, "robots.txt.body"), "utf8");
if (!/Sitemap:\s*\S+\/sitemap\.xml/.test(robots)) fail("robots.txt", "missing Sitemap line");
if (/Disallow:\s*\/\s*$/m.test(robots)) fail("robots.txt", "site is fully disallowed");

// ---- per page --------------------------------------------------------------
const titles = new Map();
const descriptions = new Map();
const KNOWN_EXTRA = new Set(["/icon.svg", "/opengraph-image", "/twitter-image", "/sitemap.xml", "/robots.txt"]);

function attr(tag, name) {
  const m = new RegExp(`${name}="([^"]*)"`).exec(tag);
  return m ? m[1] : null;
}
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

for (const path of paths) {
  const file = join(APP, path === "/" ? "index.html" : `${path.slice(1)}.html`);
  if (!existsSync(file)) {
    fail(path, `no prerendered HTML at ${file}`);
    continue;
  }
  const html = readFileSync(file, "utf8");
  const head = html.slice(0, html.indexOf("</head>"));
  const body = html.slice(html.indexOf("<body"));
  const text = decode(body.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));

  if (!/<html[^>]*lang="en"/.test(html)) fail(path, "missing <html lang>");
  const h1s = body.match(/<h1[\s>]/g) ?? [];
  if (h1s.length !== 1) fail(path, `expected exactly one <h1>, found ${h1s.length}`);

  const title = /<title>([^<]*)<\/title>/.exec(head)?.[1];
  if (!title) fail(path, "missing <title>");
  else {
    if (titles.has(title)) fail(path, `duplicate title (also ${titles.get(title)})`);
    titles.set(title, path);
  }
  const desc = /<meta name="description" content="([^"]*)"/.exec(head)?.[1];
  if (!desc) fail(path, "missing meta description");
  else {
    if (descriptions.has(desc)) fail(path, `duplicate description (also ${descriptions.get(desc)})`);
    descriptions.set(desc, path);
    if (decode(desc).length > 160) fail(path, `description is ${decode(desc).length} chars (max 160)`);
    if (decode(desc).length < 70) warn(path, `description is short (${decode(desc).length} chars)`);
  }
  if (title && decode(title).length > 75) warn(path, `title is ${decode(title).length} chars`);

  const canonical = /<link rel="canonical" href="([^"]*)"/.exec(head)?.[1];
  const expected = origin + (path === "/" ? "" : path);
  if (canonical !== expected && canonical !== expected + "/") fail(path, `canonical is ${canonical}, expected ${expected}`);

  for (const p of ["og:title", "og:description", "og:url", "og:image", "og:type", "og:site_name"]) {
    if (!new RegExp(`<meta property="${p}"`).test(head)) fail(path, `missing ${p}`);
  }
  for (const n of ["twitter:card", "twitter:title", "twitter:description", "twitter:image"]) {
    if (!new RegExp(`<meta name="${n}"`).test(head)) fail(path, `missing ${n}`);
  }
  if (/<meta name="keywords"/i.test(head)) fail(path, "meta keywords must not be used");
  if (/<meta name="robots" content="[^"]*noindex/.test(head)) fail(path, "page is noindex");

  // Structured data
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const types = [];
  for (const raw of blocks) {
    try {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const data of items) {
        if (!data) continue;
        if (data["@type"]) types.push(data["@type"]);
        if (data["@type"] === "FAQPage") {
          for (const q of data.mainEntity || []) {
            if (!text.includes(decode(q.name))) fail(path, `FAQ question not visible on page: ${q.name}`);
            if (!text.includes(decode(q.acceptedAnswer.text))) fail(path, `FAQ answer not visible on page: ${q.name}`);
          }
        }
        if (data["@type"] === "BreadcrumbList") {
          const last = data.itemListElement?.at(-1);
          if (last && last.item !== expected) fail(path, `breadcrumb last item ${last.item} != ${expected}`);
        }
      }
    } catch (e) {
      fail(path, `invalid JSON-LD: ${e.message}`);
    }
  }
  const NON_TOOL_PATHS = new Set([
    "/", "/tools", "/guides", "/about", "/privacy", "/terms", "/contact",
    "/cli", "/extension", "/cheatsheets", "/http-status", "/cron",
    "/timezones", "/timestamps", "/resources", "/code", "/convert",
    "/chrono-db", "/webhook-tester", "/sponsor", "/developer", "/canvas", "/ai", "/login",
    "/regex-patterns", "/error-fixes", "/tech-trends"
  ]);
  const isTool = !NON_TOOL_PATHS.has(path) &&
    !path.startsWith("/guides/") &&
    !path.startsWith("/ai/") &&
    !path.startsWith("/chmod/") &&
    !path.startsWith("/http-status/") &&
    !path.startsWith("/cron/") &&
    !path.startsWith("/unix/") &&
    !path.startsWith("/convert/") &&
    !path.startsWith("/regex-patterns/") &&
    !path.startsWith("/error-fixes/");
  if (path !== "/" && !types.includes("BreadcrumbList")) fail(path, "missing BreadcrumbList");
  if (isTool) {
    for (const t of ["WebApplication", "FAQPage"]) if (!types.includes(t)) fail(path, `missing ${t} structured data`);
    if (!/<h2[^>]*>Examples<\/h2>/.test(body)) fail(path, "missing Examples section");
    if (!/How to use this tool/.test(body)) fail(path, "missing How to use section");
    const related = (body.match(/href="\/[a-z0-9-]+"/g) ?? []).length;
    if (related < 5) fail(path, `few internal links (${related})`);
  }

  // Internal links
  for (const m of body.matchAll(/href="(\/[^"#?]*)/g)) {
    const target = m[1].replace(/\/$/, "") || "/";
    if (target.startsWith("/_next")) continue;
    const targetFile = join(APP, target === "/" ? "index.html" : `${target.slice(1)}.html`);
    const targetDirIndex = join(APP, target.slice(1), "index.html");
    const targetPublic = join("public", target.slice(1));
    const targetRoute = join(APP, target.slice(1), "route.js");
    const exists =
      pathSet.has(target) ||
      KNOWN_EXTRA.has(target) ||
      existsSync(targetFile) ||
      existsSync(targetDirIndex) ||
      existsSync(targetPublic) ||
      existsSync(targetRoute);
    if (!exists) fail(path, `broken internal link: ${m[1]}`);
  }

  // Form controls need labels
  const labelFor = new Set([...body.matchAll(/<label[^>]*for="([^"]+)"/g)].map((m) => m[1]));
  for (const m of body.matchAll(/<(input|select|textarea)\b[^>]*>/g)) {
    const tag = m[0];
    if (/type="hidden"/.test(tag)) continue;
    const id = attr(tag, "id");
    if (!(id && labelFor.has(id)) && !attr(tag, "aria-label")) fail(path, `form control without label: ${tag.slice(0, 80)}`);
  }
  for (const m of body.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)) {
    const name = m[1].replace(/<[^>]+>/g, "").trim();
    if (!name && !/aria-label="[^"]+"/.test(m[0])) fail(path, "button without accessible name");
  }
  for (const m of body.matchAll(/<img\b[^>]*>/g)) if (attr(m[0], "alt") === null) fail(path, "img without alt");

  // Error-looking strings must never be server-rendered
  for (const bad of ["NaN", "Invalid Date", "undefined", "[object Object]"]) {
    if (bad === "undefined" && path.startsWith("/error-fixes")) continue;
    if (text.includes(bad)) fail(path, `page text contains "${bad}"`);
  }
}

// ---- secrets / external calls in client bundle -----------------------------
function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const staticDir = ".next/static";
const hosts = new Set();
if (existsSync(staticDir)) {
  for (const f of walk(staticDir).filter((f) => f.endsWith(".js"))) {
    const js = readFileSync(f, "utf8");
    const cleanedJs = js.replace(/AKIAIOSFODNN7EXAMPLE/g, "");
    if (/(sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----[\\r\\n\\\s]*[A-Za-z0-9+/=]{16,}|api[_-]?key["']?\s*[:=]\s*["'][A-Za-z0-9]{16,})/i.test(cleanedJs)) {
      fail(f, "possible secret in client bundle");
    }
    for (const m of js.matchAll(/https?:\/\/([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi)) hosts.add(m[1].toLowerCase());
  }
}
const allowedHosts = new RegExp(
  `^(www\\.w3\\.org|schema\\.org|nextjs\\.org|react\\.dev|reactjs\\.org|github\\.com|localhost|developer\\.mozilla\\.org|tc39\\.es|.*\\.googlesyndication\\.com|.*\\.google\\.com|.*\\.svgjs\\.dev|facebook\\.github\\.io|.*\\.nextjs\\.org|.*\\.supabase\\.co|supabase\\.com|va\\.vercel-scripts\\.com|vercel\\.com|cdn\\.jsdelivr\\.net|.*\\.reactflow\\.dev|reactflow\\.dev|redux\\.js\\.org|redux-toolkit\\.js\\.org|stripe\\.com|.*\\.shields\\.io|x\\.com|.*\\.herokuapp\\.com|github-readme-stats\\.vercel\\.app|jcgt\\.org|docs\\.pmnd\\.rs|bit\\.ly|pokeapi\\.co|api\\.example\\.com|.*\\.npmjs\\.com|npmjs\\.com|.*\\.instagram\\.com|instagram\\.com|${new URL(origin).hostname.replace(/\\./g, "\\\\.")})$`,
);
const unexpected = [...hosts].filter((h) => !allowedHosts.test(h));
if (unexpected.length) warn("client bundle", `unexpected external hosts referenced: ${unexpected.join(", ")}`);

// ---- report ----------------------------------------------------------------
console.log(`Checked ${paths.length} pages from the sitemap (${origin}).`);
for (const w of warnings) console.log(`  warning: ${w}`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("All build checks passed.");
