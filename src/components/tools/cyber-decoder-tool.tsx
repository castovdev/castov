"use client";

import { useState, useId, useMemo, useEffect, useRef } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Sparkles,
  Layers,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Download,
  RotateCcw,
  Share2,
  Check,
  Search,
  Activity,
  Binary,
  Shield,
  FileCode,
  Sliders,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import {
  executeRecipe,
  detectMagic,
  calculateEntropy,
  getEntropyAssessment,
  generateHexDump,
  caesarBruteForce,
  xorBruteForce,
  OPERATIONS,
  PRESET_RECIPES,
  SAMPLE_INPUTS,
  type RecipeStep,
  type OperationDef,
  type OperationId,
  type MagicDetection,
  type BruteForceCandidate,
} from "@/lib/cyber-engine";

const DEFAULT_SAMPLE = SAMPLE_INPUTS[0].value;

export function CyberDecoderTool() {
  const [input, setInput] = useState<string>(DEFAULT_SAMPLE);
  const [steps, setSteps] = useState<RecipeStep[]>([
    { id: "step-1", opId: "base64_decode", params: {}, enabled: true },
  ]);
  const [activeTab, setActiveTab] = useState<"output" | "diagnostics" | "hexdump" | "bruteforce">("output");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpSelectorOpen, setIsOpSelectorOpen] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputId = useId();
  const searchInputId = useId();

  // Load from URL hash if present
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(hash))));
        if (decoded.input && typeof decoded.input === "string") {
          setInput(decoded.input);
        }
        if (Array.isArray(decoded.steps)) {
          setSteps(decoded.steps);
        }
      }
    } catch {
      // Ignore hash parse errors
    }
  }, []);

  // Execute recipe pipeline
  const execution = useMemo(() => {
    return executeRecipe(input, steps);
  }, [input, steps]);

  // Magic detection on input
  const magicDetections = useMemo(() => {
    return detectMagic(input);
  }, [input]);

  // Diagnostics & Entropy
  const entropy = useMemo(() => calculateEntropy(input), [input]);
  const entropyAssessment = useMemo(() => getEntropyAssessment(entropy), [entropy]);
  const hexDumpRows = useMemo(() => generateHexDump(execution.output || input), [execution.output, input]);

  // Brute force candidates
  const bruteForceCandidates = useMemo<BruteForceCandidate[]>(() => {
    const hasCaesar = steps.some((s) => s.enabled && s.opId === "caesar");
    const hasXor = steps.some((s) => s.enabled && s.opId === "xor");
    if (hasCaesar) return caesarBruteForce(input);
    if (hasXor) return xorBruteForce(input);
    return [];
  }, [input, steps]);

  // Filter operations for the Add Step drawer
  const filteredOperations = useMemo(() => {
    if (!searchQuery.trim()) return OPERATIONS;
    const q = searchQuery.toLowerCase();
    return OPERATIONS.filter(
      (op) =>
        op.name.toLowerCase().includes(q) ||
        op.category.toLowerCase().includes(q) ||
        op.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Step manipulation helpers
  const addStep = (opId: OperationId, defaultParams: Record<string, any> = {}) => {
    const op = OPERATIONS.find((o) => o.id === opId);
    const initialParams: Record<string, any> = { ...defaultParams };
    if (op) {
      for (const p of op.params) {
        if (initialParams[p.id] === undefined) {
          initialParams[p.id] = p.default;
        }
      }
    }
    const newStep: RecipeStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      opId,
      params: initialParams,
      enabled: true,
    };
    setSteps((prev) => [...prev, newStep]);
    setIsOpSelectorOpen(false);
    setSearchQuery("");
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleStep = (index: number) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= steps.length) return;
    setSteps((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[newIdx];
      next[newIdx] = temp;
      return next;
    });
  };

  const updateParam = (stepIndex: number, paramId: string, val: any) => {
    setSteps((prev) =>
      prev.map((s, i) =>
        i === stepIndex ? { ...s, params: { ...s.params, [paramId]: val } } : s
      )
    );
  };

  const applyPreset = (preset: (typeof PRESET_RECIPES)[0]) => {
    setInput(preset.sampleInput);
    const newSteps: RecipeStep[] = preset.steps.map((st, i) => ({
      id: `preset-${i}-${Date.now()}`,
      opId: st.opId,
      params: st.params || {},
      enabled: true,
    }));
    setSteps(newSteps);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setInput(content);
      }
    };
    reader.readAsText(file);
  };

  const downloadOutput = () => {
    const blob = new Blob([execution.output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cyber-decoder-output.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareRecipe = () => {
    if (typeof window === "undefined") return;
    try {
      const payload = { input, steps };
      const hash = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const shareUrl = `${window.location.origin}${window.location.pathname}#${hash}`;
      navigator.clipboard.writeText(shareUrl);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    } catch {
      // Fallback
    }
  };

  const useOutputAsInput = () => {
    if (execution.output) {
      setInput(execution.output);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Quick Presets & Share Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-hover/50 rounded-xl border border-line/70">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-accent" /> Presets:
          </span>
          {PRESET_RECIPES.slice(0, 4).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-2.5 py-1 text-xs rounded-md bg-card border border-line hover:border-accent hover:text-accent transition-colors font-medium text-fg shadow-xs"
              aria-label={`Load preset recipe: ${p.title}`}
            >
              {p.title}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={shareRecipe}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors cursor-pointer"
            aria-label="Share recipe and data link"
          >
            {shareToast ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
            {shareToast ? "Copied Share Link!" : "Share Recipe"}
          </button>
          <button
            type="button"
            onClick={() => {
              setInput("");
              setSteps([]);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted hover:text-fg hover:bg-hover rounded-lg transition-colors cursor-pointer"
            aria-label="Clear all inputs and recipe steps"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Main Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Input + Magic Detection + Recipe Pipeline */}
        <div className="space-y-5">
          {/* Input Box */}
          <div className="bg-card rounded-xl border border-line p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label htmlFor={inputId} className="text-sm font-semibold text-fg flex items-center gap-2">
                <FileCode className="w-4 h-4 text-accent" /> Input Data
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="cyber-file-input"
                  aria-label="Upload data file"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 text-xs rounded-md bg-hover text-muted hover:text-fg flex items-center gap-1 transition-colors"
                  aria-label="Upload file to inspect"
                >
                  <Upload className="w-3 h-3" /> Upload
                </button>
                <div className="dropdown relative">
                  <select
                    aria-label="Select sample input"
                    onChange={(e) => {
                      const found = SAMPLE_INPUTS.find((s) => s.label === e.target.value);
                      if (found) setInput(found.value);
                    }}
                    className="text-xs bg-hover border border-line rounded-md px-2 py-1 text-muted hover:text-fg focus:outline-none"
                    value=""
                  >
                    <option value="" disabled>
                      Load Sample...
                    </option>
                    {SAMPLE_INPUTS.map((s) => (
                      <option key={s.label} value={s.label}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <textarea
              id={inputId}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste raw text, Base64, Hex dump, JWT token, URL encoded query, or Morse code here..."
              rows={7}
              className="w-full bg-hover/30 border border-line rounded-lg p-3 font-mono text-xs text-fg focus:outline-hidden focus:border-accent resize-y leading-relaxed"
              aria-label="Input text to decode or transform"
              spellCheck={false}
            />

            <div className="flex items-center justify-between text-xs text-muted pt-1">
              <span>{input.length.toLocaleString()} characters ({new TextEncoder().encode(input).length.toLocaleString()} bytes)</span>
              <span className="flex items-center gap-1.5 font-mono">
                Shannon Entropy: <strong className="text-fg">{entropy}</strong> / 8.0
              </span>
            </div>
          </div>

          {/* ✨ Magic Auto-Detection Banner */}
          {magicDetections.length > 0 && (
            <div className="p-3.5 bg-accent/5 border border-accent/20 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider">
                <Sparkles className="w-4 h-4 animate-pulse text-accent" />
                Magic Format Auto-Detected
              </div>
              <div className="space-y-2">
                {magicDetections.map((m, idx) => (
                  <div
                    key={`${m.type}-${idx}`}
                    className="flex items-center justify-between gap-3 p-2.5 bg-card/80 border border-accent/20 rounded-lg text-xs"
                  >
                    <div>
                      <div className="font-semibold text-fg flex items-center gap-1.5">
                        {m.label}
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-bold">
                          {m.confidence} confidence
                        </span>
                      </div>
                      <p className="text-muted text-[11px] mt-0.5">{m.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addStep(m.suggestedOp, m.suggestedParams)}
                      className="px-2.5 py-1 rounded-md bg-accent text-accent-fg font-medium hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 shadow-xs"
                      aria-label={`Apply magic operation: ${m.suggestedOp}`}
                    >
                      + Apply Operation
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recipe Pipeline Section */}
          <div className="bg-card rounded-xl border border-line p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-semibold text-fg">Recipe Pipeline</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-hover text-muted font-mono font-medium">
                  {steps.filter((s) => s.enabled).length} Active
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpSelectorOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-accent text-accent-fg hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                aria-label="Add new operation to recipe pipeline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Operation
              </button>
            </div>

            {/* Operation Selector Drawer */}
            {isOpSelectorOpen && (
              <div className="p-3 bg-hover/50 border border-line rounded-xl space-y-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5" />
                  <input
                    id={searchInputId}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search operations (Base64, Hex, ROT13, SHA-256, JSON...)"
                    className="w-full bg-card border border-line rounded-lg pl-8 pr-3 py-1.5 text-xs text-fg focus:outline-hidden focus:border-accent"
                    aria-label="Search available operations"
                    autoFocus
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                  {filteredOperations.map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => addStep(op.id)}
                      className="w-full text-left p-2 rounded-lg hover:bg-card border border-transparent hover:border-line transition-colors flex items-center justify-between group"
                      aria-label={`Select operation ${op.name}`}
                    >
                      <div>
                        <div className="text-xs font-semibold text-fg group-hover:text-accent transition-colors flex items-center gap-1.5">
                          {op.name}
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-hover text-muted uppercase font-normal">
                            {op.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted line-clamp-1">{op.description}</p>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-muted group-hover:text-accent shrink-0 ml-2" />
                    </button>
                  ))}
                  {filteredOperations.length === 0 && (
                    <div className="p-4 text-center text-xs text-muted">No operations found matching &quot;{searchQuery}&quot;</div>
                  )}
                </div>
              </div>
            )}

            {/* Step Cards List */}
            <div className="space-y-2.5">
              {steps.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-line rounded-lg text-xs text-muted space-y-2">
                  <p>Recipe pipeline is empty.</p>
                  <button
                    type="button"
                    onClick={() => setIsOpSelectorOpen(true)}
                    className="text-accent underline font-medium hover:opacity-80"
                    aria-label="Click to add your first operation"
                  >
                    Add an operation to start transforming data
                  </button>
                </div>
              ) : (
                steps.map((step, idx) => {
                  const op = OPERATIONS.find((o) => o.id === step.opId);
                  const stepResult = execution.stepResults.find((r) => r.stepIndex === idx);
                  const isError = execution.errorStepIndex === idx;

                  return (
                    <div
                      key={step.id}
                      className={`p-3 rounded-lg border transition-all ${
                        !step.enabled
                          ? "bg-hover/20 border-line/40 opacity-60"
                          : isError
                          ? "bg-red-500/5 border-red-500/40"
                          : "bg-hover/40 border-line hover:border-accent/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-accent/15 text-accent text-[11px] font-bold flex items-center justify-center font-mono shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-fg">{op?.name || step.opId}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-card border border-line text-muted">
                            {op?.category}
                          </span>
                        </div>

                        {/* Controls: Enable toggle, move up/down, delete */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleStep(idx)}
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded-sm uppercase transition-colors cursor-pointer ${
                              step.enabled ? "bg-accent/20 text-accent" : "bg-hover text-muted"
                            }`}
                            aria-label={`Toggle step ${idx + 1}`}
                          >
                            {step.enabled ? "ON" : "OFF"}
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStep(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 rounded-sm text-muted hover:text-fg disabled:opacity-30 cursor-pointer"
                            aria-label={`Move step ${idx + 1} up`}
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStep(idx, "down")}
                            disabled={idx === steps.length - 1}
                            className="p-1 rounded-sm text-muted hover:text-fg disabled:opacity-30 cursor-pointer"
                            aria-label={`Move step ${idx + 1} down`}
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeStep(idx)}
                            className="p-1 rounded-sm text-muted hover:text-red-500 cursor-pointer"
                            aria-label={`Remove step ${idx + 1}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Operation Parameters */}
                      {op && op.params.length > 0 && step.enabled && (
                        <div className="mt-2.5 pt-2 border-t border-line/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {op.params.map((p) => (
                            <div key={p.id} className="flex items-center gap-2">
                              <label htmlFor={`param-${step.id}-${p.id}`} className="text-muted text-[11px] shrink-0">
                                {p.label}:
                              </label>
                              {p.type === "boolean" ? (
                                <input
                                  id={`param-${step.id}-${p.id}`}
                                  type="checkbox"
                                  checked={!!step.params[p.id]}
                                  onChange={(e) => updateParam(idx, p.id, e.target.checked)}
                                  className="rounded-sm accent-accent"
                                  aria-label={p.label}
                                />
                              ) : p.type === "select" ? (
                                <select
                                  id={`param-${step.id}-${p.id}`}
                                  value={step.params[p.id] ?? p.default}
                                  onChange={(e) => updateParam(idx, p.id, e.target.value)}
                                  className="bg-card border border-line rounded-sm px-1.5 py-0.5 text-xs text-fg w-full focus:outline-hidden"
                                  aria-label={p.label}
                                >
                                  {p.options?.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  id={`param-${step.id}-${p.id}`}
                                  type={p.type === "number" ? "number" : "text"}
                                  value={step.params[p.id] ?? p.default}
                                  onChange={(e) => updateParam(idx, p.id, e.target.value)}
                                  className="bg-card border border-line rounded-sm px-2 py-0.5 text-xs text-fg w-full font-mono focus:outline-hidden"
                                  aria-label={p.label}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Step Execution Status / Error */}
                      {isError && (
                        <div className="mt-2 text-[11px] text-red-500 font-mono">
                          Error: {execution.errorMessage}
                        </div>
                      )}
                      {stepResult && !isError && step.enabled && (
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted font-mono">
                          <span className="line-clamp-1 truncate max-w-[240px]">Preview: {stepResult.outputPreview}</span>
                          <span>{stepResult.durationMs}ms</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Output & Diagnostics Workbench */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-line p-4 space-y-3 shadow-xs">
            {/* View Tabs */}
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("output")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeTab === "output" ? "bg-accent text-accent-fg" : "text-muted hover:text-fg hover:bg-hover"
                  }`}
                  aria-label="View Decoded Output"
                >
                  Output
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("diagnostics")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeTab === "diagnostics" ? "bg-accent text-accent-fg" : "text-muted hover:text-fg hover:bg-hover"
                  }`}
                  aria-label="View Data Diagnostics and Entropy"
                >
                  Diagnostics & Entropy
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("hexdump")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeTab === "hexdump" ? "bg-accent text-accent-fg" : "text-muted hover:text-fg hover:bg-hover"
                  }`}
                  aria-label="View Hex Dump Inspector"
                >
                  Hex Dump
                </button>
                {bruteForceCandidates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("bruteforce")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      activeTab === "bruteforce" ? "bg-accent text-accent-fg" : "text-muted hover:text-fg hover:bg-hover"
                    }`}
                    aria-label="View Cipher Brute Force Candidates"
                  >
                    Brute Force ({bruteForceCandidates.length})
                  </button>
                )}
              </div>

              {/* Action Buttons for Output */}
              {activeTab === "output" && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={useOutputAsInput}
                    disabled={!execution.output}
                    className="px-2 py-1 text-xs rounded-md bg-hover text-muted hover:text-fg disabled:opacity-30 transition-colors flex items-center gap-1"
                    aria-label="Feed output back into input"
                  >
                    Use as Input
                  </button>
                  <button
                    type="button"
                    onClick={downloadOutput}
                    disabled={!execution.output}
                    className="px-2 py-1 text-xs rounded-md bg-hover text-muted hover:text-fg disabled:opacity-30 transition-colors flex items-center gap-1"
                    aria-label="Download output as text file"
                  >
                    <Download className="w-3 h-3" /> Save
                  </button>
                  <CopyButton value={execution.output} label="decoded output" />
                </div>
              )}
            </div>

            {/* Tab 1: Output Display */}
            {activeTab === "output" && (
              <div className="space-y-2">
                <textarea
                  readOnly
                  value={execution.output}
                  rows={16}
                  placeholder="Output will appear here after transformations execute..."
                  className="w-full bg-hover/20 border border-line rounded-lg p-3 font-mono text-xs text-fg focus:outline-hidden resize-y leading-relaxed select-all"
                  aria-label="Decoded and transformed output"
                  spellCheck={false}
                />
                <div className="flex items-center justify-between text-xs text-muted pt-1">
                  <span>
                    Output: {execution.output.length.toLocaleString()} chars (
                    {new TextEncoder().encode(execution.output).length.toLocaleString()} bytes)
                  </span>
                  <span className="font-mono">Executed in {execution.totalDurationMs}ms</span>
                </div>
              </div>
            )}

            {/* Tab 2: Diagnostics & Entropy */}
            {activeTab === "diagnostics" && (
              <div className="space-y-4 py-1 text-xs">
                {/* Entropy Gauge */}
                <div className="p-3 bg-hover/40 rounded-xl border border-line space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-fg flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-accent" /> Shannon Entropy Analysis
                    </span>
                    <span className="font-mono font-bold text-sm text-fg">{entropy} / 8.0</span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-2.5 bg-hover rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all rounded-full ${
                        entropyAssessment.level === "high"
                          ? "bg-red-500"
                          : entropyAssessment.level === "medium"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${(entropy / 8) * 100}%` }}
                    />
                  </div>

                  <p className="text-muted text-[11px] leading-relaxed">{entropyAssessment.description}</p>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-hover/30 border border-line">
                    <span className="text-muted text-[11px] block">Characters</span>
                    <strong className="text-sm font-mono text-fg">{input.length.toLocaleString()}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-hover/30 border border-line">
                    <span className="text-muted text-[11px] block">Byte Size</span>
                    <strong className="text-sm font-mono text-fg">
                      {new TextEncoder().encode(input).length.toLocaleString()} B
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-hover/30 border border-line">
                    <span className="text-muted text-[11px] block">Words</span>
                    <strong className="text-sm font-mono text-fg">
                      {input.trim() ? input.trim().split(/\s+/).length.toLocaleString() : 0}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-hover/30 border border-line">
                    <span className="text-muted text-[11px] block">Lines</span>
                    <strong className="text-sm font-mono text-fg">
                      {input ? input.split("\n").length.toLocaleString() : 0}
                    </strong>
                  </div>
                </div>

                {/* Privacy Guarantee Note */}
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-start gap-2.5">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block">100% Client-Side Privacy Guarantee</strong>
                    <span className="text-[11px] text-muted">
                      Your payloads, API keys, tokens, and encrypted ciphertext are processed completely inside your
                      browser&apos;s JavaScript engine. Zero bytes are uploaded to Castov servers.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Hex Dump View */}
            {activeTab === "hexdump" && (
              <div className="space-y-2">
                <div className="max-h-[380px] overflow-auto rounded-lg border border-line bg-card/60 font-mono text-[11px] p-2">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-muted text-[10px] border-b border-line/60">
                        <th className="text-left py-1 w-20">Offset</th>
                        <th className="text-left py-1">Hexadecimal (16 Bytes)</th>
                        <th className="text-left py-1 w-32">ASCII</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hexDumpRows.map((row, i) => (
                        <tr key={i} className="hover:bg-hover/50 font-mono">
                          <td className="text-accent py-0.5">{row.offset}</td>
                          <td className="text-fg py-0.5 tracking-wider">{row.hex}</td>
                          <td className="text-muted py-0.5">{row.ascii}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-muted text-right">Showing up to first 4,096 bytes</p>
              </div>
            )}

            {/* Tab 4: Brute Force Table */}
            {activeTab === "bruteforce" && (
              <div className="space-y-2">
                <div className="max-h-[380px] overflow-auto rounded-lg border border-line bg-card/60 font-mono text-xs">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-muted text-[11px] border-b border-line bg-hover/40">
                        <th className="text-left p-2 w-28">Key</th>
                        <th className="text-left p-2 w-20">Score</th>
                        <th className="text-left p-2">Decrypted Sample</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bruteForceCandidates.map((c, i) => (
                        <tr key={i} className="border-b border-line/30 hover:bg-hover/50">
                          <td className="p-2 font-bold text-accent">{c.key}</td>
                          <td className="p-2">
                            <span
                              className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold ${
                                c.score > 10 ? "bg-green-500/20 text-green-400" : "bg-hover text-muted"
                              }`}
                            >
                              {c.score}
                            </span>
                          </td>
                          <td className="p-2 text-fg truncate max-w-xs">{c.sample}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
