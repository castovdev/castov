import * as vscode from "vscode";
import { BidiDiagnosticsProvider } from "./providers/diagnostics-provider";
import { RtlCommentHoverProvider } from "./providers/rtl-hover-provider";
import { BidiTreeDataProvider } from "./views/bidi-tree-provider";
import { BidiDashboardWebviewPanel } from "./views/bidi-dashboard-webview";
import { WorkspaceScanner } from "./scanner/workspace-scanner";

export function activate(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const workspaceRoot = workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : "";

  let summary = workspaceRoot ? WorkspaceScanner.scanWorkspace(workspaceRoot) : {
    totalFilesScanned: 0,
    threats: [],
    trojanSourceCount: 0,
    invisibleCount: 0,
    homoglyphCount: 0,
    rtlCommentsCount: 0,
  };

  // 1. Diagnostics Provider & Code Action Provider
  const diagnosticsProvider = new BidiDiagnosticsProvider();
  context.subscriptions.push(diagnosticsProvider);
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("*", diagnosticsProvider, {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
    })
  );

  // 2. RTL Arabic / Hebrew Comment Hover Provider
  context.subscriptions.push(
    vscode.languages.registerHoverProvider({ scheme: "file" }, new RtlCommentHoverProvider())
  );

  // 3. Sidebar Tree Data Provider
  const treeDataProvider = new BidiTreeDataProvider(summary);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("bidiGuard.mainView", treeDataProvider)
  );

  // Check active document diagnostics
  if (vscode.window.activeTextEditor) {
    diagnosticsProvider.updateDiagnostics(vscode.window.activeTextEditor.document);
  }

  vscode.workspace.onDidChangeTextDocument(
    (e) => diagnosticsProvider.updateDiagnostics(e.document),
    null,
    context.subscriptions
  );

  vscode.workspace.onDidOpenTextDocument(
    (doc) => diagnosticsProvider.updateDiagnostics(doc),
    null,
    context.subscriptions
  );

  // 4. Command: Open Dashboard
  context.subscriptions.push(
    vscode.commands.registerCommand("bidiGuard.openDashboard", () => {
      if (!workspaceRoot) {
        vscode.window.showErrorMessage("Bidi Guard: Please open a workspace folder first.");
        return;
      }
      BidiDashboardWebviewPanel.createOrShow(context.extensionUri, workspaceRoot);
    })
  );

  // 5. Command: Scan Workspace
  context.subscriptions.push(
    vscode.commands.registerCommand("bidiGuard.scanWorkspace", () => {
      if (!workspaceRoot) return;
      summary = WorkspaceScanner.scanWorkspace(workspaceRoot);
      treeDataProvider.refresh(summary);
      if (BidiDashboardWebviewPanel.currentPanel) {
        BidiDashboardWebviewPanel.currentPanel.updateSummary(summary);
      }
      const securityCount = summary.threats.filter((t) => t.category !== "rtl_comment").length;
      if (securityCount === 0) {
        vscode.window.showInformationMessage("Bidi Guard: ✅ 0 Unicode threats found across workspace.");
      } else {
        vscode.window.showWarningMessage(
          `Bidi Guard: Found ${securityCount} Unicode threat(s) across ${summary.totalFilesScanned} files.`,
          "Open Dashboard"
        ).then((choice) => {
          if (choice === "Open Dashboard") {
            BidiDashboardWebviewPanel.createOrShow(context.extensionUri, workspaceRoot);
          }
        });
      }
    })
  );

  // 6. Command: Clean Current File
  context.subscriptions.push(
    vscode.commands.registerCommand("bidiGuard.cleanCurrentFile", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const doc = editor.document;
      const text = doc.getText();
      // Replace invisible zero-width and Trojan source chars
      const cleaned = text.replace(/[\u202A-\u202E\u2066-\u2069\u200B-\u200D\uFEFF]/g, "");

      if (cleaned === text) {
        vscode.window.showInformationMessage("Bidi Guard: Current file has no invisible or Trojan Source characters.");
        return;
      }

      const fullRange = new vscode.Range(
        doc.positionAt(0),
        doc.positionAt(text.length)
      );

      editor.edit((edit) => {
        edit.replace(fullRange, cleaned);
      });

      vscode.window.showInformationMessage("Bidi Guard: Successfully stripped invisible Unicode characters from file!");
    })
  );
}

export function deactivate() {
  if (BidiDashboardWebviewPanel.currentPanel) {
    BidiDashboardWebviewPanel.currentPanel.dispose();
  }
}
