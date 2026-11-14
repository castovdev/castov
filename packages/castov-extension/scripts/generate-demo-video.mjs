import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFile, exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const packageRoot = path.resolve(import.meta.dirname, "..");
const outputDir = path.resolve(packageRoot, "store-assets");
fs.mkdirSync(outputDir, { recursive: true });

function resolveChromeBinary() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const winProgFiles = process.env["PROGRAMFILES"] || "C:\\Program Files";
  const winProgFilesX86 = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
  const candidates = [
    path.join(winProgFiles, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(winProgFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return "google-chrome";
}

const CHROME_PATH = resolveChromeBinary();
const WEB_PORT = 8992;

const HTML_CONTENT = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #07090e; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
    canvas { width: 1920px; height: 1080px; }
  </style>
</head>
<body>
<canvas id="stage" width="1920" height="1080"></canvas>
<script>
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');

  // Animation constants: 35 seconds at 30 FPS (within 30-60s requirement)
  const FPS = 30;
  const TOTAL_SECONDS = 35;
  const TOTAL_FRAMES = FPS * TOTAL_SECONDS;

  // Stream & Recorder
  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm; codecs=vp9',
    videoBitsPerSecond: 10000000
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

  function drawBrowserShell() {
    drawRoundedRect(140, 70, 1640, 940, 18);
    ctx.fillStyle = '#0b0f19';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Titlebar
    drawRoundedRect(140, 70, 1640, 56, 18);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.fillRect(140, 108, 1640, 18);

    // Window dots
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(174, 98, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(198, 98, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(222, 98, 7, 0, Math.PI * 2); ctx.fill();

    // URL bar
    drawRoundedRect(280, 80, 1280, 36, 10);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '15px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🔒 https://ai-chat.example.com/session', 300, 103);

    // Extension Icon in toolbar
    drawCastovLogo(1680, 98, 0.28);
  }

  let currentFrame = 0;

  function render() {
    ctx.clearRect(0, 0, 1920, 1080);

    // Deep background with ambient glows
    const bgGrad = ctx.createRadialGradient(960, 540, 80, 960, 540, 1050);
    bgGrad.addColorStop(0, '#0c1322');
    bgGrad.addColorStop(1, '#05070c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1920, 1080);

    // Scene 1: Pasting Fake Keys into AI Chat (0 - 7s, frames 0 - 210)
    if (currentFrame < 210) {
      drawBrowserShell();

      // AI Welcome Message
      ctx.fillStyle = '#2563eb';
      drawRoundedRect(200, 165, 56, 56, 28);
      ctx.fill();
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🤖', 228, 203);

      drawRoundedRect(276, 165, 920, 76, 14);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '19px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Hello! Please share your backend service configuration so I can review it.', 304, 210);

      // Prompt Input Box
      drawRoundedRect(200, 780, 1520, 180, 16);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = currentFrame > 90 ? '#00b4f5' : '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '18px -apple-system, sans-serif';
      ctx.fillText('Paste configuration or type a message...', 230, 830);

      // Step indicator badge at top
      drawRoundedRect(660, 20, 600, 38, 19);
      ctx.fillStyle = 'rgba(0, 180, 245, 0.16)';
      ctx.fill();
      ctx.strokeStyle = '#00b4f5';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 15px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('STEP 1: DEVELOPER PASTES CONFIG WITH FAKE SECRETS', 960, 44);

      // Floating Clipboard Preview (frames 45 - 210)
      if (currentFrame >= 45) {
        const p = clamp((currentFrame - 45) / 25, 0, 1);
        const yOffset = (1 - easeInOut(p)) * 40;
        ctx.save();
        ctx.globalAlpha = p;
        drawRoundedRect(460, 520 + yOffset, 1000, 210, 14);
        ctx.fillStyle = '#111827';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 16px ui-monospace, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('📋 CLIPBOARD DATA (PRESSING CTRL+V INTO CHAT):', 490, 560 + yOffset);

        ctx.fillStyle = '#f87171';
        ctx.font = '17px ui-monospace, monospace';
        ctx.fillText('AWS_ACCESS_KEY_ID="AKIAFAKEFAKEFAKEFAKE"', 490, 605 + yOffset);
        ctx.fillText('OPENAI_API_KEY="sk-proj-FAKEFAKEFAKEFAKEFAKE00000000"', 490, 640 + yOffset);
        ctx.fillText('DATABASE_URL="postgres://app:FAKE_PASS_0000@db.local:5432/prod"', 490, 675 + yOffset);

        if (currentFrame >= 145) {
          drawRoundedRect(1180, 540 + yOffset, 250, 42, 8);
          ctx.fillStyle = '#2563eb';
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⌨️ Ctrl + V Pasted!', 1305, 567 + yOffset);
        }
        ctx.restore();
      }
    }

    // Scene 2: Modal Appears & User Clicks "Paste Redacted" (7s - 17s, frames 210 - 510)
    else if (currentFrame < 510) {
      const sceneFrame = currentFrame - 210;
      drawBrowserShell();

      // Dim backdrop inside browser
      ctx.fillStyle = 'rgba(7, 9, 14, 0.76)';
      ctx.fillRect(142, 126, 1636, 882);

      // Step indicator badge
      drawRoundedRect(610, 20, 700, 38, 19);
      ctx.fillStyle = 'rgba(0, 180, 245, 0.16)';
      ctx.fill();
      ctx.strokeStyle = '#00b4f5';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 15px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('STEP 2: SAFEPASTE™ BLOCKS PASTE & SHOWS MASKED DIALOG', 960, 44);

      const modalProg = clamp(sceneFrame / 18, 0, 1);
      const modalScale = 0.94 + 0.06 * easeInOut(modalProg);

      ctx.save();
      ctx.translate(960, 560);
      ctx.scale(modalScale, modalScale);

      // Modal Card
      drawRoundedRect(-410, -260, 820, 520, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top blue accent
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(-410, -260, 820, 6);

      // Shield Icon
      ctx.fillStyle = '#fee2e2';
      drawRoundedRect(-370, -225, 54, 54, 12);
      ctx.fill();
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛡️', -343, -187);

      // Modal Title & Subtitle
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px -apple-system, sans-serif';
      ctx.fillText('3 Sensitive Secrets Detected', -300, -202);
      ctx.fillStyle = '#64748b';
      ctx.font = '16px -apple-system, sans-serif';
      ctx.fillText('Castov Secret Shield intercepted this paste to protect your credentials.', -300, -175);

      // Warning box
      drawRoundedRect(-370, -145, 740, 60, 10);
      ctx.fillStyle = '#fffbeb';
      ctx.fill();
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#92400e';
      ctx.font = '15px -apple-system, sans-serif';
      ctx.fillText('⚠️ Secrets pasted into AI chats may be permanently logged in conversation history,', -350, -120);
      ctx.fillText('system logs, or training data.', -350, -98);

      // Masked Findings List
      drawRoundedRect(-370, -68, 740, 195, 10);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      const items = [
        { label: 'AWS Access Key ID', masked: 'AKIA… (20 chars)' },
        { label: 'OpenAI API Key', masked: 'sk-p… (36 chars)' },
        { label: 'Database Connection String with Password', masked: 'post… (54 chars)' }
      ];

      for (let i = 0; i < items.length; i++) {
        const ry = -54 + i * 58;
        drawRoundedRect(-356, ry, 712, 48, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#f1f5f9';
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 16px -apple-system, sans-serif';
        ctx.fillText(items[i].label, -338, ry + 30);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px ui-monospace, monospace';
        ctx.fillText(items[i].masked, 338, ry + 30);
      }

      // Action Buttons
      // Cancel
      drawRoundedRect(-30, 148, 110, 48, 10);
      ctx.fillStyle = '#f8fafc'; ctx.fill();
      ctx.strokeStyle = '#cbd5e1'; ctx.stroke();
      ctx.fillStyle = '#64748b'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Cancel', 25, 178);

      // Paste Original
      drawRoundedRect(95, 148, 150, 48, 10);
      ctx.fillStyle = '#fff7ed'; ctx.fill();
      ctx.strokeStyle = '#fed7aa'; ctx.stroke();
      ctx.fillStyle = '#c2410c';
      ctx.fillText('Paste Original', 170, 178);

      // Paste Redacted
      const isClicking = sceneFrame >= 210;
      drawRoundedRect(260, 148, 170, 48, 10);
      ctx.fillStyle = isClicking ? '#1d4ed8' : '#2563eb';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Paste Redacted', 345, 178);

      // Footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.fillText('Castov Secret Shield • Zero Network • Local Only', 0, 232);

      ctx.restore();

      // Animated Cursor clicking "Paste Redacted"
      if (sceneFrame >= 110) {
        const curProg = clamp((sceneFrame - 110) / 85, 0, 1);
        const curX = 760 + 545 * easeInOut(curProg);
        const curY = 820 - 85 * easeInOut(curProg);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(curX, curY);
        ctx.lineTo(curX + 18, curY + 18);
        ctx.lineTo(curX + 8, curY + 18);
        ctx.lineTo(curX + 13, curY + 28);
        ctx.lineTo(curX + 8, curY + 30);
        ctx.lineTo(curX + 3, curY + 20);
        ctx.lineTo(curX, curY + 23);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (sceneFrame >= 205 && sceneFrame <= 245) {
          const r = (sceneFrame - 205) * 1.8;
          ctx.beginPath();
          ctx.arc(curX + 4, curY + 4, r, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 180, 245, 0.85)';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
    }

    // Scene 3: Redacted Result Inserted into Chat (17s - 25s, frames 510 - 750)
    else if (currentFrame < 750) {
      drawBrowserShell();

      // Step indicator badge
      drawRoundedRect(610, 20, 700, 38, 19);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 15px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('STEP 3: REDACTED PLACEHOLDERS SAFELY INSERTED INTO EDITOR', 960, 44);

      // AI Welcome Message
      ctx.fillStyle = '#2563eb';
      drawRoundedRect(200, 165, 56, 56, 28);
      ctx.fill();
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🤖', 228, 203);

      drawRoundedRect(276, 165, 920, 76, 14);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '19px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Hello! Please share your backend service configuration so I can review it.', 304, 210);

      // AI Reply after safe paste
      if (currentFrame >= 570) {
        drawRoundedRect(276, 275, 1180, 130, 14);
        ctx.fillStyle = '#111827';
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 18px -apple-system, sans-serif';
        ctx.fillText('🤖 AI Assistant Response:', 304, 312);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '18px -apple-system, sans-serif';
        ctx.fillText('Your environment variables are well structured! I see [REDACTED:AWS_KEY_1],', 304, 348);
        ctx.fillText('[REDACTED:OPENAI_KEY_1], and [REDACTED:DATABASE_URI_1]. Zero raw keys were exposed.', 304, 380);
      }

      // Prompt Input Box populated with Redacted Placeholders
      drawRoundedRect(200, 720, 1520, 240, 16);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 20px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('AWS_ACCESS_KEY_ID="[REDACTED:AWS_KEY_1]"', 235, 775);
      ctx.fillText('OPENAI_API_KEY="[REDACTED:OPENAI_KEY_1]"', 235, 820);
      ctx.fillText('DATABASE_URL="[REDACTED:DATABASE_URI_1]"', 235, 865);

      // Green verification banner
      drawRoundedRect(560, 640, 800, 48, 24);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 16px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('✓ 3 SECRETS REDACTED LOCALLY — 0 SECRETS EXPOSED TO AI SERVERS', 960, 670);
    }

    // Scene 4: Extension Popup & Per-Site Settings (25s - 35s, frames 750 - 1050)
    else {
      drawBrowserShell();

      // Step indicator badge
      drawRoundedRect(580, 20, 760, 38, 19);
      ctx.fillStyle = 'rgba(0, 180, 245, 0.16)';
      ctx.fill();
      ctx.strokeStyle = '#00b4f5';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 15px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('STEP 4: LOCAL COUNTER & PER-SITE SHIELD SETTINGS (100% OFFLINE)', 960, 44);

      // Left Explanation Panel
      drawRoundedRect(220, 200, 760, 720, 18);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      drawCastovLogo(310, 290, 0.7);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 34px -apple-system, sans-serif';
      ctx.fillText('Castov Secret Shield', 385, 285);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 18px -apple-system, sans-serif';
      ctx.fillText('Zero-Network AI Paste Protection', 385, 318);

      const bullets = [
        { icon: '🔒', title: "Zero Network Connectivity (connect-src 'none')", desc: 'No fetch, no XHR, no WebSocket, no telemetry or remote servers.' },
        { icon: '🛡️', title: 'Single Permission: storage Only', desc: 'Stores only local toggle preferences and anonymous category counts.' },
        { icon: '⚡', title: '7 Explicitly Scoped AI Chat Domains', desc: 'Toggle protection independently for each supported AI chat domain.' },
        { icon: '👁️', title: 'Strict Secret Masking', desc: 'Never logs or renders full raw secrets in DOM or local storage.' }
      ];

      for (let i = 0; i < bullets.length; i++) {
        const by = 380 + i * 120;
        drawRoundedRect(260, by, 680, 96, 12);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.stroke();

        ctx.font = '26px sans-serif';
        ctx.fillText(bullets[i].icon, 285, by + 56);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 18px -apple-system, sans-serif';
        ctx.fillText(bullets[i].title, 335, by + 40);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '15px -apple-system, sans-serif';
        ctx.fillText(bullets[i].desc, 335, by + 70);
      }

      // Right Popup Panel Mockup
      drawRoundedRect(1060, 160, 580, 790, 18);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Popup Header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px -apple-system, sans-serif';
      ctx.fillText('Castov Secret Shield', 1100, 215);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px -apple-system, sans-serif';
      ctx.fillText('AI Paste & Secret Leak Protection', 1100, 240);

      drawRoundedRect(1490, 198, 115, 32, 16);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Offline Only', 1547, 219);

      // Stats Card
      drawRoundedRect(1100, 265, 500, 155, 14);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.4)';
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '800 48px -apple-system, sans-serif';
      ctx.fillText('3', 1350, 325);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 15px -apple-system, sans-serif';
      ctx.fillText('Secrets Blocked This Week', 1350, 355);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px ui-monospace, monospace';
      ctx.fillText('AWS_KEY: 1  •  OPENAI_KEY: 1  •  DATABASE_URI: 1', 1350, 395);

      // Master Controls
      drawRoundedRect(1100, 440, 500, 130, 12);
      ctx.fillStyle = '#111827';
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('Shield Protection (Global)', 1125, 480);
      ctx.fillStyle = '#64748b';
      ctx.font = '13px sans-serif';
      ctx.fillText('Intercept paste events on AI chat websites', 1125, 502);

      // Toggle ON
      drawRoundedRect(1525, 472, 50, 26, 13);
      ctx.fillStyle = '#2563eb'; ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(1562, 485, 10, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('Local Anonymous Counters', 1125, 538);
      drawRoundedRect(1525, 522, 50, 26, 13);
      ctx.fillStyle = '#2563eb'; ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(1562, 535, 10, 0, Math.PI * 2); ctx.fill();

      // Per-Site Toggles List
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 13px ui-monospace, monospace';
      ctx.fillText('PROTECTED AI CHAT WEBSITES (PER-SITE TOGGLES)', 1100, 602);

      const sites = [
        'chatgpt.com',
        'claude.ai',
        'gemini.google.com',
        'chat.deepseek.com',
        'www.perplexity.ai',
        'copilot.microsoft.com'
      ];

      for (let i = 0; i < sites.length; i++) {
        const sy = 618 + i * 50;
        drawRoundedRect(1100, sy, 500, 42, 8);
        ctx.fillStyle = '#111827';
        ctx.fill();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '15px ui-monospace, monospace';
        ctx.fillText(sites[i], 1125, sy + 26);

        drawRoundedRect(1530, sy + 9, 46, 24, 12);
        ctx.fillStyle = '#2563eb'; ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(1564, sy + 21, 9, 0, Math.PI * 2); ctx.fill();
      }
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
  console.log("Starting 1920x1080 Demo Video Recording Server (35 seconds @ 30fps)...");

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

        console.log("Converting WebM to silent 1920x1080 H.264 MP4 (35s @ 30fps) with ffmpeg...");
        try {
          await execAsync(
            `ffmpeg -y -i "${webmPath}" -an -vf "setpts=0.54*PTS,scale=1920:1080:flags=lanczos,fps=30" -t 35 -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p "${mp4Path}"`
          );
          if (fs.existsSync(webmPath)) {
            fs.unlinkSync(webmPath);
          }
          console.log(`✓ MP4 video created successfully at: ${mp4Path} (${fs.statSync(mp4Path).size} bytes)`);
          process.exit(0);
        } catch (e) {
          console.error("FFmpeg conversion error:", e);
          process.exit(1);
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
      "--window-size=1920,1080",
      `http://localhost:${WEB_PORT}`,
    ]);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
