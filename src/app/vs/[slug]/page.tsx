import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VS_COMPARISONS, getVsComparisonBySlug } from "@/lib/vs-registry";
import {
  buildMetadata,
  breadcrumbJsonLd,
  faqJsonLd,
  howToJsonLd,
  softwareAppJsonLd,
  techArticleJsonLd,
} from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { FaqSection } from "@/components/faq-section";
import { SponsorSlot } from "@/components/sponsor-slot";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Terminal,
  Sparkles,
  Scale,
} from "lucide-react";

interface Params {
  slug: string;
}

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return VS_COMPARISONS.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getVsComparisonBySlug(slug);
  if (!item) return {};

  return buildMetadata({
    title: item.seoTitle,
    description: item.summary,
    path: `/vs/${item.slug}`,
  });
}

export default async function VsComparisonPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const item = getVsComparisonBySlug(slug);
  if (!item) notFound();

  const otherComparisons = VS_COMPARISONS.filter((c) => c.slug !== item.slug);

  return (
    <div className="layout-content max-w-5xl py-10 space-y-12">
      {/* Full Schema Stack: Breadcrumb + SoftwareApplication + TechArticle + HowTo + FAQPage */}
      <JsonLd
        data={[
          breadcrumbJsonLd(
            [
              { name: "Home", href: "/" },
              { name: "Comparisons", href: "/vs" },
              { name: `Castov vs ${item.competitorName}` },
            ],
            `/vs/${item.slug}`
          ),
          softwareAppJsonLd({
            name: `Castov (${item.competitorName} Alternative)`,
            description: item.summary,
            url: `/vs/${item.slug}`,
            category: "DeveloperApplication",
          }),
          techArticleJsonLd({
            headline: item.title,
            description: item.summary,
            path: `/vs/${item.slug}`,
            dependencies: "Node.js >= 18, npx castov, Model Context Protocol (MCP)",
          }),
          howToJsonLd({
            name: `How to Adopt Castov as a Local Alternative (No Behavioral Telemetry) to ${item.competitorName}`,
            description: item.verdictSummary,
            steps: item.howToMigrateSteps,
          }),
          faqJsonLd(item.faqs),
        ]}
      />

      <Breadcrumb
        path={`/vs/${item.slug}`}
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Comparisons", href: "/vs" },
          { name: `Castov vs ${item.competitorName}` },
        ]}
      />

      {/* Hero Header */}
      <header className="p-6 sm:p-10 rounded-3xl bg-card border border-line space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold">
            <Scale className="w-3.5 h-3.5" />
            {item.competitorCategory}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% Offline &amp; Free Alternative
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-fg">
          {item.title}
        </h1>

        <p className="text-muted text-base sm:text-lg max-w-3xl leading-relaxed">
          {item.summary}
        </p>

        {/* Quick Command Box */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-[#0b101b] border border-slate-800 space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Instant Terminal CLI (Zero Sign-Up)
            </div>
            <div className="font-mono text-sm text-emerald-400 select-all">
              {item.castovCommand}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[#0b101b] border border-slate-800 space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              AI Agent MCP Server (Claude / Cursor)
            </div>
            <div className="font-mono text-sm text-sky-400 select-all">
              {item.mcpCommand}
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link
            href={item.castovToolUrl}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4" />
            Open {item.castovToolName}
          </Link>
          <Link
            href="/mcp"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-field border border-line text-fg font-semibold text-sm hover:border-accent transition-colors"
          >
            <Cpu className="w-4 h-4 text-accent" />
            Test in MCP Live Playground
          </Link>
        </div>
      </header>

      {/* Executive Verdict Box */}
      <section className="p-6 rounded-2xl bg-accent/5 border border-accent/20 space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-accent">
          Architectural Verdict (TL;DR)
        </div>
        <p className="text-sm sm:text-base text-fg leading-relaxed">
          {item.verdictSummary}
        </p>
      </section>

      {/* Feature Matrix Table */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-fg">
          Feature-by-Feature Comparison: Castov vs. {item.competitorName}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-field/60">
                <th className="py-3.5 px-4 font-bold text-fg">Capability / Dimension</th>
                <th className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                  Castov (v1.4.0)
                </th>
                <th className="py-3.5 px-4 font-bold text-muted">
                  {item.competitorName}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {item.rows.map((row) => (
                <tr key={row.feature} className="hover:bg-field/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-fg">{row.feature}</td>
                  <td className="py-3.5 px-4 text-fg">
                    <span className="inline-flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{row.castov}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-muted">{row.competitor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* When to Choose Which */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-card border border-emerald-500/30 space-y-4">
          <h2 className="text-lg font-bold text-fg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            When to Choose Castov
          </h2>
          <ul className="space-y-3 text-sm text-muted">
            {item.whenToUseCastov.map((point) => (
              <li key={point} className="flex items-start gap-2.5 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-line space-y-4">
          <h2 className="text-lg font-bold text-fg flex items-center gap-2">
            <Terminal className="w-5 h-5 text-muted" />
            When to Keep {item.competitorName}
          </h2>
          <ul className="space-y-3 text-sm text-muted">
            {item.whenToUseCompetitor.map((point) => (
              <li key={point} className="flex items-start gap-2.5 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-muted mt-2 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Step-by-Step Adoption (Matches HowTo Schema) */}
      <section className="p-6 sm:p-8 rounded-2xl bg-card border border-line space-y-6">
        <h2 className="text-2xl font-bold text-fg">
          How to Run Castov in 60 Seconds (Zero Config)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {item.howToMigrateSteps.map((step, index) => (
            <div
              key={step.name}
              className="p-5 rounded-xl bg-field/50 border border-line space-y-2"
            >
              <div className="text-xs font-mono font-bold text-accent">
                STEP 0{index + 1}
              </div>
              <h3 className="font-bold text-fg text-sm">{step.name}</h3>
              <p className="text-xs text-muted leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <SponsorSlot context="devops" />

      {/* FAQ Section */}
      <FaqSection items={item.faqs} />

      {/* Related Comparisons */}
      <section className="space-y-4 pt-6 border-t border-line">
        <h2 className="text-xl font-bold text-fg">Explore More Comparisons</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {otherComparisons.map((other) => (
            <Link
              key={other.slug}
              href={`/vs/${other.slug}`}
              className="p-4 rounded-xl bg-card border border-line hover:border-accent transition-colors flex flex-col justify-between gap-3"
            >
              <div>
                <div className="text-[11px] font-semibold text-accent">
                  {other.competitorCategory}
                </div>
                <div className="font-bold text-sm text-fg mt-1">
                  Castov vs. {other.competitorName}
                </div>
              </div>
              <span className="text-xs font-semibold text-accent inline-flex items-center gap-1">
                Compare <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
