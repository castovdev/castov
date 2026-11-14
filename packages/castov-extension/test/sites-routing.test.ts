import { describe, it, expect, beforeEach } from "vitest";
import { isSupportedAISite, AI_CHAT_SITES } from "../src/config/sites";
import { isProtectionActiveForSite, updateSettings } from "../src/storage/counter";

describe("Castov Secret Shield - 7 Supported AI Chat Domains Routing & Storage Independence", () => {
  beforeEach(async () => {
    // Reset to default settings before each test
    await updateSettings({
      enabled: true,
      countingEnabled: true,
      siteToggles: {},
    });
  });

  describe("isSupportedAISite Domain Identification", () => {
    it("recognizes all 7 verified AI chat domains and URLs including subpaths", () => {
      expect(isSupportedAISite("chatgpt.com")).toBe(true);
      expect(isSupportedAISite("https://chatgpt.com/c/123")).toBe(true);
      expect(isSupportedAISite("chat.openai.com")).toBe(true);
      expect(isSupportedAISite("claude.ai")).toBe(true);
      expect(isSupportedAISite("gemini.google.com")).toBe(true);
      expect(isSupportedAISite("chat.deepseek.com")).toBe(true);
      expect(isSupportedAISite("https://chat.deepseek.com/chat/session-123")).toBe(true);
      expect(isSupportedAISite("www.perplexity.ai")).toBe(true);
      expect(isSupportedAISite("copilot.microsoft.com")).toBe(true);
    });

    it("strictly rejects non-chat root domains, spoofed, lookalike, or attacker domains", () => {
      expect(isSupportedAISite("malicious-chatgpt.com")).toBe(false);
      expect(isSupportedAISite("https://malicious-chatgpt.com/")).toBe(false);
      expect(isSupportedAISite("chatgpt.com.attacker.com")).toBe(false);
      expect(isSupportedAISite("https://claude.ai.attacker.com/")).toBe(false);
      expect(isSupportedAISite("example.com")).toBe(false);
    });

    it("verifies AI_CHAT_SITES configuration has exactly the 7 explicit AI chat domains", () => {
      expect(AI_CHAT_SITES.length).toBe(7);

      const patterns = AI_CHAT_SITES.map((s) => s.hostPattern);
      expect(patterns).toEqual([
        "*://chatgpt.com/*",
        "*://chat.openai.com/*",
        "*://claude.ai/*",
        "*://gemini.google.com/*",
        "*://chat.deepseek.com/*",
        "*://www.perplexity.ai/*",
        "*://copilot.microsoft.com/*",
      ]);
    });
  });

  describe("isProtectionActiveForSite Storage & Toggle Independence", () => {
    it("defaults to active for all 7 domains when no toggles are set", async () => {
      expect(await isProtectionActiveForSite("chatgpt.com")).toBe(true);
      expect(await isProtectionActiveForSite("chat.openai.com")).toBe(true);
      expect(await isProtectionActiveForSite("claude.ai")).toBe(true);
      expect(await isProtectionActiveForSite("gemini.google.com")).toBe(true);
      expect(await isProtectionActiveForSite("chat.deepseek.com")).toBe(true);
      expect(await isProtectionActiveForSite("www.perplexity.ai")).toBe(true);
      expect(await isProtectionActiveForSite("copilot.microsoft.com")).toBe(true);
    });

    it("toggling off one site does NOT deactivate other AI chat sites", async () => {
      await updateSettings({
        siteToggles: {
          "chat.deepseek.com": false,
          "chatgpt.com": true,
        },
      });

      expect(await isProtectionActiveForSite("chat.deepseek.com")).toBe(false);
      expect(await isProtectionActiveForSite("chatgpt.com")).toBe(true);
      expect(await isProtectionActiveForSite("claude.ai")).toBe(true);
    });

    it("disabling master protection deactivates all sites immediately", async () => {
      await updateSettings({
        enabled: false,
      });

      expect(await isProtectionActiveForSite("chatgpt.com")).toBe(false);
      expect(await isProtectionActiveForSite("claude.ai")).toBe(false);
      expect(await isProtectionActiveForSite("chat.deepseek.com")).toBe(false);
    });
  });
});
