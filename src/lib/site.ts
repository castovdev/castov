/**
 * Site-wide configuration. Only PUBLIC values live here (NEXT_PUBLIC_*): they are inlined into
 * the client bundle by design, so never put secrets in them.
 */
export const isProduction = process.env.NODE_ENV === "production";

/** Resolved once. In production the value must come from NEXT_PUBLIC_SITE_URL (see scripts/check-env.mjs). */
function resolveSiteUrl(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const raw = value || "https://castov.com";
  return raw.replace(/\/+$/, "");
}

export const SITE = {
  name: "Castov",
  tagline: "Developer tools, CLI & MCP server",
  description:
    "Free developer tools for your browser, terminal and AI editors: JSON, JWT, cron and timestamp utilities, plus a CLI and MCP server for Cursor and Claude.",
  url: resolveSiteUrl(),
  locale: "en_US",
  themeColor: "#0B1020",
  mcpToolCount: 13,
  webToolCount: 61,
  logo: "https://castov.com/logo-512.png",
  /** Date used as `lastModified` in the sitemap. Update when content changes meaningfully. */
  contentUpdated: "2026-11-09",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "contact@castov.com",
  sameAs: [
    "https://github.com/castovdev/castov",
    "https://x.com/castovdev",
    "https://www.npmjs.com/package/castov",
    "https://hub.docker.com/r/castovdev/castov",
    "https://marketplace.visualstudio.com/items?itemName=Castov.mcp-security-castov",
    "https://addons.mozilla.org/en-US/firefox/addon/castov-secret-shield/",
    "https://instagram.com/castovdev",
  ],
} as const;

export function absoluteUrl(path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? SITE.url : `${SITE.url}${clean}`;
}

export const ADS = {
  client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ?? "",
  slots: {
    "tool-top": process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL_TOP?.trim() ?? "",
    "content-middle": process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT_MIDDLE?.trim() ?? "",
    "content-bottom": process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT_BOTTOM?.trim() ?? "",
  },
} as const;

export type AdPlacement = keyof typeof ADS.slots;