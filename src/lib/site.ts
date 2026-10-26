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
  tagline: "Free Time & Timestamp Tools",
  description:
    "Free online Unix timestamp, epoch, ISO 8601 and time zone tools. The converters run in your browser: fast, private and no sign-up.",
  url: resolveSiteUrl(),
  locale: "en_US",
  themeColor: "#0B1020",
  /** Date used as `lastModified` in the sitemap. Update when content changes meaningfully. */
  contentUpdated: "2026-09-20",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "contact@castov.com",
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
