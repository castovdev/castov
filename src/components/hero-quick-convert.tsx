"use client";

import { useState, useId } from "react";
import { Copy, Check, Clock } from "lucide-react";

export function HeroQuickConvert() {
  const [input, setInput] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const inputId = useId();

  const trimmed = input.trim();

  let parsedDate: Date | null = null;
  let detectedType: string = "";

  if (trimmed) {
    // Pure number (Unix timestamp in seconds or milliseconds)
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      const num = Number(trimmed);
      if (!Number.isNaN(num)) {
        // Threshold: 1e11 (Sun Nov 16 1973 in ms vs ~3170 in seconds)
        if (Math.abs(num) > 1e11) {
          parsedDate = new Date(num);
          detectedType = "Unix Timestamp (Milliseconds)";
        } else {
          parsedDate = new Date(num * 1000);
          detectedType = "Unix Timestamp (Seconds)";
        }
      }
    } else {
      // Date string parse
      const ts = Date.parse(trimmed);
      if (!Number.isNaN(ts)) {
        parsedDate = new Date(ts);
        detectedType = "Date String / ISO";
      }
    }
  }

  const isValid = parsedDate !== null && !Number.isNaN(parsedDate.getTime());

  const utcString = isValid
    ? parsedDate!.toUTCString()
    : "";
  const isoString = isValid
    ? parsedDate!.toISOString()
    : "";
  const localString = isValid
    ? parsedDate!.toString()
    : "";

  const handleCopy = (key: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 1800);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 p-5 rounded-2xl bg-card/90 backdrop-blur-md border border-line shadow-lg text-left">
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
        <Clock size={14} className="text-primary" />
        <label htmlFor={inputId} className="cursor-pointer">Instant Timestamp & Date Inspector</label>
        {isValid && detectedType && (
          <span className="ml-auto text-[11px] font-mono lowercase bg-field px-2 py-0.5 rounded text-accent border border-line">
            {detectedType}
          </span>
        )}
      </div>

      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a Unix timestamp or date (e.g. 1790000000 or 2026-10-11T09:00:00Z)..."
          className="w-full bg-field border border-line rounded-xl px-4 py-3 text-sm font-mono text-fg placeholder:text-muted/60 focus:outline-none focus:border-accent transition-colors shadow-inner"
        />
        {trimmed && (
          <button
            type="button"
            onClick={() => setInput("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-fg px-1.5 py-0.5 rounded"
          >
            Clear
          </button>
        )}
      </div>

      {isValid ? (
        <div className="mt-4 space-y-2 pt-3 border-t border-line/60">
          {/* UTC */}
          <div className="flex items-center justify-between gap-3 text-xs bg-field/50 p-2.5 rounded-lg border border-line/40">
            <span className="font-semibold text-muted w-14 shrink-0 font-mono">UTC</span>
            <span className="font-mono text-fg truncate select-all">{utcString}</span>
            <button
              type="button"
              onClick={() => handleCopy("utc", utcString)}
              className="ml-auto flex items-center gap-1 text-[11px] font-medium text-muted hover:text-fg px-2 py-1 rounded hover:bg-hover transition-colors shrink-0"
              title="Copy UTC"
            >
              {copiedKey === "utc" ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              <span>{copiedKey === "utc" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          {/* ISO 8601 */}
          <div className="flex items-center justify-between gap-3 text-xs bg-field/50 p-2.5 rounded-lg border border-line/40">
            <span className="font-semibold text-muted w-14 shrink-0 font-mono">ISO 8601</span>
            <span className="font-mono text-fg truncate select-all">{isoString}</span>
            <button
              type="button"
              onClick={() => handleCopy("iso", isoString)}
              className="ml-auto flex items-center gap-1 text-[11px] font-medium text-muted hover:text-fg px-2 py-1 rounded hover:bg-hover transition-colors shrink-0"
              title="Copy ISO 8601"
            >
              {copiedKey === "iso" ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              <span>{copiedKey === "iso" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          {/* Local */}
          <div className="flex items-center justify-between gap-3 text-xs bg-field/50 p-2.5 rounded-lg border border-line/40">
            <span className="font-semibold text-muted w-14 shrink-0 font-mono">Local</span>
            <span className="font-mono text-fg truncate select-all">{localString}</span>
            <button
              type="button"
              onClick={() => handleCopy("local", localString)}
              className="ml-auto flex items-center gap-1 text-[11px] font-medium text-muted hover:text-fg px-2 py-1 rounded hover:bg-hover transition-colors shrink-0"
              title="Copy Local Time"
            >
              {copiedKey === "local" ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              <span>{copiedKey === "local" ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      ) : trimmed ? (
        <div className="mt-3 text-xs text-danger/90 font-mono">
          Unable to parse as timestamp or date string.
        </div>
      ) : null}
    </div>
  );
}
