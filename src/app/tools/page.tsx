import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/content/guides";
import { TOOL_CATEGORIES, TOOLS } from "@/content/tools";
import { StaticPage } from "@/components/static-page";
import { ToolCard } from "@/components/tool-card";
import { buildMetadata } from "@/lib/seo";

const TITLE = "All Developer Tools | Castov";
const DESCRIPTION =
  "Browse all free Castov tools: timestamp converters, date calculators, time zone tools, developer utilities, and experimental labs.";

export const metadata: Metadata = buildMetadata({ title: TITLE, description: DESCRIPTION, path: "/tools" });

export default function ToolsPage() {
  const mainCategories = TOOL_CATEGORIES.filter((c) => c !== "Labs");
  const labsTools = TOOLS.filter((t) => t.category === "Labs");

  return (
    <StaticPage
      title="Tools"
      intro={`${TOOLS.length} free tools for working with Unix time, dates, configurations, and developer workflows. Every tool runs instantly in your browser.`}
      crumbs={[{ name: "Home", href: "/" }, { name: "Tools" }]}
      path="/tools"
    >
      {mainCategories.map((category) => {
        const tools = TOOLS.filter((t) => t.category === category);
        return (
          <section key={category} aria-labelledby={`cat-${category}`} className="mb-10">
            <h2 id={`cat-${category}`} className="mb-4 text-xl font-bold tracking-tight">
              {category} ({tools.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((t) => (
                <ToolCard key={t.slug} tool={t} headingLevel={3} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Labs Section (Positioned Below Main Categories) */}
      <section aria-labelledby="cat-Labs" className="mb-12 mt-14 pt-8 border-t border-line">
        <div className="flex items-center gap-3 mb-4">
          <h2 id="cat-Labs" className="text-xl font-bold tracking-tight text-fg">
            Labs ({labsTools.length})
          </h2>
          <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Experimental tools
          </span>
        </div>
        <p className="text-sm text-muted mb-6">
          Advanced experiments in browser-to-browser networking, steganography, AST manipulation, and client-side computing.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {labsTools.map((t) => (
            <ToolCard key={t.slug} tool={t} headingLevel={3} />
          ))}
        </div>
      </section>

      <h2>Learn the background</h2>
      <p>
        Not sure which tool you need? Start with{" "}
        <Link href={`/guides/${GUIDES[0].slug}`}>{GUIDES[0].name}</Link>, or browse all <Link href="/guides">guides</Link>.
      </p>
    </StaticPage>
  );
}
