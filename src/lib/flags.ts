/**
 * Feature flags. Flip a flag only when the feature genuinely works end to end.
 */

/**
 * AI Hub (/ai/*). Keep `false` until the tools call a real model with the visitor's own
 * API key (BYOK). While false the hub is: hidden from header/footer/command palette,
 * excluded from the sitemap, served with `noindex`, and marked "Coming soon" on every page.
 * The pages themselves are kept so they can be re-enabled by flipping this one value.
 */
export const AI_HUB_LIVE = false;

/** True for any path that belongs to the AI Hub. */
export function isAiHubPath(path: string): boolean {
  return path === "/ai" || path.startsWith("/ai/");
}
