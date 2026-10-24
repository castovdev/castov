"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useUserSession } from "@/hooks/use-user-session";
import {
  LayoutDashboard,
  ShieldCheck,
  ArrowRight,
  Cloud,
  Zap,
  Lock,
  Pin,
  Clock,
} from "lucide-react";
import { getTool, toolPath, type ToolSlug } from "@/content/tools";

export function HomeWelcomeBanner() {
  const { user, displayName } = useUserSession();

  if (!user) return null;

  return (
    <div className="mt-8 mx-auto max-w-2xl rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 via-card to-emerald-500/10 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-fg">
              Welcome back, <span className="text-accent">{displayName}</span>
            </p>
            <p className="text-[11px] font-mono text-muted flex items-center justify-center sm:justify-start gap-1">
              <Cloud className="w-3 h-3 text-emerald-400" />
              <span>Workspace Synced • Developer Hub Active</span>
            </p>
          </div>
        </div>

        <Link
          href="/account"
          className="btn bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Open Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function HomeWorkspaceLink() {
  const { user } = useUserSession();

  if (user) {
    return (
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-xs shrink-0"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Open Workspace</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hover transition-colors shadow-xs shrink-0"
    >
      <span>Connect Workspace</span>
      <ArrowRight className="w-3.5 h-3.5" />
    </Link>
  );
}

/**
 * Dynamic Bento Grid Card for E2EE Vaults & Cloud Sync
 * Automatically switches to authenticated telemetry/workspace view for logged-in users.
 */
export function HomeBentoVaultCard() {
  const { user, displayName } = useUserSession();

  const [pinnedCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const storedPins = localStorage.getItem("castov-pinned-tools");
      return storedPins ? JSON.parse(storedPins).length : 0;
    } catch {
      return 0;
    }
  });

  const [stacksCount] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    try {
      const storedStacks = localStorage.getItem("castov_mcp_stacks");
      return storedStacks ? JSON.parse(storedStacks).length : 1;
    } catch {
      return 1;
    }
  });

  if (user) {
    return (
      <div className="bg-bg border border-emerald-500/40 p-7 rounded-3xl transition-all shadow-md group md:col-span-2 lg:col-span-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-fg">Zero-Knowledge Env Vault &amp; Workspace</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Connected</span>
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5 font-mono">
                Connected as <span className="text-accent font-semibold">@{displayName}</span> • {pinnedCount} Pinned Tools • {stacksCount} Saved MCP Stacks
              </p>
            </div>
          </div>
          <Link
            href="/account?tab=vault"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hover transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Open Env Vault</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <p className="text-sm text-muted leading-relaxed relative z-10">
          Your secrets are encrypted with <code className="text-fg bg-field px-1 rounded font-mono">AES-256-GCM</code> right in your browser. Pull them straight into your local environment with <code className="text-accent bg-field px-1 rounded font-mono">castov vault pull &lt;slug&gt;</code> without exposing plaintext in chat channels.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bg border border-line hover:border-amber-500/40 p-7 rounded-3xl transition-all shadow-sm group md:col-span-2 lg:col-span-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-fg">E2EE Cloud Sync &amp; Team Vaults</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold">GitHub OAuth</span>
            </div>
            <p className="text-xs text-muted mt-0.5">Zero-friction leverage unlocked on registration</p>
          </div>
        </div>
        <HomeWorkspaceLink />
      </div>
      <p className="text-sm text-muted leading-relaxed">
        Connect your GitHub account to sync pinned utilities, presets, and dev preferences across all your machines. Collaborate with teammates using RSA-OAEP encrypted Team Vaults to share <code className="text-fg bg-field px-1 rounded">.env</code> files without cleartext exposure in chat channels.
      </p>
    </div>
  );
}

/**
 * Pinned Tools & Recent Workspace Quick-Bar
 * Rendered above general categories for logged-in developers.
 */
export function HomePinnedQuickBar() {
  const { user } = useUserSession();

  const [pinned] = useState<ToolSlug[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("castov-pinned-tools");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [lastTool] = useState<{ slug: ToolSlug; name: string } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const last = localStorage.getItem("castov_last_visited_tool");
      return last ? JSON.parse(last) : null;
    } catch {
      return null;
    }
  });

  if (!user || pinned.length === 0) return null;

  const toolObjects = pinned.map((s) => getTool(s)).filter(Boolean);

  return (
    <div className="mb-10 p-5 rounded-2xl border border-accent/30 bg-card/60 backdrop-blur-md shadow-xs animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-fg">
            ⚡ Your Pinned Tools &amp; Recent Workspace
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <Link href="/account" className="text-accent hover:underline flex items-center gap-1">
            <span>Manage Workspace</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {lastTool && (
          <Link
            href={toolPath(lastTool.slug)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hover transition-colors shadow-xs"
          >
            <Clock className="w-3 h-3" />
            <span>Resume: {lastTool.name}</span>
          </Link>
        )}

        {toolObjects.map((t) => {
          if (!t) return null;
          return (
            <Link
              key={t.slug}
              href={toolPath(t.slug)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-field border border-line text-xs font-semibold text-fg hover:border-accent hover:bg-hover transition-all"
            >
              <Pin className="w-3 h-3 text-accent" />
              <span>{t.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function HomeBottomCta() {
  const { user } = useUserSession();

  if (user) {
    return (
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <Link
          href="/account"
          className="flex items-center justify-center gap-2 bg-accent text-accent-fg px-8 py-4 rounded-xl font-bold text-lg hover:bg-accent-hover transition-colors shadow-sm w-full sm:w-auto"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Open Dashboard</span>
        </Link>
        <Link
          href="/tools"
          className="flex items-center justify-center gap-2 bg-card border border-line text-fg px-8 py-4 rounded-xl font-bold text-lg hover:bg-field transition-colors shadow-sm w-full sm:w-auto"
        >
          <span>Browse All 61 Tools</span>
          <ArrowRight className="w-5 h-5 text-muted" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
      <Link
        href="/tools"
        className="flex items-center justify-center gap-2 bg-accent text-accent-fg px-8 py-4 rounded-xl font-bold text-lg hover:bg-accent-hover transition-colors shadow-sm w-full sm:w-auto"
      >
        <span>Browse All Tools</span>
        <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  );
}
