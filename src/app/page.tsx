import type { Metadata } from "next";
import Link from "next/link";
import { CategorySection } from "@/components/category-section";
import { FaqSection } from "@/components/faq-section";
import { HOME_FAQ } from "@/content/home";
import { buildMetadata, faqJsonLd, websiteJsonLd, webApplicationJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { ArrowRight, Terminal, ShieldCheck, Workflow, Command, Zap, Code } from "lucide-react";
import { HeroQuickConvert } from "@/components/hero-quick-convert";
import { PinnedToolsTray } from "@/components/pinned-tools";
import { InstallationDistributionSection } from "@/components/installation-distribution-section";
import { HomeWelcomeBanner, HomeBottomCta, HomeBentoVaultCard, HomePinnedQuickBar } from "@/components/home-personalized-view";
import { LiveTerminalPlayground } from "@/components/live-terminal-playground";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Castov | Developer Tools & MCP Server (100% Client-Side, Offline & CLI)",
    description: "Fast, 100% client-side developer platform: Web + CLI + MCP Server for Cursor and Claude. Zero-data logging, JSON to TypeScript, Cron multi-timezone, and cryptographic pipelines.",
    path: "/",
  }),
  openGraph: {
    ...buildMetadata({
      title: "Castov | Developer Tools & MCP Server (100% Client-Side, Offline & CLI)",
      description: "Fast, 100% client-side developer platform: Web + CLI + MCP Server for Cursor and Claude. Zero-data logging, JSON to TypeScript, Cron multi-timezone, and cryptographic pipelines.",
      path: "/",
    }).openGraph,
    title: "Castov | Developer Tools & MCP Server (100% Client-Side, Offline & CLI)",
  },
};

export default function HomePage() {
  return (
    <div className="bg-bg min-h-screen text-fg font-sans selection:bg-accent/20">
      <JsonLd
        data={[
          websiteJsonLd(),
          faqJsonLd(HOME_FAQ),
          webApplicationJsonLd({
            name: "Castov Developer Platform",
            description: "100% Client-Side Developer Tools, Native CLI, and MCP Server for Cursor & Claude. Zero-data logging, JSON to TypeScript, Cron, and cryptographic pipelines.",
            path: "/",
          }),
        ]}
      />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-28 pb-24 lg:pt-36 lg:pb-32 overflow-hidden border-b border-line">
        {/* Subtle grid and ambient glow background for professional look */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-accent/20 blur-[100px] rounded-full opacity-50 pointer-events-none" />

        <div className="container relative mx-auto px-4 text-center max-w-5xl z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-field/90 backdrop-blur-md border border-emerald-500/30 text-xs font-mono mb-8 text-fg shadow-xs cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-semibold">100% Client-Side</span>
            <span className="text-muted">•</span>
            <span>Zero-Data Logging</span>
            <span className="text-muted">•</span>
            <span>Works 100% Offline</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-fg mb-6 leading-[1.12]">
            The Complete Developer Toolkit <br />
            <span className="bg-gradient-to-r from-accent via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Web + CLI + AI (MCP)
            </span>
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl text-muted max-w-3xl mx-auto mb-8 leading-relaxed">
            All your mission-critical utilities executed locally in your browser, terminal, and AI agents.
            Zero server tracking, sub-millisecond transforms, and seamless multi-stage pipelines.
          </p>

          {/* Fast Omnibox & Ecosystem Pill */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl mx-auto mb-10 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-line shadow-xs">
              <Command className="w-3.5 h-3.5 text-accent" />
              <span>Smart Omnibox:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-field border border-line text-[11px] font-bold text-fg">Ctrl + K</kbd>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-line shadow-xs">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Terminal CLI:</span>
              <code className="text-fg font-bold">npx castov</code>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-line shadow-xs">
              <Workflow className="w-3.5 h-3.5 text-purple-400" />
              <span>Cursor &amp; Claude:</span>
              <code className="text-accent font-bold">castov mcp</code>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/tools" className="group flex items-center justify-center gap-2 bg-accent text-accent-fg px-8 py-3.5 rounded-xl font-bold text-base sm:text-lg hover:bg-accent-hover transition-all w-full sm:w-auto shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]">
              Explore 61 Tools <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/mcp" className="flex items-center justify-center gap-2 bg-card border border-accent/40 text-fg px-8 py-3.5 rounded-xl font-bold text-base sm:text-lg hover:bg-field transition-colors w-full sm:w-auto shadow-sm">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span>MCP Server (13 Tools)</span>
            </Link>
            <Link href="/cli" className="flex items-center justify-center gap-2 bg-card border border-line text-fg px-8 py-3.5 rounded-xl font-bold text-base sm:text-lg hover:bg-field transition-colors w-full sm:w-auto shadow-sm">
              <Terminal size={18} className="text-muted" />
              <span>CLI Guide</span>
            </Link>
          </div>

          {/* Quick timestamp/date paste inspector */}
          <HeroQuickConvert />
          <HomeWelcomeBanner />
          <LiveTerminalPlayground />
        </div>
      </section>

            {/* --- THE 5 COMPETITIVE WEAPONS GRID --- */}
      <section className="py-24 border-b border-line bg-card relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-mono font-semibold text-accent mb-3">
              Built for Speed, Privacy &amp; AI
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-fg">
              Why Developers Choose Castov
            </h2>
            <p className="text-muted text-base sm:text-lg max-w-2xl mx-auto">
              Five architectural decisions that make Castov the preferred toolkit for modern software teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Zero-Data Logging */}
            <div className="bg-bg border border-line hover:border-emerald-500/40 p-7 rounded-3xl transition-all shadow-sm group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-fg">Zero-Data Logging</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">WebCrypto</span>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                100% of cryptography, JWT inspection, JSON formatting, and timestamp parsing executes in local browser memory. Not a single keystroke is sent to external servers.
              </p>
            </div>

            {/* 2. Tool Pipelines */}
            <div className="bg-bg border border-line hover:border-accent/40 p-7 rounded-3xl transition-all shadow-sm group">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Workflow className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-fg">Tool Pipelines ("Pipe to...")</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/15 text-accent font-semibold">Chaining</span>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                Pass outputs seamlessly across utilities in one click: JSON directly to TypeScript interfaces, Cron schedules into world timezones, and diffs to schema generators without clipboard juggling.
              </p>
            </div>

            {/* 3. Web + CLI + MCP Ecosystem */}
            <div className="bg-bg border border-line hover:border-purple-500/40 p-7 rounded-3xl transition-all shadow-sm group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Terminal className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-fg">Unified Ecosystem</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-semibold">Web • CLI • MCP</span>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                The exact same 13 utilities work on the Web, in your local terminal via <code className="text-fg bg-field px-1 rounded">castov</code>, and inside Cursor or Claude via our Grade-A certified Model Context Protocol server.
              </p>
            </div>

            {/* 4. Encrypted Share Links */}
            <div className="bg-bg border border-line hover:border-blue-500/40 p-7 rounded-3xl transition-all shadow-sm group">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Code className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-fg">Encrypted URL Shares</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-semibold">Zero-Server</span>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                Share inputs, diffs, and settings with teammates instantly. Payloads are compressed into the URL hash fragment (<code className="text-fg bg-field px-1 rounded">#</code>) so servers never see what you shared.
              </p>
            </div>

            {/* 5. Cloud Sync & Team Vaults */}
            <HomeBentoVaultCard />
          </div>
        </div>
      </section>

      {/* --- MULTI-PLATFORM DISTRIBUTION & EXECUTION LAYER --- */}
      <InstallationDistributionSection />

      {/* --- FLAGSHIP FEATURES --- */}
      <section className="py-24 border-b border-line bg-bg relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div>
                <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 text-fg">Advanced Capabilities</h2>
                <p className="text-muted text-lg">
                  We didn't just build formatters. We built the architecture required by modern engineering teams.
                </p>
              </div>

              <div className="flex items-start gap-5 group">
                <div className="p-4 rounded-2xl bg-success/10 text-success shrink-0">
                  <Workflow size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-success transition-colors text-fg">P2P Multiplayer Canvas</h3>
                  <p className="text-muted leading-relaxed">
                    A visual node-editor for building data pipelines. Connects peers in real-time using WebRTC and CRDTs (Yjs) with direct peer-to-peer data channels coordinated through public signaling servers (which may receive connection metadata). Workflow graphs, node configurations, and payload data are never stored on Castov servers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5 group">
                <div className="p-4 rounded-2xl bg-warning/10 text-warning shrink-0">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-warning transition-colors text-fg">Steganography Environment Vaults</h3>
                  <p className="text-muted leading-relaxed">
                    End-to-end encrypted environment variables. We hide your secure AES keys inside standard image pixels (Steganography) for invisible sharing, entirely in your browser.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-line p-8 rounded-3xl shadow-xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div className="flex items-center gap-3">
                    <Zap className="text-primary" size={20} />
                    <span className="font-bold text-fg">API Mocker (Service Worker)</span>
                  </div>
                  <span className="text-xs font-mono bg-field px-2 py-1 rounded text-muted border border-line">Intercepting</span>
                </div>
                <div className="font-mono text-sm space-y-3">
                  <div className="flex text-muted">
                    <span className="text-success mr-2">GET</span> /api/v1/users
                  </div>
                  <div className="bg-bg p-4 rounded-xl border border-line text-xs overflow-x-auto text-fg">
                    {`{
  "status": 200,
  "data": [
    { "id": "usr_91x", "role": "admin" }
  ]
}`}
                  </div>
                  <p className="text-muted text-xs leading-relaxed mt-4">
                    Test your frontend without a backend. Our Local API Mocker runs entirely in your browser's Service Worker to simulate payloads globally.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

{/* --- TOOLS CATEGORIES SECTION --- */}
      <section className="py-24 bg-card border-b border-line">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Explore Our Toolkit</h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              From time manipulation to cryptography, everything is beautifully structured and instantly accessible.
            </p>
          </div>
          <HomePinnedQuickBar />
          <PinnedToolsTray />
          <CategorySection />
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="py-24 bg-bg border-b border-line">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-muted text-lg">
              Everything you need to know about Castov.
            </p>
          </div>
          <FaqSection items={HOME_FAQ} />
        </div>
      </section>
      
      {/* --- CTA SECTION --- */}
      <section className="py-12 lg:py-20 bg-card">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to supercharge your workflow?</h2>
          <p className="text-xl text-muted mb-10">
            Free browser-based developer tools. Some collaboration, cloud, and external API features may require an account or additional configuration.
          </p>
          <HomeBottomCta />
        </div>
      </section>
    </div>
  );
}
