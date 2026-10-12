import { Metadata } from "next";
import Link from "next/link";
import { 
  Download, 
  Terminal, 
  CheckCircle2, 
  Code2, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Key, 
  Fingerprint, 
  FileCode,
  ArrowRight
} from "lucide-react";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Castov Extensions – VS Code & Browser Utilities",
    description: "Download Castov for Visual Studio Code and Chrome. Offline-first Unix timestamp inspection, UUID v4/v7, and JWT debugging in your workflow.",
    path: "/extension"
  })
};

export default function ExtensionPage() {
  return (
    <div className="layout-content max-w-5xl py-12 sm:py-20">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent mb-6">
          <Zap className="w-3.5 h-3.5" />
          <span>OFFLINE-FIRST DEVELOPER SUITE</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-fg tracking-tight mb-6">
          Castov in Your <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">Editor & Browser</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
          Bring the speed of Castov directly into Visual Studio Code and your browser. Inspect timestamps, generate UUIDs, and decode JWTs without leaving your code.
        </p>

        {/* Quick Download CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="/api/download/extension"
            download="castov-vscode-0.1.0.vsix"
            className="btn bg-accent text-white hover:bg-accent-hover font-bold text-base px-6 py-3.5 shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            <span>Download VS Code (.vsix)</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono">v0.1.0</span>
          </a>
          <a
            href="/castov-extension.zip"
            download="castov-extension.zip"
            className="btn bg-field border border-line text-fg hover:bg-hover font-semibold text-base px-6 py-3.5 transition-all flex items-center gap-2"
          >
            <Download className="w-5 h-5 text-muted" />
            <span>Download Browser Extension (.zip)</span>
          </a>
        </div>
      </div>

      {/* VS Code Extension Primary Showcase */}
      <section className="mb-20">
        <div className="rounded-3xl border border-line bg-card p-8 sm:p-12 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-12 items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-accent font-semibold text-sm mb-3">
                <Code2 className="w-4 h-4" />
                <span>PRIMARY EXTENSION</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight mb-4">
                Castov for Visual Studio Code
              </h2>
              <p className="text-muted leading-relaxed mb-8">
                Designed for high-velocity software engineering. Eliminates browser tab juggling by handling timestamps, cryptographic identifiers, and token inspection right inside your workspace.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-fg">Automatic Timestamp Hover</h3>
                    <p className="text-sm text-muted">Hover over any 10 or 13-digit number to instantly view UTC, ISO, and Local time.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Fingerprint className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-fg">UUID v4 & Time-Ordered UUID v7</h3>
                    <p className="text-sm text-muted">Generate secure random v4 or database-optimized chronological v7 directly at your cursor.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-fg">In-Editor JWT Inspector</h3>
                    <p className="text-sm text-muted">Right-click any token to view decoded Header, Payload, and expiration status in seconds.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-field border border-line">
                <div className="flex items-center justify-between text-xs font-mono text-muted mb-2">
                  <span>INSTALL VIA TERMINAL (CLI)</span>
                </div>
                <div className="flex items-center justify-between bg-bg p-3 rounded-lg border border-line font-mono text-xs text-accent">
                  <code>code --install-extension castov-vscode-0.1.0.vsix</code>
                </div>
              </div>
            </div>

            {/* Visual Installation Card */}
            <div className="w-full lg:w-96 rounded-2xl bg-field border border-line p-6">
              <h3 className="font-bold text-fg mb-4 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-accent" />
                <span>How to Install .vsix in VS Code</span>
              </h3>
              <ol className="space-y-3 text-sm text-muted">
                <li className="flex gap-2">
                  <span className="font-bold text-accent">1.</span>
                  <span>Download the <strong className="text-fg">castov-vscode-0.1.0.vsix</strong> file above.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-accent">2.</span>
                  <span>Open VS Code and press <strong className="text-fg">Ctrl+Shift+X</strong> (Extensions view).</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-accent">3.</span>
                  <span>Click the three dots (<strong className="text-fg">...</strong>) at the top of the Extensions pane.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-accent">4.</span>
                  <span>Select <strong className="text-fg">Install from VSIX...</strong> and choose the downloaded file.</span>
                </li>
              </ol>

              <div className="mt-6 pt-6 border-t border-line">
                <a
                  href="/api/download/extension"
                  download="castov-vscode-0.1.0.vsix"
                  className="btn w-full justify-center bg-accent text-white hover:bg-accent-hover font-semibold py-3"
                >
                  <Download className="w-4 h-4 mr-2" /> Download .vsix File
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chrome / Browser Extension Section */}
      <section className="mb-20">
        <div className="rounded-3xl border border-line bg-card p-8 sm:p-12 shadow-sm">
          <div className="max-w-2xl mb-8">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-3">
              <ShieldCheck className="w-4 h-4" />
              <span>BROWSER POPUP COMPANION</span>
            </div>
            <h2 className="text-3xl font-extrabold text-fg tracking-tight mb-4">
              Castov for Chrome & Edge
            </h2>
            <p className="text-muted leading-relaxed">
              Open your developer utilities with a single click or keyboard shortcut from any browser tab, even when offline.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-5 rounded-2xl bg-field border border-line">
              <span className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs mb-3">1</span>
              <h3 className="font-semibold text-fg mb-1">Download ZIP</h3>
              <p className="text-xs text-muted">Download and unzip the pre-bundled extension folder on your computer.</p>
            </div>

            <div className="p-5 rounded-2xl bg-field border border-line">
              <span className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs mb-3">2</span>
              <h3 className="font-semibold text-fg mb-1">Enable Dev Mode</h3>
              <p className="text-xs text-muted">Navigate to <code className="bg-bg px-1 rounded">chrome://extensions</code> and toggle Developer Mode on.</p>
            </div>

            <div className="p-5 rounded-2xl bg-field border border-line">
              <span className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs mb-3">3</span>
              <h3 className="font-semibold text-fg mb-1">Load Unpacked</h3>
              <p className="text-xs text-muted">Click "Load unpacked" and select the unzipped Castov extension directory.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="/castov-extension.zip"
              download="castov-extension.zip"
              className="btn bg-fg text-bg hover:opacity-90 font-semibold px-6 py-3"
            >
              <Download className="w-4 h-4 mr-2" /> Download Extension ZIP
            </a>
            <Link href="/tools" className="btn bg-field border border-line text-muted hover:text-fg font-medium px-5 py-3">
              Explore All 55+ Online Tools <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Guarantee Grid */}
      <div className="grid sm:grid-cols-3 gap-6 text-center">
        <div className="p-6 rounded-2xl bg-field/50 border border-line/60">
          <ShieldCheck className="w-6 h-6 text-accent mx-auto mb-2" />
          <h4 className="font-bold text-fg mb-1">100% Private</h4>
          <p className="text-xs text-muted">Runs purely client-side. Zero telemetry and zero remote data transmission.</p>
        </div>
        <div className="p-6 rounded-2xl bg-field/50 border border-line/60">
          <Zap className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <h4 className="font-bold text-fg mb-1">Sub-10ms Speed</h4>
          <p className="text-xs text-muted">Lightweight native execution with zero third-party dependencies.</p>
        </div>
        <div className="p-6 rounded-2xl bg-field/50 border border-line/60">
          <FileCode className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <h4 className="font-bold text-fg mb-1">MIT Open Source</h4>
          <p className="text-xs text-muted">Permissive open source license for personal, educational, and commercial work.</p>
        </div>
      </div>
    </div>
  );
}
