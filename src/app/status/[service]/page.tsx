import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  Activity, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Terminal 
} from "lucide-react";
import { CLOUD_SERVICES, getCloudService } from "@/lib/cloud-status-registry";
import { buildMetadata, breadcrumbJsonLd, faqJsonLd, FaqItem } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

export const revalidate = 60; // Refresh live status radar every minute
export const dynamicParams = false;

export function generateStaticParams() {
  return CLOUD_SERVICES.map((s) => ({ service: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string }>;
}): Promise<Metadata> {
  const { service } = await params;
  const info = getCloudService(service);
  if (!info) return {};

  return buildMetadata({
    title: `Is ${info.name} Down? Live Outage & Incident Status Radar`,
    description: `Check if ${info.name} is down right now. Live status monitor, latency check, incident reports, and developer workarounds for ${info.name}.`,
    path: `/status/${info.slug}`,
  });
}

export default async function CloudServiceStatusPage({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service } = await params;
  const info = getCloudService(service);
  if (!info) notFound();

  // Perform quick server-side latency ping
  let isUp = true;
  let latencyMs = 0;
  const startTime = Date.now();
  try {
    const res = await fetch(info.checkUrl, {
      method: "HEAD",
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3500),
    });
    latencyMs = Date.now() - startTime;
    isUp = res.status < 500;
  } catch {
    latencyMs = Date.now() - startTime;
    isUp = false;
  }

  const faqs: FaqItem[] = [
    {
      q: `Is ${info.name} down right now?`,
      a: isUp 
        ? `${info.name} responded in ${latencyMs}ms from our Edge monitoring probe. Status is Operational.`
        : `${info.name} probe timed out or returned a 5xx error. There may be a partial outage or rate limit.`,
    },
    {
      q: `What should I do if ${info.name} is experiencing an outage?`,
      a: info.fallbackTip,
    },
    {
      q: `Where can I view the official ${info.name} incident log?`,
      a: `Visit the official status dashboard at ${info.statusPageUrl}.`,
    },
  ];

  const related = CLOUD_SERVICES.filter((s) => s.slug !== info.slug);

  return (
    <div className="layout-content py-10 space-y-10">
      <JsonLd
        data={[
          breadcrumbJsonLd(
            [
              { name: "Home", href: "/" },
              { name: "Cloud Status Radar", href: "/status" },
              { name: info.name },
            ],
            `/status/${info.slug}`
          ),
          faqJsonLd(faqs),
        ]}
      />

      <nav aria-label="Breadcrumb" className="text-xs text-muted flex items-center gap-2">
        <Link href="/" className="hover:text-fg">Home</Link>
        <span>/</span>
        <Link href="/status" className="hover:text-fg">Status Radar</Link>
        <span>/</span>
        <span className="text-fg font-semibold">{info.name}</span>
      </nav>

      {/* Header Banner */}
      <header className="space-y-4 border-b border-line pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
            isUp ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
          }`}>
            <span className={`w-2 h-2 rounded-full animate-ping ${isUp ? "bg-emerald-500" : "bg-red-500"}`} />
            {isUp ? "Operational (Normal)" : "Degraded / Potential Outage"}
          </div>
          <span className="text-xs font-mono text-muted">Probe Latency: {latencyMs}ms</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
          Is {info.name} Down Right Now?
        </h1>
        <p className="text-muted max-w-3xl text-sm sm:text-base leading-relaxed">
          {info.description}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href={info.statusPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary text-xs px-4 py-2 flex items-center gap-2"
          >
            <span>Official {info.name} Status Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Link
            href="/status"
            className="btn bg-card border border-line text-xs px-4 py-2 hover:bg-hover flex items-center gap-2"
          >
            <Activity className="w-3.5 h-3.5 text-accent" />
            <span>All 8 Cloud Services</span>
          </Link>
        </div>
      </header>

      {/* Live Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-card border border-line space-y-3">
          <div className="flex items-center gap-2 text-accent text-sm font-semibold">
            <Activity className="w-4 h-4" />
            <span>Edge Probe Latency</span>
          </div>
          <div className="text-3xl font-extrabold text-fg font-mono">
            {latencyMs} <span className="text-sm font-normal text-muted">ms</span>
          </div>
          <p className="text-xs text-muted">Real-time HTTP roundtrip from Castov edge infrastructure.</p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-line space-y-3">
          <div className="flex items-center gap-2 text-amber-500 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>Frequent Error Codes</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {info.commonErrors.map((err) => (
              <span key={err} className="px-2 py-0.5 rounded bg-field border border-line text-[11px] font-mono text-fg">
                {err}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-line space-y-3">
          <div className="flex items-center gap-2 text-emerald-500 text-sm font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Developer Recovery Tip</span>
          </div>
          <p className="text-xs text-fg leading-relaxed">
            {info.fallbackTip}
          </p>
        </div>
      </div>

      {/* Other Monitored Services */}
      <section className="space-y-4 pt-4 border-t border-line">
        <h2 className="text-lg font-bold text-fg">Monitor Other Cloud &amp; AI Platforms</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {related.map((s) => (
            <Link
              key={s.slug}
              href={`/status/${s.slug}`}
              className="p-3 rounded-xl bg-card border border-line hover:border-accent/40 flex flex-col gap-1 no-underline transition-colors"
            >
              <span className="font-bold text-fg truncate">{s.name}</span>
              <span className="text-muted text-[11px] truncate">{s.category}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-fg">Frequently Asked Questions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {faqs.map((f) => (
            <div key={f.q} className="p-4 rounded-xl bg-card border border-line space-y-2">
              <h3 className="font-semibold text-xs text-fg">{f.q}</h3>
              <p className="text-xs text-muted leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
