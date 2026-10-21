import * as vscode from "vscode";
import { PackageAnalyzer } from "../analyzer/package-analyzer";
import { SupplyChainAuditSummary, DependencyRisk } from "../types/dependency";

export class DependencyLensWebviewPanel {
  public static currentPanel: DependencyLensWebviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  public static async createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (DependencyLensWebviewPanel.currentPanel) {
      DependencyLensWebviewPanel.currentPanel.panel.reveal(column);
      await DependencyLensWebviewPanel.currentPanel.refresh();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "dependencyLensDashboard",
      "Supply Chain Risk Lens",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    DependencyLensWebviewPanel.currentPanel = new DependencyLensWebviewPanel(
      panel,
      extensionUri
    );
    await DependencyLensWebviewPanel.currentPanel.refresh();
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
    const summary = await PackageAnalyzer.auditWorkspace();
    this.panel.webview.html = this.getHtmlForWebview(summary);
  }

  public dispose() {
    DependencyLensWebviewPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }

  private getHtmlForWebview(summary: SupplyChainAuditSummary): string {
    const typosquats = summary.dependencies.filter((d) => d.isTyposquat).length;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dependency Risk Lens</title>
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

    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      padding: 12px 16px;
      text-align: left;
      font-size: 13px;
      border-bottom: 1px solid var(--card-border);
    }
    th {
      background: #141c2c;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
    }
    tr:last-child td { border-bottom: none; }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-safe { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b98144; }
    .badge-warn { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #f59e0b44; }
    .badge-crit { background: rgba(244, 63, 94, 0.2); color: #f43f5e; border: 1px solid #f43f5e44; }
    .clean-state {
      padding: 40px;
      text-align: center;
      color: var(--text-muted);
      border: 1px dashed var(--card-border);
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <span class="badge-icon">🛡️</span>
      <div>
        <h1>Supply Chain Risk Lens</h1>
        <p>Typosquatting & License Compliance Auditor for Workspace Dependencies</p>
      </div>
    </div>
    <div>
      <button class="btn btn-primary" onclick="refreshAudit()">🔄 Re-Audit Dependencies</button>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-val" style="color: #38bdf8;">${summary.totalDependencies}</div>
      <div class="stat-lbl">Audited Packages</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: ${typosquats > 0 ? '#f43f5e' : '#10b981'};">${typosquats}</div>
      <div class="stat-lbl">Typosquats Detected</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #10b981;">${summary.safeCount}</div>
      <div class="stat-lbl">Safe & Verified</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: ${summary.copyleftCount > 0 ? '#f59e0b' : '#38bdf8'};">${summary.copyleftCount}</div>
      <div class="stat-lbl">Copyleft Licenses</div>
    </div>
  </div>

  ${
    summary.dependencies.length === 0
      ? `<div class="clean-state">
          <h3>No Dependencies Found</h3>
          <p style="margin-top: 8px;">No package.json files detected in this workspace.</p>
        </div>`
      : `<table>
          <thead>
            <tr>
              <th>Package</th>
              <th>Version</th>
              <th>Risk Level</th>
              <th>License</th>
              <th>Audit Notes</th>
            </tr>
          </thead>
          <tbody>
            ${summary.dependencies
              .map((d) => {
                const bClass =
                  d.riskLevel === "CRITICAL"
                    ? "badge-crit"
                    : d.riskLevel === "HIGH" || d.riskLevel === "MEDIUM"
                    ? "badge-warn"
                    : "badge-safe";

                return `
                <tr>
                  <td>
                    <strong>${escapeHtml(d.name)}</strong>
                    <span style="font-size: 11px; color: #64748b; margin-left: 6px;">${
                      d.isDev ? "(dev)" : "(prod)"
                    }</span>
                  </td>
                  <td><code>${escapeHtml(d.version)}</code></td>
                  <td><span class="badge ${bClass}">${d.riskLevel}</span></td>
                  <td><span style="font-size: 12px; color: #cbd5e1;">${escapeHtml(
                    d.license
                  )}</span></td>
                  <td>
                    ${
                      d.warnings.length > 0
                        ? d.warnings
                            .map(
                              (w) =>
                                `<div style="font-size: 12px; color: #fca5a5; margin-bottom: 2px;">⚠️ ${escapeHtml(
                                  w
                                )}</div>`
                            )
                            .join("")
                        : `<span style="color: #10b981; font-size: 12px;">✓ Verified safe</span>`
                    }
                  </td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>`
  }

  <script>
    const vscode = acquireVsCodeApi();
    function refreshAudit() {
      vscode.postMessage({ command: 'refresh' });
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
