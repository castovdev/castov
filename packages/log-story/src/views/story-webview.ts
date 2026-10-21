import * as vscode from "vscode";
import { LogParser } from "../parser/log-parser";
import { LogAnalysisReport, TraceStory } from "../types/log-story";

export class LogStoryWebviewPanel {
  public static currentPanel: LogStoryWebviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private lastReport: LogAnalysisReport | null = null;

  public static createOrShow(extensionUri: vscode.Uri, initialLogText?: string) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (LogStoryWebviewPanel.currentPanel) {
      LogStoryWebviewPanel.currentPanel.panel.reveal(column);
      if (initialLogText) {
        LogStoryWebviewPanel.currentPanel.analyzeLogs(initialLogText);
      }
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "logStoryDashboard",
      "Log Story & Root Cause Analyzer",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    LogStoryWebviewPanel.currentPanel = new LogStoryWebviewPanel(
      panel,
      extensionUri
    );

    if (initialLogText) {
      LogStoryWebviewPanel.currentPanel.analyzeLogs(initialLogText);
    }
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly extensionUri: vscode.Uri
  ) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async (msg: any) => {
        switch (msg.command) {
          case "analyze":
            this.analyzeLogs(msg.text);
            break;
          case "loadSample":
            this.loadSampleLogs();
            break;
          case "copyText":
            await vscode.env.clipboard.writeText(msg.text);
            vscode.window.showInformationMessage("Copied to clipboard!");
            break;
        }
      },
      null,
      this.disposables
    );

    this.panel.webview.html = this.getHtmlForWebview(null);
  }

  public analyzeLogs(rawText: string): void {
    const report = LogParser.analyze(rawText);
    this.lastReport = report;
    this.panel.webview.html = this.getHtmlForWebview(report);
  }

  public loadSampleLogs(): void {
    const sample = `2026-10-21 10:14:00.100 [INFO] [ApiGateway] request_id=req-99120 Incoming POST /v1/checkout from client
2026-10-21 10:14:00.145 [INFO] [AuthService] request_id=req-99120 Token verified for user_id=usr_8812
2026-10-21 10:14:00.200 [INFO] [OrderService] request_id=req-99120 Reserving inventory for items: [SKU-101, SKU-204]
2026-10-21 10:14:02.120 [FATAL] [PaymentService] request_id=req-99120 Connection refused to Postgres DB at 10.0.4.12:5432: Pool exhausted
  at ConnectionPool.acquire (pg-pool.js:45)
  at PaymentService.chargeCard (payment.service.ts:112)
2026-10-21 10:14:02.121 [ERROR] [PaymentService] request_id=req-99120 Connection refused to Postgres DB at 10.0.4.12:5432: Pool exhausted
2026-10-21 10:14:02.122 [ERROR] [PaymentService] request_id=req-99120 Connection refused to Postgres DB at 10.0.4.12:5432: Pool exhausted
2026-10-21 10:14:02.123 [ERROR] [PaymentService] request_id=req-99120 Connection refused to Postgres DB at 10.0.4.12:5432: Pool exhausted
2026-10-21 10:14:02.124 [ERROR] [PaymentService] request_id=req-99120 Connection refused to Postgres DB at 10.0.4.12:5432: Pool exhausted
2026-10-21 10:14:02.300 [WARN] [OrderService] request_id=req-99120 Payment failed for req-99120. Rolling back inventory reservation.
2026-10-21 10:14:02.350 [ERROR] [ApiGateway] request_id=req-99120 Handled 500 Internal Server Error returned to user`;

    this.analyzeLogs(sample);
  }

  public dispose() {
    LogStoryWebviewPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }

  private getHtmlForWebview(report: LogAnalysisReport | null): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Log Story & Root Cause Analyzer</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f2937;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #38bdf8;
      --danger: #f43f5e;
      --warning: #f59e0b;
      --success: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 24px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--card-border);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .badge-icon { font-size: 28px; }
    .header h1 { font-size: 22px; font-weight: 700; }
    .header p { font-size: 13px; color: var(--text-muted); }
    .btn {
      background: #1e293b;
      color: var(--text);
      border: 1px solid var(--card-border);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }
    .btn-primary { background: #0284c7; border-color: #0ea5e9; }
    .btn-primary:hover { background: #0369a1; }

    /* Root Cause Banner */
    .root-cause-banner {
      background: linear-gradient(135deg, #2b1117 0%, #170d12 100%);
      border: 2px solid #f43f5e;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 0 20px rgba(244, 63, 94, 0.15);
    }
    .root-cause-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .root-cause-badge {
      background: #f43f5e;
      color: #fff;
      font-size: 12px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .root-cause-msg {
      font-size: 15px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 8px;
    }
    .root-cause-meta {
      font-size: 12px;
      color: #fda4af;
      display: flex;
      gap: 16px;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      padding: 16px;
      border-radius: 8px;
    }
    .stat-val { font-size: 24px; font-weight: 700; margin-bottom: 2px; }
    .stat-lbl { font-size: 12px; color: var(--text-muted); text-transform: uppercase; }

    /* Input area */
    .input-box {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }
    textarea {
      width: 100%;
      height: 100px;
      background: #090e1a;
      border: 1px solid #1e293b;
      border-radius: 6px;
      color: #e2e8f0;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      margin-bottom: 12px;
      resize: vertical;
    }

    /* Trace Timeline */
    .timeline-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      margin-bottom: 20px;
      overflow: hidden;
    }
    .timeline-head {
      padding: 12px 16px;
      background: #141c2c;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .timeline-steps {
      padding: 16px;
    }
    .step-entry {
      display: flex;
      gap: 14px;
      position: relative;
      padding-bottom: 16px;
    }
    .step-entry:last-child { padding-bottom: 0; }
    .step-entry::before {
      content: "";
      position: absolute;
      left: 7px;
      top: 18px;
      bottom: 0;
      width: 2px;
      background: #1e293b;
    }
    .step-entry:last-child::before { display: none; }
    .step-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #38bdf8;
      border: 3px solid #090d16;
      flex-shrink: 0;
      margin-top: 4px;
    }
    .step-dot.error { background: #f43f5e; box-shadow: 0 0 10px #f43f5e; }
    .step-dot.warn { background: #f59e0b; }
    .step-content { flex: 1; }
    .step-meta {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 2px;
    }
    .step-service {
      font-weight: 700;
      color: #93c5fd;
    }
    .step-msg {
      font-family: monospace;
      font-size: 12px;
      background: #0a0f1d;
      padding: 6px 10px;
      border-radius: 4px;
      border: 1px solid #1e293b;
    }
    .step-msg.root-err {
      border-color: #f43f5e;
      background: #241117;
      color: #fecdd3;
    }
    .folded-badge {
      font-size: 10px;
      background: #334155;
      color: #cbd5e1;
      padding: 2px 6px;
      border-radius: 10px;
      margin-left: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <span class="badge-icon">📖</span>
      <div>
        <h1>Log Story & Root Cause Analyzer</h1>
        <p>Noise Folding, Correlation IDs, and Chronological Call Graph Reconstruction</p>
      </div>
    </div>
    <div>
      <button class="btn" onclick="loadSample()">⚡ Load Sample Cascade</button>
    </div>
  </div>

  <div class="input-box">
    <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">Paste Raw Logs to Analyze:</div>
    <textarea id="logInput" placeholder="Paste your server log dump or JSON logs here..."></textarea>
    <button class="btn btn-primary" onclick="submitLogs()">🚀 Build Log Story</button>
  </div>

  ${
    report?.rootCause
      ? `<div class="root-cause-banner">
          <div class="root-cause-header">
            <span class="root-cause-badge">🚨 Pinpointed Root Cause Failure</span>
            <button class="btn" onclick="copyText('${escapeJs(
              report.rootCause.message
            )}')">📋 Copy Cause</button>
          </div>
          <div class="root-cause-msg">${escapeHtml(report.rootCause.message)}</div>
          <div class="root-cause-meta">
            <span>🏛️ Service: <strong>${escapeHtml(
              report.rootCause.service
            )}</strong></span>
            <span>⏱️ Time: ${escapeHtml(report.rootCause.timestamp)}</span>
            ${
              report.rootCause.requestId
                ? `<span>🆔 Request ID: <code>${escapeHtml(
                    report.rootCause.requestId
                  )}</code></span>`
                : ""
            }
          </div>
          ${
            report.rootCause.stackTrace
              ? `<pre style="margin-top: 10px; font-size: 11px; background: #130a0d; padding: 10px; border-radius: 4px; overflow-x: auto; color: #fda4af;">${escapeHtml(
                  report.rootCause.stackTrace
                )}</pre>`
              : ""
          }
        </div>`
      : ""
  }

  ${
    report
      ? `<div class="stats-grid">
          <div class="stat-card">
            <div class="stat-val" style="color: #38bdf8;">${report.totalRawLines}</div>
            <div class="stat-lbl">Total Raw Lines</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" style="color: #10b981;">-${report.foldedLinesCount}</div>
            <div class="stat-lbl">Spam Repeats Folded</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" style="color: #a855f7;">${report.totalTraces}</div>
            <div class="stat-lbl">Traces Reconstructed</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" style="color: ${
              report.errorCount > 0 ? "#f43f5e" : "#10b981"
            };">${report.errorCount}</div>
            <div class="stat-lbl">Errors Detected</div>
          </div>
        </div>

        ${report.traces
          .map(
            (t) => `
        <div class="timeline-card">
          <div class="timeline-head">
            <div>
              <strong>Request Trace: <code>${escapeHtml(t.requestId)}</code></strong>
              <span style="font-size: 11px; color: #64748b; margin-left: 8px;">${t.steps.length} steps • ${t.servicesInvolved.join(" → ")}</span>
            </div>
            <span style="font-size: 12px; font-weight: 700; color: ${
              t.hasError ? "#f43f5e" : "#10b981"
            };">
              ${t.hasError ? "✗ Failed" : "✓ 200 OK"}
            </span>
          </div>
          <div class="timeline-steps">
            ${t.steps
              .map((s) => {
                const isErr = s.level === "ERROR" || s.level === "FATAL";
                const isWarn = s.level === "WARN";
                const dotClass = isErr ? "error" : isWarn ? "warn" : "";

                return `
              <div class="step-entry">
                <div class="step-dot ${dotClass}"></div>
                <div class="step-content">
                  <div class="step-meta">
                    <span class="step-service">${escapeHtml(s.service)}</span> • 
                    <span>${escapeHtml(s.timestamp)}</span>
                    ${
                      s.repeatCount > 1
                        ? `<span class="folded-badge">${s.repeatCount}x repeated</span>`
                        : ""
                    }
                  </div>
                  <div class="step-msg ${s.isRootCause ? "root-err" : ""}">
                    ${escapeHtml(s.message)}
                  </div>
                </div>
              </div>`;
              })
              .join("")}
          </div>
        </div>`
          )
          .join("")}`
      : ""
  }

  <script>
    const vscode = acquireVsCodeApi();

    function submitLogs() {
      const text = document.getElementById('logInput').value;
      if (!text.trim()) return;
      vscode.postMessage({ command: 'analyze', text: text });
    }

    function loadSample() {
      vscode.postMessage({ command: 'loadSample' });
    }

    function copyText(str) {
      vscode.postMessage({ command: 'copyText', text: str });
    }
  </script>
</body>
</html>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
