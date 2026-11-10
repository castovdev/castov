import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BLOG_LEGACY_REDIRECTS } from "@/lib/blog-redirects";
import Link from "next/link";
import { BLOG_POSTS, getBlogPost } from "@/content/blog";
import { Breadcrumb } from "@/components/breadcrumb";
import { RelatedTools } from "@/components/related-tools";
import { JsonLd } from "@/components/json-ld";
import { buildMetadata, breadcrumbJsonLd, techArticleJsonLd, faqJsonLd } from "@/lib/seo";
import type { ToolSlug } from "@/content/tools";
import { Clock, Calendar, ArrowLeft, ShieldCheck, Terminal, HelpCircle } from "lucide-react";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return buildMetadata({
    title: post.seoTitle,
    description: post.metaDescription,
    path: `/blog/${post.slug}`,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) {
    const legacyTarget = BLOG_LEGACY_REDIRECTS[slug];
    if (legacyTarget) {
      redirect(`/blog/${legacyTarget}`);
    }
    notFound();
  }

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: post.title },
  ];

  const jsonLdData: any[] = [
    breadcrumbJsonLd(breadcrumbs, `/blog/${post.slug}`),
    techArticleJsonLd({
      headline: post.title,
      description: post.summary,
      path: `/blog/${post.slug}`,
      proficiencyLevel: "Intermediate",
    }),
  ];

  if (post.faqs && post.faqs.length > 0) {
    jsonLdData.push(
      faqJsonLd(post.faqs.map((f) => ({ q: f.question, a: f.answer })))
    );
  }

  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 space-y-8">
      <JsonLd data={jsonLdData} />
      <Breadcrumb crumbs={breadcrumbs} path={`/blog/${post.slug}`} />

      {/* Back button */}
      <div>
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-fg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Engineering Blog
        </Link>
      </div>

      {/* Header Info */}
      <header className="space-y-4 border-b border-line pb-8">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono font-medium text-accent bg-accent/10 px-2.5 py-1 rounded-md border border-accent/20">
            {post.category}
          </span>
          <span className="text-line">•</span>
          <span className="flex items-center gap-1 text-muted font-mono">
            <Clock className="w-3.5 h-3.5" />
            {post.readingMinutes} min read
          </span>
          <span className="text-line">•</span>
          <span className="flex items-center gap-1 text-muted font-mono">
            <Calendar className="w-3.5 h-3.5" />
            {post.publishedAt}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-fg leading-tight">
          {post.title}
        </h1>

        <p className="text-base sm:text-lg text-muted leading-relaxed">
          {post.summary}
        </p>

        {/* Author / Trust metadata */}
        <div className="flex items-center gap-3 pt-2 text-xs text-muted">
          <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center font-bold text-accent font-mono text-[11px]">
            C
          </div>
          <div>
            <div className="font-semibold text-fg">{post.author.name}</div>
            <div className="text-[11px] text-muted">{post.author.role}</div>
          </div>
        </div>
      </header>

      {/* Table of contents */}
      <div className="p-4 sm:p-5 rounded-2xl border border-line bg-card/60 space-y-2">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-muted">
          Table of Contents
        </div>
        <ul className="space-y-1.5 text-sm">
          {post.sections.map((s, idx) => (
            <li key={s.heading}>
              <a
                href={`#section-${idx}`}
                className="text-muted hover:text-accent transition-colors flex items-center gap-2"
              >
                <span className="text-accent font-mono text-xs">{idx + 1}.</span>
                <span>{s.heading}</span>
              </a>
            </li>
          ))}
          {post.faqs && post.faqs.length > 0 && (
            <li>
              <a
                href="#faqs-section"
                className="text-muted hover:text-accent transition-colors flex items-center gap-2"
              >
                <span className="text-accent font-mono text-xs">{post.sections.length + 1}.</span>
                <span>Frequently Asked Questions</span>
              </a>
            </li>
          )}
        </ul>
      </div>

      {/* Main Body Sections */}
      <div className="space-y-10 prose-tf">
        {post.sections.map((s, idx) => (
          <section key={s.heading} id={`section-${idx}`} className="space-y-4 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-fg border-b border-line/50 pb-2">
              {s.heading}
            </h2>
            {s.paragraphs.map((p, pIdx) => (
              <p key={pIdx} className="text-sm sm:text-base text-muted/90 leading-relaxed">
                {p}
              </p>
            ))}
            {s.code ? (
              <div className="my-4">
                <pre className="code-block p-4 rounded-xl border border-line bg-[#0d1117] text-gray-200 text-xs sm:text-sm font-mono overflow-x-auto" tabIndex={0}>
                  <code>{s.code}</code>
                </pre>
              </div>
            ) : null}
          </section>
        ))}

        {/* FAQs Section */}
        {post.faqs && post.faqs.length > 0 && (
          <section id="faqs-section" className="space-y-4 pt-6 border-t border-line scroll-mt-20">
            <div className="flex items-center gap-2 text-xl font-bold text-fg">
              <HelpCircle className="w-5 h-5 text-accent" />
              <h2>Frequently Asked Questions</h2>
            </div>
            <div className="grid gap-3">
              {post.faqs.map((faq, fIdx) => (
                <div
                  key={fIdx}
                  className="p-4 rounded-xl border border-line bg-card/60 space-y-1.5"
                >
                  <h3 className="text-sm sm:text-base font-semibold text-fg">
                    {faq.question}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Related Castov Tools Section */}
      {post.tools && post.tools.length > 0 && (
        <RelatedTools
          slugs={post.tools as ToolSlug[]}
          heading="Interactive Castov Tools for This Topic"
        />
      )}

      {/* Platform Banner CTA */}
      <div className="my-10 p-6 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 via-card to-emerald-500/10 space-y-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-accent uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Local-First &amp; Zero-Telemetry Computing</span>
        </div>
        <h3 className="text-lg font-bold text-fg">
          Automate Your Development Workflows Without Cloud Telemetry
        </h3>
        <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
          Castov provides 61+ client-side utilities, local secret vaults, and CLI tools that execute entirely in your browser or native Windows workstation. Zero tracking, zero tokens sent to third-party clouds.
        </p>
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link
            href="/tools"
            className="btn bg-accent text-accent-fg font-semibold text-xs px-4 py-2 rounded-xl shadow-sm hover:opacity-90 transition-opacity"
          >
            Explore 61+ Tools
          </Link>
          <Link
            href="/cli"
            className="btn bg-card border border-line text-fg font-semibold text-xs px-4 py-2 rounded-xl hover:border-accent transition-colors inline-flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5 text-accent" />
            <span>Castov CLI</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
