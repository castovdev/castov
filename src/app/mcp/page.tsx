import type { Metadata } from "next";
import Link from "next/link";
import {
  Cpu,
  ShieldCheck,
  Terminal,
  Lock,
  Zap,
  CheckCircle2,
  ExternalLink,
  Code2,
  Layers,
  HelpCircle,
  History,
  Check,
  ArrowRight,
  Sparkles,
  Server
} from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { websiteJsonLd, buildMetadata } from "@/lib/seo";
import { McpConfigCopier } from "@/components/mcp-config-copier";
import { McpLivePlayground } from "@/components/mcp-live-playground";
import { McpStackBuilder } from "@/components/mcp-stack-builder";
import { SponsorSlot } from "@/components/sponsor-slot";
import { MCP_TOOLS_CATALOG, TOTAL_MCP_TOOLS_COUNT } from "@/lib/mcp-catalog";

const CURRENT_VERSION = "1.5.0";

export const metadata: Metadata = buildMetadata({
  title: "Castov MCP Server: Local DevSecOps Tools for Claude, Cursor & VS Code",
  description:
    "Castov MCP server: 13 local read-only tools for Claude Desktop, Cursor, Windsurf & VS Code. Zero data logging and zero cloud latency. Run: npx -y castov mcp",
  path: "/mcp",
});

const MCP_TOOLS = MCP_TOOLS_CATALOG;

const FAQS = [
  {
    question: "What is an MCP server and how does Castov implement it?",
    answer:
      "The Model Context Protocol (MCP) is an open standard introduced by Anthropic that enables AI assistants (such as Claude Desktop, Cursor, Windsurf, and VS Code) to securely invoke external tools and inspect local context. Castov implements an ultra-fast, zero-dependency MCP server running over standard input/output (stdio JSON-RPC 2.0). It provides 13 deterministic developer tools (10 core tools + 3 chained multi-step pipelines) that execute 100% locally on your machine without cloud latency.",
  },
  {
    question: "Does Castov MCP Server transmit my code, JWT tokens, or environment secrets to remote servers?",
    answer:
      "No. Castov operates under a strict Zero-Data Logging policy. Every calculation—including JWT payload inspection, CSPRNG secret generation, and regex leak scanning—runs strictly client-side inside your local Node.js or Docker process. There are no tracking beacons, telemetry pings, or cloud API roundtrips.",
  },
  {
    question: "Why do engineering teams pin castov@1.5.0 instead of using @latest?",
    answer:
      "Using castov@1.5.0 guarantees deterministic, reproducible agent behavior across team workstations and CI/CD pipelines. Pinned versions prevent unexpected upstream changes, ensure identical JSON-RPC tool schemas, and comply with enterprise software supply-chain security guidelines.",
  },
  {
    question: "How do I fix npx spawn errors on Windows Claude Desktop?",
    answer:
      "On Windows, Claude Desktop can fail to spawn bare 'npx' executables due to Windows cmd shim handling. To fix this, configure Claude Desktop to use the cmd wrapper: set \"command\": \"cmd\" and \"args\": [\"/c\", \"npx\", \"-y\", \"castov@latest\", \"mcp\"]. The Castov Quick Setup generator includes a dedicated 1-click Windows configuration button.",
  },
  {
    question: "How does Castov MCP prevent LLM arithmetic and timezone hallucinations?",
    answer:
      "Large Language Models frequently hallucinate bitwise subnet calculations, Daylight Saving Time (DST) transitions, and POSIX cron next-run timestamps. Castov offloads these operations to compiled algorithms and standard IANA timezone databases, returning verified, bit-accurate JSON-RPC responses in under 2ms.",
  },
  {
    question: "Which AI coding clients and IDEs are compatible with Castov MCP?",
    answer:
      "Castov MCP is fully compatible with Claude Desktop (macOS & Windows), Cursor IDE (Composer & Agent modes), Windsurf Cascade, VS Code Copilot Agent Mode, Zed Editor, and any tool conforming to the Model Context Protocol 2024-11-05 specification.",
  },
];

const DIRECTORIES = [
  {
    name: "Glama MCP Registry",
    badge: "Grade A Certified",
    desc: "Audited for schema compliance, security annotations, and tool determinism.",
    href: "https://glama.ai/mcp/servers/castovdev/castov",
    badgeClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    name: "Smithery.ai",
    badge: "Verified Server",
    desc: "Discoverable on the Smithery Model Context Protocol ecosystem directory.",
    href: "https://smithery.ai/server/castovdev/castov",
    badgeClass: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
  {
    name: "mcp.so Directory",
    badge: "Listed Server",
    desc: "Cataloged for Claude Desktop, Cursor, and Windsurf AI assistant integrations.",
    href: "https://mcp.so/server/castovdev/castov",
    badgeClass: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    name: "PulseMCP Index",
    badge: "Ecosystem Partner",
    desc: "Tracked in the PulseMCP community registry of open-source developer servers.",
    href: "https://pulsemcp.com",
    badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
];

const CHANGELOG = [
  {
    version: "v1.5.0",
    date: "October 2026",
    title: "Chained Pipelines & Windows CMD Support",
    features: [
      "Added multi-step tool pipelines: JSON-to-TypeScript, Cron-to-Timezones, and JWT security inspect.",
      "Added native Windows CMD execution wrapper for Claude Desktop.",
      "Fully audited zero-vulnerability dependency tree across monorepo packages.",
    ],
  },
  {
    version: "v1.4.0",
    date: "October 2026",
    title: "Dual-Framing Transport & Security Annotations",
    features: [
      "Dual stdio transport support: Content-Length byte framing and newline-delimited JSON (ndjson).",
      "Strict MCP safety annotations: readOnlyHint: true, destructiveHint: false, and openWorldHint: false.",
      "In-memory credential leak scanner expanded to 30+ credential patterns.",
    ],
  },
  {
    version: "v1.3.0",
    date: "October 2026",
    title: "Public Launch of Castov MCP Suite",
    features: [
      "10 deterministic local tools: CIDR calculator, port checker, ID decoder, Cron predictor, and CSPRNG secret generator.",
      "Dockerized container execution mode for zero-host-dependency environments.",
      "Achieved Glama Grade A certification on initial release.",
    ],
  },
];

export default function McpServerPage() {
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Castov MCP Server",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Windows, macOS, Linux",
    softwareVersion: CURRENT_VERSION,
    license: "https://opensource.org/licenses/MIT",
    url: "https://castov.com/mcp",
    downloadUrl: "https://www.npmjs.com/package/castov",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Official Model Context Protocol (MCP) server providing 13 hardened, local developer tools for Claude Desktop, Cursor, and VS Code with zero behavioral telemetry.",
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://castov.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Developer",
        item: "https://castov.com/developer",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "MCP Server",
        item: "https://castov.com/mcp",
      },
    ],
  };

  return (
    <div className="layout-content max-w-5xl py-12">
      <Breadcrumb
        path="/mcp"
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Developer", href: "/developer" },
          { name: "MCP Server" },
        ]}
      />
      <JsonLd data={[websiteJsonLd(), softwareJsonLd, faqJsonLd, breadcrumbsJsonLd]} />

      {/* Hero Section */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent mb-6">
          <Cpu className="w-3.5 h-3.5" />
          <span>MODEL CONTEXT PROTOCOL • STDIO JSON-RPC 2.0 • V{CURRENT_VERSION}</span>
        </div>

        {/* Single H1 matching title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-fg mb-4 max-w-4xl mx-auto leading-tight">
          Castov MCP Server: Local DevSecOps Tools for Claude, Cursor &amp; VS Code
        </h1>

        <p className="text-base sm:text-lg text-muted max-w-3xl mx-auto leading-relaxed">
          Give Claude Desktop, Cursor, Windsurf, and VS Code Copilot deterministic local execution superpowers.
          13 hardened, read-only local developer tools with zero remote payload logging and zero cloud roundtrips.
        </p>

        {/* Verified Badges & Repository Links */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <a
            href="https://glama.ai/mcp/servers/castovdev/castov"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-card border border-emerald-500/30 text-xs sm:text-sm font-semibold text-fg hover:border-emerald-500/60 transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Glama Certified: Grade A Security &amp; Quality</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted" />
          </a>

          <a
            href="https://www.npmjs.com/package/castov"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#2563eb] text-white text-xs sm:text-sm font-bold hover:bg-[#1d4ed8] transition-all shadow-lg shadow-blue-500/20"
          >
            <Terminal className="w-4 h-4" />
            <span>npm: castov@{CURRENT_VERSION}</span>
          </a>

          <a
            href="https://github.com/castovdev/castov"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-line text-xs sm:text-sm font-semibold text-fg hover:bg-hover transition-all"
          >
            <Code2 className="w-4 h-4 text-accent" />
            <span>GitHub Repository (MIT)</span>
          </a>
        </div>
      </div>

      {/* Hero Demo Container: Simulated Claude calling castov_cidr */}
      <section className="mb-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-fg flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-accent" />
            <span>Interactive Demo: Claude Calling castov_cidr</span>
          </h2>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            Execution Latency: 1.2ms
          </span>
        </div>

        <div className="rounded-2xl border border-line bg-[#070b14] overflow-hidden shadow-2xl">
          {/* Mock Window Header */}
          <div className="px-4 py-3 bg-[#0d1322] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-xs font-mono text-slate-400">
                Claude 3.7 Sonnet + Castov MCP Server
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">stdio JSON-RPC 2.0</span>
          </div>

          <div className="p-5 sm:p-6 space-y-4 font-mono text-xs sm:text-sm">
            {/* User Prompt */}
            <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-xl border border-white/5">
              <span className="text-sky-400 font-bold shrink-0">User &gt;</span>
              <p className="text-slate-200">
                What is the usable IP range, broadcast address, and host count for subnet{" "}
                <code className="text-amber-300 font-bold">10.240.0.0/22</code>?
              </p>
            </div>

            {/* Agent Tool Call */}
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-accent font-bold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  Claude invokes tool: castov_cidr
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">readOnlyHint: true</span>
              </div>
              <div className="bg-black/60 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto">
                <code className="text-emerald-300">
                  {`{\n  "jsonrpc": "2.0",\n  "method": "tools/call",\n  "params": {\n    "name": "castov_cidr",\n    "arguments": { "cidr": "10.240.0.0/22" }\n  }\n}`}
                </code>
              </div>
            </div>

            {/* Castov Tool Return */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Castov MCP returns in 1.2ms (Zero Cloud Latency):
                </span>
                <span className="text-[11px] text-slate-400 font-mono">100% Local Stdio</span>
              </div>
              <div className="bg-black/60 rounded-lg p-3 text-xs text-emerald-200 overflow-x-auto">
                <code>
                  {`{\n  "networkAddress": "10.240.0.0",\n  "broadcastAddress": "10.240.3.255",\n  "subnetMask": "255.255.252.0",\n  "firstUsableHost": "10.240.0.1",\n  "lastUsableHost": "10.240.3.254",\n  "usableHosts": 1022,\n  "totalAddresses": 1024\n}`}
                </code>
              </div>
            </div>

            {/* Agent Synthesized Response */}
            <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-xl border border-white/5">
              <span className="text-purple-400 font-bold shrink-0">Claude &gt;</span>
              <p className="text-slate-200 leading-relaxed">
                For the subnet <code className="text-emerald-300">10.240.0.0/22</code> (subnet mask{" "}
                <code className="text-slate-300">255.255.252.0</code>), the network contains{" "}
                <strong className="text-white">1,022 usable host addresses</strong> ranging from{" "}
                <code className="text-emerald-300">10.240.0.1</code> to{" "}
                <code className="text-emerald-300">10.240.3.254</code>. The broadcast address is{" "}
                <code className="text-emerald-300">10.240.3.255</code>. All calculations were verified
                without mathematical hallucination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Educational Section: What is an MCP Server? (~150 words) */}
      <section className="mb-16 rounded-2xl border border-line bg-card p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-3">
          <HelpCircle className="w-6 h-6 text-accent" />
          <h2 className="text-xl sm:text-2xl font-bold text-fg">
            What is an MCP Server &amp; Why AI Coding Agents Need It?
          </h2>
        </div>
        <div className="text-xs sm:text-sm text-muted leading-relaxed space-y-3">
          <p>
            The <strong className="text-fg">Model Context Protocol (MCP)</strong> is an open standard introduced by Anthropic that acts as a universal bridge between large language models (LLMs) and local developer environments. Instead of relying on prompt injection or brittle plugins, AI coding agents like Claude Desktop, Cursor, Windsurf, and VS Code Copilot connect directly to local tools using standardized JSON-RPC 2.0 communication over standard input and output (stdio).
          </p>
          <p>
            While LLMs excel at generating prose and refactoring code, they frequently hallucinate complex binary arithmetic, IPv4/IPv6 CIDR subnet boundaries, Daylight Saving Time (DST) offsets, and Cron execution patterns. Furthermore, pasting production secrets or JSON Web Tokens into cloud chat prompts creates substantial compliance risks. Castov MCP solves this by offloading sensitive calculations to hardened, read-only local utilities that run entirely on your hardware with <strong className="text-fg">zero telemetry and zero network logging</strong>.
          </p>
        </div>
      </section>

      {/* Interactive One-Click Configuration Copier */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-fg flex items-center gap-2.5">
            <Terminal className="w-6 h-6 text-accent" />
            <span>Quick Setup for AI Coding Agents</span>
          </h2>
          <span className="text-xs font-mono text-muted hidden sm:inline">
            Default: npx -y castov@latest mcp
          </span>
        </div>
        <McpConfigCopier />
      </section>

      {/* Interactive MCP Live Playground */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-fg flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-accent" />
            <span>Interactive MCP Live Playground (JSON-RPC Inspector)</span>
          </h2>
          <span className="text-xs font-mono text-emerald-400 hidden sm:inline">
            JSON-RPC 2.0 Stdio Inspector
          </span>
        </div>
        <McpLivePlayground />
      </section>

      {/* Multi-Server MCP Stack Composer */}
      <section className="mb-16">
        <McpStackBuilder />
      </section>

      <SponsorSlot context="mcp" />

      {/* Why Castov MCP Architecture Cards */}
      <section className="mb-16">
        <h2 className="text-xl sm:text-2xl font-bold text-fg mb-6 flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <span>Enterprise-Grade DevSecOps &amp; Security Guarantees</span>
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="card p-6 border border-line bg-card rounded-2xl">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-lg font-bold text-fg mb-2">Hardened Security Annotations</h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Every MCP tool declares strict <code className="text-fg bg-field px-1 py-0.5 rounded">readOnlyHint: true</code>,{" "}
              <code className="text-fg bg-field px-1 py-0.5 rounded">destructiveHint: false</code>, and{" "}
              <code className="text-fg bg-field px-1 py-0.5 rounded">openWorldHint: false</code> annotations, using{" "}
              <code className="text-fg bg-field px-1 py-0.5 rounded">execFileSync</code> argument arrays to eliminate shell injection.
            </p>
          </div>

          <div className="card p-6 border border-line bg-card rounded-2xl">
            <Zap className="w-8 h-8 text-accent mb-3" />
            <h3 className="text-lg font-bold text-fg mb-2">Zero LLM Arithmetic Hallucinations</h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Eliminate AI errors on CIDR subnet masks, RFC 3021 point-to-point ranges, IANA Daylight Saving Time shifts, Snowflake bit-shifting, and Cron schedule predictions.
            </p>
          </div>

          <div className="card p-6 border border-line bg-card rounded-2xl">
            <Lock className="w-8 h-8 text-primary mb-3" />
            <h3 className="text-lg font-bold text-fg mb-2">100% Local &amp; Air-Gapped</h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              JWT tokens, <code className="text-fg bg-field px-1 py-0.5 rounded">.env</code> files, and cryptographic secrets never leave your machine. Dual-framing stdio supports both <code className="text-fg bg-field px-1 py-0.5 rounded">Content-Length</code> and <code className="text-fg bg-field px-1 py-0.5 rounded">ndjson</code> transports.
            </p>
          </div>
        </div>
      </section>

      {/* Complete 10-Tool Catalog */}
      <section className="mb-16">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-accent uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Complete Tool Specification</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-fg">
            Available MCP Tools Catalog ({TOTAL_MCP_TOOLS_COUNT} Tools)
          </h2>
          <p className="text-sm text-muted mt-1">
            All tools include comprehensive JSON Schema validation, explicit type constraints, and deterministic JSON output.
          </p>
        </div>

        <div className="grid gap-4">
          {MCP_TOOLS.map((tool) => (
            <div
              key={tool.name}
              className="p-6 rounded-2xl border border-line bg-card hover:border-accent/40 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <code className="px-3 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent font-mono text-sm font-bold">
                    {tool.name}
                  </code>
                  <h3 className="text-base sm:text-lg font-bold text-fg">{tool.title}</h3>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>readOnlyHint: true</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-muted leading-relaxed mb-4">
                {tool.description}
              </p>

              <div className="grid sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-field border border-line">
                  <span className="text-muted block mb-1">Example Agent Prompt:</span>
                  <span className="text-fg italic">&ldquo;{tool.promptExample}&rdquo;</span>
                </div>
                <div className="p-3 rounded-xl bg-field border border-line">
                  <span className="text-muted block mb-1">Input Schema:</span>
                  <code className="text-accent">{tool.inputParams}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verified Directory Listings Section */}
      <section className="mb-16">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-accent uppercase tracking-wider mb-2">
            <Server className="w-3.5 h-3.5" />
            <span>Ecosystem Trust</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-fg">
            Verified Directory Listings &amp; Registries
          </h2>
          <p className="text-sm text-muted mt-1">
            Castov MCP Server is actively registered and audited across major AI assistant directories.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DIRECTORIES.map((dir) => (
            <a
              key={dir.name}
              href={dir.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-2xl border border-line bg-card hover:border-accent/40 transition-all flex flex-col justify-between group shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${dir.badgeClass}`}>
                    {dir.badge}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors" />
                </div>
                <h3 className="text-sm font-bold text-fg group-hover:text-accent transition-colors">
                  {dir.name}
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  {dir.desc}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-accent mt-4 inline-flex items-center gap-1">
                View Listing &rarr;
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) Section */}
      <section className="mb-16">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-accent uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Developer Knowledge Base</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-fg">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-muted mt-1">
            Answers to common questions regarding security, configuration, and AI agent integration.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl border border-line bg-card space-y-2 hover:border-line/80 transition-all"
            >
              <h3 className="text-base sm:text-lg font-bold text-fg flex items-start gap-2.5">
                <span className="text-accent font-mono text-sm mt-0.5">Q{index + 1}:</span>
                <span>{faq.question}</span>
              </h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed pl-7">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Short Changelog Section */}
      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-accent uppercase tracking-wider mb-2">
              <History className="w-3.5 h-3.5" />
              <span>Release History</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-fg">
              Changelog &amp; Version History
            </h2>
          </div>
          <a
            href="https://github.com/castovdev/castov/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1"
          >
            All GitHub Releases &rarr;
          </a>
        </div>

        <div className="space-y-4">
          {CHANGELOG.map((release) => (
            <div
              key={release.version}
              className="p-5 sm:p-6 rounded-2xl border border-line bg-card space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-lg bg-accent/10 border border-accent/20 text-accent font-mono font-bold text-xs sm:text-sm">
                    {release.version}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-fg">
                    {release.title}
                  </h3>
                </div>
                <span className="text-xs font-mono text-muted">{release.date}</span>
              </div>
              <ul className="space-y-1.5 text-xs sm:text-sm text-muted">
                {release.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="p-8 rounded-2xl border border-line bg-card text-center">
        <h2 className="text-2xl font-bold text-fg mb-2">
          Ready to supercharge your AI coding assistant?
        </h2>
        <p className="text-sm text-muted max-w-xl mx-auto mb-6">
          Run Castov directly via <code className="text-fg bg-field px-1.5 py-0.5 rounded font-mono">npx -y castov@{CURRENT_VERSION} mcp</code> or explore all 61 interactive browser utilities and CLI commands.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/cli" className="btn btn-primary px-6 py-3 text-sm font-bold">
            Explore Terminal CLI Commands
          </Link>
          <Link href="/tools" className="btn bg-field border border-line text-fg px-6 py-3 text-sm font-bold hover:bg-hover">
            Browse 61 Browser Utilities
          </Link>
          <Link href="/guides/understanding-mcp-protocol" className="btn bg-field border border-line text-accent px-6 py-3 text-sm font-bold hover:bg-hover inline-flex items-center gap-1.5">
            <span>Read MCP Guide</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
