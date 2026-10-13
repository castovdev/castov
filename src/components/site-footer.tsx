import Link from "next/link";
import { TOOLS, toolPath } from "@/content/tools";
import { SITE } from "@/lib/site";
import { AI_HUB_LIVE } from "@/lib/flags";
import { BrandMark } from "./brand-mark";
import { ShieldCheck, Sparkles, Heart, Wrench, Cpu, BookOpen, Building2, Terminal, ExternalLink } from "lucide-react";
import { FooterLiveTicker, FooterCliCopy, FooterNewsletter, BackToTopButton } from "./footer-client";

const COMPANY = [
  { href: "/about", label: "About Castov" },
  { href: "/sponsor", label: "Sponsor & Advertise" },
  { href: "/contact", label: "Contact & Feedback" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
];

const TOP_TOOLS = [
  "unix-timestamp-converter",
  "timezone-converter",
  "world-clock",
  "date-difference",
  "cron-generator",
  "uuid-generator",
  "json-formatter",
  "jwt-decoder",
];

const ECOSYSTEM = [
  { href: "/cli", label: "Castov CLI", badge: "npm" },
  { href: "/extension", label: "VS Code Extension", badge: "v0.1" },
  { href: "/cheatsheets", label: "Interactive Cheat Sheets", badge: "Popular" },
  { href: "/http-status", label: "HTTP Status Guide" },
  { href: "/chmod/755", label: "Chmod Permissions" },
  { href: "/webhook-tester", label: "Webhook Tester" },
  { href: "/diff-checker", label: "Text & Code Diff" },
  { href: "/sonic-gap", label: "Sonic-Gap Ultrasonic", badge: "Lab" },
];

const RESOURCES = [
  { href: "/tools", label: "All Tools Directory" },
  { href: "/guides", label: "Developer Guides" },
  { href: "/code", label: "Code Hub & Snippets" },
  { href: "/convert", label: "Format Converters" },
  { href: "/timezones", label: "Time Zones Hub" },
  { href: "/timestamps", label: "Epoch Timestamps" },
  { href: "/chrono-db", label: "Chrono State DB" },
];

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-line/80 bg-card relative before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent/40 before:to-transparent">
      {/* 1. Upper Telemetry & Status Bar */}
      <div className="border-b border-line/60 bg-field/30">
        <div className="layout-content py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs">
            {/* Operational indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-field border border-line shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-semibold text-fg">Systems Operational</span>
            </div>

            {/* Live UTC & Unix Epoch ticker */}
            <FooterLiveTicker />

            {/* Privacy trust pill */}
            <div className="hidden sm:inline-flex items-center gap-1.5 text-muted px-2 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>100% Client-Side</span>
            </div>
          </div>

          {/* Quick CLI copy & GitHub Star */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <FooterCliCopy />

            <a
              href="https://github.com/benidira/timeforge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-field hover:bg-hover border border-line hover:border-accent/40 text-xs font-medium text-fg transition-all shadow-xs active:scale-95"
              aria-label="Star Castov on GitHub"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>Star on GitHub</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Middle Newsletter & Mission Callout */}
      <div className="border-b border-line/60">
        <div className="layout-content py-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20 text-xs font-semibold text-accent">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DEVELOPER UPDATES & RELEASES</span>
            </div>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-fg">
              Precision utilities designed for daily engineering workflows
            </p>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Never miss new developer tools, CLI feature updates, or cheat sheet releases. No spam, zero telemetry.
            </p>
          </div>

          <FooterNewsletter />
        </div>
      </div>

      {/* 3. Main Navigation Grid */}
      <div className="layout-content py-16 grid gap-12 lg:grid-cols-12">
        {/* Brand Information Column (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-fg transition-colors hover:text-accent"
          >
            <BrandMark size={28} />
            <span className="bg-gradient-to-r from-fg via-fg to-accent bg-clip-text text-transparent">
              {SITE.name}
            </span>
          </Link>

          <p className="max-w-sm text-sm leading-relaxed text-muted">
            The high-velocity developer toolbox. Client-side cryptographic security, zero server logs, and instant execution without network latency.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-field border border-line text-[11px] font-medium text-muted">
              <Terminal className="w-3 h-3 text-accent" /> Node.js 18+
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-field border border-line text-[11px] font-medium text-muted">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Zero Telemetry
            </span>
          </div>

          {/* Social Presence */}
          <div className="pt-4 flex items-center gap-2.5">
            <a
              href="https://github.com/benidira/timeforge"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-field border border-line flex items-center justify-center text-muted hover:text-fg hover:border-accent/40 hover:bg-hover transition-all"
              aria-label="Castov on GitHub"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://x.com/castovdev"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-field border border-line flex items-center justify-center text-muted hover:text-fg hover:border-accent/40 hover:bg-hover transition-all"
              aria-label="Follow Castov on X / Twitter"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a
              href="https://www.npmjs.com/package/castov"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-field border border-line flex items-center justify-center text-muted hover:text-fg hover:border-accent/40 hover:bg-hover transition-all"
              aria-label="View Castov on npm"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0H1.763zM5.13 5.13h13.74v13.74h-3.435V8.565h-3.435v10.305H5.13V5.13z"/>
              </svg>
            </a>
            <a
              href="https://instagram.com/castovdev"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-field border border-line flex items-center justify-center text-muted hover:text-fg hover:border-accent/40 hover:bg-hover transition-all"
              aria-label="Follow Castov on Instagram"
            >
              <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Navigation Link Columns (8 cols on lg) */}
        <div className="lg:col-span-8 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Column 1: Core Utilities */}
          <nav aria-labelledby="footer-tools">
            <h2 id="footer-tools" className="mb-4 text-xs font-bold uppercase tracking-wider text-fg flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-accent" />
              <span>Core Utilities</span>
            </h2>
            <ul className="grid gap-2 text-sm">
              <li>
                <Link href="/tools" className="text-muted transition-colors hover:text-accent font-medium">
                  All Tools Directory
                </Link>
              </li>
              {TOOLS.filter(t => TOP_TOOLS.includes(t.slug)).map((t) => (
                <li key={t.slug}>
                  <Link
                    href={toolPath(t.slug)}
                    className="text-muted transition-colors hover:text-fg hover:translate-x-0.5 inline-block"
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/cron" className="text-muted transition-colors hover:text-fg hover:translate-x-0.5 inline-block">
                  Cron Generator
                </Link>
              </li>
            </ul>
          </nav>

          {/* Column 2: Ecosystem & Labs */}
          <nav aria-labelledby="footer-ecosystem">
            <h2 id="footer-ecosystem" className="mb-4 text-xs font-bold uppercase tracking-wider text-fg flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-accent" />
              <span>Ecosystem</span>
            </h2>
            <ul className="grid gap-2 text-sm">
              {ECOSYSTEM.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group inline-flex items-center gap-1.5 text-muted transition-colors hover:text-fg hover:translate-x-0.5"
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-accent/10 text-accent border border-accent/20">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 3: Resources & Hubs */}
          <nav aria-labelledby="footer-resources">
            <h2 id="footer-resources" className="mb-4 text-xs font-bold uppercase tracking-wider text-fg flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-accent" />
              <span>Resources</span>
            </h2>
            <ul className="grid gap-2 text-sm">
              {RESOURCES.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted transition-colors hover:text-fg hover:translate-x-0.5 inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {AI_HUB_LIVE && (
                <li>
                  <Link
                    href="/ai"
                    className="text-muted transition-colors hover:text-accent font-medium inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-accent" /> AI Prompt Studio
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* Column 4: Company & Trust */}
          <nav aria-labelledby="footer-company">
            <h2 id="footer-company" className="mb-4 text-xs font-bold uppercase tracking-wider text-fg flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-accent" />
              <span>Company</span>
            </h2>
            <ul className="grid gap-2 text-sm">
              {COMPANY.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted transition-colors hover:text-fg hover:translate-x-0.5 inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <a
                  href="https://github.com/benidira/timeforge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted hover:text-fg transition-colors inline-flex items-center gap-1 font-mono"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* 4. Bottom Legal & Back to Top Bar */}
      <div className="border-t border-line/70 bg-field/40">
        <div className="layout-content py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
            <span>&copy; {currentYear} {SITE.name}. All rights reserved.</span>
            <span className="hidden sm:inline text-line">•</span>
            <span className="text-muted/80">Built with Next.js & TypeScript</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/privacy" className="hover:text-fg transition-colors">Privacy Policy</Link>
            <span className="text-line">•</span>
            <Link href="/terms" className="hover:text-fg transition-colors">Terms</Link>
            <span className="text-line">•</span>
            <Link href="/sponsor" className="hover:text-fg transition-colors text-accent font-medium flex items-center gap-1">
              <Heart className="w-3 h-3 fill-accent/20" /> Sponsor
            </Link>
            <span className="text-line">•</span>
            <BackToTopButton />
          </div>
        </div>
      </div>
    </footer>
  );
}
