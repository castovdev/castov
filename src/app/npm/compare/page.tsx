import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightLeft, Layers, ArrowRight, Code2 } from "lucide-react";
import { buildMetadata, webPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { POPULAR_NPM_COMPARISONS, getComparisonSlug } from "@/lib/npm-comparisons";
import { CompareSearchBar } from "./compare-search-bar";

export const metadata: Metadata = buildMetadata({
  title: "Compare NPM Packages Head-to-Head: Size, Downloads & Security | Castov",
  description:
    "Compare any two NPM libraries side-by-side: bundle size, weekly downloads, supply-chain vulnerabilities, licenses, and TypeScript support.",
  path: "/npm/compare",
});

export default function NpmCompareIndexPage() {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "NPM Inspector", href: "/npm" },
    { name: "Compare Packages" },
  ];

  // Group comparisons by category
  const categoriesMap = new Map<string, typeof POPULAR_NPM_COMPARISONS>();
  for (const comp of POPULAR_NPM_COMPARISONS) {
    const list = categoriesMap.get(comp.category) || [];
    list.push(comp);
    categoriesMap.set(comp.category, list);
  }

  return (
    <div className="layout-content max-w-5xl py-10 sm:py-16">
      <JsonLd
        data={webPageJsonLd({
          name: "NPM Package Head-to-Head Comparisons",
          description:
            "Side-by-side comparison of popular NPM libraries: bundle sizes, weekly downloads, and security ratings.",
          path: "/npm/compare",
        })}
      />

      <Breadcrumb path="/npm/compare" crumbs={breadcrumbs} />

      {/* Hero Section */}
      <div className="text-center mt-6 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent mb-4">
          <ArrowRightLeft className="w-4 h-4" />
          <span>HEAD-TO-HEAD NPM COMPARISON</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-fg tracking-tight mb-4">
          Compare Any Two{" "}
          <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">
            NPM Packages
          </span>
        </h1>
        <p className="text-muted-fg text-base sm:text-lg max-w-2xl mx-auto">
          Evaluate bundle size, weekly downloads, supply-chain vulnerabilities,
          install scripts, and TypeScript compatibility side-by-side.
        </p>

        {/* Search Bar */}
        <CompareSearchBar />
      </div>

      {/* Categorized Comparisons Grid */}
      <div className="space-y-10 mt-12">
        {Array.from(categoriesMap.entries()).map(([catName, comps]) => (
          <div
            key={catName}
            className="card p-6 sm:p-8 border border-border/80 rounded-2xl shadow-sm"
          >
            <h2 className="text-lg font-bold text-fg mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent" />
              <span>{catName}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {comps.map((comp) => {
                const slug = getComparisonSlug(comp.pkg1, comp.pkg2);
                return (
                  <Link
                    key={slug}
                    href={`/npm/compare/${slug}`}
                    className="p-3.5 rounded-xl bg-bg/70 border border-border/60 hover:border-accent text-sm font-mono font-semibold text-fg hover:text-accent transition-all hover:scale-[1.02] flex items-center justify-between"
                  >
                    <span>
                      {comp.pkg1}{" "}
                      <span className="text-muted-fg font-sans text-xs">vs</span>{" "}
                      {comp.pkg2}
                    </span>
                    <ArrowRight className="w-4 h-4 opacity-50 text-muted-fg" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* VS Code Extension CTA */}
      <div className="card p-6 sm:p-8 mt-12 border-2 border-accent/40 bg-gradient-to-r from-accent/15 via-card to-card rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase">
            <span>Free Castov Tool</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-fg">
            Inspect Package Alternatives Right Inside VS Code
          </h2>
          <p className="text-sm text-muted-fg max-w-xl">
            Detect bloated dependencies, get lightweight drop-in alternatives, and catch supply-chain threats before you commit.
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
    </div>
  );
}
