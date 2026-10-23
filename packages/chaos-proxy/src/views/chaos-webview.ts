import * as vscode from "vscode";
import { ProxyEngine } from "../server/proxy-engine";
import { ChaosRule, InterceptedRequest } from "../types/chaos";

export class ChaosWebviewPanel {
  public static currentPanel: ChaosWebviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private engine: ProxyEngine;
  private trafficLogs: InterceptedRequest[] = [];

  public static createOrShow(extensionUri: vscode.Uri, engine: ProxyEngine) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (ChaosWebviewPanel.currentPanel) {
      ChaosWebviewPanel.currentPanel.panel.reveal(column);
      ChaosWebviewPanel.currentPanel.syncStatus();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "chaosProxyDashboard",
      "Chaos Proxy Control Panel",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    ChaosWebviewPanel.currentPanel = new ChaosWebviewPanel(panel, extensionUri, engine);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly extensionUri: vscode.Uri,
    engine: ProxyEngine
  ) {
    this.panel = panel;
    this.engine = engine;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async (msg: any) => {
        switch (msg.command) {
          case "toggleProxy":
            if (this.engine.getStatus().running) {
              await this.engine.stop();
            } else {
              await this.engine.start(msg.port || 8080);
            }
            this.syncStatus();
            break;
          case "toggleRule":
            this.engine.toggleRule(msg.ruleId);
            this.syncStatus();
            break;
          case "addRule":
            const currentRules = this.engine.getStatus().rules;
            const newRule: ChaosRule = {
              id: `rule-${Date.now()}`,
              name: msg.name || "Custom Rule",
              enabled: true,
              urlPattern: msg.urlPattern || "*",
              method: msg.method || "*",
              fault: msg.fault || "rate_limit_429",
              latencyMs: msg.latencyMs ? parseInt(msg.latencyMs, 10) : undefined,
              probability: parseFloat(msg.probability || "1.0"),
              mockBody: msg.mockBody,
            };
            this.engine.setRules([...currentRules, newRule]);
            this.syncStatus();
            break;
          case "deleteRule":
            const filtered = this.engine.getStatus().rules.filter((r) => r.id !== msg.ruleId);
            this.engine.setRules(filtered);
            this.syncStatus();
            break;
          case "clearLogs":
            this.trafficLogs = [];
            this.panel.webview.postMessage({ type: "clearLogs" });
            break;
        }
      },
      null,
      this.disposables
    );

    this.engine.on("statusChanged", () => this.syncStatus());
    this.engine.on("rulesChanged", () => this.syncStatus());
    this.engine.on("intercepted", (entry: InterceptedRequest) => {
      this.trafficLogs.unshift(entry);
      if (this.trafficLogs.length > 100) this.trafficLogs.pop();
      this.panel.webview.postMessage({ type: "newLog", entry });
    });

    this.updateContent();
  }

  public syncStatus() {
    this.panel.webview.postMessage({
      type: "statusUpdate",
      status: this.engine.getStatus(),
    });
  }

  public dispose() {
    ChaosWebviewPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }

  private updateContent() {
    this.panel.webview.html = this.getHtml();
  }

  private getHtml(): string {
    const status = this.engine.getStatus();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chaos Proxy</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background, #090d16);
      --sidebar: var(--vscode-sideBar-background, #0f172a);
      --text: var(--vscode-editor-foreground, #f8fafc);
      --muted: var(--vscode-descriptionForeground, #94a3b8);
      --border: var(--vscode-widget-border, #1e293b);
      --accent: var(--vscode-button-background, #3b82f6);
      --accent-hover: var(--vscode-button-hoverBackground, #2563eb);
      --danger: #ef4444;
      --warning: #f59e0b;
      --success: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      padding: 16px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .title {
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
      display: inline-block;
    }
    .badge.active { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge.stopped { background: rgba(148, 163, 184, 0.15); color: var(--muted); border: 1px solid var(--border); }
    .badge.danger { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge.warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .btn {
      background: var(--accent);
      color: #fff;
      border: none;
      padding: 8px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn:hover { background: var(--accent-hover); }
    .btn-danger { background: var(--danger); }
    .btn-danger:hover { background: #dc2626; }
    .btn-secondary {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text);
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.05); }
    .hero-card {
      background: var(--sidebar);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .card {
      background: var(--sidebar);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .card:hover { border-color: var(--accent); }
    .card.enabled {
      background: rgba(59, 130, 246, 0.1);
      border-color: var(--accent);
    }
    .card-title { font-weight: 600; font-size: 13px; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; }
    .card-desc { font-size: 11px; color: var(--muted); }
    .form-box {
      background: var(--sidebar);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    input, select, textarea {
      background: #020617;
      color: var(--text);
      border: 1px solid var(--border);
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 12px;
      outline: none;
      width: 100%;
    }
    input:focus, select:focus { border-color: var(--accent); }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      font-family: monospace;
      background: var(--sidebar);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th { color: var(--muted); font-weight: 600; background: rgba(0,0,0,0.2); }
    .status-pill {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
    }
    .s-429 { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .s-500 { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .s-200 { background: rgba(16, 185, 129, 0.2); color: #10b981; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">
      <span>⚡ Castov Chaos Proxy</span>
      <span id="proxyBadge" class="badge ${status.running ? "active" : "stopped"}">
        ${status.running ? "ACTIVE on http://127.0.0.1:" + status.port : "STOPPED"}
      </span>
    </div>
    <div style="display:flex; gap:8px;">
      <button class="btn ${status.running ? "btn-danger" : ""}" id="toggleBtn" onclick="toggleProxy()">
        ${status.running ? "⏹ Stop Proxy" : "▶ Start Proxy"}
      </button>
    </div>
  </div>

  <div class="hero-card">
    <div>
      <div style="font-weight:600; margin-bottom:4px;">Local Proxy Address:</div>
      <code id="proxyUrl" style="font-size:14px; color:#60a5fa;">http://127.0.0.1:${status.port}</code>
      <p style="font-size:11px; color:var(--muted); margin-top:4px;">
        Point your app's HTTP client or base URL to this port to test how your system reacts to failures.
      </p>
    </div>
    <div style="text-align:right;">
      <div style="font-size:20px; font-weight:700;" id="statFaults">${status.faultCount}</div>
      <div style="font-size:11px; color:var(--muted)">Faults Injected</div>
    </div>
  </div>

  <h3 style="margin-bottom:10px;">Preset Fault Injection</h3>
  <div class="grid" id="presetGrid"></div>

  <h3 style="margin-bottom:10px;">Custom Interception Rule</h3>
  <div class="form-box">
    <form onsubmit="addCustomRule(event)">
      <div class="form-row">
        <input type="text" id="ruleName" placeholder="Rule Name (e.g. Stripe Webhook 429)" required>
        <select id="ruleMethod">
          <option value="*">All Methods (*)</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input type="text" id="ruleUrl" placeholder="URL Pattern (e.g. /api/users or *)" value="*" required>
        <select id="ruleFault">
          <option value="rate_limit_429">429 Rate Limit</option>
          <option value="internal_error_500">500 Server Error</option>
          <option value="bad_gateway_502">502 Bad Gateway</option>
          <option value="timeout_504">504 Timeout</option>
          <option value="high_latency">High Latency (Delay)</option>
          <option value="drop_connection">Drop Socket / Reset</option>
          <option value="mock_payload">Custom Mock JSON</option>
        </select>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:11px; color:var(--muted)">Rule applies immediately to any matching request passing through the proxy.</span>
        <button type="submit" class="btn">➕ Add & Activate Rule</button>
      </div>
    </form>
  </div>

  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
    <h3>Interception & Traffic Log</h3>
    <button class="btn btn-secondary" onclick="clearLogs()">Clear Log</button>
  </div>
  <table>
    <thead>
      <tr>
        <th>Time</th>
        <th>Method</th>
        <th>URL</th>
        <th>Fault Injected</th>
        <th>Status</th>
        <th>Latency</th>
      </tr>
    </thead>
    <tbody id="trafficBody">
      <tr><td colspan="6" style="text-align:center; color:var(--muted); padding:16px;">No traffic intercepted yet. Send requests to http://127.0.0.1:${status.port}</td></tr>
    </tbody>
  </table>

  <script>
    const vscode = acquireVsCodeApi();
    let currentStatus = ${JSON.stringify(status)};
    let logs = [];

    window.addEventListener("message", (event) => {
      const msg = event.data;
      if (msg.type === "statusUpdate") {
        currentStatus = msg.status;
        renderStatus();
      } else if (msg.type === "newLog") {
        logs.unshift(msg.entry);
        if (logs.length > 50) logs.pop();
        renderLogs();
      } else if (msg.type === "clearLogs") {
        logs = [];
        renderLogs();
      }
    });

    function renderStatus() {
      const badge = document.getElementById("proxyBadge");
      const toggleBtn = document.getElementById("toggleBtn");
      const proxyUrl = document.getElementById("proxyUrl");
      const statFaults = document.getElementById("statFaults");

      if (currentStatus.running) {
        badge.textContent = "ACTIVE on http://127.0.0.1:" + currentStatus.port;
        badge.className = "badge active";
        toggleBtn.textContent = "⏹ Stop Proxy";
        toggleBtn.className = "btn btn-danger";
      } else {
        badge.textContent = "STOPPED";
        badge.className = "badge stopped";
        toggleBtn.textContent = "▶ Start Proxy";
        toggleBtn.className = "btn";
      }

      proxyUrl.textContent = "http://127.0.0.1:" + currentStatus.port;
      statFaults.textContent = currentStatus.faultCount;

      renderPresets();
    }

    function renderPresets() {
      const container = document.getElementById("presetGrid");
      container.innerHTML = currentStatus.rules.map(r => \`
        <div class="card \${r.enabled ? 'enabled' : ''}" onclick="toggleRule('\${r.id}')">
          <div class="card-title">
            <span>\${r.name}</span>
            <span class="badge \${r.enabled ? 'active' : 'stopped'}">\${r.enabled ? 'ON' : 'OFF'}</span>
          </div>
          <div class="card-desc">\${r.fault} • Method: \${r.method} • Pattern: \${r.urlPattern}</div>
        </div>
      \`).join("");
    }

    function renderLogs() {
      const tbody = document.getElementById("trafficBody");
      if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:16px;">No traffic intercepted yet. Send requests to http://127.0.0.1:' + currentStatus.port + '</td></tr>';
        return;
      }

      tbody.innerHTML = logs.map(l => {
        let pillClass = "s-200";
        if (l.statusCode >= 500) pillClass = "s-500";
        else if (l.statusCode === 429) pillClass = "s-429";

        return \`
          <tr>
            <td style="color:var(--muted)">\${l.timestamp}</td>
            <td style="font-weight:600">\${l.method}</td>
            <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis">\${l.url}</td>
            <td style="color:#60a5fa">\${l.faultApplied || "None"}</td>
            <td><span class="status-pill \${pillClass}">\${l.statusCode}</span></td>
            <td>\${l.latencyMs}ms</td>
          </tr>
        \`;
      }).join("");
    }

    function toggleProxy() {
      vscode.postMessage({ command: "toggleProxy" });
    }

    function toggleRule(ruleId) {
      vscode.postMessage({ command: "toggleRule", ruleId });
    }

    function addCustomRule(e) {
      e.preventDefault();
      vscode.postMessage({
        command: "addRule",
        name: document.getElementById("ruleName").value,
        method: document.getElementById("ruleMethod").value,
        urlPattern: document.getElementById("ruleUrl").value,
        fault: document.getElementById("ruleFault").value,
      });
      document.getElementById("ruleName").value = "";
    }

    function clearLogs() {
      vscode.postMessage({ command: "clearLogs" });
    }

    renderStatus();
  </script>
</body>
</html>`;
  }
}
