import type { Metadata } from "next";
import Link from "next/link";
import { Cpu, DollarSign, HardDrive, ArrowRight, Sparkles, Zap } from "lucide-react";
import { LLM_MODELS } from "@/lib/llm-specs-registry";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = buildMetadata({
  title: "LLM Model Specs, Token Pricing & VRAM Calculator Directory | Castov",
  description: "Compare foundation LLM models (GPT-4o, Claude 3.5 Sonnet, DeepSeek R1, Llama 3.3, Qwen 2.5). Calculate API token costs and local GPU VRAM requirements.",
  path: "/llm",
});

export default function LlmDirectoryPage() {
  return (
    <div className="layout-content py-10 space-y-12">
      <JsonLd
        data={[
          breadcrumbJsonLd(
            [
              { name: "Home", href: "/" },
              { name: "LLM Models", href: "/llm" },
            ],
            "/llm"
          ),
        ]}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-muted flex items-center gap-2">
        <Link href="/" className="hover:text-fg transition-colors">Home</Link>
        <span>/</span>
        <span className="text-fg font-semibold">LLM Models Directory</span>
      </nav>

      {/* Header */}
      <header className="space-y-4 border-b border-line pb-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent">
            <Sparkles className="w-3.5 h-3.5" /> High-Performance AI Specs
          </span>
          <span className="text-xs text-muted">Client-Side Calculators</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
          LLM Model Specs, Token Costs &amp; VRAM Directory
        </h1>
        <p className="text-muted max-w-3xl text-sm sm:text-base leading-relaxed">
          Benchmark leading closed-source and open-weights models. Calculate your monthly inference API bills, compute exact context window memory overhead, and check minimum GPU hardware for local Ollama execution.
        </p>
      </header>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {LLM_MODELS.map((model) => (
          <Link
            key={model.slug}
            href={`/llm/${model.slug}`}
            className="group card p-6 flex flex-col justify-between hover:border-accent/60 transition-all hover:-translate-y-0.5 shadow-sm"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-accent font-mono">
                    {model.creator}
                  </span>
                  <h2 className="text-lg font-bold text-fg group-hover:text-accent transition-colors">
                    {model.name}
                  </h2>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-field border border-line text-muted">
                  {model.parameters}
                </span>
              </div>

              <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                {model.description}
              </p>

              <div className="space-y-2 pt-2 border-t border-line/60 text-xs">
                <div className="flex items-center justify-between text-muted">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> API Pricing (Input / Output):
                  </span>
                  <span className="font-mono text-fg font-medium">
                    ${model.inputCostPer1M.toFixed(2)} / ${model.outputCostPer1M.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-muted">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-accent" /> Context Window:
                  </span>
                  <span className="font-mono text-fg font-medium">
                    {(model.contextWindow / 1000).toLocaleString()}k tokens
                  </span>
                </div>

                <div className="flex items-center justify-between text-muted">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-amber-500" /> Min VRAM:
                  </span>
                  <span className="font-mono text-fg font-medium">
                    {model.minVramGb > 0 ? `${model.minVramGb} GB` : "Cloud Hosted"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-line/50 flex items-center justify-between text-xs font-medium text-accent">
              <span>View specs &amp; calculate</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* Feature summary callout */}
      <section className="card p-6 bg-field/40 border-line/70 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-fg">Need custom prompt templates &amp; AI guardrails?</h3>
            <p className="text-xs text-muted">Explore our AI tools directory for system prompts, Ollama modelfiles, and structured outputs.</p>
          </div>
        </div>
        <Link
          href="/ai"
          className="btn bg-accent text-white hover:bg-accent/90 text-xs font-semibold px-4 py-2 shrink-0 rounded-lg flex items-center gap-1.5"
        >
          <span>Explore AI Hub</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>
    </div>
  );
}
