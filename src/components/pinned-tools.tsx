"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTool, toolPath, type ToolSlug } from "@/content/tools";
import { Star, Pin, X } from "lucide-react";

const STORAGE_KEY = "castov-pinned-tools";
const DEFAULT_PINNED: ToolSlug[] = [
  "unix-timestamp-converter",
  "cron-generator",
  "timezone-converter",
  "json-formatter",
  "base64-encoder-decoder",
];

export function PinnedToolsTray() {
  const [pinned, setPinned] = useState<ToolSlug[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPinned(parsed);
          return;
        }
      }
      setPinned(DEFAULT_PINNED);
    } catch {
      setPinned(DEFAULT_PINNED);
    }
  }, []);

  const unpin = (e: React.MouseEvent, slug: ToolSlug) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = pinned.filter((s) => s !== slug);
    setPinned(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  if (!mounted || pinned.length === 0) return null;

  const toolObjects = pinned.map((s) => getTool(s)).filter(Boolean);
  if (toolObjects.length === 0) return null;

  return (
    <section aria-label="Pinned Tools" className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Pin className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
            Quick Access / Pinned Tools
          </h2>
        </div>
        <span className="text-xs text-muted/70">Saved locally</span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {toolObjects.map((t) => {
          if (!t) return null;
          return (
            <Link
              key={t.slug}
              href={toolPath(t.slug)}
              className="group flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-card border border-line hover:border-accent/40 hover:bg-hover transition-all text-sm font-medium text-fg shadow-xs no-underline"
            >
              <span className="font-semibold">{t.name}</span>
              <button
                type="button"
                onClick={(e) => unpin(e, t.slug as ToolSlug)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-muted hover:text-danger hover:bg-field"
                aria-label={`Unpin ${t.name}`}
                title="Unpin"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function PinButton({ slug }: { slug: ToolSlug }) {
  const [isPinned, setIsPinned] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const list: ToolSlug[] = stored ? JSON.parse(stored) : DEFAULT_PINNED;
      setIsPinned(list.includes(slug));
    } catch {
      setIsPinned(DEFAULT_PINNED.includes(slug));
    }
  }, [slug]);

  const toggle = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let list: ToolSlug[] = stored ? JSON.parse(stored) : [...DEFAULT_PINNED];
      if (list.includes(slug)) {
        list = list.filter((s) => s !== slug);
        setIsPinned(false);
      } else {
        list = [slug, ...list];
        setIsPinned(true);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  };

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
        isPinned
          ? "bg-accent/15 border-accent/40 text-accent"
          : "bg-field border-line text-muted hover:text-fg hover:bg-hover"
      }`}
      aria-label={isPinned ? "Unpin tool from quick access" : "Pin tool for quick access"}
      title={isPinned ? "Pinned to quick access" : "Pin to quick access"}
    >
      <Star className={`w-3.5 h-3.5 ${isPinned ? "fill-accent text-accent" : ""}`} />
      <span>{isPinned ? "Pinned" : "Pin"}</span>
    </button>
  );
}
