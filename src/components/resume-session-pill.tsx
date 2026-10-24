"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, X, Sparkles } from "lucide-react";
import { getTool, type ToolSlug } from "@/content/tools";

interface LastVisitedTool {
  slug: ToolSlug;
  name: string;
  timestamp: number;
}

const STORAGE_KEY = "castov_last_visited_tool";
const DISMISSED_SESSION_KEY = "castov_resume_dismissed";

export function recordToolVisit(slug: ToolSlug, name: string) {
  if (typeof window === "undefined") return;
  try {
    const item: LastVisitedTool = { slug, name, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(item));
  } catch {
    // ignore
  }
}

function formatTimeAgo(ms: number): string {
  const diffSec = Math.floor((Date.now() - ms) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function ResumeSessionPill() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return Boolean(sessionStorage.getItem(DISMISSED_SESSION_KEY));
    } catch {
      return false;
    }
  });

  const [lastTool] = useState<LastVisitedTool | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LastVisitedTool;
        // Only show if visited within last 7 days (7 * 86400 * 1000)
        if (Date.now() - parsed.timestamp < 604800000) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  // Don't show if dismissed or if user is currently already on that tool's page
  if (dismissed || !lastTool || pathname === `/${lastTool.slug}`) {
    return null;
  }

  const tool = getTool(lastTool.slug);
  const toolName = tool?.name || lastTool.name;
  const timeAgo = formatTimeAgo(lastTool.timestamp);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISSED_SESSION_KEY, "1");
    } catch {
      // ignore
    }
  };

  return (
    <aside aria-label="Resume last active tool" className="layout-content pt-3 pb-1">
      <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl border border-accent/25 bg-accent/5 backdrop-blur-sm text-xs animate-in fade-in slide-in-from-top-1 duration-300">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="p-1 rounded-md bg-accent/10 text-accent shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <span className="text-muted hidden sm:inline">Resume where you left off:</span>
          <Link
            href={`/${lastTool.slug}`}
            className="font-bold text-fg hover:text-accent transition-colors flex items-center gap-1.5 truncate"
          >
            <span className="truncate">{toolName}</span>
            <span className="text-[11px] font-mono text-muted shrink-0">({timeAgo})</span>
            <ArrowRight className="w-3 h-3 text-accent shrink-0" />
          </Link>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-muted hover:text-fg p-1 rounded-md hover:bg-hover transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss resume banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
