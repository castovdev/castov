/**
 * Castov Secret Shield - AI Chat Site Configurations
 *
 * SafePaste is strictly scoped to these 7 verified AI chat site origins.
 * Never match <all_urls> or unapproved external domains.
 */

export interface AISiteConfig {
  id: string;
  name: string;
  domain: string;
  hostPattern: string;
}

export const AI_CHAT_SITES: readonly AISiteConfig[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    domain: "chatgpt.com",
    hostPattern: "*://chatgpt.com/*",
  },
  {
    id: "chat_openai",
    name: "ChatGPT (Legacy)",
    domain: "chat.openai.com",
    hostPattern: "*://chat.openai.com/*",
  },
  {
    id: "claude",
    name: "Claude",
    domain: "claude.ai",
    hostPattern: "*://claude.ai/*",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    domain: "gemini.google.com",
    hostPattern: "*://gemini.google.com/*",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    domain: "chat.deepseek.com",
    hostPattern: "*://chat.deepseek.com/*",
  },
  {
    id: "deepseek_main",
    name: "DeepSeek (Web)",
    domain: "deepseek.com",
    hostPattern: "*://deepseek.com/*",
  },
  {
    id: "deepseek_www",
    name: "DeepSeek (WWW)",
    domain: "www.deepseek.com",
    hostPattern: "*://www.deepseek.com/*",
  },
  {
    id: "perplexity",
    name: "Perplexity AI",
    domain: "www.perplexity.ai",
    hostPattern: "*://www.perplexity.ai/*",
  },
  {
    id: "copilot",
    name: "Microsoft Copilot",
    domain: "copilot.microsoft.com",
    hostPattern: "*://copilot.microsoft.com/*",
  },
  {
    id: "copilot_cloud",
    name: "Microsoft Copilot (M365)",
    domain: "copilot.cloud.microsoft",
    hostPattern: "*://copilot.cloud.microsoft/*",
  },
  {
    id: "copilot_consumer",
    name: "Microsoft Copilot (Consumer)",
    domain: "copilot.com",
    hostPattern: "*://copilot.com/*",
  },
] as const;

export const SUPPORTED_DOMAINS: readonly string[] = AI_CHAT_SITES.map((s) => s.domain);

export const MANIFEST_HOST_PERMISSIONS: readonly string[] = AI_CHAT_SITES.map((s) => s.hostPattern);

/**
 * Checks whether a given hostname or URL matches any of the supported AI chat domains.
 */
export function isSupportedAISite(urlOrHostname: string): boolean {
  if (!urlOrHostname) return false;
  let hostname = urlOrHostname.toLowerCase();
  try {
    if (hostname.includes("://")) {
      hostname = new URL(hostname).hostname.toLowerCase();
    }
  } catch {
    // If not a valid URL string, keep hostname as-is
  }

  // Strip port if present
  hostname = hostname.split(":")[0];

  return SUPPORTED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}
