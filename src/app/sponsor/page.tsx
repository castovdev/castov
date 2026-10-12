import { Metadata } from "next";
import Link from "next/link";
import { 
  Heart, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  Mail, 
  ArrowRight,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumb } from "@/components/breadcrumb";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Sponsor Castov – Reach 50,000+ Software Engineers & Developers",
    description: "Partner with Castov to showcase your developer tools, cloud hosting, APIs, and infrastructure to hundreds of thousands of engineers worldwide.",
    path: "/sponsor"
  })
};

const TIERS = [
  {
    name: "Tool Banner Sponsor",
    price: "$299",
    period: "/month",
    desc: "Dedicated sticky sponsor banner on top high-traffic tools like Cron Generator, Chmod Calculator, or Diff Checker.",
    features: [
      "Exclusive sponsor slot on 1 high-traffic tool",
      "Over 40,000 targeted developer impressions/mo",
      "Custom tracking UTM link & direct brand logo",
      "DoFollow backlink from high-authority domain",
      "Monthly performance click reports"
    ],
    cta: "Claim Tool Placement",
    popular: true
  },
  {
    name: "Sitewide Footer Partner",
    price: "$499",
    period: "/month",
    desc: "Prominent brand logo and link placed in the global footer across all 600+ pages of Castov.",
    features: [
      "Persistent brand visibility across all 600+ pages",
      "Over 120,000 monthly pageviews reach",
      "Brand logo with verified sponsor badge",
      "Ideal for cloud hosts, dev tools, and SaaS APIs",
      "Priority inclusion in developer newsletters"
    ],
    cta: "Become Sitewide Partner",
    popular: false
  },
  {
    name: "Community Supporter",
    price: "$25",
    period: "/one-time",
    desc: "Buy our engineering team a coffee and support independent, 100% zero-server open developer utilities.",
    features: [
      "Supporter badge on our GitHub repository",
      "Direct support for open-source development",
      "Shoutout on our release notes and changelog",
      "Good karma from 50,000+ happy engineers"
    ],
    cta: "Support via Buy Me a Coffee",
    popular: false
  }
];

export default function SponsorPage() {
  return (
    <div className="layout-content max-w-5xl py-8 sm:py-16">
      <Breadcrumb
        path="/sponsor"
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Sponsor & Advertise" }
        ]}
      />

      {/* Header */}
      <div className="text-center mt-8 mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent mb-6">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>DEVELOPER AUDIENCE PARTNERSHIPS</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-fg mb-6">
          Put Your Brand in Front of <br />
          <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">
            50,000+ Software Engineers
          </span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
          Castov is used daily by frontend engineers, backend architects, and DevOps leads. Showcase your cloud infrastructure, databases, and APIs where engineers work.
        </p>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl bg-field border border-line mb-16 text-center">
        <div>
          <div className="text-3xl font-extrabold text-fg font-mono">100K+</div>
          <div className="text-xs text-muted mt-1">Monthly Tool Executions</div>
        </div>
        <div>
          <div className="text-3xl font-extrabold text-accent font-mono">600+</div>
          <div className="text-xs text-muted mt-1">Search-Indexed Pages</div>
        </div>
        <div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">100%</div>
          <div className="text-xs text-muted mt-1">Technical Developer Audience</div>
        </div>
        <div>
          <div className="text-3xl font-extrabold text-purple-400 font-mono">90+</div>
          <div className="text-xs text-muted mt-1">Countries Worldwide</div>
        </div>
      </div>

      {/* Pricing / Tiers Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16 items-stretch">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative ${
              tier.popular
                ? "bg-card border-2 border-accent shadow-xl shadow-accent/10 scale-[1.02]"
                : "bg-card border border-line shadow-xs hover:border-line/80"
            }`}
          >
            {tier.popular && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-accent-fg text-xs font-bold uppercase tracking-wider shadow-sm">
                Most Popular
              </span>
            )}

            <div>
              <h3 className="text-xl font-bold text-fg mb-2">{tier.name}</h3>
              <p className="text-xs text-muted mb-6 leading-relaxed min-h-[36px]">{tier.desc}</p>
              
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold text-fg font-mono">{tier.price}</span>
                <span className="text-sm text-muted">{tier.period}</span>
              </div>

              <ul className="space-y-3 mb-8 text-xs text-muted">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <a
                href={`mailto:contact@castov.com?subject=Sponsorship%20Inquiry%20-%20${encodeURIComponent(tier.name)}`}
                className={`btn w-full justify-center py-3.5 font-bold text-sm cursor-pointer ${
                  tier.popular
                    ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                    : "bg-field border border-line text-fg hover:bg-hover"
                }`}
              >
                {tier.cta} <ArrowRight className="w-4 h-4 ml-1.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Direct Contact Banner */}
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-tr from-accent/15 via-card to-card border border-accent/20 text-center">
        <h3 className="text-2xl font-bold text-fg mb-3">Custom Enterprise Partnership?</h3>
        <p className="text-muted text-sm max-w-xl mx-auto mb-6 leading-relaxed">
          Need custom newsletter sponsorships, API tool integration, or multi-month packages? Get in touch directly with our founder.
        </p>
        <a
          href="mailto:contact@castov.com?subject=Enterprise%20Sponsorship%20Castov"
          className="btn bg-fg text-bg hover:opacity-90 font-bold px-6 py-3 text-sm inline-flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          <span>Email contact@castov.com</span>
        </a>
      </div>
    </div>
  );
}
