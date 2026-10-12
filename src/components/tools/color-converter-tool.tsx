"use client";

import React, { useState } from "react";
import { Copy, Check, RefreshCw, Sparkles, Sliders } from "lucide-react";

interface ColorFormat {
  label: string;
  value: string;
}

export function ColorConverterTool() {
  const [hex, setHex] = useState("#6366f1");
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const hexToRgb = (hexStr: string) => {
    let cleanHex = hexStr.replace("#", "");
    if (cleanHex.length === 3) {
      cleanHex = cleanHex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const num = parseInt(cleanHex, 16);
    if (isNaN(num) || cleanHex.length !== 6) return { r: 99, g: 102, b: 241 };
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  };

  const rgb = hexToRgb(hex);

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const formats: ColorFormat[] = [
    { label: "HEX", value: hex.toUpperCase() },
    { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { label: "RGBA", value: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)` },
    { label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    { label: "CSS Variable", value: `--color-accent: ${hex};` },
    { label: "Tailwind Arbitrary", value: `bg-[${hex}]` },
  ];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const randomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    setHex(color);
  };

  return (
    <div className="space-y-8">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-field border border-line">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="w-9 h-9 rounded-lg bg-transparent border border-line cursor-pointer"
          />
          <input
            type="text"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            placeholder="#6366F1"
            className="px-3 py-1.5 text-xs font-mono uppercase rounded-lg bg-bg border border-line text-fg max-w-[140px] focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>

        <button
          type="button"
          onClick={randomColor}
          className="btn bg-bg border border-line text-muted hover:text-fg text-xs font-semibold px-3 py-1.5 cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Random Palette Color
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Color Swatch Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-field border border-line space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Color Swatch</h3>
            <div
              className="w-full h-44 rounded-xl shadow-inner border border-line flex items-end p-4 transition-all"
              style={{ backgroundColor: hex }}
            >
              <div className="bg-bg/90 backdrop-blur px-3 py-1.5 rounded-lg border border-line text-xs font-mono font-bold text-fg shadow-lg">
                {hex.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Right Format Conversions Grid */}
        <div className="lg:col-span-7 flex flex-col space-y-2">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            Copyable Formats & Tokens
          </label>

          <div className="p-6 rounded-2xl bg-field border border-line space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formats.map((f) => (
                <div
                  key={f.label}
                  className="p-3.5 bg-bg border border-line rounded-xl flex items-center justify-between group hover:border-muted/50 transition"
                >
                  <div>
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                      {f.label}
                    </span>
                    <span className="text-xs font-mono font-medium text-fg mt-0.5 block truncate max-w-[200px]">
                      {f.value}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(f.value, f.label)}
                    className="p-2 rounded-lg bg-field hover:bg-hover text-muted hover:text-fg border border-line transition cursor-pointer"
                    title={`Copy ${f.label}`}
                  >
                    {copiedLabel === f.label ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
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
