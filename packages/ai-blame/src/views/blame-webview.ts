import * as vscode from "vscode";
import { GitBlameParser } from "../blame/git-blame-parser";
import { WorkspaceBlameSummary } from "../types/blame";

export class AIBlameWebviewPanel {
  public static currentPanel: AIBlameWebviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  public static async createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (AIBlameWebviewPanel.currentPanel) {
      AIBlameWebviewPanel.currentPanel.panel.reveal(column);
      await AIBlameWebviewPanel.currentPanel.refresh();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "aiBlameDashboard",
      "AI Blame & Authorship Analytics",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    AIBlameWebviewPanel.currentPanel = new AIBlameWebviewPanel(
      panel,
      extensionUri
    );
    await AIBlameWebviewPanel.currentPanel.refresh();
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
    const summary = await GitBlameParser.analyzeWorkspace();
    this.panel.webview.html = this.getHtmlForWebview(summary);
  }

  public dispose() {
    AIBlameWebviewPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }

  private getHtmlForWebview(summary: WorkspaceBlameSummary): string {
    const aiPct = summary.overallAiPercentage;
    const humanPct = 100 - aiPct;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Blame & Authorship Analytics</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f2937;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #38bdf8;
      --purple: #c084fc;
      --purple-bg: #6b21a8;
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
    .btn-primary { background: #7e22ce; border-color: #a855f7; }
    .btn-primary:hover { background: #6b21a8; }

    /* Authorship Meter */
    .hero-meter {
      background: linear-gradient(135deg, #151b2c 0%, #0d1220 100%);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .meter-label {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .meter-bar {
      height: 24px;
      background: #0284c7;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
    }
    .meter-fill-ai {
      height: 100%;
      background: linear-gradient(90deg, #9333ea, #c084fc);
      transition: width 0.5s ease;
    }

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

    /* Agent pills */
    .agents-section {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .agents-title {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 12px;
    }
    .agents-grid {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .agent-pill {
      background: #171f32;
      border: 1px solid #2d3748;
      padding: 8px 14px;
      border-radius: 20px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .agent-pill strong { color: var(--purple); }

    /* Table */
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
    }
    tr:last-child td { border-bottom: none; }
    .file-link {
      color: var(--primary);
      text-decoration: none;
      cursor: pointer;
      font-weight: 500;
    }
    .file-link:hover { text-decoration: underline; }
    .progress-bar-small {
      width: 100px;
      height: 8px;
      background: #1e293b;
      border-radius: 4px;
      overflow: hidden;
      display: inline-block;
      vertical-align: middle;
      margin-left: 8px;
    }
    .progress-fill-small {
      height: 100%;
      background: #c084fc;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <span class="badge-icon">🤖</span>
      <div>
        <h1>AI Blame & Authorship Analytics</h1>
        <p>Telemetry for AI Agent Code vs Human Craftsmanship</p>
      </div>
    </div>
    <div>
      <button class="btn btn-primary" onclick="refreshScan()">🔄 Scan Workspace</button>
    </div>
  </div>

  <div class="hero-meter">
    <div class="meter-label">
      <span style="color: #c084fc;">🤖 AI-Assisted: ${aiPct}% (${summary.totalAiLines.toLocaleString()} lines)</span>
      <span style="color: #38bdf8;">👤 Human-Written: ${humanPct}% (${summary.totalHumanLines.toLocaleString()} lines)</span>
    </div>
    <div class="meter-bar">
      <div class="meter-fill-ai" style="width: ${aiPct}%;"></div>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-val" style="color: #c084fc;">${aiPct}%</div>
      <div class="stat-lbl">AI Code Ratio</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #38bdf8;">${summary.totalFiles}</div>
      <div class="stat-lbl">Analyzed Files</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #10b981;">${summary.totalLines.toLocaleString()}</div>
      <div class="stat-lbl">Total Source Lines</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #f59e0b;">${Object.keys(summary.agentBreakdown).length}</div>
      <div class="stat-lbl">Active AI Agents</div>
    </div>
  </div>

  <div class="agents-section">
    <div class="agents-title">Discovered AI Agents & Contributions</div>
    <div class="agents-grid">
      ${
        Object.entries(summary.agentBreakdown).length === 0
          ? `<span style="font-size: 13px; color: #64748b;">No AI agents detected yet in git history or workspace files.</span>`
          : Object.entries(summary.agentBreakdown)
              .map(
                ([agent, lines]) => `
          <div class="agent-pill">
            <span>🤖</span>
            <span>${escapeHtml(agent)}:</span>
            <strong>${lines.toLocaleString()} lines</strong>
          </div>`
              )
              .join("")
      }
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>File</th>
        <th>Total Lines</th>
        <th>AI Authorship</th>
        <th>Top Agent</th>
      </tr>
    </thead>
    <tbody>
      ${summary.files
        .map((f) => {
          const topAgent = Object.entries(f.agentCounts).sort(
            (a, b) => b[1] - a[1]
          )[0]?.[0] || "—";

          return `
          <tr>
            <td>
              <span class="file-link" onclick="openFile('${escapeJs(f.filePath)}')">
                ${escapeHtml(f.fileName)}
              </span>
              <div style="font-size: 11px; color: #64748b;">${escapeHtml(f.filePath)}</div>
            </td>
            <td>${f.totalLines}</td>
            <td>
              <span>${f.aiPercentage}%</span>
              <div class="progress-bar-small">
                <div class="progress-fill-small" style="width: ${f.aiPercentage}%;"></div>
              </div>
            </td>
            <td><span style="color: #c084fc; font-weight: 500;">${escapeHtml(topAgent)}</span></td>
          </tr>`;
        })
        .join("")}
    </tbody>
  </table>

  <script>
    const vscode = acquireVsCodeApi();
    function refreshScan() {
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
