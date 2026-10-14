import { GitHubRepoItem, HackerNewsItem, DevToItem, KeywordFrequency } from "./tech-trends-types";

export const FALLBACK_GITHUB_REPOS: GitHubRepoItem[] = [
  {
    id: 101,
    name: "agent-zero",
    fullName: "developer/agent-zero",
    url: "https://github.com/developer/agent-zero",
    description: "Personal and organic AI agent framework with autonomous execution and self-healing terminal tools.",
    stars: 8420,
    forks: 915,
    language: "Python",
    author: "developer",
    avatarUrl: "https://avatars.githubusercontent.com/u/101?v=4",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    source: "github",
  },
  {
    id: 102,
    name: "turbosql-wasm",
    fullName: "wasm-labs/turbosql-wasm",
    url: "https://github.com/wasm-labs/turbosql-wasm",
    description: "High-performance vector and relational engine compiled to WebAssembly with zero network overhead.",
    stars: 6180,
    forks: 432,
    language: "Rust",
    author: "wasm-labs",
    avatarUrl: "https://avatars.githubusercontent.com/u/102?v=4",
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    source: "github",
  },
  {
    id: 103,
    name: "next-react19-toolkit",
    fullName: "zeit-ecosystem/next-react19-toolkit",
    url: "https://github.com/zeit-ecosystem/next-react19-toolkit",
    description: "Production primitives for React 19 Actions, optimistic mutations, and Server Components in Next.js.",
    stars: 5210,
    forks: 380,
    language: "TypeScript",
    author: "zeit-ecosystem",
    avatarUrl: "https://avatars.githubusercontent.com/u/103?v=4",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    source: "github",
  },
  {
    id: 104,
    name: "hyper-route-go",
    fullName: "cloud-native/hyper-route-go",
    url: "https://github.com/cloud-native/hyper-route-go",
    description: "Ultra-low latency HTTP/3 and gRPC gateway engine built for zero-trust microservice meshes.",
    stars: 4890,
    forks: 310,
    language: "Go",
    author: "cloud-native",
    avatarUrl: "https://avatars.githubusercontent.com/u/104?v=4",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    source: "github",
  },
  {
    id: 105,
    name: "deep-rag-pipeline",
    fullName: "ai-systems/deep-rag-pipeline",
    url: "https://github.com/ai-systems/deep-rag-pipeline",
    description: "Hybrid dense & sparse embedding retrieval engine with reranking and context compression.",
    stars: 4350,
    forks: 512,
    language: "Python",
    author: "ai-systems",
    avatarUrl: "https://avatars.githubusercontent.com/u/105?v=4",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    source: "github",
  },
  {
    id: 106,
    name: "quantum-state-ts",
    fullName: "phys-dev/quantum-state-ts",
    url: "https://github.com/phys-dev/quantum-state-ts",
    description: "Client-side quantum gate simulator and Bloch sphere visualizer built with WebGL shaders.",
    stars: 3620,
    forks: 240,
    language: "TypeScript",
    author: "phys-dev",
    avatarUrl: "https://avatars.githubusercontent.com/u/106?v=4",
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    source: "github",
  },
];

export const FALLBACK_HACKER_NEWS: HackerNewsItem[] = [
  {
    id: 201,
    title: "Show HN: Castov – High-velocity client-first developer tools with zero telemetry",
    url: "https://castov.com",
    hnUrl: "https://news.ycombinator.com/item?id=201",
    score: 642,
    commentsCount: 184,
    by: "antigravity",
    time: Math.floor(Date.now() / 1000) - 7200,
    source: "hackernews",
  },
  {
    id: 202,
    title: "WebAssembly in 2026: Garbage Collection, Component Model, and Native Threading",
    url: "https://bytecodealliance.org/articles/wasm-2026-status",
    hnUrl: "https://news.ycombinator.com/item?id=202",
    score: 512,
    commentsCount: 129,
    by: "w3c_enthusiast",
    time: Math.floor(Date.now() / 1000) - 14400,
    source: "hackernews",
  },
  {
    id: 203,
    title: "Why we rewrote our high-throughput streaming pipeline from Go to Rust",
    url: "https://tech-blog.example.com/go-to-rust-pipeline",
    hnUrl: "https://news.ycombinator.com/item?id=203",
    score: 489,
    commentsCount: 295,
    by: "systems_architect",
    time: Math.floor(Date.now() / 1000) - 21600,
    source: "hackernews",
  },
  {
    id: 204,
    title: "PostgreSQL 18 introduces native vector indexing and adaptive query optimization",
    url: "https://www.postgresql.org/about/news/postgresql-18-update",
    hnUrl: "https://news.ycombinator.com/item?id=204",
    score: 398,
    commentsCount: 88,
    by: "db_guru",
    time: Math.floor(Date.now() / 1000) - 28800,
    source: "hackernews",
  },
  {
    id: 205,
    title: "Local-first software: Architectural patterns, CRDTs, and offline synchronization",
    url: "https://inkandswitch.com/local-first-patterns",
    hnUrl: "https://news.ycombinator.com/item?id=205",
    score: 375,
    commentsCount: 94,
    by: "crdt_dev",
    time: Math.floor(Date.now() / 1000) - 36000,
    source: "hackernews",
  },
];

export const FALLBACK_DEVTO_ARTICLES: DevToItem[] = [
  {
    id: 301,
    title: "Architecting Next.js 16 Applications with React 19 Server Actions and optimistic UI",
    url: "https://dev.to/fullstack/architecting-nextjs-16-with-react-19-actions",
    description: "Deep dive into real-world architectures using Server Functions, progressive enhancement, and cache invalidation.",
    reactionsCount: 840,
    commentsCount: 42,
    tags: ["nextjs", "react", "typescript", "webdev"],
    author: "Elena Rostova",
    avatarUrl: "https://dev.to/assets/user-default.png",
    publishedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    readingTimeMinutes: 7,
    source: "devto",
  },
  {
    id: 302,
    title: "Building Autonomous Agentic Workflows with TypeScript and Open Weights Models",
    url: "https://dev.to/ai_builder/building-autonomous-agentic-workflows",
    description: "How to orchestrate multi-step LLM agents with function calling, validation loops, and structured JSON outputs.",
    reactionsCount: 690,
    commentsCount: 38,
    tags: ["ai", "typescript", "llm", "opensource"],
    author: "Marcus Chen",
    avatarUrl: "https://dev.to/assets/user-default.png",
    publishedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    readingTimeMinutes: 9,
    source: "devto",
  },
  {
    id: 303,
    title: "Zero-Knowledge Proofs for Web Developers: A Practical Guide with WASM",
    url: "https://dev.to/crypto/zero-knowledge-proofs-for-web-devs",
    description: "Generate and verify cryptographic proofs directly in client-side JavaScript without compromising user identity.",
    reactionsCount: 520,
    commentsCount: 19,
    tags: ["security", "webassembly", "cryptography", "privacy"],
    author: "Sarah Lindqvist",
    avatarUrl: "https://dev.to/assets/user-default.png",
    publishedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    readingTimeMinutes: 11,
    source: "devto",
  },
  {
    id: 304,
    title: "Mastering Docker Multi-Stage Builds and Distroless Images for Microservices",
    url: "https://dev.to/devops/mastering-docker-multistage-builds",
    description: "Reduce container attack surface and cut image sizes by 85% using modern buildkit cache mounts and distroless bases.",
    reactionsCount: 480,
    commentsCount: 27,
    tags: ["docker", "devops", "cloud", "security"],
    author: "Omar Farooq",
    avatarUrl: "https://dev.to/assets/user-default.png",
    publishedAt: new Date(Date.now() - 30 * 3600000).toISOString(),
    readingTimeMinutes: 6,
    source: "devto",
  },
];

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "are", "you", "your",
  "what", "why", "how", "into", "using", "built", "show", "our", "all", "out",
  "more", "when", "about", "guide", "tools", "deep", "high", "new", "over",
  "without", "zero", "first", "real", "practical", "dive", "full", "status"
]);

const TECH_LEXICON = new Set([
  "ai", "llm", "rust", "python", "typescript", "javascript", "react", "nextjs",
  "go", "golang", "webassembly", "wasm", "docker", "agent", "agents", "crdt",
  "postgresql", "postgres", "sql", "sqlite", "vector", "rag", "security",
  "crypto", "cryptography", "cloud", "devops", "microservices", "kubernetes",
  "api", "graphql", "tailwind", "linux", "git", "web3", "performance"
]);

/**
 * Extracts and ranks tech keywords from titles, descriptions, and tags.
 */
export function extractTopKeywords(
  github: GitHubRepoItem[],
  hackernews: HackerNewsItem[],
  devto: DevToItem[],
  maxKeywords = 12
): KeywordFrequency[] {
  const counts: Record<string, number> = {};

  const processText = (text: string) => {
    if (!text) return;
    const tokens = text
      .toLowerCase()
      .replace(/[^a-z0-9#+.-]/g, " ")
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);

    for (const token of tokens) {
      const normalized = token.replace(/^[.-]+|[.-]+$/g, "");
      if (STOPWORDS.has(normalized)) continue;
      if (TECH_LEXICON.has(normalized) || normalized.length >= 3) {
        counts[normalized] = (counts[normalized] || 0) + 1;
      }
    }
  };

  github.forEach((g) => {
    processText(g.name);
    processText(g.description);
    if (g.language) processText(g.language);
  });

  hackernews.forEach((h) => {
    processText(h.title);
  });

  devto.forEach((d) => {
    processText(d.title);
    processText(d.description);
    d.tags.forEach((t) => processText(t));
  });

  return Object.entries(counts)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxKeywords);
}
