import type { Metadata } from "next";
import Link from "next/link";
import { Terminal, Code2, Zap } from "lucide-react";
import { CurlConverterTool } from "@/components/tools/curl-converter-tool";
import { buildMetadata, breadcrumbJsonLd, faqJsonLd, FaqItem } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = buildMetadata({
  title: "cURL to Code Converter (Fetch, Python Requests, Go, Rust) | Castov",
  description: "Convert raw cURL commands into clean JavaScript Fetch, Python Requests, Go http, and Rust reqwest code instantly in your browser. 100% private.",
  path: "/curl-converter",
});

const FAQS: FaqItem[] = [
  {
    q: "Does the cURL converter send my API tokens or payloads to a server?",
    a: "No. Castov parses and converts your cURL commands 100% client-side in your browser. No tokens, passwords, or endpoints are logged or transmitted.",
  },
  {
    q: "What target languages and libraries are supported?",
    a: "It converts cURL to native JavaScript (fetch / async/await), Python (requests), Go (net/http), and Rust (reqwest with Tokio).",
  },
];

export default function CurlConverterPage() {
  return (
    <div className="layout-content py-10 space-y-10">
      <JsonLd
        data={[
          breadcrumbJsonLd(
            [
              { name: "Home", href: "/" },
              { name: "Tools", href: "/tools" },
              { name: "cURL Converter" },
            ],
            "/curl-converter"
          ),
          faqJsonLd(FAQS),
        ]}
      />

      <nav aria-label="Breadcrumb" className="text-xs text-muted flex items-center gap-2">
        <Link href="/" className="hover:text-fg">Home</Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-fg">Tools</Link>
        <span>/</span>
        <span className="text-fg font-semibold">cURL Converter</span>
      </nav>

      <header className="space-y-4 border-b border-line pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
          <Terminal className="w-3.5 h-3.5" />
          <span>Zero-Server HTTP Request Converter</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-fg">
          cURL to Code Converter
        </h1>
        <p className="text-muted max-w-3xl text-sm sm:text-base leading-relaxed">
          Instantly convert raw terminal cURL commands into production-ready code in JavaScript (Fetch), Python (Requests), Go, and Rust.
        </p>
      </header>

      {/* Main Tool */}
      <CurlConverterTool />

      {/* FAQs */}
      <section className="space-y-4 pt-8 border-t border-line">
        <h2 className="text-lg font-bold text-fg">Frequently Asked Questions</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FAQS.map((f) => (
            <div key={f.q} className="p-4 rounded-xl bg-card border border-line space-y-2">
              <h3 className="font-semibold text-xs text-fg">{f.q}</h3>
              <p className="text-xs text-muted leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
