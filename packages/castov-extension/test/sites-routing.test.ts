import { describe, it, expect, beforeEach } from "vitest";
import { isSupportedAISite, AI_CHAT_SITES } from "../src/config/sites";
import { isProtectionActiveForSite, updateSettings } from "../src/storage/counter";

describe("Castov Secret Shield - DeepSeek Three Domains Routing & Storage Independence", () => {
  beforeEach(async () => {
    // Reset to default settings before each test
    await updateSettings({
      enabled: true,
      countingEnabled: true,
      siteToggles: {},
    });
  });

  describe("isSupportedAISite Domain Identification", () => {
    it("recognizes all three DeepSeek domains and URLs including subpaths", () => {
      // 1. chat.deepseek.com
      expect(isSupportedAISite("chat.deepseek.com")).toBe(true);
      expect(isSupportedAISite("https://chat.deepseek.com/")).toBe(true);
      expect(isSupportedAISite("https://chat.deepseek.com/chat/session-123")).toBe(true);

      // 2. deepseek.com
      expect(isSupportedAISite("deepseek.com")).toBe(true);
      expect(isSupportedAISite("https://deepseek.com/")).toBe(true);
      expect(isSupportedAISite("https://deepseek.com/en/")).toBe(true);

      // 3. www.deepseek.com (user target URL)
      expect(isSupportedAISite("www.deepseek.com")).toBe(true);
      expect(isSupportedAISite("https://www.deepseek.com/")).toBe(true);
      expect(isSupportedAISite("https://www.deepseek.com/en/")).toBe(true);
      expect(isSupportedAISite("https://www.deepseek.com:443/zh/")).toBe(true);
    });

    it("strictly rejects spoofed, lookalike, or attacker domains", () => {
      expect(isSupportedAISite("malicious-deepseek.com")).toBe(false);
      expect(isSupportedAISite("https://malicious-deepseek.com/")).toBe(false);
      expect(isSupportedAISite("deepseek.com.attacker.com")).toBe(false);
      expect(isSupportedAISite("https://deepseek.com.attacker.com/")).toBe(false);
      expect(isSupportedAISite("notdeepseek.com")).toBe(false);
    });

    it("verifies AI_CHAT_SITES configuration has unique IDs and domains for DeepSeek", () => {
      const deepseekEntries = AI_CHAT_SITES.filter((s) => s.domain.includes("deepseek.com"));
      expect(deepseekEntries.length).toBe(3);

      const ids = deepseekEntries.map((s) => s.id);
      expect(ids).toEqual(["deepseek", "deepseek_main", "deepseek_www"]);

      const patterns = deepseekEntries.map((s) => s.hostPattern);
      expect(patterns).toEqual([
        "*://chat.deepseek.com/*",
        "*://deepseek.com/*",
        "*://www.deepseek.com/*",
      ]);
    });
  });

  describe("isProtectionActiveForSite Storage & Toggle Independence", () => {
    it("defaults to active for all three domains when no toggles are set", async () => {
      expect(await isProtectionActiveForSite("chat.deepseek.com")).toBe(true);
      expect(await isProtectionActiveForSite("deepseek.com")).toBe(true);
      expect(await isProtectionActiveForSite("www.deepseek.com")).toBe(true);
    });

    it("toggling off deepseek.com does NOT deactivate chat.deepseek.com if chat is explicitly active", async () => {
      await updateSettings({
        siteToggles: {
          "deepseek.com": false,
          "chat.deepseek.com": true,
        },
      });

      // chat.deepseek.com must remain active due to exact-match priority
      expect(await isProtectionActiveForSite("chat.deepseek.com")).toBe(true);
      // deepseek.com is deactivated
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

      expect(await isProtectionActiveForSite("chat.deepseek.com")).toBe(false);
      expect(await isProtectionActiveForSite("deepseek.com")).toBe(false);
      expect(await isProtectionActiveForSite("www.deepseek.com")).toBe(false);
    });
  });
});
