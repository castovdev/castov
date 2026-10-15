"use client";

import { useState } from "react";
import { AiSidebar } from "@/components/ai-sidebar";
import { SlidersHorizontal, X } from "lucide-react";

export function AiMobileDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden mb-6">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-line text-sm font-semibold text-fg shadow-2xs hover:bg-hover transition-colors"
        aria-expanded={open}
        aria-label="Toggle AI Workspace & Directory Menu"
      >
        <span className="flex items-center gap-2.5">
          <SlidersHorizontal className="w-4 h-4 text-accent" />
          <span>AI Workspaces &amp; Directory Menu</span>
        </span>
        <span className="text-xs text-muted font-normal">
          {open ? "Hide Menu ▲" : "Browse Tools ▼"}
        </span>
      </button>

      {open && (
        <div className="mt-3 p-4 rounded-xl bg-card border border-line shadow-lg max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-line/50">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              AI Workspace Navigator
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-md text-muted hover:text-fg hover:bg-hover transition-colors"
              aria-label="Close AI menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <AiSidebar />
        </div>
      )}
    </div>
  );
}
