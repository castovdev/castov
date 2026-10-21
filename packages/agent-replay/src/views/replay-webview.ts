import * as vscode from "vscode";
import { SessionRecorder } from "../recorder/session-recorder";
import { FileChangeSnapshot } from "../types/replay";

export class AgentReplayWebviewPanel {
  public static currentPanel: AgentReplayWebviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private recorder: SessionRecorder;
  private activeStep = 1;

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (AgentReplayWebviewPanel.currentPanel) {
      AgentReplayWebviewPanel.currentPanel.panel.reveal(column);
      AgentReplayWebviewPanel.currentPanel.refresh();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "agentReplayDashboard",
      "Agent Session Replay & Diff Scrubber",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    AgentReplayWebviewPanel.currentPanel = new AgentReplayWebviewPanel(
      panel,
      extensionUri
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly extensionUri: vscode.Uri
  ) {
    this.panel = panel;
    this.recorder = SessionRecorder.getInstance();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.recorder.on("snapshotAdded", () => this.refresh());
    this.recorder.on("cleared", () => this.refresh());
    this.recorder.on("rewound", () => this.refresh());

    this.panel.webview.onDidReceiveMessage(
      async (msg: any) => {
        switch (msg.command) {
          case "selectStep":
            this.activeStep = msg.step;
            this.refresh();
            break;
          case "rewind":
            const confirmed = await vscode.window.showWarningMessage(
              `Rewind file "${msg.fileName}" back to before Step ${msg.step}? This will overwrite the current file on disk.`,
              { modal: true },
              "Yes, Rewind"
            );
            if (confirmed === "Yes, Rewind") {
              const ok = await this.recorder.rewindToStep(msg.step);
              if (ok) {
                vscode.window.showInformationMessage(
                  `⏪ Successfully rewound "${msg.fileName}" to Step ${msg.step} state!`
                );
              } else {
                vscode.window.showErrorMessage("Failed to rewind file.");
              }
            }
            break;
          case "clear":
            this.recorder.clearSession();
            vscode.window.showInformationMessage("Agent Replay session history cleared.");
            break;
        }
      },
      null,
      this.disposables
    );

    this.refresh();
  }

  public refresh(): void {
    const snapshots = this.recorder.getSnapshots();
    if (this.activeStep > snapshots.length) {
      this.activeStep = Math.max(1, snapshots.length);
    }
    this.panel.webview.html = this.getHtmlForWebview(snapshots);
  }

  public dispose() {
    AgentReplayWebviewPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }

  private getHtmlForWebview(snapshots: FileChangeSnapshot[]): string {
    const totalSteps = snapshots.length;
    const current = snapshots.find((s) => s.stepNumber === this.activeStep) || snapshots[snapshots.length - 1];

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Session Replay</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f2937;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #38bdf8;
      --purple: #c084fc;
      --danger: #f43f5e;
      --success: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 20px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--card-border);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .badge-icon { font-size: 26px; }
    .header h1 { font-size: 20px; font-weight: 700; }
    .header p { font-size: 13px; color: var(--text-muted); }
    .btn {
      background: #1e293b;
      color: var(--text);
      border: 1px solid var(--card-border);
      padding: 7px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-rewind {
      background: #7e22ce;
      border-color: #a855f7;
    }
    .btn-rewind:hover { background: #6b21a8; }
    .btn-danger:hover { background: #e11d48; }

    /* Scrubber Controls */
    .scrubber-bar {
      background: #131c2e;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .scrubber-slider {
      flex: 1;
      height: 8px;
      accent-color: #c084fc;
      cursor: pointer;
    }
    .step-indicator {
      font-weight: 700;
      font-size: 14px;
      color: var(--purple);
      min-width: 120px;
      text-align: center;
    }

    /* Diff View Grid */
    .diff-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .diff-pane {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      overflow: hidden;
    }
    .pane-header {
      padding: 10px 14px;
      background: #172033;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
    }
    .code-box {
      padding: 14px;
      background: #090e1a;
      font-family: monospace;
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-all;
      height: 400px;
      overflow-y: auto;
      line-height: 1.6;
    }

    /* Timeline pills list */
    .timeline-list {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .step-chip {
      padding: 8px 14px;
      border-radius: 6px;
      background: #141b2c;
      border: 1px solid var(--card-border);
      cursor: pointer;
      font-size: 12px;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .step-chip.active {
      border-color: #c084fc;
      background: #231636;
      color: #e9d5ff;
    }

    .clean-state {
      padding: 60px 20px;
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
      <span class="badge-icon">⏪</span>
      <div>
        <h1>Agent Session Replay & Diff Scrubber</h1>
        <p>Inspect AI agent code modifications step-by-step and rewind regressions</p>
      </div>
    </div>
    <div style="display:flex; gap: 8px;">
      <button class="btn btn-danger" onclick="clearSession()">🗑️ Clear History</button>
    </div>
  </div>

  ${
    totalSteps === 0
      ? `<div class="clean-state">
          <h3>No Agent Edit History Captured Yet</h3>
          <p style="margin-top: 8px;">Edit any code file in your workspace or let an AI agent modify code. Snapshots will be recorded automatically.</p>
        </div>`
      : `
    <div class="scrubber-bar">
      <button class="btn" onclick="prevStep()" ${this.activeStep <= 1 ? "disabled" : ""}>◀ Prev Step</button>
      <input type="range" class="scrubber-slider" min="1" max="${totalSteps}" value="${this.activeStep}" onchange="onSliderChange(this.value)">
      <button class="btn" onclick="nextStep()" ${this.activeStep >= totalSteps ? "disabled" : ""}>Next Step ▶</button>
      <div class="step-indicator">Step ${current.stepNumber} of ${totalSteps}</div>
      <button class="btn btn-rewind" onclick="rewindStep(${current.stepNumber}, '${escapeJs(current.fileName)}')">⏪ Rewind to Before Step</button>
    </div>

    <div class="timeline-list">
      ${snapshots
        .map(
          (s) => `
        <div class="step-chip ${s.stepNumber === this.activeStep ? "active" : ""}" onclick="selectStep(${s.stepNumber})">
          <strong>Step ${s.stepNumber}:</strong> ${escapeHtml(s.fileName)}
          <span style="color: #10b981; margin-left: 4px;">+${s.linesAdded}</span>
          <span style="color: #f43f5e; margin-left: 2px;">-${s.linesRemoved}</span>
        </div>`
        )
        .join("")}
    </div>

    <div class="diff-container">
      <div class="diff-pane">
        <div class="pane-header">
          <span>⏮️ Before Agent Edit (${escapeHtml(current.fileName)})</span>
          <span style="color: #64748b;">${escapeHtml(current.timestamp)}</span>
        </div>
        <div class="code-box">${escapeHtml(current.beforeContent || "(Empty File)")}</div>
      </div>

      <div class="diff-pane">
        <div class="pane-header">
          <span style="color: #c084fc;">⏭️ After Agent Edit (+${current.linesAdded}, -${current.linesRemoved})</span>
          <span style="color: #10b981;">Step ${current.stepNumber}</span>
        </div>
        <div class="code-box" style="color: #93c5fd;">${escapeHtml(current.afterContent)}</div>
      </div>
    </div>`
  }

  <script>
    const vscode = acquireVsCodeApi();

    function selectStep(step) {
      vscode.postMessage({ command: 'selectStep', step: parseInt(step, 10) });
    }

    function onSliderChange(step) {
      selectStep(step);
    }

    function prevStep() {
      selectStep(${this.activeStep - 1});
    }

    function nextStep() {
      selectStep(${this.activeStep + 1});
    }

    function rewindStep(step, fileName) {
      vscode.postMessage({ command: 'rewind', step: step, fileName: fileName });
    }

    function clearSession() {
      vscode.postMessage({ command: 'clear' });
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
