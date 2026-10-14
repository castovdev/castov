"use client";

import React, { useState, useRef } from "react";
import { Download, Upload, Copy, Check, Image as ImageIcon } from "lucide-react";

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
    <div className="space-y-8">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-field border border-line">
        <div className="flex items-center gap-3">
          <input
            type="file"
            aria-label="Upload Brand Logo / Icon"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-bold px-4 py-2 shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-white" />
            Upload Brand Logo / Icon
          </button>
        </div>

        <button
          type="button"
          onClick={copySnippet}
          className="btn bg-bg border border-line text-muted hover:text-fg text-xs font-semibold px-3 py-1.5 cursor-pointer flex items-center gap-1.5"
        >
          {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedHtml ? "HTML Tags Copied!" : "Copy HTML <head> Tags"}
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Options Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-field border border-line space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Styling & Background</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Background Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    aria-label="Background Color"
                    value={bgColor === "transparent" ? "#ffffff" : bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg bg-transparent border border-line cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setBgColor("transparent")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition ${
                      bgColor === "transparent"
                        ? "bg-[#2563eb] text-white border-[#2563eb]"
                        : "bg-bg text-muted border-line hover:text-fg"
                    }`}
                  >
                    Transparent
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-muted mb-1.5">
                  <span>Icon Inset Padding</span>
                  <span className="font-mono text-fg">{padding}%</span>
                </div>
                <input
                  type="range"
                  aria-label="Icon Inset Padding"
                  min="0"
                  max="40"
                  value={padding}
                  onChange={(e) => setPadding(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* HTML Snippet Box */}
          <div className="p-6 rounded-2xl bg-field border border-line space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">HTML Header Markup</h2>
            <pre className="p-4 bg-bg border border-line rounded-xl text-xs font-mono text-fg leading-relaxed overflow-x-auto select-all">
              {htmlHeadSnippet}
            </pre>
          </div>
        </div>

        {/* Right Generated Icon Package */}
        <div className="lg:col-span-7 flex flex-col space-y-2">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            Generated Multi-Size Icon Package
          </label>

          <div className="p-6 rounded-2xl bg-field border border-line space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FAVICON_SIZES.map((icon) => (
                <div
                  key={icon.name}
                  className="p-3.5 rounded-xl bg-bg border border-line flex items-center justify-between hover:border-muted/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center border border-line overflow-hidden bg-field"
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
                        <ImageIcon className="w-5 h-5 text-muted" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-fg">{icon.name}</div>
                      <div className="text-[10px] text-muted font-mono">
                        {icon.size} × {icon.size} px
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!imageSrc}
                    onClick={() => downloadSize(icon)}
                    className="p-2 rounded-lg bg-field hover:bg-hover text-muted hover:text-fg border border-line transition cursor-pointer disabled:opacity-40"
                    title={`Download ${icon.name}`}
                    aria-label={`Download ${icon.name}`}
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
