import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata, faqJsonLd, softwareAppJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { FaqSection } from "@/components/faq-section";
import { AdSlot } from "@/components/ad-slot";
import { RegexPatternTesterTool } from "@/components/tools/regex-pattern-tester-tool";
import {
  REGEX_PATTERNS,
  getPatternBySlug,
} from "@/lib/regex-patterns-registry";
import { ArrowRight, Sparkles, Binary } from "lucide-react";

interface Params {
  slug: string;
}

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return REGEX_PATTERNS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pattern = getPatternBySlug(slug);

  if (!pattern) {
    return buildMetadata({
      title: "Regex Pattern Not Found - Castov",
      description: "The requested regular expression pattern was not found.",
      path: `/regex-patterns/${slug}`,
    });
  }

  return buildMetadata({
    title: `${pattern.title} | Castov`,
    description: pattern.description,
    path: `/regex-patterns/${pattern.slug}`,
  });
}

export default async function RegexPatternPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const pattern = getPatternBySlug(slug);

  if (!pattern) {
    notFound();
  }

  const relatedPatterns = (pattern.relatedSlugs || [])
    .map((s) => getPatternBySlug(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (relatedPatterns.length < 3) {
    for (const item of REGEX_PATTERNS) {
      if (item.slug !== pattern.slug && !relatedPatterns.some((r) => r.slug === item.slug)) {
        relatedPatterns.push(item);
        if (relatedPatterns.length >= 4) break;
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Schemas */}
      <JsonLd
        data={softwareAppJsonLd({
          name: pattern.name,
          description: pattern.description,
          url: `/regex-patterns/${pattern.slug}`,
          category: "DeveloperApplication",
        })}
      />
      {pattern.faqs && pattern.faqs.length > 0 && (
        <JsonLd data={faqJsonLd(pattern.faqs)} />
      )}

      {/* Breadcrumb */}
      <Breadcrumb
        path={`/regex-patterns/${pattern.slug}`}
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Regex Patterns", href: "/regex-patterns" },
          { name: pattern.name },
        ]}
      />

      {/* Hero Header */}
      <div className="hero-section -mx-4 px-4 py-10 md:py-14 text-center sm:text-left">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{pattern.category} · In-Browser Regular Expression Lab</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-fg">
          {pattern.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base sm:text-lg text-muted leading-relaxed">
          {pattern.description}
        </p>
      </div>

      <AdSlot placement="tool-top" />

      {/* Interactive Regex Tester Tool */}
      <section className="my-8" aria-label={pattern.name}>
        <RegexPatternTesterTool slug={pattern.slug} />
      </section>

      <AdSlot placement="content-middle" />

      {/* Token Breakdown & Technical Deep Dive */}
      <section className="my-14 rounded-2xl border border-line bg-card p-6 sm:p-8" aria-labelledby="tokens-breakdown-heading">
        <div className="flex items-center gap-2 mb-4">
          <Binary className="w-5 h-5 text-accent" />
          <h2 id="tokens-breakdown-heading" className="text-2xl font-bold tracking-tight text-fg">
            Regular Expression Token Breakdown
          </h2>
        </div>
        <p className="text-sm text-muted mb-6 leading-relaxed">
          {pattern.explanation} Each component of the regular expression serves a distinct syntactical purpose as mapped below:
        </p>

        <div className="not-prose overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-field border-b border-line">
              <tr>
                <th className="py-3 px-4 font-semibold text-muted text-xs uppercase tracking-wider">Token Pattern</th>
                <th className="py-3 px-4 font-semibold text-muted text-xs uppercase tracking-wider">Name / Component</th>
                <th className="py-3 px-4 font-semibold text-muted text-xs uppercase tracking-wider">Function & Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {pattern.tokens.map((t, idx) => (
                <tr key={idx} className="hover:bg-hover/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs font-bold text-accent whitespace-nowrap bg-field/30">
                    {t.token}
                  </td>
                  <td className="py-3 px-4 font-medium text-fg text-sm whitespace-nowrap">
                    {t.label}
                  </td>
                  <td className="py-3 px-4 text-muted text-xs leading-relaxed">
                    {t.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQs */}
      {pattern.faqs && pattern.faqs.length > 0 && (
        <div className="my-12">
          <FaqSection items={pattern.faqs} headingId="regex-faq" />
        </div>
      )}

      {/* Related Regex Patterns */}
      {relatedPatterns.length > 0 && (
        <section className="my-14" aria-labelledby="related-patterns-heading">
          <div className="flex items-center justify-between mb-6">
            <h2 id="related-patterns-heading" className="text-2xl font-bold tracking-tight text-fg">
              Related Regular Expressions
            </h2>
            <Link
              href="/regex-patterns"
              className="text-sm font-medium text-accent hover:underline flex items-center gap-1"
            >
              Browse All 40 Patterns <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {relatedPatterns.map((rel) => (
              <Link
                key={rel.slug}
                href={`/regex-patterns/${rel.slug}`}
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
                    {rel.description}
                  </p>
                  <code className="mt-3 block text-[11px] font-mono text-muted/80 bg-field px-2 py-1 rounded border border-line truncate">
                    /{rel.pattern}/{rel.flags}
                  </code>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent">
                  Test regex <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
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
