import * as vscode from "vscode";
import { LogStoryTreeProvider } from "./views/traces-tree-provider";
import { LogStoryStatusBarItem } from "./views/status-bar";
import { LogStoryWebviewPanel } from "./views/story-webview";
import { LogParser } from "./parser/log-parser";

export function activate(context: vscode.ExtensionContext) {
  // Tree View
  const treeProvider = new LogStoryTreeProvider();
  const treeView = vscode.window.createTreeView("logStory.tracesView", {
    treeDataProvider: treeProvider,
  });
  context.subscriptions.push(treeView);

  // Status Bar
  const statusBar = new LogStoryStatusBarItem();
  context.subscriptions.push(statusBar);

  // Command: Open Dashboard
  context.subscriptions.push(
    vscode.commands.registerCommand("logStory.openDashboard", () => {
      LogStoryWebviewPanel.createOrShow(context.extensionUri);
    })
  );

  // Command: Analyze Current File
  context.subscriptions.push(
    vscode.commands.registerCommand("logStory.analyzeActiveFile", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("Open a log file first to analyze.");
        return;
      }

      const text = editor.document.getText();
      const report = LogParser.analyze(text);
      treeProvider.setReport(report);
      statusBar.updateReport(report);
      LogStoryWebviewPanel.createOrShow(context.extensionUri, text);

      vscode.window.showInformationMessage(
        `Log Story: Parsed ${report.totalRawLines} lines (-${report.foldedLinesCount} spam folded) into ${report.totalTraces} traces!`
      );
    })
  );

  // Command: Analyze Clipboard
  context.subscriptions.push(
    vscode.commands.registerCommand("logStory.analyzeClipboard", async () => {
      const text = await vscode.env.clipboard.readText();
      if (!text || !text.trim()) {
        vscode.window.showErrorMessage("Clipboard is empty. Copy some log text first.");
        return;
      }

      const report = LogParser.analyze(text);
      treeProvider.setReport(report);
      statusBar.updateReport(report);
      LogStoryWebviewPanel.createOrShow(context.extensionUri, text);

      vscode.window.showInformationMessage(
        `Log Story: Built story from clipboard (${report.totalRawLines} lines analyzed)!`
      );
    })
  );
}

export function deactivate() {}
