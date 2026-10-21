import * as vscode from "vscode";
import { PromptRunner } from "../runner/prompt-runner";
import { SingleTestExecution, SuiteRunSummary } from "../types/prompt-test";

export class PromptTesterWebviewPanel {
  public static currentPanel: PromptTesterWebviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private lastResults: SingleTestExecution[] = [];

  public static async createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (PromptTesterWebviewPanel.currentPanel) {
      PromptTesterWebviewPanel.currentPanel.panel.reveal(column);
      await PromptTesterWebviewPanel.currentPanel.runAllTests();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "promptTesterDashboard",
      "Prompt Regression Tester",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    PromptTesterWebviewPanel.currentPanel = new PromptTesterWebviewPanel(
      panel,
      extensionUri
    );
    await PromptTesterWebviewPanel.currentPanel.runAllTests();
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
          case "runAll":
            await this.runAllTests();
            break;
          case "createSample":
            await vscode.commands.executeCommand("promptTester.createSampleTest");
            await this.runAllTests();
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

  public async setResults(results: SingleTestExecution[]): Promise<void> {
    this.lastResults = results;
    this.panel.webview.html = this.getHtmlForWebview(results);
  }

  public async runAllTests(): Promise<void> {
    const files = await PromptRunner.discoverTestFiles();
    const allResults: SingleTestExecution[] = [];
    for (const f of files) {
      const res = await PromptRunner.runSuite(f);
      allResults.push(...res);
    }
    await this.setResults(allResults);
  }

  public dispose() {
    PromptTesterWebviewPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }

  private getHtmlForWebview(results: SingleTestExecution[]): string {
    const total = results.length;
    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = total - passedCount;
    const passRate = total > 0 ? Math.round((passedCount / total) * 100) : 100;
    const avgLatency =
      total > 0
        ? Math.round(results.reduce((acc, r) => acc + r.latencyMs, 0) / total)
        : 0;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prompt Regression Tester</title>
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
      display: inline-flex;
      align-items: center;
      gap: 8px;
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

    .test-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      margin-bottom: 14px;
      overflow: hidden;
    }
    .test-header {
      padding: 12px 16px;
      background: #141c2c;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--card-border);
    }
    .test-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      font-size: 14px;
    }
    .badge {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-pass { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b98144; }
    .badge-fail { background: rgba(244, 63, 94, 0.2); color: #f43f5e; border: 1px solid #f43f5e44; }

    .test-body {
      padding: 14px 16px;
    }
    .prompt-box {
      background: #090e1a;
      border: 1px solid #1e293b;
      border-radius: 6px;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      margin-bottom: 12px;
      white-space: pre-wrap;
    }
    .output-box {
      background: #0d1424;
      border: 1px solid #1e293b;
      border-radius: 6px;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      margin-bottom: 12px;
      white-space: pre-wrap;
      color: #93c5fd;
    }
    .assertions-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .assertion-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      padding: 6px 10px;
      background: #0a0f1d;
      border-radius: 4px;
      border-left: 3px solid #10b981;
    }
    .assertion-fail {
      border-left-color: #f43f5e;
      background: #190e14;
    }
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
      <span class="badge-icon">🧪</span>
      <div>
        <h1>Prompt Regression Tester</h1>
        <p>Unit Tests & Regression Assertions for LLM Prompts</p>
      </div>
    </div>
    <div style="display:flex; gap: 8px;">
      <button class="btn" onclick="createSample()">+ Create Sample Suite</button>
      <button class="btn btn-primary" onclick="runAll()">▶ Run All Tests</button>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-val" style="color: #38bdf8;">${total}</div>
      <div class="stat-lbl">Total Tests</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #10b981;">${passedCount}</div>
      <div class="stat-lbl">Passed (${passRate}%)</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: ${failedCount > 0 ? '#f43f5e' : '#10b981'};">${failedCount}</div>
      <div class="stat-lbl">Failed</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #a855f7;">${avgLatency} ms</div>
      <div class="stat-lbl">Avg Response Latency</div>
    </div>
  </div>

  ${
    results.length === 0
      ? `<div class="clean-state">
          <h3>No Prompt Tests Executed Yet</h3>
          <p style="margin-top: 8px;">Create a <code>sample.prompt.json</code> file or click below to generate an automated test suite.</p>
          <button class="btn btn-primary" style="margin-top: 16px;" onclick="createSample()">Generate Sample Prompt Suite</button>
        </div>`
      : results
          .map((r) => {
            return `
      <div class="test-card">
        <div class="test-header">
          <div class="test-title">
            <span class="badge ${r.passed ? 'badge-pass' : 'badge-fail'}">
              ${r.passed ? '✓ PASSED' : '✗ FAILED'}
            </span>
            <strong>${escapeHtml(r.testName)}</strong>
            <span style="font-size: 11px; color: #64748b;">[${escapeHtml(r.model)}]</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; display:flex; gap: 12px;">
            <span>⏱️ ${r.latencyMs}ms</span>
            <span>🪙 ${r.tokensUsed} tokens</span>
            <span>🕒 ${r.timestamp}</span>
          </div>
        </div>
        <div class="test-body">
          <div style="font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 4px; font-weight: 700;">Prompt Input:</div>
          <div class="prompt-box">${escapeHtml(r.renderedPrompt)}</div>

          <div style="font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 4px; font-weight: 700;">Model Output:</div>
          <div class="output-box">${escapeHtml(r.responseOutput)}</div>

          <div style="font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 6px; font-weight: 700;">Assertion Checks (${r.assertions.length}):</div>
          <div class="assertions-list">
            ${r.assertions
              .map(
                (a) => `
              <div class="assertion-item ${a.passed ? '' : 'assertion-fail'}">
                <span>${a.passed ? '✓' : '✗'}</span>
                <strong>[${escapeHtml(a.type)}]</strong>
                <span>${escapeHtml(a.message)}</span>
              </div>`
              )
              .join('')}
          </div>
        </div>
      </div>`;
          })
          .join('')
  }

  <script>
    const vscode = acquireVsCodeApi();

    function runAll() {
      vscode.postMessage({ command: 'runAll' });
    }

    function createSample() {
      vscode.postMessage({ command: 'createSample' });
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
