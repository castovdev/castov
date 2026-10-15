import type { Metadata } from "next";
import Link from "next/link";
import { TIMEZONE_PAIRS, TIMEZONE_NODES } from "@/lib/timezone-pairs-registry";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { Globe, Clock, ArrowRight } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Global Timezone Converter Matrix – EST, PST, UTC, GMT, CET, IST, JST",
  description: "Instant side-by-side timezone conversion matrix for developers and distributed teams. Convert between EST, PST, UTC, GMT, CET, IST, JST, SGT, and AEST with 24-hour overlap tables.",
  path: "/time",
});

export default function TimeMatrixHubPage() {
  return (
    <div className="layout-content py-10 space-y-10">
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Home", href: "/" },
            { name: "Global Timezone Matrix" },
          ],
          "/time"
        )}
      />

      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
          <Globe className="w-3.5 h-3.5" /> 60+ Instant Timezone Pairs
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
          Global Timezone Conversion Matrix
        </h1>
        <p className="text-muted max-w-3xl text-sm sm:text-base">
          Select any timezone pair below for live clocks, 24-hour comparison tables, international meeting overlap indicators, and developer code snippets.
        </p>
      </header>

      {/* Reference Nodes */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-fg flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent" /> Supported Standard Zones
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.values(TIMEZONE_NODES).map((node) => (
            <div key={node.code} className="p-3 rounded-xl bg-card border border-line">
              <div className="flex items-center justify-between">
                <span className="font-bold text-fg text-sm">{node.code}</span>
                <span className="text-[11px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                  UTC{node.standardOffset}
                </span>
              </div>
              <div className="text-xs text-muted truncate mt-1">{node.city}</div>
              <div className="text-[10px] font-mono text-muted/80 truncate">{node.iana}</div>
            </div>
          ))}
        </div>
      </section>

      {/* All 60+ Pairs Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-fg">All Direct Timezone Converters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {TIMEZONE_PAIRS.map((pair) => (
            <Link
              key={pair.slug}
              href={`/time/${pair.slug}`}
              className="group p-4 rounded-xl bg-card hover:bg-hover border border-line transition-all flex items-center justify-between no-underline"
            >
              <div>
                <div className="font-bold text-fg group-hover:text-accent transition-colors">
                  {pair.from.code} to {pair.to.code}
                </div>
                <div className="text-xs text-muted">
                  {pair.from.city} → {pair.to.city}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
