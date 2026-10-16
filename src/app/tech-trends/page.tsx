import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { TechTrendsTool } from "@/components/tools/tech-trends-tool";
import { TECH_TREND_TOPICS } from "@/lib/tech-trends-registry";
import { buildMetadata, faqJsonLd, FaqItem } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

const TITLE = "Tech Pulse Radar | Live Developer Trends & GitHub Trending | Castov";
const DESCRIPTION =
  "Real-time developer intelligence radar. Aggregates velocity keywords, viral GitHub repositories, Hacker News discussions, and Dev.to technical articles.";
const PATH = "/tech-trends";

export const metadata: Metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
});

const FAQS: FaqItem[] = [
  {
    q: "How does Tech Pulse Radar collect trending data?",
    a: "Tech Pulse Radar queries public APIs from GitHub (repositories created in the last 7 days sorted by stars), Hacker News Firebase API (top trending algorithmic discussions), and Dev.to (highest-velocity daily technical articles). Results are cached hourly on the server to prevent rate limits and provide instant page loads.",
  },
  {
    q: "How are the Top Velocity Keywords calculated?",
    a: "Our client and server algorithm tokenizes titles, descriptions, and tags from all active streams, strips common English stop words, cross-references an open-source technical taxonomy (such as AI, LLM, Rust, WebAssembly, TypeScript, Docker), and ranks keywords by real-time occurrence.",
  },
  {
    q: "Are my bookmarked articles and repositories private?",
    a: "Yes, 100%. Castov adheres to a strict client-first, zero-telemetry architecture. All bookmarks are saved exclusively in your browser's local storage and are never uploaded or tracked on our servers.",
  },
  {
    q: "Can I filter GitHub repositories by programming language?",
    a: "Yes. You can filter the trending stream by languages including TypeScript, Python, Rust, Go, JavaScript, or view all repositories concurrently alongside interactive keyword filters.",
  },
];

export default function TechTrendsPage() {
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Tools", href: "/tools" },
    { name: "Tech Pulse Radar" },
  ];

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Tech Pulse Radar",
    description: DESCRIPTION,
    url: absoluteUrl(PATH),
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
  };

  return (
    <div className="layout-content max-w-5xl py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }}
      />

      <Breadcrumb path={PATH} crumbs={crumbs} />

      <header className="mt-6 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg">
          Tech Pulse Radar
        </h1>
        <p className="mt-3 max-w-3xl text-base sm:text-lg text-muted leading-relaxed">
          Real-time developer intelligence aggregating high-velocity GitHub repositories, Hacker News debates, and trending technical articles with automated keyword velocity analytics.
        </p>
      </header>

      {/* Main Interactive Tool */}
      <TechTrendsTool />

      {/* Dedicated Topic Radars (30 Indexable Trend Pages) */}
      <section className="mt-14 border-t border-line pt-10 space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-fg">
            Dedicated Technology &amp; Ecosystem Radars (Hourly ISR)
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Browse dedicated live intelligence pages for 30+ high-velocity software engineering domains, languages, and infrastructure stacks.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 text-xs">
          {TECH_TREND_TOPICS.map((t) => (
            <Link
              key={t.slug}
              href={`/tech-trends/${t.slug}`}
              className="p-3 rounded-xl bg-card border border-line hover:border-accent/50 transition-all flex flex-col gap-1 no-underline"
            >
              <span className="font-mono font-bold text-accent">#{t.slug}</span>
              <span className="text-fg font-medium truncate">{t.name}</span>
              <span className="text-[10px] text-muted truncate">{t.category}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* SEO Explanatory Content & Documentation */}
      <section className="mt-16 border-t border-line pt-10 flex flex-col gap-10">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-fg mb-3">
            How Tech Pulse Radar Works
          </h2>
          <p className="text-sm text-muted leading-relaxed mb-4">
            Modern software engineering moves at blistering speed. Keeping track of newly open-sourced tooling, breakthrough framework changes, and critical industry debates across fragmented platforms often leads to information overload.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            Tech Pulse Radar unifies these streams into a consolidated, zero-noise developer dashboard. Rather than relying on algorithmic bias, it measures raw velocity: repositories with the steepest star trajectories, discussions generating the deepest commentary, and practical engineering guides gaining immediate community traction.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight text-fg mb-3">
            Why Velocity Keywords Matter
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            By analyzing co-occurring tokens across GitHub, Hacker News, and technical publications in real time, the Radar highlights emergent architectural paradigms before they hit mainstream conference circuits. Whether it is local-first CRDTs, autonomous agent frameworks, or compiler-level WebAssembly optimizations, clicking any keyword instantly filters all active streams to that specific domain.
          </p>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-fg mb-4">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {FAQS.map((faq) => (
              <div key={faq.q} className="p-4 rounded-xl bg-card border border-line">
                <h3 className="font-semibold text-sm text-fg mb-2">{faq.q}</h3>
                <p className="text-xs text-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
