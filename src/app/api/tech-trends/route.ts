import { NextResponse } from "next/server";
import {
  FALLBACK_GITHUB_REPOS,
  FALLBACK_HACKER_NEWS,
  FALLBACK_DEVTO_ARTICLES,
  extractTopKeywords,
} from "@/lib/tech-trends-fallback";
import {
  GitHubRepoItem,
  HackerNewsItem,
  DevToItem,
  TechTrendsResponse,
} from "@/lib/tech-trends-types";

export const revalidate = 3600; // Cache on server for 1 hour

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 4500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

async function fetchGitHubTrending(): Promise<GitHubRepoItem[]> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const url = `https://api.github.com/search/repositories?q=created:>${sevenDaysAgo}&sort=stars&order=desc&per_page=25`;
    const res = await fetchWithTimeout(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Castov-TechTrends-Engine/1.0",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return FALLBACK_GITHUB_REPOS;
    }

    const data = await res.json();
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return FALLBACK_GITHUB_REPOS;
    }

    return data.items.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      description: repo.description || "No description provided.",
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      language: repo.language || null,
      author: repo.owner?.login || "unknown",
      avatarUrl: repo.owner?.avatar_url || "https://avatars.githubusercontent.com/u/0?v=4",
      createdAt: repo.created_at,
      source: "github" as const,
    }));
  } catch {
    return FALLBACK_GITHUB_REPOS;
  }
}

async function fetchHackerNewsTrending(): Promise<HackerNewsItem[]> {
  try {
    const res = await fetchWithTimeout(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
      { next: { revalidate: 1800 } }
    );

    if (!res.ok) {
      return FALLBACK_HACKER_NEWS;
    }

    const topIds: number[] = await res.json();
    if (!Array.isArray(topIds) || topIds.length === 0) {
      return FALLBACK_HACKER_NEWS;
    }

    // Limit to top 20 items for fast resolution
    const targetIds = topIds.slice(0, 20);
    const itemPromises = targetIds.map(async (id) => {
      try {
        const itemRes = await fetchWithTimeout(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
          { next: { revalidate: 1800 } }
        );
        if (!itemRes.ok) return null;
        return await itemRes.json();
      } catch {
        return null;
      }
    });

    const items = await Promise.all(itemPromises);
    const validItems: HackerNewsItem[] = items
      .filter((item) => item && item.title && !item.deleted && !item.dead)
      .map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
        hnUrl: `https://news.ycombinator.com/item?id=${item.id}`,
        score: item.score ?? 0,
        commentsCount: item.descendants ?? 0,
        by: item.by || "anonymous",
        time: item.time,
        source: "hackernews" as const,
      }));

    return validItems.length > 0 ? validItems : FALLBACK_HACKER_NEWS;
  } catch {
    return FALLBACK_HACKER_NEWS;
  }
}

async function fetchDevToArticles(): Promise<DevToItem[]> {
  try {
    const res = await fetchWithTimeout(
      "https://dev.to/api/articles?top=1&per_page=25",
      {
        headers: {
          "User-Agent": "Castov-TechTrends-Engine/1.0",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      return FALLBACK_DEVTO_ARTICLES;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return FALLBACK_DEVTO_ARTICLES;
    }

    return data.map((article: any) => ({
      id: article.id,
      title: article.title,
      url: article.url,
      description: article.description || "",
      reactionsCount: article.public_reactions_count ?? article.positive_reactions_count ?? 0,
      commentsCount: article.comments_count ?? 0,
      tags: Array.isArray(article.tag_list)
        ? article.tag_list
        : typeof article.tags === "string"
        ? article.tags.split(",").map((t: string) => t.trim())
        : [],
      author: article.user?.name || article.user?.username || "Dev Author",
      avatarUrl: article.user?.profile_image_90 || article.user?.profile_image || "https://dev.to/assets/user-default.png",
      publishedAt: article.published_at || new Date().toISOString(),
      readingTimeMinutes: article.reading_time_minutes ?? 5,
      source: "devto" as const,
    }));
  } catch {
    return FALLBACK_DEVTO_ARTICLES;
  }
}

export async function GET() {
  const [github, hackernews, devto] = await Promise.all([
    fetchGitHubTrending(),
    fetchHackerNewsTrending(),
    fetchDevToArticles(),
  ]);

  const isFallback =
    github === FALLBACK_GITHUB_REPOS &&
    hackernews === FALLBACK_HACKER_NEWS &&
    devto === FALLBACK_DEVTO_ARTICLES;

  const keywords = extractTopKeywords(github, hackernews, devto);

  const payload: TechTrendsResponse = {
    github,
    hackernews,
    devto,
    keywords,
    updatedAt: new Date().toISOString(),
    isFallback,
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
