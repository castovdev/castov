import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/content/guides";
import { TOOL_CATEGORIES, TOOLS } from "@/content/tools";
import { StaticPage } from "@/components/static-page";
import { ToolCard } from "@/components/tool-card";
import { PinnedToolsTray } from "@/components/pinned-tools";
import { JsonLd } from "@/components/json-ld";
import { buildMetadata, softwareAppJsonLd, techArticleJsonLd } from "@/lib/seo";

const TITLE = "All Developer Tools | Castov";
const DESCRIPTION =
  "Browse all free Castov tools: timestamp converters, date calculators, time zone tools, developer utilities, and experimental labs.";

export const metadata: Metadata = buildMetadata({ title: TITLE, description: DESCRIPTION, path: "/tools" });

export default function ToolsPage() {
  const mainCategories = TOOL_CATEGORIES.filter((c) => c !== "Labs");
  const labsTools = TOOLS.filter((t) => t.category === "Labs");

  return (
    <StaticPage
      title="Tools"
      intro={`${TOOLS.length} free tools for working with Unix time, dates, configurations, and developer workflows. Most tools run instantly in your browser. Some Labs and Cloud features use peer-to-peer signaling or encrypted cloud storage.`}
      crumbs={[{ name: "Home", href: "/" }, { name: "Tools" }]}
      path="/tools"
    >
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: "Castov Developer Toolbox & MCP Suite",
            description: DESCRIPTION,
            url: "/tools",
            category: "DeveloperApplication",
          }),
          techArticleJsonLd({
            headline: TITLE,
            description: DESCRIPTION,
            path: "/tools",
          }),
        ]}
      />
      <PinnedToolsTray />

      {/* Featured Radar Banner */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="p-5 rounded-2xl bg-card border border-line shadow-xs flex flex-col justify-between hover:border-accent transition-colors">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-accent/10 text-accent border border-accent/20 mb-2">
              40 PATTERNS
            </div>
            <h2 className="text-lg font-bold text-fg">Regex Patterns Lab</h2>
            <p className="mt-1 text-sm text-muted">
              Interactive regular expression tester with live match highlighting, token breakdowns, and code generators in 6 languages.
            </p>
          </div>
          <Link href="/regex-patterns" className="mt-4 text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1">
            Browse Regex Patterns &rarr;
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-line shadow-xs flex flex-col justify-between hover:border-accent transition-colors">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-2">
              54 ERROR GUIDES
            </div>
            <h2 className="text-lg font-bold text-fg">Error Fix Encyclopedia</h2>
            <p className="mt-1 text-sm text-muted">
              Diagnose and solve production errors: Next.js 16, Docker Compose, Supabase RLS, Prisma, Postgres locks, and MCP stdio issues.
            </p>
          </div>
          <Link href="/error-fixes" className="mt-4 text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1">
            Explore Error Fixes &rarr;
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-line shadow-xs flex flex-col justify-between hover:border-accent transition-colors">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20 mb-2">
              ZERO-TELEMETRY VS CLOUD
            </div>
            <h2 className="text-lg font-bold text-fg">Comparisons (/vs)</h2>
            <p className="mt-1 text-sm text-muted">
              Compare Castov CLI &amp; Grade A MCP Server against Snyk, dotenvx, jwt.io, Crontab.guru, and legacy CLIs.
            </p>
          </div>
          <Link href="/vs" className="mt-4 text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1">
            Compare Alternatives &rarr;
          </Link>
        </div>
      </div>
      {mainCategories.map((category) => {
        const tools = TOOLS.filter((t) => t.category === category);
        return (
          <section key={category} aria-labelledby={`cat-${category}`} className="mb-10">
            <h2 id={`cat-${category}`} className="mb-4 text-xl font-bold tracking-tight">
              {category} ({tools.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((t) => (
                <ToolCard key={t.slug} tool={t} headingLevel={3} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Labs Section (Positioned Below Main Categories) */}
      <section aria-labelledby="cat-Labs" className="mb-12 mt-14 pt-8 border-t border-line">
        <div className="flex items-center gap-3 mb-4">
          <h2 id="cat-Labs" className="text-xl font-bold tracking-tight text-fg">
            Labs ({labsTools.length})
          </h2>
          <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Experimental tools
          </span>
        </div>
        <p className="text-sm text-muted mb-6">
          Advanced experiments in browser-to-browser networking, steganography, AST manipulation, and client-side computing.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {labsTools.map((t) => (
            <ToolCard key={t.slug} tool={t} headingLevel={3} />
          ))}
        </div>
      </section>

      <h2>Learn the background</h2>
      <p>
        Not sure which tool you need? Start with{" "}
        <Link href={`/guides/${GUIDES[0].slug}`}>{GUIDES[0].name}</Link>, or browse all <Link href="/guides">guides</Link>.
      </p>
    </StaticPage>
  );
}
