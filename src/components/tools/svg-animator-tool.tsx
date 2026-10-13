"use client";

import React, { useState } from "react";
import { Copy, Check, Play, Pause, RefreshCw, Code, Sparkles, Layers } from "lucide-react";

type AnimationPreset = "stroke-draw" | "pulse-glow" | "morph-spin" | "float-shadow";

const SAMPLE_SVGS: { name: string; svg: string }[] = [
  {
    name: "Geometric Logo",
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="50 15, 85 80, 15 80" />
  <circle cx="50" cy="55" r="18" />
  <line x1="50" y1="15" x2="50" y2="37" />
</svg>`,
  },
  {
    name: "Heart Icon",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
</svg>`,
  },
  {
    name: "Lightning Bolt",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
</svg>`,
  },
];

export function SvgKeyframeAnimatorTool() {
  const [svgCode, setSvgCode] = useState(SAMPLE_SVGS[0].svg);
  const [preset, setPreset] = useState<AnimationPreset>("stroke-draw");
  const [duration, setDuration] = useState(2.5);
  const [strokeColor, setStrokeColor] = useState("#2563eb");
  const [isPlaying, setIsPlaying] = useState(true);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const getCssKeyframes = () => {
    switch (preset) {
      case "stroke-draw":
        return `@keyframes svgDraw {
  0% {
    stroke-dasharray: 400;
    stroke-dashoffset: 400;
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    stroke-dasharray: 400;
    stroke-dashoffset: 0;
    opacity: 1;
  }
}

.animated-svg path,
.animated-svg polygon,
.animated-svg circle,
.animated-svg line {
  stroke: ${strokeColor};
  animation: svgDraw ${duration}s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
}`;
      case "pulse-glow":
        return `@keyframes pulseGlow {
  0%, 100% {
    filter: drop-shadow(0 0 2px ${strokeColor});
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 0 16px ${strokeColor});
    transform: scale(1.08);
  }
}

.animated-svg {
  animation: pulseGlow ${duration}s ease-in-out infinite;
  transform-origin: center;
}`;
      case "morph-spin":
        return `@keyframes morphSpin {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.1);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

.animated-svg {
  animation: morphSpin ${duration}s linear infinite;
  transform-origin: center;
}`;
      case "float-shadow":
        return `@keyframes floatShadow {
  0%, 100% {
    transform: translateY(0px);
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
  }
  50% {
    transform: translateY(-12px);
    filter: drop-shadow(0 16px 12px rgba(0,0,0,0.25));
  }
}

.animated-svg {
  animation: floatShadow ${duration}s ease-in-out infinite;
}`;
    }
  };

  const getFramerMotionCode = () => {
    return `// Framer Motion React Component
import { motion } from "framer-motion";

export function AnimatedIcon() {
  return (
    <motion.div
      animate={{
        scale: [1, 1.08, 1],
        filter: ["drop-shadow(0 0 2px ${strokeColor})", "drop-shadow(0 0 16px ${strokeColor})", "drop-shadow(0 0 2px ${strokeColor})"]
      }}
      transition={{
        duration: ${duration},
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="w-24 h-24"
    >
      ${svgCode.replace(/\n/g, "\n      ")}
    </motion.div>
  );
}`;
  };

  const copyToClipboard = (content: string, format: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-field border border-line">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-muted">Animation Mode:</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPreset("stroke-draw")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                preset === "stroke-draw"
                  ? "bg-[#2563eb] text-white shadow-sm"
                  : "bg-bg text-muted border border-line hover:text-fg"
              }`}
            >
              Stroke Draw
            </button>
            <button
              type="button"
              onClick={() => setPreset("pulse-glow")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                preset === "pulse-glow"
                  ? "bg-[#2563eb] text-white shadow-sm"
                  : "bg-bg text-muted border border-line hover:text-fg"
              }`}
            >
              Pulse Glow
            </button>
            <button
              type="button"
              onClick={() => setPreset("morph-spin")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                preset === "morph-spin"
                  ? "bg-[#2563eb] text-white shadow-sm"
                  : "bg-bg text-muted border border-line hover:text-fg"
              }`}
            >
              Morph Spin
            </button>
            <button
              type="button"
              onClick={() => setPreset("float-shadow")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                preset === "float-shadow"
                  ? "bg-[#2563eb] text-white shadow-sm"
                  : "bg-bg text-muted border border-line hover:text-fg"
              }`}
            >
              Float & Hover
            </button>
          </div>

          <div className="h-4 w-[1px] bg-line hidden sm:block mx-1" />

          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Stroke Color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-7 h-7 rounded bg-transparent border border-line cursor-pointer"
            />
            <span className="text-xs font-mono text-muted">{strokeColor}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="btn bg-bg border border-line text-muted hover:text-fg text-xs font-semibold px-3 py-1.5 cursor-pointer flex items-center gap-1.5"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? "Pause Animation" : "Play Animation"}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left SVG Editor */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-2xl bg-field border border-line space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Input SVG Code</h2>
              <div className="flex gap-2">
                {SAMPLE_SVGS.map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => setSvgCode(sample.svg)}
                    className="text-[11px] text-accent hover:underline cursor-pointer"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              aria-label="Raw SVG Code"
              value={svgCode}
              onChange={(e) => setSvgCode(e.target.value)}
              rows={10}
              className="w-full p-4 font-mono text-xs leading-relaxed rounded-xl bg-bg border border-line text-fg focus:outline-none focus:ring-2 focus:ring-accent/40 resize-y"
              placeholder="Paste your raw SVG code here..."
            />

            <div>
              <div className="flex justify-between text-xs text-muted mb-1.5">
                <span>Cycle Duration</span>
                <span className="font-mono text-fg">{duration}s</span>
              </div>
              <input
                type="range"
                aria-label="Cycle Duration"
                min="0.5"
                max="6"
                step="0.1"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
            </div>
          </div>

          {/* Export Code Options */}
          <div className="p-6 rounded-2xl bg-field border border-line space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Export Animation</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(getCssKeyframes(), "css")}
                  className="btn bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-bold px-3 py-1 cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  {copiedFormat === "css" ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                  {copiedFormat === "css" ? "Copied CSS!" : "Copy CSS"}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(getFramerMotionCode(), "framer")}
                  className="btn bg-bg border border-line text-muted hover:text-fg text-xs font-semibold px-3 py-1 cursor-pointer flex items-center gap-1"
                >
                  {copiedFormat === "framer" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  Framer Motion
                </button>
              </div>
            </div>

            <pre className="p-3 bg-bg border border-line rounded-xl text-[11px] font-mono text-fg leading-relaxed overflow-x-auto select-all max-h-[160px]">
              {getCssKeyframes()}
            </pre>
          </div>
        </div>

        {/* Right Live Stage */}
        <div className="lg:col-span-7 flex flex-col space-y-2">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            Cinematic Preview Stage
          </label>

          <div className="w-full min-h-[460px] rounded-2xl bg-field border border-line flex items-center justify-center p-12 relative overflow-hidden">
            {/* Inject dynamic CSS animation */}
            <style dangerouslySetInnerHTML={{ __html: isPlaying ? getCssKeyframes() : "" }} />

            <div
              className="w-48 h-48 animated-svg flex items-center justify-center transition-all"
              style={{ color: strokeColor }}
              dangerouslySetInnerHTML={{ __html: svgCode }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
