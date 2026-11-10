/**
 * Castov Engineering Blog — 301 Permanent Redirect Registry
 * Maps 95 legacy/retired programmatic slugs to the 5 canonical cornerstone pillar guides.
 * Preserves 100% of link equity, backlink authority, and search engine crawl history.
 */

export const BLOG_PILLAR_SLUGS = [
  "model-context-protocol-mcp-deep-dive",
  "preventing-env-secret-leaks-git-hooks",
  "jwt-decoding-signature-verification-locally",
  "cidr-subnetting-and-ip-mask-calculation",
  "unix-timestamps-and-millisecond-precision",
] as const;

export type BlogPillarSlug = (typeof BLOG_PILLAR_SLUGS)[number];

export const BLOG_LEGACY_REDIRECTS: Record<string, BlogPillarSlug> = {
  // --- Mapped to Pillar 1: Model Context Protocol (MCP) in Production ---
  "running-local-llms-webgpu-transformersjs": "model-context-protocol-mcp-deep-dive",
  "building-autonomous-desktop-agents-windows": "model-context-protocol-mcp-deep-dive",
  "zero-telemetry-ai-privacy-architecture": "model-context-protocol-mcp-deep-dive",
  "multi-agent-orchestration-local-workstations": "model-context-protocol-mcp-deep-dive",
  "offline-embeddings-vector-search-browser": "model-context-protocol-mcp-deep-dive",
  "sandboxing-code-execution-ai-workflows": "model-context-protocol-mcp-deep-dive",
  "function-calling-security-desktop-agents": "model-context-protocol-mcp-deep-dive",
  "ai-context-window-optimization-prompt-caching": "model-context-protocol-mcp-deep-dive",
  "evaluating-local-slms-vs-cloud-llms-benchmarks": "model-context-protocol-mcp-deep-dive",
  "ai-code-generation-guardrails-syntactic-validation": "model-context-protocol-mcp-deep-dive",
  "prompt-injection-defenses-autonomous-desktop-agents": "model-context-protocol-mcp-deep-dive",
  "fine-tuning-embedding-models-technical-codebases": "model-context-protocol-mcp-deep-dive",
  "hybrid-search-sparse-dense-retrieval-desktop": "model-context-protocol-mcp-deep-dive",
  "synthetic-data-generation-privacy-safe-testing": "model-context-protocol-mcp-deep-dive",
  "ai-agent-memory-architectures-sqlite-vec": "model-context-protocol-mcp-deep-dive",
  "native-messaging-host-browser-extensions-rust": "model-context-protocol-mcp-deep-dive",
  "windows-desktop-automation-ui-automation-powershell": "model-context-protocol-mcp-deep-dive",
  "hyper-v-isolated-sandboxes-untrusted-code-windows": "model-context-protocol-mcp-deep-dive",
  "windows-file-system-watcher-readdirectorychangesw-node": "model-context-protocol-mcp-deep-dive",
  "packaging-node-cli-single-executable-applications-windows": "model-context-protocol-mcp-deep-dive",
  "windows-named-pipes-ipc-interprocess-communication": "model-context-protocol-mcp-deep-dive",
  "automating-developer-workstation-setup-winget-dsc": "model-context-protocol-mcp-deep-dive",
  "powershell-7-core-high-performance-scripting-engineers": "model-context-protocol-mcp-deep-dive",
  "windows-registry-keys-developer-tooling-automation": "model-context-protocol-mcp-deep-dive",
  "building-windows-tray-applications-rust-node": "model-context-protocol-mcp-deep-dive",
  "local-first-software-architecture-crdts-sqlite": "model-context-protocol-mcp-deep-dive",
  "git-internals-objects-trees-commits-visualized": "model-context-protocol-mcp-deep-dive",
  "building-terminal-uis-tui-ink-react-node": "model-context-protocol-mcp-deep-dive",
  "web-workers-heavy-computations-responsive-uis": "model-context-protocol-mcp-deep-dive",
  "browser-indexeddb-large-scale-offline-storage": "model-context-protocol-mcp-deep-dive",
  "monorepo-tooling-turborepo-npm-workspaces-benchmarks": "model-context-protocol-mcp-deep-dive",
  "cross-platform-path-normalization-posix-windows": "model-context-protocol-mcp-deep-dive",
  "building-cli-command-palette-raycast-alfred-style": "model-context-protocol-mcp-deep-dive",
  "zero-dependency-typescript-libraries-benefits": "model-context-protocol-mcp-deep-dive",
  "terminal-ansi-escape-codes-formatting-colors": "model-context-protocol-mcp-deep-dive",
  "webassembly-simd-accelerating-in-browser-algorithms": "model-context-protocol-mcp-deep-dive",
  "developer-ergonomics-modern-command-line-interfaces": "model-context-protocol-mcp-deep-dive",
  "local-sqlite-vs-browser-localstorage-large-datasets": "model-context-protocol-mcp-deep-dive",
  "building-offline-first-pwa-service-workers-cache": "model-context-protocol-mcp-deep-dive",
  "static-code-analysis-ast-parsing-babel-swc": "model-context-protocol-mcp-deep-dive",
  "nextjs-server-actions-vs-api-routes-security": "model-context-protocol-mcp-deep-dive",
  "optimizing-nextjs-bundle-size-tree-shaking": "model-context-protocol-mcp-deep-dive",
  "core-web-vitals-inp-optimizations-react": "model-context-protocol-mcp-deep-dive",
  "react-server-components-data-fetching-patterns": "model-context-protocol-mcp-deep-dive",
  "tailwind-css-v4-performance-oxide-engine": "model-context-protocol-mcp-deep-dive",
  "svg-rendering-optimization-complex-interactive-graphics": "model-context-protocol-mcp-deep-dive",
  "nextjs-static-site-generation-thousands-pages": "model-context-protocol-mcp-deep-dive",
  "webassembly-compiling-rust-browser-modules-wasm": "model-context-protocol-mcp-deep-dive",

  // --- Mapped to Pillar 2: In-Memory Secret Scanning ---
  "ai-code-review-without-telemetry-leakage": "preventing-env-secret-leaks-git-hooks",
  "zero-knowledge-architecture-engineering-teams": "preventing-env-secret-leaks-git-hooks",
  "securing-github-actions-ci-cd-secrets": "preventing-env-secret-leaks-git-hooks",
  "detecting-secret-entropy-config-files": "preventing-env-secret-leaks-git-hooks",
  "zero-downtime-api-key-rotation-strategies": "preventing-env-secret-leaks-git-hooks",
  "securing-env-files-multi-stage-docker-builds": "preventing-env-secret-leaks-git-hooks",
  "content-security-policy-csp-nonces-hashes-nextjs": "preventing-env-secret-leaks-git-hooks",
  "subresource-integrity-sri-dynamic-scripts-bundlers": "preventing-env-secret-leaks-git-hooks",
  "cross-site-scripting-xss-prevention-react-modern-dom": "preventing-env-secret-leaks-git-hooks",
  "ssrf-prevention-architectures-cloud-microservices": "preventing-env-secret-leaks-git-hooks",
  "dependency-confusion-attacks-private-registries": "preventing-env-secret-leaks-git-hooks",
  "secure-cookie-attributes-samesite-secure-httponly": "preventing-env-secret-leaks-git-hooks",
  "securing-internal-developer-dashboards-zero-trust": "preventing-env-secret-leaks-git-hooks",

  // --- Mapped to Pillar 3: JWT Security & Claims Auditing ---
  "webhook-hmac-signature-verification-guide": "jwt-decoding-signature-verification-locally",
  "timing-safe-string-comparison-crypto": "jwt-decoding-signature-verification-locally",
  "sanitizing-har-files-removing-sensitive-tokens": "jwt-decoding-signature-verification-locally",
  "api-rate-limiting-algorithms-compared": "jwt-decoding-signature-verification-locally",
  "server-sent-events-sse-vs-websockets-streaming": "jwt-decoding-signature-verification-locally",
  "sqlite-wal-mode-high-concurrency-embedded-databases": "jwt-decoding-signature-verification-locally",
  "postgresql-jsonb-indexing-query-optimization": "jwt-decoding-signature-verification-locally",
  "database-connection-pooling-pgbouncer-prisma": "jwt-decoding-signature-verification-locally",
  "redis-caching-patterns-cache-aside-write-through": "jwt-decoding-signature-verification-locally",
  "zero-downtime-database-migrations-locks": "jwt-decoding-signature-verification-locally",
  "indexeddb-performance-benchmarks-large-blobs": "jwt-decoding-signature-verification-locally",
  "database-sharding-vs-partitioning-architectures": "jwt-decoding-signature-verification-locally",
  "sql-query-execution-plans-explain-analyze": "jwt-decoding-signature-verification-locally",
  "embedded-key-value-stores-rocksdb-lmdb-node": "jwt-decoding-signature-verification-locally",
  "vector-database-indexing-hnsw-vs-ivfflat": "jwt-decoding-signature-verification-locally",

  // --- Mapped to Pillar 4: IPv4 Subnetting & CIDR Calculations ---
  "wsl2-networking-port-forwarding-guide": "cidr-subnetting-and-ip-mask-calculation",
  "win32-event-tracing-etw-developer-diagnostics": "cidr-subnetting-and-ip-mask-calculation",
  "idempotent-api-design-idempotency-keys": "cidr-subnetting-and-ip-mask-calculation",
  "grpc-vs-rest-performance-benchmarks": "cidr-subnetting-and-ip-mask-calculation",
  "rest-api-versioning-strategies-url-headers-content": "cidr-subnetting-and-ip-mask-calculation",
  "openapi-specifications-contract-first-development": "cidr-subnetting-and-ip-mask-calculation",
  "circuit-breaker-pattern-microservices-resilience": "cidr-subnetting-and-ip-mask-calculation",
  "graphql-vs-trpc-type-safety-overhead-benchmarks": "cidr-subnetting-and-ip-mask-calculation",

  // --- Mapped to Pillar 5: Cron Schedules & Timezone Engine ---
  "windows-task-scheduler-vs-cron-automation": "unix-timestamps-and-millisecond-precision",
  "high-resolution-timers-performance-now-node": "unix-timestamps-and-millisecond-precision",
  "event-loop-microtasks-macrotasks-node-browser": "unix-timestamps-and-millisecond-precision",
  "distributed-tracing-opentelemetry-w3c-trace-context": "unix-timestamps-and-millisecond-precision",
  "database-replication-lag-measurement-strategies": "unix-timestamps-and-millisecond-precision",
  "database-backup-strategies-pitr-point-in-time-recovery": "unix-timestamps-and-millisecond-precision",
  "font-display-swap-preventing-layout-shifts": "unix-timestamps-and-millisecond-precision",
  "image-optimization-next-gen-avif-webp-nextjs": "unix-timestamps-and-millisecond-precision",
  "http-cache-control-immutable-stale-while-revalidate": "unix-timestamps-and-millisecond-precision",
  "client-side-caching-swr-react-query-architecture": "unix-timestamps-and-millisecond-precision",
  "real-user-monitoring-rum-vs-synthetic-monitoring": "unix-timestamps-and-millisecond-precision",
};

export const TOTAL_LEGACY_REDIRECTS_COUNT = Object.keys(BLOG_LEGACY_REDIRECTS).length; // 95
