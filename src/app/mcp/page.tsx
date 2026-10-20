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
  Layers
} from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { websiteJsonLd, buildMetadata } from "@/lib/seo";
import { McpConfigCopier } from "@/components/mcp-config-copier";
import { McpLivePlayground } from "@/components/mcp-live-playground";
import { McpStackBuilder } from "@/components/mcp-stack-builder";
import { SponsorSlot } from "@/components/sponsor-slot";

export const metadata: Metadata = buildMetadata({
  title: "Castov MCP Server (v1.4.0) | 10 Local Tools for Claude, Cursor & Windsurf",
  description:
    "Official Model Context Protocol (MCP) server for AI coding agents. 10 hardened, zero-telemetry local tools for port inspection, CIDR calculation, UUIDv7/ULID/Snowflake decoding, Cron scheduling, JWT inspection, and secret scanning.",
  path: "/mcp",
});

interface McpToolDoc {
  name: string;
  title: string;
  description: string;
  promptExample: string;
  inputParams: string;
}

const MCP_TOOLS: McpToolDoc[] = [
  {
    name: "castov_port",
    title: "Port & Process Inspector",
    description:
      "Identifies standard service registrations for TCP/UDP ports (1–65535) and inspects active local processes listening on the port across Linux, macOS, and Windows.",
    promptExample: "Check if port 3000 is currently in use and tell me which process owns it.",
    inputParams: "{ port: number }"
  },
  {
    name: "castov_cidr",
    title: "IPv4 CIDR & Subnet Calculator",
    description:
      "Calculates exact IPv4 network address, subnet mask, wildcard mask, broadcast address, first/last usable host IPs, and total host capacity (including RFC 3021 /31 and /32).",
    promptExample: "Calculate the usable IP range, broadcast address, and wildcard mask for 10.240.0.0/22.",
    inputParams: "{ cidr: string }"
  },
  {
    name: "castov_detect_id",
    title: "Distributed ID & Timestamp Decoder",
    description:
      "Detects and extracts embedded creation timestamps from UUIDv7, UUIDv1/v4, ULID, MongoDB ObjectId, and Discord/Twitter Snowflake IDs.",
    promptExample: "Decode when this ID was generated: 018f3a9c-6d20-7000-8000-010203040506",
    inputParams: "{ id: string }"
  },
  {
    name: "castov_timestamp",
    title: "Unix Epoch & ISO 8601 Converter",
    description:
      "Converts Unix epoch timestamps (seconds or milliseconds) or ISO date strings into UTC, ISO 8601, local time, and relative time offsets.",
    promptExample: "Convert Unix timestamp 1760868000 to ISO 8601 and UTC.",
    inputParams: "{ value: string }"
  },
  {
    name: "castov_uuid",
    title: "Cryptographic UUIDv4 / UUIDv7 / ULID Generator",
    description:
      "Generates cryptographically secure RFC 9562 UUIDv4, time-ordered UUIDv7, or lexicographically sortable ULID identifiers in batches up to 50.",
    promptExample: "Generate 5 time-ordered UUIDv7 identifiers for my database migration.",
    inputParams: "{ format?: 'uuidv4' | 'uuidv7' | 'ulid', count?: number }"
  },
  {
    name: "castov_cron",
    title: "Cron Schedule Explainer & Next Run Predictor",
    description:
      "Parses 5-field POSIX cron expressions into human-readable descriptions and computes the exact next 5 execution timestamps in any IANA timezone.",
    promptExample: "When are the next 5 runs for '*/15 9-17 * * 1-5' in America/New_York?",
    inputParams: "{ expression: string, timezone?: string }"
  },
  {
    name: "castov_timezone",
    title: "IANA Timezone Converter",
    description:
      "Converts dates, times, or timestamps accurately between any two IANA timezones with automatic DST offset calculation.",
    promptExample: "Convert 2026-06-15 14:30 from Europe/London to Asia/Tokyo.",
    inputParams: "{ dateTime: string, fromZone: string, toZone: string }"
  },
  {
    name: "castov_secret",
    title: "CSPRNG Cryptographic Secret Generator",
    description:
      "Generates high-entropy cryptographic secrets (16 to 128 bytes) in Hex, Base64, Base64URL, and ready-to-use .env key formats via Node.js crypto.randomBytes.",
    promptExample: "Generate a 256-bit cryptographic secret for my AUTH_SECRET and JWT_SECRET.",
    inputParams: "{ bytes?: number }"
  },
  {
    name: "castov_jwt_decode",
    title: "Offline JWT Header & Claims Inspector",
    description:
      "Decodes JWT header and payload claims locally, formatting issued-at (iat), not-before (nbf), and expiration (exp) timestamps without transmitting tokens over the network.",
    promptExample: "Inspect the payload claims and expiration status of this JWT token.",
    inputParams: "{ token: string }"
  },
  {
    name: "castov_hash",
    title: "Cryptographic Digest Calculator",
    description:
      "Computes deterministic cryptographic digests (MD5, SHA-1, SHA-256, SHA-384, SHA-512) in both hexadecimal and Base64 encodings.",
    promptExample: "Compute the SHA-256 hex and Base64 digest of this webhook payload.",
    inputParams: "{ text: string, algorithm?: 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512' }"
  },
  {
    name: "castov_scan_secrets",
    title: "In-Memory Secret & Credential Leak Scanner",
    description:
      "Audits code snippets, .env files, or terminal logs in-memory for leaked AWS keys, GitHub PATs, Stripe live keys, OpenAI keys, Slack tokens, and PEM private keys with redacted output.",
    promptExample: "Scan this configuration snippet for any accidentally hardcoded API keys before I commit.",
    inputParams: "{ content: string }"
  }
];

export default function McpServerPage() {
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Castov MCP Server",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Windows, macOS, Linux",
    softwareVersion: "1.4.0",
    license: "https://opensource.org/licenses/MIT",
    url: "https://castov.com/mcp",
    downloadUrl: "https://www.npmjs.com/package/castov",
    description:
      "Zero-telemetry Model Context Protocol (MCP) server exposing 10 deterministic local developer tools for AI coding agents."
  };

  return (
    <div className="layout-content max-w-5xl py-12">
      <Breadcrumb
        path="/mcp"
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Developer", href: "/developer" },
          { name: "MCP Server" }
        ]}
      />
      <JsonLd data={[websiteJsonLd(), softwareJsonLd]} />

      {/* Hero Section */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent mb-6">
          <Cpu className="w-3.5 h-3.5" />
          <span>MODEL CONTEXT PROTOCOL • STDIO JSON-RPC 2.0 • V1.4.0</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-fg mb-4">
          Castov <span className="text-accent">MCP Server</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted max-w-3xl mx-auto leading-relaxed">
          Give Claude Desktop, Cursor, Windsurf, and VS Code Copilot deterministic local execution superpowers.
          10 hardened, read-only local developer tools with no remote payload logging and zero cloud roundtrips.
        </p>

        {/* Official Glama & npm Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
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
            <span>npm: castov@1.4.0</span>
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

      {/* Interactive One-Click Configuration Copier */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-fg flex items-center gap-2.5">
            <Terminal className="w-6 h-6 text-accent" />
            <span>Quick Setup for AI Coding Agents</span>
          </h2>
          <span className="text-xs font-mono text-muted hidden sm:inline">
            Command: npx -y castov@latest mcp
          </span>
        </div>
        <McpConfigCopier />
      </section>

      {/* Interactive MCP Live Playground */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-fg flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-accent" />
            <span>Interactive MCP Live Playground</span>
          </h2>
          <span className="text-xs font-mono text-emerald-400 hidden sm:inline">
            JSON-RPC 2.0 Stdio Inspector
          </span>
        </div>
        <McpLivePlayground />
      </section>

      {/* Viral Multi-Server MCP Stack Composer */}
      <section className="mb-16">
        <McpStackBuilder />
      </section>

      <SponsorSlot context="mcp" />

      {/* Why Castov MCP Architecture Cards */}
      <section className="grid sm:grid-cols-3 gap-6 mb-16">
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
      </section>

      {/* Complete 10-Tool Catalog */}
      <section className="mb-16">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-accent uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Complete Tool Specification</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-fg">
            Available MCP Tools
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

      {/* Bottom CTA */}
      <div className="p-8 rounded-2xl border border-line bg-card text-center">
        <h2 className="text-2xl font-bold text-fg mb-2">
          Ready to supercharge your AI coding assistant?
        </h2>
        <p className="text-sm text-muted max-w-xl mx-auto mb-6">
          Run Castov directly via <code className="text-fg bg-field px-1.5 py-0.5 rounded">npx -y castov@latest mcp</code> or explore all 61 interactive browser utilities (including 10 experimental Labs) and CLI commands.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/cli" className="btn btn-primary px-6 py-3 text-sm font-bold">
            Explore Terminal CLI Commands
          </Link>
          <Link href="/tools" className="btn bg-field border border-line text-fg px-6 py-3 text-sm font-bold hover:bg-hover">
            Browse 61 Browser Utilities
          </Link>
        </div>
      </div>
    </div>
  );
}
