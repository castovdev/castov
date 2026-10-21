import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Zap, Layers } from "lucide-react";
import { buildMetadata, webPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { POPULAR_NPM_PACKAGES, NPM_CATEGORIES } from "@/lib/npm-data";
import { NpmSearchBar } from "./npm-search-bar";

export const metadata: Metadata = buildMetadata({
  title: "NPM Package Inspector & Security Auditor | Castov",
  description:
    "Analyze any NPM package for supply-chain security risks, typosquatting attacks, bundle size, license compliance, and install scripts.",
  path: "/npm",
});

export default function NpmIndexPage() {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "NPM Package Inspector" },
  ];

  return (
    <div className="layout-content max-w-5xl py-10 sm:py-16">
      <JsonLd
        data={webPageJsonLd({
          name: "NPM Package Inspector & Security Auditor",
          description:
            "Analyze NPM packages for supply-chain risks, bundle sizes, licenses, and typosquatting.",
          path: "/npm",
        })}
      />

      <Breadcrumb path="/npm" crumbs={breadcrumbs} />

      {/* Hero Section */}
      <div className="text-center mt-6 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent mb-4">
          <ShieldCheck className="w-4 h-4" />
          <span>NPM SUPPLY CHAIN AUDITOR</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-fg tracking-tight mb-4">
          Inspect Any NPM Package in{" "}
          <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">
            Real Time
          </span>
        </h1>
        <p className="text-muted-fg text-base sm:text-lg max-w-2xl mx-auto">
          Audit unpacked bundle sizes, license compliance, typosquatting threats,
          and hidden lifecycle scripts across 2+ million NPM packages.
        </p>

        {/* Client Search Bar */}
        <NpmSearchBar />
      </div>

      {/* Categorized Packages */}
      <div className="space-y-10 mt-12">
        {NPM_CATEGORIES.map((cat) => (
          <div key={cat.name} className="card p-6 border border-border/80 rounded-2xl">
            <h2 className="text-lg font-bold text-fg mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent" />
              <span>{cat.name}</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {cat.packages.map((pkg) => (
                <Link
                  key={pkg}
                  href={`/npm/${pkg}`}
                  className="p-3 rounded-xl bg-bg/70 border border-border/60 hover:border-accent text-center font-mono text-sm font-semibold text-fg hover:text-accent transition-all hover:scale-[1.02]"
                >
                  {pkg}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Popular Packages Quick Links */}
      <div className="card p-6 sm:p-8 mt-10 border border-border/80 rounded-2xl">
        <h2 className="text-xl font-bold text-fg mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span>Frequently Audited Packages</span>
        </h2>
        <div className="flex flex-wrap gap-2.5">
          {POPULAR_NPM_PACKAGES.slice(0, 40).map((pkg) => (
            <Link
              key={pkg}
              href={`/npm/${pkg}`}
              className="px-3 py-1.5 rounded-lg bg-card border border-border hover:border-accent font-mono text-xs text-muted-fg hover:text-fg transition-colors"
            >
              {pkg}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
