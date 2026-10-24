import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { TOOLS, toolPath } from "@/content/tools";
import { GUIDES } from "@/content/guides";
import { NAV_LINKS } from "@/components/nav-links";
import { LLM_MODELS } from "@/lib/llm-specs-registry";
import { CODE_CONVERTERS } from "@/lib/code-converters-registry";
import { REGEX_PATTERNS } from "@/lib/regex-patterns-registry";
import { ERROR_FIXES } from "@/lib/error-fixes-registry";
import { TIMEZONE_PAIRS } from "@/lib/timezone-pairs-registry";
import { NETWORK_PORTS } from "@/lib/network-ports-registry";
import sitemap from "@/app/sitemap";
import { SITE } from "@/lib/site";

const ROOT_DIR = process.cwd();
const APP_DIR = path.resolve(ROOT_DIR, "src", "app");

function getAppRoutes(dir = APP_DIR, baseRoute = ""): Set<string> {
  const routes = new Set<string>();
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

const fileSystemRoutes = getAppRoutes();

describe("Internal Links & SEO Route Integrity Suite", () => {
  it("all 61 tools have valid routes without double slashes", () => {
    expect(TOOLS.length).toBeGreaterThanOrEqual(61);
    for (const tool of TOOLS) {
      const p = toolPath(tool.slug);
      expect(p.startsWith("/")).toBe(true);
      expect(p).not.toContain("//");
      expect(tool.name.length).toBeGreaterThan(0);
      expect(tool.seoTitle.length).toBeGreaterThan(0);
    }
  });

  it("all guides reference valid related tools", () => {
    const toolSlugs = new Set(TOOLS.map((t) => t.slug));
    for (const guide of GUIDES) {
      if (guide.tools) {
        for (const slug of guide.tools) {
          expect(toolSlugs.has(slug as any)).toBe(true);
        }
      }
    }
  });

  it("all tools with guide reference point to existing guides", () => {
    const guideSlugs = new Set(GUIDES.map((g) => g.slug));
    for (const tool of TOOLS) {
      if (tool.guide) {
        expect(guideSlugs.has(tool.guide)).toBe(true);
      }
    }
  });

  it("all main navigation links point to existing static routes", () => {
    for (const link of NAV_LINKS) {
      expect(fileSystemRoutes.has(link.href)).toBe(true);
    }
  });

  it("LLM directory and model spec routes exist", () => {
    expect(fileSystemRoutes.has("/llm")).toBe(true);
    expect(fileSystemRoutes.has("/llm/[model]")).toBe(true);
    expect(LLM_MODELS.length).toBeGreaterThan(0);
    for (const model of LLM_MODELS) {
      expect(model.slug).toBeTruthy();
      expect(model.name).toBeTruthy();
    }
  });

  it("all pSEO registries have non-empty valid entries", () => {
    expect(CODE_CONVERTERS.length).toBeGreaterThan(0);
    expect(REGEX_PATTERNS.length).toBeGreaterThan(0);
    expect(ERROR_FIXES.length).toBeGreaterThan(0);
    expect(TIMEZONE_PAIRS.length).toBeGreaterThan(0);
    expect(NETWORK_PORTS.length).toBeGreaterThan(0);

    // Dynamic routes exist
    expect(fileSystemRoutes.has("/convert/[slug]")).toBe(true);
    expect(fileSystemRoutes.has("/regex-patterns/[slug]")).toBe(true);
    expect(fileSystemRoutes.has("/error-fixes/[slug]")).toBe(true);
    expect(fileSystemRoutes.has("/time/[pair]")).toBe(true);
    expect(fileSystemRoutes.has("/ports/[port]")).toBe(true);
  });

  it("sitemap contains no duplicate URLs and all URLs are canonical", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    const uniqueUrls = new Set(urls);

    expect(urls.length).toBe(uniqueUrls.size);
    for (const u of urls) {
      expect(u.startsWith(SITE.url)).toBe(true);
      expect(u).not.toMatch(/https?:\/\/[^/]+\/\//);
    }
  });
});
