import type { Metadata } from "next";
import Link from "next/link";
import { TOOLS } from "@/content/tools";
import { StaticPage } from "@/components/static-page";
import { ToolCard } from "@/components/tool-card";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Timestamps Hub – Unix Timestamp, Epoch & ISO Tools | Castov",
  description:
    "Everything about Unix timestamps and epoch time: converters, validators, batch tools, milliseconds, ISO 8601 and RFC 3339 in one place.",
  path: "/timestamps",
});

const TS_TOOL_SLUGS = [
  "unix-timestamp-converter",
  "current-unix-timestamp",
  "unix-timestamp-batch-converter",
  "unix-timestamp-validator",
  "epoch-converter",
  "iso-8601-converter",
  "rfc-3339-converter",
];

export default function TimestampsPage() {
  const tsTools = TOOLS.filter((t) => TS_TOOL_SLUGS.includes(t.slug));
  return (
    <StaticPage
      title="Timestamps Hub"
      intro="Explore all tools related to Unix timestamps, epoch time, and ISO/RFC formats. Convert, validate, and batch‑process timestamps with ease."
      crumbs={[{ name: "Home", href: "/" }, { name: "Timestamps" }]}
      path="/timestamps"
    >
      <h2>Timestamp Tools</h2>
      <div className="not-prose grid gap-4 mt-4 mb-8 sm:grid-cols-2">
        {tsTools.map((t) => (
          <ToolCard key={t.slug} tool={t} headingLevel={3} />
        ))}
      </div>
      <p>
        Need deeper reference? Check out our <Link href="/guides">timestamp guides</Link> for detailed explanations of Unix time, epoch, ISO 8601, and RFC 3339 formats.
      </p>
    </StaticPage>
  );
}
