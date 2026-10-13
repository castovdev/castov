import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";

describe("Sitemap Integrity & Verification", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("does not include noindex /canvas page in sitemap", () => {
    expect(urls).not.toContain("https://castov.com/canvas");
  });

  it("includes all public hub pages", () => {
    const requiredPages = [
      "https://castov.com",
      "https://castov.com/tools",
      "https://castov.com/guides",
      "https://castov.com/cli",
      "https://castov.com/extension",
      "https://castov.com/cheatsheets",
      "https://castov.com/http-status",
      "https://castov.com/cron",
      "https://castov.com/resources",
      "https://castov.com/code",
      "https://castov.com/convert",
      "https://castov.com/chrono-db",
      "https://castov.com/webhook-tester",
    ];

    for (const page of requiredPages) {
      expect(urls).toContain(page);
    }
  });

  it("contains zero duplicate URLs", () => {
    const unique = new Set(urls);
    expect(unique.size).toBe(urls.length);
  });
});
