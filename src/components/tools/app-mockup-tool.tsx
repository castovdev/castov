"use client";

import React, { useState, useRef } from "react";
import { Download, Upload, Monitor, Laptop, Smartphone, Sparkles } from "lucide-react";

type DeviceType = "browser" | "macbook" | "iphone";

const GRADIENTS = [
  { name: "Cosmic Glow", bg: "from-blue-600 via-indigo-600 to-purple-800", c1: "#2563eb", c2: "#4f46e5", c3: "#581c87" },
  { name: "Cyberpunk", bg: "from-pink-500 via-purple-600 to-cyan-500", c1: "#ec4899", c2: "#9333ea", c3: "#06b6d4" },
  { name: "Hyper Sunset", bg: "from-amber-500 via-rose-600 to-purple-700", c1: "#f59e0b", c2: "#e11d48", c3: "#6b21a8" },
  { name: "Emerald Matrix", bg: "from-emerald-500 via-teal-700 to-slate-900", c1: "#10b981", c2: "#0f766e", c3: "#0f172a" },
  { name: "Pure Carbon", bg: "from-zinc-900 via-neutral-900 to-black", c1: "#18181b", c2: "#171717", c3: "#09090b" },
];

export function AppMockupTool() {
  const [device, setDevice] = useState<DeviceType>("browser");
  const [selectedGrad, setSelectedGrad] = useState(GRADIENTS[0]);
  const [padding, setPadding] = useState(48);
  const [shadow, setShadow] = useState(true);
  const [watermark, setWatermark] = useState(true);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, selectedGrad.c1);
    grad.addColorStop(0.5, selectedGrad.c2);
    grad.addColorStop(1, selectedGrad.c3);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Mockup Card
    const frameX = padding;
    const frameY = padding;
    const frameW = width - padding * 2;
    const frameH = height - padding * 2;

    if (shadow) {
      ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 20;
    }

    ctx.fillStyle = "#0c0d12";
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameW, frameH, 16);
    ctx.fill();
    ctx.shadowColor = "transparent";

    // Browser Chrome dots
    if (device === "browser" || device === "macbook") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      ctx.roundRect(frameX, frameY, frameW, 42, [16, 16, 0, 0]);
      ctx.fill();

      ctx.fillStyle = "#ff5f56";
      ctx.beginPath();
      ctx.arc(frameX + 24, frameY + 21, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffbd2e";
      ctx.beginPath();
      ctx.arc(frameX + 44, frameY + 21, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#27c93f";
      ctx.beginPath();
      ctx.arc(frameX + 64, frameY + 21, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (imageSrc) {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        const topOffset = device === "iphone" ? 0 : 42;
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
      ctx.font = "18px sans-serif";
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
    <div className="space-y-8">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-field border border-line">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-muted">Device:</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDevice("browser")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                device === "browser"
                  ? "bg-[#2563eb] text-white shadow-sm"
                  : "bg-bg text-muted border border-line hover:text-fg"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> Browser
            </button>
            <button
              type="button"
              onClick={() => setDevice("macbook")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                device === "macbook"
                  ? "bg-[#2563eb] text-white shadow-sm"
                  : "bg-bg text-muted border border-line hover:text-fg"
              }`}
            >
              <Laptop className="w-3.5 h-3.5" /> Laptop
            </button>
            <button
              type="button"
              onClick={() => setDevice("iphone")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                device === "iphone"
                  ? "bg-[#2563eb] text-white shadow-sm"
                  : "bg-bg text-muted border border-line hover:text-fg"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile
            </button>
          </div>

          <div className="h-4 w-[1px] bg-line hidden sm:block mx-1" />

          <label className="text-xs font-semibold text-muted">Theme:</label>
          <div className="flex items-center gap-1.5">
            {GRADIENTS.map((g) => (
              <button
                key={g.name}
                type="button"
                onClick={() => setSelectedGrad(g)}
                className={`w-7 h-7 rounded-full bg-gradient-to-tr ${g.bg} border-2 transition-transform cursor-pointer ${
                  selectedGrad.name === g.name
                    ? "scale-110 border-white shadow-md ring-2 ring-accent"
                    : "border-transparent opacity-80 hover:opacity-100"
                }`}
                title={g.name}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn bg-bg border border-line text-muted hover:text-fg text-xs font-semibold px-3 py-1.5 cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Screenshot
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="btn bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-bold px-4 py-1.5 shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            {downloading ? "Exporting..." : "Download High-Res PNG"}
          </button>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-field border border-line space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Layout & Dimensions</h3>
            <div>
              <div className="flex justify-between text-xs text-muted mb-1.5">
                <span>Canvas Padding</span>
                <span className="font-mono text-fg">{padding}px</span>
              </div>
              <input
                type="range"
                min="24"
                max="80"
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
            </div>

            <div className="space-y-3 pt-2 border-t border-line">
              <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={shadow}
                  onChange={(e) => setShadow(e.target.checked)}
                  className="accent-accent"
                />
                Realistic 3D Drop Shadow
              </label>

              <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={watermark}
                  onChange={(e) => setWatermark(e.target.checked)}
                  className="accent-accent"
                />
                Castov Discreet Badge
              </label>
            </div>
          </div>
        </div>

        {/* Live Canvas Mockup */}
        <div className="lg:col-span-8 flex flex-col space-y-2">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            Real-Time Mockup Preview
          </label>

          <div
            className={`rounded-2xl bg-gradient-to-tr ${selectedGrad.bg} shadow-2xl flex items-center justify-center transition-all min-h-[460px] relative overflow-hidden`}
            style={{ padding: `${padding}px` }}
          >
            {/* Device Box */}
            <div
              className={`w-full max-w-xl bg-[#0c0d12] rounded-xl overflow-hidden border border-white/10 ${
                shadow ? "shadow-2xl shadow-black/70" : ""
              }`}
            >
              {/* Chrome Header */}
              {device !== "iphone" && (
                <div className="h-9 px-4 flex items-center justify-between border-b border-white/10 bg-[#0c0d12]/80 backdrop-blur">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className="text-[10px] text-white/40 font-mono">
                    {device === "browser" ? "https://castov.com" : "workspace"}
                  </div>
                  <div className="w-8" />
                </div>
              )}

              {/* Screenshot Area */}
              <div className="min-h-[260px] flex items-center justify-center bg-[#090a0f]">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="App Preview"
                    className="w-full h-auto max-h-[400px] object-cover"
                  />
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 text-center cursor-pointer hover:opacity-80 transition"
                  >
                    <Upload className="w-8 h-8 text-white/30 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-white/70">Click to upload your screenshot</p>
                    <p className="text-[10px] text-white/40 mt-0.5">PNG, JPG, WebP supported</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Watermark */}
            {watermark && (
              <div className="absolute bottom-3 right-4 text-[10px] text-white/40 font-mono">
                castov.com/app-mockup
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
