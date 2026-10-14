"use client";

import { useState, useMemo, useId } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  RotateCcw,
  Terminal,
  AlertTriangle,
  ChevronDown,
  Wrench,
  Sliders,
  FileCode,
} from "lucide-react";
import {
  ErrorFix,
  ERROR_FIXES,
  getErrorBySlug,
} from "@/lib/error-fixes-registry";

interface ToolProps {
  slug?: string;
  errorData?: ErrorFix;
}

interface InnerProps {
  errorData: ErrorFix;
}

export function ErrorFixGeneratorTool({ slug, errorData: propError }: ToolProps) {
  const errorData = propError || (slug ? getErrorBySlug(slug) : undefined) || ERROR_FIXES[0];
  return <ErrorFixGeneratorToolInner key={errorData.slug} errorData={errorData} />;
}

function ErrorFixGeneratorToolInner({ errorData }: InnerProps) {
  const router = useRouter();
  const switcherId = useId();

  // Initialize variable inputs with defaults
  const initialVars = useMemo(() => {
    const map: Record<string, string> = {};
    for (const v of errorData.configVariables) {
      map[v.key] = v.defaultValue;
    }
    return map;
  }, [errorData]);

  const [vars, setVars] = useState<Record<string, string>>(initialVars);
  const [activeTab, setActiveTab] = useState<"solution" | "diff" | "diagnostics">("solution");
  const [copiedSolution, setCopiedSolution] = useState(false);
  const [copiedCmdIndex, setCopiedCmdIndex] = useState<number | null>(null);

  // Generate customized solution in real-time
  const customSolution = useMemo(() => {
    try {
      return errorData.generateCustomSolution(vars);
    } catch {
      return errorData.fixedCode;
    }
  }, [errorData, vars]);

  const handleVarChange = (key: string, val: string) => {
    setVars((prev) => ({ ...prev, [key]: val }));
  };

  const handleCopySolution = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(customSolution);
        setCopiedSolution(true);
        setTimeout(() => setCopiedSolution(false), 2000);
      }
    } catch {
      // Ignored
    }
  };

  const handleCopyCommand = async (cmd: string, index: number) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(cmd);
        setCopiedCmdIndex(index);
        setTimeout(() => setCopiedCmdIndex(null), 2000);
      }
    } catch {
      // Ignored
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 1. Switcher & Reset Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-card border border-line shadow-xs">
        <div className="flex items-center gap-2">
          <label htmlFor={switcherId} className="text-xs font-semibold text-muted uppercase tracking-wider shrink-0">
            Fix Guide:
          </label>
          <div className="relative inline-block w-full sm:w-auto">
            <select
              id={switcherId}
              aria-label="Select error guide"
              value={errorData.slug}
              onChange={(e) => router.push(`/error-fixes/${e.target.value}`)}
              className="w-full sm:w-auto appearance-none bg-field border border-line rounded-lg px-3 py-1.5 pr-8 text-xs font-bold text-fg cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {ERROR_FIXES.map((err) => (
                <option key={err.slug} value={err.slug}>
                  {err.name} ({err.category})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setVars(initialVars)}
            className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs"
            aria-label="Reset variables"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Params</span>
          </button>
          <button
            type="button"
            onClick={handleCopySolution}
            className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs"
            aria-label="Copy solution code"
          >
            {copiedSolution ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSolution ? "Copied" : "Copy Solution"}</span>
          </button>
        </div>
      </div>

      {/* 2. Error Message Callout Banner */}
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-mono text-red-400">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wider block mb-1 text-[11px] text-red-500">
              Triggered Error Message:
            </span>
            <p className="text-fg whitespace-pre-wrap leading-relaxed select-all">
              {errorData.errorMessage}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Custom Variable Customizer (if variables exist) */}
      {errorData.configVariables.length > 0 && (
        <div className="rounded-xl bg-card border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Sliders className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold uppercase tracking-wider text-fg">
              Customize Solution for Your Environment
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {errorData.configVariables.map((v) => {
              const inputId = `${switcherId}-${v.key}`;
              return (
                <div key={v.key} className="flex flex-col gap-1">
                  <label htmlFor={inputId} className="text-[11px] font-semibold text-muted">
                    {v.label}
                  </label>
                  <input
                    id={inputId}
                    type="text"
                    aria-label={v.label}
                    value={vars[v.key] ?? v.defaultValue}
                    onChange={(e) => handleVarChange(v.key, e.target.value)}
                    placeholder={v.placeholder}
                    className="px-3 py-1.5 rounded-lg border border-line bg-field text-xs font-mono text-fg outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Tab Navigation: Solution Generator / Before & After Diff / Diagnostics */}
      <div className="rounded-xl bg-card border border-line overflow-hidden shadow-xs">
        <div className="flex items-center justify-between border-b border-line bg-field/60 px-4 py-2 gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("solution")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "solution"
                  ? "bg-accent text-white"
                  : "text-muted hover:text-fg hover:bg-hover"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Custom Fix Generator</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("diff")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "diff"
                  ? "bg-accent text-white"
                  : "text-muted hover:text-fg hover:bg-hover"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Broken vs Fixed Code</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("diagnostics")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "diagnostics"
                  ? "bg-accent text-white"
                  : "text-muted hover:text-fg hover:bg-hover"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Terminal Diagnostics ({errorData.diagnosticCommands.length})</span>
            </button>
          </div>

          {activeTab === "solution" && (
            <button
              type="button"
              onClick={handleCopySolution}
              aria-label="Copy solution code block"
              className="btn btn-secondary btn-sm py-1 px-2.5 flex items-center gap-1 text-xs cursor-pointer"
            >
              {copiedSolution ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSolution ? "Copied" : "Copy Fix"}</span>
            </button>
          )}
        </div>

        {/* Tab 1: Solution */}
        {activeTab === "solution" && (
          <div className="p-4 bg-field/30">
            <pre className="text-xs font-mono text-fg overflow-x-auto leading-relaxed max-h-96 whitespace-pre">
              {customSolution}
            </pre>
          </div>
        )}

        {/* Tab 2: Broken vs Fixed Diff */}
        {activeTab === "diff" && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
              <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider block mb-2">
                ❌ Broken Code (Causes Error)
              </span>
              <pre className="text-xs font-mono text-fg overflow-x-auto whitespace-pre">
                {errorData.brokenCode}
              </pre>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider block mb-2">
                ✅ Fixed Code (Resolved)
              </span>
              <pre className="text-xs font-mono text-fg overflow-x-auto whitespace-pre">
                {errorData.fixedCode}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Terminal Diagnostics */}
        {activeTab === "diagnostics" && (
          <div className="p-4 space-y-3">
            <p className="text-xs text-muted mb-2">
              Execute these diagnostic terminal commands on your host or server to identify root cause and confirm system state:
            </p>
            {errorData.diagnosticCommands.map((cmd, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-field border border-line font-mono text-xs text-fg gap-3"
              >
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-accent select-none font-bold">$</span>
                  <span className="truncate">{cmd}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCommand(cmd, idx)}
                  aria-label={`Copy command ${idx + 1}`}
                  className="btn btn-secondary btn-sm py-1 px-2 shrink-0 text-xs flex items-center gap-1"
                >
                  {copiedCmdIndex === idx ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedCmdIndex === idx ? "Copied" : "Copy"}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
