import * as vscode from "vscode";
import { SessionRecorder } from "./recorder/session-recorder";
import { AgentReplayTreeProvider } from "./views/timeline-tree-provider";
import { ReplayStatusBarItem } from "./views/status-bar";
import { AgentReplayWebviewPanel } from "./views/replay-webview";

export function activate(context: vscode.ExtensionContext) {
  const recorder = SessionRecorder.getInstance();

  // Tree View
  const treeProvider = new AgentReplayTreeProvider();
  const treeView = vscode.window.createTreeView("agentReplay.timelineView", {
    treeDataProvider: treeProvider,
  });
  context.subscriptions.push(treeView);

  // Status Bar
  const statusBar = new ReplayStatusBarItem();
  context.subscriptions.push(statusBar);

  // Track currently active editor files
  if (vscode.window.activeTextEditor) {
    recorder.trackFileOpen(
      vscode.window.activeTextEditor.document.fileName,
      vscode.window.activeTextEditor.document.getText()
    );
  }

  // Listen to active editor switches
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        recorder.trackFileOpen(editor.document.fileName, editor.document.getText());
      }
    })
  );

  // Listen to document changes to record snapshots
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      recorder.handleDocumentChange(e.document);
    })
  );

  // Command: Open Dashboard
  context.subscriptions.push(
    vscode.commands.registerCommand("agentReplay.openDashboard", () => {
      AgentReplayWebviewPanel.createOrShow(context.extensionUri);
    })
  );

  // Command: Capture Manual Snapshot
  context.subscriptions.push(
    vscode.commands.registerCommand("agentReplay.createSnapshot", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("Open a file first to capture a snapshot.");
        return;
      }
      const text = editor.document.getText();
      const snap = recorder.recordChange(
        editor.document.fileName,
        text,
        text,
        `Manual Snapshot: ${editor.document.fileName}`
      );
      vscode.window.showInformationMessage(
        `Agent Replay: Captured snapshot (Step ${snap.stepNumber})!`
      );
    })
  );

  // Command: Clear Session
  context.subscriptions.push(
    vscode.commands.registerCommand("agentReplay.clearSession", () => {
      recorder.clearSession();
      vscode.window.showInformationMessage("Agent Replay: Cleared session history.");
    })
  );
}

export function deactivate() {}
