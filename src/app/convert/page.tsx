import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { HOME_FAQ, WHY_ITEMS } from "@/content/home";
import { TOOLS } from "@/content/tools";
import { GUIDES } from "@/content/guides";
import { FaqSection } from "@/components/faq-section";
import { Breadcrumb } from "@/components/breadcrumb";
import { AdSlot } from "@/components/ad-slot";

export const metadata: Metadata = buildMetadata({
  title: "Convert Between Time Formats – Unix, ISO, RFC, UTC | Castov",
  description:
    "Convert between Unix timestamps, ISO 8601, RFC 3339, RFC 2822, UTC and local date formats. Browse the most popular conversions and use the free online tools.",
  path: "/convert",
});

const FORMATS = [
  { id: "unix-seconds", slug: "unix-seconds", name: "Unix Seconds", example: "1700000000" },
  { id: "unix-milliseconds", slug: "unix-milliseconds", name: "Unix Milliseconds", example: "1700000000123" },
  { id: "iso-8601", slug: "iso-8601", name: "ISO 8601", example: "2023-11-14T22:13:20Z" },
  { id: "rfc-3339", slug: "rfc-3339", name: "RFC 3339", example: "2023-11-14T22:13:20.000Z" },
  { id: "utc", slug: "utc", name: "UTC Date", example: "Tue, 14 Nov 2023 22:13:20 GMT" },
  { id: "local-date", slug: "local-date", name: "Local Date", example: "2023-11-14 22:13" },
] as const;

const POPULAR_PAIRS: { from: (typeof FORMATS)[number]["id"]; to: (typeof FORMATS)[number]["id"] }[] = [
  { from: "unix-seconds", to: "iso-8601" },
  { from: "unix-seconds", to: "utc" },
  { from: "unix-seconds", to: "rfc-3339" },
  { from: "unix-seconds", to: "local-date" },
  { from: "unix-milliseconds", to: "iso-8601" },
  { from: "unix-milliseconds", to: "utc" },
  { from: "iso-8601", to: "unix-seconds" },
  { from: "iso-8601", to: "rfc-3339" },
  { from: "iso-8601", to: "utc" },
  { from: "rfc-3339", to: "iso-8601" },
  { from: "rfc-3339", to: "unix-seconds" },
  { from: "utc", to: "unix-seconds" },
];

const PAIR_TOOL_MAP: Record<string, string> = {
  "unix-seconds-iso-8601": "/unix-to-iso-8601",
  "unix-seconds-utc": "/utc-converter",
  "unix-seconds-rfc-3339": "/rfc-3339-converter",
  "unix-seconds-local-date": "/timestamp-to-date",
  "unix-milliseconds-iso-8601": "/epoch-milliseconds",
  "unix-milliseconds-utc": "/utc-converter",
  "iso-8601-unix-seconds": "/iso-8601-to-unix",
  "iso-8601-rfc-3339": "/iso-8601-converter",
  "iso-8601-utc": "/utc-converter",
  "rfc-3339-iso-8601": "/rfc-3339-converter",
  "rfc-3339-unix-seconds": "/iso-8601-to-unix",
  "utc-unix-seconds": "/date-to-timestamp",
};

function formatById(id: (typeof FORMATS)[number]["id"]) {
  return FORMATS.find((f) => f.id === id)!;
}

function pairLabel(fromId: (typeof FORMATS)[number]["id"], toId: (typeof FORMATS)[number]["id"]) {
  const from = formatById(fromId);
  const to = formatById(toId);
  return `${from.name} to ${to.name}`;
}

function pairDescription(fromId: (typeof FORMATS)[number]["id"], toId: (typeof FORMATS)[number]["id"]) {
  const from = formatById(fromId);
  const to = formatById(toId);
  return `Convert ${from.example} → ${to.example}`;
}

export default function ConvertHubPage() {
  const timestampTools = TOOLS.filter(
    (t) =>
      t.category === "Timestamp" ||
      ["unix-to-iso-8601", "iso-8601-to-unix", "iso-8601-converter", "rfc-3339-converter", "utc-converter", "date-format-converter"].includes(t.slug),
  );

  const relatedGuides = GUIDES.filter((g) =>
    ["what-is-unix-time", "seconds-vs-milliseconds-timestamps", "iso-8601-date-format-guide", "utc-vs-gmt"].includes(g.slug),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumb
        path="/convert"
        crumbs={[{ name: "Home", href: "/" }, { name: "Convert" }]}
      />

      <div className="hero-section -mx-4 px-4 py-12 md:py-16">
        <div className="mb-6">
          <span className="hero-badge">
            <span className="hero-badge-dot" aria-hidden="true" />
            15+ format conversions — free, private, browser-based
          </span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-fg">
          Convert Between Time Formats
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          Translate between Unix timestamps, ISO 8601, RFC 3339, RFC 2822, UTC and local
          date formats. The most-used pairs are listed below, or pick a tool to get started.
        </p>
      </div>

      <AdSlot placement="tool-top" />

      <section aria-labelledby="popular-conversions" className="mt-10">
        <h2 id="popular-conversions" className="section-heading mb-6">
          Popular Conversions
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 list-none p-0">
          {POPULAR_PAIRS.map((pair) => {
            const targetUrl = PAIR_TOOL_MAP[`${pair.from}-${pair.to}`] || "/tools";
            return (
              <li key={`${pair.from}-${pair.to}`}>
                <Link
                  href={targetUrl}
                  className="card block h-full p-4 no-underline hover:border-accent transition-colors"
                  aria-label={`Convert ${pairLabel(pair.from, pair.to)}`}
                >
                  <span className="block font-semibold text-fg">
                    {pairLabel(pair.from, pair.to)}
                  </span>
                  <span className="mt-1 block text-xs text-muted font-mono truncate">
                    {pairDescription(pair.from, pair.to)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <AdSlot placement="content-middle" />

      <section aria-labelledby="formats-overview" className="mt-10">
        <h2 id="formats-overview" className="section-heading mb-6">
          Supported Formats
        </h2>
        <div className="not-prose overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-hover">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted border-b border-line">
                  Format
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted border-b border-line">
                  Example
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted border-b border-line">
                  Precision
                </th>
              </tr>
            </thead>
            <tbody>
              {FORMATS.map((f) => (
                <tr key={f.id} className="border-b border-line">
                  <td className="px-4 py-3 font-semibold text-fg">{f.name}</td>
                  <td className="px-4 py-3 font-mono text-sm text-muted">
                    {f.example}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {f.id === "unix-milliseconds"
                      ? "Milliseconds"
                      : f.id === "unix-seconds"
                        ? "Seconds"
                        : f.id === "local-date"
                          ? "Minutes"
                          : "Seconds"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="all-tools" className="mt-12">
        <h2 id="all-tools" className="section-heading mb-6">
          All Conversion Tools
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 list-none p-0">
          {timestampTools.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/${t.slug}`}
                className="card block h-full p-4 no-underline hover:border-accent transition-colors"
              >
                <span className="block font-semibold text-fg">{t.name}</span>
                <span className="mt-1 block text-sm text-muted">
                  {t.cardDescription}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <AdSlot placement="content-bottom" />

      <section aria-labelledby="related-guides" className="mt-12">
        <h2 id="related-guides" className="section-heading mb-6">
          Related Guides
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 list-none p-0">
          {relatedGuides.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/guides/${g.slug}`}
                className="guide-card card block h-full p-5 no-underline"
              >
                <span className="block font-bold text-fg">{g.name}</span>
                <span className="mt-2 block text-sm leading-relaxed text-muted">
                  {g.summary}
                </span>
                <span className="mt-3 block text-xs text-muted">
                  {g.readingMinutes} min read
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="why-section">
        <h2 id="why-section" className="section-heading mb-6">
          Why Use Castov?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_ITEMS.slice(0, 3).map((item) => (
            <div key={item.title} className="card p-5">
              <h3 className="font-bold text-lg">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12">
        <FaqSection items={HOME_FAQ} headingId="faq" />
      </div>

      <section className="cta-band mt-12 p-10 text-center" aria-labelledby="cta-heading">
        <h2 id="cta-heading" className="text-3xl font-extrabold tracking-tight">
          Ready to convert a timestamp?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted">
          Pick any format pair above, or use the Unix Timestamp Converter for the
          most common case.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/unix-timestamp-converter" className="btn btn-primary">
            Unix Timestamp Converter
          </Link>
          <Link href="/iso-8601-converter" className="btn btn-secondary">
            ISO 8601 Converter
          </Link>
        </div>
      </section>
    </div>
  );
}
