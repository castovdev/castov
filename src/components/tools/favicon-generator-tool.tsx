"use client";

import React, { useState, useRef } from "react";
import { Download, Upload, Copy, Check, Globe, Sparkles, Image as ImageIcon } from "lucide-react";

interface IconSize {
  name: string;
  size: number;
  format: "png" | "ico";
}

const FAVICON_SIZES: IconSize[] = [
  { name: "favicon-16x16.png", size: 16, format: "png" },
  { name: "favicon-32x32.png", size: 32, format: "png" },
  { name: "apple-touch-icon.png", size: 180, format: "png" },
  { name: "android-chrome-192x192.png", size: 192, format: "png" },
  { name: "android-chrome-512x512.png", size: 512, format: "png" },
];

export function FaviconGeneratorTool() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [borderRadius, setBorderRadius] = useState<number>(0);
  const [padding, setPadding] = useState<number>(0);
  const [bgColor, setBgColor] = useState<string>("transparent");
  const [copiedHtml, setCopiedHtml] = useState(false);
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

  const downloadSize = (icon: IconSize) => {
    if (!imageSrc) return;
    const canvas = document.createElement("canvas");
    canvas.width = icon.size;
    canvas.height = icon.size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (bgColor !== "transparent") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, icon.size, icon.size);
    }

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const pad = (padding / 100) * icon.size;
      const targetSize = icon.size - pad * 2;
      ctx.drawImage(img, pad, pad, targetSize, targetSize);

      const a = document.createElement("a");
      a.download = icon.name;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
  };

  const htmlHeadSnippet = `<!-- Castov Favicon Package -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#ffffff">`;

  const copySnippet = () => {
    navigator.clipboard.writeText(htmlHeadSnippet);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-amber-400" />
            Favicon & App Icon Generator
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Convert any logo or picture into full favicon packages (16x16, 32x32, 180x180 Apple, 512x512 PWA) 100% in-browser.
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition shadow-lg shadow-amber-500/20 font-bold"
          >
            <Upload className="w-4 h-4" /> Upload Image / Logo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Styling & Background</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 font-medium">Background Color</label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="color"
                    value={bgColor === "transparent" ? "#ffffff" : bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded-xl bg-transparent border border-zinc-700 cursor-pointer"
                  />
                  <button
                    onClick={() => setBgColor("transparent")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      bgColor === "transparent"
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        : "border-zinc-800 text-zinc-400"
                    }`}
                  >
                    Transparent
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-300 mb-1">
                  <span>Icon Padding</span>
                  <span>{padding}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={padding}
                  onChange={(e) => setPadding(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </div>

          {/* HTML Meta Tag Export */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">HTML &lt;head&gt; Code</h3>
              <button
                onClick={copySnippet}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                {copiedHtml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedHtml ? "Copied" : "Copy Code"}
              </button>
            </div>
            <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
              {htmlHeadSnippet}
            </pre>
          </div>
        </div>

        {/* Live Export Sizes */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Generated Icon Package</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FAVICON_SIZES.map((icon) => (
                <div
                  key={icon.name}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center border border-zinc-800 overflow-hidden bg-zinc-900"
                      style={{ background: bgColor }}
                    >
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt="Icon Preview"
                          className="w-full h-full object-contain"
                          style={{ padding: `${padding}%` }}
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-zinc-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">{icon.name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {icon.size} × {icon.size} px • {icon.format.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <button
                    disabled={!imageSrc}
                    onClick={() => downloadSize(icon)}
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition disabled:opacity-40"
                    title={`Download ${icon.name}`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
