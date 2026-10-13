"use client";

import { useState } from "react";
import { Copy, Check, Sparkles, Layers, Sliders } from "lucide-react";

export function GlassmorphismTool() {
  const [blur, setBlur] = useState(16);
  const [opacity, setOpacity] = useState(25);
  const [borderOpacity, setBorderOpacity] = useState(20);
  const [radius, setRadius] = useState(24);
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<"tailwind" | "css">("tailwind");

  const bgRgba = `rgba(255, 255, 255, ${opacity / 100})`;
  const borderRgba = `rgba(255, 255, 255, ${borderOpacity / 100})`;

  const cssCode = `/* Glassmorphism CSS */
background: ${bgRgba};
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border-radius: ${radius}px;
border: 1px solid ${borderRgba};
box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);`;

  const tailwindCode = `<!-- Tailwind CSS -->
<div className="bg-white/${opacity} backdrop-blur-[${blur}px] rounded-[${radius}px] border border-white/${borderOpacity} shadow-2xl p-6">
  <!-- Content here -->
</div>`;

  const activeCode = format === "tailwind" ? tailwindCode : cssCode;

  const copyCode = async () => {
    await navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Controls & Live Preview Grid */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Sliders Panel */}
        <div className="p-6 rounded-2xl bg-field border border-line space-y-6">
          <div className="flex items-center gap-2 text-accent font-semibold text-sm">
            <Sliders className="w-4 h-4" />
            <span>Customize Glass Effect</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-muted mb-1.5">
                <span>Blur Intensity</span>
                <span className="font-mono text-fg">{blur}px</span>
              </div>
              <input
                type="range"
                aria-label="Blur Intensity"
                min={0}
                max={40}
                value={blur}
                onChange={(e) => setBlur(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-muted mb-1.5">
                <span>Background Opacity</span>
                <span className="font-mono text-fg">{opacity}%</span>
              </div>
              <input
                type="range"
                aria-label="Background Opacity"
                min={0}
                max={80}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-muted mb-1.5">
                <span>Border Opacity</span>
                <span className="font-mono text-fg">{borderOpacity}%</span>
              </div>
              <input
                type="range"
                aria-label="Border Opacity"
                min={0}
                max={100}
                value={borderOpacity}
                onChange={(e) => setBorderOpacity(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-muted mb-1.5">
                <span>Border Radius</span>
                <span className="font-mono text-fg">{radius}px</span>
              </div>
              <input
                type="range"
                aria-label="Border Radius"
                min={0}
                max={48}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Live Visual Canvas */}
        <div className="relative rounded-2xl p-8 overflow-hidden bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 min-h-[340px] flex items-center justify-center shadow-xl">
          {/* Animated background floating shapes */}
          <div className="absolute top-4 left-4 w-28 h-28 rounded-full bg-cyan-400 blur-xl opacity-70 animate-pulse" />
          <div className="absolute bottom-6 right-8 w-36 h-36 rounded-full bg-yellow-300 blur-2xl opacity-60" />

          {/* Frosted Glass Preview Card */}
          <div
            className="relative z-10 w-full max-w-sm p-6 shadow-2xl transition-all"
            style={{
              background: bgRgba,
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              borderRadius: `${radius}px`,
              border: `1px solid ${borderRgba}`,
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/30 backdrop-blur flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-base">Glassmorphism Card</div>
                <p className="text-white/70 text-xs">Frosted Glass UI Effect</p>
              </div>
            </div>
            <p className="text-white/80 text-xs leading-relaxed mb-4">
              This card renders the exact CSS properties configured on the left in real time over a dynamic vibrant mesh gradient.
            </p>
            <div className="flex items-center justify-between text-[11px] text-white/90 border-t border-white/20 pt-3">
              <span>Blur: {blur}px</span>
              <span>Opacity: {opacity}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Code Export Box */}
      <div className="p-6 rounded-2xl bg-field border border-line space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold text-fg">Generated Code:</span>
            <div className="flex gap-1 ml-2">
              <button
                type="button"
                onClick={() => setFormat("tailwind")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer transition-colors ${
                  format === "tailwind" ? "bg-accent text-accent-fg font-bold" : "bg-bg text-muted hover:text-fg"
                }`}
              >
                Tailwind CSS
              </button>
              <button
                type="button"
                onClick={() => setFormat("css")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer transition-colors ${
                  format === "css" ? "bg-accent text-accent-fg font-bold" : "bg-bg text-muted hover:text-fg"
                }`}
              >
                Pure CSS
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={copyCode}
            className={`btn text-xs font-semibold px-4 py-2 cursor-pointer transition-all ${
              copied ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" : "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
            {copied ? "Copied!" : "Copy Code"}
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-bg border border-line font-mono text-xs text-fg overflow-x-auto leading-relaxed">
          <code>{activeCode}</code>
        </pre>
      </div>
    </div>
  );
}
