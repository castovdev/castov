import { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, faqJsonLd, webPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { FaqSection } from "@/components/faq-section";
import { HTTP_STATUS_LIST } from "@/lib/http-statuses";
import { ArrowRight, Globe } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "HTTP Status Codes Directory & Developer Reference | Castov",
  description:
    "Complete list of HTTP status codes (1xx to 5xx) with clear explanations, cause analysis, and fixes for web developers and API engineers.",
  path: "/http-status",
});

const CATEGORIES = [
  {
    key: "1xx",
    name: "1xx Informational",
    desc: "Request received, continuing process.",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    key: "2xx",
    name: "2xx Success",
    desc: "The action was successfully received, understood, and accepted.",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  {
    key: "3xx",
    name: "3xx Redirection",
    desc: "Further action must be taken to complete the request.",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    key: "4xx",
    name: "4xx Client Error",
    desc: "The request contains bad syntax or cannot be fulfilled.",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  {
    key: "5xx",
    name: "5xx Server Error",
    desc: "The server failed to fulfill an apparently valid request.",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
];

const FAQS = [
  {
    q: "What is an HTTP status code?",
    a: "An HTTP status code is a three-digit integer returned by a web server to indicate the result of a client request. The first digit defines the class of response, ranging from 1xx (Informational) to 5xx (Server Error).",
  },
  {
    q: "What is the difference between 401 Unauthorized and 403 Forbidden?",
    a: "401 Unauthorized means authentication is missing or invalid (the server does not know who you are). 403 Forbidden means the server knows who you are, but you lack permission to access the resource.",
  },
  {
    q: "Which HTTP status codes are best for SEO redirects?",
    a: "Use 301 Moved Permanently for permanent URL migrations so search engines pass link equity to the new destination. Use 302 Found or 307 Temporary Redirect for short-term redirects.",
  },
];

export default function HttpStatusIndexPage() {
  const path = "/http-status";

  return (
    <div className="layout-content max-w-5xl py-8 sm:py-12">
      <JsonLd
        data={[
          webPageJsonLd({
            name: "HTTP Status Codes Directory",
            description:
              "Complete directory of HTTP status codes with diagnostic explanations and practical resolution guides.",
            path,
          }),
          faqJsonLd(FAQS),
        ]}
      />

      <Breadcrumb
        path={path}
        crumbs={[
          { name: "Home", href: "/" },
          { name: "HTTP Status Codes" },
        ]}
      />

      <div className="mt-8 mb-12">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-mono font-bold text-accent">
          <Globe className="w-3.5 h-3.5" /> DEVELOPER PROTOCOL REFERENCE
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-fg mb-4">
          HTTP Status Codes Directory
        </h1>
        <p className="text-xl text-muted leading-relaxed max-w-3xl">
          Quickly identify response codes, understand why errors happen, and find exact solutions for your API and web application development.
        </p>
      </div>

      <div className="mb-12 rounded-2xl border border-accent/30 bg-accent/5 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-fg mb-1">Free HTTP status mock endpoint</h2>
        <p className="text-sm text-muted mb-3">
          Reproduce any status from 200 to 599 to test retries, error screens, and timeouts. CORS enabled, add{" "}
          <code className="font-mono">?delay=2000</code> to simulate a slow server.
        </p>
        <code className="block overflow-x-auto rounded-md bg-[#0b0f17] px-3 py-2 font-mono text-xs text-slate-200 sm:text-sm">
          curl -i https://castov.com/api/mock/429
        </code>
      </div>

      <div className="space-y-12">
        {CATEGORIES.map((cat) => {
          const codes = HTTP_STATUS_LIST.filter((s) => s.type === cat.key);
          if (codes.length === 0) return null;

          return (
            <section key={cat.key} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                <h2 className="text-2xl font-bold text-fg flex items-center gap-3">
                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${cat.badgeClass}`}>
                    {cat.key}
                  </span>
                  <span>{cat.name}</span>
                </h2>
                <p className="text-xs text-muted">{cat.desc}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {codes.map((item) => (
                  <Link
                    key={item.code}
                    href={`/http-status/${item.code}`}
                    className="card p-4 group hover:border-accent transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-lg font-bold text-fg group-hover:text-accent transition-colors">
                          {item.code}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </div>
                      <div className="font-semibold text-sm text-fg mb-1">
                        {item.title.replace(item.code + " ", "")}
                      </div>
                      <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-16">
        <FaqSection items={FAQS} />
      </div>
    </div>
  );
}
