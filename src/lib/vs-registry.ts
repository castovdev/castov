export interface ComparisonRow {
  feature: string;
  castov: string;
  competitor: string;
  winner: "castov" | "competitor" | "tie";
}

export interface VsComparison {
  slug: string;
  competitorName: string;
  competitorCategory: string;
  title: string;
  seoTitle: string;
  summary: string;
  verdictSummary: string;
  castovCommand: string;
  mcpCommand: string;
  castovToolUrl: string;
  castovToolName: string;
  rows: ComparisonRow[];
  whenToUseCastov: string[];
  whenToUseCompetitor: string[];
  howToMigrateSteps: { name: string; text: string }[];
  faqs: { q: string; a: string }[];
}

export const VS_COMPARISONS: VsComparison[] = [
  {
    slug: "snyk",
    competitorName: "Snyk",
    competitorCategory: "Secret Scanning & DevSecOps",
    title: "Castov Secret Scanner vs Snyk — Free Zero-Telemetry Alternative",
    seoTitle: "Snyk Alternative (Free & Offline): Castov Secret Scanner vs Snyk (2026)",
    summary:
      "Compare Castov's 100% local, zero-telemetry Secret Scanner (CLI & MCP Server) against Snyk Cloud for pre-commit secret detection, CI/CD pipelines, and AI coding agents.",
    verdictSummary:
      "Snyk is a comprehensive enterprise cloud CNAPP/SCA platform for large security teams. Castov (`npx castov scan .` and `castov_scan_secrets` MCP tool) is built for developers and AI agents who want instant, zero-account, 100% offline secret detection in under 150ms without sending source code or tokens to a cloud server.",
    castovCommand: "npx castov scan .",
    mcpCommand: "npx -y castov@latest mcp",
    castovToolUrl: "/secret-scanner",
    castovToolName: "Client-Side Secret Scanner",
    rows: [
      {
        feature: "Execution Model & Privacy",
        castov: "100% Local & Offline (No Telemetry, Zero Cloud Calls in CLI)",
        competitor: "Cloud-connected SaaS (requires API token & telemetry sync)",
        winner: "castov",
      },
      {
        feature: "Account / Sign-Up Required",
        castov: "None — runs immediately via npx castov scan .",
        competitor: "Mandatory Snyk account & OAuth/API key authentication",
        winner: "castov",
      },
      {
        feature: "Native AI Agent MCP Support",
        castov: "Built-in Grade A MCP Server (castov_scan_secrets over JSON-RPC 2.0)",
        competitor: "Requires external CLI wrapper & authentication token",
        winner: "castov",
      },
      {
        feature: "Cold-Start Scan Speed (Typical Repo)",
        castov: "~120ms local regex + entropy analysis",
        competitor: "3s – 15s (network handshake + cloud policy resolution)",
        winner: "castov",
      },
      {
        feature: "Pricing",
        castov: "100% Free & MIT Open-Source (Unlimited scans & CI runs)",
        competitor: "Freemium (200 tests/mo limit on free tier; paid Team/Enterprise tiers)",
        winner: "castov",
      },
      {
        feature: "Full Container & Transitive CVE Database",
        castov: "Focused on Secret Scanning, Ports, CIDR & DevSecOps Primitives",
        competitor: "Full SCA dependency graph & container OS vulnerability database",
        winner: "competitor",
      },
    ],
    whenToUseCastov: [
      "You want an instant pre-commit or GitHub Actions secret scanner (`npx castov scan .`) with zero sign-up or API tokens.",
      "You use Claude Desktop, Cursor, or Windsurf and want your AI agent to scan code snippets locally via `castov_scan_secrets` before committing.",
      "Strict compliance or air-gapped policies prohibit uploading source code or `.env` files to third-party cloud scanners.",
    ],
    whenToUseCompetitor: [
      "You need full Software Composition Analysis (SCA) for transitive npm/Maven/PyPI CVE tracking across hundreds of enterprise repositories.",
      "Your compliance team requires centralized cloud dashboards, Jira ticket automation, and SSO governance.",
    ],
    howToMigrateSteps: [
      {
        name: "Run Instant Local Secret Audit",
        text: "Execute `npx castov scan .` in your project root to scan all source files for AWS, Stripe, GitHub, OpenAI, and database credentials with zero configuration.",
      },
      {
        name: "Attach to Your AI Coding Agent (MCP)",
        text: "Run `claude mcp add castov -- npx -y castov@latest mcp` so Claude or Cursor automatically checks code for leaked secrets via `castov_scan_secrets`.",
      },
      {
        name: "Add Zero-Token CI Check in GitHub Actions",
        text: "Add `run: npx --yes castov@latest scan .` to your `.github/workflows/ci.yml` without managing third-party API secrets.",
      },
    ],
    faqs: [
      {
        q: "Does Castov Secret Scanner send any code to external servers?",
        a: "Never. Both the browser studio (`castov.com/secret-scanner`) and CLI/MCP (`npx castov scan .`) execute 100% locally in memory with zero network calls.",
      },
      {
        q: "Can I use Castov alongside Snyk?",
        a: "Yes. Many engineering teams run `npx castov scan .` locally and inside AI agents for sub-second pre-commit secret blocking, while keeping Snyk in nightly CI for dependency CVE reports.",
      },
      {
        q: "What secret formats does Castov detect?",
        a: "Castov detects AWS Access Keys (`AKIA...`), Stripe Live/Test Keys, GitHub PATs, OpenAI & Anthropic API keys, Slack Webhooks, PEM private keys, and PostgreSQL/MongoDB/Redis connection strings.",
      },
    ],
  },
  {
    slug: "dotenv",
    competitorName: "dotenv / dotenvx",
    competitorCategory: "Environment Variable Security & Vaults",
    title: "Castov Env Vault & Secret Generator vs dotenv / dotenvx",
    seoTitle: "dotenv / dotenvx Alternative: Castov Zero-Knowledge Env Vault & CLI (2026)",
    summary:
      "Compare Castov's client-side AES-256-GCM Env Vault, cryptographic secret generator (`npx castov secret`), and `.env` leakage scanner against traditional dotenv and dotenvx workflows.",
    verdictSummary:
      "Standard `dotenv` loads plaintext `.env` files at runtime, while `dotenvx` adds key-managed `.env.vault` encryption. Castov complements your stack with instant CSPRNG secret generation (`npx castov secret`), browser-based zero-knowledge AES-256-GCM `.env` sharing (`/env-vault`), and AI-native secret redaction via MCP.",
    castovCommand: "npx castov secret 32",
    mcpCommand: "npx -y castov@latest mcp",
    castovToolUrl: "/env-vault",
    castovToolName: "Zero-Knowledge .env Vault",
    rows: [
      {
        feature: "Cryptographic Secret Generation",
        castov: "Built-in CSPRNG Hex, Base64, Base64URL & UUIDv4/v7 (`npx castov secret`)",
        competitor: "Requires separate openssl or custom scripts for secret generation",
        winner: "castov",
      },
      {
        feature: "Zero-Knowledge Browser Sharing",
        castov: "WebCrypto AES-256-GCM client-side encrypted links (fragment key never hits server)",
        competitor: "CLI-centric file encryption via .env.keys",
        winner: "castov",
      },
      {
        feature: "Accidental Leak Prevention",
        castov: "Built-in secret scanner (`npx castov scan .`) + AI MCP redaction",
        competitor: "Relies on .gitignore discipline or paid cloud radar",
        winner: "castov",
      },
      {
        feature: "Runtime Process Injection (`node -r dotenv/config`)",
        castov: "Focused on generation, auditing, and encrypted sharing (pair with Node `--env-file`)",
        competitor: "Native runtime injection across Node/Python/Go processes",
        winner: "competitor",
      },
    ],
    whenToUseCastov: [
      "You use Node.js 20.6+ native `--env-file=.env` and only need fast cryptographic secret generation (`npx castov secret`) and leak scanning (`npx castov scan .`).",
      "You need to share `.env` variables with a teammate over Slack or Discord using client-side AES-256-GCM encryption where the decryption key stays in the URL `#hash`.",
      "You want Claude or Cursor to generate high-entropy secrets directly via the `castov_secret` MCP tool instead of hallucinating weak placeholder strings.",
    ],
    whenToUseCompetitor: [
      "You run legacy Node.js (<20) or multi-language monorepos that require runtime `.env` file parsing and variable interpolation at process startup.",
    ],
    howToMigrateSteps: [
      {
        name: "Generate Cryptographic Secrets Locally",
        text: "Run `npx castov secret 32` to generate 256-bit Hex, Base64, and Base64URL secrets for `NEXTAUTH_SECRET`, `JWT_SECRET`, or `ENCRYPTION_KEY`.",
      },
      {
        name: "Audit Your .env and Source Tree",
        text: "Run `npx castov scan .` to verify no live credentials were accidentally copied into tracked source files.",
      },
      {
        name: "Share .env Configs with Zero-Knowledge Encryption",
        text: "Open `https://www.castov.com/env-vault` to encrypt `.env` blocks in-browser via WebCrypto AES-256-GCM.",
      },
    ],
    faqs: [
      {
        q: "Why don't I need dotenv for basic Node.js projects in 2026?",
        a: "Node.js 20.6+ includes native `node --env-file=.env` and `process.loadEnvFile()`. Pairing native Node `.env` loading with `npx castov secret` and `npx castov scan .` eliminates runtime dependencies.",
      },
      {
        q: "How does Castov Env Vault keep my secrets private?",
        a: "Encryption happens entirely inside your browser using the WebCrypto API (`AES-256-GCM`). The decryption key is stored in the URL fragment (`#...`), which browsers never transmit in HTTP requests.",
      },
    ],
  },
  {
    slug: "jwt-io",
    competitorName: "jwt.io",
    competitorCategory: "JWT Debugging & Token Inspection",
    title: "Castov Offline JWT Decoder vs jwt.io — Zero-Telemetry Token Inspector",
    seoTitle: "jwt.io Alternative (100% Offline & CLI/MCP): Castov vs jwt.io (2026)",
    summary:
      "Compare Castov's 100% offline JWT Decoder (Browser, CLI `npx castov jwt`, and MCP tool `castov_jwt_decode`) against jwt.io for inspecting production bearer tokens safely.",
    verdictSummary:
      "Pasting production Bearer tokens into third-party websites triggers security alerts at many organizations. Castov provides a strict zero-telemetry browser JWT inspector plus a terminal CLI (`npx castov jwt <token>`) and MCP tool (`castov_jwt_decode`) that never make external network requests.",
    castovCommand: "npx castov jwt <token> --json",
    mcpCommand: "npx -y castov@latest mcp",
    castovToolUrl: "/jwt-decoder",
    castovToolName: "Offline JWT Decoder & Inspector",
    rows: [
      {
        feature: "Terminal CLI Inspection (`npx castov jwt`)",
        castov: "Yes — decode header, payload & expiration directly in terminal without opening a browser",
        competitor: "Web-only interface (no official zero-dependency npx CLI)",
        winner: "castov",
      },
      {
        feature: "Native AI Agent MCP Tool (`castov_jwt_decode`)",
        castov: "Yes — AI agents inspect exp/iat claims locally via stdio JSON-RPC",
        competitor: "None",
        winner: "castov",
      },
      {
        feature: "Third-Party Analytics / Trackers",
        castov: "Zero third-party telemetry; works 100% offline / air-gapped",
        competitor: "Commercial property (Auth0/Okta) with marketing banners & scripts",
        winner: "castov",
      },
      {
        feature: "Automatic Unix Timestamp (`exp`, `iat`, `nbf`) Diff",
        castov: "Instant human-readable ISO-8601 + expired/active status badge",
        competitor: "Requires hover or manual epoch conversion",
        winner: "castov",
      },
      {
        feature: "Language Library Directory",
        castov: "Focused on fast token decoding, epoch math, and secret generation",
        competitor: "Extensive directory of third-party JWT libraries across 20+ languages",
        winner: "competitor",
      },
    ],
    whenToUseCastov: [
      "You need to inspect a staging or production JWT directly in your terminal (`npx castov jwt <token>`) without copying sensitive tokens into a web browser.",
      "Your AI assistant (Claude/Cursor) needs to debug token expiration (`exp`/`iat`) locally via `castov_jwt_decode`.",
      "You want a clean, fast browser JWT decoder linked directly to Unix timestamp and cryptographic secret generators.",
    ],
    whenToUseCompetitor: [
      "You are browsing a catalog of language-specific JWT verification libraries (Java, C#, PHP, Ruby).",
    ],
    howToMigrateSteps: [
      {
        name: "Decode JWTs Directly in Your Terminal",
        text: "Run `npx castov jwt <YOUR_JWT_TOKEN>` to view decoded header, payload claims, and expiration timestamps locally.",
      },
      {
        name: "Enable JWT Debugging in Claude & Cursor",
        text: "Configure `npx -y castov@latest mcp` in your IDE so your AI agent can call `castov_jwt_decode` without uploading tokens.",
      },
      {
        name: "Use the Offline Browser Inspector",
        text: "Bookmark `https://www.castov.com/jwt-decoder` for instant client-side inspection with automatic `iat`/`exp` date conversion.",
      },
    ],
    faqs: [
      {
        q: "Is it safe to decode production JWTs with Castov?",
        a: "Yes. Using `npx castov jwt <token>` in your terminal runs 100% locally in Node.js with zero network sockets opened. The web version at `castov.com/jwt-decoder` also decodes Base64URL segments purely in browser memory.",
      },
      {
        q: "Does Castov automatically convert JWT `exp` and `iat` claims to readable dates?",
        a: "Yes, both the CLI (`npx castov jwt`) and MCP server (`castov_jwt_decode`) automatically parse numeric `exp`, `iat`, and `nbf` epoch claims into ISO-8601 UTC strings and report whether the token is currently expired.",
      },
    ],
  },
  {
    slug: "crontab-guru",
    competitorName: "Crontab.guru",
    competitorCategory: "Cron Expression Scheduling & Timezone Math",
    title: "Castov Cron Engine vs Crontab.guru — IANA Timezone & MCP Support",
    seoTitle: "Crontab.guru Alternative with Timezones & CLI/MCP: Castov vs Crontab.guru",
    summary:
      "Compare Castov's timezone-aware Cron Expression Parser (Web, CLI `npx castov cron`, and MCP tool `castov_cron`) against Crontab.guru for Kubernetes, GitHub Actions, and cloud schedulers.",
    verdictSummary:
      "Crontab.guru is a classic minimalist web tool for 5-field cron syntax. Castov goes further by adding explicit IANA timezone simulation (`America/New_York`, `UTC`, `Asia/Tokyo`), next-5 execution ISO-8601 timestamps, terminal CLI execution (`npx castov cron`), and native MCP agent verification (`castov_cron`).",
    castovCommand: 'npx castov cron "*/15 * * * *" --json',
    mcpCommand: "npx -y castov@latest mcp",
    castovToolUrl: "/cron-expression-generator",
    castovToolName: "Timezone-Aware Cron Generator & Explainer",
    rows: [
      {
        feature: "IANA Timezone Execution Preview",
        castov: "Yes — preview next 5 exact run times in any IANA timezone with DST awareness",
        competitor: "Local browser time only (no IANA timezone selector)",
        winner: "castov",
      },
      {
        feature: "CLI & CI/CD Validation (`npx castov cron`)",
        castov: "Yes — validate cron strings in scripts and CI pipelines with `--json` output",
        competitor: "Browser-only website",
        winner: "castov",
      },
      {
        feature: "AI Agent MCP Verification (`castov_cron`)",
        castov: "Yes — prevents LLM cron syntax hallucinations via deterministic MCP tool",
        competitor: "None",
        winner: "castov",
      },
      {
        feature: "Instant 5-Field Human-Readable Translation",
        castov: "Yes — instant human summary + next 5 ISO-8601 execution timestamps",
        competitor: "Yes — instant human summary + next execution time",
        winner: "tie",
      },
    ],
    whenToUseCastov: [
      "You are scheduling GitHub Actions (`UTC`), Kubernetes `CronJob`s, or Vercel Cron jobs and need to verify exact run times across `UTC` and local IANA timezones.",
      "You want your AI assistant (Claude/Cursor) to verify cron expressions deterministically using `castov_cron` instead of guessing field order.",
      "You need a CLI tool (`npx castov cron \"0 9 * * 1-5\"`) inside your terminal.",
    ],
    whenToUseCompetitor: [
      "You only need a quick browser bookmark for basic 5-field Linux crontab syntax without timezone conversion or CLI/MCP integration.",
    ],
    howToMigrateSteps: [
      {
        name: "Test Cron Schedules in Terminal",
        text: "Run `npx castov cron \"*/15 * * * *\"` to get a human-readable explanation and the next 5 UTC execution timestamps.",
      },
      {
        name: "Verify Timezone Offsets",
        text: "Pair `castov_cron` with `castov_timezone` in your MCP-enabled IDE to verify how Daylight Saving Time (DST) affects scheduled jobs.",
      },
      {
        name: "Explore Interactive Cron Reference Pages",
        text: "Use `https://www.castov.com/cron` and `https://www.castov.com/cron-expression-generator` to build and share schedules.",
      },
    ],
    faqs: [
      {
        q: "Why do LLMs frequently write broken cron expressions?",
        a: "LLMs often confuse day-of-month (field 3) and day-of-week (field 5) or hallucinate 6/7-field Quartz syntax when 5-field POSIX cron is required. Connecting `castov_cron` via MCP gives the agent a deterministic validator.",
      },
      {
        q: "Can Castov preview cron schedules in specific timezones?",
        a: "Yes. Both the MCP tool (`castov_cron`) and CLI accept an optional IANA `timezone` parameter (defaulting to `UTC`).",
      },
    ],
  },
  {
    slug: "mcp-vs-cli",
    competitorName: "Traditional Shell CLIs",
    competitorCategory: "AI Agent Execution Architecture",
    title: "Castov MCP Server vs Traditional Shell CLIs for AI Coding Agents",
    seoTitle: "MCP Server vs Traditional CLI for AI Agents: Why Deterministic JSON-RPC Wins (2026)",
    summary:
      "Understand why structured JSON-RPC 2.0 Model Context Protocol (MCP) tools (`npx -y castov@latest mcp`) outperform raw bash shell invocations (`lsof`, `openssl`, `date`, `ipcalc`) in Claude Desktop, Cursor, and autonomous AI workflows.",
    verdictSummary:
      "Giving an AI agent unrestricted bash access to run `date`, `lsof`, `ipcalc`, or `openssl` introduces OS-specific flag errors (macOS BSD vs GNU Linux vs Windows PowerShell) and prompt-injection risks. Castov provides **both**: a unified cross-platform CLI (`npx castov`) for humans AND a strictly typed, Glama Grade A MCP Server (`npx -y castov@latest mcp`) for AI agents.",
    castovCommand: "npx -y castov@latest mcp",
    mcpCommand: "claude mcp add castov -- npx -y castov@latest mcp",
    castovToolUrl: "/mcp",
    castovToolName: "Castov MCP Server & Live Playground",
    rows: [
      {
        feature: "Cross-Platform Determinism (Windows / macOS / Linux)",
        castov: "100% identical JSON schema and output across all OSes",
        competitor: "Breaks across GNU date vs BSD date, lsof vs netstat, ipcalc vs sipcalc",
        winner: "castov",
      },
      {
        feature: "Structured Output for LLMs",
        castov: "Typed JSON-RPC 2.0 responses (zero regex parsing required by LLM)",
        competitor: "Unstructured stdout text requiring brittle awk/sed/grep chains",
        winner: "castov",
      },
      {
        feature: "Security & Sandbox Safety",
        castov: "Glama Grade A — read-only deterministic math & crypto primitives",
        competitor: "Requires granting arbitrary shell execution permissions to the LLM",
        winner: "castov",
      },
      {
        feature: "Token Efficiency in Context Window",
        castov: "Compact, schema-validated JSON payload (<250 tokens per call)",
        competitor: "Verbose man-page retries and failed flag errors burn 2,000+ tokens",
        winner: "castov",
      },
    ],
    whenToUseCastov: [
      "You want Claude Desktop, Cursor, Windsurf, or VS Code Copilot to compute CIDR subnets, timestamps, UUIDv7 metadata, hashes, and secret scans with 0% hallucination.",
      "Your team works across Windows, macOS, and Linux and needs identical behavior whether invoked via MCP (`castov_*`) or terminal (`npx castov ...`).",
    ],
    whenToUseCompetitor: [
      "You are writing a low-level POSIX shell script inside a known Linux container image where Node.js is not installed.",
    ],
    howToMigrateSteps: [
      {
        name: "Install Castov MCP Server in One Command",
        text: "Run `claude mcp add castov -- npx -y castov@latest mcp` or add `npx -y castov@latest mcp` to Cursor's `.cursor/mcp.json`.",
      },
      {
        name: "Test All 10 Tools in the Browser Playground",
        text: "Visit `https://www.castov.com/mcp` to inspect live JSON-RPC 2.0 requests and responses for all 10 tools.",
      },
      {
        name: "Use the Same Engine in Your Terminal",
        text: "Run `npx castov cidr 10.0.0.0/16 --json` or `npx castov port 5432` directly from your shell.",
      },
    ],
    faqs: [
      {
        q: "Why do AI agents fail when using standard terminal commands like `date` or `lsof`?",
        a: "macOS uses BSD `date -r`, Linux uses GNU `date -d`, and Windows uses PowerShell `Get-Date`. AI agents frequently guess the wrong OS flags, wasting turns and tokens. Castov's MCP tools (`castov_timestamp`, `castov_port`, `castov_cidr`) accept a single typed JSON schema on every OS.",
      },
      {
        q: "Does Castov MCP Server require an API key or Docker daemon?",
        a: "No. It runs via `npx -y castov@latest mcp` using standard Node.js stdio with zero API keys and zero external dependencies.",
      },
    ],
  },
];

export function getVsComparisonBySlug(slug: string): VsComparison | undefined {
  return VS_COMPARISONS.find((item) => item.slug === slug);
}
