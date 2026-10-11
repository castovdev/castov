import { buildMetadata, faqJsonLd, webPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { FaqSection } from "@/components/faq-section";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";

// Basic parser for unique prose
function parseCron(expression: string) {
  const parts = expression.split("_");
  if (parts.length !== 5) return null;
  return `This cron expression (${parts.join(" ")}) executes based on the specified minute, hour, day of month, month, and day of week schedule. It is widely used in crontab systems for scheduling automated background tasks.`;
}

type Params = { expression: string };
export const dynamicParams = true;

export function generateStaticParams(): Params[] {
  // Use Windows-safe expressions (avoiding * in directory names on Windows NTFS)
  return [{ expression: "0_0_1_1_0" }, { expression: "0_12_1_1_5" }];
}

export async function generateMetadata({ params }: { params: Promise<{ expression: string }> }): Promise<Metadata> {
  const { expression } = await params;
  const decoded = decodeURIComponent(expression).replace(/_/g, " ");
  return buildMetadata({
    title: `Cron Expression: ${decoded} - Explained & Translated`,
    description: `Understand the exact schedule and meaning for the cron expression "${decoded}". Learn how it runs on Linux crontab and server systems.`,
    path: `/cron/${expression}`,
  });
}

export default async function CronPage({ params }: { params: Promise<{ expression: string }> }) {
  const { expression } = await params;
  const decoded = decodeURIComponent(expression).replace(/_/g, " ");
  const prose = parseCron(expression);
  const path = `/cron/${expression}`;

  if (!prose) {
    return notFound();
  }

  const faqItems = [
    { q: `What does the cron expression ${decoded} mean?`, a: prose },
    { q: "How do I format a cron expression?", a: "A standard cron expression consists of 5 fields: minute, hour, day of month, month, and day of week. You can use numbers, asterisks (*), commas, and slashes to define execution times." },
    { q: "Where is cron used?", a: "Cron is a time-based job scheduler in Unix-like operating systems. Developers use it to set up maintenance scripts, backups, and regular email dispatches." },
  ];

  return (
    <div className="layout-content max-w-5xl py-8 sm:py-12">
      <JsonLd data={[
        webPageJsonLd({ name: `Cron Expression ${decoded}`, description: prose, path }),
        faqJsonLd(faqItems)
      ]} />
      
      <Breadcrumb
        path={path}
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Cron Expressions", href: "/tools" },
          { name: decoded }
        ]}
      />

      <div className="mt-8 mb-12">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-fg mb-6">
          Cron Schedule:<br/> <span className="text-primary font-mono">{decoded}</span>
        </h1>
        <p className="text-xl text-muted leading-relaxed max-w-3xl">
          {prose}
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-12 items-start">
        <div className="prose-tf max-w-none">
          <section className="bg-card border border-line rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Understanding the Schedule</h2>
            <div className="font-mono text-lg flex flex-wrap gap-4 mb-4">
              {decoded.split(" ").map((part, i) => (
                <div key={i} className="flex flex-col items-center bg-field p-3 rounded border border-line">
                  <span className="font-bold text-accent mb-1">{part}</span>
                  <span className="text-xs text-muted uppercase">
                    {['Minute', 'Hour', 'Day(M)', 'Month', 'Day(W)'][i]}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-muted leading-relaxed mt-4">
              This visualizer breaks down the 5 segments of your cron schedule. Adjust the fields in your server's crontab file to change execution frequency.
            </p>
          </section>

          <div className="mt-12">
            <FaqSection items={faqItems} />
          </div>
        </div>

        <aside className="sticky top-24 flex flex-col gap-6">
          <div className="w-full min-h-[400px] bg-card border border-line rounded-xl flex flex-col items-center justify-center text-muted text-sm shadow-sm opacity-80 overflow-hidden relative group">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]" />
            <span className="relative z-10 font-mono text-xs mb-2">Advertisement</span>
            <span className="relative z-10 text-center max-w-[200px] leading-relaxed">
              AdSense space reserved.<br/>Sticky placement for high RPM.
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
