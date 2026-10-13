import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { HOME_FAQ, WHY_ITEMS } from "@/content/home";
import { TOOLS } from "@/content/tools";
import { GUIDES } from "@/content/guides";
import { FaqSection } from "@/components/faq-section";
import { Breadcrumb } from "@/components/breadcrumb";
import { AdSlot } from "@/components/ad-slot";
import { ToolHost } from "@/components/pseo/tool-host";
import { parseCron, describeCron, nextRuns, formatCompact } from "@/lib/time";

export const metadata: Metadata = buildMetadata({
  title: "Cron Expression Generator – Cheatsheet, Examples, Next Runs | Castov",
  description:
    "Build and explain cron expressions with a free online generator. Browse the field reference, 12 popular presets, see next run times, and read the cheatsheet.",
  path: "/cron",
});

const CRON_FIELDS: {
  name: string;
  position: string;
  allowed: string;
  special: string;
  example: string;
}[] = [
  {
    name: "Minute",
    position: "1st",
    allowed: "0–59",
    special: "* , - /",
    example: "*/15",
  },
  {
    name: "Hour",
    position: "2nd",
    allowed: "0–23",
    special: "* , - /",
    example: "9-17",
  },
  {
    name: "Day of month",
    position: "3rd",
    allowed: "1–31",
    special: "* , - /",
    example: "1,15",
  },
  {
    name: "Month",
    position: "4th",
    allowed: "1–12 or JAN–DEC",
    special: "* , - /",
    example: "JAN-DEC",
  },
  {
    name: "Day of week",
    position: "5th",
    allowed: "0–6 or SUN–SAT (0 = Sunday)",
    special: "* , - /",
    example: "1-5",
  },
];

import { CRON_PRESETS } from "@/lib/time/cron-presets";

const PRESETS = CRON_PRESETS;


function describeAndNext(expression: string): { desc: string; next: string[] } {
  const parsed = parseCron(expression);
  if (!parsed.ok) return { desc: "—", next: [] };
  const desc = describeCron(parsed.value);
  const next = nextRuns(parsed.value, Date.now(), 3).map((ms) =>
    formatCompact(ms, "UTC"),
  );
  return { desc, next };
}

export default function CronHubPage() {
  const cronTools = TOOLS.filter(
    (t) =>
      ["cron-generator", "unix-timestamp-converter", "current-unix-timestamp", "date-difference"].includes(t.slug),
  );

  const relatedGuides = GUIDES.filter((g) =>
    ["cron-expressions-explained", "what-is-unix-time", "seconds-vs-milliseconds-timestamps"].includes(g.slug),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumb
        path="/cron"
        crumbs={[{ name: "Home", href: "/" }, { name: "Cron" }]}
      />

      <div className="hero-section -mx-4 px-4 py-12 md:py-16">
        <div className="mb-6">
          <span className="hero-badge">
            <span className="hero-badge-dot" aria-hidden="true" />
            Generator · Cheatsheet · Next-run preview
          </span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-fg">
          Cron Expression Generator &amp; Cheatsheet
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          Build standard 5-field cron expressions, read the plain-English description,
          see the next five run times, and browse the 12 most-used presets below.
        </p>
      </div>

      <AdSlot placement="tool-top" />

      <section aria-labelledby="field-ref" className="mt-10">
        <h2 id="field-ref" className="section-heading mb-6">
          Field Reference
        </h2>
        <p className="mt-0 mb-4 text-muted leading-relaxed">
          A standard cron expression has exactly five whitespace-separated fields, in the
          order below. The two <em>day</em> fields combine with an OR when either is
          restricted; use <code>*</code> on the other when you only want one of them.
        </p>
        <div className="not-prose overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-hover">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted border-b border-line">
                  #
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted border-b border-line">
                  Field
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted border-b border-line">
                  Allowed values
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted border-b border-line">
                  Special chars
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted border-b border-line">
                  Example
                </th>
              </tr>
            </thead>
            <tbody>
              {CRON_FIELDS.map((f) => (
                <tr key={f.name} className="border-b border-line">
                  <td className="px-4 py-3 text-muted">{f.position}</td>
                  <td className="px-4 py-3 font-semibold text-fg">{f.name}</td>
                  <td className="px-4 py-3 text-muted font-mono text-xs">
                    {f.allowed}
                  </td>
                  <td className="px-4 py-3 text-muted font-mono text-xs">
                    {f.special}
                  </td>
                  <td className="px-4 py-3 text-accent font-mono text-xs">
                    {f.example}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="card p-4 border">
            <div className="font-bold text-fg">Operators</div>
            <ul className="mt-2 text-sm text-muted space-y-1 list-disc pl-5">
              <li>
                <code>*</code> — every allowed value
              </li>
              <li>
                <code>a,b</code> — list of specific values
              </li>
              <li>
                <code>a-b</code> — inclusive range
              </li>
              <li>
                <code>*/n</code> — every <em>n</em>th step
              </li>
              <li>
                <code>JAN–DEC</code>, <code>SUN–SAT</code> — named months/weekdays
              </li>
            </ul>
          </div>
          <div className="card p-4 border">
            <div className="font-bold text-fg">Macros</div>
            <ul className="mt-2 text-sm text-muted space-y-1 list-disc pl-5">
              <li>
                <code>@hourly</code> → <code>0 * * * *</code>
              </li>
              <li>
                <code>@daily</code> → <code>0 0 * * *</code>
              </li>
              <li>
                <code>@weekly</code> → <code>0 0 * * 0</code>
              </li>
              <li>
                <code>@monthly</code> → <code>0 0 1 * *</code>
              </li>
              <li>
                <code>@yearly</code> → <code>0 0 1 1 *</code>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <AdSlot placement="content-middle" />

      <section aria-labelledby="presets" className="mt-12">
        <h2 id="presets" className="section-heading mb-6">
          Popular Presets
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 list-none p-0">
          {PRESETS.map((p) => {
            const { desc } = describeAndNext(p.expression);
            return (
              <div key={p.slug} className="card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link
                    href={`/cron/${p.slug}`}
                    className="font-semibold text-fg hover:text-accent no-underline"
                  >
                    {p.title}
                  </Link>
                  <span className="rounded-sm bg-hover px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted font-semibold">
                    {p.category}
                  </span>
                </div>
                <div className="font-mono text-sm text-accent mb-1 break-all">
                  {p.expression}
                </div>
                <div className="text-xs text-muted italic">{desc}</div>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  {p.intent}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="cron-tool" className="mt-12">
        <h2 id="cron-tool" className="section-heading mb-6">
          Cron Generator
        </h2>
        <div className="card p-4 sm:p-6">
          <ToolHost config={{ component: "cron" }} />
        </div>
      </section>

      <section aria-labelledby="all-tools" className="mt-12">
        <h2 id="all-tools" className="section-heading mb-6">
          Related Tools
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 list-none p-0">
          {cronTools.map((t) => (
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
          Guides
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
          Building a cron schedule?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted">
          Try the Cron Generator to pick a preset, then copy the expression and see
          the next five run times instantly.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/cron-generator" className="btn btn-primary">
            Cron Generator Tool
          </Link>
          <Link href="/guides/cron-expressions-explained" className="btn btn-secondary">
            Read the Guide
          </Link>
        </div>
      </section>
    </div>
  );
}
