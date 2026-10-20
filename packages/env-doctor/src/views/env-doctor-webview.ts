import * as vscode from "vscode";
import { EnvAuditReport } from "../types/env";
import { EnvAuditor } from "../doctor/env-auditor";
import { EnvGenerator } from "../doctor/env-generator";
import { GitGuard } from "../scanner/git-guard";

export class EnvDoctorWebviewPanel {
  public static currentPanel: EnvDoctorWebviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private report: EnvAuditReport;

  public static createOrShow(extensionUri: vscode.Uri, workspaceRoot: string) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    const report = EnvAuditor.runAudit(workspaceRoot);

    if (EnvDoctorWebviewPanel.currentPanel) {
      EnvDoctorWebviewPanel.currentPanel.panel.reveal(column);
      EnvDoctorWebviewPanel.currentPanel.updateReport(report);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "envDoctorDashboard",
      "Env Doctor Dashboard",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    EnvDoctorWebviewPanel.currentPanel = new EnvDoctorWebviewPanel(panel, extensionUri, workspaceRoot, report);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly extensionUri: vscode.Uri,
    private readonly workspaceRoot: string,
    initialReport: EnvAuditReport
  ) {
    this.panel = panel;
    this.report = initialReport;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async (message: any) => {
        switch (message.command) {
          case "rescan":
            this.handleRescan();
            break;
          case "generateExample":
            this.handleGenerateExample();
            break;
          case "addMissingToEnv":
            this.handleAddMissingToEnv();
            break;
          case "fixGitignore":
            this.handleFixGitignore();
            break;
        }
      },
      null,
      this.disposables
    );

    this.updateWebviewContent();
  }

  public updateReport(report: EnvAuditReport) {
    this.report = report;
    this.panel.webview.postMessage({ type: "reportUpdate", report: this.report });
  }

  private handleRescan() {
    this.report = EnvAuditor.runAudit(this.workspaceRoot);
    this.panel.webview.postMessage({ type: "reportUpdate", report: this.report });
    vscode.window.showInformationMessage("Env Doctor: Workspace rescan completed!");
  }

  private handleGenerateExample() {
    const res = EnvGenerator.generateCleanExample(this.workspaceRoot, this.report);
    if (res.success) {
      vscode.window.showInformationMessage("Env Doctor: Generated clean .env.example!");
      this.handleRescan();
      vscode.workspace.openTextDocument(res.filePath).then((doc) => vscode.window.showTextDocument(doc));
    } else {
      vscode.window.showErrorMessage("Env Doctor: Failed to write .env.example.");
    }
  }

  private handleAddMissingToEnv() {
    const missingKeys = this.report.issues
      .filter((i) => i.type === "missing_in_env")
      .map((i) => i.variableName);

    if (missingKeys.length === 0) {
      vscode.window.showInformationMessage("Env Doctor: No missing variables to add.");
      return;
    }

    const success = EnvGenerator.addMissingVariablesToEnv(this.workspaceRoot, missingKeys);
    if (success) {
      vscode.window.showInformationMessage(`Env Doctor: Added ${missingKeys.length} missing variable(s) to .env!`);
      this.handleRescan();
    } else {
      vscode.window.showErrorMessage("Env Doctor: Failed to update .env.");
    }
  }

  private handleFixGitignore() {
    const success = GitGuard.fixGitignore(this.workspaceRoot);
    if (success) {
      vscode.window.showInformationMessage("Env Doctor: Added .env protection rules to .gitignore!");
      this.handleRescan();
    } else {
      vscode.window.showErrorMessage("Env Doctor: Failed to modify .gitignore.");
    }
  }

  public dispose() {
    EnvDoctorWebviewPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }

  private updateWebviewContent() {
    this.panel.webview.html = this.getHtml();
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Env Doctor</title>
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
    .btn {
      background: var(--accent);
      color: #fff;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn:hover { background: var(--accent-hover); }
    .btn-secondary {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text);
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.05); }
    .btn-danger { background: var(--danger); }
    .btn-danger:hover { background: #dc2626; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: var(--sidebar);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }
    .stat-value {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .stat-label {
      font-size: 11px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
      display: inline-block;
    }
    .badge.critical { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge.high { background: rgba(249, 115, 22, 0.15); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.3); }
    .badge.medium { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge.low { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
    .badge.ok { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .tabs {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 16px;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--muted);
      padding: 8px 14px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      border-bottom: 2px solid transparent;
    }
    .tab-btn.active { color: var(--text); border-bottom-color: var(--accent); }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .issue-card {
      background: var(--sidebar);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 10px;
    }
    .issue-card.critical { border-left: 4px solid var(--danger); }
    .issue-card.high { border-left: 4px solid #f97316; }
    .issue-card.medium { border-left: 4px solid var(--warning); }
    .issue-card.low { border-left: 4px solid #38bdf8; }
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      font-family: monospace;
      background: var(--sidebar);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }
    .matrix-table th, .matrix-table td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    .matrix-table th {
      color: var(--muted);
      font-weight: 600;
      background: rgba(0,0,0,0.2);
    }
    .matrix-row:hover { background: rgba(255, 255, 255, 0.03); }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">
      <span>🩺 Env Doctor Dashboard</span>
      <span id="healthBadge" class="badge ok">100% Health</span>
    </div>
    <div style="display:flex; gap:8px;">
      <button class="btn btn-secondary" onclick="generateExample()">✨ Generate .env.example</button>
      <button class="btn btn-secondary" onclick="addMissingToEnv()">➕ Add Missing to .env</button>
      <button class="btn" onclick="rescan()">🔄 Rescan</button>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div id="statTotalVars" class="stat-value">0</div>
      <div class="stat-label">Total Variables</div>
    </div>
    <div class="stat-card">
      <div id="statIssues" class="stat-value" style="color:var(--danger)">0</div>
      <div class="stat-label">Issues Detected</div>
    </div>
    <div class="stat-card">
      <div id="statInEnv" class="stat-value">0</div>
      <div class="stat-label">In .env</div>
    </div>
    <div class="stat-card">
      <div id="statInExample" class="stat-value">0</div>
      <div class="stat-label">In .env.example</div>
    </div>
    <div class="stat-card">
      <div id="statInCode" class="stat-value">0</div>
      <div class="stat-label">Used in Code</div>
    </div>
    <div class="stat-card">
      <div id="statGitSafe" class="stat-value" style="color:var(--success)">SAFE</div>
      <div class="stat-label">Git Protection</div>
    </div>
  </div>

  <div class="tabs">
    <button class="tab-btn active" onclick="switchTab('issues')">Issues & Diagnostics (<span id="tabIssueCount">0</span>)</button>
    <button class="tab-btn" onclick="switchTab('matrix')">Variables Matrix (<span id="tabVarCount">0</span>)</button>
  </div>

  <!-- TAB 1: ISSUES -->
  <div id="tab-issues" class="tab-content active">
    <div id="issuesContainer"></div>
  </div>

  <!-- TAB 2: MATRIX -->
  <div id="tab-matrix" class="tab-content">
    <table class="matrix-table">
      <thead>
        <tr>
          <th>Variable Key</th>
          <th>Used in Code</th>
          <th>Active in .env</th>
          <th>In .env.example</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody id="matrixTableBody"></tbody>
    </table>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let currentReport = ${JSON.stringify(this.report)};

    window.addEventListener("message", (event) => {
      if (event.data.type === "reportUpdate") {
        currentReport = event.data.report;
        renderReport();
      }
    });

    function switchTab(name) {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      event.target.classList.add("active");
      document.getElementById("tab-" + name).classList.add("active");
    }

    function renderReport() {
      // Badges & Stats
      const score = currentReport.healthScore;
      const healthBadge = document.getElementById("healthBadge");
      healthBadge.textContent = score + "% Health";
      healthBadge.className = "badge " + (score >= 90 ? "ok" : (score >= 70 ? "medium" : "critical"));

      document.getElementById("statTotalVars").textContent = currentReport.allVariables.length;
      document.getElementById("statIssues").textContent = currentReport.issues.length;
      document.getElementById("statInEnv").textContent = currentReport.allVariables.filter(v => v.inEnv).length;
      document.getElementById("statInExample").textContent = currentReport.allVariables.filter(v => v.inExample).length;
      document.getElementById("statInCode").textContent = currentReport.allVariables.filter(v => v.inCode).length;

      const gitSafeEl = document.getElementById("statGitSafe");
      if (currentReport.gitSafe) {
        gitSafeEl.textContent = "SAFE";
        gitSafeEl.style.color = "var(--success)";
      } else {
        gitSafeEl.textContent = "AT RISK";
        gitSafeEl.style.color = "var(--danger)";
      }

      document.getElementById("tabIssueCount").textContent = currentReport.issues.length;
      document.getElementById("tabVarCount").textContent = currentReport.allVariables.length;

      // Render Issues
      const issuesContainer = document.getElementById("issuesContainer");
      if (currentReport.issues.length === 0) {
        issuesContainer.innerHTML = \`
          <div style="background:rgba(16, 185, 129, 0.1); border:1px solid rgba(16, 185, 129, 0.3); border-radius:8px; padding:24px; text-align:center; color:#34d399;">
            🎉 Perfect Environment Health! All variables match between code, .env, and .env.example with no duplicates or git leak risks.
          </div>
        \`;
      } else {
        issuesContainer.innerHTML = currentReport.issues.map(iss => \`
          <div class="issue-card \${iss.severity}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <strong style="font-size:13px;">\${iss.title}</strong>
              <span class="badge \${iss.severity}">\${iss.severity.toUpperCase()}</span>
            </div>
            <p style="font-size:12px; margin-bottom:6px;">\${iss.description}</p>
            <div style="font-size:11px; color:var(--muted)">Locations: \${iss.locations.join(", ")}</div>
          </div>
        \`).join("");
      }

      // Render Matrix Table
      const matrixBody = document.getElementById("matrixTableBody");
      matrixBody.innerHTML = currentReport.allVariables.map(v => {
        let statusHtml = '<span class="badge ok">OK</span>';
        if (v.inCode && !v.inEnv) statusHtml = '<span class="badge high">Missing in .env</span>';
        else if (!v.inExample) statusHtml = '<span class="badge medium">Missing in .env.example</span>';
        else if (!v.inCode) statusHtml = '<span class="badge low">Dead / Unused in code</span>';

        return \`
          <tr class="matrix-row">
            <td style="font-weight:600">\${v.key}</td>
            <td>\${v.inCode ? '✅ Yes (' + v.codeReferencesCount + ')' : '<span style="color:var(--muted)">No</span>'}</td>
            <td>\${v.inEnv ? '✅ Yes' : '<span style="color:var(--danger)">❌ Missing</span>'}</td>
            <td>\${v.inExample ? '✅ Yes' : '<span style="color:var(--warning)">⚠️ Missing</span>'}</td>
            <td>\${statusHtml}</td>
          </tr>
        \`;
      }).join("");
    }

    function rescan() {
      vscode.postMessage({ command: "rescan" });
    }

    function generateExample() {
      vscode.postMessage({ command: "generateExample" });
    }

    function addMissingToEnv() {
      vscode.postMessage({ command: "addMissingToEnv" });
    }

    renderReport();
  </script>
</body>
</html>`;
  }
}
