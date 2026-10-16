import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cpu, DollarSign, HardDrive, Terminal, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import { LLM_MODELS, getLlmModel } from "@/lib/llm-specs-registry";
import { buildMetadata, breadcrumbJsonLd, faqJsonLd, FaqItem } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

export const dynamicParams = false;

export function generateStaticParams() {
  return LLM_MODELS.map((m) => ({ model: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ model: string }>;
}): Promise<Metadata> {
  const { model } = await params;
  const info = getLlmModel(model);
  if (!info) return {};

  return buildMetadata({
    title: `${info.name} API Pricing, Token Cost & GPU VRAM Calculator`,
    description: `Calculate API costs and local GPU hardware requirements for ${info.name} by ${info.creator}. Token pricing, context window, and Ollama commands.`,
    path: `/llm/${info.slug}`,
  });
}

export default async function LlmModelPage({
  params,
}: {
  params: Promise<{ model: string }>;
}) {
  const { model } = await params;
  const info = getLlmModel(model);
  if (!info) notFound();

  const cost100kInput = ((100_000 / 1_000_000) * info.inputCostPer1M).toFixed(4);
  const cost100kOutput = ((100_000 / 1_000_000) * info.outputCostPer1M).toFixed(4);

  const faqs: FaqItem[] = [
    {
      q: `How much does ${info.name} cost per 1M tokens?`,
      a: `${info.name} costs $${info.inputCostPer1M.toFixed(2)} per million input tokens and $${info.outputCostPer1M.toFixed(2)} per million output tokens.`,
    },
    {
      q: `What GPU is needed to run ${info.name} locally?`,
      a: info.minVramGb > 0
        ? `${info.name} requires at least ${info.minVramGb}GB VRAM for 4-bit quantization. Recommended hardware: ${info.recommendedGpu}.`
        : `${info.name} is a closed-source proprietary model hosted exclusively on cloud API infrastructure.`,
    },
    {
      q: `What is the context window size of ${info.name}?`,
      a: `${info.name} supports a context window of ${info.contextWindow.toLocaleString()} tokens.`,
    },
  ];

  const otherModels = LLM_MODELS.filter((m) => m.slug !== info.slug);

  return (
    <div className="layout-content py-10 space-y-10">
      <JsonLd
        data={[
          breadcrumbJsonLd(
            [
              { name: "Home", href: "/" },
              { name: "LLM Calculator", href: "/llm" },
              { name: info.name },
            ],
            `/llm/${info.slug}`
          ),
          faqJsonLd(faqs),
        ]}
      />

      <nav aria-label="Breadcrumb" className="text-xs text-muted flex items-center gap-2">
        <Link href="/" className="hover:text-fg">Home</Link>
        <span>/</span>
        <Link href="/llm" className="hover:text-fg">LLM Models</Link>
        <span>/</span>
        <span className="text-fg font-semibold">{info.name}</span>
      </nav>

      <header className="space-y-4 border-b border-line pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5" /> {info.creator} • {info.parameters}
          </span>
          <span className="text-xs text-muted font-mono">
            {info.contextWindow.toLocaleString()} Token Context
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
          {info.name} Token Pricing &amp; VRAM Calculator
        </h1>
        <p className="text-muted max-w-3xl text-sm sm:text-base leading-relaxed">
          {info.description} Ideal for: <strong className="text-fg">{info.bestFor}</strong>.
        </p>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-card border border-line space-y-3">
          <div className="flex items-center gap-2 text-accent text-sm font-semibold">
            <DollarSign className="w-4 h-4" />
            <span>API Cost (per 1M Tokens)</span>
          </div>
          <div className="space-y-1 font-mono">
            <div className="text-2xl font-extrabold text-fg">
              ${info.inputCostPer1M.toFixed(2)} <span className="text-xs font-normal text-muted">/ 1M Input</span>
            </div>
            <div className="text-xl font-bold text-muted">
              ${info.outputCostPer1M.toFixed(2)} <span className="text-xs font-normal text-muted">/ 1M Output</span>
            </div>
          </div>
          <p className="text-xs text-muted">
            100k input tokens = ~${cost100kInput} | 100k output = ~${cost100kOutput}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-line space-y-3">
          <div className="flex items-center gap-2 text-emerald-500 text-sm font-semibold">
            <HardDrive className="w-4 h-4" />
            <span>Local VRAM &amp; GPU Specs</span>
          </div>
          <div className="text-2xl font-extrabold text-fg font-mono">
            {info.minVramGb > 0 ? `${info.minVramGb} GB` : "Cloud Hosted"}
          </div>
          <p className="text-xs text-fg leading-relaxed">
            {info.recommendedGpu}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-line space-y-3">
          <div className="flex items-center gap-2 text-amber-500 text-sm font-semibold">
            <Terminal className="w-4 h-4" />
            <span>Local Ollama Run</span>
          </div>
          <div className="p-3 rounded-lg bg-field border border-line font-mono text-xs text-accent select-all">
            <code>{info.ollamaCommand}</code>
          </div>
          <p className="text-xs text-muted">
            Inspect port 11434: <Link href="/ports/11434" className="text-accent underline">Port 11434 Guide</Link>
          </p>
        </div>
      </div>

      {/* Compare Models */}
      <section className="space-y-4 pt-4 border-t border-line">
        <h2 className="text-lg font-bold text-fg">Compare Other AI Foundation Models</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {otherModels.map((m) => (
            <Link
              key={m.slug}
              href={`/llm/${m.slug}`}
              className="p-3 rounded-xl bg-card border border-line hover:border-accent/40 flex flex-col gap-1 no-underline transition-colors"
            >
              <span className="font-bold text-fg truncate">{m.name}</span>
              <span className="text-muted text-[11px] truncate">${m.inputCostPer1M}/1M in</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-fg">Frequently Asked Questions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {faqs.map((f) => (
            <div key={f.q} className="p-4 rounded-xl bg-card border border-line space-y-2">
              <h3 className="font-semibold text-xs text-fg">{f.q}</h3>
              <p className="text-xs text-muted leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
