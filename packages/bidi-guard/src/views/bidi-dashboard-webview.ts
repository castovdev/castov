import * as vscode from "vscode";
import { WorkspaceScanner } from "../scanner/workspace-scanner";
import { WorkspaceScanSummary } from "../types/bidi";

export class BidiDashboardWebviewPanel {
  public static currentPanel: BidiDashboardWebviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private summary: WorkspaceScanSummary;

  public static createOrShow(extensionUri: vscode.Uri, workspaceRoot: string) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    const summary = WorkspaceScanner.scanWorkspace(workspaceRoot);

    if (BidiDashboardWebviewPanel.currentPanel) {
      BidiDashboardWebviewPanel.currentPanel.panel.reveal(column);
      BidiDashboardWebviewPanel.currentPanel.updateSummary(summary);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "bidiGuardDashboard",
      "Bidi & Unicode Guard Dashboard",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    BidiDashboardWebviewPanel.currentPanel = new BidiDashboardWebviewPanel(
      panel,
      extensionUri,
      workspaceRoot,
      summary
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly extensionUri: vscode.Uri,
    private readonly workspaceRoot: string,
    initialSummary: WorkspaceScanSummary
  ) {
    this.panel = panel;
    this.summary = initialSummary;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async (msg: any) => {
        switch (msg.command) {
          case "rescan":
            this.handleRescan();
            break;
          case "openFile":
            this.handleOpenFile(msg.filePath, msg.line);
            break;
        }
      },
      null,
      this.disposables
    );

    this.updateContent();
  }

  public updateSummary(summary: WorkspaceScanSummary) {
    this.summary = summary;
    this.panel.webview.postMessage({ type: "summaryUpdate", summary: this.summary });
  }

  private handleRescan() {
    this.summary = WorkspaceScanner.scanWorkspace(this.workspaceRoot);
    this.panel.webview.postMessage({ type: "summaryUpdate", summary: this.summary });
    vscode.window.showInformationMessage("Bidi Guard: Workspace scan completed!");
  }

  private async handleOpenFile(relPath: string, line: number) {
    const fullPath = vscode.Uri.joinPath(vscode.Uri.file(this.workspaceRoot), relPath);
    try {
      const doc = await vscode.workspace.openTextDocument(fullPath);
      const editor = await vscode.window.showTextDocument(doc);
      const pos = new vscode.Position(Math.max(0, line - 1), 0);
      editor.selection = new vscode.Selection(pos, pos);
      editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
    } catch {
      vscode.window.showErrorMessage(`Could not open file: ${relPath}`);
    }
  }

  public dispose() {
    BidiDashboardWebviewPanel.currentPanel = undefined;
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
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bidi & Unicode Guard</title>
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
    .stat-val { font-size: 22px; font-weight: 700; }
    .stat-lbl { font-size: 11px; color: var(--muted); text-transform: uppercase; margin-top: 2px; }
    .badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      display: inline-block;
    }
    .badge.critical { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    .badge.high { background: rgba(249, 115, 22, 0.2); color: #fb923c; }
    .badge.medium { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .badge.info { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
    .threat-card {
      background: var(--sidebar);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .threat-card:hover { background: rgba(255, 255, 255, 0.04); }
    .threat-card.critical { border-left: 4px solid var(--danger); }
    .threat-card.high { border-left: 4px solid #f97316; }
    .threat-card.medium { border-left: 4px solid var(--warning); }
    .threat-card.info { border-left: 4px solid #38bdf8; }
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
    textarea {
      width: 100%;
      height: 120px;
      background: #020617;
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px;
      font-size: 13px;
      outline: none;
      resize: vertical;
      margin-bottom: 12px;
    }
    .rtl-preview {
      background: #020617;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      font-family: 'Segoe UI', Tahoma, sans-serif;
      font-size: 15px;
      line-height: 1.8;
      border-right: 4px solid var(--accent);
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">
      <span>🛡️ Bidi & Unicode Guard</span>
      <span id="threatBadge" class="badge info">0 Threats</span>
    </div>
    <div>
      <button class="btn" onclick="rescan()">🔄 Rescan Workspace</button>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div id="statScanned" class="stat-val">0</div>
      <div class="stat-lbl">Files Scanned</div>
    </div>
    <div class="stat-card">
      <div id="statTrojan" class="stat-val" style="color:var(--danger)">0</div>
      <div class="stat-lbl">Trojan Source (CVE)</div>
    </div>
    <div class="stat-card">
      <div id="statInvisible" class="stat-val" style="color:var(--warning)">0</div>
      <div class="stat-lbl">Invisible Chars</div>
    </div>
    <div class="stat-card">
      <div id="statHomoglyph" class="stat-val" style="color:#fb923c">0</div>
      <div class="stat-lbl">Homoglyphs</div>
    </div>
    <div class="stat-card">
      <div id="statRtl" class="stat-val" style="color:#38bdf8">0</div>
      <div class="stat-lbl">RTL Comments</div>
    </div>
  </div>

  <div class="tabs">
    <button class="tab-btn active" onclick="switchTab('threats')">Security Threats (<span id="tabThreatCount">0</span>)</button>
    <button class="tab-btn" onclick="switchTab('reader')">Arabic & RTL Comment Reader</button>
  </div>

  <!-- TAB 1: THREATS -->
  <div id="tab-threats" class="tab-content active">
    <div id="threatsContainer"></div>
  </div>

  <!-- TAB 2: RTL READER -->
  <div id="tab-reader" class="tab-content">
    <p style="color:var(--muted); font-size:12px; margin-bottom:8px;">
      Paste mixed Arabic-English code or comments below to view bidirectional phrase isolation rendering:
    </p>
    <textarea id="rtlInput" oninput="renderRtlPreview()" placeholder="// هدا التابع يقوم بتهيئة الاتصال مع قاعدة البيانات Postgres ومعالجة الـ tokens..."></textarea>
    <div class="rtl-preview" dir="rtl" id="rtlOutput">
      المعاينة ستظهر هنا بالاتجاه الصحيح مع الحفاظ على الكلمات الإنجليزية والـ code identifiers في موضعها السليم.
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let currentSummary = ${JSON.stringify(this.summary)};

    window.addEventListener("message", (event) => {
      if (event.data.type === "summaryUpdate") {
        currentSummary = event.data.summary;
        renderSummary();
      }
    });

    function switchTab(name) {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      event.target.classList.add("active");
      document.getElementById("tab-" + name).classList.add("active");
    }

    function renderSummary() {
      document.getElementById("statScanned").textContent = currentSummary.totalFilesScanned;
      document.getElementById("statTrojan").textContent = currentSummary.trojanSourceCount;
      document.getElementById("statInvisible").textContent = currentSummary.invisibleCount;
      document.getElementById("statHomoglyph").textContent = currentSummary.homoglyphCount;
      document.getElementById("statRtl").textContent = currentSummary.rtlCommentsCount;

      const securityThreats = currentSummary.threats.filter(t => t.category !== "rtl_comment");
      const badge = document.getElementById("threatBadge");
      badge.textContent = securityThreats.length + " Security Threats";
      badge.className = "badge " + (securityThreats.length > 0 ? "critical" : "info");

      document.getElementById("tabThreatCount").textContent = securityThreats.length;

      const container = document.getElementById("threatsContainer");
      if (securityThreats.length === 0) {
        container.innerHTML = \`
          <div style="background:rgba(16, 185, 129, 0.1); border:1px solid rgba(16, 185, 129, 0.3); border-radius:8px; padding:24px; text-align:center; color:#34d399;">
            ✅ Zero Unicode threats detected. Your workspace is 100% free of Trojan Source overrides (CVE-2021-42574), invisible zero-width spaces, and homoglyphs.
          </div>
        \`;
      } else {
        container.innerHTML = securityThreats.map(t => \`
          <div class="threat-card \${t.severity}" onclick="jumpToFile('\${t.filePath}', \${t.line})">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <strong style="font-size:13px;">\${t.charName} (\${t.codePoint})</strong>
              <span class="badge \${t.severity}">\${t.severity.toUpperCase()}</span>
            </div>
            <p style="font-size:12px; margin-bottom:6px;">\${t.description}</p>
            <div style="font-size:11px; color:var(--muted)">
              📁 <strong>\${t.filePath}</strong> (Line \${t.line}, Col \${t.col}) • Click to jump to line
            </div>
          </div>
        \`).join("");
      }
    }

    function jumpToFile(filePath, line) {
      vscode.postMessage({ command: "openFile", filePath, line });
    }

    function rescan() {
      vscode.postMessage({ command: "rescan" });
    }

    function renderRtlPreview() {
      const text = document.getElementById("rtlInput").value;
      const formatted = text.replace(/([A-Za-z0-9_.\-/:]{2,})/g, '<bdi style="direction:ltr; font-family:monospace; background:rgba(255,255,255,0.1); padding:1px 4px; border-radius:3px;">$1</bdi>');
      document.getElementById("rtlOutput").innerHTML = formatted || "المعاينة ستظهر هنا...";
    }

    renderSummary();
  </script>
</body>
</html>`;
  }
}
