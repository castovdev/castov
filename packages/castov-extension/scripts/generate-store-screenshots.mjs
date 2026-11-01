import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const packageRoot = path.resolve(import.meta.dirname, "..");
const outputDir = path.resolve(packageRoot, "store-assets");
fs.mkdirSync(outputDir, { recursive: true });

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

// Common SVG Logo
const LOGO_SVG = `
<svg viewBox="0 0 128 128" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="lTop"><polygon points="-10,-10 138,-10 138,55 -10,71" /></clipPath>
    <clipPath id="lBot"><polygon points="-10,71 138,55 138,138 -10,138" /></clipPath>
  </defs>
  <path d="M 108,38 L 64,13 L 20,38 L 20,90 L 64,115 L 108,90" stroke="#cbd5e1" stroke-width="17" stroke-linecap="round" stroke-linejoin="round" clip-path="url(#lTop)" />
  <path d="M 108,38 L 64,13 L 20,38 L 20,90 L 64,115 L 108,90" stroke="#00b4f5" stroke-width="17" stroke-linecap="round" stroke-linejoin="round" clip-path="url(#lBot)" />
  <path d="M 46,45 L 67,64 L 46,83" stroke="#00b4f5" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="93" cy="64" r="8.5" fill="#00b4f5" />
</svg>
`;

const SLIDES = [
  {
    filename: "screenshot-1-interception.png",
    badge: "SAFEPARSE™ REAL-TIME CLIPBOARD INTERCEPTION",
    title: "Stop Sensitive Secret Leaks in AI Chats",
    subtitle: "Intercepts credentials in < 50ms before they leave your clipboard",
    body: `
      <div class="browser-window">
        <div class="browser-header">
          <div class="dots"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span></div>
          <div class="address-bar"><span class="lock">🔒</span> https://copilot.microsoft.com</div>
          <div class="browser-actions">
            <span class="ext-icon">${LOGO_SVG}</span>
          </div>
        </div>
        <div class="chat-bg">
          <div class="ai-chat-thread">
            <div class="msg ai">
              <div class="avatar">🤖</div>
              <div class="bubble">Hello! I'm ready to assist with your cloud architecture. Please share your configuration.</div>
            </div>
            <div class="prompt-box-area">
              <div class="prompt-input-fake">
                Paste credentials here...
              </div>
            </div>
          </div>

          <!-- Real Castov Secret Shield Modal Overlay -->
          <div class="modal-overlay">
            <div class="dialog">
              <div class="dialog-header">
                <div class="shield-badge">🛡️</div>
                <div class="title-block">
                  <h2>2 Sensitive Secrets Detected</h2>
                  <p>Castov Secret Shield intercepted this paste to protect your credentials.</p>
                </div>
              </div>
              <div class="warning-callout">
                ⚠️ Secrets pasted into AI chats may be permanently logged in conversation history, system logs, or training data.
              </div>
              <div class="findings-container">
                <div class="finding-row">
                  <span class="finding-badge">AWS Access Key ID</span>
                  <span class="finding-masked">AKIA************MPLE</span>
                </div>
                <div class="finding-row">
                  <span class="finding-badge">Stripe Live Secret Key</span>
                  <span class="finding-masked">sk_live_********************4a21</span>
                </div>
              </div>
              <div class="actions">
                <button class="btn btn-cancel">Cancel</button>
                <button class="btn btn-orig">Paste Original</button>
                <button class="btn btn-redact">Paste Redacted (Recommended)</button>
              </div>
              <div class="footer-brand">
                Castov Secret Shield • Zero Network • Local Only
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  },
  {
    filename: "screenshot-2-redaction.png",
    badge: "ZERO-KNOWLEDGE PRIVACY IN ACTION",
    title: "Paste Clean Context While Secrets Stay 100% Local",
    subtitle: "Standardized type placeholders allow AI models to debug code without raw secrets",
    body: `
      <div class="browser-window">
        <div class="browser-header">
          <div class="dots"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span></div>
          <div class="address-bar"><span class="lock">🔒</span> https://chatgpt.com</div>
          <div class="browser-actions"><span class="ext-icon">${LOGO_SVG}</span></div>
        </div>
        <div class="split-view">
          <div class="pane code-pane">
            <div class="pane-tag danger">⚠️ Raw Clipboard (Intercepted)</div>
            <pre class="code-box"><code>const config = {
  dbUrl: <span class="tok-red">"postgres://admin:Sup3rS3cr3t@db.aws:5432/prod"</span>,
  apiKey: <span class="tok-red">"sk-proj-998877665544332211"</span>,
  awsKey: <span class="tok-red">"AKIAIOSFODNN7EXAMPLE"</span>
};</code></pre>
            <div class="arrow-indicator">⬇️ SafePaste™ Redaction applied</div>
            <div class="pane-tag success">🛡️ Safe Redacted Text (Sent to AI)</div>
            <pre class="code-box"><code>const config = {
  dbUrl: <span class="tok-green">"[REDACTED:POSTGRES_URI_1]"</span>,
  apiKey: <span class="tok-green">"[REDACTED:OPENAI_KEY_1]"</span>,
  awsKey: <span class="tok-green">"[REDACTED:AWS_KEY_1]"</span>
};</code></pre>
          </div>
          <div class="pane ai-pane">
            <div class="pane-tag brand">🤖 AI Model Output</div>
            <div class="ai-reply-card">
              <p><strong>AI Assistant:</strong></p>
              <p>Your configuration is structured correctly! To enable connection pooling for <code>POSTGRES_URI_1</code> in Node.js with high availability:</p>
              <pre class="code-box small"><code>import { Pool } from 'pg';
const pool = new Pool({
  connectionString: config.dbUrl,
  max: 20,
  idleTimeoutMillis: 30000
});</code></pre>
              <div class="benefit-pill">✅ Zero credentials were leaked or saved to AI training servers.</div>
            </div>
          </div>
        </div>
      </div>
    `,
  },
  {
    filename: "screenshot-3-popup.png",
    badge: "TOTAL LOCAL CONTROL & ZERO TELEMETRY",
    title: "Inspect Local Activity & Manage Site Toggles",
    subtitle: "Built-in anonymous stats and granular per-domain shields",
    body: `
      <div class="browser-window">
        <div class="browser-header">
          <div class="dots"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span></div>
          <div class="address-bar"><span class="lock">🔒</span> Microsoft Edge — Toolbar Extension Popup</div>
          <div class="browser-actions active-ext"><span class="ext-icon">${LOGO_SVG}</span></div>
        </div>
        <div class="popup-showcase-bg">
          <div class="popup-box">
            <div class="pop-header">
              <div class="pop-brand">
                <div class="pop-logo">${LOGO_SVG}</div>
                <div>
                  <div class="pop-name">Castov Secret Shield</div>
                  <div class="pop-desc">AI Paste Protection & Local Decoder</div>
                </div>
              </div>
              <span class="offline-pill">Offline Only</span>
            </div>

            <div class="pop-hero-card">
              <div class="pop-count">48</div>
              <div class="pop-label">Secrets Blocked This Week</div>
              <div class="cat-breakdown">
                <span class="cat-pill">AWS: 16</span>
                <span class="cat-pill">Stripe: 12</span>
                <span class="cat-pill">OpenAI: 11</span>
                <span class="cat-pill">JWT: 9</span>
              </div>
            </div>

            <div class="pop-section-title">GLOBAL SETTINGS</div>
            <div class="pop-card">
              <div class="toggle-row">
                <div>
                  <div class="toggle-title">Shield Protection</div>
                  <div class="toggle-sub">Intercept paste on AI chat sites</div>
                </div>
                <div class="switch on"><span class="thumb"></span></div>
              </div>
              <div class="toggle-row">
                <div>
                  <div class="toggle-title">Local Anonymous Counter</div>
                  <div class="toggle-sub">Keep private aggregate count</div>
                </div>
                <div class="switch on"><span class="thumb"></span></div>
              </div>
            </div>

            <div class="pop-section-title">ACTIVE PLATFORMS</div>
            <div class="pop-card sites">
              <div class="site-chip active"><span>Microsoft Copilot</span><span class="status-dot"></span></div>
              <div class="site-chip active"><span>ChatGPT</span><span class="status-dot"></span></div>
              <div class="site-chip active"><span>Claude.ai</span><span class="status-dot"></span></div>
              <div class="site-chip active"><span>Google Gemini</span><span class="status-dot"></span></div>
              <div class="site-chip active"><span>DeepSeek</span><span class="status-dot"></span></div>
              <div class="site-chip active"><span>Perplexity</span><span class="status-dot"></span></div>
            </div>
          </div>

          <div class="popup-callout">
            <h3>🔒 Complete Privacy Assurance</h3>
            <ul>
              <li><strong>Zero Remote Calls:</strong> Enforced by Content Security Policy.</li>
              <li><strong>Local Storage Only:</strong> Only integer counts are kept locally on device.</li>
              <li><strong>No Secret Retention:</strong> Intercepted credentials are never written to disk.</li>
            </ul>
          </div>
        </div>
      </div>
    `,
  },
  {
    filename: "screenshot-4-decode-tooltip.png",
    badge: "LOCAL DEVELOPER UTILITY",
    title: "Inspect & Decode Tokens Directly in Your Browser",
    subtitle: "Select any JWT, timestamp, or Base64 payload without sending tokens to insecure websites",
    body: `
      <div class="browser-window">
        <div class="browser-header">
          <div class="dots"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span></div>
          <div class="address-bar"><span class="lock">🔒</span> https://github.com/developer/project</div>
          <div class="browser-actions"><span class="ext-icon">${LOGO_SVG}</span></div>
        </div>
        <div class="decode-scene">
          <div class="code-view">
            <p class="code-comment">// Inspecting authentication session payload:</p>
            <p class="code-line">const token = <span class="selected-text">"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfODg5MiIsIm5hbWUiOiJBbGV4IFZlcm1hIiwicm9sZSI6ImNsdXN0ZXItYWRtaW4iLCJpYXQiOjE3OTM0MDkyOTYsImV4cCI6MTc5MzQ1MjQ5Nn0.7a8f9c1..."</span>;</p>
          </div>

          <!-- Context Menu Simulation -->
          <div class="context-menu">
            <div class="ctx-item">Copy</div>
            <div class="ctx-item">Search web for token</div>
            <div class="ctx-divider"></div>
            <div class="ctx-item active-ctx">
              <span class="ctx-icon">🛡️</span>
              <span><strong>Castov: Decode Selection</strong></span>
            </div>
            <div class="ctx-item">Inspect</div>
          </div>

          <!-- Decode Floating Tooltip -->
          <div class="decode-tooltip">
            <div class="tooltip-header">
              <div class="tt-title">
                <span class="tt-tag">JWT</span>
                <span>Decoded Token Payload</span>
              </div>
              <span class="tt-status valid">✓ Valid Signature Format</span>
            </div>
            <pre class="tooltip-json"><code>{
  <span class="jk">"sub"</span>: <span class="jv">"usr_8892"</span>,
  <span class="jk">"name"</span>: <span class="jv">"Alex Verma"</span>,
  <span class="jk">"role"</span>: <span class="jv">"cluster-admin"</span>,
  <span class="jk">"exp"</span>: <span class="jn">1793452496</span> <span class="jc">// Valid (expires in 4h 12m)</span>
}</code></pre>
            <div class="tooltip-footer">
              <span>Decoded 100% in-memory locally</span>
              <button class="btn-copy">Copy Formatted JSON</button>
            </div>
          </div>
        </div>
      </div>
    `,
  },
  {
    filename: "screenshot-5-supported-secrets.png",
    badge: "11+ HIGH-ENTROPY DETECTORS & UNIVERSAL SUPPORT",
    title: "Comprehensive Coverage for All Major Secrets & AI Platforms",
    subtitle: "Built with optimized linear-time Regex and Shannon entropy detectors",
    body: `
      <div class="browser-window">
        <div class="browser-header">
          <div class="dots"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span></div>
          <div class="address-bar"><span class="lock">🔒</span> Castov Secret Shield Ecosystem Overview</div>
          <div class="browser-actions"><span class="ext-icon">${LOGO_SVG}</span></div>
        </div>
        <div class="matrix-scene">
          <div class="matrix-col">
            <h3>🤖 Supported AI Chat Platforms</h3>
            <div class="platform-grid">
              <div class="plat-card"><span class="plat-icon">🔷</span><strong>Microsoft Copilot</strong><p>copilot.microsoft.com</p></div>
              <div class="plat-card"><span class="plat-icon">🟢</span><strong>OpenAI ChatGPT</strong><p>chatgpt.com & chat.openai.com</p></div>
              <div class="plat-card"><span class="plat-icon">🟣</span><strong>Anthropic Claude</strong><p>claude.ai</p></div>
              <div class="plat-card"><span class="plat-icon">🔵</span><strong>Google Gemini</strong><p>gemini.google.com</p></div>
              <div class="plat-card"><span class="plat-icon">🐳</span><strong>DeepSeek AI</strong><p>chat.deepseek.com</p></div>
              <div class="plat-card"><span class="plat-icon">🌐</span><strong>Perplexity AI</strong><p>perplexity.ai</p></div>
            </div>
          </div>

          <div class="matrix-col">
            <h3>🔑 Detected Sensitive Secret Patterns</h3>
            <div class="secret-list-grid">
              <div class="sec-chip"><span class="sec-icon">☁️</span><div><strong>AWS Credentials</strong><p>AKIA... & Secret Keys</p></div></div>
              <div class="sec-chip"><span class="sec-icon">🐙</span><div><strong>GitHub PATs</strong><p>Classic & Fine-grained</p></div></div>
              <div class="sec-chip"><span class="sec-icon">💳</span><div><strong>Stripe Live Secrets</strong><p>sk_live_...</p></div></div>
              <div class="sec-chip"><span class="sec-icon">🧠</span><div><strong>OpenAI & Claude API</strong><p>sk-..., sk-ant-...</p></div></div>
              <div class="sec-chip"><span class="sec-icon">🔑</span><div><strong>SSH & PEM Keys</strong><p>RSA, EC, OpenSSH</p></div></div>
              <div class="sec-chip"><span class="sec-icon">🗄️</span><div><strong>Database URIs</strong><p>Postgres, MySQL, Mongo</p></div></div>
              <div class="sec-chip"><span class="sec-icon">📜</span><div><strong>JSON Web Tokens</strong><p>Auth Bearer & JWT</p></div></div>
              <div class="sec-chip"><span class="sec-icon">🧪</span><div><strong>.env High Entropy</strong><p>Client-side Entropy Scan</p></div></div>
            </div>
          </div>
        </div>
        <div class="matrix-footer">
          <span>🛡️ Open Source • Zero Network • Local Processing • Built for Microsoft Edge & Google Chrome</span>
        </div>
      </div>
    `,
  },
  {
    filename: "screenshot-6-security-audit.png",
    badge: "ENTERPRISE SECURITY & COMPLIANCE",
    title: "Zero Network Connectivity Verified by Browser CSP",
    subtitle: "Built with a mathematical zero-trust architecture — no data leaves your machine",
    body: `
      <div class="browser-window">
        <div class="browser-header">
          <div class="dots"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span></div>
          <div class="address-bar"><span class="lock">🔒</span> Castov Secret Shield — Enterprise Privacy & Security Audit</div>
          <div class="browser-actions"><span class="ext-icon">${LOGO_SVG}</span></div>
        </div>
        <div class="audit-scene">
          <div class="audit-grid">
            <div class="audit-card highlight">
              <div class="audit-icon">🛡️</div>
              <h4>Content Security Policy</h4>
              <div class="code-line-mono">connect-src 'none'</div>
              <p>Strictly enforced by the browser engine. The extension physically cannot make network requests or leak secrets.</p>
              <span class="status-badge pass">✓ CSP VERIFIED</span>
            </div>

            <div class="audit-card">
              <div class="audit-icon">🔒</div>
              <h4>Zero Remote Scripts</h4>
              <div class="code-line-mono">script-src 'self'</div>
              <p>Zero external CDNs, zero remote tracking scripts, and zero telemetry libraries. 100% packaged locally.</p>
              <span class="status-badge pass">✓ LOCAL BUNDLE</span>
            </div>

            <div class="audit-card">
              <div class="audit-icon">⚡</div>
              <h4>Linear-Time Detection</h4>
              <div class="code-line-mono">&lt; 50ms Scans</div>
              <p>Single-pass optimized Regex and Shannon entropy detectors prevent page lag, UI freezes, or ReDoS attacks.</p>
              <span class="status-badge pass">✓ ZERO LAG</span>
            </div>

            <div class="audit-card">
              <div class="audit-icon">📦</div>
              <h4>Isolated Shadow DOM</h4>
              <div class="code-line-mono">attachShadow({ mode: 'open' })</div>
              <p>Dialogs and tooltips live in an isolated Shadow Root so webpage scripts cannot tamper with or read dialog contents.</p>
              <span class="status-badge pass">✓ XSS IMMUNE</span>
            </div>
          </div>

          <div class="audit-summary-box">
            <div class="summary-metric">
              <span class="sum-num">0</span>
              <span class="sum-label">Remote Network Calls</span>
            </div>
            <div class="summary-metric">
              <span class="sum-num">0</span>
              <span class="sum-label">Telemetry Events</span>
            </div>
            <div class="summary-metric">
              <span class="sum-num">0</span>
              <span class="sum-label">Secrets Written to Disk</span>
            </div>
            <div class="summary-metric">
              <span class="sum-num">100%</span>
              <span class="sum-label">Local & Open Source</span>
            </div>
          </div>
        </div>
      </div>
    `,
  },
];

const CSS_STYLES = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  width: 1280px;
  height: 800px;
  background: #07090e;
  background-image:
    radial-gradient(circle at 15% 15%, rgba(0, 180, 245, 0.12), transparent 45%),
    radial-gradient(circle at 85% 85%, rgba(37, 99, 235, 0.14), transparent 45%);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  padding: 24px 36px;
  overflow: hidden;
  user-select: none;
}

.top-hero {
  text-align: center;
  margin-bottom: 20px;
}
.badge-pill {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 4px 12px;
  border-radius: 9999px;
  margin-bottom: 8px;
}
.slide-title {
  font-size: 26px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}
.slide-subtitle {
  font-size: 13.5px;
  color: #94a3b8;
  font-weight: 400;
}

.browser-window {
  flex: 1;
  background: #0f172a;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.browser-header {
  height: 42px;
  background: #1e293b;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 16px;
}
.dots { display: flex; gap: 7px; }
.dot { width: 11px; height: 11px; border-radius: 50%; }
.dot.red { background: #ef4444; }
.dot.yellow { background: #f59e0b; }
.dot.green { background: #10b981; }

.address-bar {
  flex: 1;
  height: 28px;
  background: #0f172a;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 12px;
  color: #94a3b8;
  gap: 8px;
  font-family: ui-monospace, monospace;
}
.lock { font-size: 11px; }

.browser-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ext-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
}

/* Slide 1 Styles */
.chat-bg {
  flex: 1;
  background: #0b0f19;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 24px;
}
.ai-chat-thread {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  opacity: 0.35;
  filter: blur(1.5px);
}
.msg.ai {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.bubble {
  background: #1e293b;
  padding: 12px 18px;
  border-radius: 12px;
  font-size: 14px;
  color: #e2e8f0;
  max-width: 600px;
}
.prompt-box-area {
  margin-top: auto;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 14px;
  background: #111827;
  color: #64748b;
  font-size: 13px;
}

.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(11, 15, 25, 0.65);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.dialog {
  width: 580px;
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  border-top: 4px solid #2563eb;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.08);
  padding: 26px 30px;
  color: #0f172a;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.dialog-header {
  display: flex;
  align-items: center;
  gap: 14px;
}
.shield-badge {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #fee2e2;
  color: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.title-block h2 { font-size: 18px; font-weight: 700; color: #0f172a; }
.title-block p { font-size: 13px; color: #64748b; margin-top: 2px; }

.warning-callout {
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #92400e;
  line-height: 1.45;
}
.findings-container {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.finding-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 12px;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
  font-size: 13px;
}
.finding-badge { font-weight: 600; color: #334155; }
.finding-masked { font-family: ui-monospace, monospace; color: #dc2626; font-weight: 600; }

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}
.btn {
  padding: 9px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}
.btn-cancel { background: #f8fafc; color: #64748b; border-color: #cbd5e1; }
.btn-orig { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
.btn-redact { background: #2563eb; color: #ffffff; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35); }
.footer-brand {
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
  margin-top: -6px;
}

/* Slide 2 Styles */
.split-view {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 24px;
  gap: 24px;
  background: #090e17;
}
.pane {
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pane-tag {
  align-self: flex-start;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
}
.pane-tag.danger { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
.pane-tag.success { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
.pane-tag.brand { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }

.code-box {
  background: #030712;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 14px;
  font-family: ui-monospace, monospace;
  font-size: 12.5px;
  color: #e2e8f0;
  line-height: 1.5;
}
.code-box.small { font-size: 11.5px; }
.tok-red { color: #f87171; background: rgba(239, 68, 68, 0.12); padding: 2px 4px; border-radius: 4px; }
.tok-green { color: #34d399; background: rgba(16, 185, 129, 0.12); padding: 2px 4px; border-radius: 4px; font-weight: bold; }
.arrow-indicator {
  text-align: center;
  font-size: 12px;
  color: #38bdf8;
  font-weight: 600;
  margin: -2px 0;
}
.ai-reply-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  color: #cbd5e1;
  line-height: 1.5;
}
.benefit-pill {
  margin-top: auto;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: #34d399;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

/* Slide 3 Styles */
.popup-showcase-bg {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  padding: 24px;
  background: #0b0f19;
}
.popup-box {
  width: 360px;
  background: #0b0f17;
  border: 1px solid #1e293b;
  border-radius: 16px;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.6);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pop-brand { display: flex; align-items: center; gap: 10px; }
.pop-logo { width: 34px; height: 34px; }
.pop-name { font-size: 15px; font-weight: 700; color: #f8fafc; }
.pop-desc { font-size: 10.5px; color: #64748b; }
.offline-pill {
  font-size: 10px;
  font-weight: 600;
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 3px 8px;
  border-radius: 9999px;
}
.pop-hero-card {
  background: radial-gradient(circle at center, rgba(37, 99, 235, 0.25), transparent 75%), #111827;
  border: 1px solid rgba(37, 99, 235, 0.3);
  border-radius: 12px;
  padding: 14px;
  text-align: center;
}
.pop-count { font-size: 38px; font-weight: 800; color: #38bdf8; line-height: 1; }
.pop-label { font-size: 11px; color: #94a3b8; font-weight: 600; margin: 4px 0 10px; }
.cat-breakdown { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
.cat-pill {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2px 7px;
  border-radius: 6px;
  color: #cbd5e1;
}
.pop-section-title {
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.05em;
  margin-top: 2px;
}
.pop-card {
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.toggle-title { font-size: 12.5px; font-weight: 600; color: #f1f5f9; }
.toggle-sub { font-size: 10.5px; color: #64748b; }
.switch {
  width: 36px;
  height: 20px;
  background: #334155;
  border-radius: 9999px;
  position: relative;
  transition: all 0.2s;
}
.switch.on { background: #2563eb; }
.switch .thumb {
  position: absolute;
  top: 2px;
  left: 18px;
  width: 16px;
  height: 16px;
  background: #ffffff;
  border-radius: 50%;
}
.pop-card.sites {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 10px;
}
.site-chip {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #cbd5e1;
}
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; }

.popup-callout {
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.popup-callout h3 { font-size: 20px; color: #38bdf8; font-weight: 700; }
.popup-callout ul { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.popup-callout li { font-size: 14px; color: #cbd5e1; line-height: 1.5; }
.popup-callout strong { color: #ffffff; }

/* Slide 4 Styles */
.decode-scene {
  flex: 1;
  background: #090e17;
  padding: 30px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.code-view {
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 24px;
  font-family: ui-monospace, monospace;
  font-size: 13px;
  line-height: 1.6;
}
.code-comment { color: #64748b; margin-bottom: 8px; }
.code-line { color: #e2e8f0; }
.selected-text {
  background: rgba(56, 189, 248, 0.25);
  color: #38bdf8;
  border: 1px dashed #38bdf8;
  padding: 2px 4px;
  border-radius: 4px;
}

.context-menu {
  position: absolute;
  top: 100px;
  left: 280px;
  width: 220px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  padding: 6px 0;
  display: flex;
  flex-direction: column;
}
.ctx-item {
  padding: 7px 14px;
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 8px;
}
.ctx-item.active-ctx {
  background: #2563eb;
  color: #ffffff;
}
.ctx-divider { height: 1px; background: #334155; margin: 4px 0; }

.decode-tooltip {
  margin-top: auto;
  align-self: center;
  width: 700px;
  background: #0f172a;
  border: 1px solid #334155;
  border-top: 3px solid #00b4f5;
  border-radius: 12px;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.6);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tooltip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tt-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: #f8fafc; }
.tt-tag {
  background: #00b4f5;
  color: #050505;
  font-size: 10.5px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}
.tt-status.valid {
  font-size: 11.5px;
  font-weight: 600;
  color: #34d399;
}
.tooltip-json {
  background: #030712;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 12px 16px;
  font-family: ui-monospace, monospace;
  font-size: 12.5px;
  color: #e2e8f0;
  line-height: 1.5;
}
.jk { color: #38bdf8; }
.jv { color: #fde047; }
.jn { color: #a78bfa; }
.jc { color: #64748b; font-style: italic; }
.tooltip-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: #64748b;
}
.btn-copy {
  background: #1e293b;
  border: 1px solid #334155;
  color: #f8fafc;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

/* Slide 5 Styles */
.matrix-scene {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 24px;
  gap: 24px;
  background: #090e17;
}
.matrix-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.matrix-col h3 {
  font-size: 15px;
  font-weight: 700;
  color: #38bdf8;
}
.platform-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.plat-card {
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.plat-icon { font-size: 18px; margin-bottom: 2px; }
.plat-card strong { font-size: 13px; color: #f8fafc; }
.plat-card p { font-size: 10.5px; color: #64748b; font-family: ui-monospace, monospace; }

.secret-list-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.sec-chip {
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.sec-icon { font-size: 18px; }
.sec-chip strong { font-size: 12px; color: #f8fafc; display: block; }
.sec-chip p { font-size: 10px; color: #64748b; margin-top: 1px; }

.matrix-footer {
  background: #111827;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

/* Slide 6 Styles */
.audit-scene {
  flex: 1;
  background: #090e17;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.audit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.audit-card {
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}
.audit-card.highlight {
  border-color: rgba(0, 180, 245, 0.35);
  background: radial-gradient(circle at top right, rgba(0, 180, 245, 0.12), transparent 70%), #111827;
}
.audit-icon { font-size: 22px; }
.audit-card h4 { font-size: 14.5px; font-weight: 700; color: #f8fafc; }
.code-line-mono {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  padding: 3px 8px;
  border-radius: 6px;
  display: inline-block;
  align-self: flex-start;
}
.audit-card p {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.45;
  margin-top: 2px;
}
.status-badge.pass {
  position: absolute;
  top: 16px;
  right: 18px;
  font-size: 10px;
  font-weight: 800;
  color: #34d399;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 3px 8px;
  border-radius: 6px;
}
.audit-summary-box {
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px 24px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  text-align: center;
  gap: 16px;
}
.summary-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sum-num { font-size: 26px; font-weight: 800; color: #00b4f5; line-height: 1; }
.sum-label { font-size: 11.5px; color: #94a3b8; font-weight: 500; }
`;

async function renderSlides() {
  console.log("Rendering 6 store screenshots at 1280x800 px...");

  for (let i = 0; i < SLIDES.length; i++) {
    const slide = SLIDES[i];
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${CSS_STYLES}</style>
</head>
<body>
  <div class="top-hero">
    <div class="badge-pill">${slide.badge}</div>
    <h1 class="slide-title">${slide.title}</h1>
    <p class="slide-subtitle">${slide.subtitle}</p>
  </div>
  ${slide.body}
</body>
</html>`;

    const tempHtmlPath = path.resolve(outputDir, `temp-${i}.html`);
    const outPngPath = path.resolve(outputDir, slide.filename);

    fs.writeFileSync(tempHtmlPath, html, "utf8");

    const fileUrl = `file:///${tempHtmlPath.replace(/\\/g, "/")}`;

    await execFileAsync(CHROME_PATH, [
      "--headless=new",
      "--disable-gpu",
      "--force-device-scale-factor=1",
      "--window-size=1280,800",
      `--screenshot=${outPngPath}`,
      fileUrl,
    ]);

    fs.unlinkSync(tempHtmlPath);
    console.log(`✓ [${i + 1}/${SLIDES.length}] Generated ${slide.filename} (1280x800)`);
  }

  console.log("All 5 store screenshots generated successfully!");
}

renderSlides().catch((err) => {
  console.error("Failed to render screenshots:", err);
  process.exit(1);
});
