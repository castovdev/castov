import * as vscode from "vscode";
import { McpServerConfig, McpTool, TrafficLogEntry, SecurityFinding } from "../types/mcp";
import { StdioMcpClient } from "../client/stdio-client";
import { McpSecurityScanner } from "../security/security-scanner";

export class InspectorWebviewPanel {
  public static currentPanel: InspectorWebviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private servers: McpServerConfig[] = [];
  private selectedServer: McpServerConfig | null = null;
  private client: StdioMcpClient | null = null;
  private tools: McpTool[] = [];
  private trafficLogs: TrafficLogEntry[] = [];
  private securityFindings: SecurityFinding[] = [];

  public static createOrShow(extensionUri: vscode.Uri, initialServers: McpServerConfig[]) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (InspectorWebviewPanel.currentPanel) {
      InspectorWebviewPanel.currentPanel.panel.reveal(column);
      InspectorWebviewPanel.currentPanel.updateServers(initialServers);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "mcpInspectorPlayground",
      "MCP Inspector & Debugger",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    InspectorWebviewPanel.currentPanel = new InspectorWebviewPanel(panel, extensionUri, initialServers);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly extensionUri: vscode.Uri,
    initialServers: McpServerConfig[]
  ) {
    this.panel = panel;
    this.servers = initialServers;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async (message: any) => {
        switch (message.command) {
          case "selectServer":
            await this.handleSelectServer(message.serverName);
            break;
          case "callTool":
            await this.handleCallTool(message.toolName, message.args);
            break;
          case "runSecurityAudit":
            this.handleRunSecurityAudit();
            break;
          case "clearLogs":
            this.trafficLogs = [];
            this.sendToWebview({ type: "updateLogs", logs: [] });
            break;
          case "refresh":
            this.sendToWebview({
              type: "init",
              servers: this.servers,
              selectedServer: this.selectedServer ? this.selectedServer.name : null,
              tools: this.tools,
              logs: this.trafficLogs,
              findings: this.securityFindings,
            });
            break;
        }
      },
      null,
      this.disposables
    );

    this.updateWebviewContent();
    if (this.servers.length > 0) {
      this.handleSelectServer(this.servers[0].name);
    }
  }

  public updateServers(servers: McpServerConfig[]) {
    this.servers = servers;
    this.handleRunSecurityAudit();
    this.sendToWebview({
      type: "updateServers",
      servers: this.servers,
      findings: this.securityFindings,
    });
  }

  private async handleSelectServer(serverName: string) {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }

    const found = this.servers.find((s) => s.name === serverName);
    if (!found) return;

    this.selectedServer = found;
    this.tools = [];
    this.sendToWebview({ type: "loading", message: `Connecting to ${serverName}...` });

    try {
      this.client = new StdioMcpClient(found);
      this.client.on("traffic", (entry: TrafficLogEntry) => {
        this.trafficLogs.unshift(entry);
        if (this.trafficLogs.length > 100) this.trafficLogs.pop();
        this.sendToWebview({ type: "newLog", log: entry });
      });

      await this.client.connect();
      this.tools = await this.client.listTools();

      // Audit tools
      const toolFindings = McpSecurityScanner.auditTools(serverName, this.tools);
      this.securityFindings = [
        ...this.securityFindings.filter((f) => f.serverName !== serverName || !f.id.includes("sec-inj")),
        ...toolFindings,
      ];

      this.sendToWebview({
        type: "serverConnected",
        server: this.selectedServer,
        tools: this.tools,
        findings: this.securityFindings,
      });
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to connect to MCP server "${serverName}": ${err.message}`);
      this.sendToWebview({
        type: "error",
        message: err.message,
      });
    }
  }

  private async handleCallTool(toolName: string, args: Record<string, any>) {
    if (!this.client || !this.selectedServer) {
      vscode.window.showErrorMessage("No MCP server currently connected.");
      return;
    }

    this.sendToWebview({ type: "toolExecuting", toolName });
    const start = Date.now();
    try {
      const result = await this.client.callTool(toolName, args);
      const durationMs = Date.now() - start;
      this.sendToWebview({
        type: "toolResult",
        toolName,
        success: true,
        durationMs,
        result,
      });
    } catch (err: any) {
      const durationMs = Date.now() - start;
      this.sendToWebview({
        type: "toolResult",
        toolName,
        success: false,
        durationMs,
        error: err.message,
      });
    }
  }

  private handleRunSecurityAudit() {
    this.securityFindings = McpSecurityScanner.auditServerConfigs(this.servers);
    if (this.selectedServer && this.tools.length > 0) {
      const toolFindings = McpSecurityScanner.auditTools(this.selectedServer.name, this.tools);
      this.securityFindings.push(...toolFindings);
    }
    this.sendToWebview({ type: "securityAuditResult", findings: this.securityFindings });
  }

  private sendToWebview(msg: any) {
    this.panel.webview.postMessage(msg);
  }

  public dispose() {
    InspectorWebviewPanel.currentPanel = undefined;
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }

  private updateWebviewContent() {
    this.panel.webview.html = this.getHtmlForWebview();
  }

  private getHtmlForWebview(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP Inspector & Debugger</title>
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
      --card-bg: rgba(30, 41, 59, 0.5);
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
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
    }
    .badge {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }
    .badge.connected {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.3);
    }
    .badge.danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.3);
    }
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
    .tab-btn.active {
      color: var(--text);
      border-bottom-color: var(--accent);
    }
    .tab-btn:hover { color: var(--text); }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .select-group {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 16px;
    }
    select, input, textarea {
      background: var(--sidebar);
      color: var(--text);
      border: 1px solid var(--border);
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      outline: none;
    }
    select:focus, input:focus, textarea:focus {
      border-color: var(--accent);
    }
    .btn {
      background: var(--accent);
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      font-size: 13px;
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
    .grid-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 16px;
    }
    .tool-list {
      background: var(--sidebar);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      max-height: calc(100vh - 180px);
      overflow-y: auto;
    }
    .tool-item {
      padding: 10px 12px;
      cursor: pointer;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      transition: background 0.15s;
    }
    .tool-item:hover { background: rgba(255, 255, 255, 0.05); }
    .tool-item.active {
      background: rgba(59, 130, 246, 0.15);
      border-left: 3px solid var(--accent);
    }
    .tool-name { font-weight: 600; font-family: monospace; }
    .tool-desc-short { font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .panel-card {
      background: var(--sidebar);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
    }
    .form-group { margin-bottom: 12px; }
    .form-group label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--muted);
      margin-bottom: 4px;
    }
    .form-group input, .form-group textarea {
      width: 100%;
    }
    .result-box {
      margin-top: 16px;
      background: #020617;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px;
      font-family: monospace;
      font-size: 12px;
      max-height: 320px;
      overflow-y: auto;
      white-space: pre-wrap;
    }
    .traffic-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      font-family: monospace;
    }
    .traffic-table th, .traffic-table td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    .traffic-table th { color: var(--muted); font-weight: 500; }
    .traffic-row:hover { background: rgba(255, 255, 255, 0.03); }
    .type-req { color: #60a5fa; }
    .type-res { color: #34d399; }
    .type-err { color: #f87171; }
    .audit-card {
      background: var(--sidebar);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 12px;
    }
    .audit-card.critical { border-left: 4px solid var(--danger); }
    .audit-card.high { border-left: 4px solid #f97316; }
    .audit-card.medium { border-left: 4px solid var(--warning); }
    .audit-card.low { border-left: 4px solid #38bdf8; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">
      <span>⚡ Castov MCP Inspector</span>
      <span id="serverBadge" class="badge">Idle</span>
    </div>
    <div style="display:flex; gap:8px;">
      <button class="btn btn-secondary" onclick="runAudit()">🛡️ Security Audit</button>
      <button class="btn btn-secondary" onclick="refreshServers()">🔄 Refresh</button>
    </div>
  </div>

  <div class="tabs">
    <button class="tab-btn active" onclick="switchTab('tester')">Tool Tester & Form</button>
    <button class="tab-btn" onclick="switchTab('traffic')">Traffic Log (JSON-RPC)</button>
    <button class="tab-btn" onclick="switchTab('security')">Security Scanner</button>
  </div>

  <!-- TAB 1: TESTER -->
  <div id="tab-tester" class="tab-content active">
    <div class="select-group">
      <label style="font-weight:600;">Server:</label>
      <select id="serverSelect" onchange="changeServer(this.value)">
        <option value="">(Select an MCP Server)</option>
      </select>
      <span id="toolCountBadge" class="badge">0 tools</span>
    </div>

    <div class="grid-layout">
      <div class="tool-list" id="toolListContainer">
        <div style="padding:16px; color:var(--muted); text-align:center;">No tools discovered yet.</div>
      </div>

      <div class="panel-card" id="toolTesterPanel">
        <h3 id="currentToolTitle" style="margin-bottom:6px;">Select a tool to test</h3>
        <p id="currentToolDesc" style="color:var(--muted); font-size:12px; margin-bottom:16px;">Click on any tool from the list to view its schema and execute calls.</p>

        <form id="toolForm" onsubmit="executeToolCall(event)" style="display:none;">
          <div id="formFieldsContainer"></div>
          <div style="margin-top:16px; display:flex; gap:10px;">
            <button type="submit" class="btn" id="execBtn">▶ Execute Tool (JSON-RPC)</button>
          </div>
        </form>

        <div id="resultContainer" style="display:none; margin-top:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label style="font-weight:600; font-size:12px;">Result</label>
            <span id="durationBadge" class="badge">0ms</span>
          </div>
          <div id="resultBox" class="result-box"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- TAB 2: TRAFFIC LOG -->
  <div id="tab-traffic" class="tab-content">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <p style="color:var(--muted); font-size:12px;">Live JSON-RPC 2.0 messages passing between VS Code and the MCP Server.</p>
      <button class="btn btn-secondary" onclick="clearLogs()">Clear Log</button>
    </div>
    <div style="background:var(--sidebar); border:1px solid var(--border); border-radius:8px; overflow:hidden;">
      <table class="traffic-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Type</th>
            <th>Method</th>
            <th>Latency</th>
            <th>Payload</th>
          </tr>
        </thead>
        <tbody id="trafficTableBody">
          <tr><td colspan="5" style="text-align:center; color:var(--muted); padding:20px;">No traffic logged yet.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- TAB 3: SECURITY SCANNER -->
  <div id="tab-security" class="tab-content">
    <div style="margin-bottom:16px;">
      <h3 style="margin-bottom:4px;">MCP Configuration Security Audit</h3>
      <p style="color:var(--muted); font-size:12px;">Automated scans detecting exposed API keys, dangerous shell access, and prompt injection risks.</p>
    </div>
    <div id="securityFindingsContainer">
      <div style="text-align:center; padding:30px; color:var(--muted);">Running initial security audit...</div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let currentServers = [];
    let currentTools = [];
    let selectedTool = null;
    let trafficLogs = [];

    window.addEventListener("message", (event) => {
      const msg = event.data;
      switch (msg.type) {
        case "updateServers":
          renderServerSelect(msg.servers);
          renderSecurityFindings(msg.findings || []);
          break;
        case "serverConnected":
          document.getElementById("serverBadge").textContent = "Connected (" + msg.server.name + ")";
          document.getElementById("serverBadge").className = "badge connected";
          currentTools = msg.tools;
          renderTools(msg.tools);
          renderSecurityFindings(msg.findings || []);
          break;
        case "toolExecuting":
          document.getElementById("execBtn").textContent = "⏳ Calling " + msg.toolName + "...";
          document.getElementById("execBtn").disabled = true;
          break;
        case "toolResult":
          document.getElementById("execBtn").textContent = "▶ Execute Tool (JSON-RPC)";
          document.getElementById("execBtn").disabled = false;
          renderResult(msg);
          break;
        case "newLog":
          trafficLogs.unshift(msg.log);
          renderTraffic();
          break;
        case "updateLogs":
          trafficLogs = msg.logs;
          renderTraffic();
          break;
        case "securityAuditResult":
          renderSecurityFindings(msg.findings);
          break;
      }
    });

    function switchTab(name) {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      event.target.classList.add("active");
      document.getElementById("tab-" + name).classList.add("active");
    }

    function renderServerSelect(servers) {
      currentServers = servers;
      const select = document.getElementById("serverSelect");
      select.innerHTML = '<option value="">(Select an MCP Server)</option>';
      servers.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.name;
        opt.textContent = s.name + " (" + s.command + ")";
        select.appendChild(opt);
      });
      if (servers.length > 0 && !select.value) {
        select.value = servers[0].name;
      }
    }

    function changeServer(name) {
      if (!name) return;
      vscode.postMessage({ command: "selectServer", serverName: name });
    }

    function renderTools(tools) {
      const countBadge = document.getElementById("toolCountBadge");
      countBadge.textContent = tools.length + " tools";

      const container = document.getElementById("toolListContainer");
      if (tools.length === 0) {
        container.innerHTML = '<div style="padding:16px; color:var(--muted); text-align:center;">No tools exposed by this server.</div>';
        return;
      }

      container.innerHTML = "";
      tools.forEach((tool, idx) => {
        const item = document.createElement("div");
        item.className = "tool-item" + (idx === 0 ? " active" : "");
        item.innerHTML = \`
          <div class="tool-name">\${tool.name}</div>
          <div class="tool-desc-short">\${tool.description || "No description provided."}</div>
        \`;
        item.onclick = () => selectTool(tool, item);
        container.appendChild(item);
      });

      if (tools.length > 0) {
        selectTool(tools[0], container.children[0]);
      }
    }

    function selectTool(tool, itemEl) {
      selectedTool = tool;
      document.querySelectorAll(".tool-item").forEach(i => i.classList.remove("active"));
      if (itemEl) itemEl.classList.add("active");

      document.getElementById("currentToolTitle").textContent = tool.name;
      document.getElementById("currentToolDesc").textContent = tool.description || "No description.";
      document.getElementById("toolForm").style.display = "block";
      document.getElementById("resultContainer").style.display = "none";

      renderFormFields(tool.inputSchema);
    }

    function renderFormFields(schema) {
      const container = document.getElementById("formFieldsContainer");
      container.innerHTML = "";

      if (!schema || !schema.properties || Object.keys(schema.properties).length === 0) {
        container.innerHTML = '<p style="color:var(--muted); font-size:12px; margin-bottom:12px;">This tool accepts no arguments.</p>';
        return;
      }

      const required = schema.required || [];
      for (const [key, prop] of Object.entries(schema.properties)) {
        const isReq = required.includes(key);
        const group = document.createElement("div");
        group.className = "form-group";

        const label = document.createElement("label");
        label.textContent = key + (isReq ? " *" : "") + (prop.description ? " – " + prop.description : "");
        group.appendChild(label);

        if (prop.type === "boolean") {
          const select = document.createElement("select");
          select.name = key;
          select.innerHTML = '<option value="true">true</option><option value="false">false</option>';
          group.appendChild(select);
        } else if (prop.type === "object" || prop.type === "array") {
          const textarea = document.createElement("textarea");
          textarea.name = key;
          textarea.rows = 3;
          textarea.placeholder = JSON.stringify(prop.default || {}, null, 2);
          group.appendChild(textarea);
        } else {
          const input = document.createElement("input");
          input.name = key;
          input.type = prop.type === "number" || prop.type === "integer" ? "number" : "text";
          input.placeholder = prop.default !== undefined ? String(prop.default) : "";
          if (isReq) input.required = true;
          group.appendChild(input);
        }

        container.appendChild(group);
      }
    }

    function executeToolCall(e) {
      e.preventDefault();
      if (!selectedTool) return;

      const formData = new FormData(e.target);
      const args = {};

      for (const [key, value] of formData.entries()) {
        const prop = selectedTool.inputSchema?.properties?.[key];
        if (prop?.type === "number" || prop?.type === "integer") {
          args[key] = Number(value);
        } else if (prop?.type === "boolean") {
          args[key] = value === "true";
        } else if (prop?.type === "object" || prop?.type === "array") {
          try {
            args[key] = JSON.parse(value);
          } catch {
            args[key] = value;
          }
        } else {
          args[key] = value;
        }
      }

      vscode.postMessage({
        command: "callTool",
        toolName: selectedTool.name,
        args,
      });
    }

    function renderResult(msg) {
      document.getElementById("resultContainer").style.display = "block";
      const box = document.getElementById("resultBox");
      const badge = document.getElementById("durationBadge");

      badge.textContent = (msg.durationMs || 0) + "ms";
      if (msg.success) {
        box.style.color = "#34d399";
        box.textContent = JSON.stringify(msg.result, null, 2);
      } else {
        box.style.color = "#f87171";
        box.textContent = "Error: " + msg.error;
      }
    }

    function renderTraffic() {
      const tbody = document.getElementById("trafficTableBody");
      if (trafficLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--muted); padding:20px;">No traffic logged yet.</td></tr>';
        return;
      }

      tbody.innerHTML = trafficLogs.map(l => \`
        <tr class="traffic-row">
          <td style="color:var(--muted)">\${l.timestamp}</td>
          <td class="type-\${l.type === 'request' ? 'req' : (l.type === 'response' ? 'res' : 'err')}">\${l.type.toUpperCase()}</td>
          <td style="font-weight:600">\${l.method || "-"}</td>
          <td>\${l.durationMs !== undefined ? l.durationMs + "ms" : "-"}</td>
          <td><pre style="max-height:60px; overflow:hidden; font-size:11px;">\${JSON.stringify(l.payload)}</pre></td>
        </tr>
      \`).join("");
    }

    function renderSecurityFindings(findings) {
      const container = document.getElementById("securityFindingsContainer");
      if (!findings || findings.length === 0) {
        container.innerHTML = \`
          <div style="background:rgba(16, 185, 129, 0.1); border:1px solid rgba(16, 185, 129, 0.3); border-radius:8px; padding:20px; text-align:center; color:#34d399;">
            ✅ Zero security risks detected across all MCP configurations. No exposed API keys, prompt injections, or dangerous commands found.
          </div>
        \`;
        return;
      }

      container.innerHTML = findings.map(f => \`
        <div class="audit-card \${f.severity}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="font-size:13px;">\${f.title}</strong>
            <span class="badge danger">\${f.severity.toUpperCase()}</span>
          </div>
          <p style="font-size:12px; margin-bottom:8px;">\${f.description}</p>
          <div style="font-size:11px; color:var(--muted); margin-bottom:6px;"><strong>Location:</strong> \`\${f.location}\`</div>
          <div style="font-size:12px; color:#60a5fa;">💡 <strong>Fix:</strong> \${f.recommendation}</div>
        </div>
      \`).join("");
    }

    function runAudit() {
      switchTab('security');
      vscode.postMessage({ command: "runSecurityAudit" });
    }

    function refreshServers() {
      vscode.postMessage({ command: "refresh" });
    }

    function clearLogs() {
      vscode.postMessage({ command: "clearLogs" });
    }
  </script>
</body>
</html>`;
  }
}
