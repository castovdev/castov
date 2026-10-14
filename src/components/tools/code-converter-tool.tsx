"use client";

import { useState, useMemo, useId } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  Download,
  RotateCcw,
  Sparkles,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { CodeConverter, CODE_CONVERTERS, getConverterBySlug } from "@/lib/code-converters-registry";

interface ToolProps {
  slug?: string;
  converter?: CodeConverter;
}

interface InnerProps {
  converter: CodeConverter;
}

export function CodeConverterTool({ slug, converter: propConverter }: ToolProps) {
  const converter = propConverter || (slug ? getConverterBySlug(slug) : undefined) || CODE_CONVERTERS[0];
  return <CodeConverterToolInner key={converter.slug} converter={converter} />;
}

function CodeConverterToolInner({ converter }: InnerProps) {
  const router = useRouter();
  const inputId = useId();
  const outputId = useId();
  const switcherId = useId();

  const [input, setInput] = useState(converter.defaultSample);
  const [copied, setCopied] = useState(false);

  // Synchronously derive converted code and syntax error without cascading effects
  const { output, error } = useMemo(() => {
    if (!input.trim()) {
      return { output: "", error: null };
    }
    try {
      const res = converter.convert(input);
      return { output: res, error: null };
    } catch (err: any) {
      return {
        output: "",
        error: err?.message || "Syntax error parsing input.",
      };
    }
  }, [input, converter]);

  const handleCopy = async () => {
    if (!output) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Ignored
    }
  };

  const handleDownload = () => {
    if (!output || typeof document === "undefined") return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${converter.slug}-output${converter.outputFileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const inputLineCount = input ? input.split("\n").length : 0;
  const outputLineCount = output ? output.split("\n").length : 0;

  return (
    <div className="w-full flex flex-col gap-5">
      {/* 1. Quick Switcher & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-card border border-line shadow-xs">
        <div className="flex items-center gap-2">
          <label htmlFor={switcherId} className="text-xs font-semibold text-muted uppercase tracking-wider shrink-0">
            Converter:
          </label>
          <div className="relative inline-block w-full sm:w-auto">
            <select
              id={switcherId}
              aria-label="Select converter"
              value={converter.slug}
              onChange={(e) => router.push(`/convert/${e.target.value}`)}
              className="w-full sm:w-auto appearance-none bg-field border border-line rounded-lg px-3 py-1.5 pr-8 text-xs font-bold text-fg cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {CODE_CONVERTERS.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} ({c.category})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setInput(converter.defaultSample)}
            className="btn btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer text-xs"
            aria-label="Load sample code"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Load Sample</span>
          </button>
          <button
            type="button"
            onClick={() => setInput("")}
            className="btn btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer text-xs"
            aria-label="Clear input editor"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* 2. Split-Pane Code Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Pane: Input */}
        <div className="flex flex-col rounded-xl bg-card border border-line overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-4 py-2.5 bg-field/60 border-b border-line text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 rounded bg-card border border-line text-muted">
                {converter.inputLanguage}
              </span>
              <label htmlFor={inputId} className="text-fg font-medium">Input Source</label>
            </div>
            <span className="text-muted text-[11px] font-mono">{inputLineCount} lines</span>
          </div>

          <div className="relative w-full h-[450px]">
            <textarea
              id={inputId}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste or type your input code here..."
              aria-label="Input code editor"
              spellCheck={false}
              className="w-full h-full p-4 font-mono text-xs bg-transparent text-fg resize-none outline-none focus:ring-1 focus:ring-accent/50 leading-relaxed"
            />
          </div>
        </div>

        {/* Right Pane: Output */}
        <div className="flex flex-col rounded-xl bg-card border border-line overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-4 py-2 bg-field/60 border-b border-line text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 rounded bg-accent/15 border border-accent/30 text-accent font-bold">
                {converter.outputLanguage}
              </span>
              <label htmlFor={outputId} className="text-fg font-medium">Converted Output</label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted text-[11px] font-mono mr-2">{outputLineCount} lines</span>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!output}
                aria-label="Copy converted output"
                className="btn btn-secondary btn-sm py-1 px-2.5 flex items-center gap-1 cursor-pointer text-xs disabled:opacity-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!output}
                aria-label="Download converted code file"
                className="btn btn-secondary btn-sm py-1 px-2.5 flex items-center gap-1 cursor-pointer text-xs disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{converter.outputFileExtension}</span>
              </button>
            </div>
          </div>

          <div className="relative w-full h-[450px] bg-field/20">
            {error && (
              <div
                role="status"
                className="absolute top-3 inset-x-3 z-10 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <textarea
              id={outputId}
              value={output}
              readOnly
              aria-label="Converted output editor"
              placeholder="Converted output will appear here in real time..."
              spellCheck={false}
              className="w-full h-full p-4 font-mono text-xs bg-transparent text-fg resize-none outline-none leading-relaxed select-all"
            />
          </div>
        </div>
      </div>

      {/* 3. Helper Info Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted px-2 gap-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time instant in-browser transformation (Zero data leaves your device)</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Target File:</span>
          <code className="text-accent bg-field px-1.5 py-0.5 rounded border border-line font-mono">
            {converter.slug}-output{converter.outputFileExtension}
          </code>
        </div>
      </div>
    </div>
  );
}
