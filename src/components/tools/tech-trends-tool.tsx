"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Star,
  GitFork,
  MessageSquare,
  Bookmark,
  ExternalLink,
  Flame,
  Radio,
  BookOpen,
  RefreshCw,
  Filter,
  Check,
  Share2,
} from "lucide-react";

function GithubIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
import {
  TechTrendsResponse,
  TrendItem,
} from "@/lib/tech-trends-types";
import {
  FALLBACK_GITHUB_REPOS,
  FALLBACK_HACKER_NEWS,
  FALLBACK_DEVTO_ARTICLES,
  extractTopKeywords,
} from "@/lib/tech-trends-fallback";

type TabType = "all" | "github" | "hackernews" | "devto" | "saved";

const POPULAR_LANGUAGES = ["All", "TypeScript", "Python", "Rust", "Go", "JavaScript"];

export function TechTrendsTool() {
  const [data, setData] = useState<TechTrendsResponse>({
    github: FALLBACK_GITHUB_REPOS,
    hackernews: FALLBACK_HACKER_NEWS,
    devto: FALLBACK_DEVTO_ARTICLES,
    keywords: extractTopKeywords(
      FALLBACK_GITHUB_REPOS,
      FALLBACK_HACKER_NEWS,
      FALLBACK_DEVTO_ARTICLES
    ),
    updatedAt: new Date().toISOString(),
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<Record<string, TrendItem>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem("castov_tech_trends_bookmarks");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch real-time trends from our internal cached API
  const fetchTrends = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tech-trends");
      if (res.ok) {
        const json: TechTrendsResponse = await res.json();
        setData(json);
      }
    } catch {
      // Keep fallback data on network failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/tech-trends")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: TechTrendsResponse | null) => {
        if (active && json) {
          setData(json);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Toggle bookmark in localStorage
  const toggleBookmark = (item: TrendItem) => {
    setSavedItems((prev) => {
      const key = `${item.source}-${item.id}`;
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = item;
      }
      try {
        localStorage.setItem("castov_tech_trends_bookmarks", JSON.stringify(next));
      } catch {
        // Ignored
      }
      return next;
    });
  };

  const isBookmarked = (item: TrendItem) => {
    const key = `${item.source}-${item.id}`;
    return !!savedItems[key];
  };

  const copyShareLink = async () => {
    try {
      if (typeof window !== "undefined" && navigator?.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  // Filtered lists
  const filteredGitHub = useMemo(() => {
    return data.github.filter((repo) => {
      if (selectedLanguage !== "All" && repo.language !== selectedLanguage) return false;
      if (selectedKeyword) {
        const kw = selectedKeyword.toLowerCase();
        const matchesKeyword =
          repo.name.toLowerCase().includes(kw) ||
          repo.description.toLowerCase().includes(kw) ||
          (repo.language && repo.language.toLowerCase().includes(kw));
        if (!matchesKeyword) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          repo.name.toLowerCase().includes(q) ||
          repo.description.toLowerCase().includes(q) ||
          repo.author.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data.github, selectedLanguage, selectedKeyword, searchQuery]);

  const filteredHackerNews = useMemo(() => {
    return data.hackernews.filter((hn) => {
      if (selectedKeyword) {
        const kw = selectedKeyword.toLowerCase();
        if (!hn.title.toLowerCase().includes(kw)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return hn.title.toLowerCase().includes(q) || hn.by.toLowerCase().includes(q);
      }
      return true;
    });
  }, [data.hackernews, selectedKeyword, searchQuery]);

  const filteredDevTo = useMemo(() => {
    return data.devto.filter((art) => {
      if (selectedKeyword) {
        const kw = selectedKeyword.toLowerCase();
        const matchesKeyword =
          art.title.toLowerCase().includes(kw) ||
          art.description.toLowerCase().includes(kw) ||
          art.tags.some((t) => t.toLowerCase().includes(kw));
        if (!matchesKeyword) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          art.title.toLowerCase().includes(q) ||
          art.description.toLowerCase().includes(q) ||
          art.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [data.devto, selectedKeyword, searchQuery]);

  const filteredSaved = useMemo(() => {
    const items = Object.values(savedItems);
    if (!searchQuery.trim() && !selectedKeyword) return items;
    return items.filter((item) => {
      const title =
        item.source === "github" ? item.name : item.title;
      const desc =
        item.source === "github" || item.source === "devto" ? item.description : "";
      if (selectedKeyword) {
        const kw = selectedKeyword.toLowerCase();
        if (!title.toLowerCase().includes(kw) && !desc.toLowerCase().includes(kw)) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return title.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
      }
      return true;
    });
  }, [savedItems, selectedKeyword, searchQuery]);

  const totalResultsCount =
    activeTab === "all"
      ? filteredGitHub.length + filteredHackerNews.length + filteredDevTo.length
      : activeTab === "github"
      ? filteredGitHub.length
      : activeTab === "hackernews"
      ? filteredHackerNews.length
      : activeTab === "devto"
      ? filteredDevTo.length
      : filteredSaved.length;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 1. Header Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-line shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-fg flex items-center gap-2">
              Tech Pulse Radar
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Live Stream
              </span>
            </h2>
            <p className="text-xs text-muted">
              Hourly aggregated trends from GitHub, Hacker News, and Dev.to
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={fetchTrends}
            disabled={loading}
            aria-label="Refresh trends"
            className="btn btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={copyShareLink}
            aria-label="Copy share link"
            className="btn btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Copied" : "Share"}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Mentioned Keywords Radar */}
      <div className="p-4 rounded-xl bg-field border border-line">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-accent" />
            Top Velocity Keywords Today
          </span>
          {selectedKeyword && (
            <button
              type="button"
              onClick={() => setSelectedKeyword(null)}
              className="text-xs text-accent hover:underline cursor-pointer"
            >
              Clear keyword filter
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {data.keywords.map(({ keyword, count }) => {
            const isSelected = selectedKeyword === keyword;
            return (
              <div key={keyword} className="inline-flex items-center rounded-full border border-line bg-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSelectedKeyword(isSelected ? null : keyword)}
                  className={`px-3 py-1 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-accent text-accent-fg"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  <span>#{keyword}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-accent-fg/20" : "bg-field text-muted"}`}>
                    {count}
                  </span>
                </button>
                <a
                  href={`/tech-trends/${encodeURIComponent(keyword.toLowerCase())}`}
                  title={`Open dedicated #${keyword} trend radar page`}
                  className="px-2 py-1 text-[10px] font-mono text-accent hover:bg-hover border-l border-line no-underline"
                >
                  ↗
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Navigation Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-field rounded-xl border border-line overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "all" ? "bg-card text-fg shadow-xs" : "text-muted hover:text-fg"
            }`}
          >
            <span>All Streams</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("github")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "github" ? "bg-card text-fg shadow-xs" : "text-muted hover:text-fg"
            }`}
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub ({filteredGitHub.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("hackernews")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "hackernews" ? "bg-card text-fg shadow-xs" : "text-muted hover:text-fg"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Hacker News ({filteredHackerNews.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("devto")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "devto" ? "bg-card text-fg shadow-xs" : "text-muted hover:text-fg"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Dev.to ({filteredDevTo.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "saved" ? "bg-card text-fg shadow-xs" : "text-muted hover:text-fg"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-accent" />
            <span>Saved ({Object.keys(savedItems).length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter trends, tags, authors..."
            aria-label="Filter trends"
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-card border border-line rounded-lg text-fg placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* GitHub Language Filter Bar (Visible on 'all' or 'github' tabs) */}
      {(activeTab === "all" || activeTab === "github") && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-muted flex items-center gap-1 shrink-0 font-medium">
            <Filter className="w-3 h-3" /> Language:
          </span>
          {POPULAR_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setSelectedLanguage(lang)}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                selectedLanguage === lang
                  ? "bg-accent/15 text-accent font-semibold border border-accent/30"
                  : "bg-field text-muted hover:text-fg border border-line"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      )}

      {/* 4. Results Section */}
      {totalResultsCount === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-line">
          <p className="text-sm font-semibold text-fg mb-1">No matching trends found</p>
          <p className="text-xs text-muted mb-4">
            Try adjusting your search query, language filter, or keyword badge.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedLanguage("All");
              setSelectedKeyword(null);
            }}
            className="btn btn-secondary btn-sm cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* A. GitHub Repos Section */}
          {(activeTab === "all" || activeTab === "github") && filteredGitHub.length > 0 && (
            <section aria-labelledby="section-github">
              <div className="flex items-center justify-between mb-3">
                <h3 id="section-github" className="text-sm font-bold text-fg flex items-center gap-2">
                  <GithubIcon className="w-4 h-4" />
                  Trending GitHub Repositories ({filteredGitHub.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGitHub.map((repo) => (
                  <article
                    key={`gh-${repo.id}`}
                    className="p-4 rounded-xl bg-card border border-line hover:border-accent/40 transition-all flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-sm text-fg hover:text-accent hover:underline line-clamp-1 flex items-center gap-1.5"
                        >
                          {repo.name}
                          <ExternalLink className="w-3 h-3 text-muted shrink-0" />
                        </a>
                        <button
                          type="button"
                          onClick={() => toggleBookmark(repo)}
                          aria-label={isBookmarked(repo) ? "Remove bookmark" : "Bookmark repository"}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isBookmarked(repo)
                              ? "bg-accent/15 text-accent"
                              : "text-muted hover:text-fg hover:bg-hover"
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked(repo) ? "fill-current" : ""}`} />
                        </button>
                      </div>

                      <p className="text-xs text-muted line-clamp-2 mb-4 leading-relaxed">
                        {repo.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-line/60 text-xs text-muted">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-medium text-amber-500">
                          <Star className="w-3 h-3 fill-current" />
                          {repo.stars.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="w-3 h-3" />
                          {repo.forks.toLocaleString()}
                        </span>
                      </div>
                      {repo.language && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-field border border-line">
                          {repo.language}
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* B. Hacker News Section */}
          {(activeTab === "all" || activeTab === "hackernews") && filteredHackerNews.length > 0 && (
            <section aria-labelledby="section-hn">
              <div className="flex items-center justify-between mb-3 mt-4">
                <h3 id="section-hn" className="text-sm font-bold text-fg flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Hacker News Discussions ({filteredHackerNews.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredHackerNews.map((hn) => (
                  <article
                    key={`hn-${hn.id}`}
                    className="p-4 rounded-xl bg-card border border-line hover:border-accent/40 transition-all flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <a
                          href={hn.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-sm text-fg hover:text-accent hover:underline leading-snug line-clamp-2"
                        >
                          {hn.title}
                        </a>
                        <button
                          type="button"
                          onClick={() => toggleBookmark(hn)}
                          aria-label={isBookmarked(hn) ? "Remove bookmark" : "Bookmark discussion"}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                            isBookmarked(hn)
                              ? "bg-accent/15 text-accent"
                              : "text-muted hover:text-fg hover:bg-hover"
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked(hn) ? "fill-current" : ""}`} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-line/60 text-xs text-muted">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-accent">
                          ▲ {hn.score} pts
                        </span>
                        <a
                          href={hn.hnUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-fg"
                        >
                          <MessageSquare className="w-3 h-3" />
                          {hn.commentsCount} comments
                        </a>
                      </div>
                      <span>by @{hn.by}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* C. Dev.to Articles Section */}
          {(activeTab === "all" || activeTab === "devto") && filteredDevTo.length > 0 && (
            <section aria-labelledby="section-devto">
              <div className="flex items-center justify-between mb-3 mt-4">
                <h3 id="section-devto" className="text-sm font-bold text-fg flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  Top Technical Reads on Dev.to ({filteredDevTo.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDevTo.map((art) => (
                  <article
                    key={`dev-${art.id}`}
                    className="p-4 rounded-xl bg-card border border-line hover:border-accent/40 transition-all flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <a
                          href={art.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-sm text-fg hover:text-accent hover:underline line-clamp-2"
                        >
                          {art.title}
                        </a>
                        <button
                          type="button"
                          onClick={() => toggleBookmark(art)}
                          aria-label={isBookmarked(art) ? "Remove bookmark" : "Bookmark article"}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                            isBookmarked(art)
                              ? "bg-accent/15 text-accent"
                              : "text-muted hover:text-fg hover:bg-hover"
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked(art) ? "fill-current" : ""}`} />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {art.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-field text-muted font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-line/60 text-xs text-muted">
                      <span>{art.author}</span>
                      <div className="flex items-center gap-2">
                        <span>❤️ {art.reactionsCount}</span>
                        <span>💬 {art.commentsCount}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* D. Saved Items View */}
          {activeTab === "saved" && (
            <section aria-labelledby="section-saved">
              <div className="flex items-center justify-between mb-3">
                <h3 id="section-saved" className="text-sm font-bold text-fg flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-accent fill-current" />
                  Your Saved Bookmarks ({filteredSaved.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSaved.map((item) => (
                  <article
                    key={`saved-${item.source}-${item.id}`}
                    className="p-4 rounded-xl bg-card border border-line shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-sm text-fg hover:text-accent hover:underline line-clamp-1"
                        >
                          {item.source === "github" ? item.name : item.title}
                        </a>
                        <button
                          type="button"
                          onClick={() => toggleBookmark(item)}
                          aria-label="Remove bookmark"
                          className="p-1.5 rounded-lg bg-accent/15 text-accent cursor-pointer"
                        >
                          <Bookmark className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                      <p className="text-xs text-muted line-clamp-2 mb-3">
                        {item.source === "github" || item.source === "devto" ? item.description : `Hacker News discussion by @${item.by}`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-line/60 text-xs text-muted">
                      <span className="uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-field border border-line">
                        {item.source}
                      </span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-fg font-medium"
                      >
                        Open original <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
