"use client";

import React, { useState } from "react";
import { Copy, Check, Palette, Sparkles, RefreshCw } from "lucide-react";

interface ColorFormat {
  label: string;
  value: string;
}

export function ColorConverterTool() {
  const [hex, setHex] = useState("#6366f1");
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // Helper conversions
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
    { label: "CSS Variable", value: `--primary-color: ${hex};` },
    { label: "Tailwind Arbitrary", value: `bg-[${hex}]` },
  ];

  const shades = [0.1, 0.3, 0.5, 0.7, 0.9, 1, 1.2, 1.4, 1.6];

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
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Palette className="w-6 h-6 text-fuchsia-400" />
            Color Converter & Palette Studio
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Convert HEX, RGB, HSL, RGBA instantly with contrast analysis, shades & tints, and Tailwind tokens.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={randomColor}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition border border-zinc-700"
          >
            <RefreshCw className="w-4 h-4" /> Random Color
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Color preview and picker */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <div
              className="w-full h-40 rounded-xl shadow-inner border border-white/10 flex items-end p-4 transition-colors"
              style={{ backgroundColor: hex }}
            >
              <div className="bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800 text-xs font-mono font-bold text-white">
                {hex.toUpperCase()}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="color"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className="w-12 h-12 rounded-xl bg-transparent border border-zinc-700 cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={hex}
                  onChange={(e) => setHex(e.target.value)}
                  placeholder="#000000"
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 focus:outline-none focus:border-fuchsia-500/50 uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Format Conversions */}
        <div className="lg:col-span-7 space-y-3">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Color Code Formats</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formats.map((f) => (
                <div
                  key={f.label}
                  className="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition"
                >
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                      {f.label}
                    </span>
                    <span className="text-xs font-mono font-medium text-zinc-200 mt-0.5 block truncate max-w-[200px]">
                      {f.value}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(f.value, f.label)}
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
                  >
                    {copiedLabel === f.label ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
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
