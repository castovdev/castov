import * as vscode from "vscode";
import { WebhookReceiverServer } from "../server/receiver-server";
import { WebhookForwarder } from "../server/forwarder";
import { CapturedWebhook, ServerStatus } from "../types/webhook";

export class WebhookCatcherWebviewPanel {
  public static currentPanel: WebhookCatcherWebviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private server: WebhookReceiverServer;

  public static createOrShow(extensionUri: vscode.Uri, server: WebhookReceiverServer) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (WebhookCatcherWebviewPanel.currentPanel) {
      WebhookCatcherWebviewPanel.currentPanel.panel.reveal(column);
      WebhookCatcherWebviewPanel.currentPanel.syncState();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "webhookCatcherDashboard",
      "Webhook Catcher & Replayer",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    WebhookCatcherWebviewPanel.currentPanel = new WebhookCatcherWebviewPanel(
      panel,
      extensionUri,
      server
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly extensionUri: vscode.Uri,
    server: WebhookReceiverServer
  ) {
    this.panel = panel;
    this.server = server;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async (msg: any) => {
        switch (msg.command) {
          case "toggleServer":
            if (this.server.getStatus().running) {
              await this.server.stop();
            } else {
              await this.server.start(msg.port || 9090);
            }
            this.syncState();
            break;
          case "updateTargetUrl":
            this.server.setTargetUrl(msg.targetUrl);
            break;
          case "updateAutoForward":
            this.server.setAutoForward(msg.enabled);
            break;
          case "replayWebhook":
            await this.handleReplay(msg.webhookId, msg.targetUrl);
            break;
          case "copyCurl":
            this.handleCopyCurl(msg.webhookId, msg.targetUrl);
            break;
          case "clearAll":
            this.server.clearWebhooks();
            this.syncState();
            break;
        }
      },
      null,
      this.disposables
    );

    this.server.on("statusChanged", () => this.syncState());
    this.server.on("webhookReceived", (whk: CapturedWebhook) => {
      this.panel.webview.postMessage({ type: "newWebhook", webhook: whk });
    });
    this.server.on("forwardResult", (data) => {
      this.panel.webview.postMessage({ type: "forwardResult", ...data });
    });
    this.server.on("cleared", () => this.syncState());

    this.updateContent();
  }

  private async handleReplay(webhookId: string, customTargetUrl?: string) {
    const whk = this.server.getWebhooks().find((w) => w.id === webhookId);
    if (!whk) return;

    const target = customTargetUrl || this.server.getStatus().targetUrl;
    const result = await WebhookForwarder.forward(whk, target);
    whk.forwardHistory.unshift(result);

    this.panel.webview.postMessage({
      type: "forwardResult",
      webhookId,
      result,
    });

    if (result.statusCode >= 200 && result.statusCode < 300) {
      vscode.window.showInformationMessage(
        `Webhook Replayed: ${result.statusCode} OK (${result.durationMs}ms)`
      );
    } else {
      vscode.window.showWarningMessage(
        `Webhook Replay Failed (${result.statusCode || "Error"}): ${result.error || "Check terminal logs"}`
      );
    }
  }

  private handleCopyCurl(webhookId: string, targetUrl: string) {
    const whk = this.server.getWebhooks().find((w) => w.id === webhookId);
    if (!whk) return;
    const curl = WebhookForwarder.generateCurl(whk, targetUrl || this.server.getStatus().targetUrl);
    vscode.env.clipboard.writeText(curl);
    vscode.window.showInformationMessage("Copied cURL command to clipboard!");
  }

  public syncState() {
    this.panel.webview.postMessage({
      type: "stateSync",
      status: this.server.getStatus(),
      webhooks: this.server.getWebhooks(),
    });
  }

  public dispose() {
    WebhookCatcherWebviewPanel.currentPanel = undefined;
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
    const status = this.server.getStatus();
    const webhooks = this.server.getWebhooks();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Webhook Catcher</title>
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
    .btn {
      background: var(--accent);
      color: #fff;
      border: none;
      padding: 6px 14px;
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
    .badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      display: inline-block;
    }
    .badge.active { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .badge.stopped { background: rgba(148, 163, 184, 0.15); color: var(--muted); }
    .badge.stripe { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
    .badge.github { background: rgba(243, 244, 246, 0.15); color: #e5e7eb; }
    .badge.shopify { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .badge.slack { background: rgba(236, 72, 153, 0.2); color: #f472b6; }
    .badge.custom { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .hero-config {
      background: var(--sidebar);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 16px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      align-items: center;
    }
    input {
      background: #020617;
      color: var(--text);
      border: 1px solid var(--border);
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      outline: none;
      width: 100%;
    }
    input:focus { border-color: var(--accent); }
    .split-layout {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 16px;
      height: calc(100vh - 180px);
    }
    .list-pane {
      background: var(--sidebar);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow-y: auto;
    }
    .detail-pane {
      background: var(--sidebar);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    .webhook-item {
      padding: 10px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      cursor: pointer;
      transition: background 0.15s;
    }
    .webhook-item:hover { background: rgba(255, 255, 255, 0.04); }
    .webhook-item.active {
      background: rgba(59, 130, 246, 0.15);
      border-left: 3px solid var(--accent);
    }
    .wh-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .wh-event { font-weight: 600; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .wh-meta { font-size: 11px; color: var(--muted); }
    .code-box {
      background: #020617;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px;
      font-family: monospace;
      font-size: 12px;
      overflow-x: auto;
      white-space: pre-wrap;
      max-height: 400px;
    }
    .headers-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      font-family: monospace;
      margin-top: 8px;
    }
    .headers-table th, .headers-table td {
      padding: 6px 10px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    .headers-table th { color: var(--muted); }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">
      <span>🎣 Castov Webhook Catcher</span>
      <span id="serverBadge" class="badge ${status.running ? "active" : "stopped"}">
        ${status.running ? "LISTENING on " + status.endpointUrl : "STOPPED"}
      </span>
    </div>
    <div style="display:flex; gap:8px;">
      <button class="btn ${status.running ? "btn-danger" : ""}" id="toggleBtn" onclick="toggleServer()">
        ${status.running ? "⏹ Stop Server" : "▶ Start Server"}
      </button>
      <button class="btn btn-secondary" onclick="clearAll()">Clear All</button>
    </div>
  </div>

  <div class="hero-config">
    <div>
      <label style="font-size:11px; color:var(--muted); font-weight:600; display:block; margin-bottom:4px;">
        Local Webhook Endpoint (Send events here):
      </label>
      <code id="endpointUrl" style="font-size:13px; color:#60a5fa; cursor:pointer;" onclick="copyEndpoint()" title="Click to copy">
        ${status.endpointUrl}
      </code>
    </div>
    <div>
      <label style="font-size:11px; color:var(--muted); font-weight:600; display:block; margin-bottom:4px;">
        Forward Target (e.g. your local Next.js / Express API):
      </label>
      <div style="display:flex; gap:8px; align-items:center;">
        <input type="text" id="targetUrlInput" value="${status.targetUrl}" onchange="updateTargetUrl(this.value)">
        <label style="display:flex; align-items:center; gap:4px; font-size:11px; color:var(--muted); white-space:nowrap;">
          <input type="checkbox" id="autoForwardCheck" ${status.autoForward ? "checked" : ""} onchange="updateAutoForward(this.checked)"> Auto
        </label>
      </div>
    </div>
  </div>

  <div class="split-layout">
    <div class="list-pane" id="webhookList"></div>

    <div class="detail-pane" id="detailPane">
      <div id="noSelectionMsg" style="text-align:center; padding:50px; color:var(--muted);">
        Select a captured webhook from the list to inspect its headers and payload.
      </div>
      <div id="selectionContent" style="display:none;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div>
            <h3 id="whDetailEvent" style="font-size:15px;">Event Name</h3>
            <span id="whDetailMeta" style="font-size:11px; color:var(--muted);">Meta info</span>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn" onclick="replayActive()">🔁 Replay to Localhost</button>
            <button class="btn btn-secondary" onclick="copyCurlActive()">📋 Copy cURL</button>
          </div>
        </div>

        <h4 style="margin-top:10px; margin-bottom:6px; font-size:12px;">Payload Body</h4>
        <div class="code-box" id="whPayloadBox"></div>

        <h4 style="margin-top:16px; margin-bottom:6px; font-size:12px;">HTTP Headers</h4>
        <table class="headers-table">
          <thead>
            <tr><th>Header</th><th>Value</th></tr>
          </thead>
          <tbody id="whHeadersBody"></tbody>
        </table>

        <h4 style="margin-top:16px; margin-bottom:6px; font-size:12px;">Replay History</h4>
        <div id="whHistoryBox" style="font-size:11px; color:var(--muted);">No replay attempts yet.</div>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let currentStatus = ${JSON.stringify(status)};
    let webhooks = ${JSON.stringify(webhooks)};
    let activeWebhook = webhooks[0] || null;

    window.addEventListener("message", (event) => {
      const msg = event.data;
      if (msg.type === "stateSync") {
        currentStatus = msg.status;
        webhooks = msg.webhooks;
        renderAll();
      } else if (msg.type === "newWebhook") {
        webhooks.unshift(msg.webhook);
        if (webhooks.length > 50) webhooks.pop();
        if (!activeWebhook) activeWebhook = msg.webhook;
        renderAll();
      } else if (msg.type === "forwardResult") {
        const wh = webhooks.find(w => w.id === msg.webhookId);
        if (wh) {
          wh.forwardHistory.unshift(msg.result);
          if (activeWebhook && activeWebhook.id === wh.id) {
            renderActiveDetail();
          }
        }
      }
    });

    function renderAll() {
      // Header status
      const badge = document.getElementById("serverBadge");
      const toggleBtn = document.getElementById("toggleBtn");
      const endpointEl = document.getElementById("endpointUrl");

      if (currentStatus.running) {
        badge.textContent = "LISTENING on " + currentStatus.endpointUrl;
        badge.className = "badge active";
        toggleBtn.textContent = "⏹ Stop Server";
        toggleBtn.className = "btn btn-danger";
      } else {
        badge.textContent = "STOPPED";
        badge.className = "badge stopped";
        toggleBtn.textContent = "▶ Start Server";
        toggleBtn.className = "btn";
      }
      endpointEl.textContent = currentStatus.endpointUrl;

      // Webhook List
      const listEl = document.getElementById("webhookList");
      if (webhooks.length === 0) {
        listEl.innerHTML = '<div style="padding:24px; text-align:center; color:var(--muted); font-size:12px;">No webhooks received yet. Send a POST request to ' + currentStatus.endpointUrl + '</div>';
        document.getElementById("noSelectionMsg").style.display = "block";
        document.getElementById("selectionContent").style.display = "none";
        return;
      }

      listEl.innerHTML = webhooks.map(w => \`
        <div class="webhook-item \${activeWebhook && activeWebhook.id === w.id ? 'active' : ''}" onclick="selectWebhook('\${w.id}')">
          <div class="wh-top">
            <span class="badge \${w.sourceService.toLowerCase()}">\${w.sourceService.toUpperCase()}</span>
            <span class="wh-meta">\${w.timestamp}</span>
          </div>
          <div class="wh-event">\${w.eventType || w.path}</div>
          <div class="wh-meta">\${w.method} \${w.path} • \${w.bodyRaw.length} bytes</div>
        </div>
      \`).join("");

      renderActiveDetail();
    }

    function selectWebhook(id) {
      activeWebhook = webhooks.find(w => w.id === id) || null;
      renderAll();
    }

    function renderActiveDetail() {
      if (!activeWebhook) {
        document.getElementById("noSelectionMsg").style.display = "block";
        document.getElementById("selectionContent").style.display = "none";
        return;
      }

      document.getElementById("noSelectionMsg").style.display = "none";
      document.getElementById("selectionContent").style.display = "block";

      document.getElementById("whDetailEvent").textContent = (activeWebhook.eventType ? activeWebhook.eventType + " (" + activeWebhook.sourceService + ")" : activeWebhook.sourceService + " Webhook");
      document.getElementById("whDetailMeta").textContent = activeWebhook.method + " " + activeWebhook.path + " • Received at " + activeWebhook.timestamp;

      // Payload
      const payloadBox = document.getElementById("whPayloadBox");
      if (activeWebhook.bodyJson) {
        payloadBox.textContent = JSON.stringify(activeWebhook.bodyJson, null, 2);
      } else {
        payloadBox.textContent = activeWebhook.bodyRaw || "(Empty Body)";
      }

      // Headers table
      const headersBody = document.getElementById("whHeadersBody");
      headersBody.innerHTML = Object.entries(activeWebhook.headers).map(([k, v]) => \`
        <tr>
          <td style="font-weight:600; color:#60a5fa;">\${k}</td>
          <td>\${Array.isArray(v) ? v.join(", ") : v}</td>
        </tr>
      \`).join("");

      // History
      const historyBox = document.getElementById("whHistoryBox");
      if (activeWebhook.forwardHistory.length === 0) {
        historyBox.textContent = "No forward attempts recorded for this webhook.";
      } else {
        historyBox.innerHTML = activeWebhook.forwardHistory.map(h => \`
          <div style="padding:6px; background:#020617; border-radius:4px; margin-bottom:4px; display:flex; justify-content:space-between;">
            <span>\${h.timestamp} ➔ \${h.targetUrl}</span>
            <span style="font-weight:600; color:\${h.statusCode >= 200 && h.statusCode < 300 ? '#34d399' : '#f87171'}">
              \${h.statusCode || "Error"} (\${h.durationMs}ms)
            </span>
          </div>
        \`).join("");
      }
    }

    function toggleServer() {
      vscode.postMessage({ command: "toggleServer" });
    }

    function updateTargetUrl(val) {
      vscode.postMessage({ command: "updateTargetUrl", targetUrl: val });
    }

    function updateAutoForward(val) {
      vscode.postMessage({ command: "updateAutoForward", enabled: val });
    }

    function replayActive() {
      if (!activeWebhook) return;
      vscode.postMessage({
        command: "replayWebhook",
        webhookId: activeWebhook.id,
        targetUrl: document.getElementById("targetUrlInput").value
      });
    }

    function copyCurlActive() {
      if (!activeWebhook) return;
      vscode.postMessage({
        command: "copyCurl",
        webhookId: activeWebhook.id,
        targetUrl: document.getElementById("targetUrlInput").value
      });
    }

    function copyEndpoint() {
      navigator.clipboard.writeText(currentStatus.endpointUrl);
      vscode.postMessage({ command: "endpointCopied" });
    }

    function clearAll() {
      vscode.postMessage({ command: "clearAll" });
    }

    renderAll();
  </script>
</body>
</html>`;
  }
}
