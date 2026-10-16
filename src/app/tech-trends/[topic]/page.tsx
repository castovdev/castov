import type { Metadata } from "next";
import Link from "next/link";
import {
  Flame,
  Star,
  GitFork,
  MessageSquare,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Radio,
  Code2,
} from "lucide-react";
import { TECH_TREND_TOPICS, getTechTrendTopic, TechTrendTopic } from "@/lib/tech-trends-registry";
import {
  FALLBACK_GITHUB_REPOS,
  FALLBACK_HACKER_NEWS,
  FALLBACK_DEVTO_ARTICLES,
} from "@/lib/tech-trends-fallback";
import { GitHubRepoItem, HackerNewsItem, DevToItem } from "@/lib/tech-trends-types";
import { buildMetadata, breadcrumbJsonLd, faqJsonLd, FaqItem } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

export const revalidate = 3600; // Refresh live trend pages hourly (ISR)
export const dynamicParams = true; // Allow any emerging keyword slug to generate a live SEO page on demand

export function generateStaticParams() {
  return TECH_TREND_TOPICS.map((t) => ({ topic: t.slug }));
}

function resolveTopicMeta(rawSlug: string): TechTrendTopic {
  const clean = decodeURIComponent(rawSlug).toLowerCase().trim();
  const known = getTechTrendTopic(clean);
  if (known) return known;

  const display = clean
    .split(/[-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    slug: clean,
    name: `${display} Developer Trends & Open Source`,
    category: "Web & Frameworks",
    githubQuery: clean,
    devtoTag: clean.replace(/[^a-z0-9]/g, ""),
    hnQuery: clean,
    tagline: `Real-time GitHub repositories, Hacker News discussions, and engineering articles for ${display}`,
    summary: `Track the fastest-growing open-source ${display} repositories on GitHub, top community discussions on Hacker News, and practical engineering tutorials on Dev.to.`,
    relatedToolPath: "/tools",
    relatedToolLabel: "Castov Developer Suite",
  };
}

async function fetchTopicGitHub(query: string): Promise<GitHubRepoItem[]> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const q = encodeURIComponent(`${query} pushed:>${thirtyDaysAgo}`);
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=9`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Castov-TechTrends-SEO/1.0",
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return FALLBACK_GITHUB_REPOS;
    const data = await res.json();
    if (!Array.isArray(data?.items) || data.items.length === 0) return FALLBACK_GITHUB_REPOS;
    return data.items.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      description: repo.description || "Open-source developer repository on GitHub.",
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      language: repo.language || null,
      author: repo.owner?.login || "developer",
      avatarUrl: repo.owner?.avatar_url || "",
      createdAt: repo.created_at,
      source: "github" as const,
    }));
  } catch {
    return FALLBACK_GITHUB_REPOS;
  }
}

async function fetchTopicDevTo(tag: string): Promise<DevToItem[]> {
  try {
    const cleanTag = encodeURIComponent(tag.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const res = await fetch(`https://dev.to/api/articles?tag=${cleanTag}&top=7&per_page=6`, {
      headers: { "User-Agent": "Castov-TechTrends-SEO/1.0" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return FALLBACK_DEVTO_ARTICLES;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return FALLBACK_DEVTO_ARTICLES;
    return data.map((a: any) => ({
      id: a.id,
      title: a.title,
      url: a.url,
      description: a.description || "",
      reactionsCount: a.public_reactions_count ?? a.positive_reactions_count ?? 0,
      commentsCount: a.comments_count ?? 0,
      tags: Array.isArray(a.tag_list) ? a.tag_list : [],
      author: a.user?.name || "Developer",
      avatarUrl: a.user?.profile_image_90 || "",
      publishedAt: a.published_at || new Date().toISOString(),
      readingTimeMinutes: a.reading_time_minutes ?? 5,
      source: "devto" as const,
    }));
  } catch {
    return FALLBACK_DEVTO_ARTICLES;
  }
}

async function fetchTopicHackerNews(query: string): Promise<HackerNewsItem[]> {
  try {
    const q = encodeURIComponent(query);
    const res = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${q}&tags=story&hitsPerPage=6`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return FALLBACK_HACKER_NEWS;
    const data = await res.json();
    if (!Array.isArray(data?.hits) || data.hits.length === 0) return FALLBACK_HACKER_NEWS;
    return data.hits.map((hit: any) => ({
      id: Number(hit.objectID) || 1,
      title: hit.title || "Hacker News Technical Discussion",
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      hnUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      score: hit.points ?? 0,
      commentsCount: hit.num_comments ?? 0,
      by: hit.author || "hn",
      time: hit.created_at_i || Math.floor(Date.now() / 1000),
      source: "hackernews" as const,
    }));
  } catch {
    return FALLBACK_HACKER_NEWS;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  const info = resolveTopicMeta(topic);

  return buildMetadata({
    title: `${info.name} – Trending GitHub Repos, Hacker News & Guides`,
    description: `${info.summary} Hourly updated ${info.name} velocity radar with top-starred GitHub repositories, Hacker News discussions, and developer tools.`,
    path: `/tech-trends/${info.slug}`,
  });
}

export default async function TechTrendTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const info = resolveTopicMeta(topic);

  const [repos, articles, hnStories] = await Promise.all([
    fetchTopicGitHub(info.githubQuery),
    fetchTopicDevTo(info.devtoTag),
    fetchTopicHackerNews(info.hnQuery),
  ]);

  const faqs: FaqItem[] = [
    {
      q: `How often is the ${info.name} trend radar updated?`,
      a: `Castov updates the ${info.name} radar every hour using Incremental Static Regeneration (ISR), aggregating active GitHub repositories, Hacker News discussions, and Dev.to engineering articles.`,
    },
    {
      q: `How are the top ${info.name} GitHub repositories ranked?`,
      a: `Repositories matching ${info.githubQuery} are filtered for recent commit activity and ranked by community star velocity and fork count.`,
    },
    {
      q: `What developer tool on Castov pairs best with ${info.name}?`,
      a: `We recommend using ${info.relatedToolLabel} (${info.relatedToolPath}) alongside our 100% client-side developer utilities.`,
    },
  ];

  const relatedTopics = TECH_TREND_TOPICS.filter((t) => t.slug !== info.slug).slice(0, 12);

  return (
    <div className="layout-content py-10 space-y-12">
      <JsonLd
        data={[
          breadcrumbJsonLd(
            [
              { name: "Home", href: "/" },
              { name: "Tech Pulse Radar", href: "/tech-trends" },
              { name: info.name },
            ],
            `/tech-trends/${info.slug}`
          ),
          faqJsonLd(faqs),
        ]}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-muted flex items-center gap-2">
        <Link href="/" className="hover:text-fg">Home</Link>
        <span>/</span>
        <Link href="/tech-trends" className="hover:text-fg">Tech Pulse Radar</Link>
        <span>/</span>
        <span className="text-fg font-semibold">#{info.slug}</span>
      </nav>

      {/* Hero Header */}
      <header className="space-y-4 border-b border-line pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
            <Flame className="w-3.5 h-3.5" /> Live Trend Topic • Hourly ISR
          </span>
          <span className="px-2.5 py-1 rounded-full bg-field border border-line text-xs font-mono text-muted">
            {info.category}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
          {info.name}: Live GitHub Trending &amp; Developer Pulse
        </h1>
        <p className="text-muted max-w-3xl text-sm sm:text-base leading-relaxed">
          {info.summary}
        </p>

        {/* Companion Castov Tool Banner */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link
            href={info.relatedToolPath}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-fg text-xs font-bold hover:opacity-95 transition-opacity no-underline"
          >
            <Code2 className="w-4 h-4" />
            <span>Open {info.relatedToolLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/tech-trends"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-line text-fg text-xs font-semibold hover:bg-hover transition-colors no-underline"
          >
            <Radio className="w-3.5 h-3.5 text-accent" />
            <span>Interactive All-Topics Radar</span>
          </Link>
        </div>
      </header>

      {/* 1. Trending GitHub Repositories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-fg flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Top Trending {info.name} Repositories on GitHub
          </h2>
          <span className="text-xs text-muted font-mono">Updated hourly</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {repos.map((repo) => (
            <a
              key={repo.id}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-5 rounded-2xl bg-card border border-line hover:border-accent/50 transition-all flex flex-col justify-between gap-4 no-underline"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono font-bold text-sm text-fg group-hover:text-accent break-all">
                    {repo.fullName}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted shrink-0 mt-1" />
                </div>
                <p className="text-xs text-muted line-clamp-3 leading-relaxed">
                  {repo.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-muted pt-3 border-t border-line/60 font-mono">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {repo.stars.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-3.5 h-3.5" />
                    {repo.forks.toLocaleString()}
                  </span>
                </div>
                {repo.language && (
                  <span className="px-2 py-0.5 rounded bg-field text-fg text-[11px]">
                    {repo.language}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 2. Hacker News Discussions */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-fg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-orange-500" />
          Hacker News Engineering Discussions on #{info.slug}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {hnStories.map((story) => (
            <a
              key={story.id}
              href={story.hnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl bg-card border border-line hover:border-accent/50 transition-all flex flex-col justify-between gap-3 no-underline"
            >
              <h3 className="text-sm font-semibold text-fg hover:text-accent leading-snug">
                {story.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-muted font-mono">
                <span>▲ {story.score} points • by {story.by}</span>
                <span>{story.commentsCount} comments →</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 3. Dev.to Technical Deep-Dives */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-fg flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-accent" />
          Community Articles &amp; Tutorials ({info.name})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {articles.map((art) => (
            <a
              key={art.id}
              href={art.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-2xl bg-card border border-line hover:border-accent/50 transition-all flex flex-col justify-between gap-3 no-underline"
            >
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-fg leading-snug line-clamp-2">
                  {art.title}
                </h3>
                <p className="text-xs text-muted line-clamp-2">{art.description}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-line/60">
                <span>{art.author}</span>
                <span className="font-mono">{art.readingTimeMinutes} min read • ♥ {art.reactionsCount}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 4. Explore Other Trend Hubs (Internal Linking Mesh) */}
      <section className="space-y-4 pt-6 border-t border-line">
        <h2 className="text-lg font-bold text-fg">Explore More Live Developer Trend Radars</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
          {relatedTopics.map((t) => (
            <Link
              key={t.slug}
              href={`/tech-trends/${t.slug}`}
              className="p-3 rounded-xl bg-card border border-line hover:border-accent/50 transition-colors flex flex-col gap-1 no-underline"
            >
              <span className="font-mono font-bold text-accent">#{t.slug}</span>
              <span className="text-muted truncate">{t.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. FAQ Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-fg">Frequently Asked Questions</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {faqs.map((f) => (
            <div key={f.q} className="p-4 rounded-xl bg-card border border-line space-y-1.5">
              <h3 className="text-sm font-bold text-fg">{f.q}</h3>
              <p className="text-xs text-muted leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
