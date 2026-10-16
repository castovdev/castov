import type { Metadata } from "next";
import Link from "next/link";
import { TOOLS } from "@/content/tools";
import { GUIDES } from "@/content/guides";
import { CODE_CONVERTERS } from "@/lib/code-converters-registry";
import { REGEX_PATTERNS } from "@/lib/regex-patterns-registry";
import { ERROR_FIXES } from "@/lib/error-fixes-registry";
import { TIMEZONE_PAIRS } from "@/lib/timezone-pairs-registry";
import { NETWORK_PORTS, CIDR_BLOCKS } from "@/lib/network-ports-registry";
import { TECH_TREND_TOPICS } from "@/lib/tech-trends-registry";
import { CLOUD_SERVICES } from "@/lib/cloud-status-registry";
import { LLM_MODELS } from "@/lib/llm-specs-registry";
import { AI_TOOLS } from "@/lib/ai-tools";
import { CRON_PRESETS } from "@/lib/time/cron-presets";
import { HTTP_STATUS_CODES } from "@/lib/http-statuses";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = buildMetadata({
  title: "Castov Complete Site Directory & Developer Index (All 900+ Tools & Pages)",
  description: "Complete HTML sitemap and directory of all Castov developer utilities, timezone converters, code schema generators, regex patterns, error fixes, network ports, CIDR blocks, and Linux chmod references.",
  path: "/directory",
});

// Generate all 512 octal chmod codes (000 to 777)
const ALL_CHMOD_CODES: string[] = [];
for (let o = 0; o < 8; o++) {
  for (let g = 0; g < 8; g++) {
    for (let p = 0; p < 8; p++) {
      ALL_CHMOD_CODES.push(`${o}${g}${p}`);
    }
  }
}

export default function SiteDirectoryPage() {
  return (
    <div className="layout-content py-10 space-y-12">
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Home", href: "/" },
            { name: "Site Directory" },
          ],
          "/directory"
        )}
      />

      <header className="space-y-3 border-b border-line pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
          Complete Platform Index • 900+ Static Pages
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
          Castov Complete Developer Directory
        </h1>
        <p className="text-muted max-w-3xl text-sm sm:text-base">
          Browse every interactive developer tool, timezone pair converter, schema generator, regex pattern, network port guide, CIDR block, and Linux permission reference on Castov.
        </p>
      </header>

      {/* 1. Core Hubs */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-fg">1. Platform Hubs &amp; Flagship Workbenches</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-sm">
          {[
            { href: "/tools", label: "All Developer Tools" },
            { href: "/time", label: "Global Timezone Matrix" },
            { href: "/ports", label: "Network Ports & CIDR Hub" },
            { href: "/convert", label: "Code & Schema Converters" },
            { href: "/regex-patterns", label: "Regex Patterns Lab" },
            { href: "/error-fixes", label: "Developer Error Fixes" },
            { href: "/tech-trends", label: "Tech Pulse Radar" },
            { href: "/ai", label: "AI Developer Hub" },
            { href: "/cursorrules", label: "Cursor Rules Generator" },
            { href: "/timestamps", label: "Unix Timestamps Hub" },
            { href: "/timezones", label: "Time Zones Hub" },
            { href: "/cron", label: "Cron Expression Hub" },
            { href: "/http-status", label: "HTTP Status Codes Hub" },
            { href: "/guides", label: "Engineering Guides" },
            { href: "/cheatsheets", label: "Developer Cheatsheets" },
            { href: "/cli", label: "Castov Terminal CLI" },
          ].map((hub) => (
            <Link
              key={hub.href}
              href={hub.href}
              className="p-3 rounded-xl bg-card hover:bg-hover border border-line font-semibold text-fg hover:text-accent transition-colors no-underline"
            >
              {hub.label}
            </Link>
          ))}
        </div>
      </section>

      {/* 2. Core Developer Tools */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-fg">2. Interactive Developer Tools ({TOOLS.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs sm:text-sm">
          {TOOLS.map((t) => (
            <Link
              key={t.slug}
              href={`/${t.slug}`}
              className="px-3 py-2 rounded-lg bg-card/60 hover:bg-hover border border-line/60 text-fg hover:text-accent truncate transition-colors no-underline"
            >
              {t.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Global Timezone Pair Converters */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-fg">3. Global Timezone Pair Converters ({TIMEZONE_PAIRS.length})</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
          {TIMEZONE_PAIRS.map((p) => (
            <Link
              key={p.slug}
              href={`/time/${p.slug}`}
              className="px-3 py-2 rounded-lg bg-card/60 hover:bg-hover border border-line/60 text-fg hover:text-accent truncate transition-colors no-underline"
            >
              {p.from.code} to {p.to.code} ({p.from.city})
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Network Ports & CIDR Blocks */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-fg">4. Network Ports ({NETWORK_PORTS.length}) &amp; IPv4 CIDR Subnets ({CIDR_BLOCKS.length})</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
          {NETWORK_PORTS.map((p) => (
            <Link
              key={p.port}
              href={`/ports/${p.port}`}
              className="px-3 py-2 rounded-lg bg-card/60 hover:bg-hover border border-line/60 text-fg hover:text-accent truncate transition-colors no-underline font-mono"
            >
              Port {p.port} ({p.service})
            </Link>
          ))}
          {CIDR_BLOCKS.map((c) => (
            <Link
              key={c.prefix}
              href={`/cidr/${c.prefix}`}
              className="px-3 py-2 rounded-lg bg-card/60 hover:bg-hover border border-line/60 text-fg hover:text-accent truncate transition-colors no-underline font-mono"
            >
              /{c.prefix} CIDR ({c.subnetMask})
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Code & Schema Converters */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-fg">5. Code &amp; Schema Converters ({CODE_CONVERTERS.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs sm:text-sm">
          {CODE_CONVERTERS.map((c) => (
            <Link
              key={c.slug}
              href={`/convert/${c.slug}`}
              className="px-3 py-2 rounded-lg bg-card/60 hover:bg-hover border border-line/60 text-fg hover:text-accent truncate transition-colors no-underline"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Regex Patterns Lab */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-fg">6. Regex Patterns Library ({REGEX_PATTERNS.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs sm:text-sm">
          {REGEX_PATTERNS.map((r) => (
            <Link
              key={r.slug}
              href={`/regex-patterns/${r.slug}`}
              className="px-3 py-2 rounded-lg bg-card/60 hover:bg-hover border border-line/60 text-fg hover:text-accent truncate transition-colors no-underline"
            >
              {r.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 7. Developer Error Fixes */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-fg">7. Developer Error Fix Encyclopedia ({ERROR_FIXES.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs sm:text-sm">
          {ERROR_FIXES.map((e) => (
            <Link
              key={e.slug}
              href={`/error-fixes/${e.slug}`}
              className="px-3 py-2 rounded-lg bg-card/60 hover:bg-hover border border-line/60 text-fg hover:text-accent truncate transition-colors no-underline"
            >
              {e.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 8. AI Developer Tools & Live Tech Trend Topic Radars */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-fg">8. AI Developer Hub ({AI_TOOLS.length}), Live Tech Trends ({TECH_TREND_TOPICS.length}) &amp; LLM Hardware Calculators ({LLM_MODELS.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs sm:text-sm">
          {AI_TOOLS.map((a) => (
            <Link
              key={a.slug}
              href={`/ai/${a.slug}`}
              className="px-3 py-2 rounded-lg bg-card/60 hover:bg-hover border border-line/60 text-fg hover:text-accent truncate transition-colors no-underline"
            >
              {a.name}
            </Link>
          ))}
          {TECH_TREND_TOPICS.map((tt) => (
            <Link
              key={tt.slug}
              href={`/tech-trends/${tt.slug}`}
              className="px-3 py-2 rounded-lg bg-card/60 hover:bg-hover border border-line/60 text-fg hover:text-accent truncate transition-colors no-underline"
            >
              Trend Radar: #{tt.slug} ({tt.name})
            </Link>
          ))}
          {LLM_MODELS.map((m) => (
            <Link
              key={m.slug}
              href={`/llm/${m.slug}`}
              className="px-3 py-2 rounded-lg bg-card/60 hover:bg-hover border border-line/60 text-fg hover:text-accent truncate transition-colors no-underline"
            >
              LLM Calc: {m.name} ({m.creator})
            </Link>
          ))}
        </div>
      </section>

      {/* Cloud Outage Radar & cURL Tools */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-fg">Cloud &amp; AI Status Radar ({CLOUD_SERVICES.length}) &amp; cURL Code Converters</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
          <Link
            href="/curl-converter"
            className="px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent font-semibold truncate transition-colors no-underline"
          >
            cURL to Code Converter (Fetch/Python/Go/Rust)
          </Link>
          {CLOUD_SERVICES.map((s) => (
            <Link
              key={s.slug}
              href={`/status/${s.slug}`}
              className="px-3 py-2 rounded-lg bg-card/60 hover:bg-hover border border-line/60 text-fg hover:text-accent truncate transition-colors no-underline"
            >
              Status: {s.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 9. Guides, Cron & HTTP Statuses */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-fg">9. Engineering Guides, Cron Schedules &amp; HTTP Status Codes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
          {GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="px-3 py-2 rounded-lg bg-card/60 hover:bg-hover border border-line/60 text-fg hover:text-accent truncate transition-colors no-underline"
            >
              Guide: {g.name}
            </Link>
          ))}
          {CRON_PRESETS.map((cp) => (
            <Link
              key={cp.slug}
              href={`/cron/${cp.slug}`}
              className="px-3 py-2 rounded-lg bg-card/60 hover:bg-hover border border-line/60 text-fg hover:text-accent truncate transition-colors no-underline"
            >
              Cron: {cp.title}
            </Link>
          ))}
          {Object.entries(HTTP_STATUS_CODES).map(([code, status]) => (
            <Link
              key={code}
              href={`/http-status/${code}`}
              className="px-3 py-2 rounded-lg bg-card/60 hover:bg-hover border border-line/60 text-fg hover:text-accent truncate transition-colors no-underline font-mono"
            >
              HTTP {status.title}
            </Link>
          ))}
        </div>
      </section>

      {/* 10. All 512 Linux Chmod Octal Permissions (Cures Orphan Pages in Google Search Console) */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-fg">10. Complete Linux Chmod Octal Reference (000 to 777 — All 512 Combinations)</h2>
        <p className="text-xs text-muted">
          Direct reference links for every three-digit octal file permission mode in Linux and Unix.
        </p>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-1.5 text-center font-mono text-xs">
          {ALL_CHMOD_CODES.map((code) => (
            <Link
              key={code}
              href={`/chmod/${code}`}
              className="py-1.5 px-1 rounded bg-card/50 hover:bg-accent hover:text-white border border-line/50 text-fg transition-colors no-underline"
            >
              {code}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
