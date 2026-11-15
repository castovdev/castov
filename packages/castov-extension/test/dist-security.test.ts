import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Castov Secret Shield - Automated Bundle & Security Verification", () => {
  const distDir = path.resolve(import.meta.dirname || process.cwd(), "../dist");

  it("verifies dist/ exists and contains all required artifacts without extraneous files", () => {
    expect(fs.existsSync(distDir), "dist/ directory must exist (run build first)").toBe(true);

    const requiredFiles = [
      "manifest.json",
      "content.js",
      "popup.js",
      "popup.html",
      "popup.css",
      "castov-secret-shield-1.0.0.zip",
      "icons/icon16.png",
      "icons/icon32.png",
      "icons/icon48.png",
      "icons/icon128.png",
      "_locales/en/messages.json",
    ];

    for (const f of requiredFiles) {
      const p = path.join(distDir, f);
      expect(fs.existsSync(p), `Missing artifact in dist/: ${f}`).toBe(true);
    }

    // Ensure background.js and store-logo-300.png are NOT in dist/
    expect(fs.existsSync(path.join(distDir, "background.js"))).toBe(false);
    expect(fs.existsSync(path.join(distDir, "icons/store-logo-300.png"))).toBe(false);
  });

  it("fails if dist/ JavaScript contains network or eval primitives", () => {
    const jsFiles = ["content.js", "popup.js"];
    const forbiddenPatterns = [
      /\bfetch\s*\(/,
      /\bXMLHttpRequest\b/,
      /\bWebSocket\b/,
      /\bsendBeacon\b/,
      /\beval\s*\(/,
      /\bnew\s+Function\b/,
    ];

    for (const jsFile of jsFiles) {
      const filePath = path.join(distDir, jsFile);
      const code = fs.readFileSync(filePath, "utf8");

      for (const pattern of forbiddenPatterns) {
        const match = pattern.exec(code);
        expect(
          match,
          `Security violation: ${jsFile} contains forbidden token matching ${pattern} at index ${match?.index}`
        ).toBeNull();
      }
    }
  });

  it("enforces strict single-purpose manifest permissions against approved allowlist", () => {
    const manifestPath = path.join(distDir, "manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    expect(manifest.manifest_version).toBe(3);

    // Approved permissions allowlist: strictly storage only
    const approvedPermissions = ["storage"];
    expect(manifest.permissions).toEqual(approvedPermissions);
    expect(manifest.background).toBeUndefined();
    expect(manifest.host_permissions).toBeUndefined();

    // Forbidden permissions check
    const forbiddenPermissions = [
      "<all_urls>",
      "tabs",
      "activeTab",
      "contextMenus",
      "webRequest",
      "webRequestBlocking",
      "history",
      "cookies",
      "clipboardRead",
      "identity",
      "scripting",
      "proxy",
      "management",
      "debugger",
    ];

    for (const forbidden of forbiddenPermissions) {
      expect(manifest.permissions).not.toContain(forbidden);
    }

    // Approved content_scripts matches
    const approvedMatches = [
      "*://chatgpt.com/*",
      "*://chat.openai.com/*",
      "*://claude.ai/*",
      "*://gemini.google.com/*",
      "*://chat.deepseek.com/*",
      "*://deepseek.com/*",
      "*://www.deepseek.com/*",
      "*://www.perplexity.ai/*",
      "*://copilot.microsoft.com/*",
      "*://copilot.cloud.microsoft/*",
      "*://copilot.com/*",
    ];
    expect(manifest.content_scripts?.[0]?.matches).toEqual(approvedMatches);

    // Enforce connect-src 'none' in Content Security Policy
    const csp = manifest.content_security_policy?.extension_pages || "";
    expect(csp).toContain("connect-src 'none'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("object-src 'self'");
  });

  it("verifies all <script src> tags in dist/popup.html point to files existing in dist/", () => {
    const popupHtmlPath = path.join(distDir, "popup.html");
    expect(fs.existsSync(popupHtmlPath), "dist/popup.html must exist").toBe(true);

    const html = fs.readFileSync(popupHtmlPath, "utf8");
    const scriptSrcMatches = Array.from(html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi));

    expect(scriptSrcMatches.length, "dist/popup.html must contain at least one <script src>").toBeGreaterThan(0);

    for (const match of scriptSrcMatches) {
      const src = match[1];
      const scriptPath = path.resolve(distDir, src);
      expect(
        fs.existsSync(scriptPath),
        `Script src "${src}" in dist/popup.html points to missing file: ${scriptPath}`
      ).toBe(true);
    }
  });
});
