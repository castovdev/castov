"use client";

import React, { useState, useEffect, useId, useCallback, useRef } from "react";
import {
  Copy,
  Check,
  Download,
  RotateCcw,
  SlidersHorizontal,
  AlertCircle,
  FileCode2,
} from "lucide-react";
import type { ConverterMeta } from "@/lib/converters/types";

// Explicit static map for dynamic imports to allow Next.js tree-shaking & code-splitting
const ENGINE_LOADERS: Record<string, () => Promise<{ convert: (input: string, options?: any) => string }>> = {
  "json-to-zod": () => import("@/lib/converters/engines/json-to-zod"),
  "json-to-typescript": () => import("@/lib/converters/engines/json-to-typescript"),
  "curl-to-fetch": () => import("@/lib/converters/engines/curl-to-fetch"),
};

interface Props {
  meta: ConverterMeta;
  initialOutput?: string;
}

export function ModularCodeConverterTool({ meta, initialOutput }: Props) {
  const inputId = useId();
  const outputId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState(meta.defaultSample);
  const [output, setOutput] = useState(initialOutput || meta.initialOutput || "");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [showOptions, setShowOptions] = useState(true);

  // Initialize options from meta.optionsConfig
  const [options, setOptions] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    if (meta.optionsConfig) {
      for (const opt of meta.optionsConfig) {
        initial[opt.id] = opt.defaultValue;
      }
    }
    return initial;
  });

  // Engine instance ref
  const engineRef = useRef<((input: string, opts?: any) => string) | null>(null);

  // Dynamically load the engine on client mount
  useEffect(() => {
    let isMounted = true;

    const loader = ENGINE_LOADERS[meta.slug];
    if (loader) {
      loader()
        .then((mod) => {
          if (isMounted) {
            engineRef.current = mod.convert;
            setEngineReady(true);
            // Re-derive if input or options were altered before engine load
            try {
              const res = mod.convert(input, options);
              setOutput(res);
              setError(null);
            } catch (err: any) {
              setError(err?.message || "Syntax error parsing input.");
            }
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(`Failed to load converter engine: ${err.message}`);
          }
        });
    } else {
      setError(`Converter engine for '${meta.slug}' is not registered.`);
    }

    return () => {
      isMounted = false;
    };
  }, [meta.slug]);

  // Re-run conversion whenever input or options change
  const runConversion = useCallback(
    (currentInput: string, currentOptions: Record<string, any>) => {
      if (!currentInput.trim()) {
        setOutput("");
        setError(null);
        return;
      }

      if (!engineRef.current) return;

      try {
        const res = engineRef.current(currentInput, currentOptions);
        setOutput(res);
        setError(null);
      } catch (err: any) {
        setError(err?.message || "Syntax error parsing input.");
      }
    },
    []
  );

  useEffect(() => {
    if (engineRef.current && engineReady) {
      runConversion(input, options);
    }
  }, [input, options, runConversion, engineReady]);

  // Handle Tab key inside input textarea for code-friendly indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = input.substring(0, start) + "  " + input.substring(end);
      setInput(newValue);
      // Restore cursor position
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = start + 2;
          inputRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Ignore
    }
  };

  const handleDownload = () => {
    if (!output || typeof document === "undefined") return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta.slug}-output${meta.outputExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetSample = () => {
    setInput(meta.defaultSample);
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError(null);
  };

  const inputLineCount = input ? input.split("\n").length : 0;
  const outputLineCount = output ? output.split("\n").length : 0;
  const hasSecurityWarning = output.includes("SECURITY WARNING (-k / --insecure detected)");

  return (
    <div className="w-full flex flex-col gap-4" data-engine-ready={engineReady ? "true" : "false"}>
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-line shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <FileCode2 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-fg">{meta.name}</span>
            <span className="ml-2 text-[11px] text-muted font-mono">100% Client-Side Engine</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {meta.optionsConfig && meta.optionsConfig.length > 0 && (
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                showOptions
                  ? "bg-accent/15 border-accent/30 text-accent"
                  : "bg-field border-line text-muted hover:text-fg"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Options</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetSample}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-field border border-line text-muted hover:text-fg hover:border-accent/40 transition-colors cursor-pointer"
            title="Reload default sample data"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Sample</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-field border border-line text-muted hover:text-red-400 hover:border-red-500/30 transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* 2. Configurable Options Panel */}
      {showOptions && meta.optionsConfig && meta.optionsConfig.length > 0 && (
        <div className="p-4 rounded-xl bg-card border border-line shadow-2xs">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
            Output Configuration Options
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
            {meta.optionsConfig.map((opt) => {
              // Custom responsive col-span to give the Null Handling select comfortable width
              const colSpanClass =
                opt.id === "nullHandling" || opt.id === "declarationStyle"
                  ? "lg:col-span-4 sm:col-span-2"
                  : opt.type === "boolean"
                  ? "lg:col-span-2 sm:col-span-1"
                  : "lg:col-span-3 sm:col-span-1";

              return (
                <div key={opt.id} className={`flex flex-col gap-1.5 ${colSpanClass}`}>
                  <label htmlFor={`opt-${opt.id}`} className="text-xs font-medium text-fg">
                    {opt.label}
                  </label>
                  {opt.type === "select" ? (
                    <select
                      id={`opt-${opt.id}`}
                      value={options[opt.id]}
                      onChange={(e) => setOptions({ ...options, [opt.id]: e.target.value })}
                      className="w-full bg-field border border-line rounded-lg px-2.5 py-1.5 text-xs text-fg focus:outline-none focus:border-accent font-mono cursor-pointer"
                    >
                      {opt.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : opt.type === "boolean" ? (
                    <label className="flex items-center gap-2 cursor-pointer h-[34px] px-1">
                      <input
                        type="checkbox"
                        id={`opt-${opt.id}`}
                        checked={Boolean(options[opt.id])}
                        onChange={(e) => setOptions({ ...options, [opt.id]: e.target.checked })}
                        className="rounded border-line text-accent focus:ring-accent"
                      />
                      <span className="text-xs text-muted">Enabled</span>
                    </label>
                  ) : (
                    <input
                      type="text"
                      id={`opt-${opt.id}`}
                      value={options[opt.id] || ""}
                      onChange={(e) => setOptions({ ...options, [opt.id]: e.target.value })}
                      className="w-full bg-field border border-line rounded-lg px-2.5 py-1.5 text-xs text-fg focus:outline-none focus:border-accent font-mono"
                    />
                  )}
                  {opt.description && (
                    <span className="text-[10px] text-muted leading-tight">{opt.description}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Dual Editor Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Panel: Input */}
        <div className="flex flex-col rounded-xl border border-line bg-card overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-line bg-field/60 text-xs">
            <span className="font-mono font-semibold uppercase text-muted">
              Input ({meta.inputLanguage})
            </span>
            <span className="text-[11px] text-muted font-mono">{inputLineCount} lines</span>
          </div>

          <div className="relative flex-1">
            <textarea
              id={inputId}
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Paste your raw ${meta.inputLanguage.toUpperCase()} here...`}
              rows={18}
              className="w-full h-full min-h-[380px] p-4 font-mono text-xs text-fg bg-transparent border-0 resize-y focus:outline-none leading-relaxed"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Right Panel: Output (Pre-populated on Server & SSR) */}
        <div className="flex flex-col rounded-xl border border-line bg-card overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-line bg-field/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold uppercase text-accent">
                Output ({meta.outputLanguage})
              </span>
              <span className="text-[11px] text-muted font-mono">{outputLineCount} lines</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!output}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-accent text-white dark:text-[#050505] hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Schema</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!output}
                className="p-1 rounded-md bg-field border border-line text-muted hover:text-fg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Download .ts file"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="relative flex-1">
            <textarea
              id={outputId}
              readOnly
              value={output}
              placeholder="Generated schema will appear here..."
              rows={18}
              className="w-full h-full min-h-[380px] p-4 font-mono text-xs text-fg bg-transparent border-0 resize-y focus:outline-none leading-relaxed"
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      {/* 4. Security Warning Banner (-k / --insecure) */}
      {hasSecurityWarning && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">TLS Verification Disabled (-k / --insecure detected): </span>
            Disabling SSL/TLS certificate validation exposes network requests to Man-in-the-Middle (MitM) interception. Browser{" "}
            <code className="font-mono">fetch()</code> enforces valid HTTPS certificates and cannot bypass TLS checks from client-side code.
          </div>
        </div>
      )}

      {/* 5. Error Banner */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-mono">{error}</div>
        </div>
      )}
    </div>
  );
}
