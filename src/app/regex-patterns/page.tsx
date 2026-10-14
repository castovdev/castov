import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumb } from "@/components/breadcrumb";
import { FaqSection } from "@/components/faq-section";
import { AdSlot } from "@/components/ad-slot";
import { REGEX_PATTERNS } from "@/lib/regex-patterns-registry";
import { ArrowRight, ShieldCheck, Globe, Database, DollarSign, Code } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Regex Patterns Library & Live Tester — 40 Production Patterns | Castov",
  description:
    "Interactive regex library & tester: Email, URL, Password, IPv4/IPv6, Phone, UUID, Dates, JWT, and SemVer with instant multi-language code snippets.",
  path: "/regex-patterns",
});

const CATEGORIES = [
  { name: "Authentication & Security", icon: ShieldCheck, desc: "Emails, passwords, JWT tokens, XSS, and SQL injection sanitization." },
  { name: "Network & Web", icon: Globe, desc: "URLs, domain names, IPv4, IPv6, MAC addresses, and YouTube video IDs." },
  { name: "Data & Formatting", icon: Database, desc: "Dates, times, ISO 8601, UUIDs, Base64, whitespace, and Unicode." },
  { name: "Numbers & Finance", icon: DollarSign, desc: "International phone numbers, US phone, credit cards, and IBAN accounts." },
  { name: "Code & Markup", icon: Code, desc: "HTML tags, Markdown links, SemVer, Docker tags, Hex/RGB colors, and Git SHAs." },
] as const;

const LIBRARY_FAQS = [
  {
    q: "Are these regular expressions compatible with multiple programming languages?",
    a: "Yes! Every pattern in the Castov Regex Library adheres to standard PCRE / ECMAScript syntax and includes instant code generators for JavaScript, TypeScript, Python, Go, Rust, PHP, and Java.",
  },
  {
    q: "Can I test custom strings against these patterns before using them in production?",
    a: "Yes. Every pattern page features an interactive lab where you can test live strings, modify flags (g, i, m, s, u), and run validation matrices across pre-configured test cases.",
  },
  {
    q: "Is any data sent to external servers when testing regex on Castov?",
    a: "No. 100% of pattern evaluation and testing runs directly in your browser using the local JavaScript engine with zero telemetry.",
  },
];

export default function RegexPatternsHubPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumb
        path="/regex-patterns"
        crumbs={[{ name: "Home", href: "/" }, { name: "Regex Patterns" }]}
      />

      <div className="hero-section -mx-4 px-4 py-12 md:py-16 text-center sm:text-left">
        <div className="mb-6">
          <span className="hero-badge">
            <span className="hero-badge-dot" aria-hidden="true" />
            40 Production-Tested Regex Patterns & Live Testing Lab
          </span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-fg">
          Regular Expression Pattern Library
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted">
          Browse, test, and implement battle-tested regular expressions. Complete with live match highlighting,
          token breakdowns, validation matrices, and copy-ready code snippets in 6 languages.
        </p>
      </div>

      <AdSlot placement="tool-top" />

      {/* Categories Matrix */}
      <section aria-labelledby="patterns-matrix" className="mt-12 space-y-12">
        {CATEGORIES.map((cat) => {
          const patterns = REGEX_PATTERNS.filter((p) => p.category === cat.name);
          const Icon = cat.icon;

          return (
            <div key={cat.name} className="border-t border-line/60 pt-8 first:border-0 first:pt-0">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent border border-accent/20">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-fg">{cat.name} ({patterns.length})</h2>
                  <p className="text-xs text-muted">{cat.desc}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {patterns.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/regex-patterns/${p.slug}`}
                    className="group card block p-4 no-underline hover:border-accent transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-semibold text-fg group-hover:text-accent transition-colors text-sm">
                        {p.name}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0 ml-2 mt-0.5" />
                    </div>
                    <p className="mt-2 text-xs text-muted line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                    <div className="mt-3">
                      <code className="block text-[11px] font-mono text-muted bg-field px-2 py-1 rounded border border-line truncate">
                        /{p.pattern}/{p.flags}
                      </code>
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
        <FaqSection items={LIBRARY_FAQS} headingId="library-faq" />
      </div>

      <section className="cta-band mt-14 p-10 text-center" aria-labelledby="cta-heading">
        <h2 id="cta-heading" className="text-3xl font-extrabold tracking-tight">
          Need a specific regular expression?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted">
          Pick any pattern above to open the live interactive laboratory and test your strings in real time.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/regex-patterns/email-validation" className="btn btn-primary">
            Email Validation Regex
          </Link>
          <Link href="/regex-patterns/url-http-https" className="btn btn-secondary">
            URL Validation Regex
          </Link>
          <Link href="/regex-patterns/strong-password" className="btn btn-secondary">
            Strong Password Regex
          </Link>
        </div>
      </section>
    </div>
  );
}
