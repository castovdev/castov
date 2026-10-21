import * as vscode from "vscode";
import { AIBlameTreeProvider } from "./views/blame-tree-provider";
import { InlineBlameDecorator } from "./views/inline-blame-decorator";
import { AIBlameStatusBarItem } from "./views/status-bar";
import { AIBlameWebviewPanel } from "./views/blame-webview";
import { GitBlameParser } from "./blame/git-blame-parser";

export function activate(context: vscode.ExtensionContext) {
  // Tree View
  const treeProvider = new AIBlameTreeProvider();
  const treeView = vscode.window.createTreeView("aiBlame.metricsView", {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // Status Bar
  const statusBar = new AIBlameStatusBarItem();
  context.subscriptions.push(statusBar);

  // Inline Blame Decorator
  const decorator = new InlineBlameDecorator();
  context.subscriptions.push(decorator);

  // Command: Toggle Inline Blame
  context.subscriptions.push(
    vscode.commands.registerCommand("aiBlame.toggleInlineBlame", () => {
      const enabled = decorator.toggle();
      vscode.window.showInformationMessage(
        `AI Blame: Active line annotations ${enabled ? "enabled" : "disabled"}.`
      );
    })
  );

  // Command: Scan Workspace
  context.subscriptions.push(
    vscode.commands.registerCommand("aiBlame.scanWorkspace", async () => {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "AI Blame: Scanning workspace code authorship...",
          cancellable: false,
        },
        async () => {
          treeProvider.refresh();
          await statusBar.update();
          const summary = await GitBlameParser.analyzeWorkspace();
          vscode.window.showInformationMessage(
            `AI Blame: Scan complete! Workspace is ${summary.overallAiPercentage}% AI-assisted across ${summary.totalFiles} files.`,
            "Open Analytics"
          ).then((action) => {
            if (action === "Open Analytics") {
              AIBlameWebviewPanel.createOrShow(context.extensionUri);
            }
          });
        }
      );
    })
  );

  // Command: Open Dashboard
  context.subscriptions.push(
    vscode.commands.registerCommand("aiBlame.openDashboard", () => {
      AIBlameWebviewPanel.createOrShow(context.extensionUri);
    })
  );
}

export function deactivate() {}
