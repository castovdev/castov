"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";
import { AI_HUB_LIVE } from "@/lib/flags";
import { BrandMark } from "./brand-mark";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";
import { AuthNavButton } from "./auth-nav-button";
import { Search, ChevronDown } from "lucide-react";

// Primary links always visible on lg (1024px+)
const PRIMARY_NAV = [
  { href: "/tools", label: "Tools" },
  { href: "/mcp", label: "MCP Server" },
  { href: "/convert", label: "Converters" },
  { href: "/guides", label: "Guides" },
];

// Secondary links shown directly on xl (1280px+), or grouped in "More ▾" on lg (1024-1279px)
const MORE_NAV = [
  { href: "/regex-patterns", label: "Regex" },
  { href: "/error-fixes", label: "Error Fixes" },
  { href: "/tech-trends", label: "Tech Radar" },
  ...(AI_HUB_LIVE ? [{ href: "/ai", label: "AI Hub" }] : []),
];

export function SiteHeader() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
      <div className="layout-content flex h-14 items-center justify-between gap-3 sm:gap-4">
        {/* Left: Mobile Nav + Brand + Desktop Links */}
        <div className="flex items-center gap-4 lg:gap-6 min-w-0">
          <MobileNav />
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80 shrink-0">
            <BrandMark />
            <span className="font-bold tracking-tight text-lg text-fg whitespace-nowrap">
              {SITE.name}
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-sm font-medium">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-fg whitespace-nowrap shrink-0 ${
                  pathname?.startsWith(item.href) ? "text-fg font-semibold" : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* Direct links on wide screens (xl: 1280px+) */}
            <div className="hidden xl:flex items-center gap-4 xl:gap-5">
              {MORE_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors hover:text-fg whitespace-nowrap shrink-0 ${
                    pathname?.startsWith(item.href) ? "text-fg font-semibold" : "text-muted"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* "More ▾" dropdown on laptop screens (lg: 1024px - 1279px) */}
            <div className="relative xl:hidden" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-fg whitespace-nowrap cursor-pointer ${
                  MORE_NAV.some((m) => pathname?.startsWith(m.href)) ? "text-fg font-semibold" : "text-muted"
                }`}
                aria-expanded={moreOpen}
              >
                <span>More</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    moreOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {moreOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-line bg-card/95 backdrop-blur-xl p-1.5 shadow-2xl z-50 animate-in fade-in-0 zoom-in-95">
                  {MORE_NAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`block px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-hover ${
                        pathname?.startsWith(item.href)
                          ? "text-accent font-semibold bg-accent/10"
                          : "text-fg"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right: Omnibox Search + Theme Toggle + Single User Account Button */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            className="flex items-center justify-between gap-2 h-9 w-9 sm:w-44 md:w-52 lg:w-56 px-2.5 sm:px-3 text-xs text-muted hover:text-fg rounded-lg bg-field/80 hover:bg-hover border border-line hover:border-accent/40 transition-all cursor-pointer whitespace-nowrap shrink-0 group shadow-xs"
            aria-label="Search tools (Ctrl+K)"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors shrink-0" />
              <span className="hidden sm:inline font-normal truncate">Search tools...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-line bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted font-medium whitespace-nowrap shrink-0">
              <span>Ctrl</span>
              <span>K</span>
            </kbd>
          </button>

          <ThemeToggle />
          <AuthNavButton />
        </div>
      </div>
    </header>
  );
}
