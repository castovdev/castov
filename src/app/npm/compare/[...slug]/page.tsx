import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Code2,
  Terminal,
  Check,
  X,
  FileCode,
  Package,
  Layers,
  Sparkles,
  Download,
  AlertTriangle,
} from "lucide-react";
import { buildMetadata, faqJsonLd, webPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { FaqSection } from "@/components/faq-section";
import { fetchNpmPackageReport } from "@/lib/npm-service";
import {
  POPULAR_NPM_COMPARISONS,
  getComparisonSlug,
  parseComparisonSlug,
} from "@/lib/npm-comparisons";

export const dynamicParams = true;

export function generateStaticParams() {
  return POPULAR_NPM_COMPARISONS.slice(0, 30).map((c) => ({
    slug: [getComparisonSlug(c.pkg1, c.pkg2)],
  }));
}

function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return "N/A";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const resolved = await params;
  const parsed = parseComparisonSlug(resolved.slug);

  if (!parsed) {
    return buildMetadata({
      title: "NPM Package Comparison | Castov",
      description: "Compare NPM packages head-to-head for size, downloads, and supply chain security.",
      path: "/npm/compare",
    });
  }

  const { pkg1, pkg2 } = parsed;
  const [rep1, rep2] = await Promise.all([
    fetchNpmPackageReport(pkg1),
    fetchNpmPackageReport(pkg2),
  ]);

  const name1 = rep1?.name || pkg1;
  const name2 = rep2?.name || pkg2;

  const score1 = rep1?.securityScore ?? 100;
  const score2 = rep2?.securityScore ?? 100;

  return buildMetadata({
    title: `Compare ${name1} vs ${name2}: Size, Security & Performance | Castov`,
    description: `Head-to-head comparison of ${name1} vs ${name2}: weekly downloads, bundle size, security scores (${score1}/100 vs ${score2}/100), license, and TypeScript support.`,
    path: `/npm/compare/${getComparisonSlug(pkg1, pkg2)}`,
  });
}

export default async function NpmComparisonPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const resolved = await params;
  const parsed = parseComparisonSlug(resolved.slug);

  if (!parsed) {
    return notFound();
  }

  const { pkg1, pkg2 } = parsed;
  const [rep1, rep2] = await Promise.all([
    fetchNpmPackageReport(pkg1),
    fetchNpmPackageReport(pkg2),
  ]);

  if (!rep1 || !rep2) {
    return notFound();
  }

  const canonicalSlug = getComparisonSlug(pkg1, pkg2);

  // Grade color helpers
  const getGradeBadge = (grade: string) => {
    if (grade === "A+" || grade === "A")
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (grade === "B")
      return "text-sky-400 bg-sky-500/10 border-sky-500/30";
    if (grade === "C")
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-rose-400 bg-rose-500/10 border-rose-500/30";
  };

  // Determine winners
  const downloadsWinner =
    (rep1.weeklyDownloads || 0) > (rep2.weeklyDownloads || 0)
      ? rep1.name
      : (rep2.weeklyDownloads || 0) > (rep1.weeklyDownloads || 0)
      ? rep2.name
      : null;

  const securityWinner =
    rep1.securityScore > rep2.securityScore
      ? rep1.name
      : rep2.securityScore > rep1.securityScore
      ? rep2.name
      : null;

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "NPM Inspector", href: "/npm" },
    { name: "Compare", href: "/npm/compare" },
    { name: `${rep1.name} vs ${rep2.name}` },
  ];

  const faqs = [
    {
      q: `Which package is more popular, ${rep1.name} or ${rep2.name}?`,
      a: `${
        downloadsWinner
          ? `${downloadsWinner} is currently more popular with higher weekly downloads (${formatNumber(
              downloadsWinner === rep1.name ? rep1.weeklyDownloads : rep2.weeklyDownloads
            )}/week) compared to ${
              downloadsWinner === rep1.name ? rep2.name : rep1.name
            } (${formatNumber(
              downloadsWinner === rep1.name ? rep2.weeklyDownloads : rep1.weeklyDownloads
            )}/week).`
          : `Both packages enjoy comparable weekly adoption in the JavaScript ecosystem.`
      }`,
    },
    {
      q: `Which has better supply chain security, ${rep1.name} or ${rep2.name}?`,
      a: `${rep1.name} has a security score of ${rep1.securityScore}/100 (Grade ${rep1.securityGrade}), while ${rep2.name} holds ${rep2.securityScore}/100 (Grade ${rep2.securityGrade}). ${
        securityWinner ? `${securityWinner} scores higher for supply chain hygiene.` : "Both packages have equal security standings."
      }`,
    },
    {
      q: `Do ${rep1.name} and ${rep2.name} provide TypeScript definitions?`,
      a: `${rep1.name} ${rep1.hasTypes ? "includes built-in TypeScript types" : "may require external @types definitions"}, while ${rep2.name} ${rep2.hasTypes ? "includes native TypeScript definitions" : "may require community @types definitions"}.`,
    },
    {
      q: `What licenses do ${rep1.name} and ${rep2.name} use?`,
      a: `${rep1.name} is published under the ${rep1.license} license (${rep1.licenseType}), and ${rep2.name} is licensed under ${rep2.license} (${rep2.licenseType}).`,
    },
  ];

  // Related comparisons (filter by matching category or package)
  const relatedComparisons = POPULAR_NPM_COMPARISONS.filter(
    (c) =>
      getComparisonSlug(c.pkg1, c.pkg2) !== canonicalSlug &&
      (c.pkg1 === pkg1 || c.pkg2 === pkg1 || c.pkg1 === pkg2 || c.pkg2 === pkg2)
  ).slice(0, 6);

  // Fallback to top general comparisons if none matched directly
  const displayRelated =
    relatedComparisons.length >= 3
      ? relatedComparisons
      : POPULAR_NPM_COMPARISONS.filter(
          (c) => getComparisonSlug(c.pkg1, c.pkg2) !== canonicalSlug
        ).slice(0, 6);

  return (
    <div className="layout-content max-w-5xl py-8 sm:py-14">
      <JsonLd
        data={[
          webPageJsonLd({
            name: `${rep1.name} vs ${rep2.name} NPM Comparison`,
            description: `Head-to-head comparison of ${rep1.name} and ${rep2.name}: downloads, security grade, size, and TypeScript support.`,
            path: `/npm/compare/${canonicalSlug}`,
          }),
          faqJsonLd(faqs),
        ]}
      />

      <Breadcrumb path={`/npm/compare/${canonicalSlug}`} crumbs={breadcrumbs} />

      {/* Hero Header */}
      <div className="text-center mt-6 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-xs font-bold text-accent mb-4 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Head-to-Head NPM Comparison</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-fg tracking-tight font-mono">
          <Link href={`/npm/${rep1.name}`} className="hover:text-accent transition-colors">
            {rep1.name}
          </Link>
          <span className="text-muted-fg mx-3 font-sans font-light">vs</span>
          <Link href={`/npm/${rep2.name}`} className="hover:text-accent transition-colors">
            {rep2.name}
          </Link>
        </h1>

        <p className="text-muted-fg text-base sm:text-lg max-w-2xl mx-auto mt-3">
          Detailed package comparison for bundle size, weekly downloads, supply chain security, and license obligations.
        </p>
      </div>

      {/* Quick Verdict Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-4 border border-border/70 rounded-xl bg-card/60">
          <div className="text-xs text-muted-fg uppercase font-bold tracking-wider mb-1">
            Weekly Downloads Leader
          </div>
          <div className="text-base font-bold text-fg flex items-center justify-between">
            <span>{downloadsWinner || "Tie"}</span>
            <span className="text-xs font-mono text-accent">
              {downloadsWinner === rep1.name
                ? `${formatNumber(rep1.weeklyDownloads)}/wk`
                : downloadsWinner === rep2.name
                ? `${formatNumber(rep2.weeklyDownloads)}/wk`
                : ""}
            </span>
          </div>
        </div>

        <div className="card p-4 border border-border/70 rounded-xl bg-card/60">
          <div className="text-xs text-muted-fg uppercase font-bold tracking-wider mb-1">
            Security Grade Leader
          </div>
          <div className="text-base font-bold text-fg flex items-center justify-between">
            <span>{securityWinner || "Equal Rating"}</span>
            <span className="text-xs font-mono text-emerald-400">
              {securityWinner === rep1.name
                ? `${rep1.securityScore}/100`
                : securityWinner === rep2.name
                ? `${rep2.securityScore}/100`
                : `${rep1.securityScore}/100`}
            </span>
          </div>
        </div>

        <div className="card p-4 border border-border/70 rounded-xl bg-card/60">
          <div className="text-xs text-muted-fg uppercase font-bold tracking-wider mb-1">
            TypeScript Ready
          </div>
          <div className="text-base font-bold text-fg flex items-center justify-between">
            <span>
              {rep1.hasTypes && rep2.hasTypes
                ? "Both Native"
                : rep1.hasTypes
                ? rep1.name
                : rep2.hasTypes
                ? rep2.name
                : "External Types"}
            </span>
            <FileCode className="w-4 h-4 text-sky-400" />
          </div>
        </div>
      </div>

      {/* Head-to-Head Comparison Table */}
      <div className="card border border-border/80 rounded-2xl overflow-hidden shadow-xl mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/20">
                <th className="p-4 sm:p-5 font-bold text-muted-fg uppercase tracking-wider text-xs w-1/3">
                  Specification
                </th>
                <th className="p-4 sm:p-5 font-bold font-mono text-fg text-base w-1/3 border-l border-border/60">
                  <div className="flex items-center justify-between">
                    <span>{rep1.name}</span>
                    <span className="text-xs font-normal text-muted-fg font-sans">
                      v{rep1.version}
                    </span>
                  </div>
                </th>
                <th className="p-4 sm:p-5 font-bold font-mono text-fg text-base w-1/3 border-l border-border/60">
                  <div className="flex items-center justify-between">
                    <span>{rep2.name}</span>
                    <span className="text-xs font-normal text-muted-fg font-sans">
                      v{rep2.version}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {/* Row: Weekly Downloads */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-4 sm:p-5 font-semibold text-fg flex items-center gap-2">
                  <Download className="w-4 h-4 text-accent" />
                  <span>Weekly Downloads</span>
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60 font-mono font-bold">
                  {formatNumber(rep1.weeklyDownloads)}
                  {downloadsWinner === rep1.name && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-accent/20 text-accent rounded font-sans font-bold">
                      Winner
                    </span>
                  )}
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60 font-mono font-bold">
                  {formatNumber(rep2.weeklyDownloads)}
                  {downloadsWinner === rep2.name && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-accent/20 text-accent rounded font-sans font-bold">
                      Winner
                    </span>
                  )}
                </td>
              </tr>

              {/* Row: Unpacked Size */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-4 sm:p-5 font-semibold text-fg flex items-center gap-2">
                  <Package className="w-4 h-4 text-sky-400" />
                  <span>Unpacked Size</span>
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60 font-mono">
                  {rep1.unpackedSize}
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60 font-mono">
                  {rep2.unpackedSize}
                </td>
              </tr>

              {/* Row: Security Score & Grade */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-4 sm:p-5 font-semibold text-fg flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Security Grade</span>
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60">
                  <div className="flex items-center gap-2 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded font-black border text-xs ${getGradeBadge(
                        rep1.securityGrade
                      )}`}
                    >
                      {rep1.securityGrade}
                    </span>
                    <span className="text-xs text-muted-fg">
                      ({rep1.securityScore}/100)
                    </span>
                  </div>
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60">
                  <div className="flex items-center gap-2 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded font-black border text-xs ${getGradeBadge(
                        rep2.securityGrade
                      )}`}
                    >
                      {rep2.securityGrade}
                    </span>
                    <span className="text-xs text-muted-fg">
                      ({rep2.securityScore}/100)
                    </span>
                  </div>
                </td>
              </tr>

              {/* Row: Install Scripts Risk */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-4 sm:p-5 font-semibold text-fg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Lifecycle Scripts</span>
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60">
                  {rep1.hasInstallScripts ? (
                    <span className="text-rose-400 text-xs font-semibold flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Has install scripts
                    </span>
                  ) : (
                    <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Clean (No scripts)
                    </span>
                  )}
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60">
                  {rep2.hasInstallScripts ? (
                    <span className="text-rose-400 text-xs font-semibold flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Has install scripts
                    </span>
                  ) : (
                    <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Clean (No scripts)
                    </span>
                  )}
                </td>
              </tr>

              {/* Row: TypeScript Support */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-4 sm:p-5 font-semibold text-fg flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  <span>TypeScript Support</span>
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60">
                  {rep1.hasTypes ? (
                    <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Built-in Types (.d.ts)
                    </span>
                  ) : (
                    <span className="text-muted-fg text-xs">
                      Community @types
                    </span>
                  )}
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60">
                  {rep2.hasTypes ? (
                    <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Built-in Types (.d.ts)
                    </span>
                  ) : (
                    <span className="text-muted-fg text-xs">
                      Community @types
                    </span>
                  )}
                </td>
              </tr>

              {/* Row: License */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-4 sm:p-5 font-semibold text-fg flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-400" />
                  <span>License Type</span>
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60">
                  <span className="font-mono text-xs font-bold text-fg">
                    {rep1.license}
                  </span>
                  <span className="block text-[11px] text-muted-fg">
                    {rep1.licenseType}
                  </span>
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60">
                  <span className="font-mono text-xs font-bold text-fg">
                    {rep2.license}
                  </span>
                  <span className="block text-[11px] text-muted-fg">
                    {rep2.licenseType}
                  </span>
                </td>
              </tr>

              {/* Row: Direct Dependencies */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-4 sm:p-5 font-semibold text-fg flex items-center gap-2">
                  <Layers className="w-4 h-4 text-muted-fg" />
                  <span>Direct Dependencies</span>
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60 font-mono">
                  {rep1.dependenciesCount}
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60 font-mono">
                  {rep2.dependenciesCount}
                </td>
              </tr>

              {/* Row: Maintainers */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-4 sm:p-5 font-semibold text-fg">
                  Active Maintainers
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60 font-mono">
                  {rep1.maintainersCount}
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60 font-mono">
                  {rep2.maintainersCount}
                </td>
              </tr>

              {/* Row: Last Published */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-4 sm:p-5 font-semibold text-fg">
                  Last Release
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60 text-muted-fg text-xs">
                  {rep1.publishedDate}
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60 text-muted-fg text-xs">
                  {rep2.publishedDate}
                </td>
              </tr>

              {/* Row: Install Command */}
              <tr className="hover:bg-muted/10 transition-colors bg-muted/5">
                <td className="p-4 sm:p-5 font-semibold text-fg flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-accent" />
                  <span>Install Command</span>
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60">
                  <code className="px-2.5 py-1 bg-bg border border-border/70 rounded text-xs font-mono text-accent select-all block">
                    npm i {rep1.name}
                  </code>
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60">
                  <code className="px-2.5 py-1 bg-bg border border-border/70 rounded text-xs font-mono text-accent select-all block">
                    npm i {rep2.name}
                  </code>
                </td>
              </tr>

              {/* Row: Individual Audit Link */}
              <tr className="bg-muted/15">
                <td className="p-4 sm:p-5 font-semibold text-fg">
                  Full Security Report
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60">
                  <Link
                    href={`/npm/${rep1.name}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                  >
                    <span>View {rep1.name} Audit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
                <td className="p-4 sm:p-5 border-l border-border/60">
                  <Link
                    href={`/npm/${rep2.name}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                  >
                    <span>View {rep2.name} Audit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* High-Converting VS Code Extension Banner */}
      <div className="card p-6 sm:p-8 mb-12 border-2 border-accent/40 bg-gradient-to-r from-accent/15 via-card to-card rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase">
            <span>Free Castov VS Code Tool</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-fg">
            Compare Dependencies Directly in VS Code
          </h2>
          <p className="text-sm text-muted-fg max-w-xl">
            Audit supply chain risks, compare lightweight alternative packages, and catch malicious install scripts straight inside your <code>package.json</code> editor.
          </p>
        </div>

        <a
          href="https://marketplace.visualstudio.com/items?itemName=Castov.dependency-lens-castov"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary font-bold px-6 py-3.5 shrink-0 flex items-center gap-2 shadow-lg shadow-accent/25 hover:scale-105 transition-all text-sm"
        >
          <Code2 className="w-4 h-4" />
          <span>Download VS Code Extension</span>
        </a>
      </div>

      {/* Suggested / Related Comparisons */}
      {displayRelated.length > 0 && (
        <div className="card p-6 sm:p-8 mb-12 border border-border/80 rounded-2xl">
          <h2 className="text-lg font-bold text-fg mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>More Popular Package Comparisons</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {displayRelated.map((comp) => {
              const slug = getComparisonSlug(comp.pkg1, comp.pkg2);
              return (
                <Link
                  key={slug}
                  href={`/npm/compare/${slug}`}
                  className="p-3 rounded-xl bg-bg/70 border border-border/60 hover:border-accent text-xs font-mono font-semibold text-fg hover:text-accent transition-all flex items-center justify-between"
                >
                  <span>
                    {comp.pkg1} <span className="text-muted-fg font-sans">vs</span> {comp.pkg2}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="mt-8">
        <FaqSection items={faqs} />
      </div>
    </div>
  );
}
