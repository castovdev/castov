"use client";

import React from "react";
import Link from "next/link";
import { useUserSession } from "@/hooks/use-user-session";
import { LayoutDashboard, ShieldCheck, ArrowRight, Cloud } from "lucide-react";

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
