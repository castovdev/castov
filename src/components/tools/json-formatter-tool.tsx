"use client";

import { useState, useId } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { CheckCircle2, AlertCircle, Sparkles, Minimize2, ArrowUpDown, Trash2, Clipboard } from "lucide-react";

type IndentOption = "2" | "4" | "tab";

function sortJsonKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortJsonKeys);
  }
  if (obj !== null && typeof obj === "object") {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    for (const key of keys) {
      sorted[key] = sortJsonKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

function parseJsonError(raw: string, err: Error): { message: string; line?: number; column?: number } {
  const lineColMatch = err.message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (lineColMatch) {
    return {
      message: err.message,
      line: parseInt(lineColMatch[1], 10),
      column: parseInt(lineColMatch[2], 10),
    };
  }

  const posMatch = err.message.match(/position\s+(\d+)/i);
  if (posMatch) {
    const pos = Math.min(parseInt(posMatch[1], 10), raw.length);
    const upToPos = raw.slice(0, pos);
    const lines = upToPos.split("\n");
    return {
      message: err.message,
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
    };
  }

  return { message: err.message };
}

const SAMPLE_JSON = `{
  "project": "Castov",
  "version": 2,
  "openSource": true,
  "stats": {
    "speed": "instant",
    "privacy": "100% client-side"
  },
  "tags": ["developer", "tools", "privacy"]
}`;

export function JsonFormatterTool() {
  const [input, setInput] = useState<string>(SAMPLE_JSON);
  const [output, setOutput] = useState<string>("");
  const [indent, setIndent] = useState<IndentOption>("2");
  const [sortKeysEnabled, setSortKeysEnabled] = useState<boolean>(false);
  const [errorInfo, setErrorInfo] = useState<{ message: string; line?: number; column?: number } | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const inputId = useId();
  const outputId = useId();

  const handleFormat = (customInput?: string, overrideIndent?: IndentOption, overrideSort?: boolean) => {
    const textToProcess = customInput !== undefined ? customInput : input;
    const currentIndent = overrideIndent ?? indent;
    const shouldSort = overrideSort !== undefined ? overrideSort : sortKeysEnabled;

    if (!textToProcess.trim()) {
      setOutput("");
      setErrorInfo(null);
      setIsValid(null);
      return;
    }

    try {
      let parsed = JSON.parse(textToProcess);
      if (shouldSort) {
        parsed = sortJsonKeys(parsed);
      }
      const space = currentIndent === "tab" ? "\t" : parseInt(currentIndent, 10);
      const formatted = JSON.stringify(parsed, null, space);
      setOutput(formatted);
      setErrorInfo(null);
      setIsValid(true);
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      setErrorInfo(parseJsonError(textToProcess, e));
      setIsValid(false);
    }
  };

  const handleMinify = () => {
    if (!input.trim()) return;
    try {
      let parsed = JSON.parse(input);
      if (sortKeysEnabled) {
        parsed = sortJsonKeys(parsed);
      }
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      setErrorInfo(null);
      setIsValid(true);
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      setErrorInfo(parseJsonError(input, e));
      setIsValid(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      handleFormat(text);
    } catch {
      // Ignore clipboard read failure
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setErrorInfo(null);
    setIsValid(null);
  };

  const loadSample = () => {
    setInput(SAMPLE_JSON);
    handleFormat(SAMPLE_JSON);
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-card border border-line rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="indent-select" className="text-sm font-medium text-muted">Indentation:</label>
          <select
            id="indent-select"
            value={indent}
            onChange={(e) => {
              const val = e.target.value as IndentOption;
              setIndent(val);
              handleFormat(input, val);
            }}
            className="px-3 py-1.5 text-sm bg-field border border-line rounded-lg text-fg focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="2">2 Spaces</option>
            <option value="4">4 Spaces</option>
            <option value="tab">Tab</option>
          </select>

          <button
            type="button"
            onClick={() => {
              const next = !sortKeysEnabled;
              setSortKeysEnabled(next);
              handleFormat(input, indent, next);
            }}
            className={`btn btn-sm inline-flex items-center gap-1.5 ${
              sortKeysEnabled ? "btn-primary" : "btn-secondary"
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort Keys
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleFormat()}
            className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Format & Validate
          </button>
          <button
            type="button"
            onClick={handleMinify}
            className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            Minify
          </button>
          <button
            type="button"
            onClick={handlePaste}
            className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
          >
            <Clipboard className="w-3.5 h-3.5" />
            Paste
          </button>
          <button
            type="button"
            onClick={loadSample}
            className="btn btn-secondary btn-sm"
          >
            Sample
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="btn btn-secondary btn-sm text-danger hover:text-danger"
            aria-label="Clear all inputs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {isValid === true && (
        <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-xl text-success text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Valid JSON syntax. Formatted successfully.</span>
        </div>
      )}

      {isValid === false && errorInfo && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Invalid JSON Syntax:</span>
          </div>
          <p className="font-mono text-xs pl-6">{errorInfo.message}</p>
          {errorInfo.line !== undefined && (
            <p className="text-xs pl-6 text-muted">
              Location: <span className="font-semibold text-fg">Line {errorInfo.line}</span>, <span className="font-semibold text-fg">Column {errorInfo.column}</span>
            </p>
          )}
        </div>
      )}

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Column */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="text-sm font-semibold text-fg">
              Input JSON
            </label>
            <span className="text-xs text-muted font-mono">
              {input.length.toLocaleString()} characters ({new Blob([input]).size.toLocaleString()} bytes)
            </span>
          </div>
          <textarea
            id={inputId}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (isValid !== null) handleFormat(e.target.value);
            }}
            placeholder="Paste raw or unformatted JSON here..."
            rows={16}
            className="w-full p-4 font-mono text-sm bg-field border border-line rounded-xl text-fg focus:outline-none focus:ring-2 focus:ring-accent resize-y"
            spellCheck={false}
          />
        </div>

        {/* Output Column */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor={outputId} className="text-sm font-semibold text-fg">
              Formatted Output
            </label>
            <div className="flex items-center gap-2">
              {output && (
                <span className="text-xs text-muted font-mono">
                  {output.split("\n").length} lines
                </span>
              )}
              <CopyButton value={output} label="formatted JSON" disabled={!output} />
            </div>
          </div>
          <textarea
            id={outputId}
            value={output}
            readOnly
            placeholder="Formatted or minified output will appear here..."
            rows={16}
            className="w-full p-4 font-mono text-sm bg-card border border-line rounded-xl text-fg focus:outline-none resize-y"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
