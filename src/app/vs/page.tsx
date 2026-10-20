import type { Metadata } from "next";
import Link from "next/link";
import { VS_COMPARISONS } from "@/lib/vs-registry";
import { buildMetadata, breadcrumbJsonLd, faqJsonLd, techArticleJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { SponsorSlot } from "@/components/sponsor-slot";
import { ArrowRight, CheckCircle2, ShieldCheck, Terminal, Cpu, Zap } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Castov vs Alternatives — Offline-First DevSecOps & MCP Comparisons (2026)",
  description:
    "Objective technical comparisons between Castov (Zero-Telemetry CLI & Glama Grade A MCP Server) and cloud alternatives: Snyk, dotenv/dotenvx, jwt.io, Crontab.guru, and traditional shell CLIs.",
  path: "/vs",
});

export default function VsIndexPage() {
  const faqs = [
    {
      q: "How are Castov's technical comparisons evaluated?",
      a: "Every comparison on Castov is based on verifiable architectural properties: local offline execution vs. cloud SaaS roundtrips, account/token requirements, native Model Context Protocol (MCP) JSON-RPC 2.0 support, and open-source licensing.",
    },
    {
      q: "Is Castov completely free for commercial and enterprise use?",
      a: "Yes. Both the Castov CLI (`npx castov`), the MCP Server (`npx -y castov@latest mcp`), and `@castov/sdk` are MIT-licensed, 100% free, and operate locally with no behavioral telemetry.",
    },
  ];

  return (
    <div className="layout-content max-w-5xl py-10 space-y-12">
      <JsonLd
        data={[
          breadcrumbJsonLd(
            [
              { name: "Home", href: "/" },
              { name: "Comparisons & Alternatives (/vs)" },
            ],
            "/vs"
          ),
          techArticleJsonLd({
            headline: "Castov vs Cloud DevSecOps Alternatives — Architectural Comparisons",
            description:
              "Compare Castov's zero-telemetry local execution engine and Grade A MCP Server against Snyk, dotenv, jwt.io, Crontab.guru, and traditional CLIs.",
            path: "/vs",
          }),
          faqJsonLd(faqs),
        ]}
      />

      <Breadcrumb
        path="/vs"
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Comparisons & Alternatives" },
        ]}
      />

      {/* Hero Section */}
      <header className="p-6 sm:p-10 rounded-3xl bg-card border border-line space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          Zero-Telemetry • 100% Local Execution • Glama Grade A MCP
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-fg">
          Castov vs. Cloud DevTools &amp; Legacy CLIs
        </h1>
        <p className="text-muted text-base sm:text-lg max-w-3xl leading-relaxed">
          Why send sensitive `.env` secrets, production JWTs, or internal CIDR architectures to cloud SaaS dashboards? See how Castov&apos;s deterministic local CLI (<code className="text-fg font-mono">npx castov</code>) and MCP Server (<code className="text-fg font-mono">npx -y castov@latest mcp</code>) compare against popular developer tools.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0b101b] border border-slate-800 font-mono text-xs sm:text-sm text-emerald-400">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span>npx -y castov@latest mcp</span>
          </div>
          <Link
            href="/mcp"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs sm:text-sm hover:opacity-90 transition-opacity"
          >
            <Cpu className="w-4 h-4" />
            Launch Live MCP Playground
          </Link>
        </div>
      </header>

      {/* Comparison Cards Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-fg">
            Head-to-Head Architectural Breakdowns ({VS_COMPARISONS.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {VS_COMPARISONS.map((item) => (
            <Link
              key={item.slug}
              href={`/vs/${item.slug}`}
              className="group p-6 rounded-2xl bg-card border border-line hover:border-accent transition-all flex flex-col justify-between space-y-5 shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-accent text-xs font-bold">
                    {item.competitorCategory}
                  </span>
                  <span className="text-xs font-mono text-muted">
                    /vs/{item.slug}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-fg group-hover:text-accent transition-colors">
                  Castov vs. {item.competitorName}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-line flex items-center justify-between text-xs">
                <code className="px-2.5 py-1 rounded bg-field border border-line font-mono text-fg">
                  {item.castovCommand}
                </code>
                <span className="font-semibold text-accent inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Read Comparison <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Core Pillars */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-line space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-fg">Zero Cloud Telemetry</h3>
          <p className="text-xs text-muted leading-relaxed">
            Every scan, token decode, and subnet calculation runs strictly in local memory. No accounts, no API keys, and zero network calls.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-line space-y-2">
          <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-fg">Native MCP Protocol</h3>
          <p className="text-xs text-muted leading-relaxed">
            Built from the ground up for Claude Desktop, Cursor, and Windsurf with 10 deterministic JSON-RPC 2.0 tools.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-line space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-fg">Sub-150ms Cold Starts</h3>
          <p className="text-xs text-muted leading-relaxed">
            Zero dependency bloat. Powered by pure Node.js WebCrypto and Intl engines for instant CI/CD and terminal execution.
          </p>
        </div>
      </section>

      <SponsorSlot context="devops" />

      {/* FAQ Section */}
      <section className="space-y-4 pt-4 border-t border-line">
        <h2 className="text-2xl font-bold text-fg">Frequently Asked Questions</h2>
        <div className="grid gap-4">
          {faqs.map((f) => (
            <div key={f.q} className="p-5 rounded-2xl bg-card border border-line space-y-2">
              <h3 className="font-bold text-fg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {f.q}
              </h3>
              <p className="text-sm text-muted leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
