"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { NAV_LINKS } from "./nav-links";
import { AuthNavButton } from "./auth-nav-button";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      <div
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-line bg-card/95 backdrop-blur-xl px-4 pb-6 pt-3 shadow-xl transition-all"
      >
        <nav
          id={panelId}
          aria-label="Mobile"
          className="mx-auto max-w-6xl"
        >
          <div className="mb-3">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg bg-field px-3.5 py-2.5 text-sm text-muted border border-line hover:bg-hover hover:text-fg transition-colors"
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new CustomEvent("open-command-palette"));
              }}
            >
              <span className="flex items-center gap-2 font-medium">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                Search tools &amp; conversions...
              </span>
              <kbd className="rounded border border-line bg-card px-1.5 py-0.5 font-mono text-[10px]">Ctrl+K</kbd>
            </button>
          </div>
          <ul className="space-y-1">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-medium text-fg no-underline hover:bg-hover transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <span>{l.label}</span>
                  <span className="text-muted text-sm">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mx-auto mt-4 max-w-6xl border-t border-line/60 pt-3">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Developer &amp; Hubs
          </p>
          <ul className="grid grid-cols-2 gap-2 mb-4">
            {[
              { href: "/mcp", label: "MCP Server (10 Tools)" },
              { href: "/cli", label: "Castov CLI (v1.5.0)" },
              { href: "/convert", label: "Converters Matrix" },
              { href: "/regex-patterns", label: "Regex Lab" },
              { href: "/error-fixes", label: "Error Fixes" },
              { href: "/tech-trends", label: "Tech Radar" },
              { href: "/ai", label: "AI Developer Hub" },
              { href: "/developer", label: "Developer Hub" },
              { href: "/timezones", label: "Time Zones Hub" },
              { href: "/timestamps", label: "Timestamps Hub" },
              { href: "/resources", label: "Resources Hub" },
            ].map((hub) => (
              <li key={hub.href}>
                <Link
                  href={hub.href}
                  className="block rounded-lg bg-hover/40 px-3 py-2 text-sm font-medium text-fg no-underline hover:bg-hover hover:text-accent transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {hub.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="mx-auto mt-4 max-w-6xl border-t border-line/60 pt-3">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Account &amp; Security
          </p>
          <div className="px-3">
            <AuthNavButton mobile onAction={() => setOpen(false)} />
          </div>
        </div>
      </div>
    </div>
  );
}
