import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata, faqJsonLd, softwareAppJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { FaqSection } from "@/components/faq-section";
import { AdSlot } from "@/components/ad-slot";
import { CodeConverterTool } from "@/components/tools/code-converter-tool";
import { ModularCodeConverterTool } from "@/components/tools/modular-code-converter-tool";
import { getModularConverter, MODULAR_CONVERTERS } from "@/content/converters";
import {
  CODE_CONVERTERS,
  getConverterBySlug,
} from "@/lib/code-converters-registry";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";

interface Params {
  slug: string;
}

export const dynamicParams = true;

export function generateStaticParams(): Params[] {
  // Combine all slugs
  const allSlugs = new Set<string>();
  for (const c of MODULAR_CONVERTERS) allSlugs.add(c.slug);
  for (const c of CODE_CONVERTERS) allSlugs.add(c.slug);
  return Array.from(allSlugs).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;

  // 1. Check modular converters first
  const modular = getModularConverter(slug);
  if (modular) {
    const meta = buildMetadata({
      title: `${modular.title} | Castov`,
      description: modular.metaDescription,
      path: `/convert/${modular.slug}`,
    });

    return {
      ...meta,
      robots: modular.isIndexed
        ? { index: true, follow: true }
        : { index: false, follow: true },
    };
  }

  // 2. Fallback to legacy converters
  const converter = getConverterBySlug(slug);
  if (!converter) {
    return buildMetadata({
      title: "Code Converter Not Found - Castov",
      description: "The requested code converter was not found.",
      path: `/convert/${slug}`,
    });
  }

  return buildMetadata({
    title: `${converter.title} | Castov`,
    description: converter.description,
    path: `/convert/${converter.slug}`,
  });
}

export default async function CodeConverterPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  // 1. Check if modular converter exists
  const modular = getModularConverter(slug);
  if (modular) {
    const relatedList = (modular.relatedSlugs || [])
      .map((s) => getModularConverter(s) || getConverterBySlug(s))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));

    const faqsForDisplay = (modular.faqs || []).map((f) => ({
      q: f.question,
      a: f.answer,
    }));

    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Schemas */}
        <JsonLd
          data={softwareAppJsonLd({
            name: modular.name,
            description: modular.metaDescription,
            url: `/convert/${modular.slug}`,
            category: "DeveloperApplication",
          })}
        />
        {faqsForDisplay.length > 0 && (
          <JsonLd data={faqJsonLd(faqsForDisplay)} />
        )}

        {/* Breadcrumb */}
        <Breadcrumb
          path={`/convert/${modular.slug}`}
          crumbs={[
            { name: "Home", href: "/" },
            { name: "Convert", href: "/convert" },
            { name: modular.name },
          ]}
        />

        {/* Hero Header */}
        <div className="hero-section -mx-4 px-4 py-10 md:py-14 text-center sm:text-left">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{modular.category} · 100% Client-Side Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-fg">
            {modular.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base sm:text-lg text-muted leading-relaxed">
            {modular.metaDescription}
          </p>
        </div>

        <AdSlot placement="tool-top" />

        {/* Main Interactive Tool */}
        <section className="my-8" aria-label={modular.name}>
          <ModularCodeConverterTool meta={modular} initialOutput={modular.initialOutput} />
        </section>

        <AdSlot placement="content-middle" />

        {/* Deep Technical Guide */}
        <section className="my-14 rounded-2xl border border-line bg-card p-6 sm:p-8" aria-labelledby="deep-dive-heading">
          <h2 id="deep-dive-heading" className="text-2xl font-bold tracking-tight text-fg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent" />
            Understanding the {modular.name} Transformation
          </h2>
          <div className="mt-4 space-y-4 text-muted leading-relaxed text-sm sm:text-base">
            <p>{modular.deepDive.overview}</p>

            <div className="mt-6 rounded-xl border border-line/60 bg-field/60 p-5">
              <h3 className="font-semibold text-fg flex items-center gap-2 text-sm sm:text-base mb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                Key Architectural Benefits
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs sm:text-sm text-muted">
                {modular.deepDive.whyDevelopersUseThis.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Common Pitfalls & Solutions */}
            {modular.deepDive.commonPitfalls && modular.deepDive.commonPitfalls.length > 0 && (
              <div className="mt-6 pt-6 border-t border-line/60">
                <h3 className="font-semibold text-fg flex items-center gap-2 text-sm sm:text-base mb-4">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  Common Conversion Pitfalls & Fixes
                </h3>
                <div className="grid grid-cols-1 gap-3.5">
                  {modular.deepDive.commonPitfalls.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-line bg-field/40 text-xs">
                      <div className="font-bold text-amber-400 mb-1">
                        ⚠️ Pitfall: {item.pitfall}
                      </div>
                      <div className="text-muted leading-relaxed">
                        <span className="font-semibold text-fg">Solution: </span>
                        {item.solution}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Real-World Edge Cases */}
        {modular.edgeCases && modular.edgeCases.length > 0 && (
          <section className="my-14 rounded-2xl border border-line bg-card p-6 sm:p-8" aria-labelledby="edge-cases-heading">
            <h2 id="edge-cases-heading" className="text-2xl font-bold tracking-tight text-fg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accent" />
              Verified Edge Cases & Complex Scenarios
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted">
              Real payloads often contain edge cases that break naive generators. Here is how our engine handles them:
            </p>

            <div className="mt-6 space-y-6">
              {modular.edgeCases.map((ec, idx) => (
                <div key={idx} className="rounded-xl border border-line bg-field/50 p-5">
                  <div className="font-bold text-sm text-fg mb-1">
                    {idx + 1}. {ec.title}
                  </div>
                  <p className="text-xs text-muted mb-4">{ec.scenario}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-line bg-card p-3">
                      <div className="text-[11px] font-mono font-semibold text-muted pb-1 border-b border-line">
                        INPUT ({modular.inputLanguage.toUpperCase()})
                      </div>
                      <pre className="mt-2 text-xs font-mono text-fg overflow-x-auto whitespace-pre p-1">
                        {ec.inputSnippet}
                      </pre>
                    </div>

                    <div className="rounded-lg border border-line bg-card p-3">
                      <div className="text-[11px] font-mono font-semibold text-accent pb-1 border-b border-line">
                        OUTPUT ({modular.outputLanguage.toUpperCase()})
                      </div>
                      <pre className="mt-2 text-xs font-mono text-accent overflow-x-auto whitespace-pre p-1">
                        {ec.outputSnippet}
                      </pre>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-muted">
                    <span className="font-semibold text-fg">Why: </span>
                    {ec.explanation}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQs */}
        {faqsForDisplay.length > 0 && (
          <div className="my-12">
            <FaqSection items={faqsForDisplay} headingId="converter-faq" />
          </div>
        )}

        {/* Related Converters */}
        {relatedList.length > 0 && (
          <section className="my-14" aria-labelledby="related-converters-heading">
            <div className="flex items-center justify-between mb-6">
              <h2 id="related-converters-heading" className="text-2xl font-bold tracking-tight text-fg">
                Related Developer Converters
              </h2>
              <Link
                href="/convert"
                className="text-sm font-medium text-accent hover:underline flex items-center gap-1"
              >
                Browse All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {relatedList.map((rel: any) => (
                <Link
                  key={rel.slug}
                  href={`/convert/${rel.slug}`}
                  className="group card p-5 flex flex-col justify-between hover:border-accent transition-colors no-underline"
                >
                  <div>
                    <span className="text-xs font-medium text-accent uppercase tracking-wider">
                      {rel.category}
                    </span>
                    <h3 className="text-base font-semibold text-fg mt-1 group-hover:text-accent transition-colors">
                      {rel.name}
                    </h3>
                    <p className="mt-2 text-xs text-muted line-clamp-2 leading-relaxed">
                      {rel.metaDescription || rel.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent">
                    Convert now <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <AdSlot placement="content-bottom" />
      </div>
    );
  }

  // 2. Legacy fallback
  const converter = getConverterBySlug(slug);
  if (!converter) {
    notFound();
  }

  const relatedConverters = (converter.relatedSlugs || [])
    .map((s) => getConverterBySlug(s))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  if (relatedConverters.length < 3) {
    for (const item of CODE_CONVERTERS) {
      if (item.slug !== converter.slug && !relatedConverters.some((r) => r.slug === item.slug)) {
        relatedConverters.push(item);
        if (relatedConverters.length >= 4) break;
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Schemas */}
      <JsonLd
        data={softwareAppJsonLd({
          name: converter.name,
          description: converter.description,
          url: `/convert/${converter.slug}`,
          category: "DeveloperApplication",
        })}
      />
      {converter.faqs && converter.faqs.length > 0 && (
        <JsonLd data={faqJsonLd(converter.faqs)} />
      )}

      {/* Breadcrumb */}
      <Breadcrumb
        path={`/convert/${converter.slug}`}
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Convert", href: "/convert" },
          { name: converter.name },
        ]}
      />

      {/* Hero Header */}
      <div className="hero-section -mx-4 px-4 py-10 md:py-14 text-center sm:text-left">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{converter.category} · 100% Client-Side & Private</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-fg">
          {converter.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base sm:text-lg text-muted leading-relaxed">
          {converter.description}
        </p>
      </div>

      <AdSlot placement="tool-top" />

      {/* Main Interactive Tool */}
      <section className="my-8" aria-label={converter.name}>
        <CodeConverterTool slug={converter.slug} />
      </section>

      <AdSlot placement="content-middle" />

      {/* How it Works / Deep Technical Guide */}
      <section className="my-14 rounded-2xl border border-line bg-card p-6 sm:p-8" aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className="text-2xl font-bold tracking-tight text-fg">
          How the {converter.name} Works
        </h2>
        <div className="mt-4 space-y-4 text-muted leading-relaxed">
          <p>{converter.explanation.summary}</p>
          <div className="rounded-xl border border-line/60 bg-field/60 p-4">
            <h3 className="font-semibold text-fg flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              Why Developers Use This Conversion
            </h3>
            <p className="mt-2 text-sm text-muted">
              {converter.explanation.whyUse}
            </p>
          </div>
        </div>

        {/* Before & After Comparison */}
        <div className="mt-8 border-t border-line/60 pt-6">
          <h3 className="text-lg font-bold text-fg mb-4">
            Before & After Transformation Example
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-line bg-field p-4">
              <div className="flex items-center justify-between pb-2 border-b border-line/60 text-xs font-mono font-semibold text-muted">
                <span>INPUT ({converter.inputLanguage.toUpperCase()})</span>
              </div>
              <pre className="mt-3 text-xs font-mono text-fg overflow-x-auto p-2 bg-hover/50 rounded-lg max-h-64 whitespace-pre">
                {converter.explanation.sampleBefore}
              </pre>
            </div>
            <div className="rounded-xl border border-line bg-field p-4">
              <div className="flex items-center justify-between pb-2 border-b border-line/60 text-xs font-mono font-semibold text-accent">
                <span>OUTPUT ({converter.outputLanguage.toUpperCase()})</span>
              </div>
              <pre className="mt-3 text-xs font-mono text-fg overflow-x-auto p-2 bg-hover/50 rounded-lg max-h-64 whitespace-pre">
                {converter.explanation.sampleAfter}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      {converter.faqs && converter.faqs.length > 0 && (
        <div className="my-12">
          <FaqSection items={converter.faqs} headingId="converter-faq" />
        </div>
      )}

      {/* Related Converters */}
      {relatedConverters.length > 0 && (
        <section className="my-14" aria-labelledby="related-converters-heading">
          <div className="flex items-center justify-between mb-6">
            <h2 id="related-converters-heading" className="text-2xl font-bold tracking-tight text-fg">
              Related Developer Converters
            </h2>
            <Link
              href="/convert"
              className="text-sm font-medium text-accent hover:underline flex items-center gap-1"
            >
              Browse All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {relatedConverters.map((rel) => (
              <Link
                key={rel.slug}
                href={`/convert/${rel.slug}`}
                className="group card p-5 flex flex-col justify-between hover:border-accent transition-colors no-underline"
              >
                <div>
                  <span className="text-xs font-medium text-accent uppercase tracking-wider">
                    {rel.category}
                  </span>
                  <h3 className="text-base font-semibold text-fg mt-1 group-hover:text-accent transition-colors">
                    {rel.name}
                  </h3>
                  <p className="mt-2 text-xs text-muted line-clamp-2 leading-relaxed">
                    {rel.description}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent">
                  Convert now <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <AdSlot placement="content-bottom" />
    </div>
  );
}
