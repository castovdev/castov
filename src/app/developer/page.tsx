import type { Metadata } from "next";
import Link from "next/link";
import { TOOLS } from "@/content/tools";
import { GUIDES } from "@/content/guides";
import { StaticPage } from "@/components/static-page";
import { ToolCard } from "@/components/tool-card";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Developer Hub – Timestamp & Time Tools for Developers | Castov",
  description:
    "Free developer resources for working with Unix timestamps, ISO 8601, RFC 3339, cron expressions and time zones in JavaScript, Python, Go and more.",
  path: "/developer",
});

const DEV_TOOL_SLUGS = [
  "iso-8601-converter",
  "rfc-3339-converter",
  "cron-generator",
  "iso-8601-to-unix",
  "unix-to-iso-8601",
  "business-hours-converter",
  "unix-timestamp-batch-converter",
  "unix-timestamp-validator",
];

const CODE_SNIPPETS = [
  {
    lang: "JavaScript",
    label: "Get current Unix timestamp",
    code: "Math.floor(Date.now() / 1000)            // seconds\nDate.now()                              // milliseconds",
  },
  {
    lang: "Python",
    label: "Convert timestamp to ISO 8601",
    code: "import datetime\ndt = datetime.datetime.utcfromtimestamp(1700000000)\ndt.isoformat() + 'Z'  # '2023-11-14T22:13:20Z'",
  },
  {
    lang: "Go",
    label: "Parse ISO 8601 string",
    code: 'import "time"\nt, _ := time.Parse(time.RFC3339, "2023-11-14T22:13:20Z")\nt.Unix() // 1700000000',
  },
  {
    lang: "SQL",
    label: "Extract Unix timestamp",
    code: "-- PostgreSQL\nEXTRACT(EPOCH FROM NOW())::BIGINT\n-- MySQL\nUNIX_TIMESTAMP(NOW())",
  },
];

const DEV_GUIDE_SLUGS = [
  "iso-8601-date-format-guide",
  "cron-expressions-explained",
  "time-zones-and-dst-for-developers",
  "seconds-vs-milliseconds-timestamps",
];

export default function DeveloperPage() {
  const devTools = TOOLS.filter((t) => DEV_TOOL_SLUGS.includes(t.slug));

  return (
    <StaticPage
      title="Developer Hub & Ecosystem"
      intro="Discover Castov's developer-focused integrations: SDK, Command Line Interface, VS Code Extension, and more."
      crumbs={[{ name: "Home", href: "/" }, { name: "Developer" }]}
      path="/developer"
    >
      {/* Ecosystem Showcase */}
      <div className="not-prose grid gap-6 mt-8 mb-16 lg:grid-cols-2">
        {/* SDK */}
        <div className="bg-card border-2 border-primary/20 hover:border-primary/50 transition-colors p-6 rounded-2xl shadow-lg shadow-primary/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-fg">castov-sdk</h3>
                <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-mono font-semibold">v1.0.0</span>
              </div>
            </div>
            <p className="text-muted text-sm mb-4">
              Zero-dependency TypeScript &amp; JavaScript utilities: UUIDs v4/v7, Unix timestamps, ID detector (ObjectId, Snowflake), Cron parser, and JWT decoder.
            </p>
            <pre className="code-block text-xs overflow-x-auto border border-line bg-field/50 p-3 rounded-lg font-mono text-fg mb-3">
              <code>npm install castov-sdk</code>
            </pre>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <a
              href="https://www.npmjs.com/package/castov-sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-primary text-white hover:bg-primary/90 text-xs font-bold px-4 py-2 text-center flex-1"
            >
              View on npm
            </a>
          </div>
        </div>

        {/* CLI */}
        <div className="bg-card border border-line hover:border-accent/50 transition-colors p-6 rounded-2xl shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent/10 text-accent rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 17l6-6-6-6m12 14h-6" /></svg>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-fg">Castov CLI</h3>
                <span className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full font-mono font-semibold">v1.0.0</span>
              </div>
            </div>
            <p className="text-muted text-sm mb-4">
              Instant zero-server developer toolkit in your terminal. Run standalone via npx or install globally with zero configuration.
            </p>
            <pre className="code-block text-xs overflow-x-auto border border-line bg-field/50 p-3 rounded-lg font-mono text-fg mb-3">
              <code>npx castov --help</code>
            </pre>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <a
              href="https://www.npmjs.com/package/castov"
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-bold px-4 py-2 text-center flex-1"
            >
              View on npm
            </a>
            <Link
              href="/cli"
              className="btn bg-field border border-line text-muted hover:text-fg text-xs font-medium px-4 py-2 text-center"
            >
              CLI Docs
            </Link>
          </div>
        </div>

        {/* VS Code */}
        <div className="bg-card border border-line hover:border-[#007ACC]/50 transition-colors p-6 rounded-2xl shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#007ACC]/10 text-[#007ACC] rounded-lg">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/></svg>
              </div>
              <h3 className="text-xl font-bold text-fg">VS Code Extension</h3>
            </div>
            <p className="text-muted text-sm mb-4">
              The official zero-server developer toolkit directly in your editor. Select text to encode/decode, or insert UUIDs without switching windows.
            </p>
          </div>
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <a
              href="https://marketplace.visualstudio.com/items?itemName=castov.castov-vscode"
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-bold px-4 py-2 text-center"
            >
              Install from Marketplace
            </a>
            <Link
              href="/extension"
              className="btn bg-field border border-line text-muted hover:text-fg text-xs font-medium px-4 py-2 text-center"
            >
              Download VSIX
            </Link>
          </div>
        </div>

        {/* Cmd+K */}
        <div className="bg-card border border-line hover:border-fg/30 transition-colors p-6 rounded-2xl shadow-md flex flex-col justify-center items-center text-center">
          <div className="flex items-center gap-2 mb-4">
            <kbd className="bg-field px-3 py-1.5 rounded-lg border border-line text-lg font-mono text-fg shadow-sm">Ctrl</kbd>
            <span className="text-muted font-bold">+</span>
            <kbd className="bg-field px-3 py-1.5 rounded-lg border border-line text-lg font-mono text-fg shadow-sm">K</kbd>
          </div>
          <h3 className="text-xl font-bold text-fg mb-2">Global Command Center</h3>
          <p className="text-muted text-sm">
            Press the shortcut anywhere on Castov to open the Command Palette. Inline compute UUIDs, search tools, and navigate blazing fast.
          </p>
        </div>
      </div>

      {/* Developer Tools */}
      <h2>Developer Utilities ({devTools.length})</h2>
      <p>
        Interactive tools for ISO 8601, RFC 3339, cron expressions, batch conversion, and validation — all run in your browser.
      </p>
      <div className="not-prose grid gap-4 mt-4 mb-12 sm:grid-cols-2">
        {devTools.map((t) => (
          <ToolCard key={t.slug} tool={t} headingLevel={3} />
        ))}
      </div>

      {/* Labs / Experimental Tools */}
      <div className="pt-8 border-t border-line">
        <div className="flex items-center gap-3 mb-2">
          <h2>Labs ({TOOLS.filter((t) => t.category === "Labs").length})</h2>
          <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Experimental tools
          </span>
        </div>
        <p>
          Experimental developer utilities: local WebRTC peer-to-peer data channels, image steganography, AST syntax parsing, and client-side computing.
        </p>
        <div className="not-prose grid gap-4 mt-4 mb-8 sm:grid-cols-2">
          {TOOLS.filter((t) => t.category === "Labs").map((t) => (
            <ToolCard key={t.slug} tool={t} headingLevel={3} />
          ))}
        </div>
      </div>
    </StaticPage>
  );
}
