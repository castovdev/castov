import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const packageRoot = path.resolve(import.meta.dirname, "..");
const outputDir = path.resolve(packageRoot, "store-assets");
fs.mkdirSync(outputDir, { recursive: true });

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

// Master Castov SVG Logo
const LOGO_SVG = `
<svg viewBox="0 0 128 128" width="80" height="80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="pTop"><polygon points="-10,-10 138,-10 138,55 -10,71" /></clipPath>
    <clipPath id="pBot"><polygon points="-10,71 138,55 138,138 -10,138" /></clipPath>
  </defs>
  <path d="M 108,38 L 64,13 L 20,38 L 20,90 L 64,115 L 108,90" stroke="#f1f5f9" stroke-width="17" stroke-linecap="round" stroke-linejoin="round" clip-path="url(#pTop)" />
  <path d="M 108,38 L 64,13 L 20,38 L 20,90 L 64,115 L 108,90" stroke="#00b4f5" stroke-width="17" stroke-linecap="round" stroke-linejoin="round" clip-path="url(#pBot)" />
  <path d="M 46,45 L 67,64 L 46,83" stroke="#00b4f5" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="93" cy="64" r="8.5" fill="#00b4f5" />
</svg>
`;

// Large Promotional Tile (1400 x 560 px)
const LARGE_TILE_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1400px;
      height: 560px;
      background: #080b12;
      background-image:
        radial-gradient(circle at 10% 20%, rgba(0, 180, 245, 0.22), transparent 45%),
        radial-gradient(circle at 90% 80%, rgba(37, 99, 235, 0.25), transparent 50%),
        radial-gradient(circle at 55% 50%, rgba(15, 23, 42, 0.8), transparent 80%);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 70px;
      overflow: hidden;
      position: relative;
    }

    /* Ambient mesh grid */
    .grid-overlay {
      position: absolute;
      inset: 0;
      background-size: 40px 40px;
      background-image:
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      pointer-events: none;
    }

    /* Left Brand Content */
    .left-col {
      z-index: 2;
      max-width: 650px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .brand-row {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .logo-container {
      width: 86px;
      height: 86px;
      border-radius: 20px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(0, 180, 245, 0.4);
      box-shadow: 0 10px 30px -5px rgba(0, 180, 245, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .category-badge {
      align-self: flex-start;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.35);
      padding: 3px 10px;
      border-radius: 9999px;
    }
    .brand-name {
      font-size: 38px;
      font-weight: 900;
      letter-spacing: -0.03em;
      color: #ffffff;
      line-height: 1.1;
    }

    .headline {
      font-size: 26px;
      font-weight: 700;
      line-height: 1.25;
      color: #e2e8f0;
      letter-spacing: -0.01em;
    }
    .headline span {
      background: linear-gradient(135deg, #38bdf8 0%, #00b4f5 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .feature-pills {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .pill {
      display: flex;
      align-items: center;
      gap: 7px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 7px 14px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      color: #cbd5e1;
    }
    .pill-icon { font-size: 14px; }

    .platforms-supported {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 12.5px;
      color: #94a3b8;
    }
    .plat-tags {
      display: flex;
      gap: 8px;
    }
    .plat-tag {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11.5px;
      color: #f1f5f9;
      font-weight: 500;
    }

    /* Right Mockup Card */
    .right-col {
      z-index: 2;
      width: 540px;
      position: relative;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #e2e8f0;
      border-top: 5px solid #2563eb;
      box-shadow: 0 35px 80px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1);
      padding: 24px 28px;
      color: #0f172a;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transform: perspective(1000px) rotateY(-4deg) rotateX(2deg);
      transition: transform 0.3s ease;
    }

    .modal-head {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .shield-badge {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #fee2e2;
      color: #dc2626;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    .modal-head h3 { font-size: 16.5px; font-weight: 800; color: #0f172a; }
    .modal-head p { font-size: 12px; color: #64748b; margin-top: 1px; }

    .warning-box {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 11.5px;
      color: #92400e;
      line-height: 1.4;
    }

    .findings-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .finding-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 10px;
      background: #ffffff;
      border: 1px solid #f1f5f9;
      border-radius: 6px;
      font-size: 11.5px;
    }
    .finding-title { font-weight: 600; color: #334155; }
    .finding-val { font-family: ui-monospace, monospace; color: #dc2626; font-weight: 700; }

    .btn-row {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 2px;
    }
    .btn {
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid transparent;
    }
    .btn-cancel { background: #f8fafc; color: #64748b; border-color: #cbd5e1; }
    .btn-orig { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
    .btn-redact { background: #2563eb; color: #ffffff; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4); }

    .tag-ribbon {
      position: absolute;
      top: -16px;
      right: 20px;
      background: linear-gradient(135deg, #00b4f5, #2563eb);
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 9999px;
      box-shadow: 0 4px 12px rgba(0, 180, 245, 0.4);
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <div class="grid-overlay"></div>

  <!-- Left: Messaging & Identity -->
  <div class="left-col">
    <div class="brand-row">
      <div class="logo-container">
        ${LOGO_SVG}
      </div>
      <div class="brand-meta">
        <span class="category-badge">Microsoft Edge & Chrome Extension</span>
        <h1 class="brand-name">Castov Secret Shield</h1>
      </div>
    </div>

    <div class="headline">
      Prevent <span>Accidental Secret Leaks</span> When Pasting Into AI Chats
    </div>

    <div class="feature-pills">
      <div class="pill"><span class="pill-icon">⚡</span> &lt; 50ms Real-Time Interception</div>
      <div class="pill"><span class="pill-icon">🔒</span> Zero Network Calls (connect-src 'none')</div>
      <div class="pill"><span class="pill-icon">🛡️</span> 100% In-Memory Offline Redaction</div>
    </div>

    <div class="platforms-supported">
      <span>Supported AI Chats:</span>
      <div class="plat-tags">
        <span class="plat-tag">Microsoft Copilot</span>
        <span class="plat-tag">ChatGPT</span>
        <span class="plat-tag">Claude</span>
        <span class="plat-tag">Gemini</span>
        <span class="plat-tag">DeepSeek</span>
        <span class="plat-tag">Perplexity</span>
      </div>
    </div>
  </div>

  <!-- Right: Real Floating Modal Showcase -->
  <div class="right-col">
    <div class="tag-ribbon">INTERCEPTED BEFORE PASTE</div>
    <div class="modal-card">
      <div class="modal-head">
        <div class="shield-badge">🛡️</div>
        <div>
          <h3>2 Sensitive Secrets Detected</h3>
          <p>Castov Secret Shield intercepted this paste to protect your credentials.</p>
        </div>
      </div>

      <div class="warning-box">
        ⚠️ Secrets pasted into AI chats may be permanently logged in conversation history, system logs, or training data.
      </div>

      <div class="findings-box">
        <div class="finding-item">
          <span class="finding-title">AWS Access Key ID</span>
          <span class="finding-val">AKIA************MPLE</span>
        </div>
        <div class="finding-item">
          <span class="finding-title">Stripe Live Secret Key</span>
          <span class="finding-val">sk_live_********************4a21</span>
        </div>
      </div>

      <div class="btn-row">
        <div class="btn btn-cancel">Cancel</div>
        <div class="btn btn-orig">Paste Original</div>
        <div class="btn btn-redact">Paste Redacted</div>
      </div>
    </div>
  </div>
</body>
</html>`;

// Small Promotional Tile (440 x 280 px)
const SMALL_TILE_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 440px;
      height: 280px;
      background: #080b12;
      background-image:
        radial-gradient(circle at 50% 20%, rgba(0, 180, 245, 0.25), transparent 65%),
        radial-gradient(circle at 80% 90%, rgba(37, 99, 235, 0.2), transparent 50%);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
      overflow: hidden;
      position: relative;
    }
    .logo-box {
      width: 68px;
      height: 68px;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(0, 180, 245, 0.4);
      box-shadow: 0 8px 24px -4px rgba(0, 180, 245, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;
    }
    .title {
      font-size: 21px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }
    .tagline {
      font-size: 12.5px;
      color: #38bdf8;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .badges {
      display: flex;
      gap: 6px;
    }
    .badge {
      font-size: 10px;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      padding: 3px 8px;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div class="logo-box">
    ${LOGO_SVG}
  </div>
  <h2 class="title">Castov Secret Shield</h2>
  <div class="tagline">AI Paste &amp; Secret Leak Blocker</div>
  <div class="badges">
    <span class="badge">Zero Network</span>
    <span class="badge">&lt; 50ms Scans</span>
    <span class="badge">Offline Only</span>
  </div>
</body>
</html>`;

async function renderTiles() {
  console.log("Generating promotional tiles for Microsoft Edge Add-ons...");

  // 1. Large Promotional Tile (1400 x 560)
  const largeHtmlPath = path.resolve(outputDir, "temp-large.html");
  const largePngPath = path.resolve(outputDir, "large-promotional-tile-1400x560.png");
  fs.writeFileSync(largeHtmlPath, LARGE_TILE_HTML, "utf8");

  await execFileAsync(CHROME_PATH, [
    "--headless=new",
    "--disable-gpu",
    "--force-device-scale-factor=1",
    "--window-size=1400,560",
    `--screenshot=${largePngPath}`,
    `file:///${largeHtmlPath.replace(/\\/g, "/")}`,
  ]);
  fs.unlinkSync(largeHtmlPath);
  console.log("✓ Generated large-promotional-tile-1400x560.png (1400x560 px)");

  // 2. Small Promotional Tile (440 x 280)
  const smallHtmlPath = path.resolve(outputDir, "temp-small.html");
  const smallPngPath = path.resolve(outputDir, "small-promotional-tile-440x280.png");
  fs.writeFileSync(smallHtmlPath, SMALL_TILE_HTML, "utf8");

  await execFileAsync(CHROME_PATH, [
    "--headless=new",
    "--disable-gpu",
    "--force-device-scale-factor=1",
    "--window-size=440,280",
    `--screenshot=${smallPngPath}`,
    `file:///${smallHtmlPath.replace(/\\/g, "/")}`,
  ]);
  fs.unlinkSync(smallHtmlPath);
  console.log("✓ Generated small-promotional-tile-440x280.png (440x280 px)");

  console.log("All promotional tiles generated successfully!");
}

renderTiles().catch((err) => {
  console.error("Failed to render promotional tiles:", err);
  process.exit(1);
});
