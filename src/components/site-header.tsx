"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";
import { AI_HUB_LIVE } from "@/lib/flags";
import { BrandMark } from "./brand-mark";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";
import { Search } from "lucide-react";

const DESKTOP_NAV = [
  { href: "/tools", label: "Tools" },
  ...(AI_HUB_LIVE ? [{ href: "/ai", label: "AI Hub" }] : []),
  { href: "/cheatsheets", label: "Cheat Sheets" },
  { href: "/guides", label: "Guides" },
  { href: "/extension", label: "Extension" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-6">
          <MobileNav />
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <BrandMark />
            <span className="font-bold sm:inline-block tracking-tight text-lg">
              {SITE.name}
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {DESKTOP_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-fg ${
                  pathname.startsWith(item.href) ? "text-fg" : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {/* Social Links in Header */}
          <div className="hidden lg:flex items-center gap-1 mr-1">
            <a
              href="https://x.com/castovdev"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-muted hover:text-fg hover:bg-hover transition-colors"
              aria-label="X / Twitter @castovdev"
              title="Follow @castovdev on X"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a
              href="https://instagram.com/castovdev"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-muted hover:text-fg hover:bg-hover transition-colors"
              aria-label="Instagram @castovdev"
              title="Follow @castovdev on Instagram"
            >
              <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
          </div>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            className="flex items-center gap-2 h-8 px-2.5 sm:px-3 text-xs sm:text-sm text-muted rounded-md bg-field hover:bg-hover border border-line transition-colors cursor-pointer"
            aria-label="Search tools (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-muted shrink-0" />
            <span className="hidden sm:inline">Search tools...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-line bg-card px-1.5 font-mono text-[10px] text-muted font-medium">
              Ctrl K
            </kbd>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
