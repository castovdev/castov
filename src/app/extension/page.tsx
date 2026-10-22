import { Metadata } from "next";
import Link from "next/link";
import {
  Download,
  Terminal,
  Code2,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Shield,
  KeyRound,
  FileCode,
  ArrowRight,
  Blocks,
  Coins,
  Sparkles,
  Bot,
  History,
  TerminalSquare,
  Webhook,
  Flame,
  FileSpreadsheet,
  ExternalLink,
} from "lucide-react";
import { buildMetadata, webPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { CASTOV_EXTENSIONS } from "@/lib/extensions-data";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Castov VS Code Extensions Suite – 13 Official Developer Tools",
    description:
      "Explore the official Castov suite of 13 Visual Studio Code & Cursor extensions: Dependency Security, MCP Scanner, Token Counter, Webhook Catcher, and Offline Dev Utilities.",
    path: "/extension",
  }),
};

function getExtensionIcon(iconName: string) {
  const props = { className: "w-5 h-5 text-accent" };
  switch (iconName) {
    case "ShieldAlert":
      return <ShieldAlert {...props} className="w-5 h-5 text-rose-400" />;
    case "ShieldCheck":
      return <ShieldCheck {...props} className="w-5 h-5 text-emerald-400" />;
    case "Shield":
      return <Shield {...props} className="w-5 h-5 text-indigo-400" />;
    case "KeyRound":
      return <KeyRound {...props} className="w-5 h-5 text-amber-400" />;
    case "Coins":
      return <Coins {...props} className="w-5 h-5 text-yellow-400" />;
    case "Sparkles":
      return <Sparkles {...props} className="w-5 h-5 text-cyan-400" />;
    case "Bot":
      return <Bot {...props} className="w-5 h-5 text-purple-400" />;
    case "History":
      return <History {...props} className="w-5 h-5 text-blue-400" />;
    case "TerminalSquare":
      return <TerminalSquare {...props} className="w-5 h-5 text-teal-400" />;
    case "Webhook":
      return <Webhook {...props} className="w-5 h-5 text-emerald-400" />;
    case "Flame":
      return <Flame {...props} className="w-5 h-5 text-orange-400" />;
    case "FileSpreadsheet":
      return <FileSpreadsheet {...props} className="w-5 h-5 text-sky-400" />;
    default:
      return <Zap {...props} className="w-5 h-5 text-accent" />;
  }
}

export default function ExtensionPage() {
  const categories = [
    "Security",
    "AI & LLM",
    "Debugging & Testing",
    "Developer Productivity",
  ] as const;

  return (
    <div className="layout-content max-w-6xl py-12 sm:py-20">
      <JsonLd
        data={webPageJsonLd({
          name: "Castov VS Code Extensions Suite",
          description:
            "13 official Visual Studio Code extensions by Castov for security, MCP configs, AI tokens, and developer productivity.",
          path: "/extension",
        })}
      />

      <Breadcrumb
        path="/extension"
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Ecosystem" },
          { name: "VS Code Extensions" },
        ]}
      />

      {/* Hero Section */}
      <div className="text-center mb-16 mt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-xs font-bold text-accent mb-6 uppercase tracking-wider">
          <Code2 className="w-4 h-4" />
          <span>13 OFFICIAL VS CODE EXTENSIONS</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-fg tracking-tight mb-6">
          Castov in Your{" "}
          <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">
            Editor & Workflow
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-fg max-w-3xl mx-auto leading-relaxed">
          Level up your development environment. From supply-chain security and
          MCP debugging to LLM token cost estimation and zero-config local
          webhooks—all available on the official Visual Studio Code Marketplace.
        </p>

        {/* Top Action Pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://marketplace.visualstudio.com/publishers/Castov"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary font-bold px-6 py-3 shadow-lg shadow-accent/20 flex items-center gap-2"
          >
            <Code2 className="w-5 h-5" />
            <span>Browse Castov Publisher Profile</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
          <a
            href="https://open-vsx.org/extension/Castov/castov-vscode"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary font-bold px-5 py-3 flex items-center gap-2"
          >
            <Blocks className="w-5 h-5 text-indigo-400" />
            <span>Open VSX (Cursor &amp; Windsurf)</span>
          </a>
        </div>
      </div>

      {/* Categorized Extensions Grid */}
      <div className="space-y-16 mb-20">
        {categories.map((category) => {
          const list = CASTOV_EXTENSIONS.filter((e) => e.category === category);
          if (list.length === 0) return null;

          return (
            <section key={category} className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-border/80">
                <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                <h2 className="text-2xl font-black text-fg tracking-tight">
                  {category} Extensions
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted/20 text-muted-fg font-mono font-bold">
                  {list.length} {list.length === 1 ? "tool" : "tools"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {list.map((ext) => (
                  <div
                    key={ext.id}
                    className="card p-6 border border-border/80 hover:border-accent/60 rounded-2xl bg-card/70 flex flex-col justify-between transition-all hover:shadow-xl group"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-muted/15 border border-border/60 group-hover:scale-105 transition-transform">
                            {getExtensionIcon(ext.iconName)}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-fg group-hover:text-accent transition-colors font-mono">
                              {ext.name}
                            </h3>
                            <span className="text-[11px] font-mono text-muted-fg">
                              Castov.{ext.id}
                            </span>
                          </div>
                        </div>

                        {ext.badge && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent border border-accent/20">
                            {ext.badge}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-fg leading-relaxed mb-5">
                        {ext.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border/60">
                      {/* CLI Command */}
                      <div className="bg-bg/90 p-2.5 rounded-xl border border-border/70 flex items-center justify-between font-mono text-xs">
                        <code className="text-accent truncate select-all">
                          {ext.installCommand}
                        </code>
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center justify-between pt-1">
                        <a
                          href={ext.marketplaceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-sm"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Install on VS Code Marketplace</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>

                        <a
                          href={`https://vscode.dev/extension/Castov.${ext.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-fg hover:text-fg font-semibold transition-colors"
                        >
                          vscode.dev &rarr;
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Manual VSIX Installation & Offline Guide */}
      <section className="mb-20">
        <div className="card p-8 sm:p-10 border border-border/80 rounded-3xl bg-gradient-to-b from-card to-card/50 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-10 items-start justify-between">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 text-accent font-semibold text-xs uppercase tracking-wider">
                <Terminal className="w-4 h-4" />
                <span>OFFLINE & AIR-GAPPED ENVIRONMENTS</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
                How to Install Any Castov Extension via CLI
              </h2>
              <p className="text-muted-fg text-sm leading-relaxed">
                Whether you use standard VS Code, Cursor, Windsurf, or VSCodium,
                you can install any of the 13 extensions directly from your
                terminal:
              </p>

              <div className="p-4 rounded-xl bg-bg border border-border font-mono text-xs space-y-2 text-muted-fg">
                <div className="text-fg font-bold"># Example: Install Dependency Risk Lens</div>
                <div className="text-accent select-all">
                  code --install-extension Castov.dependency-lens-castov
                </div>
                <div className="text-fg font-bold pt-2"># Example: Install MCP Config Security Scanner</div>
                <div className="text-accent select-all">
                  code --install-extension Castov.mcp-security-castov
                </div>
              </div>
            </div>

            {/* Offline .VSIX helper */}
            <div className="w-full lg:w-96 rounded-2xl bg-bg border border-border/80 p-6 space-y-4">
              <h3 className="font-bold text-fg flex items-center gap-2 text-sm">
                <Download className="w-4 h-4 text-accent" />
                <span>Offline .VSIX Manual Installation</span>
              </h3>
              <ol className="space-y-2.5 text-xs text-muted-fg">
                <li className="flex gap-2">
                  <span className="font-bold text-accent">1.</span>
                  <span>In VS Code, press <strong className="text-fg">Ctrl+Shift+X</strong> (Extensions).</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-accent">2.</span>
                  <span>Click the three dots menu (<strong className="text-fg">...</strong>) at the top of the Extensions pane.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-accent">3.</span>
                  <span>Select <strong className="text-fg">Install from VSIX...</strong> and choose your package.</span>
                </li>
              </ol>

              <div className="pt-2">
                <a
                  href="/api/download/extension"
                  download="castov-vscode-0.1.4.vsix"
                  className="btn btn-secondary w-full justify-center text-xs font-bold py-2.5 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Castov Suite .vsix</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Guarantee Grid */}
      <div className="grid sm:grid-cols-3 gap-6 text-center">
        <div className="card p-6 rounded-2xl border border-border/70">
          <ShieldCheck className="w-6 h-6 text-accent mx-auto mb-2" />
          <h4 className="font-bold text-fg mb-1">100% Private & Local</h4>
          <p className="text-xs text-muted-fg">
            Runs purely inside your editor. Zero behavioral telemetry and zero remote payload transmission.
          </p>
        </div>
        <div className="card p-6 rounded-2xl border border-border/70">
          <Zap className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <h4 className="font-bold text-fg mb-1">Blazing Fast Execution</h4>
          <p className="text-xs text-muted-fg">
            Lightweight native TypeScript implementations optimized for sub-10ms response times.
          </p>
        </div>
        <div className="card p-6 rounded-2xl border border-border/70">
          <FileCode className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <h4 className="font-bold text-fg mb-1">MIT Open Source</h4>
          <p className="text-xs text-muted-fg">
            Freely licensed for personal, enterprise, and commercial software development.
          </p>
        </div>
      </div>
    </div>
  );
}
