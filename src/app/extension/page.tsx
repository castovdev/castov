import { Metadata } from "next";
import Link from "next/link";
import { Download, Puzzle, Zap, ShieldCheck } from "lucide-react";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Castov Chrome Extension",
    description: "Get 100% Zero-Server Local-First Developer Utilities right in your browser.",
    path: "/extension"
  })
};

export default function ExtensionPage() {
  return (
    <div className="layout-content max-w-5xl py-12 sm:py-20">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center p-4 bg-accent/10 rounded-2xl mb-6">
          <Puzzle className="w-12 h-12 text-accent" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-fg tracking-tight mb-6">
          Castov <span className="bg-gradient-to-r from-accent to-success bg-clip-text text-transparent">Browser Extension</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto">
          Access all your favorite Zero-Server developer utilities instantly from any tab without ever leaving your workflow.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16 items-center">
        <div className="bg-card border border-line rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Install in 3 easy steps</h2>
          <ol className="space-y-4 mb-8">
            <li className="flex gap-4">
              <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold shrink-0">1</span>
              <div>
                <p className="font-semibold text-fg">Download the ZIP file</p>
                <p className="text-sm text-muted">Click the download button below to get the latest extension bundle.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold shrink-0">2</span>
              <div>
                <p className="font-semibold text-fg">Unzip & open extensions</p>
                <p className="text-sm text-muted">Extract the folder. Go to <code className="bg-bg px-1 rounded">chrome://extensions</code> in your browser and enable "Developer mode".</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold shrink-0">3</span>
              <div>
                <p className="font-semibold text-fg">Load unpacked</p>
                <p className="text-sm text-muted">Click "Load unpacked" and select the extracted <code className="bg-bg px-1 rounded">extension</code> folder.</p>
              </div>
            </li>
          </ol>
          <Link href="/castov-extension.zip" target="_blank" className="btn w-full justify-center bg-accent text-white hover:bg-accent-hover font-bold text-lg py-4">
            <Download className="w-5 h-5 mr-2" /> Download Extension ZIP
          </Link>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4 p-4 rounded-xl border border-line/50 hover:bg-hover/50 transition-colors">
            <Zap className="w-8 h-8 text-yellow-500 shrink-0" />
            <div>
              <h3 className="font-bold text-fg">Instant Access</h3>
              <p className="text-sm text-muted">Hit a keyboard shortcut to instantly open your tools over any webpage.</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 rounded-xl border border-line/50 hover:bg-hover/50 transition-colors">
            <ShieldCheck className="w-8 h-8 text-success shrink-0" />
            <div>
              <h3 className="font-bold text-fg">100% Offline Capable</h3>
              <p className="text-sm text-muted">Runs entirely in your browser using the exact same Zero-Server engines.</p>
            </div>
          </div>
        </div>
      </div>

      {/* VS Code Extension Showcase */}
      <div className="border-t border-line/60 pt-16 mt-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20 text-xs font-semibold text-accent uppercase tracking-wider">
            IDE Extension
          </span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-fg mb-4">
          Castov for <span className="text-accent">Visual Studio Code</span>
        </h2>
        <p className="text-lg text-muted max-w-2xl mb-8">
          Hover tooltips for Unix timestamps, UUID v4/v7 generation at your cursor, JWT inspection, and Base64 conversion without ever leaving your editor.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-card border border-line rounded-xl shadow-sm">
            <h3 className="font-bold text-fg mb-2">⏱️ Timestamp Hover Tooltip</h3>
            <p className="text-sm text-muted">
              Hover over any 10-digit or 13-digit number in any source file or log to view UTC, Local time, and ISO dates instantly.
            </p>
          </div>
          <div className="p-6 bg-card border border-line rounded-xl shadow-sm">
            <h3 className="font-bold text-fg mb-2">🆔 UUID v4 & v7 at Cursor</h3>
            <p className="text-sm text-muted">
              Generate random UUID v4 or chronological time-ordered UUID v7 directly inside your code with Ctrl+Shift+P.
            </p>
          </div>
          <div className="p-6 bg-card border border-line rounded-xl shadow-sm">
            <h3 className="font-bold text-fg mb-2">🔐 In-Editor JWT Inspector</h3>
            <p className="text-sm text-muted">
              Right-click any JWT token to parse header, payload claims, and token expiration status in an output channel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
