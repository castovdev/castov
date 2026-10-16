import type { Metadata } from "next";
import Link from "next/link";
import { Terminal, Shield, Lock, Zap } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { websiteJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Castov CLI & Env Vault | Secure Local Secrets",
  description: "Pull your encrypted environment variables securely into your local development server using the Castov CLI.",
  path: "/cli",
});

export default function CliPage() {
  return (
    <div className="layout-content max-w-4xl py-12">
      <Breadcrumb
        path="/cli"
        crumbs={[{ name: "Home", href: "/" }, { name: "Tools", href: "/tools" }, { name: "CLI" }]}
      />
      <JsonLd data={[websiteJsonLd()]} />
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent mb-6">
          <Terminal className="w-3.5 h-3.5" />
          <span>OFFICIAL NPM PACKAGE • V1.1.0</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-fg mb-4">
          Castov <span className="text-accent">CLI</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto">
          Instant stack-trace error diagnosis, Unix timestamps, ID detector (ObjectId, Snowflake), Cron parser, UUIDs, Base64, and JWT debugging directly in your terminal.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://www.npmjs.com/package/castov"
            target="_blank"
            rel="noopener noreferrer"
            className="btn bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-bold text-base px-6 py-3 shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2.5"
          >
            <Terminal className="w-5 h-5 text-white" />
            <span>View on npm (castov)</span>
            <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded font-mono font-bold">v1.1.0</span>
          </a>
          <a
            href="https://www.npmjs.com/package/castov-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="btn bg-card border border-line text-fg hover:bg-hover font-bold text-base px-6 py-3 transition-all flex items-center gap-2"
          >
            <span>castov-sdk (npm)</span>
          </a>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-16">
        <div className="card p-6 border border-line bg-card">
          <Terminal className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-xl font-bold mb-2 text-fg">Run Instantly with npx</h3>
          <p className="text-muted text-sm mb-4">Zero installation required. Execute immediately with Node.js 18+.</p>
          <div className="bg-[#050505] rounded-lg p-4 font-mono text-xs text-[#f4f4f5] border border-white/10">
            <code>npx castov fix &quot;EADDRINUSE: address already in use :::3000&quot;</code>
          </div>
        </div>
        <div className="card p-6 border border-line bg-card">
          <Zap className="w-8 h-8 text-accent mb-4" />
          <h3 className="text-xl font-bold mb-2 text-fg">Install Globally</h3>
          <p className="text-muted text-sm mb-4">Have the <code className="text-fg bg-field px-1.5 py-0.5 rounded">castov</code> command available globally in your shell.</p>
          <div className="bg-[#050505] rounded-lg p-4 font-mono text-xs text-[#f4f4f5] border border-white/10">
            <code>npm install -g castov</code>
          </div>
        </div>
      </div>

      {/* Terminal Cheat Sheet */}
      <div className="mb-16 bg-card p-8 rounded-2xl border border-line">
        <h2 className="text-2xl font-bold mb-6 text-fg">Popular Terminal Commands</h2>
        <div className="space-y-4 font-mono text-xs">
          <div className="p-4 bg-field rounded-xl border border-accent/30">
            <span className="text-accent font-semibold"># Diagnose &amp; fix terminal errors or pipe crash logs directly (v1.1.0)</span>
            <div className="text-fg font-bold mt-1">npx castov fix &quot;Hydration failed because the initial UI does not match&quot;</div>
            <div className="text-muted mt-1">npm run build 2&gt;&amp;1 | npx castov fix</div>
          </div>
          <div className="p-4 bg-field rounded-xl border border-line">
            <span className="text-muted"># Unix timestamp parse (auto-detect seconds &amp; ms)</span>
            <div className="text-fg font-bold mt-1">castov ts 1700000000</div>
          </div>
          <div className="p-4 bg-field rounded-xl border border-line">
            <span className="text-muted"># Identify ID type (ObjectId, Snowflake, UUIDv7, ULID)</span>
            <div className="text-fg font-bold mt-1">castov detect 507f1f77bcf86cd799439011</div>
          </div>
          <div className="p-4 bg-field rounded-xl border border-line">
            <span className="text-muted"># Explain cron expression &amp; preview next 5 execution runs</span>
            <div className="text-fg font-bold mt-1">castov cron &quot;*/15 * * * *&quot; UTC</div>
          </div>
          <div className="p-4 bg-field rounded-xl border border-line">
            <span className="text-muted"># Generate time-sortable RFC 9562 UUIDv7</span>
            <div className="text-fg font-bold mt-1">castov uuid -n 3 --v7</div>
          </div>
          <div className="p-4 bg-field rounded-xl border border-line">
            <span className="text-muted"># Decode JWT token locally (offline &amp; zero-knowledge)</span>
            <div className="text-fg font-bold mt-1">castov jwt &lt;your-token&gt;</div>
          </div>
        </div>
      </div>

      <div className="prose prose-sm prose-invert max-w-none text-fg mb-16 bg-card p-8 rounded-2xl border border-line">
        <h2 className="text-2xl font-bold mb-4">Zero-Knowledge &amp; Offline-First</h2>
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <div>
              <strong>100% Local Execution:</strong> All commands execute entirely in your local Node.js environment without sending any tokens, timestamps, or hashes to remote servers.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <strong>Developer-First Workflows:</strong> Generate time-ordered UUIDv7 identifiers (<code className="bg-field px-1.5 py-0.5 rounded text-fg">castov uuid --v7</code>), inspect JWT claims, and convert IANA timezones instantly without network dependencies.
            </div>
          </li>
        </ul>
      </div>

      <div className="text-center flex flex-wrap justify-center gap-4">
        <a
          href="https://www.npmjs.com/package/castov"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary px-8 py-3 text-lg"
        >
          View on npm
        </a>
        <Link href="/developer" className="btn bg-card border border-line text-fg px-8 py-3 text-lg hover:bg-hover">
          Developer Hub
        </Link>
      </div>
    </div>
  );
}
