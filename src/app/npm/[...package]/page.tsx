import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Package,
  Layers,
  FileCode,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Terminal,
  Code2,
  ArrowRightLeft,
} from "lucide-react";
import { buildMetadata, faqJsonLd, webPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { FaqSection } from "@/components/faq-section";
import { fetchNpmPackageReport, normalizePackageName } from "@/lib/npm-service";
import { POPULAR_NPM_PACKAGES } from "@/lib/npm-data";
import { POPULAR_NPM_COMPARISONS, getComparisonSlug } from "@/lib/npm-comparisons";

export const dynamicParams = true;

export function generateStaticParams() {
  // Pre-render top 25 popular packages
  return POPULAR_NPM_PACKAGES.slice(0, 25).map((name) => ({
    package: name.startsWith("@") ? name.split("/") : [name],
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ package: string[] }>;
}): Promise<Metadata> {
  const resolved = await params;
  const pkgName = normalizePackageName(resolved.package);
  const report = await fetchNpmPackageReport(pkgName);

  if (!report) {
    return buildMetadata({
      title: `${pkgName} NPM Package Security & Audit | Castov`,
      description: `Security audit, bundle size, license compliance, and dependency risk analysis for ${pkgName} on NPM.`,
      path: `/npm/${pkgName}`,
    });
  }

  return buildMetadata({
    title: `${report.name} v${report.version} – NPM Security, Size & License | Castov`,
    description: `Full supply-chain audit for ${report.name}: Security Grade ${report.securityGrade} (${report.securityScore}/100), Unpacked Size ${report.unpackedSize}, ${report.license} License, and install instructions.`,
    path: `/npm/${pkgName}`,
  });
}

export default async function NpmPackagePage({
  params,
}: {
  params: Promise<{ package: string[] }>;
}) {
  const resolved = await params;
  const pkgName = normalizePackageName(resolved.package);
  const report = await fetchNpmPackageReport(pkgName);

  if (!report) {
    return notFound();
  }

  const gradeColor =
    report.securityGrade === "A+" || report.securityGrade === "A"
      ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
      : report.securityGrade === "B"
      ? "text-sky-400 border-sky-500/40 bg-sky-500/10"
      : report.securityGrade === "C"
      ? "text-amber-400 border-amber-500/40 bg-amber-500/10"
      : "text-rose-400 border-rose-500/40 bg-rose-500/10";

  const riskBadgeColor =
    report.riskLevel === "SAFE"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      : report.riskLevel === "LOW"
      ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
      : report.riskLevel === "MEDIUM"
      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
      : "bg-rose-500/10 text-rose-400 border-rose-500/30";

  const faqs = [
    {
      q: `Is ${report.name} safe to use in production?`,
      a: `${report.name} received a Security Grade of ${report.securityGrade} (${report.securityScore}/100) with a risk evaluation of ${report.riskLevel}. ${
        report.hasInstallScripts
          ? "Warning: It executes automatic install scripts."
          : "It contains zero malicious postinstall scripts."
      }`,
    },
    {
      q: `What license does ${report.name} use?`,
      a: `${report.name} is licensed under the ${report.license} license (${report.licenseType}). ${
        report.licenseType === "PERMISSIVE"
          ? "This is a permissive open-source license suitable for commercial applications."
          : "Review copyleft obligations before embedding in proprietary software."
      }`,
    },
    {
      q: `How do I install ${report.name}?`,
      a: `Install it via NPM using: npm install ${report.name}, or via PNPM: pnpm add ${report.name}, or Yarn: yarn add ${report.name}.`,
    },
  ];

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "NPM Inspector", href: "/npm" },
    { name: report.name },
  ];

  const depEntries = Object.entries(report.dependencies || {}).slice(0, 16);

  return (
    <div className="layout-content max-w-5xl py-8 sm:py-14">
      <JsonLd
        data={[
          webPageJsonLd({
            name: `${report.name} NPM Package Security Audit`,
            description: `Supply chain analysis, unpacked size, license, and security evaluation for ${report.name}.`,
            path: `/npm/${pkgName}`,
          }),
          faqJsonLd(faqs),
        ]}
      />

      <Breadcrumb path={`/npm/${pkgName}`} crumbs={breadcrumbs} />

      {/* Package Header Banner */}
      <div className="card p-6 sm:p-8 mt-6 border border-border/80 bg-gradient-to-b from-card to-card/60 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/60">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight font-mono">
                {report.name}
              </h1>
              <span className="px-2.5 py-1 text-xs font-mono font-bold bg-muted/20 border border-border rounded-lg text-muted-fg">
                v{report.version}
              </span>
              <span
                className={`px-3 py-1 text-xs font-bold uppercase rounded-lg border ${riskBadgeColor}`}
              >
                {report.riskLevel} Risk
              </span>
            </div>
            <p className="text-muted-fg text-base max-w-2xl leading-relaxed">
              {report.description}
            </p>
          </div>

          {/* Security Score Badge */}
          <div className="flex items-center gap-4">
            <div
              className={`w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 shadow-lg ${gradeColor}`}
            >
              <span className="text-3xl font-black">{report.securityGrade}</span>
              <span className="text-xs font-semibold opacity-80">
                {report.securityScore}/100
              </span>
            </div>
          </div>
        </div>

        {/* 1-Click Install Command */}
        <div className="mt-6 pt-2">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-fg">
            <Terminal className="w-4 h-4 text-accent" />
            <span>Install Command</span>
          </div>
          <div className="bg-bg/90 border border-border/80 rounded-xl p-3.5 flex items-center justify-between font-mono text-sm">
            <span className="text-accent select-all">
              npm install {report.name}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-fg">
              <span>or</span>
              <code className="bg-muted/10 px-2 py-0.5 rounded border border-border/50 text-fg">
                pnpm add {report.name}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Security Audit Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        {/* Card 1: Typosquatting & Impersonation */}
        <div className="card p-5 border border-border/70 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-fg">
              Typosquat Defense
            </span>
            {report.isTyposquat ? (
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div className="text-lg font-bold text-fg">
            {report.isTyposquat ? "Critical Alert" : "Authentic Name"}
          </div>
          <p className="text-xs text-muted-fg mt-1">
            {report.isTyposquat
              ? `Suspected impersonation of "${report.squattedTarget}". Verify package source!`
              : "No similarity to known typosquatting targets."}
          </p>
        </div>

        {/* Card 2: Install Scripts Risk */}
        <div className="card p-5 border border-border/70 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-fg">
              Lifecycle Scripts
            </span>
            {report.hasInstallScripts ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div className="text-lg font-bold text-fg">
            {report.hasInstallScripts ? "Automated Scripts" : "Clean Execution"}
          </div>
          <p className="text-xs text-muted-fg mt-1">
            {report.hasInstallScripts
              ? `Executes code during install (${report.installScripts.join(", ")}).`
              : "Zero preinstall or postinstall arbitrary execution hooks."}
          </p>
        </div>

        {/* Card 3: License Compliance */}
        <div className="card p-5 border border-border/70 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-fg">
              License Type
            </span>
            <FileCode className="w-5 h-5 text-sky-400" />
          </div>
          <div className="text-lg font-bold text-fg">{report.license}</div>
          <p className="text-xs text-muted-fg mt-1">
            {report.licenseType === "PERMISSIVE"
              ? "Permissive open-source license. Safe for enterprise & proprietary software."
              : report.licenseType === "COPYLEFT"
              ? "Reciprocal copyleft. May require open-sourcing derivative works."
              : "Unverified license terms."}
          </p>
        </div>
      </div>

      {/* Package Vital Stats */}
      <div className="card p-6 mt-6 border border-border/80 rounded-xl">
        <h2 className="text-lg font-bold text-fg mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-accent" />
          <span>Package Specifications</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="bg-bg/60 p-3 rounded-lg border border-border/50">
            <div className="text-xs text-muted-fg uppercase">Unpacked Size</div>
            <div className="text-base font-bold text-fg mt-0.5">
              {report.unpackedSize}
            </div>
          </div>
          <div className="bg-bg/60 p-3 rounded-lg border border-border/50">
            <div className="text-xs text-muted-fg uppercase">Dependencies</div>
            <div className="text-base font-bold text-fg mt-0.5">
              {report.dependenciesCount}
            </div>
          </div>
          <div className="bg-bg/60 p-3 rounded-lg border border-border/50">
            <div className="text-xs text-muted-fg uppercase">Maintainers</div>
            <div className="text-base font-bold text-fg mt-0.5">
              {report.maintainersCount}
            </div>
          </div>
          <div className="bg-bg/60 p-3 rounded-lg border border-border/50">
            <div className="text-xs text-muted-fg uppercase">Last Published</div>
            <div className="text-base font-bold text-fg mt-0.5">
              {report.publishedDate}
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="mt-5 flex flex-wrap gap-3 pt-4 border-t border-border/50">
          <a
            href={`https://www.npmjs.com/package/${report.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary text-xs flex items-center gap-1.5"
          >
            <span>View on npmjs.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {report.repository && (
            <a
              href={report.repository}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary text-xs flex items-center gap-1.5"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Dependencies Section (if any) */}
      {depEntries.length > 0 && (
        <div className="card p-6 mt-6 border border-border/80 rounded-xl">
          <h2 className="text-base font-bold text-fg mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-fg" />
            <span>Direct Dependencies ({report.dependenciesCount})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {depEntries.map(([dep, ver]) => (
              <Link
                key={dep}
                href={`/npm/${dep}`}
                className="px-2.5 py-1 text-xs font-mono rounded-md bg-muted/15 border border-border/70 text-fg hover:border-accent hover:text-accent transition-colors"
              >
                {dep} <span className="text-muted-fg">{ver}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Head-to-Head Comparisons Links */}
      {(() => {
        const relevantComparisons = POPULAR_NPM_COMPARISONS.filter(
          (c) => c.pkg1 === pkgName || c.pkg2 === pkgName
        ).slice(0, 4);

        if (relevantComparisons.length === 0) return null;

        return (
          <div className="card p-6 mt-6 border border-border/80 rounded-xl">
            <h2 className="text-base font-bold text-fg mb-3 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-accent" />
              <span>Head-to-Head Comparisons with {report.name}</span>
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {relevantComparisons.map((c) => {
                const slug = getComparisonSlug(c.pkg1, c.pkg2);
                return (
                  <Link
                    key={slug}
                    href={`/npm/compare/${slug}`}
                    className="px-3 py-1.5 rounded-lg bg-card border border-border hover:border-accent font-mono text-xs text-fg hover:text-accent transition-all flex items-center gap-1.5"
                  >
                    <span>{c.pkg1} vs {c.pkg2}</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* VS Code Extension Cross-Promotion Banner */}
      <div className="card p-6 sm:p-8 mt-8 border-2 border-accent/40 bg-gradient-to-r from-accent/10 via-card to-card rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase mb-2">
            <span>Free VS Code Extension</span>
          </div>
          <h3 className="text-xl font-extrabold text-fg">
            Detect Supply Chain Attacks Directly in Your Editor
          </h3>
          <p className="text-sm text-muted-fg mt-1 max-w-xl">
            Get instant CodeLens risk scores, typosquatting warnings, and license
            audits right inside your <code>package.json</code> file with zero
            configuration.
          </p>
        </div>
        <a
          href="https://marketplace.visualstudio.com/items?itemName=Castov.dependency-lens-castov"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary font-bold px-6 py-3 shrink-0 flex items-center gap-2 shadow-lg shadow-accent/25"
        >
          <Code2 className="w-4 h-4" />
          <span>Install Dependency Risk Lens</span>
        </a>
      </div>

      {/* FAQ Section */}
      <div className="mt-12">
        <FaqSection items={faqs} />
      </div>
    </div>
  );
}
