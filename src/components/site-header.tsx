"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";
import { AI_HUB_LIVE } from "@/lib/flags";
import { BrandMark } from "./brand-mark";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";
import { AuthNavButton } from "./auth-nav-button";
import {
  Search,
  ChevronDown,
  Wrench,
  Shield,
  Radio,
  Hash,
  ArrowRightLeft,
  Clock,
  Terminal,
  Code2,
  Boxes,
  Radar,
  Bug,
  Activity,
  Sparkles,
  ArrowRight,
  Layers,
  BookOpen,
  Cpu,
} from "lucide-react";

type MenuKey = "tools" | "labs" | null;

interface ToolItem {
  href: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const TOOL_GROUPS: { heading: string; items: ToolItem[] }[] = [
  {
    heading: "SECURITY & CLOUD",
    items: [
      {
        href: "/env-vault",
        label: "Environment Vault",
        desc: "Zero-knowledge client-encrypted secrets & teams",
        icon: Shield,
        badge: "E2EE",
      },
      {
        href: "/webhook-tester",
        label: "Webhook Tester",
        desc: "Simulate & inspect HTTP & Stripe webhooks live",
        icon: Radio,
      },
      {
        href: "/cyber-decoder",
        label: "Cyber Decoder",
        desc: "Multi-cipher decoding, hashes, Base64 & JWT",
        icon: Hash,
      },
    ],
  },
  {
    heading: "CONVERTERS & CODE",
    items: [
      {
        href: "/convert",
        label: "Converters Matrix",
        desc: "cURL to code, JSON to TypeScript types & units",
        icon: ArrowRightLeft,
      },
      {
        href: "/unix-timestamp-converter",
        label: "Unix Timestamp",
        desc: "High-precision epoch seconds, millis & ISO parser",
        icon: Clock,
      },
      {
        href: "/cron-generator",
        label: "Cron Generator",
        desc: "Human-readable visual crontab schedule designer",
        icon: Terminal,
      },
    ],
  },
  {
    heading: "VISUAL & ARCHITECTURE",
    items: [
      {
        href: "/svg-animator",
        label: "SVG Animator Studio",
        desc: "Real-time SVG keyframe & morphing animator",
        icon: Sparkles,
      },
      {
        href: "/code-to-image",
        label: "Code to Image",
        desc: "Aesthetic syntax-highlighted screenshot exporter",
        icon: Code2,
      },
      {
        href: "/docker-visualizer",
        label: "Docker Visualizer",
        desc: "Interactive compose architecture & container topology",
        icon: Boxes,
      },
    ],
  },
];

const LABS_ITEMS: ToolItem[] = [
  {
    href: "/tech-trends",
    label: "Tech Radar",
    desc: "Real-time developer trends, benchmarks & tech pulse",
    icon: Radar,
    badge: "Live",
  },
  {
    href: "/regex-patterns",
    label: "Regex Patterns Lab",
    desc: "40+ production-tested regex patterns with live tester",
    icon: Code2,
  },
  {
    href: "/error-fixes",
    label: "Error Fixes Index",
    desc: "69+ curated debugging walkthroughs & AI error fixes",
    icon: Bug,
  },
  {
    href: "/status",
    label: "Cloud Status Monitor",
    desc: "Real-time outage checker for AWS, GitHub, Vercel & Cloudflare",
    icon: Activity,
  },
  ...(AI_HUB_LIVE
    ? [
        {
          href: "/ai",
          label: "AI Developer Hub",
          desc: "AI model registry, prompts & system benchmarks",
          icon: Sparkles,
          badge: "AI",
        },
      ]
    : []),
  {
    href: "/npm/compare",
    label: "NPM Package Compare",
    desc: "Benchmark dependencies, download velocity & bundle size",
    icon: Layers,
  },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navContainerRef = useRef<HTMLElement>(null);

  const clearCloseTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback((key: MenuKey) => {
    clearCloseTimeout();
    setOpenMenu(key);
  }, [clearCloseTimeout]);

  const handleMouseLeave = useCallback(() => {
    clearCloseTimeout();
    timeoutRef.current = setTimeout(() => {
      setOpenMenu(null);
    }, 180);
  }, [clearCloseTimeout]);

  // Close menus on outside click or Esc
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close menu on route change
  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  const isToolsActive =
    pathname === "/tools" ||
    TOOL_GROUPS.some((g) => g.items.some((item) => pathname?.startsWith(item.href)));

  const isLabsActive = LABS_ITEMS.some((item) => pathname?.startsWith(item.href));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-bg/95 backdrop-blur-md transition-colors">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between gap-2.5 sm:gap-4">
        {/* Left: Mobile Nav + Brand Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <MobileNav />
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-90 shrink-0"
          >
            <div className="transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
              <BrandMark size={28} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-lg text-fg whitespace-nowrap">
                {SITE.name}
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-accent/10 text-accent border border-accent/20 tracking-wider">
                DEV
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation (Pills + Dropdowns with Image 1 styling) */}
        <nav
          ref={navContainerRef}
          className="hidden lg:flex items-center justify-center gap-1 xl:gap-1.5 flex-1 mx-2"
          aria-label="Main Navigation"
        >
          {/* 1. Tools Mega-menu Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("tools")}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href="/tools"
              onClick={() => setOpenMenu(null)}
              className={`flex items-center gap-2 px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isToolsActive
                  ? "bg-accent text-accent-fg shadow-sm shadow-accent/25"
                  : "text-fg/80 hover:text-fg hover:bg-hover"
              }`}
              aria-expanded={openMenu === "tools"}
              aria-haspopup="true"
            >
              <Wrench className="w-3.5 h-3.5 shrink-0" />
              <span>Tools</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                  openMenu === "tools" ? "rotate-180" : "opacity-70"
                }`}
              />
            </Link>

            {/* Tools Mega-Menu Popover: Solid opaque background, left-0 anchored */}
            {openMenu === "tools" && (
              <div
                className="absolute top-full left-0 mt-2.5 w-[660px] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-card dark:bg-[#0c0d10] p-4 shadow-2xl z-[100] animate-in fade-in-0 zoom-in-95 duration-150 before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
                onMouseEnter={() => handleMouseEnter("tools")}
                onMouseLeave={handleMouseLeave}
              >
                <div className="grid grid-cols-3 gap-3.5 pb-3">
                  {TOOL_GROUPS.map((group) => (
                    <div key={group.heading} className="space-y-1.5">
                      <p className="px-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted">
                        {group.heading}
                      </p>
                      <div className="space-y-0.5">
                        {group.items.map((tool) => {
                          const Icon = tool.icon;
                          const active = pathname?.startsWith(tool.href);
                          return (
                            <Link
                              key={tool.href}
                              href={tool.href}
                              onClick={() => setOpenMenu(null)}
                              className={`group flex items-start gap-2.5 p-2 rounded-xl transition-all ${
                                active
                                  ? "bg-accent/10 border border-accent/20"
                                  : "hover:bg-hover/80 dark:hover:bg-white/[0.06]"
                              }`}
                            >
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-field dark:bg-white/[0.05] border border-line/60 text-muted group-hover:text-accent group-hover:border-accent/40 group-hover:bg-accent/10 transition-all shrink-0 mt-0.5">
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-fg group-hover:text-accent transition-colors truncate">
                                    {tool.label}
                                  </span>
                                  {tool.badge && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium bg-field dark:bg-white/[0.08] border border-line text-muted">
                                      {tool.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted line-clamp-1 mt-0.5">
                                  {tool.desc}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Banner */}
                <div className="border-t border-line/60 pt-2.5 mt-1 flex items-center justify-between px-2">
                  <span className="text-xs text-muted">
                    60+ high-performance, in-browser developer utilities.
                  </span>
                  <Link
                    href="/tools"
                    onClick={() => setOpenMenu(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                  >
                    <span>Browse All Tools Directory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 2. MCP Server (AI Agent Protocol) */}
          <Link
            href="/mcp"
            className={`flex items-center gap-2 px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              pathname?.startsWith("/mcp")
                ? "bg-accent text-accent-fg shadow-sm shadow-accent/25"
                : "text-fg/80 hover:text-fg hover:bg-hover"
            }`}
          >
            <Cpu className="w-3.5 h-3.5 shrink-0" />
            <span>MCP Server</span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40">
              AI
            </span>
          </Link>

          {/* 3. Converters Matrix */}
          <Link
            href="/convert"
            className={`flex items-center gap-2 px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              pathname?.startsWith("/convert")
                ? "bg-accent text-accent-fg shadow-sm shadow-accent/25"
                : "text-fg/80 hover:text-fg hover:bg-hover"
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
            <span>Converters</span>
          </Link>

          {/* 4. Engineering Guides */}
          <Link
            href="/guides"
            className={`flex items-center gap-2 px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              pathname?.startsWith("/guides")
                ? "bg-accent text-accent-fg shadow-sm shadow-accent/25"
                : "text-fg/80 hover:text-fg hover:bg-hover"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Guides</span>
          </Link>

          {/* 5. Labs & Radar Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("labs")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setOpenMenu((k) => (k === "labs" ? null : "labs"))}
              className={`flex items-center gap-2 px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isLabsActive
                  ? "bg-accent text-accent-fg shadow-sm shadow-accent/25"
                  : "text-fg/80 hover:text-fg hover:bg-hover"
              }`}
              aria-expanded={openMenu === "labs"}
              aria-haspopup="true"
            >
              <Radar className="w-3.5 h-3.5 shrink-0" />
              <span>Radar &amp; Hubs</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                  openMenu === "labs" ? "rotate-180" : "opacity-70"
                }`}
              />
            </button>

            {/* Radar Dropdown: Solid opaque background, right-0 anchored */}
            {openMenu === "labs" && (
              <div
                className="absolute top-full right-0 mt-2.5 w-[460px] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-card dark:bg-[#0c0d10] p-3 shadow-2xl z-[100] animate-in fade-in-0 zoom-in-95 duration-150 before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
                onMouseEnter={() => handleMouseEnter("labs")}
                onMouseLeave={handleMouseLeave}
              >
                <div className="grid grid-cols-2 gap-1.5">
                  {LABS_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = pathname?.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenMenu(null)}
                        className={`group flex items-start gap-2.5 p-2 rounded-xl transition-all ${
                          active
                            ? "bg-accent/10 border border-accent/20"
                            : "hover:bg-hover/80 dark:hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-field dark:bg-white/[0.05] border border-line/60 text-muted group-hover:text-accent group-hover:border-accent/40 group-hover:bg-accent/10 transition-all shrink-0 mt-0.5">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-fg group-hover:text-accent transition-colors truncate">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium bg-accent/10 text-accent border border-accent/20">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted line-clamp-1 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right: Search Command Palette + GitHub + Theme Toggle + Account */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Command Palette Trigger */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            className="flex items-center justify-between gap-2.5 h-9 w-9 sm:w-36 md:w-40 lg:w-44 xl:w-52 px-2.5 sm:px-3 text-xs text-muted hover:text-fg rounded-xl bg-field/60 hover:bg-hover/80 border border-line/70 hover:border-accent/40 transition-all cursor-pointer whitespace-nowrap shrink-0 group shadow-2xs"
            aria-label="Search tools (Ctrl+K)"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors shrink-0" />
              <span className="hidden sm:inline font-normal text-muted truncate">
                Search...
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-line/80 bg-card/80 px-1.5 py-0.5 font-mono text-[10px] text-muted font-medium whitespace-nowrap shrink-0 shadow-2xs">
              <span className="text-[11px] leading-none">⌘</span>
              <span className="leading-none">K</span>
            </kbd>
          </button>

          {/* GitHub Repository Star Link */}
          <a
            href="https://github.com/castovdev/castov"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden xl:flex items-center justify-center h-9 w-9 rounded-xl bg-field/60 hover:bg-hover/80 border border-line/70 hover:border-accent/40 text-muted hover:text-fg transition-all shrink-0 cursor-pointer shadow-2xs"
            aria-label="Castov on GitHub"
            title="View source on GitHub"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Single Unified User Account Button */}
          <AuthNavButton />
        </div>
      </div>
    </header>
  );
}
