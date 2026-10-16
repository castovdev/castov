import { NextRequest, NextResponse } from "next/server";

const BADGE_PRESETS: Record<string, { label: string; value: string; color: string }> = {
  security: { label: "castov scan", value: "0 secrets leaked", color: "#10b981" },
  cursorrules: { label: "AI rules", value: "castov ready", color: "#3b82f6" },
  mcp: { label: "MCP server", value: "castov enabled", color: "#8b5cf6" },
  cli: { label: "npx castov", value: "v1.3.0", color: "#06b6d4" },
  privacy: { label: "telemetry", value: "zero-knowledge", color: "#10b981" },
  status: { label: "status", value: "operational", color: "#10b981" },
};

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const cleanType = type.replace(/\.svg$/i, "").toLowerCase();
  const preset = BADGE_PRESETS[cleanType] || {
    label: "castov",
    value: cleanType || "verified",
    color: "#2563eb",
  };

  const { searchParams } = new URL(req.url);
  const label = escapeXml(searchParams.get("label") || preset.label);
  const value = escapeXml(searchParams.get("value") || preset.value);
  const color = escapeXml(searchParams.get("color") || preset.color);

  const labelWidth = Math.max(48, label.length * 6.8 + 16);
  const valueWidth = Math.max(54, value.length * 6.8 + 16);
  const totalWidth = Math.round(labelWidth + valueWidth);
  const labelCenter = Math.round(labelWidth / 2);
  const valueCenter = Math.round(labelWidth + valueWidth / 2);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value} — Powered by Castov.com</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${Math.round(labelWidth)}" height="20" fill="#18181b"/>
    <rect x="${Math.round(labelWidth)}" width="${Math.round(valueWidth)}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="${labelCenter}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelCenter}" y="14" fill="#fff">${label}</text>
    <text aria-hidden="true" x="${valueCenter}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${valueCenter}" y="14" fill="#fff" font-weight="bold">${value}</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
