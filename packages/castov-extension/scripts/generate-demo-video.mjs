import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFile, exec } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

const packageRoot = path.resolve(import.meta.dirname, "..");
const outputDir = path.resolve(packageRoot, "store-assets");
fs.mkdirSync(outputDir, { recursive: true });

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const WEB_PORT = 8990;

const HTML_CONTENT = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #07090e; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
    canvas { width: 1280px; height: 800px; }
  </style>
</head>
<body>
<canvas id="stage" width="1280" height="800"></canvas>
<script>
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');

  // Animation constants
  const FPS = 30;
  const TOTAL_SECONDS = 25;
  const TOTAL_FRAMES = FPS * TOTAL_SECONDS;

  // Stream & Recorder
  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm; codecs=vp9',
    videoBitsPerSecond: 8000000
  });

  const chunks = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.onstop = async () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    await fetch('/save-video', { method: 'POST', body: blob });
    window.close();
  };

  recorder.start();

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // Draw helpers
  function drawRoundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Draw Castov Logo
  function drawCastovLogo(cx, cy, scale) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Charcoal top
    ctx.save();
    ctx.beginPath();
    ctx.rect(-70, -70, 140, 70);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(44, -26);
    ctx.lineTo(0, -51);
    ctx.lineTo(-44, -26);
    ctx.lineTo(-44, 26);
    ctx.lineTo(0, 51);
    ctx.lineTo(44, 26);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 17;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // Cyan bottom
    ctx.save();
    ctx.beginPath();
    ctx.rect(-70, 0, 140, 70);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(44, -26);
    ctx.lineTo(0, -51);
    ctx.lineTo(-44, -26);
    ctx.lineTo(-44, 26);
    ctx.lineTo(0, 51);
    ctx.lineTo(44, 26);
    ctx.strokeStyle = '#00b4f5';
    ctx.lineWidth = 17;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // Chevron
    ctx.beginPath();
    ctx.moveTo(-18, -19);
    ctx.lineTo(3, 0);
    ctx.lineTo(-18, 19);
    ctx.strokeStyle = '#00b4f5';
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dot
    ctx.beginPath();
    ctx.arc(29, 0, 8.5, 0, Math.PI * 2);
    ctx.fillStyle = '#00b4f5';
    ctx.fill();

    ctx.restore();
  }

  let currentFrame = 0;

  function render() {
    ctx.clearRect(0, 0, 1280, 800);

    // Deep background with ambient glows
    const bgGrad = ctx.createRadialGradient(640, 400, 50, 640, 400, 700);
    bgGrad.addColorStop(0, '#0c1322');
    bgGrad.addColorStop(1, '#05070c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1280, 800);

    // Scene 1: Intro (0 - 4.5s, frames 0 - 135)
    if (currentFrame <= 135) {
      const progress = currentFrame / 135;
      const alpha = progress < 0.2 ? progress / 0.2 : progress > 0.8 ? (1 - progress) / 0.2 : 1;
      ctx.globalAlpha = clamp(alpha, 0, 1);

      // Logo
      const logoScale = 1.2 + Math.sin(currentFrame * 0.05) * 0.03;
      drawCastovLogo(640, 290, logoScale);

      // Text
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Castov Secret Shield', 640, 420);

      ctx.fillStyle = '#00b4f5';
      ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Real-Time AI Paste Interception & Secret Protection', 640, 465);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Zero Network Calls • 100% In-Memory Offline • Microsoft Edge & Chrome', 640, 505);

      // Category badge
      drawRoundedRect(520, 535, 240, 36, 18);
      ctx.fillStyle = 'rgba(0, 180, 245, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 180, 245, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 12px ui-monospace, monospace';
      ctx.fillText('SAFEPARSE™ SECURITY ENGINE', 640, 558);

      ctx.globalAlpha = 1;
    }

    // Scene 2, 3, 4: Active Copilot Workspace (frames 130 - 640)
    else if (currentFrame <= 640) {
      const sceneFrame = currentFrame - 130;
      const fadeIn = clamp(sceneFrame / 20, 0, 1);
      ctx.globalAlpha = fadeIn;

      // Browser Mockup
      drawRoundedRect(90, 60, 1100, 680, 16);
      ctx.fillStyle = '#0b0f19';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Browser Titlebar
      drawRoundedRect(90, 60, 1100, 44, 16);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.fillRect(90, 88, 1100, 16); // flatten bottom corners

      // Window dots
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(116, 82, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(136, 82, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(156, 82, 6, 0, Math.PI * 2); ctx.fill();

      // URL bar
      drawRoundedRect(200, 68, 800, 28, 8);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('🔒 https://copilot.microsoft.com', 215, 86);

      // Extension Icon in toolbar
      drawCastovLogo(1040, 82, 0.22);

      // Copilot Page Body
      ctx.fillStyle = '#1e293b';
      drawRoundedRect(140, 130, 48, 48, 24);
      ctx.fill();
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🤖', 164, 163);

      drawRoundedRect(205, 130, 640, 60, 12);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Hello! How can I assist with your backend cloud architecture today?', 225, 165);

      // Chat input area at bottom
      drawRoundedRect(140, 580, 1000, 120, 14);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Phase A: Developer pastes credentials (frames 130 - 240)
      if (sceneFrame < 110) {
        ctx.fillStyle = '#64748b';
        ctx.font = '14px -apple-system, sans-serif';
        ctx.fillText('Paste credentials or ask Copilot anything...', 165, 620);

        // Clipboard float notification
        if (sceneFrame > 30) {
          const clipY = 480 - Math.min(sceneFrame - 30, 10) * 2;
          drawRoundedRect(400, clipY, 480, 70, 10);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 12px ui-monospace, monospace';
          ctx.fillText('📋 CLIPBOARD CONTENT (ATTEMPTING PASTE):', 420, clipY + 25);
          ctx.fillStyle = '#f87171';
          ctx.font = '11px ui-monospace, monospace';
          ctx.fillText('AKIAIOSFODNN7EXAMPLE & sk_live_51Msz998877...', 420, clipY + 48);
        }
      }

      // Phase B: Interception Modal Pop-in (frames 240 - 450)
      if (sceneFrame >= 110 && sceneFrame < 330) {
        // Dim backdrop
        ctx.fillStyle = 'rgba(7, 9, 14, 0.7)';
        ctx.fillRect(90, 104, 1100, 636);

        // Interception Banner
        drawRoundedRect(440, 140, 400, 34, 17);
        ctx.fillStyle = 'rgba(0, 180, 245, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#00b4f5';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ SAFEPARSE™ INTERCEPTED PASTE IN 28ms', 640, 162);

        // Modal Box
        const modalProg = clamp((sceneFrame - 110) / 15, 0, 1);
        const modalScale = 0.95 + 0.05 * easeInOut(modalProg);
        ctx.save();
        ctx.translate(640, 410);
        ctx.scale(modalScale, modalScale);

        drawRoundedRect(-290, -180, 580, 360, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Top blue border
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(-290, -180, 580, 4);

        // Modal Header
        ctx.fillStyle = '#fee2e2';
        drawRoundedRect(-260, -155, 40, 40, 10);
        ctx.fill();
        ctx.font = '22px sans-serif';
        ctx.fillText('🛡️', -240, -127);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px -apple-system, sans-serif';
        ctx.fillText('2 Sensitive Secrets Detected', -205, -140);
        ctx.fillStyle = '#64748b';
        ctx.font = '12.5px -apple-system, sans-serif';
        ctx.fillText('Castov Secret Shield intercepted this paste to protect your credentials.', -205, -120);

        // Warning callout
        drawRoundedRect(-260, -95, 520, 44, 8);
        ctx.fillStyle = '#fffbeb';
        ctx.fill();
        ctx.strokeStyle = '#fef3c7';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#92400e';
        ctx.font = '11.5px -apple-system, sans-serif';
        ctx.fillText('⚠️ Secrets pasted into AI chats may be permanently logged in conversation history,', -245, -78);
        ctx.fillText('system logs, or training data.', -245, -62);

        // Findings Box
        drawRoundedRect(-260, -35, 520, 95, 8);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();

        // Row 1
        drawRoundedRect(-252, -27, 504, 36, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('AWS Access Key ID', -240, -5);
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 12px ui-monospace, monospace';
        ctx.textAlign = 'right';
        ctx.fillText('AKIA************MPLE', 236, -5);

        // Row 2
        drawRoundedRect(-252, 15, 504, 36, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.textAlign = 'left';
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('Stripe Live Secret Key', -240, 37);
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 12px ui-monospace, monospace';
        ctx.textAlign = 'right';
        ctx.fillText('sk_live_********************4a21', 236, 37);

        // Buttons
        // Cancel
        drawRoundedRect(10, 75, 75, 36, 8);
        ctx.fillStyle = '#f8fafc'; ctx.fill();
        ctx.strokeStyle = '#cbd5e1'; ctx.stroke();
        ctx.fillStyle = '#64748b'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Cancel', 47, 97);

        // Paste Original
        drawRoundedRect(95, 75, 115, 36, 8);
        ctx.fillStyle = '#fff7ed'; ctx.fill();
        ctx.strokeStyle = '#fed7aa'; ctx.stroke();
        ctx.fillStyle = '#c2410c'; ctx.fillText('Paste Original', 152, 97);

        // Paste Redacted Button
        const isClicking = sceneFrame >= 240;
        drawRoundedRect(220, 75, 120, 36, 8);
        ctx.fillStyle = isClicking ? '#1d4ed8' : '#2563eb';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('Paste Redacted', 280, 97);

        // Footer brand
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px sans-serif';
        ctx.fillText('Castov Secret Shield • Zero Network • Local Only', 0, 145);

        ctx.restore();

        // Mouse cursor animation (moving toward Paste Redacted)
        if (sceneFrame >= 160) {
          const cursorProg = clamp((sceneFrame - 160) / 70, 0, 1);
          const curX = 500 + 420 * easeInOut(cursorProg);
          const curY = 560 - 55 * easeInOut(cursorProg);

          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(curX, curY);
          ctx.lineTo(curX + 14, curY + 14);
          ctx.lineTo(curX + 6, curY + 14);
          ctx.lineTo(curX + 10, curY + 22);
          ctx.lineTo(curX + 6, curY + 24);
          ctx.lineTo(curX + 2, curY + 16);
          ctx.lineTo(curX, curY + 18);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Click ripple
          if (sceneFrame >= 235 && sceneFrame <= 265) {
            const rippleR = (sceneFrame - 235) * 1.5;
            ctx.beginPath();
            ctx.arc(curX + 4, curY + 4, rippleR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 180, 245, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }

      // Phase C: Redaction in place & AI Safe Response (frames 450 - 640)
      if (sceneFrame >= 330) {
        // Input box populated with sanitized tokens
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 13px ui-monospace, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('AWS_ACCESS_KEY_ID = "[REDACTED:AWS_KEY_1]"', 165, 620);
        ctx.fillText('STRIPE_SECRET_KEY = "[REDACTED:STRIPE_SECRET_1]"', 165, 645);

        // Success banner
        drawRoundedRect(360, 520, 560, 36, 18);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 12px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('✓ PASTE REDACTED — 0 SECRETS TRANSMITTED TO CLOUD', 640, 543);

        // AI Response bubble
        drawRoundedRect(205, 210, 800, 100, 12);
        ctx.fillStyle = '#111827';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#f8fafc';
        ctx.font = '13.5px -apple-system, sans-serif';
        ctx.fillText('🤖 Copilot AI:', 225, 235);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('I see your AWS_KEY_1 configuration and Stripe billing pipeline! To set up auto-rotation,', 225, 260);
        ctx.fillText('we can configure AWS Secrets Manager and webhook signing secrets securely.', 225, 282);
      }
    }

    // Scene 5: Outro Summary (frames 640 - 750)
    else {
      const outroFrame = currentFrame - 640;
      const alpha = clamp(outroFrame / 20, 0, 1);
      ctx.globalAlpha = alpha;

      drawCastovLogo(640, 220, 1.1);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 38px -apple-system, sans-serif';
      ctx.fillText('Castov Secret Shield', 640, 320);

      ctx.fillStyle = '#00b4f5';
      ctx.font = '700 18px -apple-system, sans-serif';
      ctx.fillText('The Developer Standard for AI Data Loss Prevention', 640, 355);

      // 4 Pillars Card
      drawRoundedRect(240, 390, 800, 140, 14);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.stroke();

      const pillars = [
        { icon: '🔒', title: 'Zero Network', desc: "connect-src 'none'" },
        { icon: '⚡', title: '< 50ms Scans', desc: 'Linear-time regex' },
        { icon: '🛡️', title: '11+ Secret Types', desc: 'AWS, Stripe, OpenAI...' },
        { icon: '📦', title: 'Shadow DOM', desc: 'Zero page style bleed' },
      ];

      for (let i = 0; i < pillars.length; i++) {
        const px = 270 + i * 195;
        ctx.font = '24px sans-serif';
        ctx.fillText(pillars[i].icon, px + 80, 435);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(pillars[i].title, px + 80, 465);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11.5px ui-monospace, monospace';
        ctx.fillText(pillars[i].desc, px + 80, 490);
      }

      // Download Banner
      drawRoundedRect(380, 560, 520, 44, 22);
      ctx.fillStyle = '#2563eb';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px -apple-system, sans-serif';
      ctx.fillText('Available Now on Microsoft Edge Add-ons & Chrome Store', 640, 588);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 13px -apple-system, sans-serif';
      ctx.fillText('Official Website: castov.com', 640, 630);
    }

    currentFrame++;
    if (currentFrame < TOTAL_FRAMES) {
      requestAnimationFrame(render);
    } else {
      console.log('Rendering complete, stopping recorder...');
      recorder.stop();
    }
  }

  requestAnimationFrame(render);
</script>
</body>
</html>`;

async function main() {
  console.log("Starting Web Demo Video Recording Server...");

  let chromeProcess = null;
  const webmPath = path.resolve(outputDir, "castov-secret-shield-demo.webm");
  const mp4Path = path.resolve(outputDir, "castov-secret-shield-demo.mp4");

  const server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(HTML_CONTENT);
      return;
    }

    if (req.method === "POST" && req.url === "/save-video") {
      console.log("Receiving recorded WebM stream...");
      const fileStream = fs.createWriteStream(webmPath);
      req.pipe(fileStream);

      req.on("end", async () => {
        res.writeHead(200);
        res.end("OK");
        console.log(`✓ WebM saved (${fs.statSync(webmPath).size} bytes)`);

        if (chromeProcess) {
          chromeProcess.kill();
        }
        server.close();

        console.log("Converting WebM to production H.264 MP4 with ffmpeg...");
        try {
          await execAsync(
            `ffmpeg -y -i "${webmPath}" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p "${mp4Path}"`
          );
          console.log(`✓ MP4 video created successfully at: ${mp4Path} (${fs.statSync(mp4Path).size} bytes)`);
        } catch (e) {
          console.error("FFmpeg conversion error:", e);
        }
      });
      return;
    }
  });

  server.listen(WEB_PORT, () => {
    console.log(`Server listening at http://localhost:${WEB_PORT}, launching Chrome recorder...`);
    chromeProcess = execFile(CHROME_PATH, [
      "--headless=new",
      "--disable-gpu",
      "--window-size=1280,800",
      `http://localhost:${WEB_PORT}`,
    ]);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
