import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TIMEZONE_PAIRS, getTimezonePairBySlug } from "@/lib/timezone-pairs-registry";
import { TimezonePairConverterWidget } from "@/components/tools/timezone-pair-converter-widget";
import { buildMetadata, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

export function generateStaticParams() {
  return TIMEZONE_PAIRS.map((p) => ({ pair: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair } = await params;
  const item = getTimezonePairBySlug(pair);
  if (!item) return {};

  return buildMetadata({
    title: item.title,
    description: item.description,
    path: `/time/${item.slug}`,
  });
}

export default async function TimezonePairPage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = await params;
  const item = getTimezonePairBySlug(pair);
  if (!item) notFound();

  const reverseSlug = `${item.to.code.toLowerCase()}-to-${item.from.code.toLowerCase()}`;
  const hasReverse = TIMEZONE_PAIRS.some((p) => p.slug === reverseSlug);

  const faqs = [
    {
      q: `How do I convert ${item.from.code} to ${item.to.code}?`,
      a: `${item.from.code} (${item.from.name}) uses the IANA timezone identifier ${item.from.iana} (standard offset ${item.from.standardOffset}), while ${item.to.code} (${item.to.name}) uses ${item.to.iana} (standard offset ${item.to.standardOffset}). Use the interactive slider or the 24-hour table above to convert any hour accurately with automatic Daylight Saving Time (DST) adjustment.`,
    },
    {
      q: `What are the best meeting hours between ${item.from.city} and ${item.to.city}?`,
      a: `Check the rows highlighted with "Best Meeting Overlap" in the 24-hour table above, where both ${item.from.code} and ${item.to.code} fall within standard 9:00 AM – 5:00 PM working hours.`,
    },
    {
      q: `Does ${item.from.code} to ${item.to.code} account for Daylight Saving Time (DST)?`,
      a: `Yes. Castov uses the browser's native IANA tzdb engine (${item.from.iana} and ${item.to.iana}), which automatically applies official Daylight Saving Time transitions.`,
    },
  ];

  const relatedPairs = TIMEZONE_PAIRS.filter(
    (p) => p.slug !== item.slug && (p.from.code === item.from.code || p.to.code === item.to.code)
  ).slice(0, 12);

  return (
    <div className="layout-content py-10 space-y-10">
      <JsonLd
        data={[
          breadcrumbJsonLd(
            [
              { name: "Home", href: "/" },
              { name: "Time Converters", href: "/time" },
              { name: `${item.from.code} to ${item.to.code}` },
            ],
            `/time/${item.slug}`
          ),
          faqJsonLd(faqs),
        ]}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-muted flex items-center gap-2">
        <Link href="/" className="hover:text-fg">Home</Link>
        <span>/</span>
        <Link href="/time" className="hover:text-fg">Time Matrix</Link>
        <span>/</span>
        <span className="text-fg font-semibold">{item.from.code} to {item.to.code}</span>
      </nav>

      {/* Header */}
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
          Live IANA Timezone Engine • Auto-DST
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
          {item.from.code} to {item.to.code} Time Converter ({item.from.city} to {item.to.city})
        </h1>
        <p className="text-muted max-w-3xl text-sm sm:text-base leading-relaxed">
          {item.description}
        </p>
      </header>

      {/* Main Interactive Widget */}
      <TimezonePairConverterWidget
        from={item.from}
        to={item.to}
        reverseSlug={hasReverse ? reverseSlug : undefined}
      />

      {/* FAQ Section */}
      <section className="bg-card border border-line rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-fg">Frequently Asked Questions ({item.from.code} → {item.to.code})</h2>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="p-4 rounded-xl bg-field/60 border border-line">
              <h3 className="font-bold text-fg text-sm mb-1">{f.q}</h3>
              <p className="text-muted text-xs sm:text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related Conversions Mesh */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-fg">Related Timezone Conversions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {relatedPairs.map((rp) => (
            <Link
              key={rp.slug}
              href={`/time/${rp.slug}`}
              className="p-3 rounded-xl bg-card hover:bg-hover border border-line transition-colors flex flex-col justify-between no-underline"
            >
              <span className="font-bold text-sm text-fg">{rp.from.code} → {rp.to.code}</span>
              <span className="text-xs text-muted truncate">{rp.from.city} to {rp.to.city}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
