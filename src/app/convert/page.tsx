import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { HOME_FAQ, WHY_ITEMS } from "@/content/home";
import { TOOLS } from "@/content/tools";
import { GUIDES } from "@/content/guides";
import { FaqSection } from "@/components/faq-section";
import { Breadcrumb } from "@/components/breadcrumb";
import { AdSlot } from "@/components/ad-slot";
import { CODE_CONVERTERS } from "@/lib/code-converters-registry";
import { ArrowRight, Code2, Database, Network, FileCode2, Clock } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Online Developer Code, Schema & Time Converters | Castov",
  description:
    "Free browser converters: JSON to Zod, Prisma, Drizzle, Rust, Go, cURL to Fetch/Python, Docker to Compose, SQL, Unix timestamps, and date format translators.",
  path: "/convert",
});

const CATEGORIES = [
  { name: "JSON & Schemas", icon: Code2, count: 10, desc: "Convert JSON into typed models, validators, and ORM schemas." },
  { name: "DevOps & Network", icon: Network, count: 5, desc: "Transform cURL, Docker commands, and environment variables." },
  { name: "SQL & Database", icon: Database, count: 3, desc: "Convert SQL CREATE TABLE into Prisma models, TypeScript, or JSON." },
  { name: "Data Formats", icon: FileCode2, count: 4, desc: "Seamless conversions between CSV, JSON, and YAML." },
] as const;

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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumb
        path="/convert"
        crumbs={[{ name: "Home", href: "/" }, { name: "Convert" }]}
      />

      <div className="hero-section -mx-4 px-4 py-12 md:py-16 text-center sm:text-left">
        <div className="mb-6">
          <span className="hero-badge">
            <span className="hero-badge-dot" aria-hidden="true" />
            20+ Developer Code Converters & Time Translators — 100% Private & In-Browser
          </span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-fg">
          Developer Code & Schema Converter Matrix
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted">
          Instant client-side transformation matrix for developers. Convert JSON to Zod, Prisma, Drizzle,
          Rust, Go, and Python Pydantic; transform cURL commands into modern Fetch, Python Requests, or Axios;
          and translate Unix timestamps across all standard ISO/RFC formats.
        </p>
      </div>

      <AdSlot placement="tool-top" />

      {/* Code & Schema Converters Matrix */}
      <section aria-labelledby="code-converters-matrix" className="mt-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 id="code-converters-matrix" className="text-2xl sm:text-3xl font-bold tracking-tight text-fg">
              Code & Schema Converters
            </h2>
            <p className="text-sm text-muted mt-1">
              Select a converter below for instant, zero-latency code generation in your browser.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-accent bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20 self-start sm:self-auto">
            <span>20 Specialized Engines</span>
          </div>
        </div>

        {/* Categories Loop */}
        <div className="space-y-12">
          {CATEGORIES.map((cat) => {
            const catConverters = CODE_CONVERTERS.filter((c) => c.category === cat.name);
            const Icon = cat.icon;

            return (
              <div key={cat.name} className="border-t border-line/60 pt-8 first:border-0 first:pt-0">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent border border-accent/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-fg">{cat.name}</h3>
                    <p className="text-xs text-muted">{cat.desc}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {catConverters.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/convert/${c.slug}`}
                      className="group card block p-4 no-underline hover:border-accent transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-fg group-hover:text-accent transition-colors text-sm">
                          {c.name}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0 ml-2 mt-0.5" />
                      </div>
                      <p className="mt-2 text-xs text-muted line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-muted/80">
                        <span className="bg-field px-1.5 py-0.5 rounded border border-line uppercase">
                          {c.inputLanguage}
                        </span>
                        <span>→</span>
                        <span className="bg-field px-1.5 py-0.5 rounded border border-line uppercase text-accent font-semibold">
                          {c.outputLanguage}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <AdSlot placement="content-middle" />

      {/* Time Format Conversions (Preserved) */}
      <section aria-labelledby="popular-conversions" className="mt-16 border-t border-line/80 pt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2 id="popular-conversions" className="text-2xl font-bold tracking-tight text-fg">
              Time & Timestamp Conversions
            </h2>
            <p className="text-xs text-muted">
              Convert between Unix timestamps, ISO 8601, RFC 3339, RFC 2822, and UTC date formats.
            </p>
          </div>
        </div>

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

      {/* Supported Time Formats Table */}
      <section aria-labelledby="formats-overview" className="mt-12">
        <h3 id="formats-overview" className="section-heading mb-4 text-lg">
          Supported Timestamp Formats
        </h3>
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

      {/* All Time Conversion Tools */}
      <section aria-labelledby="all-tools" className="mt-12">
        <h3 id="all-tools" className="section-heading mb-4 text-lg">
          Time Conversion Tools
        </h3>
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

      {/* Related Guides */}
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
          Ready to convert your code or timestamps?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted">
          Pick any code or timestamp converter above to start instant, client-side transformation.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/convert/json-to-zod" className="btn btn-primary">
            JSON to Zod Converter
          </Link>
          <Link href="/convert/curl-to-fetch" className="btn btn-secondary">
            cURL to Fetch Converter
          </Link>
          <Link href="/unix-timestamp-converter" className="btn btn-secondary">
            Unix Timestamp Converter
          </Link>
        </div>
      </section>
    </div>
  );
}
