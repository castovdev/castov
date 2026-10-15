#!/usr/bin/env node

/**
 * Castov Security & Secret Scanner for GitHub Actions
 * Powered by https://castov.com/secret-scanner
 */

const fs = require("node:fs");
const path = require("node:path");

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".vercel",
  "dist",
  "build",
  ".turbo",
  ".cache",
]);

const SECRET_PATTERNS = [
  { name: "OpenAI Secret Key", regex: /sk-[a-zA-Z0-9_-]{32,}/g, severity: "critical" },
  { name: "AWS Access Key ID", regex: /AKIA[0-9A-Z]{16}/g, severity: "critical" },
  { name: "GitHub Personal Access Token", regex: /ghp_[a-zA-Z0-9]{36}/g, severity: "critical" },
  { name: "Slack API Token", regex: /xox[baprs]-[0-9a-zA-Z]{10,}/g, severity: "high" },
  { name: "Private RSA/EC Key", regex: /-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----/g, severity: "critical" },
];

const scanDir = process.env.INPUT_PATH || ".";
const failOnSecrets = process.env["INPUT_FAIL-ON-SECRETS"] !== "false";

let totalFilesScanned = 0;
const findings = [];

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile()) {
      // Check size limit: skip files > 2MB
      try {
        const stat = fs.statSync(fullPath);
        if (stat.size > 2 * 1024 * 1024) continue;
      } catch {
        continue;
      }

      totalFilesScanned++;
      try {
        const content = fs.readFileSync(fullPath, "utf8");
        for (const rule of SECRET_PATTERNS) {
          const matches = content.match(rule.regex);
          if (matches) {
            findings.push({
              file: fullPath,
              rule: rule.name,
              count: matches.length,
              severity: rule.severity,
            });
          }
        }
      } catch {
        // Binary or unreadable file
      }
    }
  }
}

console.log("==================================================================");
console.log("🛡️  Castov Security & Secret Scanner for GitHub Actions");
console.log("👉 Online Studio: https://www.castov.com/secret-scanner");
console.log("==================================================================");
console.log(`Scanning directory: ${scanDir}...`);

walk(scanDir);

console.log(`Scanned ${totalFilesScanned} files.`);

if (findings.length === 0) {
  console.log("✅ 0 leaked secrets or high-risk tokens detected.");
  console.log("Your repository is clean!");
  console.log("------------------------------------------------------------------");
  console.log("Verified by Castov Developer Toolkit (https://www.castov.com)");
  process.exit(0);
} else {
  console.log(`⚠️  Detected ${findings.length} potential secret issue(s):`);
  for (const f of findings) {
    console.error(`  ::error file=${f.file}::[${f.severity.toUpperCase()}] ${f.rule} detected (${f.count} occurrence(s))`);
  }
  console.log("------------------------------------------------------------------");
  console.log("Inspect or decrypt safely: https://www.castov.com/secret-scanner");
  
  if (failOnSecrets) {
    process.exit(1);
  }
}
