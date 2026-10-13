import Link from "next/link";
import { TOOLS, toolPath } from "@/content/tools";
import { SITE } from "@/lib/site";
import { AI_HUB_LIVE } from "@/lib/flags";
import { BrandMark } from "./brand-mark";
import { ArrowUp, Terminal, ShieldCheck, Sparkles, Heart } from "lucide-react";

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
  { href: "/cli", label: "Castov CLI (npm)", badge: "v1.0" },
  { href: "/extension", label: "VS Code Extension" },
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
    <footer className="mt-24 border-t border-line/80 bg-card relative before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent/30 before:to-transparent">
      {/* Upper Status & Highlights Bar */}
      <div className="border-b border-line/60">
        <div className="layout-content py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-field border border-line">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-semibold text-fg">All Systems Operational</span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-muted px-2 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>100% Client-Side Execution</span>
            </div>
            <span className="hidden lg:inline text-line">•</span>
            <span className="hidden lg:inline text-muted">Zero tracking, zero analytics tracking on tools</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-mono hidden sm:inline">Official CLI:</span>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-field border border-line text-xs font-mono">
              <span className="text-accent select-none font-bold">$</span>
              <span className="text-fg">npm i -g castov</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Grid */}
      <div className="layout-content py-16 grid gap-12 lg:grid-cols-12">
        {/* Brand Column (5 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight text-fg transition-colors hover:text-accent"
          >
            <BrandMark size={28} />
            <span className="bg-gradient-to-r from-fg via-fg to-accent bg-clip-text text-transparent">
              {SITE.name}
            </span>
          </Link>

          <p className="max-w-sm text-sm leading-relaxed text-muted">
            The developer utility suite built for speed, privacy, and precision. Fast, client-side, zero-telemetry tools for modern engineering workflows.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-field border border-line text-[11px] font-medium text-muted">
              <Terminal className="w-3 h-3 text-accent" /> Node.js 18+
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-field border border-line text-[11px] font-medium text-muted">
              <Sparkles className="w-3 h-3 text-emerald-500" /> Free & Open SDK
            </span>
          </div>

          {/* Social Links */}
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
          {/* Top Tools */}
          <nav aria-labelledby="footer-tools">
            <h2 id="footer-tools" className="mb-4 text-xs font-bold uppercase tracking-wider text-fg">
              Core Utilities
            </h2>
            <ul className="grid gap-2.5 text-sm">
              <li>
                <Link href="/tools" className="text-muted transition-colors hover:text-accent font-medium">
                  All Tools Directory
                </Link>
              </li>
              {TOOLS.filter(t => TOP_TOOLS.includes(t.slug)).map((t) => (
                <li key={t.slug}>
                  <Link
                    href={toolPath(t.slug)}
                    className="text-muted transition-colors hover:text-fg"
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/cron" className="text-muted transition-colors hover:text-fg">
                  Cron Generator
                </Link>
              </li>
            </ul>
          </nav>

          {/* Ecosystem & Labs */}
          <nav aria-labelledby="footer-ecosystem">
            <h2 id="footer-ecosystem" className="mb-4 text-xs font-bold uppercase tracking-wider text-fg">
              Ecosystem
            </h2>
            <ul className="grid gap-2.5 text-sm">
              {ECOSYSTEM.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group inline-flex items-center gap-1.5 text-muted transition-colors hover:text-fg"
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

          {/* Resources & Hubs */}
          <nav aria-labelledby="footer-resources">
            <h2 id="footer-resources" className="mb-4 text-xs font-bold uppercase tracking-wider text-fg">
              Resources
            </h2>
            <ul className="grid gap-2.5 text-sm">
              {RESOURCES.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted transition-colors hover:text-fg"
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

          {/* Company & Legal */}
          <nav aria-labelledby="footer-company">
            <h2 id="footer-company" className="mb-4 text-xs font-bold uppercase tracking-wider text-fg">
              Company
            </h2>
            <ul className="grid gap-2.5 text-sm">
              {COMPANY.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted transition-colors hover:text-fg"
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
                  GitHub Repository ↗
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-line/70 bg-field/30">
        <div className="layout-content py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
            <span>&copy; {currentYear} {SITE.name}. All rights reserved.</span>
            <span className="hidden sm:inline text-line">•</span>
            <span className="text-muted/80">Built with Next.js & TypeScript</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-fg transition-colors">Privacy</Link>
            <span className="text-line">•</span>
            <Link href="/terms" className="hover:text-fg transition-colors">Terms</Link>
            <span className="text-line">•</span>
            <Link href="/sponsor" className="hover:text-fg transition-colors text-accent font-medium flex items-center gap-1">
              <Heart className="w-3 h-3 fill-accent/20" /> Sponsor
            </Link>
            <span className="text-line">•</span>
            <a
              href="#top"
              className="inline-flex items-center gap-1 hover:text-fg transition-colors"
              aria-label="Back to top of page"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
