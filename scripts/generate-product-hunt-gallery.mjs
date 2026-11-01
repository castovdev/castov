import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const rootDir = process.cwd();
const outputDir = path.resolve(rootDir, "public", "product-hunt");
fs.mkdirSync(outputDir, { recursive: true });

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

// Master Castov SVG Logo
const LOGO_SVG = `
<svg viewBox="0 0 128 128" width="34" height="34" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="phTop"><polygon points="-10,-10 138,-10 138,55 -10,71" /></clipPath>
    <clipPath id="phBot"><polygon points="-10,71 138,55 138,138 -10,138" /></clipPath>
  </defs>
  <path d="M 108,38 L 64,13 L 20,38 L 20,90 L 64,115 L 108,90" stroke="#cbd5e1" stroke-width="17" stroke-linecap="round" stroke-linejoin="round" clip-path="url(#phTop)" />
  <path d="M 108,38 L 64,13 L 20,38 L 20,90 L 64,115 L 108,90" stroke="#00b4f5" stroke-width="17" stroke-linecap="round" stroke-linejoin="round" clip-path="url(#phBot)" />
  <path d="M 46,45 L 67,64 L 46,83" stroke="#00b4f5" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="93" cy="64" r="8.5" fill="#00b4f5" />
</svg>
`;

const SLIDES = [
  {
    filename: "product-hunt-1-hero-overview.png",
    badge: "PRODUCT HUNT LAUNCH • 61 FREE DEVELOPER UTILITIES",
    badgeColor: "#00b4f5",
    title: "The Zero-Telemetry Developer Powerhouse",
    subtitle: "61 in-browser tools, native CLI & Glama Grade A MCP server. 100% Client-side & private.",
    content: `
      <div class="mock-browser">
        <div class="m-header">
          <div class="dots"><span class="d red"></span><span class="d yel"></span><span class="d grn"></span></div>
          <div class="url-bar"><span class="lock">🔒</span> https://castov.com</div>
          <div class="header-right"><span class="pulse-dot"></span> 100% Client-Side</div>
        </div>
        <div class="m-body hero-grid-layout">
          <div class="nav-fake">
            <div class="brand">${LOGO_SVG} <span class="brand-text">Castov</span> <span class="tag">DEV</span></div>
            <div class="nav-links">
              <span class="nav-item active">Tools (61)</span>
              <span class="nav-item">MCP Server <span class="sub-pill">AI</span></span>
              <span class="nav-item">CLI Engine</span>
              <span class="nav-item">Guides</span>
            </div>
            <div class="nav-actions">
              <span class="search-fake">Search tools... ⌘K</span>
            </div>
          </div>
          <div class="cards-showcase">
            <div class="feature-card c-glow">
              <div class="c-head">
                <span class="c-icon">🛡️</span>
                <span class="c-title">Secret Scanner</span>
                <span class="c-badge">DevSecOps</span>
              </div>
              <p class="c-desc">Detect AWS, OpenAI, Stripe & GitHub tokens before commits.</p>
              <div class="c-meta">Sub-50ms • Zero Cloud Calls</div>
            </div>

            <div class="feature-card">
              <div class="c-head">
                <span class="c-icon">🔑</span>
                <span class="c-title">JWT Inspector</span>
                <span class="c-badge">Security</span>
              </div>
              <p class="c-desc">Decode headers, claims and verify expiry times in memory.</p>
              <div class="c-meta">Auto Unix Diff • 100% Offline</div>
            </div>

            <div class="feature-card">
              <div class="c-head">
                <span class="c-icon">⚖️</span>
                <span class="c-title">Diff Checker</span>
                <span class="c-badge">Code</span>
              </div>
              <p class="c-desc">Compare proprietary code side-by-side with zero upload risk.</p>
              <div class="c-meta">Myers WASM • Unlimited Size</div>
            </div>

            <div class="feature-card">
              <div class="c-head">
                <span class="c-icon">📡</span>
                <span class="c-title">Webhook Tester</span>
                <span class="c-badge">Cloud</span>
              </div>
              <p class="c-desc">Live HTTP inspection & Stripe webhook simulation directly in browser.</p>
              <div class="c-meta">Real-time Stream • No Accounts</div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    filename: "product-hunt-2-secret-shield.png",
    badge: "SAFEPARSE™ BROWSER EXTENSION • CHROME, EDGE & FIREFOX",
    badgeColor: "#38bdf8",
    title: "Never Leak API Keys to AI Chats Again",
    subtitle: "Preempts clipboard pastes in <50ms and offers one-click token redaction before prompts submit.",
    content: `
      <div class="mock-browser">
        <div class="m-header">
          <div class="dots"><span class="d red"></span><span class="d yel"></span><span class="d grn"></span></div>
          <div class="url-bar"><span class="lock">🔒</span> https://chatgpt.com</div>
          <div class="header-right"><span class="shield-active">🛡️ Shield Active</span></div>
        </div>
        <div class="m-body chat-sim">
          <div class="chat-bg-dark">
            <div class="chat-bubble ai">
              <span class="ai-avatar">🤖</span>
              <span>Hello! Paste your webhook handler or configuration code and I'll debug it.</span>
            </div>
            
            <!-- Shadow DOM Modal Overlay -->
            <div class="shadow-modal-overlay">
              <div class="modal-box">
                <div class="modal-header">
                  <div class="modal-icon-badge">🛡️</div>
                  <div>
                    <h3 class="modal-title">2 Sensitive Secrets Detected</h3>
                    <p class="modal-sub">Castov Secret Shield intercepted this paste to protect your credentials.</p>
                  </div>
                </div>

                <div class="secret-items">
                  <div class="s-row">
                    <span class="s-label">AWS Access Key ID</span>
                    <span class="s-code">AKIA111122223333••••</span>
                  </div>
                  <div class="s-row">
                    <span class="s-label">OpenAI Project Key</span>
                    <span class="s-code">sk-proj-9876543210ab••••</span>
                  </div>
                </div>

                <div class="modal-actions">
                  <button class="m-btn m-cancel">Cancel</button>
                  <button class="m-btn m-orig">Paste Original</button>
                  <button class="m-btn m-redact">Paste Redacted [Recommended]</button>
                </div>
                <div class="modal-foot">Zero Network Calls • 100% In-Memory Interception</div>
              </div>
            </div>

            <div class="fake-input-bar">
              <span class="fake-placeholder">Message ChatGPT...</span>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    filename: "product-hunt-3-mcp-server.png",
    badge: "MODEL CONTEXT PROTOCOL • GLAMA GRADE A COMPLIANT",
    badgeColor: "#10b981",
    title: "Supercharge Cursor & Claude with Local MCP Tools",
    subtitle: "Give AI coding assistants 10 deterministic JSON-RPC 2.0 tools with zero remote dependencies.",
    content: `
      <div class="mcp-grid">
        <div class="ide-pane">
          <div class="pane-bar">
            <div class="dots"><span class="d red"></span><span class="d yel"></span><span class="d grn"></span></div>
            <span>Cursor IDE • Chat Assistant</span>
          </div>
          <div class="ide-body">
            <div class="prompt-user">
              <strong>User:</strong> Calculate CIDR subnet details for <code>10.240.0.0/16</code> and check port 5432.
            </div>
            <div class="tool-call-card">
              <div class="t-badge">⚡ Tool Execution: @castov</div>
              <div class="t-code">castov_cidr_calculate({ cidr: "10.240.0.0/16" })</div>
              <div class="t-code">castov_port_lookup({ port: 5432 })</div>
            </div>
            <div class="prompt-ai">
              <strong>Claude 3.5:</strong> Found: <strong>PostgreSQL Database</strong> (TCP 5432). Subnet <code>10.240.0.0/16</code> provides <strong>65,534 usable hosts</strong> (10.240.0.1 to 10.240.255.254).
            </div>
          </div>
        </div>

        <div class="terminal-pane">
          <div class="pane-bar">
            <div class="dots"><span class="d red"></span><span class="d yel"></span><span class="d grn"></span></div>
            <span>Terminal: castov MCP Daemon</span>
          </div>
          <div class="term-body">
            <div class="term-line"><span class="t-green">$</span> npx -y castov@latest mcp</div>
            <div class="term-line t-cyan">[Castov-MCP] Initialized JSON-RPC 2.0 stdio server</div>
            <div class="term-line t-dim">[Castov-MCP] 10 Deterministic tools loaded</div>
            <div class="term-line t-green">✓ Glama Grade A Verified (Zero Telemetry)</div>
            <div class="term-box">
              <pre>{"jsonrpc":"2.0","id":1,"result":{"netmask":"255.255.0.0","hosts":65534,"status":"ok"}}</pre>
            </div>
            <div class="term-line t-dim">Execution time: 4.2ms • 0 bytes sent outside host</div>
          </div>
        </div>
      </div>
    `
  },
  {
    filename: "product-hunt-4-terminal-cli.png",
    badge: "STANDALONE CLI • ZERO DEPENDENCY INSTALLATION",
    badgeColor: "#f59e0b",
    title: "Instant Developer Utilities in Your Terminal",
    subtitle: "Inspect tokens, convert epochs, and scan secrets without leaving your command line.",
    content: `
      <div class="terminal-large">
        <div class="pane-bar">
          <div class="dots"><span class="d red"></span><span class="d yel"></span><span class="d grn"></span></div>
          <span>zsh — npx castov — 120x34</span>
        </div>
        <div class="term-body-large">
          <div class="term-block">
            <div class="cmd-line"><span class="p-arrow">➜</span> <span class="p-cmd">npx castov jwt eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</span></div>
            <div class="jwt-output">
              <div class="jwt-part">
                <span class="j-title">HEADER: Algorithm & Token Type</span>
                <span class="j-code">{ "alg": "HS256", "typ": "JWT" }</span>
              </div>
              <div class="jwt-part">
                <span class="j-title">PAYLOAD: Claims & Identity</span>
                <span class="j-code">{ "sub": "usr_9921", "name": "Abdel", "admin": true, "iat": 1730419200, "exp": 1730505600 }</span>
                <span class="j-expiry">STATUS: <strong class="text-green">ACTIVE</strong> (Expires in 23h 48m • ISO: 2026-11-02T00:00:00Z)</span>
              </div>
            </div>
          </div>

          <div class="term-block mt-4">
            <div class="cmd-line"><span class="p-arrow">➜</span> <span class="p-cmd">npx castov scan ./src --fail-on-secret</span></div>
            <div class="scan-output">
              <span class="s-pass">✓ Verified 148 files in 38ms</span>
              <span class="s-sub">Zero unencrypted credentials found • Git pre-commit certified</span>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    filename: "product-hunt-5-privacy-guarantee.png",
    badge: "VERIFIABLE SECURITY • AIRPLANE MODE CERTIFIED",
    badgeColor: "#10b981",
    title: "100% Local. Zero Data Leaves Your Machine.",
    subtitle: "All computation executes in browser memory via WebAssembly. Verify zero network requests in DevTools.",
    content: `
      <div class="privacy-split">
        <div class="card-guarantee">
          <div class="g-header">
            <span class="g-badge">AIRPLANE MODE TESTED</span>
            <span class="g-status">🟢 Zero-Data Logging Active</span>
          </div>
          <h3 class="g-title">Architectural Privacy By Design</h3>
          <ul class="g-list">
            <li><span class="chk">✓</span> <strong>100% Client-Side V8 Memory:</strong> Transform inputs without server roundtrips.</li>
            <li><span class="chk">✓</span> <strong>Strict CSP Enforcement:</strong> <code>connect-src 'none'</code> disables outgoing sockets.</li>
            <li><span class="chk">✓</span> <strong>Zero Behavioral Telemetry:</strong> No Google Analytics, no Hotjar, no tracking pixels.</li>
            <li><span class="chk">✓</span> <strong>Auditable Open Source:</strong> Vanilla JavaScript with no obfuscation.</li>
          </ul>
        </div>

        <div class="devtools-mock">
          <div class="dt-header">
            <span>Elements</span>
            <span>Console</span>
            <span>Sources</span>
            <span class="dt-active">Network</span>
            <span>Performance</span>
          </div>
          <div class="dt-table">
            <div class="dt-row dt-head">
              <span>Name</span>
              <span>Status</span>
              <span>Type</span>
              <span>Size</span>
              <span>Time</span>
            </div>
            <div class="dt-empty">
              <div class="empty-icon">🛡️</div>
              <div class="empty-title">Zero Network Requests Recorded</div>
              <div class="empty-sub">Castov executed your conversion completely in local memory.</div>
            </div>
          </div>
          <div class="dt-footer">
            <span>0 requests</span>
            <span>0 B transferred</span>
            <span>0 ms network latency</span>
          </div>
        </div>
      </div>
    `
  },
  {
    filename: "product-hunt-6-tools-matrix.png",
    badge: "61 IN-BROWSER DEVELOPER UTILITIES",
    badgeColor: "#00b4f5",
    title: "The Ultimate Offline Developer Suite",
    subtitle: "Fast, ad-free, and accessible in seconds. Free forever and open source under MIT.",
    content: `
      <div class="matrix-grid">
        <div class="m-card">
          <div class="mc-icon">🔑</div>
          <div class="mc-info">
            <h4>JWT Inspector</h4>
            <p>Decode claims & verify expiration</p>
          </div>
        </div>
        <div class="m-card">
          <div class="mc-icon">⏰</div>
          <div class="mc-info">
            <h4>Cron Generator</h4>
            <p>Parse & schedule syntax with timezone</p>
          </div>
        </div>
        <div class="m-card">
          <div class="mc-icon">⚖️</div>
          <div class="mc-info">
            <h4>Diff Checker</h4>
            <p>Client-side Myers code comparison</p>
          </div>
        </div>
        <div class="m-card">
          <div class="mc-icon">📡</div>
          <div class="mc-info">
            <h4>Webhook Tester</h4>
            <p>Inspect live HTTP & Stripe payloads</p>
          </div>
        </div>
        <div class="m-card">
          <div class="mc-icon">🗄️</div>
          <div class="mc-info">
            <h4>SQLite Fiddle</h4>
            <p>In-browser WASM database sandbox</p>
          </div>
        </div>
        <div class="m-card">
          <div class="mc-icon">🔐</div>
          <div class="mc-info">
            <h4>Cyber Decoder</h4>
            <p>Hashes, Base64 & cryptographic ciphers</p>
          </div>
        </div>
        <div class="m-card">
          <div class="mc-icon">🔄</div>
          <div class="mc-info">
            <h4>cURL to Code</h4>
            <p>Convert requests to Python, TS & Go</p>
          </div>
        </div>
        <div class="m-card">
          <div class="mc-icon">🌐</div>
          <div class="mc-info">
            <h4>CIDR Calculator</h4>
            <p>IPv4/IPv6 subnet calculation & masks</p>
          </div>
        </div>
      </div>
      <div class="matrix-bottom-bar">
        <span>⭐ Open Source on GitHub</span>
        <span>•</span>
        <span>No Registration Required</span>
        <span>•</span>
        <span>Built for Fast Engineers</span>
      </div>
    `
  }
];

function buildHtml(slide) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1270px;
      height: 760px;
      background: #080c16;
      background-image:
        radial-gradient(circle at 12% 15%, rgba(0, 180, 245, 0.16) 0%, transparent 45%),
        radial-gradient(circle at 88% 85%, rgba(37, 99, 235, 0.18) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.7) 0%, transparent 80%);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 44px 56px 40px;
      overflow: hidden;
      position: relative;
    }

    /* Ambient fine grid */
    .grid-mesh {
      position: absolute;
      inset: 0;
      background-size: 36px 36px;
      background-image:
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      pointer-events: none;
    }

    /* Header text block */
    .slide-top {
      position: relative;
      z-index: 2;
    }

    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 13px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      background: rgba(0, 180, 245, 0.1);
      border: 1px solid rgba(0, 180, 245, 0.3);
      color: ${slide.badgeColor || "#00b4f5"};
      margin-bottom: 12px;
    }

    .slide-title {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.6px;
      color: #ffffff;
      line-height: 1.2;
    }

    .slide-sub {
      font-size: 15px;
      color: #94a3b8;
      margin-top: 6px;
      font-weight: 400;
    }

    /* Main visual content container */
    .slide-center {
      position: relative;
      z-index: 2;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 20px;
      min-height: 480px;
    }

    /* Mock browser styling */
    .mock-browser {
      width: 100%;
      height: 470px;
      background: #0d1322;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(0, 180, 245, 0.1);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .m-header {
      height: 42px;
      background: #090e1a;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
    }

    .dots { display: flex; gap: 7px; }
    .d { width: 11px; height: 11px; border-radius: 50%; }
    .d.red { background: #ef4444; }
    .d.yel { background: #f59e0b; }
    .d.grn { background: #10b981; }

    .url-bar {
      font-size: 12px;
      font-family: monospace;
      color: #94a3b8;
      background: rgba(255, 255, 255, 0.04);
      padding: 5px 24px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .header-right {
      font-size: 11px;
      font-weight: 600;
      color: #10b981;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
    }

    .shield-active {
      color: #00b4f5;
      font-weight: 700;
    }

    .m-body {
      flex: 1;
      padding: 16px 20px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Hero Layout Inside Browser */
    .hero-grid-layout {
      gap: 16px;
    }

    .nav-fake {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-text {
      font-size: 17px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.3px;
    }

    .tag {
      font-size: 10px;
      font-weight: 800;
      background: rgba(0, 180, 245, 0.15);
      color: #00b4f5;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .nav-links {
      display: flex;
      gap: 18px;
      font-size: 13px;
      color: #94a3b8;
    }

    .nav-item.active {
      color: #f8fafc;
      font-weight: 600;
    }

    .sub-pill {
      font-size: 9px;
      padding: 1px 5px;
      background: #10b981;
      color: #000;
      font-weight: 800;
      border-radius: 4px;
      margin-left: 3px;
    }

    .search-fake {
      font-size: 12px;
      background: rgba(255, 255, 255, 0.05);
      padding: 6px 14px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #64748b;
    }

    .cards-showcase {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-top: 10px;
    }

    .feature-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .feature-card.c-glow {
      background: linear-gradient(135deg, rgba(0, 180, 245, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%);
      border: 1px solid rgba(0, 180, 245, 0.35);
    }

    .c-head {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .c-icon { font-size: 18px; }
    .c-title { font-size: 14px; font-weight: 700; color: #f1f5f9; }
    .c-badge {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      margin-left: auto;
    }

    .c-desc {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.4;
    }

    .c-meta {
      margin-top: auto;
      font-size: 10.5px;
      font-weight: 600;
      color: #10b981;
    }

    /* Slide 2: Chat & Modal simulation */
    .chat-sim {
      padding: 0;
      background: #090e1a;
      position: relative;
    }

    .chat-bg-dark {
      height: 100%;
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    .chat-bubble.ai {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      max-width: 600px;
      font-size: 13.5px;
      line-height: 1.5;
      color: #cbd5e1;
    }

    .ai-avatar {
      font-size: 22px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 4px;
    }

    .shadow-modal-overlay {
      position: absolute;
      inset: 0;
      background: rgba(8, 12, 22, 0.85);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }

    .modal-box {
      width: 580px;
      background: #0e1526;
      border: 1px solid rgba(0, 180, 245, 0.4);
      border-top: 4px solid #00b4f5;
      border-radius: 14px;
      padding: 22px 26px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .modal-header {
      display: flex;
      gap: 14px;
      align-items: center;
    }

    .modal-icon-badge {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }

    .modal-title { font-size: 17px; font-weight: 700; color: #f8fafc; }
    .modal-sub { font-size: 12.5px; color: #94a3b8; }

    .secret-items {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .s-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      padding: 4px 0;
    }

    .s-label { color: #cbd5e1; font-weight: 500; }
    .s-code { color: #ef4444; font-family: monospace; font-weight: 700; }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 4px;
    }

    .m-btn {
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      border: none;
      cursor: pointer;
    }

    .m-cancel { background: rgba(255, 255, 255, 0.08); color: #94a3b8; }
    .m-orig { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
    .m-redact { background: #00b4f5; color: #020617; font-weight: 800; box-shadow: 0 0 15px rgba(0, 180, 245, 0.4); }

    .modal-foot {
      font-size: 10.5px;
      color: #64748b;
      text-align: center;
    }

    .fake-input-bar {
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      padding: 14px 18px;
      color: #64748b;
      font-size: 13px;
    }

    /* Slide 3: MCP Grid */
    .mcp-grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 18px;
      width: 100%;
      height: 460px;
    }

    .ide-pane, .terminal-pane {
      background: #0d1322;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .pane-bar {
      height: 38px;
      background: #080c16;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 0 14px;
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
    }

    .ide-body, .term-body {
      padding: 16px;
      font-size: 12.5px;
      line-height: 1.5;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .tool-call-card {
      background: rgba(0, 180, 245, 0.08);
      border: 1px solid rgba(0, 180, 245, 0.25);
      border-radius: 8px;
      padding: 10px 14px;
    }

    .t-badge { font-size: 11px; font-weight: 700; color: #00b4f5; margin-bottom: 4px; }
    .t-code { font-family: monospace; color: #38bdf8; font-size: 11.5px; }

    .term-body {
      background: #050811;
      font-family: monospace;
      font-size: 11.5px;
    }

    .term-line { margin: 2px 0; }
    .t-green { color: #10b981; font-weight: 700; }
    .t-cyan { color: #00b4f5; }
    .t-dim { color: #64748b; }
    .term-box {
      background: #090e1a;
      border: 1px solid #1e293b;
      border-radius: 6px;
      padding: 10px;
      color: #38bdf8;
      overflow-x: auto;
    }

    /* Slide 4: Large Terminal */
    .terminal-large {
      width: 100%;
      height: 460px;
      background: #070b14;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .term-body-large {
      padding: 22px;
      font-family: monospace;
      font-size: 12.5px;
      line-height: 1.6;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .p-arrow { color: #10b981; font-weight: 800; }
    .p-cmd { color: #f8fafc; font-weight: 600; }

    .jwt-output {
      background: #0c1220;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 12px 16px;
      margin-top: 6px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .j-title { font-size: 10.5px; color: #64748b; text-transform: uppercase; font-weight: 700; }
    .j-code { color: #38bdf8; }
    .j-expiry { font-size: 11px; margin-top: 4px; }
    .text-green { color: #10b981; font-weight: 700; }

    .scan-output {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .s-pass { color: #10b981; font-weight: 700; }
    .s-sub { color: #94a3b8; font-size: 11.5px; }

    /* Slide 5: Privacy Split */
    .privacy-split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      width: 100%;
      height: 460px;
    }

    .card-guarantee {
      background: #0d1322;
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 14px;
      padding: 26px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .g-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .g-badge {
      font-size: 10.5px;
      font-weight: 800;
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      padding: 4px 10px;
      border-radius: 999px;
    }

    .g-status { font-size: 11px; font-weight: 700; color: #10b981; }
    .g-title { font-size: 22px; font-weight: 800; color: #f8fafc; margin-top: 14px; }

    .g-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 16px;
      font-size: 13px;
      color: #cbd5e1;
      line-height: 1.45;
    }

    .chk { color: #10b981; font-weight: 800; margin-right: 6px; }

    .devtools-mock {
      background: #070a12;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .dt-header {
      height: 38px;
      background: #0a0f1a;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 0 16px;
      font-size: 12px;
      color: #64748b;
    }

    .dt-active {
      color: #00b4f5;
      font-weight: 700;
      border-bottom: 2px solid #00b4f5;
      padding: 9px 0 7px;
    }

    .dt-table {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .dt-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
      padding: 8px 16px;
      font-size: 11px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: #64748b;
    }

    .dt-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 20px;
    }

    .empty-icon { font-size: 32px; margin-bottom: 10px; }
    .empty-title { font-size: 15px; font-weight: 700; color: #10b981; }
    .empty-sub { font-size: 12px; color: #64748b; margin-top: 4px; max-width: 320px; }

    .dt-footer {
      height: 30px;
      background: #090e18;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 0 16px;
      font-size: 11px;
      color: #94a3b8;
    }

    /* Slide 6: Matrix Grid */
    .matrix-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      width: 100%;
    }

    .m-card {
      background: #0d1322;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.2s;
    }

    .mc-icon {
      font-size: 24px;
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .mc-info h4 { font-size: 13.5px; font-weight: 700; color: #f8fafc; }
    .mc-info p { font-size: 11px; color: #94a3b8; margin-top: 2px; }

    .matrix-bottom-bar {
      margin-top: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      font-size: 12.5px;
      color: #38bdf8;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
  </style>
</head>
<body>
  <div class="grid-mesh"></div>

  <div class="slide-top">
    <div class="badge-pill">${slide.badge}</div>
    <h1 class="slide-title">${slide.title}</h1>
    <p class="slide-sub">${slide.subtitle}</p>
  </div>

  <div class="slide-center">
    ${slide.content}
  </div>
</body>
</html>`;
}

async function main() {
  console.log("Generating 6 Product Hunt gallery images (1270 x 760)...");

  for (let i = 0; i < SLIDES.length; i++) {
    const slide = SLIDES[i];
    const htmlPath = path.resolve(outputDir, `temp-${i}.html`);
    const outPath = path.resolve(outputDir, slide.filename);

    fs.writeFileSync(htmlPath, buildHtml(slide), "utf8");

    console.log(`[${i + 1}/6] Capturing: ${slide.filename}...`);
    await execFileAsync(CHROME_PATH, [
      "--headless=new",
      `--screenshot=${outPath}`,
      "--window-size=1270,760",
      "--default-background-color=00000000",
      "--hide-scrollbars",
      "--disable-gpu",
      `file:///${htmlPath.replace(/\\/g, "/")}`
    ]);

    fs.unlinkSync(htmlPath);
  }

  console.log("All 6 Product Hunt images generated successfully!");
}

main().catch((err) => {
  console.error("Failed to generate Product Hunt images:", err);
  process.exit(1);
});
