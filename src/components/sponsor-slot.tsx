import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, ArrowUpRight, Lock } from "lucide-react";

interface SponsorSlotProps {
  context?: "mcp" | "network" | "devops" | "general";
}

export function SponsorSlot({ context = "general" }: SponsorSlotProps) {
  const contextualCopy = {
    mcp: {
      badge: "AI & MCP ECOSYSTEM PARTNER",
      headline: "Building an AI Coding Tool, Cloud Database, or MCP Server?",
      subtext:
        "Put your developer product in front of 100,000+ software engineers, DevOps architects, and AI builders using Castov every month.",
    },
    network: {
      badge: "CLOUD & INFRASTRUCTURE PARTNER",
      headline: "Deploying High-Availability Cloud Servers, VPCs, or Managed Databases?",
      subtext:
        "Reach backend engineers and SREs actively debugging ports, CIDR subnets, and production infrastructure.",
    },
    devops: {
      badge: "DEVSECOPS & CI/CD PARTNER",
      headline: "Need Zero-Knowledge .env Secret Sync Across Your Engineering Team?",
      subtext:
        "Explore Castov Env Vault for client-side AES-256-GCM encrypted environment sharing, or sponsor this engineering hub.",
    },
    general: {
      badge: "FEATURED DEVELOPER ECOSYSTEM",
      headline: "Reach 100,000+ High-Intent Software Engineers & DevSecOps Teams",
      subtext:
        "Showcase your API, cloud hosting, or developer tool across 1,000+ search-indexed engineering utilities on Castov.",
    },
  }[context];

  return (
    <div className="my-8 rounded-2xl border border-accent/25 bg-gradient-to-r from-accent/10 via-card to-emerald-500/10 p-5 sm:p-6 shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono font-bold text-accent uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{contextualCopy.badge}</span>
            <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              2 Slots Open
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-fg">
            {contextualCopy.headline}
          </h3>
          <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
            {contextualCopy.subtext}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/env-vault"
            className="btn bg-card border border-line text-fg hover:border-emerald-500/50 text-xs font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Try Team Env Vault</span>
          </Link>
          <Link
            href="/sponsor"
            className="btn bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sponsor Castov</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
