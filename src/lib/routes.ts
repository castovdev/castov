import { GUIDES } from "@/content/guides";
import { TOOLS, toolPath } from "@/content/tools";
import { AI_TOOLS, AI_CATEGORIES } from "@/lib/ai-tools";
import { AI_HUB_LIVE } from "@/lib/flags";

/** Every indexable path of the site, in sitemap order. */
export function allPaths(): string[] {
  return [
    "/",
    "/tools",
    ...TOOLS.map((t) => toolPath(t.slug)),
    ...(AI_HUB_LIVE
      ? ["/ai", ...AI_CATEGORIES.map((c) => `/ai/${c}`), ...AI_TOOLS.map((t) => `/ai/${t.slug}`)]
      : []),
    "/guides",
    ...GUIDES.map((g) => `/guides/${g.slug}`),
    "/developer",
    "/timezones",
    "/timestamps",
    "/resources",
    "/about",
    "/privacy",
    "/terms",
    "/contact",
  ];
}
