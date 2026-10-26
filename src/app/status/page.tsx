import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowRight } from "lucide-react";
import { CLOUD_SERVICES } from "@/lib/cloud-status-registry";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = buildMetadata({
  title: "Cloud & AI Status Radar | Real-Time Outage Monitor | Castov",
  description: "Real-time incident and outage radar for OpenAI, Claude, GitHub, Vercel, Cloudflare, Supabase, Stripe, and npm. Instant edge latency checks and engineer recovery tips.",
  path: "/status",
});

export default function CloudStatusHubPage() {
  return (
    <div className="layout-content py-10 space-y-12">
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Home", href: "/" },
            { name: "Cloud Status Radar" },
          ],
          "/status"
        )}
      />

      <nav aria-label="Breadcrumb" className="text-xs text-muted flex items-center gap-2">
        <Link href="/" className="hover:text-fg">Home</Link>
        <span>/</span>
        <span className="text-fg font-semibold">Status Radar</span>
      </nav>

      <header className="space-y-4 border-b border-line pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
          <Activity className="w-3.5 h-3.5" />
          <span>Real-Time Developer Outage Radar</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-fg">
          Cloud &amp; AI Status Radar
        </h1>
        <p className="text-muted max-w-3xl text-sm sm:text-base leading-relaxed">
          Monitor outages, latency spikes, and 5xx API errors across critical AI providers, hosting networks, and developer infrastructure in real time.
        </p>
      </header>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CLOUD_SERVICES.map((s) => (
          <Link
            key={s.slug}
            href={`/status/${s.slug}`}
            className="p-5 rounded-2xl bg-card border border-line hover:border-accent/50 transition-all flex flex-col justify-between gap-4 no-underline group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-field text-muted">
                  {s.category}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h2 className="text-base font-bold text-fg group-hover:text-accent transition-colors">
                {s.name}
              </h2>
              <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                {s.description}
              </p>
            </div>

            <div className="pt-3 border-t border-line/60 flex items-center justify-between text-xs text-accent font-semibold">
              <span>View live status</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
