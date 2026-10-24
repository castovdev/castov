"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Workflow, ArrowRight } from "lucide-react";
import { getTool, type ToolSlug } from "@/content/tools";

interface PipelineTarget {
  slug: ToolSlug;
  description: string;
}

const TOOL_PIPELINES: Partial<Record<ToolSlug, PipelineTarget[]>> = {
  "json-to-ts": [
    { slug: "diff-checker", description: "Compare interface changes" },
    { slug: "json-viewer", description: "Inspect JSON tree hierarchy" },
  ],
  "json-viewer": [
    { slug: "json-to-ts", description: "Generate TypeScript types" },
    { slug: "diff-checker", description: "Diff against previous payload" },
  ],
  "diff-checker": [
    { slug: "json-to-ts", description: "Convert modified JSON to types" },
  ],
  "cron-generator": [
    { slug: "timezone-converter", description: "Translate schedule across timezones" },
    { slug: "timestamp-to-date", description: "Verify epoch timestamps" },
  ],
  "timezone-converter": [
    { slug: "date-difference", description: "Calculate interval duration" },
    { slug: "business-hours-converter", description: "Check working hours overlap" },
  ],
  "timestamp-to-date": [
    { slug: "timezone-converter", description: "Convert to another timezone" },
    { slug: "date-difference", description: "Compare with another timestamp" },
  ],
  "unix-timestamp-converter": [
    { slug: "timezone-converter", description: "Convert between world zones" },
    { slug: "timestamp-difference", description: "Calculate epoch delta" },
  ],
};

const DEFAULT_TARGETS: PipelineTarget[] = [
  { slug: "json-to-ts", description: "Convert JSON to TypeScript interfaces" },
  { slug: "diff-checker", description: "Line-by-line visual diff" },
  { slug: "timezone-converter", description: "Convert across global timezones" },
];

export function ToolPipelineMenu({ currentSlug }: { currentSlug: ToolSlug }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const targets = (TOOL_PIPELINES[currentSlug] || DEFAULT_TARGETS).filter(
    (t) => t.slug !== currentSlug
  );

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-line bg-card hover:bg-hover text-xs font-semibold text-fg transition-colors cursor-pointer shadow-xs"
        title="Pipe output directly to another developer tool"
        aria-expanded={open}
      >
        <Workflow className="w-3.5 h-3.5 text-accent" />
        <span>Pipe to...</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-line bg-card/95 backdrop-blur-xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 border-b border-line/60 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">
              Chain Tool Pipeline
            </span>
            <span className="text-xs text-fg font-semibold">Pass output to next stage</span>
          </div>

          <div className="space-y-0.5">
            {targets.map((target) => {
              const tool = getTool(target.slug);
              if (!tool) return null;
              return (
                <Link
                  key={target.slug}
                  href={`/${target.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-hover transition-colors group"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-semibold text-fg block truncate group-hover:text-accent transition-colors">
                      {tool.name}
                    </span>
                    <span className="text-[10px] text-muted block truncate mt-0.2">
                      {target.description}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent shrink-0 transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
