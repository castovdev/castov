import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumb } from "@/components/breadcrumb";
import { FaqSection } from "@/components/faq-section";
import { AdSlot } from "@/components/ad-slot";
import { ERROR_FIXES } from "@/lib/error-fixes-registry";
import { ArrowRight, Wrench, Globe, Database, Cpu, GitBranch, Cloud, Terminal } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Developer Error Fix Encyclopedia — 35 Interactive Solutions | Castov",
  description:
    "Instant fixes for 35 developer errors: Next.js hydration, CORS, Docker port binds, Postgres slots, SQLite locks, OpenSSL, and TypeScript errors.",
  path: "/error-fixes",
});

const CATEGORIES = [
  { name: "Next.js & React", icon: Cpu, desc: "Hydration mismatches, infinite re-render loops, dynamic server usage, and hook depth limits." },
  { name: "Network & HTTP", icon: Globe, desc: "CORS missing origin, Nginx 502/413, Fetch TypeErrors, and SSL certificate rejections." },
  { name: "DevOps & Docker", icon: Terminal, desc: "Docker port binds, out of disk space, K8s CrashLoopBackOff, and Systemd rate limits." },
  { name: "Database & ORM", icon: Database, desc: "Postgres connection slots & deadlocks, SQLite database locks, and Prisma P1001 reachability." },
  { name: "TypeScript & Node.js", icon: Wrench, desc: "Missing module types, Node OpenSSL 3.0, Heap Out of Memory, and npm peer dependencies." },
  { name: "Git & Version Control", icon: GitBranch, desc: "Unrelated histories merge refusal, detached HEAD recovery, and commit conflicts." },
  { name: "Cloud & Security", icon: Cloud, desc: "Content Security Policy inline script blocks, DynamoDB throttling, and AWS S3 403 Access Denied." },
] as const;

const ENCYCLOPEDIA_FAQS = [
  {
    q: "How does the Castov Error Fix Generator work?",
    a: "Select your error, adjust environment parameters (such as port numbers, origin URLs, memory limits, or database names), and the generator renders tailored configuration files, code diffs, and terminal commands ready to copy-paste.",
  },
  {
    q: "Are the fixes verified against modern framework versions?",
    a: "Yes. Every fix includes root-cause analysis verified against Next.js 15+, React 19, Node.js 20+, Docker Compose v2, and PostgreSQL 16.",
  },
  {
    q: "Can I run the diagnostic commands safely?",
    a: "All provided terminal diagnostics are non-destructive inspection commands (such as lsof, nc, netstat, psql queries, and sysctl checks) designed to identify issues without altering system state.",
  },
];

export default function ErrorFixesHubPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumb
        path="/error-fixes"
        crumbs={[{ name: "Home", href: "/" }, { name: "Error Fixes" }]}
      />

      <div className="hero-section -mx-4 px-4 py-12 md:py-16 text-center sm:text-left">
        <div className="mb-6">
          <span className="hero-badge">
            <span className="hero-badge-dot" aria-hidden="true" />
            35 Common Developer Errors & Interactive Fix Generators
          </span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-fg">
          Developer Error Fix Encyclopedia
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted">
          Diagnose, understand, and fix production roadblocks. Includes root cause breakdowns, broken vs fixed code comparisons,
          safe terminal diagnostics, and customizable configuration generators.
        </p>
      </div>

      <AdSlot placement="tool-top" />

      {/* Error Categories Grid */}
      <section aria-labelledby="errors-matrix" className="mt-12 space-y-12">
        {CATEGORIES.map((cat) => {
          const errors = ERROR_FIXES.filter((e) => e.category === cat.name);
          const Icon = cat.icon;

          return (
            <div key={cat.name} className="border-t border-line/60 pt-8 first:border-0 first:pt-0">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent border border-accent/20">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-fg">{cat.name} ({errors.length})</h2>
                  <p className="text-xs text-muted">{cat.desc}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {errors.map((err) => (
                  <Link
                    key={err.slug}
                    href={`/error-fixes/${err.slug}`}
                    className="group card block p-4 no-underline hover:border-accent transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-semibold text-fg group-hover:text-accent transition-colors text-sm">
                        {err.name}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0 ml-2 mt-0.5" />
                    </div>
                    <p className="mt-2 text-xs text-muted line-clamp-2 leading-relaxed">
                      {err.summary}
                    </p>
                    <div className="mt-3">
                      <span className="inline-block text-[10px] font-mono font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                        {err.category}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <AdSlot placement="content-middle" />

      <div className="mt-14">
        <FaqSection items={ENCYCLOPEDIA_FAQS} headingId="encyclopedia-faq" />
      </div>

      <section className="cta-band mt-14 p-10 text-center" aria-labelledby="cta-heading">
        <h2 id="cta-heading" className="text-3xl font-extrabold tracking-tight">
          Facing a tricky error right now?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted">
          Pick any guide above to customize solution parameters and copy the exact fix for your stack.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/error-fixes/nextjs-hydration-failed" className="btn btn-primary">
            Next.js Hydration Failed Fix
          </Link>
          <Link href="/error-fixes/cors-access-control-allow-origin-missing" className="btn btn-secondary">
            CORS Missing Origin Fix
          </Link>
          <Link href="/error-fixes/docker-bind-address-already-in-use" className="btn btn-secondary">
            Docker Port Bind Fix
          </Link>
        </div>
      </section>
    </div>
  );
}
