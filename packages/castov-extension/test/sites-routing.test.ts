import { describe, it, expect, beforeEach } from "vitest";
import { isSupportedAISite, AI_CHAT_SITES } from "../src/config/sites";
import { isProtectionActiveForSite, updateSettings } from "../src/storage/counter";

describe("Castov Secret Shield - 11 Supported AI Chat Domains Routing & Storage Independence", () => {
  beforeEach(async () => {
    // Reset to default settings before each test
    await updateSettings({
      enabled: true,
      countingEnabled: true,
      siteToggles: {},
    });
  });

  describe("isSupportedAISite Domain Identification", () => {
    it("recognizes all 11 verified AI chat domains and URLs including subpaths", () => {
      expect(isSupportedAISite("chatgpt.com")).toBe(true);
      expect(isSupportedAISite("https://chatgpt.com/c/123")).toBe(true);
      expect(isSupportedAISite("chat.openai.com")).toBe(true);
      expect(isSupportedAISite("claude.ai")).toBe(true);
      expect(isSupportedAISite("gemini.google.com")).toBe(true);
      expect(isSupportedAISite("chat.deepseek.com")).toBe(true);
      expect(isSupportedAISite("https://chat.deepseek.com/chat/session-123")).toBe(true);
      expect(isSupportedAISite("deepseek.com")).toBe(true);
      expect(isSupportedAISite("https://deepseek.com/en/")).toBe(true);
      expect(isSupportedAISite("www.deepseek.com")).toBe(true);
      expect(isSupportedAISite("https://www.deepseek.com:443/zh/")).toBe(true);
      expect(isSupportedAISite("www.perplexity.ai")).toBe(true);
      expect(isSupportedAISite("copilot.microsoft.com")).toBe(true);
      expect(isSupportedAISite("copilot.cloud.microsoft")).toBe(true);
      expect(isSupportedAISite("copilot.com")).toBe(true);
    });

    it("strictly rejects spoofed, lookalike, or attacker domains", () => {
      expect(isSupportedAISite("malicious-deepseek.com")).toBe(false);
      expect(isSupportedAISite("https://malicious-deepseek.com/")).toBe(false);
      expect(isSupportedAISite("deepseek.com.attacker.com")).toBe(false);
      expect(isSupportedAISite("https://deepseek.com.attacker.com/")).toBe(false);
      expect(isSupportedAISite("notdeepseek.com")).toBe(false);
      expect(isSupportedAISite("malicious-copilot.com")).toBe(false);
    });

    it("verifies AI_CHAT_SITES configuration has all 11 explicit AI chat domains", () => {
      expect(AI_CHAT_SITES.length).toBe(11);

      const patterns = AI_CHAT_SITES.map((s) => s.hostPattern);
      expect(patterns).toEqual([
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
      ]);
    });
  });

  describe("isProtectionActiveForSite Storage & Toggle Independence", () => {
    it("defaults to active for all 11 domains when no toggles are set", async () => {
      for (const site of AI_CHAT_SITES) {
        expect(await isProtectionActiveForSite(site.domain)).toBe(true);
      }
    });

    it("toggling off deepseek.com does NOT deactivate chat.deepseek.com if chat is explicitly active", async () => {
      await updateSettings({
        siteToggles: {
          "deepseek.com": false,
          "chat.deepseek.com": true,
        },
      });

      expect(await isProtectionActiveForSite("chat.deepseek.com")).toBe(true);
      expect(await isProtectionActiveForSite("deepseek.com")).toBe(false);
    });

    it("toggling off chat.deepseek.com does NOT deactivate deepseek.com or www.deepseek.com", async () => {
      await updateSettings({
        siteToggles: {
          "chat.deepseek.com": false,
        },
      });

      expect(await isProtectionActiveForSite("chat.deepseek.com")).toBe(false);
      expect(await isProtectionActiveForSite("deepseek.com")).toBe(true);
      expect(await isProtectionActiveForSite("www.deepseek.com")).toBe(true);
    });

    it("toggling off www.deepseek.com deactivates only www without affecting chat or root", async () => {
      await updateSettings({
        siteToggles: {
          "www.deepseek.com": false,
        },
      });

      expect(await isProtectionActiveForSite("www.deepseek.com")).toBe(false);
      expect(await isProtectionActiveForSite("deepseek.com")).toBe(true);
      expect(await isProtectionActiveForSite("chat.deepseek.com")).toBe(true);
    });

    it("disabling master protection deactivates all sites immediately", async () => {
      await updateSettings({
        enabled: false,
      });

      for (const site of AI_CHAT_SITES) {
        expect(await isProtectionActiveForSite(site.domain)).toBe(false);
      }
    });
  });
});
