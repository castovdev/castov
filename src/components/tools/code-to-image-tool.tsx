"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Download, Check, Sparkles, Image as ImageIcon } from "lucide-react";

const THEMES = [
  { id: "midnight", name: "Midnight Glow", bg: "from-blue-600 via-indigo-600 to-purple-800" },
  { id: "cyberpunk", name: "Neon Cyberpunk", bg: "from-pink-500 via-purple-600 to-cyan-500" },
  { id: "sunset", name: "Hyper Sunset", bg: "from-amber-500 via-rose-600 to-purple-700" },
  { id: "emerald", name: "Matrix Emerald", bg: "from-emerald-500 via-teal-700 to-slate-900" },
  { id: "carbon", name: "Pure Carbon", bg: "from-zinc-900 via-neutral-900 to-black" },
];

const DEFAULT_CODE = `// Castov High-Performance Utility
async function fetchSecureClaims(token: string) {
  const [header, payload] = token.split('.');
  const decoded = JSON.parse(atob(payload));
  
  if (decoded.exp * 1000 < Date.now()) {
    throw new Error("Token expired!");
  }
  return { user: decoded.sub, valid: true };
}`;

export function CodeToImageTool() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [title, setTitle] = useState("auth.ts");
  const [theme, setTheme] = useState(THEMES[0]);
  const [padding, setPadding] = useState(32);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawToCanvas = (): HTMLCanvasElement | null => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const lines = code.split("\n");
    const lineHeight = 22;
    const fontSize = 14;
    const font = "14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

    ctx.font = font;
    let maxLineWidth = 0;
    lines.forEach((l) => {
      const w = ctx.measureText(l).width;
      if (w > maxLineWidth) maxLineWidth = w;
    });

    const windowWidth = Math.max(480, maxLineWidth + 64);
    const windowHeaderHeight = 44;
    const windowBodyHeight = lines.length * lineHeight + 36;
    const windowHeight = windowHeaderHeight + windowBodyHeight;

    const totalWidth = windowWidth + padding * 2;
    const totalHeight = windowHeight + padding * 2;

    canvas.width = totalWidth * 2; // Retina scale 2x
    canvas.height = totalHeight * 2;
    ctx.scale(2, 2);

    // 1. Draw gradient background
    const grad = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
    if (theme.id === "midnight") {
      grad.addColorStop(0, "#2563eb");
      grad.addColorStop(0.5, "#4f46e5");
      grad.addColorStop(1, "#581c87");
    } else if (theme.id === "cyberpunk") {
      grad.addColorStop(0, "#ec4899");
      grad.addColorStop(0.5, "#9333ea");
      grad.addColorStop(1, "#06b6d4");
    } else if (theme.id === "sunset") {
      grad.addColorStop(0, "#f59e0b");
      grad.addColorStop(0.5, "#e11d48");
      grad.addColorStop(1, "#6b21a8");
    } else if (theme.id === "emerald") {
      grad.addColorStop(0, "#10b981");
      grad.addColorStop(0.5, "#0f766e");
      grad.addColorStop(1, "#0f172a");
    } else {
      grad.addColorStop(0, "#18181b");
      grad.addColorStop(0.5, "#171717");
      grad.addColorStop(1, "#000000");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // 2. Draw Code Window with soft shadow & rounded corners
    const winX = padding;
    const winY = padding;
    const radius = 12;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = "#0c0d12";

    ctx.beginPath();
    ctx.roundRect(winX, winY, windowWidth, windowHeight, radius);
    ctx.fill();
    ctx.restore();

    // Border around code window
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(winX, winY, windowWidth, windowHeight, radius);
    ctx.stroke();

    // 3. Draw Mac-style Window Controls
    const dotY = winY + 22;
    ctx.fillStyle = "#ff5f56";
    ctx.beginPath();
    ctx.arc(winX + 20, dotY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffbd2e";
    ctx.beginPath();
    ctx.arc(winX + 38, dotY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#27c93f";
    ctx.beginPath();
    ctx.arc(winX + 56, dotY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Window Title
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.font = "12px ui-monospace, SFMono-Regular, monospace";
    ctx.textAlign = "center";
    ctx.fillText(title || "untitled", winX + windowWidth / 2, dotY + 4);

    // 4. Draw Code Lines
    ctx.textAlign = "left";
    ctx.font = font;

    lines.forEach((line, idx) => {
      const lineY = winY + windowHeaderHeight + 20 + idx * lineHeight;

      if (line.trim().startsWith("//")) {
        ctx.fillStyle = "#6b7280"; // Comment
      } else if (/\b(async|function|const|let|var|return|if|throw|new)\b/.test(line)) {
        ctx.fillStyle = "#93c5fd"; // Keywords highlight
      } else if (/\b(string|number|boolean)\b/.test(line)) {
        ctx.fillStyle = "#fbcfe8"; // Types
      } else {
        ctx.fillStyle = "#f3f4f6"; // Standard code
      }

      ctx.fillText(line, winX + 24, lineY);
    });

    // 5. Watermark badge: castov.com
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("castov.com", totalWidth - padding - 8, totalHeight - padding / 2 + 4);

    return canvas;
  };

  const handleDownload = () => {
    setDownloading(true);
    try {
      const canvas = drawToCanvas();
      if (!canvas) return;
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${title.replace(/\.[^/.]+$/, "") || "code"}-castov.png`;
      a.click();
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyImage = async () => {
    try {
      const canvas = drawToCanvas();
      if (!canvas) return;
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch {
      handleDownload();
    }
  };

  return (
    <div className="space-y-8">
      {/* Configuration Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-field border border-line">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-muted">Theme:</label>
          <div className="flex items-center gap-1.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t)}
                className={`w-7 h-7 rounded-full bg-gradient-to-tr ${t.bg} border-2 transition-transform cursor-pointer ${
                  theme.id === t.id ? "scale-110 border-white shadow-md ring-2 ring-accent" : "border-transparent opacity-80 hover:opacity-100"
                }`}
                title={t.name}
                aria-label={`Select ${t.name} theme`}
              />
            ))}
          </div>

          <div className="h-4 w-[1px] bg-line hidden sm:block mx-1" />

          <label className="text-xs font-semibold text-muted">File Title:</label>
          <input
            type="text"
            aria-label="File Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-2.5 py-1 text-xs font-mono rounded-md bg-bg border border-line text-fg max-w-[140px]"
            placeholder="script.ts"
          />

          <label className="text-xs font-semibold text-muted ml-2">Padding:</label>
          <select
            aria-label="Padding"
            value={padding}
            onChange={(e) => setPadding(Number(e.target.value))}
            className="px-2.5 py-1 text-xs rounded-md bg-bg border border-line text-fg"
          >
            <option value={16}>Compact (16px)</option>
            <option value={32}>Default (32px)</option>
            <option value={48}>Large (48px)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyImage}
            className={`btn text-xs font-semibold px-3 py-1.5 cursor-pointer ${
              copied ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" : "bg-bg border border-line text-muted hover:text-fg"
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
            {copied ? "Image Copied!" : "Copy Image"}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="btn bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-bold px-4 py-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {downloading ? "Exporting..." : "Download PNG"}
          </button>
        </div>
      </div>

      {/* Interactive Code Editor & Live Preview */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Paste Your Code
          </label>
          <textarea
            aria-label="Paste Your Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={14}
            className="w-full p-4 font-mono text-xs leading-relaxed rounded-2xl bg-field border border-line text-fg focus:outline-none focus:ring-2 focus:ring-accent/40 resize-y"
            placeholder="Paste code snippet here..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-accent" />
            Live Preview
          </label>
          
          <div
            className={`rounded-2xl p-6 bg-gradient-to-tr ${theme.bg} shadow-xl flex items-center justify-center transition-all`}
            style={{ padding: `${padding}px` }}
          >
            <div className="w-full rounded-xl bg-[#0c0d12] border border-white/10 shadow-2xl overflow-hidden font-mono text-xs">
              {/* Window Header */}
              <div className="flex items-center px-4 py-3 border-b border-white/10 bg-[#0c0d12]/60 backdrop-blur">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex-1 text-center text-[11px] text-white/50 truncate px-2">
                  {title || "untitled"}
                </div>
              </div>

              {/* Window Body */}
              <div className="p-4 overflow-x-auto text-white/90 space-y-1">
                {code.split("\n").map((line, idx) => (
                  <div key={idx} className="whitespace-pre">
                    {line.trim().startsWith("//") ? (
                      <span className="text-zinc-500">{line}</span>
                    ) : (
                      <span>{line}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Watermark in Preview */}
              <div className="px-4 py-2 border-t border-white/5 text-right text-[10px] text-white/30">
                castov.com
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
