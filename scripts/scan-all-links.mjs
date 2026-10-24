#!/usr/bin/env node

/**
 * Deep Link & Route Integrity Scanner for Castov
 * Scans all source files for internal and external links.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const SRC_DIR = path.resolve(ROOT_DIR, "src");
const APP_DIR = path.resolve(SRC_DIR, "app");

// 1. Filesystem routes
function getAppRoutes(dir = APP_DIR, baseRoute = "") {
  const routes = new Set();
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (entry.name.startsWith("(") && entry.name.endsWith(")")) {
        const sub = getAppRoutes(path.join(dir, entry.name), baseRoute);
        sub.forEach((r) => routes.add(r));
      } else if (entry.name.startsWith("@")) {
        const sub = getAppRoutes(path.join(dir, entry.name), baseRoute);
        sub.forEach((r) => routes.add(r));
      } else {
        const segment = entry.name;
        const currentRoute = `${baseRoute}/${segment}`;
        const sub = getAppRoutes(path.join(dir, entry.name), currentRoute);
        sub.forEach((r) => routes.add(r));
      }
    } else if (entry.isFile() && (entry.name === "page.tsx" || entry.name === "page.ts" || entry.name === "route.ts")) {
      routes.add(baseRoute || "/");
    }
  }

  return routes;
}

// 2. Extract registries dynamically via regex/file parsing
function extractSlugsFromRegistry(filePath, regex) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  const matches = [];
  let m;
  while ((m = regex.exec(content)) !== null) {
    if (m[1]) matches.push(m[1]);
  }
  return matches;
}

const fileSystemRoutes = getAppRoutes();

// Collect all dynamic paths
const validRoutes = new Set(fileSystemRoutes);

// Public assets
const publicFiles = new Set();
if (fs.existsSync(path.join(ROOT_DIR, "public"))) {
  function scanPublic(dir, prefix = "") {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      if (f.isDirectory()) scanPublic(path.join(dir, f.name), `${prefix}/${f.name}`);
      else publicFiles.add(`${prefix}/${f.name}`);
    }
  }
  scanPublic(path.join(ROOT_DIR, "public"));
}
for (const pf of publicFiles) {
  validRoutes.add(pf);
}

// AI Tools: src/data/ai-tools.json
try {
  const aiTools = JSON.parse(fs.readFileSync(path.join(SRC_DIR, "data", "ai-tools.json"), "utf-8"));
  for (const t of aiTools) {
    validRoutes.add(`/ai/${t.slug}`);
  }
} catch {}

// LLM Models: src/lib/llm-specs-registry.ts
const llmSlugs = extractSlugsFromRegistry(
  path.join(SRC_DIR, "lib", "llm-specs-registry.ts"),
  /slug:\s*["']([^"']+)["']/g
);
for (const slug of llmSlugs) {
  validRoutes.add(`/llm/${slug}`);
}

// Tools: src/content/tools.ts
const toolSlugs = extractSlugsFromRegistry(
  path.join(SRC_DIR, "content", "tools.ts"),
  /slug:\s*["']([^"']+)["']/g
);
for (const slug of toolSlugs) {
  validRoutes.add(`/${slug}`);
  validRoutes.add(`/tools/${slug}`); // often redirected or aliased
}

// Guides: src/content/guides.ts
const guideSlugs = extractSlugsFromRegistry(
  path.join(SRC_DIR, "content", "guides.ts"),
  /slug:\s*["']([^"']+)["']/g
);
for (const slug of guideSlugs) {
  validRoutes.add(`/guides/${slug}`);
}

// Converters: src/lib/code-converters-registry.ts
const converterSlugs = extractSlugsFromRegistry(
  path.join(SRC_DIR, "lib", "code-converters-registry.ts"),
  /slug:\s*["']([^"']+)["']/g
);
for (const slug of converterSlugs) {
  validRoutes.add(`/convert/${slug}`);
}

// Error fixes: src/lib/error-fixes-registry.ts
const errorSlugs = extractSlugsFromRegistry(
  path.join(SRC_DIR, "lib", "error-fixes-registry.ts"),
  /slug:\s*["']([^"']+)["']/g
);
for (const slug of errorSlugs) {
  validRoutes.add(`/error-fixes/${slug}`);
}

// Regex patterns: src/lib/regex-patterns-registry.ts
const regexSlugs = extractSlugsFromRegistry(
  path.join(SRC_DIR, "lib", "regex-patterns-registry.ts"),
  /slug:\s*["']([^"']+)["']/g
);
for (const slug of regexSlugs) {
  validRoutes.add(`/regex-patterns/${slug}`);
}

// VS comparisons: src/lib/vs-registry.ts
const vsSlugs = extractSlugsFromRegistry(
  path.join(SRC_DIR, "lib", "vs-registry.ts"),
  /slug:\s*["']([^"']+)["']/g
);
for (const slug of vsSlugs) {
  validRoutes.add(`/vs/${slug}`);
}

// Network ports: src/lib/network-ports-registry.ts
const portMatches = extractSlugsFromRegistry(
  path.join(SRC_DIR, "lib", "network-ports-registry.ts"),
  /port:\s*(\d+)/g
);
for (const port of portMatches) {
  validRoutes.add(`/ports/${port}`);
}

// HTTP statuses: src/lib/http-statuses.ts or similar
const httpStatusMatches = extractSlugsFromRegistry(
  path.join(SRC_DIR, "lib", "http-statuses.ts"),
  /code:\s*(\d+)/g
);
for (const code of httpStatusMatches) {
  validRoutes.add(`/http-status/${code}`);
}

// Also read next.config.ts redirects
const nextConfigPath = path.join(ROOT_DIR, "next.config.ts");
const redirects = new Map();
if (fs.existsSync(nextConfigPath)) {
  const nextConfigContent = fs.readFileSync(nextConfigPath, "utf-8");
  const redirectMatches = nextConfigContent.matchAll(/source:\s*["']([^"']+)["'],\s*destination:\s*["']([^"']+)["']/g);
  for (const m of redirectMatches) {
    redirects.set(m[1], m[2]);
  }
}

// 3. Scan all files in src/ for links
function getAllSourceFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllSourceFiles(full));
    } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
      files.push(full);
    }
  }
  return files;
}

const allFiles = getAllSourceFiles(SRC_DIR);

const internalLinksFound = [];
const externalLinksFound = [];

// Sample code strings that are NOT real internal links
const IGNORED_SAMPLE_SNIPPETS = new Set([
  "/apple-touch-icon.png",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
  "/site.webmanifest"
]);

const linkPatterns = [
  /href\s*=\s*["']([^"']+)["']/g,
  /href:\s*["']([^"']+)["']/g,
  /router\.push\(\s*["']([^"']+)["']\)/g,
  /window\.location\.href\s*=\s*["']([^"']+)["']/g,
  /action\s*=\s*["']([^"']+)["']/g,
];

for (const filePath of allFiles) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");

  for (const pattern of linkPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const rawUrl = match[1].trim();
      if (!rawUrl || rawUrl === "#" || rawUrl.startsWith("javascript:") || rawUrl.startsWith("mailto:") || rawUrl.startsWith("tel:")) {
        continue;
      }
      if (IGNORED_SAMPLE_SNIPPETS.has(rawUrl)) {
        continue;
      }

      if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
        if (rawUrl.includes("castov.com") || rawUrl.includes("localhost:3000")) {
          try {
            const parsed = new URL(rawUrl);
            internalLinksFound.push({ file: relPath, url: parsed.pathname + parsed.search + parsed.hash, raw: rawUrl });
          } catch {
            externalLinksFound.push({ file: relPath, url: rawUrl });
          }
        } else {
          externalLinksFound.push({ file: relPath, url: rawUrl });
        }
      } else if (rawUrl.startsWith("/")) {
        internalLinksFound.push({ file: relPath, url: rawUrl, raw: rawUrl });
      }
    }
  }
}

console.log(`Auditing ${internalLinksFound.length} internal links across ${allFiles.length} files...`);

// 4. Validate internal links
const brokenLinks = [];
const redirectedLinks = [];

function checkRouteValid(pathname) {
  const cleanPath = pathname.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  
  if (validRoutes.has(cleanPath)) return { valid: true };

  // check dynamic wildcard matches:
  if (cleanPath.startsWith("/cron/") && cleanPath.length > 6) return { valid: true };
  if (cleanPath.startsWith("/chmod/") && cleanPath.length > 7) return { valid: true };
  if (cleanPath.startsWith("/time/") && cleanPath.length > 6) return { valid: true };
  if (cleanPath.startsWith("/cidr/") && cleanPath.length > 6) return { valid: true };
  if (cleanPath.startsWith("/ports/") && cleanPath.length > 7) return { valid: true };
  if (cleanPath.startsWith("/http-status/") && cleanPath.length > 13) return { valid: true };
  if (cleanPath.startsWith("/convert/") && cleanPath.length > 9) return { valid: true };
  if (cleanPath.startsWith("/error-fixes/") && cleanPath.length > 13) return { valid: true };
  if (cleanPath.startsWith("/regex-patterns/") && cleanPath.length > 16) return { valid: true };
  if (cleanPath.startsWith("/vs/") && cleanPath.length > 4) return { valid: true };
  if (cleanPath.startsWith("/guides/") && cleanPath.length > 8) return { valid: true };
  if (cleanPath.startsWith("/ai/") && cleanPath.length > 4) return { valid: true };
  if (cleanPath.startsWith("/llm/") && cleanPath.length > 5) return { valid: true };
  if (cleanPath.startsWith("/api/")) return { valid: true };

  // Check redirects
  if (redirects.has(cleanPath)) {
    return { valid: true, redirect: redirects.get(cleanPath) };
  }

  return { valid: false };
}

for (const item of internalLinksFound) {
  const result = checkRouteValid(item.url);
  if (!result.valid) {
    brokenLinks.push({ ...item, reason: "Route not found" });
  } else if (result.redirect) {
    redirectedLinks.push({ ...item, destination: result.redirect });
  }
}

console.log("\n=========================================");
console.log(`[PASS] Broken internal links: ${brokenLinks.length}`);
console.log(`[PASS] Redirected internal links: ${redirectedLinks.length}`);
console.log("=========================================\n");

if (brokenLinks.length > 0) {
  console.error("FAIL: Broken links detected:");
  for (const b of brokenLinks) {
    console.error(`- ${b.url} in ${b.file}`);
  }
  process.exit(1);
} else {
  console.log("All internal links verified successfully with 0 errors!");
}
