import Link from "next/link";
import { TOOLS, toolPath } from "@/content/tools";
import { SITE } from "@/lib/site";
import { AI_HUB_LIVE } from "@/lib/flags";
import { BrandMark } from "./brand-mark";

const COMPANY = [
  { href: "/about", label: "About" },
  { href: "/sponsor", label: "Sponsor & Advertise" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
];

const TOP_TOOLS = [
  "unix-timestamp-converter",
  "timezone-converter",
  "world-clock",
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-card">
      <div className="layout-content grid gap-12 py-16 lg:grid-cols-6">
        {/* Brand column */}
        <div className="lg:col-span-2">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-fg transition-colors hover:text-accent">
            <BrandMark size={24} />
            {SITE.name}
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Developer tools that just work. Fast, simple, privacy-friendly utilities for everyday workflows.
          </p>

          {/* Social Links */}
          <div className="mt-6 flex items-center gap-3">
            <a
              href="https://x.com/castovdev"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-field border border-line flex items-center justify-center text-muted hover:text-fg hover:border-muted/50 transition-colors"
              aria-label="Follow Castov on X / Twitter"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a
              href="https://instagram.com/castovdev"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-field border border-line flex items-center justify-center text-muted hover:text-fg hover:border-muted/50 transition-colors"
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

        {/* Footer Links Grid */}
        <div className="grid grid-cols-2 gap-8 lg:col-span-4 sm:grid-cols-4">
          <nav aria-labelledby="footer-product">
            <h2 id="footer-product" className="mb-4 text-sm font-semibold text-fg">Product</h2>
            <ul className="grid gap-3 text-sm">
              <li><Link href="/tools" className="text-muted transition-colors hover:text-fg">All Tools</Link></li>
              {TOOLS.filter(t => TOP_TOOLS.includes(t.slug)).map((t) => (
                <li key={t.slug}>
                  <Link href={toolPath(t.slug)} className="text-muted transition-colors hover:text-fg">{t.name}</Link>
                </li>
              ))}
              <li><Link href="/timezones" className="text-muted transition-colors hover:text-fg">Time Zones</Link></li>
              <li><Link href="/developer" className="text-muted transition-colors hover:text-fg">Developer Tools</Link></li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-resources">
            <h2 id="footer-resources" className="mb-4 text-sm font-semibold text-fg">Resources</h2>
            <ul className="grid gap-3 text-sm">
              <li><Link href="/cheatsheets" className="text-muted transition-colors hover:text-fg font-semibold text-accent">Cheat Sheets</Link></li>
              <li><Link href="/guides" className="text-muted transition-colors hover:text-fg">Guides</Link></li>
              <li><Link href="/developer" className="text-muted transition-colors hover:text-fg">Code Snippets</Link></li>
              <li><Link href="/extension" className="text-muted transition-colors hover:text-fg">VS Code Extension</Link></li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-company">
            <h2 id="footer-company" className="mb-4 text-sm font-semibold text-fg">Company</h2>
            <ul className="grid gap-3 text-sm">
              {COMPANY.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted transition-colors hover:text-fg">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {AI_HUB_LIVE && (
            <nav aria-labelledby="footer-ai">
              <h2 id="footer-ai" className="mb-4 text-sm font-semibold text-fg">AI</h2>
              <ul className="grid gap-3 text-sm">
                <li><Link href="/ai" className="text-muted transition-colors hover:text-fg">AI Tools</Link></li>
                <li><Link href="/ai" className="text-muted transition-colors hover:text-fg">AI Developer Hub</Link></li>
              </ul>
            </nav>
          )}
        </div>
      </div>
      
      <div className="border-t border-line">
        <div className="layout-content flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-sm text-muted">&copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-muted">
            <a href="https://x.com/castovdev" target="_blank" rel="noopener noreferrer" className="hover:text-fg transition-colors">@castovdev</a>
            <span>•</span>
            <Link href="/sponsor" className="hover:text-fg transition-colors">Sponsor</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
