import * as vscode from "vscode";
import { MCPConfigFinder } from "../scanner/config-finder";
import { AuditSummary } from "../types/security";

export class MCPSecurityWebviewPanel {
  public static currentPanel: MCPSecurityWebviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private lastSummary: AuditSummary | undefined;

  public static async createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (MCPSecurityWebviewPanel.currentPanel) {
      MCPSecurityWebviewPanel.currentPanel.panel.reveal(column);
      await MCPSecurityWebviewPanel.currentPanel.refresh();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "mcpSecurityDashboard",
      "MCP Config Security Scanner",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    MCPSecurityWebviewPanel.currentPanel = new MCPSecurityWebviewPanel(
      panel,
      extensionUri
    );
    await MCPSecurityWebviewPanel.currentPanel.refresh();
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
          case "refresh":
            await this.refresh();
            break;
          case "openFile":
            if (msg.filePath) {
              const doc = await vscode.workspace.openTextDocument(msg.filePath);
              await vscode.window.showTextDocument(doc);
            }
            break;
        }
      },
      null,
      this.disposables
    );
  }

  public async refresh(): Promise<void> {
    const summary = await MCPConfigFinder.runAudit();
    this.lastSummary = summary;
    this.panel.webview.html = this.getHtmlForWebview(summary);
  }

  public dispose() {
    MCPSecurityWebviewPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }

  private getHtmlForWebview(summary: AuditSummary): string {
    const gradeColor =
      summary.overallGrade === "A+" || summary.overallGrade === "A"
        ? "#10b981"
        : summary.overallGrade === "B"
        ? "#38bdf8"
        : summary.overallGrade === "C"
        ? "#f59e0b"
        : "#f43f5e";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP Config Security Scanner</title>
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
      --purple: #a855f7;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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
    .badge-icon {
      font-size: 28px;
    }
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .header p {
      font-size: 13px;
      color: var(--text-muted);
    }
    .btn {
      background: #1e293b;
      color: var(--text);
      border: 1px solid var(--card-border);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn:hover {
      background: #334155;
      border-color: #475569;
    }
    .btn-primary {
      background: #0284c7;
      border-color: #0ea5e9;
    }
    .btn-primary:hover {
      background: #0369a1;
    }

    /* Score overview banner */
    .hero-banner {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 24px;
      background: linear-gradient(135deg, #131c2e 0%, #0d1322 100%);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      align-items: center;
    }
    .score-circle {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      border: 6px solid ${gradeColor};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      background: rgba(0,0,0,0.25);
      box-shadow: 0 0 25px rgba(56, 189, 248, 0.15);
    }
    .score-grade {
      font-size: 42px;
      font-weight: 900;
      color: ${gradeColor};
      line-height: 1;
    }
    .score-points {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      padding: 16px;
      border-radius: 8px;
    }
    .stat-val {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .stat-lbl {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin: 28px 0 16px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Server cards */
    .server-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    .server-header {
      padding: 14px 18px;
      background: #162032;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--card-border);
    }
    .server-name {
      font-weight: 600;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .badge {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-critical { background: rgba(244, 63, 94, 0.2); color: #f43f5e; border: 1px solid #f43f5e44; }
    .badge-high { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #f59e0b44; }
    .badge-medium { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #38bdf844; }
    .badge-safe { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b98144; }

    .server-cmd {
      font-family: monospace;
      font-size: 12px;
      color: #94a3b8;
      background: #0a0f1d;
      padding: 8px 16px;
      border-bottom: 1px solid var(--card-border);
      word-break: break-all;
    }

    .findings-list {
      padding: 12px 18px;
    }
    .finding-item {
      padding: 12px;
      background: #0c1220;
      border: 1px solid #1e293b;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    .finding-item:last-child {
      margin-bottom: 0;
    }
    .finding-head {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .finding-title {
      font-weight: 600;
      font-size: 13px;
    }
    .finding-desc {
      font-size: 13px;
      color: #cbd5e1;
      margin-bottom: 8px;
    }
    .finding-remediation {
      background: rgba(56, 189, 248, 0.08);
      border-left: 3px solid var(--primary);
      padding: 8px 12px;
      font-size: 12px;
      color: #e2e8f0;
      border-radius: 0 4px 4px 0;
    }
    .finding-remediation strong {
      color: var(--primary);
    }

    .clean-state {
      padding: 40px;
      text-align: center;
      color: var(--text-muted);
      border: 1px dashed var(--card-border);
      border-radius: 8px;
    }

    .config-path {
      font-size: 11px;
      color: #64748b;
      cursor: pointer;
      text-decoration: underline;
    }
    .config-path:hover {
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <span class="badge-icon">🛡️</span>
      <div>
        <h1>MCP Security Scanner</h1>
        <p>Security Audit for Model Context Protocol Configurations & Secret Leaks</p>
      </div>
    </div>
    <div style="display:flex; gap: 8px;">
      <button class="btn btn-primary" onclick="triggerScan()">🔄 Re-Scan Configs</button>
    </div>
  </div>

  <div class="hero-banner">
    <div class="score-circle">
      <div class="score-grade">${summary.overallGrade}</div>
      <div class="score-points">${summary.overallScore} / 100</div>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-val" style="color: #38bdf8;">${summary.totalServers}</div>
        <div class="stat-lbl">MCP Servers</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: ${summary.criticalCount > 0 ? '#f43f5e' : '#10b981'};">${summary.criticalCount}</div>
        <div class="stat-lbl">Critical Risks</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: ${summary.highCount > 0 ? '#f59e0b' : '#10b981'};">${summary.highCount}</div>
        <div class="stat-lbl">High Risks</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: #a855f7;">${summary.scannedConfigs.length}</div>
        <div class="stat-lbl">Configs Audited</div>
      </div>
    </div>
  </div>

  <div class="section-title">
    <span>📋 Audited MCP Servers (${summary.serverReports.length})</span>
  </div>

  ${
    summary.serverReports.length === 0
      ? `<div class="clean-state">
          <h3>No MCP Configuration Files Detected</h3>
          <p style="margin-top: 8px;">Create an <code>.cursor/mcp.json</code> or <code>.vscode/mcp.json</code> file in your workspace to run security audits.</p>
        </div>`
      : summary.serverReports
          .map((server) => {
            const riskClass =
              server.riskLevel === "CRITICAL"
                ? "badge-critical"
                : server.riskLevel === "HIGH"
                ? "badge-high"
                : server.riskLevel === "MEDIUM"
                ? "badge-medium"
                : "badge-safe";

            return `
      <div class="server-card">
        <div class="server-header">
          <div class="server-name">
            <strong>${escapeHtml(server.name)}</strong>
            <span class="badge ${riskClass}">${server.riskLevel} (${server.score}/100)</span>
          </div>
          <span class="config-path" onclick="openFile('${escapeJs(server.configFile)}')">${escapeHtml(
              server.configFile.split(/[\\/]/).pop() || ""
            )}</span>
        </div>
        <div class="server-cmd">
          $ ${escapeHtml(server.command)} ${escapeHtml(server.args.join(" "))}
        </div>
        <div class="findings-list">
          ${
            server.findings.length === 0
              ? `<div style="font-size: 13px; color: #10b981; display:flex; align-items:center; gap: 6px;">
                  ✓ Zero security vulnerabilities detected. Safe configuration.
                 </div>`
              : server.findings
                  .map((f) => {
                    const fClass =
                      f.severity === "CRITICAL"
                        ? "badge-critical"
                        : f.severity === "HIGH"
                        ? "badge-high"
                        : "badge-medium";

                    return `
            <div class="finding-item">
              <div class="finding-head">
                <span class="finding-title">${escapeHtml(f.title)}</span>
                <span class="badge ${fClass}">${f.severity}</span>
              </div>
              <div class="finding-desc">${escapeHtml(f.description)}</div>
              ${
                f.detectedValue
                  ? `<div style="margin-bottom: 8px; font-family: monospace; font-size: 11px; color: #f43f5e; background: #1f131a; padding: 4px 8px; border-radius: 4px;">Detected: ${escapeHtml(
                      f.detectedValue
                    )}</div>`
                  : ""
              }
              <div class="finding-remediation">
                <strong>💡 Remediation:</strong> ${escapeHtml(f.remediation)}
              </div>
            </div>`;
                  })
                  .join("")
          }
        </div>
      </div>`;
          })
          .join("")
  }

  <script>
    const vscode = acquireVsCodeApi();

    function triggerScan() {
      vscode.postMessage({ command: 'refresh' });
    }

    function openFile(filePath) {
      vscode.postMessage({ command: 'openFile', filePath: filePath });
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
