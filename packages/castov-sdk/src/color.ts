export interface RgbColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface HslColor {
  h: number;
  s: number;
  l: number;
  a?: number;
}

export interface WcagCompliance {
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
}

export interface ColorResult {
  hex: string;
  rgb: string;
  rgba: string;
  hsl: string;
  values: {
    rgb: RgbColor;
    hsl: HslColor;
  };
  contrast: {
    white: number;
    black: number;
    bestTextColor: "#ffffff" | "#000000";
    wcagOnWhite: WcagCompliance;
    wcagOnBlack: WcagCompliance;
  };
}

function parseHex(hex: string): RgbColor {
  let s = hex.replace(/^#/, "").trim();
  if (s.length === 3) {
    s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  } else if (s.length === 4) {
    s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
  }

  if (s.length !== 6 && s.length !== 8) {
    throw new Error(`color: invalid hex color "${hex}"`);
  }

  const r = parseInt(s.slice(0, 2), 16);
  const g = parseInt(s.slice(2, 4), 16);
  const b = parseInt(s.slice(4, 6), 16);
  const a = s.length === 8 ? parseFloat((parseInt(s.slice(6, 8), 16) / 255).toFixed(3)) : 1;

  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
    throw new Error(`color: invalid hex color "${hex}"`);
  }

  return { r, g, b, a };
}

function rgbToHsl(r: number, g: number, b: number, a = 1): HslColor {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a,
  };
}

/**
 * Calculates WCAG relative luminance according to W3C spec.
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

function checkWcag(ratio: number): WcagCompliance {
  return {
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3.0,
    aaaNormal: ratio >= 7.0,
    aaaLarge: ratio >= 4.5,
  };
}

/**
 * Parses Hex, RGB, or HSL color and computes representations + WCAG contrast metrics.
 */
export function color(input: string): ColorResult {
  const trimmed = input.trim();
  let rgbColor: RgbColor;

  if (trimmed.startsWith("#") || /^[0-9a-f]{3,8}$/i.test(trimmed)) {
    rgbColor = parseHex(trimmed);
  } else if (/^rgba?\s*\(/i.test(trimmed)) {
    const m = trimmed.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
    if (!m) throw new Error(`color: invalid rgb/rgba string "${input}"`);
    rgbColor = {
      r: Math.min(255, Math.max(0, parseInt(m[1], 10))),
      g: Math.min(255, Math.max(0, parseInt(m[2], 10))),
      b: Math.min(255, Math.max(0, parseInt(m[3], 10))),
      a: m[4] !== undefined ? parseFloat(m[4]) : 1,
    };
  } else {
    throw new Error(`color: unrecognized format "${input}". Expected hex (#3b82f6) or rgb(...)`);
  }

  const { r, g, b, a = 1 } = rgbColor;
  const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  const hslColor = rgbToHsl(r, g, b, a);

  const lum = relativeLuminance(r, g, b);
  const lumWhite = 1.0;
  const lumBlack = 0.0;

  const contrastWhite = contrastRatio(lum, lumWhite);
  const contrastBlack = contrastRatio(lum, lumBlack);

  return {
    hex,
    rgb: `rgb(${r}, ${g}, ${b})`,
    rgba: `rgba(${r}, ${g}, ${b}, ${a})`,
    hsl: `hsl(${hslColor.h}, ${hslColor.s}%, ${hslColor.l}%)`,
    values: {
      rgb: rgbColor,
      hsl: hslColor,
    },
    contrast: {
      white: contrastWhite,
      black: contrastBlack,
      bestTextColor: contrastWhite >= contrastBlack ? "#ffffff" : "#000000",
      wcagOnWhite: checkWcag(contrastWhite),
      wcagOnBlack: checkWcag(contrastBlack),
    },
  };
}
