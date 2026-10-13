import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { HOME_FAQ, WHY_ITEMS, DEV_SNIPPETS } from "@/content/home";
import { TOOLS } from "@/content/tools";
import { GUIDES } from "@/content/guides";
import { FaqSection } from "@/components/faq-section";
import { Breadcrumb } from "@/components/breadcrumb";
import { AdSlot } from "@/components/ad-slot";
import { CopyButton } from "@/components/ui/copy-button";
import { TASKS, TASK_IDS } from "@/data/tasks";

export const metadata: Metadata = buildMetadata({
  title: "Unix Timestamp & Time Code Examples by Language | Castov",
  description:
    "Working code snippets for Unix timestamps, ISO 8601, and dates in 14 languages. Browse the quick reference grid and developer guides.",
  path: "/code",
});

const LANGUAGE_SLUGS = [
  "javascript",
  "python",
  "java",
  "go",
  "php",
  "ruby",
  "csharp",
  "rust",
  "bash",
  "kotlin",
  "swift",
  "cpp",
  "c",
  "perl",
] as const;

const LANGUAGE_META: Record<
  (typeof LANGUAGE_SLUGS)[number],
  { name: string; precision: string; kind: string }
> = {
  javascript: { name: "JavaScript", precision: "ms", kind: "language" },
  python: { name: "Python", precision: "μs", kind: "language" },
  java: { name: "Java", precision: "ms", kind: "language" },
  go: { name: "Go", precision: "ns", kind: "language" },
  php: { name: "PHP", precision: "s", kind: "language" },
  ruby: { name: "Ruby", precision: "μs", kind: "language" },
  csharp: { name: "C#", precision: "ms", kind: "language" },
  rust: { name: "Rust", precision: "ns", kind: "language" },
  bash: { name: "Bash", precision: "s", kind: "shell" },
  kotlin: { name: "Kotlin", precision: "ms", kind: "language" },
  swift: { name: "Swift", precision: "ns", kind: "language" },
  cpp: { name: "C++", precision: "ns", kind: "language" },
  c: { name: "C", precision: "s", kind: "language" },
  perl: { name: "Perl", precision: "s", kind: "language" },
};

const TOP_TASK_IDS: (typeof TASK_IDS)[number][] = [
  "get-current-timestamp",
  "timestamp-to-date",
  "date-to-timestamp",
];

function taskShortLabel(taskId: (typeof TASK_IDS)[number]): string {
  switch (taskId) {
    case "get-current-timestamp":
      return "Current timestamp";
    case "timestamp-to-date":
      return "Timestamp → Date";
    case "date-to-timestamp":
      return "Date → Timestamp";
    case "milliseconds-to-date":
      return "Milliseconds → Date";
    case "iso-8601-format":
      return "Format ISO 8601";
    case "iso-8601-parse":
      return "Parse ISO 8601";
    default:
      return taskId;
  }
}

export default function CodeHubPage() {
  const topLangs = LANGUAGE_SLUGS.slice(0, 10);
  const allLangs = LANGUAGE_SLUGS;
  const devTools = TOOLS.filter(
    (t) =>
      t.category === "Developer" ||
      t.category === "Timestamp" ||
      [
        "unix-timestamp-converter",
        "epoch-converter",
        "date-to-timestamp",
        "timestamp-to-date",
        "unix-timestamp-validator",
        "unix-timestamp-batch-converter",
        "current-unix-timestamp",
        "iso-8601-converter",
        "cron-generator",
      ].includes(t.slug),
  ).slice(0, 9);

  const relatedGuides = GUIDES.filter((g) =>
    [
      "what-is-unix-time",
      "seconds-vs-milliseconds-timestamps",
      "iso-8601-date-format-guide",
      "year-2038-problem",
      "time-zones-and-dst-for-developers",
    ].includes(g.slug),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumb
        path="/code"
        crumbs={[{ name: "Home", href: "/" }, { name: "Code" }]}
      />

      <div className="hero-section -mx-4 px-4 py-12 md:py-16">
        <div className="mb-6">
          <span className="hero-badge">
            <span className="hero-badge-dot" aria-hidden="true" />
            14 languages · 84 verified snippets · open reference
          </span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-fg">
          Time &amp; Timestamp Code by Programming Language
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          Copy-paste-ready code for getting the current Unix timestamp, converting between
          timestamps and dates, and working with ISO 8601 — in every mainstream language,
          with gotchas documented and outputs verified.
        </p>
      </div>

      <AdSlot placement="tool-top" />

      <section aria-labelledby="quick-reference" className="mt-10">
        <h2 id="quick-reference" className="section-heading mb-6">
          Quick Reference — Top 10 Languages
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {topLangs.map((slug) => {
            const meta = LANGUAGE_META[slug];
            return (
              <div
                key={slug}
                className="card p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-fg">{meta.name}</h3>
                    <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted">
                      <span className="rounded-sm bg-hover px-1.5 py-0.5 font-mono">
                        {meta.precision}
                      </span>
                      <span className="capitalize">{meta.kind}</span>
                    </div>
                  </div>
                  <Link
                    href="/unix-timestamp-converter"
                    className="btn btn-secondary btn-sm"
                    aria-label={`View ${meta.name} tools`}
                  >
                    Open
                  </Link>
                </div>
                <ul className="space-y-2">
                  {TOP_TASK_IDS.map((tid) => {
                    const task = TASKS.find((t) => t.id === tid);
                    const targetTool = tid === "get-current-timestamp" ? "/current-unix-timestamp" : `/${tid}`;
                    return (
                      <li key={tid}>
                        <Link
                          href={targetTool}
                          className="flex items-center justify-between gap-2 rounded-md p-2 hover:bg-hover transition-colors no-underline"
                        >
                          <span className="text-sm text-fg">
                            {taskShortLabel(tid)}
                          </span>
                          <span className="text-xs text-muted truncate max-w-[55%] font-mono">
                            {task?.output}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="all-languages" className="mt-12">
        <h2 id="all-languages" className="section-heading mb-6">
          All Languages
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 list-none p-0">
          {allLangs.map((slug) => {
            const meta = LANGUAGE_META[slug];
            return (
              <li key={slug}>
                <div
                  className="card block h-full p-4 hover:border-accent transition-colors"
                >
                  <span className="block font-semibold text-fg">{meta.name}</span>
                  <span className="mt-1 block text-xs text-muted">
                    {TASK_IDS.length} examples · precision {meta.precision}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <AdSlot placement="content-middle" />

      <section aria-labelledby="developer-snippets" className="mt-12">
        <h2 id="developer-snippets" className="section-heading mb-6">
          Copy-Paste Snippets
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {DEV_SNIPPETS.map((item) => (
            <div key={item.label} className="card p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="!my-0 text-sm font-semibold text-muted">
                  {item.label}
                </h3>
                <CopyButton value={item.code} label={item.label} />
              </div>
              <pre className="code-block mt-2 overflow-x-auto">
                <code className="font-mono text-sm">{item.code}</code>
              </pre>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="dev-tools" className="mt-12">
        <h2 id="dev-tools" className="section-heading mb-6">
          Developer Tools
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 list-none p-0">
          {devTools.map((t) => (
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
          Converting timestamps in code?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted">
          Pick your language above, or use the Unix Timestamp Converter to verify
          outputs before you ship.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/unix-timestamp-converter" className="btn btn-primary">
            Unix Timestamp Converter
          </Link>
          <Link href="/cheatsheets" className="btn btn-secondary">
            Developer Cheat Sheets
          </Link>
        </div>
      </section>
    </div>
  );
}
