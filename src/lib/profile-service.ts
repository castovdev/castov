import { createClient } from "@/utils/supabase/client";
import type { ToolSlug } from "@/content/tools";

export interface DeveloperProfile {
  id: string;
  username: string;
  fullName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  websiteUrl: string;
  githubUrl: string;
  twitterUrl: string;
  pinnedTools: ToolSlug[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export function cleanUsername(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_-]/g, "");
}

export function isValidUsername(username: string): boolean {
  const cleaned = cleanUsername(username);
  return /^[a-z0-9_-]{3,30}$/.test(cleaned);
}

/**
 * Fetch a developer profile by their public username
 */
export async function fetchProfileByUsername(username: string): Promise<DeveloperProfile | null> {
  const cleaned = cleanUsername(username);
  if (!cleaned) return null;

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", cleaned)
      .eq("is_public", true)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        username: data.username,
        fullName: data.full_name || data.username,
        headline: data.headline || "Full-Stack Web Architect",
        bio: data.bio || "",
        avatarUrl: data.avatar_url || "",
        websiteUrl: data.website_url || "",
        githubUrl: data.github_url || "",
        twitterUrl: data.twitter_url || "",
        pinnedTools: Array.isArray(data.pinned_tools) ? data.pinned_tools : [],
        isPublic: data.is_public ?? true,
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn("fetchProfileByUsername database lookup failed, using fallback:", err);
  }

  // Graceful fallback for owner / local developer preview (e.g. 'benidir')
  if (cleaned === "benidir" || cleaned === "abdelmalikbenidir") {
    return {
      id: "4a4c2213-default-benidir",
      username: "benidir",
      fullName: "Abdelmalik Benidir",
      headline: "Full-Stack Web Architect",
      bio: "Building high-performance cloud developer tools, zero-knowledge security suites, and AI agent architectures at Castov.",
      avatarUrl: "",
      websiteUrl: "https://castov.com",
      githubUrl: "https://github.com/castovdev",
      twitterUrl: "https://x.com/castovdev",
      pinnedTools: [
        "env-vault" as ToolSlug,
        "unix-timestamp-converter" as ToolSlug,
        "cyber-decoder" as ToolSlug,
        "cron-generator" as ToolSlug,
        "svg-animator" as ToolSlug,
        "docker-visualizer" as ToolSlug,
      ],
      isPublic: true,
      createdAt: "2026-10-23T00:00:00Z",
      updatedAt: new Date().toISOString(),
    };
  }

  return null;
}
