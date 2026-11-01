/**
 * Castov Secret Shield - Vector Icon Generator
 *
 * Renders master SVG into pixel-perfect PNG icons (16, 32, 48, 128) using sharp.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const packageRoot = path.resolve(import.meta.dirname, "..");
const iconsDir = path.resolve(packageRoot, "icons");
const assetsDir = path.resolve(packageRoot, "src/assets");

fs.mkdirSync(iconsDir, { recursive: true });
fs.mkdirSync(assetsDir, { recursive: true });

export const SVG_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <!-- Diagonal split: divides the left vertical bar with a 30-deg cut -->
    <clipPath id="castovTopClip">
      <polygon points="-10,-10 138,-10 138,55 -10,71" />
    </clipPath>
    <clipPath id="castovBotClip">
      <polygon points="-10,71 138,55 138,138 -10,138" />
    </clipPath>
  </defs>

  <!-- Outer Hexagonal "C" - Charcoal Top -->
  <path
    d="M 108,38 L 64,13 L 20,38 L 20,90 L 64,115 L 108,90"
    fill="none"
    stroke="#1f242f"
    stroke-width="17"
    stroke-linecap="round"
    stroke-linejoin="round"
    clip-path="url(#castovTopClip)"
  />

  <!-- Outer Hexagonal "C" - Cyan Bottom -->
  <path
    d="M 108,38 L 64,13 L 20,38 L 20,90 L 64,115 L 108,90"
    fill="none"
    stroke="#00b4f5"
    stroke-width="17"
    stroke-linecap="round"
    stroke-linejoin="round"
    clip-path="url(#castovBotClip)"
  />

  <!-- Chevron ">" in vibrant cyan blue -->
  <path
    d="M 46,45 L 67,64 L 46,83"
    fill="none"
    stroke="#00b4f5"
    stroke-width="13"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Dot in vibrant cyan blue -->
  <circle cx="93" cy="64" r="8.5" fill="#00b4f5" />
</svg>`;

async function generate() {
  console.log("Generating Castov Secret Shield vector icons...");

  // Write master SVGs
  fs.writeFileSync(path.join(iconsDir, "icon.svg"), SVG_LOGO, "utf8");
  fs.writeFileSync(path.join(assetsDir, "logo.svg"), SVG_LOGO, "utf8");

  const svgBuffer = Buffer.from(SVG_LOGO);
  const sizes = [16, 32, 48, 128];

  for (const size of sizes) {
    const pngBuffer = await sharp(svgBuffer)
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toBuffer();

    const dest = path.join(iconsDir, `icon${size}.png`);
    fs.writeFileSync(dest, pngBuffer);
    console.log(`✓ Generated icon${size}.png (${pngBuffer.length} bytes)`);
  }

  console.log("All icons generated successfully.");
}

generate().catch((err) => {
  console.error("Failed to generate icons:", err);
  process.exit(1);
});
