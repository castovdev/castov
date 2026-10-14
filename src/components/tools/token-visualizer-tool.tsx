"use client";

import React, { useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";

interface ModelPricing {
  id: string;
  name: string;
  provider: string;
  inputPerMillion: number;
  outputPerMillion: number;
  contextWindow: string;
}

const MODELS: ModelPricing[] = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", inputPerMillion: 2.5, outputPerMillion: 10.0, contextWindow: "128k" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", inputPerMillion: 0.15, outputPerMillion: 0.6, contextWindow: "128k" },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", inputPerMillion: 3.0, outputPerMillion: 15.0, contextWindow: "200k" },
  { id: "claude-3-5-haiku", name: "Claude 3.5 Haiku", provider: "Anthropic", inputPerMillion: 0.8, outputPerMillion: 4.0, contextWindow: "200k" },
  { id: "gemini-1-5-pro", name: "Gemini 1.5 Pro", provider: "Google", inputPerMillion: 1.25, outputPerMillion: 5.0, contextWindow: "2M" },
  { id: "gemini-1-5-flash", name: "Gemini 1.5 Flash", provider: "Google", inputPerMillion: 0.075, outputPerMillion: 0.3, contextWindow: "1M" },
  { id: "deepseek-v3", name: "DeepSeek V3", provider: "DeepSeek", inputPerMillion: 0.14, outputPerMillion: 0.28, contextWindow: "64k" },
];

const SAMPLE_PROMPT = `You are an expert full-stack engineer and solutions architect.
Analyze the following microservices architecture for potential bottlenecks, race conditions, and scalability risks:
1. User Authentication Service (Go + Redis)
2. Payment Processing Pipeline (Node.js + Kafka + PostgreSQL)
3. Real-time Notification Engine (Rust + WebSockets)
Provide high-priority security recommendations and database indexing strategies.`;

export function TokenCostVisualizerTool() {
  const [text, setText] = useState(SAMPLE_PROMPT);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [outputTokenEstimate, setOutputTokenEstimate] = useState(500);
  const [copied, setCopied] = useState(false);

  // Approximate BPE tokenizer simulation (words and punctuation)
  const tokens = React.useMemo(() => {
    if (!text.trim()) return [];
    // Regex matches words, subwords, numbers and punctuation
    const matches = text.match(/[\w]+|[^\s\w]|\s+/g) || [];
    return matches.map((tokenStr, idx) => {
      const isWhitespace = /^\s+$/.test(tokenStr);
      return {
        id: idx,
        text: tokenStr,
        isWhitespace,
        charCount: tokenStr.length,
      };
    });
  }, [text]);

  const tokenCount = tokens.filter((t) => !t.isWhitespace).length + Math.round(tokens.filter((t) => t.isWhitespace).length * 0.3);
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  // Cost calculations
  const inputCost = (tokenCount / 1_000_000) * selectedModel.inputPerMillion;
  const outputCost = (outputTokenEstimate / 1_000_000) * selectedModel.outputPerMillion;
  const totalCost = inputCost + outputCost;

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tokenColors = [
    "bg-blue-500/15 text-blue-400 border-blue-500/30",
    "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    "bg-purple-500/15 text-purple-400 border-purple-500/30",
    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    "bg-amber-500/15 text-amber-400 border-amber-500/30",
    "bg-rose-500/15 text-rose-400 border-rose-500/30",
  ];

  return (
    <div className="space-y-8">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-field border border-line">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-muted">Target Model:</label>
          <select
            aria-label="Target Model"
            value={selectedModel.id}
            onChange={(e) => {
              const m = MODELS.find((mod) => mod.id === e.target.value);
              if (m) setSelectedModel(m);
            }}
            className="px-3 py-1.5 text-xs rounded-lg bg-bg border border-line text-fg focus:outline-none"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider}) - ${m.inputPerMillion}/M in
              </option>
            ))}
          </select>

          <div className="h-4 w-[1px] bg-line hidden sm:block mx-1" />

          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Context: <strong className="text-fg">{selectedModel.contextWindow}</strong></span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="btn bg-bg border border-line text-muted hover:text-fg text-xs font-semibold px-3 py-1.5 cursor-pointer flex items-center gap-1.5"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Prompt Copied" : "Copy Prompt"}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-field border border-line">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">Estimated Tokens</div>
          <div className="text-2xl font-bold font-mono text-fg mt-1">~{tokenCount.toLocaleString()}</div>
          <div className="text-[10px] text-muted mt-0.5">{charCount} characters • {wordCount} words</div>
        </div>

        <div className="p-4 rounded-xl bg-field border border-line">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">Input Prompt Cost</div>
          <div className="text-2xl font-bold font-mono text-emerald-500 mt-1">
            ${inputCost < 0.0001 ? inputCost.toExponential(2) : inputCost.toFixed(5)}
          </div>
          <div className="text-[10px] text-muted mt-0.5">${selectedModel.inputPerMillion} / 1M tokens</div>
        </div>

        <div className="p-4 rounded-xl bg-field border border-line">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">Est. Response Cost</div>
          <div className="text-2xl font-bold font-mono text-blue-500 mt-1">
            ${outputCost < 0.0001 ? outputCost.toExponential(2) : outputCost.toFixed(5)}
          </div>
          <div className="text-[10px] text-muted mt-0.5">Assumes {outputTokenEstimate} output tokens</div>
        </div>

        <div className="p-4 rounded-xl bg-field border border-line">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">Cost for 100k Calls</div>
          <div className="text-2xl font-bold font-mono text-fg mt-1">
            ${(totalCost * 100_000).toFixed(2)}
          </div>
          <div className="text-[10px] text-muted mt-0.5">Scale production estimation</div>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Left Input Editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">
              Input Prompt Text
            </label>
            <button
              type="button"
              onClick={() => setText(SAMPLE_PROMPT)}
              className="text-xs text-accent hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Load Sample
            </button>
          </div>

          <textarea
            aria-label="Input Prompt Text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={15}
            className="w-full p-4 font-mono text-xs leading-relaxed rounded-2xl bg-field border border-line text-fg focus:outline-none focus:ring-2 focus:ring-accent/40 resize-y"
            placeholder="Paste your prompt, system instructions, or code here..."
          />

          <div className="p-4 rounded-xl bg-field border border-line space-y-2">
            <div className="flex justify-between text-xs text-muted">
              <span>Expected Output Tokens:</span>
              <span className="font-mono text-fg font-semibold">{outputTokenEstimate} tokens</span>
            </div>
            <input
              type="range"
              aria-label="Expected Output Tokens"
              min="100"
              max="4000"
              step="50"
              value={outputTokenEstimate}
              onChange={(e) => setOutputTokenEstimate(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
          </div>
        </div>

        {/* Right Token Visualizer */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center justify-between">
            <span>Visual Token Breakdown (BPE Segmentation)</span>
            <span className="text-[11px] font-mono text-accent">{tokens.filter(t => !t.isWhitespace).length} discrete segments</span>
          </label>

          <div className="w-full min-h-[420px] max-h-[560px] p-5 rounded-2xl bg-field border border-line overflow-y-auto leading-loose text-xs font-mono">
            {tokens.length === 0 ? (
              <span className="text-muted">Type something on the left to see tokens segmented...</span>
            ) : (
              tokens.map((token, i) => {
                if (token.isWhitespace) {
                  return <span key={i}>{token.text}</span>;
                }
                const colorClass = tokenColors[i % tokenColors.length];
                return (
                  <span
                    key={i}
                    className={`inline-block px-1.5 py-0.5 mx-0.5 rounded border text-[11px] font-semibold transition-all hover:scale-110 cursor-default ${colorClass}`}
                    title={`Token #${i}: "${token.text}" (${token.charCount} chars)`}
                  >
                    {token.text}
                  </span>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
