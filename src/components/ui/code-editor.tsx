"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Maximize2, Minimize2, Copy, Check } from "lucide-react";

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-card/50 border border-line animate-pulse rounded-lg">
      <span className="text-sm font-mono text-muted">Loading Editor...</span>
    </div>
  ),
});

interface CodeEditorProps {
  value: string;
  language: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
  height?: string;
  title?: string;
}

export function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  height = "400px",
  title,
}: CodeEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[130] bg-bg/95 backdrop-blur-xl p-4 sm:p-6 flex flex-col animate-in fade-in duration-200"
          : "w-full rounded-xl overflow-hidden border border-line bg-card shadow-sm flex flex-col"
      }
      style={isFullscreen ? undefined : { height }}
    >
      {/* Top Zen Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-line bg-field/60 text-xs shrink-0 select-none">
        <div className="flex items-center gap-2">
          {title && <span className="font-semibold text-fg text-xs">{title}</span>}
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-card border border-line text-muted">
            {language}
          </span>
          {readOnly && (
            <span className="text-[10px] font-mono text-muted">readonly</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-muted hover:text-fg hover:bg-hover border border-transparent hover:border-line transition-all cursor-pointer"
            title="Copy editor content"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-muted hover:text-fg hover:bg-hover border border-transparent hover:border-line transition-all cursor-pointer"
            title={isFullscreen ? "Exit Zen Mode (Esc)" : "Zen Fullscreen Mode"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3 h-3 text-accent" />
                <span className="text-accent font-semibold">Exit Zen (Esc)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Zen Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Surface */}
      <div className="flex-1 w-full min-h-0 relative">
        <MonacoEditor
          height="100%"
          language={language}
          theme="vs-dark"
          value={value}
          onChange={onChange}
          options={{
            readOnly,
            minimap: { enabled: isFullscreen },
            fontSize: isFullscreen ? 14 : 13,
            fontFamily: "var(--font-geist-mono), monospace",
            lineHeight: 24,
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            formatOnPaste: true,
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}
