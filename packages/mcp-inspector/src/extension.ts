import * as vscode from "vscode";
import { ConfigScanner } from "./scanner/config-scanner";
import { McpServersTreeDataProvider } from "./views/server-tree-provider";
import { InspectorWebviewPanel } from "./views/inspector-webview";
import { McpSecurityScanner } from "./security/security-scanner";
import { McpServerConfig, McpTool } from "./types/mcp";

export function activate(context: vscode.ExtensionContext) {
  let servers = ConfigScanner.scanAllServers();

  // 1. Sidebar Tree Data Provider
  const treeDataProvider = new McpServersTreeDataProvider(servers);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("mcpInspector.serversView", treeDataProvider)
  );

  // 2. Command: Refresh Servers
  context.subscriptions.push(
    vscode.commands.registerCommand("mcpInspector.refreshServers", () => {
      servers = ConfigScanner.scanAllServers();
      treeDataProvider.refresh(servers);
      if (InspectorWebviewPanel.currentPanel) {
        InspectorWebviewPanel.currentPanel.updateServers(servers);
      }
      vscode.window.showInformationMessage(
        `Castov MCP Inspector: Discovered ${servers.length} server(s).`
      );
    })
  );

  // 3. Command: Open Interactive Inspector & Tester
  context.subscriptions.push(
    vscode.commands.registerCommand("mcpInspector.openPlayground", () => {
      servers = ConfigScanner.scanAllServers();
      InspectorWebviewPanel.createOrShow(context.extensionUri, servers);
    })
  );

  // 4. Command: Test Specific Tool from Tree
  context.subscriptions.push(
    vscode.commands.registerCommand("mcpInspector.testTool", (_serverConfig?: McpServerConfig, _tool?: McpTool) => {
      servers = ConfigScanner.scanAllServers();
      InspectorWebviewPanel.createOrShow(context.extensionUri, servers);
    })
  );

  // 5. Command: Run Security Audit
  context.subscriptions.push(
    vscode.commands.registerCommand("mcpInspector.runSecurityAudit", () => {
      servers = ConfigScanner.scanAllServers();
      const findings = McpSecurityScanner.auditServerConfigs(servers);

      if (findings.length === 0) {
        vscode.window.showInformationMessage(
          "Castov Security: ✅ Zero risks detected across all MCP configurations."
        );
      } else {
        const criticalCount = findings.filter((f) => f.severity === "critical").length;
        const msg = `Castov Security: Found ${findings.length} issue(s) (${criticalCount} Critical).`;
        vscode.window.showWarningMessage(msg, "Open Inspector").then((choice: string | undefined) => {
          if (choice === "Open Inspector") {
            InspectorWebviewPanel.createOrShow(context.extensionUri, servers);
          }
        });
      }

      if (InspectorWebviewPanel.currentPanel) {
        InspectorWebviewPanel.currentPanel.updateServers(servers);
      }
    })
  );

  // Watch for changes to .cursor/mcp.json or .vscode/mcp.json
  const watcher = vscode.workspace.createFileSystemWatcher("**/mcp.json");
  watcher.onDidChange(() => vscode.commands.executeCommand("mcpInspector.refreshServers"));
  watcher.onDidCreate(() => vscode.commands.executeCommand("mcpInspector.refreshServers"));
  watcher.onDidDelete(() => vscode.commands.executeCommand("mcpInspector.refreshServers"));
  context.subscriptions.push(watcher);
}

export function deactivate() {
  if (InspectorWebviewPanel.currentPanel) {
    InspectorWebviewPanel.currentPanel.dispose();
  }
}
