"use client";

import React, { useState, useRef } from "react";
import { Download, Copy, Check, Upload, Smartphone, Laptop, Monitor, Sparkles } from "lucide-react";

type DeviceType = "iphone" | "macbook" | "browser";

const GRADIENTS = [
  { name: "Cosmic Purple", bg: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)" },
  { name: "Cyberpunk Glow", bg: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #9333ea 100%)" },
  { name: "Sunset Horizon", bg: "linear-gradient(135deg, #f97316 0%, #ef4444 50%, #ec4899 100%)" },
  { name: "Emerald Forest", bg: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)" },
  { name: "Obsidian Dark", bg: "linear-gradient(135deg, #18181b 0%, #09090b 100%)" },
];

export function AppMockupTool() {
  const [device, setDevice] = useState<DeviceType>("browser");
  const [gradient, setGradient] = useState(GRADIENTS[0].bg);
  const [padding, setPadding] = useState(48);
  const [shadow, setShadow] = useState(true);
  const [watermark, setWatermark] = useState(true);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1200;
    const height = 800;
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    // Render gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (gradient.includes("#6366f1")) {
      grad.addColorStop(0, "#6366f1");
      grad.addColorStop(0.5, "#a855f7");
      grad.addColorStop(1, "#ec4899");
    } else if (gradient.includes("#06b6d4")) {
      grad.addColorStop(0, "#06b6d4");
      grad.addColorStop(0.5, "#3b82f6");
      grad.addColorStop(1, "#9333ea");
    } else if (gradient.includes("#f97316")) {
      grad.addColorStop(0, "#f97316");
      grad.addColorStop(0.5, "#ef4444");
      grad.addColorStop(1, "#ec4899");
    } else if (gradient.includes("#10b981")) {
      grad.addColorStop(0, "#10b981");
      grad.addColorStop(1, "#047857");
    } else {
      grad.addColorStop(0, "#18181b");
      grad.addColorStop(1, "#09090b");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Frame Mockup
    const frameX = padding;
    const frameY = padding;
    const frameW = width - padding * 2;
    const frameH = height - padding * 2;

    if (shadow) {
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 35;
      ctx.shadowOffsetY = 15;
    }

    ctx.fillStyle = "#09090b";
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameW, frameH, 16);
    ctx.fill();
    ctx.shadowColor = "transparent";

    // Header dots for browser/mac
    if (device === "browser" || device === "macbook") {
      ctx.fillStyle = "#18181b";
      ctx.beginPath();
      ctx.roundRect(frameX, frameY, frameW, 40, [16, 16, 0, 0]);
      ctx.fill();

      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(frameX + 24, frameY + 20, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#eab308";
      ctx.beginPath();
      ctx.arc(frameX + 44, frameY + 20, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(frameX + 64, frameY + 20, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (imageSrc) {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        const topOffset = device === "iphone" ? 0 : 40;
        ctx.drawImage(img, frameX, frameY + topOffset, frameW, frameH - topOffset);

        if (watermark) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
          ctx.font = "12px sans-serif";
          ctx.fillText("castov.com/app-mockup", width - 180, height - 20);
        }

        const a = document.createElement("a");
        a.download = `castov-mockup-${Date.now()}.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
        setDownloading(false);
      };
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Upload your screenshot to generate", width / 2, height / 2);

      if (watermark) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = "12px sans-serif";
        ctx.fillText("castov.com/app-mockup", width - 180, height - 20);
      }

      const a = document.createElement("a");
      a.download = `castov-mockup-${Date.now()}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      setDownloading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            Device & Screenshot Mockup Studio
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Turn ordinary app screenshots into viral, high-converting product mockups for Twitter, Product Hunt & stores.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition border border-zinc-700"
          >
            <Upload className="w-4 h-4" /> Upload Screenshot
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> {downloading ? "Rendering..." : "Export High-Res PNG"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-5">
          {/* Device Selector */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Device Frame</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setDevice("browser")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                  device === "browser"
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                    : "bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <Monitor className="w-5 h-5" /> Browser
              </button>
              <button
                onClick={() => setDevice("macbook")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                  device === "macbook"
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                    : "bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <Laptop className="w-5 h-5" /> Laptop
              </button>
              <button
                onClick={() => setDevice("iphone")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                  device === "iphone"
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                    : "bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <Smartphone className="w-5 h-5" /> Phone
              </button>
            </div>
          </div>

          {/* Gradients */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Background Atmosphere</h3>
            <div className="grid grid-cols-2 gap-2">
              {GRADIENTS.map((g) => (
                <button
                  key={g.name}
                  onClick={() => setGradient(g.bg)}
                  className={`p-2.5 rounded-xl border text-xs text-left font-medium transition flex items-center gap-2 ${
                    gradient === g.bg ? "border-indigo-400 text-white" : "border-zinc-800 text-zinc-400"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full border border-white/20" style={{ background: g.bg }} />
                  <span className="truncate">{g.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Spacing & Options */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Frame Layout</h3>
            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>Canvas Padding</span>
                <span>{padding}px</span>
              </div>
              <input
                type="range"
                min="24"
                max="96"
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shadow}
                  onChange={(e) => setShadow(e.target.checked)}
                  className="rounded border-zinc-700 text-indigo-600 focus:ring-0"
                />
                Realistic 3D Drop Shadow
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={watermark}
                  onChange={(e) => setWatermark(e.target.checked)}
                  className="rounded border-zinc-700 text-indigo-600 focus:ring-0"
                />
                Castov Badge
              </label>
            </div>
          </div>
        </div>

        {/* Live Canvas Mockup Canvas */}
        <div className="lg:col-span-8 flex flex-col">
          <div
            ref={previewRef}
            className="w-full flex-1 min-h-[500px] rounded-2xl flex items-center justify-center p-8 transition-all overflow-hidden relative"
            style={{ background: gradient }}
          >
            {/* The Mockup Box */}
            <div
              className={`w-full max-w-2xl bg-zinc-950 rounded-2xl overflow-hidden transition-all ${
                shadow ? "shadow-2xl shadow-black/60 border border-zinc-800/80" : ""
              }`}
              style={{
                padding: device === "iphone" ? "0" : "",
              }}
            >
              {/* Header Chrome */}
              {device !== "iphone" && (
                <div className="h-9 bg-zinc-900/90 border-b border-zinc-800/80 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {device === "browser" ? "https://your-app.com" : "Terminal / Preview"}
                  </div>
                  <div className="w-10" />
                </div>
              )}

              {/* Mockup Content Area */}
              <div className="min-h-[320px] bg-zinc-950 flex items-center justify-center relative">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="App Preview"
                    className="w-full h-auto max-h-[480px] object-cover"
                  />
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 text-center cursor-pointer hover:opacity-80 transition"
                  >
                    <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-zinc-300">Click to upload your app screenshot</p>
                    <p className="text-xs text-zinc-500 mt-1">Supports PNG, JPG, WebP</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Watermark */}
            {watermark && (
              <div className="absolute bottom-3 right-4 text-[10px] text-white/50 font-mono">
                castov.com/app-mockup
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
