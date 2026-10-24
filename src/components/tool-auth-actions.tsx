"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUserSession } from "@/hooks/use-user-session";
import { Cloud, BookmarkPlus, Check, ArrowRight, ShieldCheck, Folder } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface ToolAuthActionsProps {
  slug: string;
  toolName: string;
}

export function ToolAuthCloudBadge() {
  const { user } = useUserSession();

  if (!user) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-accent/10 border border-accent/25 text-accent shadow-xs animate-in fade-in"
      title="Cloud Sync Active: Your preferences and pinned tools are synced to your account"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <Cloud className="w-3.5 h-3.5 text-accent" />
      <span>☁️ Workspace Synced</span>
    </span>
  );
}

export function ToolSaveSnippetButton({ slug, toolName }: ToolAuthActionsProps) {
  const { user } = useUserSession();
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [snippetTitle, setSnippetTitle] = useState(`${toolName} Config`);

  useEffect(() => {
    // Listen for Ctrl+S or Cmd+S to save snippet quickly
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (user) {
          setShowModal(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      // Find output in page if available or capture URL state
      let content = "";
      if (typeof window !== "undefined") {
        const outputElem = document.querySelector("pre, textarea, [data-output]");
        content = outputElem?.textContent || window.location.href;
      }

      const newSnippet = {
        id: `snp_${Date.now().toString(36)}`,
        workspaceId: "ws_personal",
        toolSlug: slug,
        title: snippetTitle.trim() || `${toolName} Snippet`,
        content: content.slice(0, 5000),
        language: "text",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // 1. LocalStorage
      const SAVED_CONFIGS_KEY = "castov_saved_configs";
      const existing = localStorage.getItem(SAVED_CONFIGS_KEY);
      const parsed = existing ? JSON.parse(existing) : [];
      parsed.unshift(newSnippet);
      localStorage.setItem(SAVED_CONFIGS_KEY, JSON.stringify(parsed));

      // 2. Supabase Cloud Sync
      try {
        const supabase = createClient();
        await supabase.from("user_preferences").upsert({
          user_id: user.id,
          saved_configs: parsed,
          updated_at: new Date().toISOString(),
        });
      } catch {
        // ignore cloud error
      }

      setSaved(true);
      setShowModal(false);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-field border border-line text-xs font-semibold text-fg hover:bg-hover hover:border-accent/40 transition-colors shadow-xs cursor-pointer"
        title="Save current output to your Developer Snippets (Ctrl + S)"
      >
        {saved ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400">Snippet Saved!</span>
          </>
        ) : (
          <>
            <BookmarkPlus className="w-3.5 h-3.5 text-accent" />
            <span>Save Snippet</span>
            <kbd className="hidden sm:inline-block px-1 py-0.2 rounded bg-card border border-line text-[10px] font-mono text-muted">
              Ctrl+S
            </kbd>
          </>
        )}
      </button>

      {/* Save Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-fg text-base">Save Snippet to Account</h3>
            </div>
            <p className="text-xs text-muted">
              Save current configuration from <span className="font-semibold text-fg">{toolName}</span> into your developer workspace.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted mb-1">Snippet Title</label>
                <input
                  type="text"
                  value={snippetTitle}
                  onChange={(e) => setSnippetTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-field border border-line text-sm text-fg focus:border-accent focus:outline-none"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-field border border-line text-xs font-semibold text-muted hover:text-fg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hover transition-colors shadow-xs"
                >
                  {isSaving ? "Saving..." : "Save to Snippets"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function ToolHistoryBanner() {
  const { user } = useUserSession();

  if (user) {
    return (
      <div className="mt-6 p-4 rounded-xl border border-accent/20 bg-accent/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-fg">
          <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Your preferences, pinned tools, and snippets are backed up to your account.</span>
        </div>
        <Link
          href="/account?tab=snippets"
          className="font-bold text-accent hover:underline flex items-center gap-1 shrink-0"
        >
          <span>View Saved Snippets in Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 rounded-xl border border-line bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>Operations run 100% locally. Sign in with GitHub to sync pinned tools and presets across machines.</span>
      </div>
      <Link
        href="/account"
        className="font-bold text-accent hover:underline flex items-center gap-1 shrink-0"
      >
        <span>Connect Workspace</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
