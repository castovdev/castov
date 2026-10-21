import * as vscode from "vscode";
import { MCPSecurityTreeProvider } from "./views/security-tree-provider";
import { MCPSecurityStatusBarItem } from "./views/status-bar";
import { MCPSecurityWebviewPanel } from "./views/security-webview";
import { MCPConfigFinder } from "./scanner/config-finder";

export function activate(context: vscode.ExtensionContext) {
  // Tree View
  const treeProvider = new MCPSecurityTreeProvider();
  const treeView = vscode.window.createTreeView("mcpSecurity.auditView", {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // Status Bar
  const statusBar = new MCPSecurityStatusBarItem();
  context.subscriptions.push(statusBar);

  // Run initial scan
  statusBar.update();

  // Watch for changes in workspace mcp.json files
  const fileWatcher = vscode.workspace.createFileSystemWatcher(
    "**/{mcp.json,claude_desktop_config.json}"
  );
  fileWatcher.onDidChange(() => {
    treeProvider.refresh();
    statusBar.update();
    if (MCPSecurityWebviewPanel.currentPanel) {
      MCPSecurityWebviewPanel.currentPanel.refresh();
    }
  });
  fileWatcher.onDidCreate(() => {
    treeProvider.refresh();
    statusBar.update();
  });
  fileWatcher.onDidDelete(() => {
    treeProvider.refresh();
    statusBar.update();
  });
  context.subscriptions.push(fileWatcher);

  // Command: Scan All MCP Configs
  context.subscriptions.push(
    vscode.commands.registerCommand("mcpSecurity.scan", async () => {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "MCP Security: Auditing MCP configurations...",
          cancellable: false,
        },
        async () => {
          treeProvider.refresh();
          await statusBar.update();
          const summary = await MCPConfigFinder.runAudit();
          if (summary.criticalCount > 0) {
            vscode.window.showErrorMessage(
              `MCP Security Audit: Found ${summary.criticalCount} CRITICAL vulnerabilities! Grade: ${summary.overallGrade}.`,
              "Open Dashboard"
            ).then((action) => {
              if (action === "Open Dashboard") {
                MCPSecurityWebviewPanel.createOrShow(context.extensionUri);
              }
            });
          } else if (summary.highCount > 0) {
            vscode.window.showWarningMessage(
              `MCP Security Audit: Found ${summary.highCount} high risk warnings. Grade: ${summary.overallGrade}.`,
              "Open Dashboard"
            ).then((action) => {
              if (action === "Open Dashboard") {
                MCPSecurityWebviewPanel.createOrShow(context.extensionUri);
              }
            });
          } else {
            vscode.window.showInformationMessage(
              `MCP Security Audit: Passed! Grade: ${summary.overallGrade} (${summary.overallScore}/100) across ${summary.totalServers} servers.`
            );
          }
        }
      );
    })
  );

  // Command: Open Dashboard
  context.subscriptions.push(
    vscode.commands.registerCommand("mcpSecurity.openDashboard", () => {
      MCPSecurityWebviewPanel.createOrShow(context.extensionUri);
    })
  );
}

export function deactivate() {}
