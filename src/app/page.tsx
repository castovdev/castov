import type { Metadata } from "next";
import Link from "next/link";
import { CategorySection } from "@/components/category-section";
import { FaqSection } from "@/components/faq-section";
import { HOME_FAQ } from "@/content/home";
import { buildMetadata, faqJsonLd, websiteJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { ArrowRight, Terminal, ShieldCheck, Workflow, Command, Zap, Code } from "lucide-react";
import { HeroQuickConvert } from "@/components/hero-quick-convert";
import { PinnedToolsTray } from "@/components/pinned-tools";
import { InstallationDistributionSection } from "@/components/installation-distribution-section";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Castov | Free Developer Tools: Timestamps, Time Zones, JSON & More",
    description: "Fast, simple, privacy-friendly tools for timestamps, dates, time zones, formats, and developer workflows.",
    path: "/",
  }),
  openGraph: {
    ...buildMetadata({
      title: "Castov | Free Developer Tools: Timestamps, Time Zones, JSON & More",
      description: "Fast, simple, privacy-friendly tools for timestamps, dates, time zones, formats, and developer workflows.",
      path: "/",
    }).openGraph,
    title: "Castov | Free Developer Tools: Timestamps, Time Zones, JSON & More",
  },
};

export default function HomePage() {
  return (
    <div className="bg-bg min-h-screen text-fg font-sans selection:bg-accent/20">
      <JsonLd data={[websiteJsonLd(), faqJsonLd(HOME_FAQ)]} />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-28 pb-24 lg:pt-36 lg:pb-32 overflow-hidden border-b border-line">
        {/* Subtle grid and ambient glow background for professional look */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-accent/20 blur-[100px] rounded-full opacity-50 pointer-events-none" />

        <div className="container relative mx-auto px-4 text-center max-w-5xl z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-field/80 backdrop-blur-sm border border-line text-sm font-semibold mb-8 text-fg shadow-sm cursor-default hover:bg-hover transition-colors">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            Castov Engine v2.0 is Live
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-fg mb-8 leading-[1.15]">
            Free Developer Tools: <br />
            <span className="bg-gradient-to-r from-accent via-accent to-success bg-clip-text text-transparent">Time, JSON, Encoding &amp; More</span>
          </h1>
          
          <p className="text-lg lg:text-xl text-muted max-w-3xl mx-auto mb-10 leading-relaxed">
            Free browser-based developer tools. Most tools run entirely in your browser; sharing, collaboration, P2P signaling, and selected cloud features may use external or encrypted infrastructure.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/tools" className="group flex items-center justify-center gap-2 bg-accent text-accent-fg px-8 py-4 rounded-xl font-bold text-lg hover:bg-accent-hover transition-all w-full sm:w-auto shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]">
              Explore Tools <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/mcp" className="flex items-center justify-center gap-2 bg-card border border-accent/40 text-fg px-8 py-4 rounded-xl font-bold text-lg hover:bg-field transition-colors w-full sm:w-auto shadow-sm">
              <ShieldCheck size={20} className="text-emerald-400" />
              <span>MCP Server (10 Tools)</span>
            </Link>
            <Link href="/developer" className="flex items-center justify-center gap-2 bg-card border border-line text-fg px-8 py-4 rounded-xl font-bold text-lg hover:bg-field transition-colors w-full sm:w-auto shadow-sm">
              Read Documentation
            </Link>
          </div>

          {/* Quick timestamp/date paste inspector */}
          <HeroQuickConvert />
        </div>
      </section>

            {/* --- THE ECOSYSTEM SHOWCASE --- */}
      <section className="py-24 border-b border-line bg-card relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 text-fg">A complete ecosystem, not just a website.</h2>
            <p className="text-muted text-lg lg:text-xl max-w-3xl mx-auto">
              Castov integrates directly into your workflow. From the browser to the terminal, and right inside your IDE.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Cmd+K */}
            <div className="bg-bg border border-line p-8 rounded-3xl hover:border-accent/50 transition-colors shadow-sm group">
              <div className="w-14 h-14 rounded-2xl bg-field flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Command className="text-fg w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-fg">Global Command Center</h3>
              <p className="text-muted leading-relaxed">
                Press <kbd className="px-2 py-0.5 bg-field rounded border border-line mx-1 font-mono text-sm">Cmd+K</kbd> anywhere. Inline-compute UUIDs, format dates, and navigate instantly without leaving your keyboard.
              </p>
            </div>

            {/* SDK, CLI & MCP */}
            <div className="bg-bg border border-line p-8 rounded-3xl hover:border-primary/50 transition-colors shadow-sm group flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Terminal className="text-primary w-7 h-7" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-2xl font-bold text-fg">MCP Server &amp; CLI</h3>
                  <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-mono font-semibold">npm v1.4.0</span>
                </div>
                <p className="text-muted leading-relaxed mb-6">
                  Connect 10 Glama Grade-A certified local tools to Claude, Cursor, and Windsurf (<code className="text-fg bg-field px-1 rounded">npx castov mcp</code>) or run utilities in terminal.
                </p>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-line">
                <Link href="/mcp" className="text-sm font-semibold text-accent hover:underline">
                  MCP Setup &rarr;
                </Link>
                <Link href="/cli" className="text-sm font-semibold text-primary hover:underline">
                  CLI Guide &rarr;
                </Link>
                <a
                  href="https://www.npmjs.com/package/castov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-muted hover:text-fg"
                >
                  npm &rarr;
                </a>
              </div>
            </div>

            {/* VS Code */}
            <div className="bg-bg border border-line p-8 rounded-3xl hover:border-[#007ACC]/50 transition-colors shadow-sm group md:col-span-2 lg:col-span-1 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#007ACC]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Code className="text-[#007ACC] w-7 h-7" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-2xl font-bold text-fg">VS Code Extensions</h3>
                  <span className="text-xs bg-[#007ACC]/15 text-[#007ACC] px-2 py-0.5 rounded-full font-mono font-semibold">13 Tools</span>
                </div>
                <p className="text-muted leading-relaxed mb-6">
                  13 specialized extensions for supply-chain security, MCP debugging, token cost tracking, webhook catching, and offline dev utilities directly in your editor.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-line">
                <a
                  href="https://marketplace.visualstudio.com/publishers/Castov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-[#007ACC] hover:underline"
                >
                  Marketplace &rarr;
                </a>
                <Link href="/extension" className="text-sm font-semibold text-muted hover:text-fg">
                  Browse All 13 &rarr;
                </Link>
              </div>
            </div>
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
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to supercharge your workflow?</h2>
          <p className="text-xl text-muted mb-10">
            Free browser-based developer tools. Some collaboration, cloud, and external API features may require an account or additional configuration.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/tools" className="flex items-center justify-center gap-2 bg-accent text-accent-fg px-8 py-4 rounded-xl font-bold text-lg hover:bg-accent-hover transition-colors shadow-sm w-full sm:w-auto">
              Browse All Tools
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
