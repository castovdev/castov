"use client";

import React, { useState } from "react";
import { 
  Terminal, 
  Copy, 
  Check, 
  Cpu, 
  Laptop, 
  Blocks, 
  GitBranch, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  LucideIcon
} from "lucide-react";

type PlatformId = "docker" | "homebrew" | "openvsx" | "github-action";

interface PlatformConfig {
  id: PlatformId;
  name: string;
  badge: string;
  icon: LucideIcon;
  description: string;
  command: string;
  docLink?: string;
  features: string[];
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "docker",
    name: "Docker Hub",
    badge: "Official Container",
    icon: Cpu,
    description: "Run Castov CLI and MCP runtime in an isolated, non-root Alpine container with zero host dependencies.",
    command: "docker run --rm -it castovdev/castov:latest --help",
    docLink: "https://hub.docker.com/r/castovdev/castov",
    features: [
      "Lightweight Alpine runtime (~50MB footprint)",
      "Strict non-root user execution (USER node)",
      "Direct MCP transport streaming via stdin/stdout"
    ]
  },
  {
    id: "homebrew",
    name: "Homebrew Tap",
    badge: "macOS & Linux",
    icon: Laptop,
    description: "Install Castov as a native, globally executable binary managed via your system package manager.",
    command: "brew tap castovdev/castov && brew install castov",
    docLink: "https://github.com/castovdev/homebrew-castov",
    features: [
      "Native Apple Silicon (ARM64) & Intel support",
      "Automatic symlinking to system $PATH",
      "One-command version updates with brew upgrade"
    ]
  },
  {
    id: "openvsx",
    name: "Open VSX & VS Code",
    badge: "Cursor & Windsurf",
    icon: Blocks,
    description: "Official extension for VS Code, Cursor, Windsurf, and VSCodium with live timestamp hover and UUID injection.",
    command: "ext install Castov.castov-vscode",
    docLink: "https://open-vsx.org/extension/Castov/castov-vscode",
    features: [
      "Available on Open VSX Registry & VS Marketplace",
      "Interactive Timestamp Hover Tooltips in logs/JSON",
      "Zero telemetry, 100% offline client-side execution"
    ]
  },
  {
    id: "github-action",
    name: "GitHub Action",
    badge: "CI/CD Marketplace",
    icon: GitBranch,
    description: "Execute MCP verification flows, secret scans, and CIDR checks automatically inside your CI/CD pipelines.",
    command: "- name: Run Castov MCP Security Scan\n  uses: castovdev/castov@v1.4.0\n  with:\n    path: '.'\n    fail-on-secrets: 'true'",
    docLink: "https://github.com/marketplace/actions/castov-security-secret-scanner",
    features: [
      "Composite Action with cached Node.js 20 environment",
      "Instant PR failure on leaked API secrets or corrupt CIDR",
      "Official GitHub Marketplace certified"
    ]
  }
];

export function InstallationDistributionSection() {
  const [activePlatform, setActivePlatform] = useState<PlatformId>("docker");
  const [copied, setCopied] = useState<string | null>(null);

  const activeConfig = PLATFORMS.find((p) => p.id === activePlatform)!;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section className="py-16 sm:py-24 border-t border-line/60 bg-bg/50">
      <div className="layout-content max-w-5xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent mb-4">
            <Terminal className="w-3.5 h-3.5" />
            <span>GLOBAL DISTRIBUTION &amp; MCP ECOSYSTEM</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
            Deploy Castov <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">Everywhere You Build</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted leading-relaxed">
            Whether inside your local terminal, Docker containers, AI editors, or automated CI/CD pipelines — Castov provides the instant execution layer for developers and MCP AI agents.
          </p>
        </div>

        {/* Platform Selection Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-1.5 rounded-2xl bg-field border border-line mb-8">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const isActive = activePlatform === platform.id;
            return (
              <button
                key={platform.id}
                onClick={() => setActivePlatform(platform.id)}
                className={`flex items-center justify-center gap-2.5 py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-card text-accent shadow-sm border border-line/80"
                    : "text-muted hover:text-fg hover:bg-hover/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-accent" : "text-muted"}`} />
                <span>{platform.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Platform Card */}
        <div className="rounded-2xl border border-line bg-card overflow-hidden shadow-xl">
          {/* Top Bar */}
          <div className="p-6 sm:p-8 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                  {activeConfig.badge}
                </span>
                <span className="text-xs text-muted flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified Distribution
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-fg">
                {activeConfig.name}
              </h3>
              <p className="text-sm text-muted mt-1 max-w-xl">
                {activeConfig.description}
              </p>
            </div>

            {activeConfig.docLink && (
              <a
                href={activeConfig.docLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition-colors self-start md:self-center"
              >
                <span>Official Registry</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Terminal / Code Snippet Area */}
          <div className="p-6 sm:p-8 bg-field/80">
            <div className="rounded-xl border border-white/10 bg-[#0b101b] p-4 sm:p-5 font-mono text-sm relative group shadow-inner">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-3 mb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  <span className="ml-2 font-mono text-[11px] text-slate-300">terminal execution</span>
                </div>
                <button
                  onClick={() => handleCopy(activeConfig.command)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
                  aria-label="Copy command"
                >
                  {copied === activeConfig.command ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Command Presentation — Explicit bright color on dark terminal background */}
              <pre className="text-[#f8fafc] whitespace-pre-wrap leading-relaxed overflow-x-auto text-xs sm:text-sm font-medium selection:bg-blue-500/30">
                <code className="text-emerald-300">{activeConfig.command}</code>
              </pre>
            </div>

            {/* Features Checklist */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-line/60">
              {activeConfig.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-muted">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
