export interface GitHubRepoItem {
  id: number | string;
  name: string;
  fullName: string;
  url: string;
  description: string;
  stars: number;
  forks: number;
  language: string | null;
  author: string;
  avatarUrl: string;
  createdAt: string;
  source: "github";
}

export interface HackerNewsItem {
  id: number | string;
  title: string;
  url: string;
  hnUrl: string;
  score: number;
  commentsCount: number;
  by: string;
  time: number;
  source: "hackernews";
}

export interface DevToItem {
  id: number | string;
  title: string;
  url: string;
  description: string;
  reactionsCount: number;
  commentsCount: number;
  tags: string[];
  author: string;
  avatarUrl: string;
  publishedAt: string;
  readingTimeMinutes?: number;
  source: "devto";
}

export type TrendItem = GitHubRepoItem | HackerNewsItem | DevToItem;

export interface KeywordFrequency {
  keyword: string;
  count: number;
}

export interface TechTrendsResponse {
  github: GitHubRepoItem[];
  hackernews: HackerNewsItem[];
  devto: DevToItem[];
  keywords: KeywordFrequency[];
  updatedAt: string;
  isFallback?: boolean;
}
