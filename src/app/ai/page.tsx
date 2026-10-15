import type { Metadata } from "next";
import Link from "next/link";
import { AI_CATEGORIES, getAiToolsByCategory } from "@/lib/ai-tools";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "AI Developer Tools Directory | Castov",
  description: "A comprehensive registry of professional AI developer tools for prompts, local LLMs, calculators, schemas, and evals.",
  path: "/ai",
});

export default function AiDirectoryPage() {
  return (
    <div className="w-full pb-20">
      
      {/* --- Minimal Search Hero --- */}
      <section className="w-full border-b border-line bg-card pt-16 pb-16">
        <div className="layout-content flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="mb-6">
            <span className="text-sm font-medium tracking-wide text-primary uppercase">
              Castov AI Hub
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-fg mb-4">
            AI Developer Tools
          </h1>
          
          <p className="text-lg text-muted mb-10 leading-relaxed">
            The developer workbench for AI. Prototype prompts, configure MCP servers, calculate tokens, and structure model configurations.
          </p>

          <button 
            id="hero-search-trigger"
            className="w-full max-w-2xl flex items-center justify-between px-6 py-4 bg-field hover:bg-hover border border-line rounded-lg shadow-sm transition-colors text-left"
          >
            <div className="flex items-center gap-4 text-muted">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
              <span className="text-base font-medium">Search the AI directory...</span>
            </div>
            <kbd className="hidden sm:flex items-center justify-center h-7 px-2 text-xs font-medium bg-card text-muted rounded border border-line font-mono shadow-sm">
              ⌘ K
            </kbd>
          </button>
          
          <script dangerouslySetInnerHTML={{__html: `
            document.getElementById('hero-search-trigger')?.addEventListener('click', () => {
              window.dispatchEvent(new CustomEvent('open-command-palette'));
            });
          `}} />
        </div>
      </section>

      <div className="layout-content py-12">

        {/* --- Flagship Bento Grid --- */}
        <div className="mb-16">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-fg">Flagship Tools</h2>
            <p className="text-muted mt-1">Our most popular AI configuration tools.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-auto md:auto-rows-[220px]">
            
            {/* Main Large Card */}
            <Link href="/ai/vercel-ai-sdk-code-generator" className="md:col-span-2 md:row-span-2 card p-8 flex flex-col justify-between hover:border-muted transition-colors group">
              <div>
                <div className="w-12 h-12 rounded-lg bg-field border border-line flex items-center justify-center mb-6">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fg"><polygon points="12 2 2 22 22 22"></polygon></svg>
                </div>
                <h3 className="text-2xl font-bold text-fg mb-2">Vercel AI SDK Generator</h3>
                <p className="text-muted leading-relaxed max-w-md">Generate starter template Route Handlers and React Client components for streaming UI, text, and objects using Vercel AI SDK APIs.</p>
              </div>
              <div className="text-sm font-medium text-primary">
                Launch tool &rarr;
              </div>
            </Link>

            {/* Secondary Card 1 */}
            <Link href="/ai/mcp-config-builder" className="card p-6 flex flex-col justify-between hover:border-muted transition-colors group">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-field border border-line flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fg"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-fg">MCP Builder</h3>
                </div>
                <p className="text-sm text-muted">Generate config files for Model Context Protocol servers to integrate with Claude Desktop & Cursor.</p>
              </div>
            </Link>

            {/* Secondary Card 2 */}
            <Link href="/ai/cursorrules-generator" className="card p-6 flex flex-col justify-between hover:border-muted transition-colors group">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-field border border-line flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fg"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-fg">.cursorrules</h3>
                </div>
                <p className="text-sm text-muted">Build comprehensive project-specific AI coding guidelines for Cursor and Windsurf editors.</p>
              </div>
            </Link>
          </div>
        </div>

        {/* --- Category Grids --- */}
        <div className="space-y-16">
          {AI_CATEGORIES.map((category) => {
            const tools = getAiToolsByCategory(category);
            const name = category.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase());
            return (
              <section key={category} aria-labelledby={`cat-${category}`}>
                <div className="flex items-center justify-between mb-6 border-b border-line pb-2">
                  <h2 id={`cat-${category}`} className="text-xl font-semibold text-fg">
                    {name}
                  </h2>
                  <Link href={`/ai/${category}`} className="text-sm font-medium text-link hover:underline">
                    View All &rarr;
                  </Link>
                </div>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {tools.map((tool) => (
                    <Link
                      key={tool.slug}
                      href={`/ai/${tool.slug}`}
                      className="card p-5 flex flex-col hover:border-muted transition-colors"
                    >
                      <h3 className="text-base font-semibold text-fg mb-1.5">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-muted line-clamp-2 leading-relaxed">
                        {tool.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
