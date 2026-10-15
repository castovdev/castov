import { buildMetadata, faqJsonLd, webPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { FaqSection } from "@/components/faq-section";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { ShareButton } from "@/components/share-button";
import { ADS } from "@/lib/site";
import { AdSensePlaceholder } from "@/components/adsense-placeholder";
import { parseCron, describeCron, nextRuns, formatCompact } from "@/lib/time";
import { CRON_PRESETS, getPresetBySlug } from "@/lib/time/cron-presets";

type Params = { expression: string };

// Server component: "next runs" is intentionally relative to the moment the page is
// generated (build/ISR time). Kept outside the component so the clock read is explicit.
function upcomingRunsUtc(cron: Parameters<typeof nextRuns>[0]): string[] {
  return nextRuns(cron, Date.now(), 3).map((ms) => formatCompact(ms, "UTC"));
}
export const dynamicParams = true;

function resolveCronInput(input: string): { expression: string; title?: string; intent?: string } | null {
  const decoded = decodeURIComponent(input).trim();
  const preset = getPresetBySlug(decoded);
  if (preset) {
    return { expression: preset.expression, title: preset.title, intent: preset.intent };
  }

  // Handle underscore-separated format e.g. "0_0_*_*_*"
  const expression = decoded.replace(/_/g, " ");
  const parsed = parseCron(expression);
  if (!parsed.ok) return null;

  return { expression };
}

export function generateStaticParams(): Params[] {
  // Pre-render all 12 preset slugs and Windows-safe schedules (avoiding * in directory names on Windows NTFS)
  const presetParams = CRON_PRESETS.map((p) => ({ expression: p.slug }));
  const expressionParams = [
    { expression: "0_0_1_1_0" },
    { expression: "0_12_1_1_5" },
  ];
  return [...presetParams, ...expressionParams];
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { expression: rawExpression } = await params;
  const resolved = resolveCronInput(rawExpression);

  if (!resolved) {
    return buildMetadata({
      title: "Cron Expression - Castov",
      description: "Explain and translate cron expressions into human-readable schedules.",
      path: `/cron/${rawExpression}`,
    });
  }

  const title = resolved.title
    ? `${resolved.title} Cron Schedule (${resolved.expression}) | Castov`
    : `Cron Expression: ${resolved.expression} - Explained & Translated | Castov`;

  const description = resolved.intent
    ? `${resolved.intent} Complete schedule breakdown, human translation, and crontab syntax for ${resolved.expression}.`
    : `Understand the exact schedule and meaning for the cron expression "${resolved.expression}". Learn how it runs on Linux crontab and server systems.`;

  return buildMetadata({
    title,
    description,
    path: `/cron/${rawExpression}`,
  });
}

export default async function CronPage({ params }: { params: Promise<Params> }) {
  const { expression: rawExpression } = await params;
  const resolved = resolveCronInput(rawExpression);

  if (!resolved) {
    return notFound();
  }

  const { expression, title: presetTitle, intent } = resolved;
  const parsed = parseCron(expression);
  if (!parsed.ok) {
    return notFound();
  }

  const humanDesc = describeCron(parsed.value);
  const nextRunTimes = upcomingRunsUtc(parsed.value);

  const prose = intent
    ? `${intent} In crontab syntax, ${expression} translates to: "${humanDesc}".`
    : `This cron expression (${expression}) translates to: "${humanDesc}". It executes based on the specified minute, hour, day of month, month, and day of week schedule.`;

  const path = `/cron/${rawExpression}`;
  const displayTitle = presetTitle ? `${presetTitle} (${expression})` : expression;

  const faqItems = [
    { q: `What does the cron schedule ${expression} mean?`, a: prose },
    {
      q: "When are the upcoming execution runs?",
      a: nextRunTimes.length > 0
        ? `The next 3 scheduled run times (UTC) are: ${nextRunTimes.join(", ")}.`
        : "No upcoming runs within the search horizon.",
    },
    {
      q: "How do I format a standard cron expression?",
      a: "A standard cron expression consists of 5 fields: minute, hour, day of month, month, and day of week. You can use numbers, asterisks (*), commas, and slashes to define execution times.",
    },
    {
      q: "Where is cron used?",
      a: "Cron is a time-based job scheduler in Unix-like operating systems. Developers use it to set up maintenance scripts, backups, CI/CD jobs, and scheduled background workers.",
    },
  ];

  return (
    <div className="layout-content max-w-5xl py-8 sm:py-12">
      <JsonLd
        data={[
          webPageJsonLd({ name: `Cron Schedule ${displayTitle}`, description: prose, path }),
          faqJsonLd(faqItems),
        ]}
      />

      <Breadcrumb
        path={path}
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Cron Expressions", href: "/cron" },
          { name: displayTitle },
        ]}
      />

      <div className="mt-8 mb-12">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20 text-xs font-semibold text-accent uppercase">
            {presetTitle ? "POPULAR PRESET" : "CRONTAB SCHEDULE"}
          </span>
          <ShareButton title={`Cron Schedule: ${displayTitle}`} />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-fg mb-4">
          Cron Schedule:<br />
          <span className="text-primary font-mono">{expression}</span>
        </h1>
        {presetTitle && (
          <p className="text-lg font-semibold text-fg mb-3">{presetTitle}</p>
        )}
        <p className="text-xl text-muted leading-relaxed max-w-3xl">
          {prose}
        </p>
      </div>

      <div className={`grid ${ADS.client ? "lg:grid-cols-[1fr_300px]" : ""} gap-12 items-start`}>
        <div className="prose-tf max-w-none">
          <section className="bg-card border border-line rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Understanding the Schedule</h2>
            <div className="font-mono text-lg flex flex-wrap gap-4 mb-4">
              {expression.split(" ").map((part, i) => (
                <div key={i} className="flex flex-col items-center bg-field p-3 rounded border border-line min-w-[70px]">
                  <span className="font-bold text-accent mb-1">{part}</span>
                  <span className="text-xs text-muted uppercase">
                    {["Minute", "Hour", "Day(M)", "Month", "Day(W)"][i]}
                  </span>
                </div>
              ))}
            </div>
            {nextRunTimes.length > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-field border border-line">
                <h3 className="text-sm font-bold text-fg mb-2">Upcoming Execution Times (UTC)</h3>
                <ul className="text-xs font-mono text-muted space-y-1 list-disc pl-5">
                  {nextRunTimes.map((run, idx) => (
                    <li key={idx}>{run}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-muted leading-relaxed mt-4">
              This visualizer breaks down the 5 segments of your cron schedule. Adjust the fields in your server&apos;s crontab file to change execution frequency.
            </p>
          </section>

          <div className="mt-12">
            <FaqSection items={faqItems} />
          </div>
        </div>

        {ADS.client ? (
          <aside className="sticky top-24 flex flex-col gap-6">
            <AdSensePlaceholder />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
