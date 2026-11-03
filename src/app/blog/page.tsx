import type { Metadata } from "next";
import { BLOG_POSTS, getBlogCategories } from "@/content/blog";
import { BlogList } from "@/components/blog-list";
import { Breadcrumb } from "@/components/breadcrumb";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { BookOpen, Sparkles, Shield, Cpu } from "lucide-react";

const TITLE = "Engineering & Architecture Blog (100 Articles) | Castov";
const DESCRIPTION =
  "Deep dives into local-first autonomous AI agents, zero-telemetry DevSecOps, Windows automation, Next.js architecture, SQLite internals, and high-performance developer utilities.";

export const metadata: Metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/blog",
});

export default function BlogIndexPage() {
  const categories = getBlogCategories();

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Blog" },
  ];

  const jsonLdData = [
    breadcrumbJsonLd(breadcrumbs, "/blog"),
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12 space-y-8">
      <JsonLd data={jsonLdData} />
      <Breadcrumb crumbs={breadcrumbs} path="/blog" />

      {/* Hero Section */}
      <div className="space-y-4 border-b border-line pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-accent/10 text-accent border border-accent/25">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Castov Technical Engineering Library</span>
          <span className="bg-accent/20 px-1.5 py-0.2 rounded text-[10px] font-bold">
            100 Articles
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-fg">
          Engineering & Architecture Blog
        </h1>

        <p className="text-sm sm:text-base text-muted max-w-3xl leading-relaxed">
          Comprehensive, production-tested architectural guides covering Autonomous AI Agents, Zero-Telemetry DevSecOps, Windows Automation, Next.js 16 performance, and developer utility engineering.
        </p>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="flex items-center gap-2.5 p-3 rounded-xl border border-line bg-card/60 text-xs text-muted">
            <Cpu className="w-4 h-4 text-accent shrink-0" />
            <span>Local-First & WASM Architecture</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl border border-line bg-card/60 text-xs text-muted">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Zero-Telemetry & Cryptographic Privacy</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl border border-line bg-card/60 text-xs text-muted">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Interactive Tool Integrations</span>
          </div>
        </div>
      </div>

      {/* Main Blog List with Filters & Search */}
      <BlogList posts={BLOG_POSTS} categories={categories} />
    </div>
  );
}
