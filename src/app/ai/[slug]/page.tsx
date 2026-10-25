import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AI_TOOLS, AI_CATEGORIES, getAiToolBySlug, getAiToolsByCategory, type AiTool } from "@/lib/ai-tools";
import { buildMetadata, softwareAppJsonLd, howToJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

import { ToolForm } from "@/components/ai-tools/ToolForm";
import { CursorRulesGenerator } from "@/components/ai-tools/CursorRulesGenerator";
import { OllamaModelfileBuilder } from "@/components/ai-tools/OllamaModelfileBuilder";
import { VercelAiSdkGenerator } from "@/components/ai-tools/vercel-ai-sdk-generator";
import { JsonSchemaToolBuilder } from "@/components/ai-tools/JsonSchemaToolBuilder";
import { LlmCostCalculator } from "@/components/ai-tools/LlmCostCalculator";
import { McpConfigBuilder } from "@/components/ai-tools/McpConfigBuilder";
import { GgufVramEstimator } from "@/components/ai-tools/GgufVramEstimator";
import { JsonlDatasetFormatter } from "@/components/ai-tools/JsonlDatasetFormatter";
import { ClaudeSystemPromptBuilder } from "@/components/ai-tools/claude-system-prompt-builder";
import { RagChunkSizeCalculator } from "@/components/ai-tools/RagChunkSizeCalculator";
import { ToolAuthCloudBadge, ToolSaveSnippetButton, ToolHistoryBanner } from "@/components/tool-auth-actions";

export function generateStaticParams() {
  const params = [];
  for (const t of AI_TOOLS) params.push({ slug: t.slug });
  for (const c of AI_CATEGORIES) params.push({ slug: c });
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  const tool = getAiToolBySlug(slug);
  if (tool) {
    const baseMetadata = buildMetadata({
      title: `${tool.name} \u2013 Free AI Developer Tool | Castov`,
      description: `${tool.description} Enhance your AI prompt engineering, developer tools workflow, and code generation with Castov.`,
      path: `/ai/${tool.slug}`,
    });
    
    return {
      ...baseMetadata,
      keywords: tool.keywords.join(", "),
      openGraph: {
        ...baseMetadata.openGraph,
        title: `${tool.name} \u2013 Free AI Developer Tool | Castov`,
      },
      twitter: {
        ...baseMetadata.twitter,
        title: `${tool.name} \u2013 Free AI Developer Tool | Castov`,
      }
    };
  }

  if (AI_CATEGORIES.includes(slug)) {
    const name = slug.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase());
    return buildMetadata({
      title: `${name} AI Tools \u2013 Free Developer Resources | Castov`,
      description: `A collection of developer-focused AI tools for ${name}. Prototype and configure your prompt engineering and code generation workflows.`,
      path: `/ai/${slug}`,
    });
  }

  return {};
}

function CategoryPageView({ category }: { category: string }) {
  const tools = getAiToolsByCategory(category);
  const name = category.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="w-full pb-20">
      {/* Premium Category Hero */}
      <div className="mb-12 relative overflow-hidden rounded-3xl border border-line/20 bg-gradient-to-br from-card/80 to-black/60 p-8 md:p-12 shadow-xl">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[120%] bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="mb-6">
            <Link href="/ai" className="inline-flex items-center text-sm font-medium text-muted hover:text-accent transition-colors bg-field/50 px-3 py-1.5 rounded-full border border-line/40 backdrop-blur-md">
              &larr; Back to Directory
            </Link>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-fg mb-4 drop-shadow-sm">
            {name} <span className="text-muted font-light">Tools</span>
          </h1>
          <p className="text-lg md:text-xl text-muted/90 max-w-2xl leading-relaxed">
            Browse our curated collection of specialized {name.toLowerCase()} utilities designed for modern AI developers.
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/ai/${tool.slug}`}
            className="group relative flex flex-col p-6 rounded-2xl border border-line/40 bg-card/40 hover:bg-hover/40 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-fg group-hover:text-accent transition-colors mb-2">
                {tool.name}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {tool.description}
              </p>
            </div>
            <div className="relative z-10 mt-6 pt-4 border-t border-line/30 text-xs font-semibold text-accent flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 duration-300">
              Launch tool <span aria-hidden="true">&rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ToolPageView({ tool }: { tool: AiTool }) {
  const appLd = softwareAppJsonLd({
    name: tool.name,
    description: tool.description,
    url: `/ai/${tool.slug}`,
    category: "DeveloperApplication",
  });

  const howToLd = howToJsonLd({
    name: tool.pseoContent.h2,
    description: `Instructions on using the ${tool.name}.`,
    steps: [
      { name: "Enter requirements", text: "Fill out the context fields with your specific developer needs." },
      { name: "Generate", text: "Click the generate button to instantly output optimized AI configuration." },
      { name: "Copy and Use", text: "Copy the resulting code block into your project or IDE." }
    ]
  });

  return (
    <>
      <JsonLd data={[appLd, howToLd]} />
      <div className="w-full">
        <div className="mb-6">
          <nav className="flex items-center text-sm font-medium text-muted space-x-2">
            <Link href="/ai" className="hover:text-fg transition-colors">AI Directory</Link>
            <span>&rsaquo;</span>
            <Link href={`/ai/${tool.category}`} className="hover:text-fg transition-colors uppercase tracking-wider text-xs">
              {tool.category}
            </Link>
          </nav>
        </div>

        <header className="mb-12 max-w-3xl">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <ToolAuthCloudBadge />
            <ToolSaveSnippetButton slug={tool.slug} toolName={tool.name} />
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-fg mb-4">
            {tool.name}
          </h1>
          <p className="text-lg text-muted">
            {tool.description}
          </p>
        </header>

        <section aria-label="Tool Interface" className="mb-20">
          {tool.slug === "cursorrules-generator" ? (
            <CursorRulesGenerator />
          ) : tool.slug === "ollama-modelfile-builder" ? (
            <OllamaModelfileBuilder />
          ) : tool.slug === "vercel-ai-sdk-code-generator" ? (
            <VercelAiSdkGenerator />
          ) : tool.slug === "json-schema-tool-calling-generator" ? (
            <JsonSchemaToolBuilder />
          ) : tool.slug === "llm-api-cost-calculator" ? (
            <LlmCostCalculator />
          ) : tool.slug === "mcp-config-builder" ? (
            <McpConfigBuilder />
          ) : tool.slug === "gguf-vram-estimator" ? (
            <GgufVramEstimator />
          ) : tool.slug === "jsonl-dataset-formatter" ? (
            <JsonlDatasetFormatter />
          ) : tool.slug === "claude-system-prompt-builder" ? (
            <ClaudeSystemPromptBuilder />
          ) : tool.slug === "rag-chunk-size-calculator" ? (
            <RagChunkSizeCalculator />
          ) : (
            <ToolForm tool={tool} />
          )}
          <ToolHistoryBanner />
        </section>

        <section aria-labelledby="pseo-heading" className="max-w-3xl prose prose-invert prose-tf">
          <h2 id="pseo-heading">{tool.pseoContent.h2}</h2>
          <p>{tool.pseoContent.content}</p>
          <h3>Why use a dedicated {tool.name.toLowerCase()}?</h3>
          <p>
            As AI developer tools become more complex, writing boilerplate code, complex system prompts, 
            or schema definitions manually is error-prone. This tool guarantees structured, predictable 
            output tailored to your exact stack without the hassle of manual formatting.
          </p>
        </section>
      </div>
    </>
  );
}

export default async function AiUnifiedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const tool = getAiToolBySlug(slug);
  if (tool) {
    return <ToolPageView tool={tool} />;
  }

  if (AI_CATEGORIES.includes(slug)) {
    return <CategoryPageView category={slug} />;
  }

  notFound();
}
