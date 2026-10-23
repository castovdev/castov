import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { SITE } from "@/lib/site";
import { GET as getChmodSitemap } from "@/app/sitemap-chmod.xml/route";
import { GET as getCompareSitemap } from "@/app/sitemap-compare.xml/route";
import { GET as getCronSitemap } from "@/app/sitemap-cron.xml/route";
import { GET as getHttpStatusSitemap } from "@/app/sitemap-http-status.xml/route";
import { GET as getNpmSitemap } from "@/app/sitemap-npm.xml/route";
import { GET as getUnixSitemap } from "@/app/sitemap-unix.xml/route";

describe("Sitemap Integrity & Verification", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("does not include noindex /canvas page in sitemap", () => {
    expect(urls).not.toContain(`${SITE.url}/canvas`);
  });

  it("includes all public hub pages with canonical host and no double slashes", () => {
    const requiredPages = [
      SITE.url,
      `${SITE.url}/tools`,
      `${SITE.url}/guides`,
      `${SITE.url}/cli`,
      `${SITE.url}/extension`,
      `${SITE.url}/cheatsheets`,
      `${SITE.url}/http-status`,
      `${SITE.url}/cron`,
      `${SITE.url}/resources`,
      `${SITE.url}/code`,
      `${SITE.url}/convert`,
      `${SITE.url}/chrono-db`,
      `${SITE.url}/webhook-tester`,
    ];

    for (const page of requiredPages) {
      expect(urls).toContain(page);
    }

    for (const u of urls) {
      expect(u.startsWith(SITE.url)).toBe(true);
      expect(u).not.toMatch(/https?:\/\/[^/]+\/\//); // No double slashes after host
    }
  });

  it("contains zero duplicate URLs", () => {
    const unique = new Set(urls);
    expect(unique.size).toBe(urls.length);
  });

  it("robots.txt has unified rules and references all seven sitemaps with canonical host", () => {
    const r = robots();
    expect(r.host).toBe(SITE.url);
    const sitemaps = Array.isArray(r.sitemap) ? r.sitemap : [r.sitemap];
    expect(sitemaps).toHaveLength(7);
    for (const s of sitemaps) {
      expect(s).toBeDefined();
      expect(s!.startsWith(SITE.url)).toBe(true);
      expect(s!).toMatch(/^https:\/\/www\.castov\.com\/sitemap.*\.xml$/);
    }
  });

  it("verifies all six XML route handlers return valid XML with canonical host", async () => {
    const handlers = [
      { name: "chmod", fn: getChmodSitemap },
      { name: "compare", fn: getCompareSitemap },
      { name: "cron", fn: getCronSitemap },
      { name: "http-status", fn: getHttpStatusSitemap },
      { name: "npm", fn: getNpmSitemap },
      { name: "unix", fn: getUnixSitemap },
    ];

    for (const { name, fn } of handlers) {
      const res = await fn();
      expect(res.status, `Sitemap ${name} should return 200`).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("xml");
      const text = await res.text();
      expect(text, `Sitemap ${name} XML declaration`).toContain('<?xml version="1.0"');
      expect(text, `Sitemap ${name} schema`).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
      expect(text, `Sitemap ${name} contains loc`).toContain("<loc>");
      expect(text, `Sitemap ${name} uses canonical host`).toContain(`<loc>${SITE.url}`);
      expect(text, `Sitemap ${name} has no double slashes`).not.toMatch(/<loc>https?:\/\/[^/]+\/\//);
    }
  });
});
