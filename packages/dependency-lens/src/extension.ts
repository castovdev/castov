import * as vscode from "vscode";
import { DependencyRiskTreeProvider } from "./views/risk-tree-provider";
import { DependencyHoverProvider } from "./views/hover-provider";
import { DependencyCodeLensProvider } from "./views/codelens-provider";
import { DependencyStatusBarItem } from "./views/status-bar";
import { DependencyLensWebviewPanel } from "./views/risk-webview";
import { PackageAnalyzer } from "./analyzer/package-analyzer";

export function activate(context: vscode.ExtensionContext) {
  // Tree View
  const treeProvider = new DependencyRiskTreeProvider();
  const treeView = vscode.window.createTreeView("dependencyLens.riskView", {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // Status Bar
  const statusBar = new DependencyStatusBarItem();
  context.subscriptions.push(statusBar);
  statusBar.update();

  // Hover Provider for package.json
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { pattern: "**/package.json" },
      new DependencyHoverProvider()
    )
  );

  // CodeLens Provider for package.json
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { pattern: "**/package.json" },
      new DependencyCodeLensProvider()
    )
  );

  // Watch for package.json file changes
  const fileWatcher = vscode.workspace.createFileSystemWatcher("**/package.json");
  fileWatcher.onDidChange(() => {
    treeProvider.refresh();
    statusBar.update();
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

  // Command: Run Audit
  context.subscriptions.push(
    vscode.commands.registerCommand("dependencyLens.audit", async () => {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Dependency Lens: Auditing supply chain...",
          cancellable: false,
        },
        async () => {
          treeProvider.refresh();
          await statusBar.update();
          const summary = await PackageAnalyzer.auditWorkspace();
          const typosquats = summary.dependencies.filter((d) => d.isTyposquat).length;

          if (typosquats > 0) {
            vscode.window.showErrorMessage(
              `Dependency Alert: ${typosquats} suspected typosquatting package(s) detected!`,
              "Open Dashboard"
            ).then((action) => {
              if (action === "Open Dashboard") {
                DependencyLensWebviewPanel.createOrShow(context.extensionUri);
              }
            });
          } else if (summary.highCount > 0) {
            vscode.window.showWarningMessage(
              `Dependency Audit: ${summary.highCount} package(s) have security warnings.`,
              "Open Dashboard"
            ).then((action) => {
              if (action === "Open Dashboard") {
                DependencyLensWebviewPanel.createOrShow(context.extensionUri);
              }
            });
          } else {
            vscode.window.showInformationMessage(
              `Dependency Audit: Clean! All ${summary.totalDependencies} dependencies verified safe.`
            );
          }
        }
      );
    })
  );

  // Command: Open Dashboard
  context.subscriptions.push(
    vscode.commands.registerCommand("dependencyLens.openDashboard", () => {
      DependencyLensWebviewPanel.createOrShow(context.extensionUri);
    })
  );
}

export function deactivate() {}
