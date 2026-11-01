/**
 * Build-time Quality Gate for Programmatic Code Converters
 *
 * Enforces strict content quality rules to protect Castov's domain reputation
 * against Google Helpful Content Update penalties (thin/doorway content).
 */

import fs from "node:fs";
import path from "node:path";

const CONVERTERS_DIR = path.resolve(process.cwd(), "src", "content", "converters");
const ENGINES_DIR = path.resolve(process.cwd(), "src", "lib", "converters", "engines");

console.log("🔍 Running Programmatic Converter Quality Gate...");

// Dynamically check all converter files in src/content/converters/ except index.ts
const files = fs.readdirSync(CONVERTERS_DIR).filter((f) => f.endsWith(".ts") && f !== "index.ts");

if (files.length === 0) {
  console.warn("⚠️ No modular converter files found to validate.");
  process.exit(0);
}

let totalChecked = 0;
let errors = [];

for (const file of files) {
  const filePath = path.join(CONVERTERS_DIR, file);
  const fileContent = fs.readFileSync(filePath, "utf8");

  // Basic static analysis checks
  totalChecked++;
  const slugMatch = fileContent.match(/slug:\s*["']([^"']+)["']/);
  const titleMatch = fileContent.match(/title:\s*["']([^"']+)["']/);
  const metaDescMatch = fileContent.match(/metaDescription:\s*["']([^"']+)["']/);
  const isApprovedMatch = fileContent.match(/isQualityApproved:\s*(true|false)/);

  if (!slugMatch) {
    errors.push(`[${file}] Missing 'slug'`);
    continue;
  }

  const slug = slugMatch[1];
  const isApproved = isApprovedMatch ? isApprovedMatch[1] === "true" : false;

  if (!isApproved) {
    console.log(`ℹ️ [${slug}] Marked as unapproved/draft - skipping strict audit.`);
    continue;
  }

  // Check 1: Engine file existence
  const engineFileTs = path.join(ENGINES_DIR, `${slug}.ts`);
  const engineFileJs = path.join(ENGINES_DIR, `${slug}.js`);
  if (!fs.existsSync(engineFileTs) && !fs.existsSync(engineFileJs)) {
    errors.push(`[${slug}] Engine file not found at src/lib/converters/engines/${slug}.ts`);
  }

  // Check 2: Title length
  const title = titleMatch ? titleMatch[1] : "";
  if (title.length < 25) {
    errors.push(`[${slug}] Title is too short (${title.length} chars, minimum 25 required)`);
  }

  // Check 3: Meta description
  const metaDesc = metaDescMatch ? metaDescMatch[1] : "";
  if (metaDesc.length < 70) {
    errors.push(`[${slug}] Meta description is too short (${metaDesc.length} chars, minimum 70 required)`);
  }

  // Check 4: Deep dive presence
  if (!fileContent.includes("deepDive:") || !fileContent.includes("overview:")) {
    errors.push(`[${slug}] Missing 'deepDive.overview'`);
  }

  // Check 5: Edge cases presence (must have at least 2)
  const edgeCaseMatches = fileContent.match(/title:\s*["'][^"']+["'],\s*scenario:/g) || [];
  if (edgeCaseMatches.length < 2) {
    errors.push(`[${slug}] Requires at least 2 distinct edgeCases (found ${edgeCaseMatches.length})`);
  }

  // Check 6: FAQs presence (must have at least 3)
  const faqMatches = fileContent.match(/question:\s*["'][^"']+["']/g) || [];
  if (faqMatches.length < 3) {
    errors.push(`[${slug}] Requires at least 3 custom FAQs (found ${faqMatches.length})`);
  }

  // Check 7: Forbidden fluff phrases
  if (fileContent.includes("zero runtime overhead") || fileContent.includes("100% type safety")) {
    errors.push(`[${slug}] Contains forbidden marketing fluff ('zero runtime overhead' or '100% type safety')`);
  }
}

if (errors.length > 0) {
  console.error("\n❌ Converter Quality Gate Failed:");
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log(`✅ Converter Quality Gate Passed! ${totalChecked} converter(s) verified against strict standards.\n`);
