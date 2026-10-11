import Link from "next/link";
import { TOOLS, toolPath } from "@/content/tools";
import { SITE } from "@/lib/site";
import { AI_HUB_LIVE } from "@/lib/flags";
import { BrandMark } from "./brand-mark";

const COMPANY = [
  { href: "/about", label: "About" },
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
              <li><Link href="/guides" className="text-muted transition-colors hover:text-fg">Guides</Link></li>
              <li><Link href="/developer" className="text-muted transition-colors hover:text-fg">Code Snippets</Link></li>
              <li><Link href="/utc-converter" className="text-muted transition-colors hover:text-fg">UTC Time</Link></li>
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
        </div>
      </div>
    </footer>
  );
}
