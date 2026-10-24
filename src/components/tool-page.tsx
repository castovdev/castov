import Link from "next/link";
import { getExamples } from "@/content/examples";
import { getGuide } from "@/content/guides";
import { toolPath, type Tool } from "@/content/tools";
import { faqJsonLd, howToJsonLd, softwareAppJsonLd, techArticleJsonLd } from "@/lib/seo";
import { Breadcrumb } from "./breadcrumb";
import { ExamplesSection } from "./examples-section";
import { FaqSection } from "./faq-section";
import { JsonLd } from "./json-ld";
import { RelatedTools } from "./related-tools";
import { ToolInterface } from "./tool-interface";
import { ToolTracker } from "./tool-tracker";
import { PinButton } from "./pinned-tools";
import { ShareButton } from "./share-button";
import { ADS } from "@/lib/site";
import { AdSensePlaceholder } from "./adsense-placeholder";

/** Shared layout for every tool page: breadcrumb, H1, tool, then explanation, examples, FAQ, links. */
export function ToolPage({ tool }: { tool: Tool }) {
  const path = toolPath(tool.slug);
  const guide = tool.guide ? getGuide(tool.guide) : undefined;
  const examples = getExamples(tool.slug);

  const structuredData = [
    softwareAppJsonLd({
      name: tool.name,
      description: tool.metaDescription,
      url: path,
      category: "DeveloperApplication",
    }),
    techArticleJsonLd({
      headline: tool.seoTitle,
      description: tool.metaDescription,
      path,
      dependencies: "Modern Web Browser or Castov CLI (npx castov)",
    }),
    ...(tool.howTo && tool.howTo.length > 0
      ? [
          howToJsonLd({
            name: `How to use ${tool.name}`,
            description: tool.metaDescription,
            toolName: tool.name,
            steps: tool.howTo.map((stepText, idx) => ({
              name: `Step ${idx + 1}`,
              text: stepText,
            })),
          }),
        ]
      : []),
  ];

  return (
    <div className="layout-content max-w-5xl py-8 sm:py-12">
      <ToolTracker slug={tool.slug} name={tool.name} />
      <JsonLd data={structuredData} />
      <Breadcrumb
        path={path}
        crumbs={[{ name: "Home", href: "/" }, { name: "Tools", href: "/tools" }, { name: tool.name }]}
      />

      <div className="mt-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20 text-xs font-semibold text-accent">
            {tool.category.replace("-", " ").toUpperCase()}
          </span>
          <div className="flex items-center gap-2">
            <ShareButton title={tool.name} />
            <PinButton slug={tool.slug} />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg">{tool.name}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">{tool.intro}</p>
      </div>

      <section aria-label={`${tool.name} tool`} className="card p-5 sm:p-8 mb-12 border-line/60 shadow-sm">
        <ToolInterface slug={tool.slug} />
      </section>

      <div className={`grid gap-12 ${ADS.client ? "lg:grid-cols-[1fr_300px]" : ""} items-start`}>
        <div className="prose-tf max-w-none">
          {tool.sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              {s.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
          ))}
          {guide ? (
            <p className="mt-6 p-4 bg-hover rounded-lg border border-line text-sm">
              <strong className="font-semibold text-fg">Want the background?</strong> Read our comprehensive guide: <Link href={`/guides/${guide.slug}`} className="font-medium text-accent hover:underline">{guide.name}</Link>.
            </p>
          ) : null}

          <section aria-labelledby="how-to-use" className="mt-10">
            <h2 id="how-to-use">How to use this tool</h2>
            <ol className="space-y-2 mt-4 ml-4">
              {tool.howTo.map((step) => (
                <li key={step} className="text-muted pl-2">{step}</li>
              ))}
            </ol>
          </section>

          <div className="mt-12">
            <ExamplesSection examples={examples} />
          </div>

          <div className="mt-12">
            <FaqSection items={tool.faq} />
          </div>
        </div>

        {ADS.client ? (
          <aside className="sticky top-24 flex flex-col gap-6">
            <AdSensePlaceholder />
          </aside>
        ) : null}
      </div>

      {/* Full-width Related Tools section for strong internal SEO & lower bounce rate */}
      <div className="mt-16 border-t border-line/60 pt-10">
        <RelatedTools slugs={tool.related} />
      </div>

      <JsonLd data={faqJsonLd(tool.faq)} />
    </div>
  );
}
