"use client";

import { useState, useId } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { ArrowLeftRight, Trash2, Clipboard, CheckCircle2, AlertCircle, FileText } from "lucide-react";

type Mode = "encode" | "decode";

function utf8ToBase64(str: string, urlSafe = false): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  let b64 = btoa(binary);
  if (urlSafe) {
    b64 = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return b64;
}

function base64ToUtf8(b64: string): string {
  let standard = b64.trim().replace(/-/g, "+").replace(/_/g, "/");
  while (standard.length % 4 !== 0) {
    standard += "=";
  }
  const binary = atob(standard);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

const SAMPLE_TEXT = "Hello, world! 🚀 Castov developer tools are fast, free & privacy-friendly.";

export function Base64Tool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState<string>(SAMPLE_TEXT);
  const [output, setOutput] = useState<string>(() => utf8ToBase64(SAMPLE_TEXT, false));
  const [urlSafe, setUrlSafe] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const inputId = useId();
  const outputId = useId();

  const processConversion = (text: string, currentMode: Mode, isUrlSafe: boolean) => {
    if (!text.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    try {
      if (currentMode === "encode") {
        const encoded = utf8ToBase64(text, isUrlSafe);
        setOutput(encoded);
        setError(null);
      } else {
        const decoded = base64ToUtf8(text);
        setOutput(decoded);
        setError(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to decode Base64: ${msg}. Make sure the string is valid Base64.`);
      setOutput("");
    }
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    processConversion(val, mode, urlSafe);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    // If output exists and no error, swap input and output
    if (output && !error) {
      setInput(output);
      processConversion(output, newMode, urlSafe);
    } else {
      processConversion(input, newMode, urlSafe);
    }
  };

  const handleUrlSafeToggle = () => {
    const next = !urlSafe;
    setUrlSafe(next);
    processConversion(input, mode, next);
  };

  const handleSwap = () => {
    const newMode: Mode = mode === "encode" ? "decode" : "encode";
    setMode(newMode);
    const prevOutput = output;
    setInput(prevOutput);
    processConversion(prevOutput, newMode, urlSafe);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      processConversion(text, mode, urlSafe);
    } catch {
      // Ignore clipboard read failure
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError(null);
  };

  const loadSample = () => {
    if (mode === "encode") {
      setInput(SAMPLE_TEXT);
      processConversion(SAMPLE_TEXT, "encode", urlSafe);
    } else {
      const sampleEncoded = utf8ToBase64(SAMPLE_TEXT, urlSafe);
      setInput(sampleEncoded);
      processConversion(sampleEncoded, "decode", urlSafe);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card border border-line rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="inline-flex rounded-lg border border-line bg-field p-0.5" role="group" aria-label="Base64 operation mode">
            <button
              type="button"
              onClick={() => handleModeChange("encode")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === "encode" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-fg"
              }`}
            >
              Encode
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("decode")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === "decode" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-fg"
              }`}
            >
              Decode
            </button>
          </div>

          {/* Swap Button */}
          <button
            type="button"
            onClick={handleSwap}
            className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
            title="Swap input and output"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Swap
          </button>

          {/* URL-Safe Checkbox */}
          <label className="inline-flex items-center gap-2 text-sm text-fg cursor-pointer select-none ml-2">
            <input
              type="checkbox"
              aria-label="URL-Safe (RFC 4648)"
              checked={urlSafe}
              onChange={handleUrlSafeToggle}
              className="rounded border-line text-accent focus:ring-accent"
            />
            <span>URL-Safe (RFC 4648)</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            aria-label="Clear inputs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Error / Success Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {output && !error && (
        <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-xl text-success text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Successfully {mode === "encode" ? "encoded to Base64" : "decoded from Base64"} with full UTF-8 Unicode support.</span>
        </div>
      )}

      {/* Inputs & Outputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="text-sm font-semibold text-fg">
              {mode === "encode" ? "Plain Text (UTF-8)" : "Base64 String to Decode"}
            </label>
            <span className="text-xs text-muted font-mono">
              {input.length.toLocaleString()} chars
            </span>
          </div>
          <textarea
            id={inputId}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={mode === "encode" ? "Enter text or symbols to encode..." : "Paste Base64 string here..."}
            rows={14}
            className="w-full p-4 font-mono text-sm bg-field border border-line rounded-xl text-fg focus:outline-none focus:ring-2 focus:ring-accent resize-y"
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor={outputId} className="text-sm font-semibold text-fg">
              {mode === "encode" ? "Base64 Encoded Result" : "Decoded Plain Text"}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-mono">
                {output.length.toLocaleString()} chars
              </span>
              <CopyButton value={output} label="Base64 result" disabled={!output} />
            </div>
          </div>
          <textarea
            id={outputId}
            value={output}
            readOnly
            placeholder="Result will appear here automatically..."
            rows={14}
            className="w-full p-4 font-mono text-sm bg-card border border-line rounded-xl text-fg focus:outline-none resize-y"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
