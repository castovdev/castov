import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata, faqJsonLd, softwareAppJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { FaqSection } from "@/components/faq-section";
import { AdSlot } from "@/components/ad-slot";
import { ErrorFixGeneratorTool } from "@/components/tools/error-fix-generator-tool";
import {
  ERROR_FIXES,
  getErrorBySlug,
} from "@/lib/error-fixes-registry";
import { ArrowRight, Sparkles, AlertCircle } from "lucide-react";

interface Params {
  slug: string;
}

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return ERROR_FIXES.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const errorItem = getErrorBySlug(slug);

  if (!errorItem) {
    return buildMetadata({
      title: "Error Fix Guide Not Found - Castov",
      description: "The requested developer error fix guide was not found.",
      path: `/error-fixes/${slug}`,
    });
  }

  return buildMetadata({
    title: `${errorItem.title} | Castov`,
    description: errorItem.summary,
    path: `/error-fixes/${errorItem.slug}`,
  });
}

export default async function ErrorFixPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const errorItem = getErrorBySlug(slug);

  if (!errorItem) {
    notFound();
  }

  const relatedErrors = (errorItem.relatedSlugs || [])
    .map((s) => getErrorBySlug(s))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  if (relatedErrors.length < 3) {
    for (const item of ERROR_FIXES) {
      if (item.slug !== errorItem.slug && !relatedErrors.some((r) => r.slug === item.slug)) {
        relatedErrors.push(item);
        if (relatedErrors.length >= 4) break;
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Schemas */}
      <JsonLd
        data={softwareAppJsonLd({
          name: errorItem.name,
          description: errorItem.summary,
          url: `/error-fixes/${errorItem.slug}`,
          category: "DeveloperApplication",
        })}
      />
      {errorItem.faqs && errorItem.faqs.length > 0 && (
        <JsonLd data={faqJsonLd(errorItem.faqs)} />
      )}

      {/* Breadcrumb */}
      <Breadcrumb
        path={`/error-fixes/${errorItem.slug}`}
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Error Fixes", href: "/error-fixes" },
          { name: errorItem.name },
        ]}
      />

      {/* Hero Header */}
      <div className="hero-section -mx-4 px-4 py-10 md:py-14 text-center sm:text-left">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{errorItem.category} · Developer Error Resolution Lab</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-fg">
          {errorItem.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base sm:text-lg text-muted leading-relaxed">
          {errorItem.summary}
        </p>
      </div>

      <AdSlot placement="tool-top" />

      {/* Main Interactive Tool */}
      <section className="my-8" aria-label={errorItem.name}>
        <ErrorFixGeneratorTool slug={errorItem.slug} />
      </section>

      <AdSlot placement="content-middle" />

      {/* Root Cause Analysis & Deep Technical Breakdown */}
      <section className="my-14 rounded-2xl border border-line bg-card p-6 sm:p-8" aria-labelledby="root-cause-heading">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h2 id="root-cause-heading" className="text-2xl font-bold tracking-tight text-fg">
            Root Cause & Mechanism Analysis
          </h2>
        </div>
        <div className="rounded-xl border border-line bg-field/60 p-5 text-sm text-muted leading-relaxed">
          <p className="text-fg font-medium mb-3">Why does this error occur?</p>
          <p>{errorItem.rootCause}</p>
        </div>
      </section>

      {/* FAQs */}
      {errorItem.faqs && errorItem.faqs.length > 0 && (
        <div className="my-12">
          <FaqSection items={errorItem.faqs} headingId="error-faq" />
        </div>
      )}

      {/* Related Error Fixes */}
      {relatedErrors.length > 0 && (
        <section className="my-14" aria-labelledby="related-errors-heading">
          <div className="flex items-center justify-between mb-6">
            <h2 id="related-errors-heading" className="text-2xl font-bold tracking-tight text-fg">
              Related Developer Error Solutions
            </h2>
            <Link
              href="/error-fixes"
              className="text-sm font-medium text-accent hover:underline flex items-center gap-1"
            >
              Browse All 35 Guides <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {relatedErrors.map((rel) => (
              <Link
                key={rel.slug}
                href={`/error-fixes/${rel.slug}`}
                className="group card p-5 flex flex-col justify-between hover:border-accent transition-colors no-underline"
              >
                <div>
                  <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
                    {rel.category}
                  </span>
                  <h3 className="text-base font-semibold text-fg mt-1 group-hover:text-accent transition-colors">
                    {rel.name}
                  </h3>
                  <p className="mt-2 text-xs text-muted line-clamp-2 leading-relaxed">
                    {rel.summary}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent">
                  View fix guide <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
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
