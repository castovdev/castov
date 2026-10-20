import * as vscode from "vscode";
import { TokenEngine, SUPPORTED_MODELS } from "../engine/tokenizer";

export class CostCalculatorWebviewPanel {
  public static currentPanel: CostCalculatorWebviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, initialText = "") {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (CostCalculatorWebviewPanel.currentPanel) {
      CostCalculatorWebviewPanel.currentPanel.panel.reveal(column);
      if (initialText) {
        CostCalculatorWebviewPanel.currentPanel.panel.webview.postMessage({
          type: "setText",
          text: initialText,
        });
      }
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "tokenLensCalculator",
      "LLM Token & Cost Calculator",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    CostCalculatorWebviewPanel.currentPanel = new CostCalculatorWebviewPanel(
      panel,
      extensionUri,
      initialText
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly extensionUri: vscode.Uri,
    initialText: string
  ) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.updateContent(initialText);
  }

  public dispose() {
    CostCalculatorWebviewPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }

  private updateContent(initialText: string) {
    this.panel.webview.html = this.getHtml(initialText);
  }

  private getHtml(initialText: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LLM Token & Cost Calculator</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background, #090d16);
      --sidebar: var(--vscode-sideBar-background, #0f172a);
      --text: var(--vscode-editor-foreground, #f8fafc);
      --muted: var(--vscode-descriptionForeground, #94a3b8);
      --border: var(--vscode-widget-border, #1e293b);
      --accent: var(--vscode-button-background, #3b82f6);
      --accent-hover: var(--vscode-button-hoverBackground, #2563eb);
      --card: rgba(30, 41, 59, 0.4);
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
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .stat-card {
      background: var(--sidebar);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }
    .stat-val { font-size: 22px; font-weight: 700; color: #60a5fa; }
    .stat-lbl { font-size: 11px; color: var(--muted); text-transform: uppercase; }
    textarea {
      width: 100%;
      height: 150px;
      background: #020617;
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      font-family: monospace;
      font-size: 12px;
      outline: none;
      resize: vertical;
      margin-bottom: 20px;
    }
    textarea:focus { border-color: var(--accent); }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      background: var(--sidebar);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    th, td {
      padding: 10px 14px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th { color: var(--muted); font-weight: 600; background: rgba(0,0,0,0.2); }
    .cost-bar-bg {
      background: rgba(255,255,255,0.06);
      height: 6px;
      border-radius: 3px;
      width: 100%;
      margin-top: 4px;
      overflow: hidden;
    }
    .cost-bar-fill {
      height: 100%;
      background: #3b82f6;
      border-radius: 3px;
    }
    .scale-card {
      background: var(--sidebar);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
    }
    select {
      background: #020617;
      color: var(--text);
      border: 1px solid var(--border);
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">
      <span>🧮 LLM Token & Cost Lens</span>
      <span style="font-size:11px; padding:2px 8px; border-radius:4px; background:rgba(59,130,246,0.15); color:#60a5fa; border:1px solid rgba(59,130,246,0.3);">
        Live Pricing (Oct 2026)
      </span>
    </div>
  </div>

  <div class="stats-row">
    <div class="stat-card">
      <div id="statTokens" class="stat-val">0</div>
      <div class="stat-lbl">Estimated Tokens</div>
    </div>
    <div class="stat-card">
      <div id="statChars" class="stat-val">0</div>
      <div class="stat-lbl">Characters</div>
    </div>
    <div class="stat-card">
      <div id="statWords" class="stat-val">0</div>
      <div class="stat-lbl">Words</div>
    </div>
  </div>

  <label style="font-size:12px; font-weight:600; color:var(--muted); display:block; margin-bottom:6px;">
    Paste or Type Prompt / Code / Context:
  </label>
  <textarea id="inputArea" placeholder="Paste your system prompt, user prompt, or source code here to instantly see token count and cost breakdown...">${initialText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</textarea>

  <h3 style="margin-bottom:10px;">Model Cost Comparison (Single Invocation)</h3>
  <table>
    <thead>
      <tr>
        <th>Model</th>
        <th>Provider</th>
        <th>Input Cost</th>
        <th>Output Cost (1k out)</th>
        <th>Context Window</th>
        <th>Relative Cost</th>
      </tr>
    </thead>
    <tbody id="modelsTableBody"></tbody>
  </table>

  <div class="scale-card">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <h3 style="font-size:13px;">Monthly Production Cost Simulator</h3>
      <div>
        <label style="font-size:12px; color:var(--muted); margin-right:6px;">Daily Calls:</label>
        <select id="scaleSelect" onchange="renderSimulator()">
          <option value="1000">1,000 / day (30k/mo)</option>
          <option value="10000" selected>10,000 / day (300k/mo)</option>
          <option value="50000">50,000 / day (1.5M/mo)</option>
          <option value="100000">100,000 / day (3M/mo)</option>
        </select>
      </div>
    </div>
    <div id="simulatorResults" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px;"></div>
  </div>

  <script>
    const MODELS = ${JSON.stringify(SUPPORTED_MODELS)};
    const area = document.getElementById("inputArea");

    window.addEventListener("message", (event) => {
      if (event.data.type === "setText") {
        area.value = event.data.text;
        analyze();
      }
    });

    area.addEventListener("input", () => analyze());

    function countTokens(text) {
      if (!text) return 0;
      const regex = /[A-Za-z]+|\\d+|[^\\s\\w]|\\s+/g;
      let tokens = 0;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const s = match[0];
        const len = s.length;
        if (/^\\s+$/.test(s)) tokens += Math.ceil(len / 4);
        else if (/^\\d+$/.test(s)) tokens += Math.ceil(len / 2.5);
        else if (/^[A-Za-z]+$/.test(s)) tokens += len <= 4 ? 1 : Math.ceil(len / 3.8);
        else tokens += Math.ceil(len / 1.5);
      }
      return Math.max(tokens, text.trim().length > 0 ? 1 : 0);
    }

    function formatCost(num) {
      if (num < 0.00001) return "< $0.00001";
      if (num < 0.01) return "$" + num.toFixed(5);
      return "$" + num.toFixed(4);
    }

    function analyze() {
      const text = area.value;
      const tokens = countTokens(text);
      const chars = text.length;
      const words = text.trim().length > 0 ? text.trim().split(/\\s+/).length : 0;

      document.getElementById("statTokens").textContent = tokens.toLocaleString();
      document.getElementById("statChars").textContent = chars.toLocaleString();
      document.getElementById("statWords").textContent = words.toLocaleString();

      const tbody = document.getElementById("modelsTableBody");
      const maxCost = (tokens / 1000000) * 3.0; // Claude 3.5 Sonnet baseline

      tbody.innerHTML = MODELS.map(m => {
        const inputCost = (tokens / 1000000) * m.inputPerMillion;
        const outCost1k = (1000 / 1000000) * m.outputPerMillion;
        const barPct = maxCost > 0 ? Math.min(100, (inputCost / maxCost) * 100) : 0;
        const ctxPct = m.contextWindow > 0 ? ((tokens / m.contextWindow) * 100).toFixed(2) : "0";

        return \`
          <tr>
            <td style="font-weight:600">\${m.name}</td>
            <td style="color:var(--muted)">\${m.provider}</td>
            <td style="font-weight:600; color:#34d399">\${formatCost(inputCost)}</td>
            <td>\${formatCost(outCost1k)}</td>
            <td>\${ctxPct}% of \${(m.contextWindow/1000).toLocaleString()}k</td>
            <td style="width:140px;">
              <div class="cost-bar-bg">
                <div class="cost-bar-fill" style="width:\${barPct}%;"></div>
              </div>
            </td>
          </tr>
        \`;
      }).join("");

      renderSimulator();
    }

    function renderSimulator() {
      const tokens = countTokens(area.value);
      const dailyCalls = parseInt(document.getElementById("scaleSelect").value, 10);
      const monthlyCalls = dailyCalls * 30;

      const container = document.getElementById("simulatorResults");
      container.innerHTML = MODELS.map(m => {
        const monthlyCost = (tokens / 1000000) * m.inputPerMillion * monthlyCalls;
        return \`
          <div style="background:#020617; border:1px solid var(--border); border-radius:6px; padding:10px; text-align:center;">
            <div style="font-size:11px; color:var(--muted)">\${m.name}</div>
            <div style="font-size:16px; font-weight:700; color:#60a5fa; margin-top:2px;">$\${monthlyCost.toFixed(2)}/mo</div>
          </div>
        \`;
      }).join("");
    }

    analyze();
  </script>
</body>
</html>`;
  }
}
