import * as vscode from "vscode";
import { EnvAuditor } from "./doctor/env-auditor";
import { EnvGenerator } from "./doctor/env-generator";
import { EnvDoctorTreeDataProvider } from "./views/env-tree-provider";
import { EnvDoctorWebviewPanel } from "./views/env-doctor-webview";
import { EnvDiagnosticsProvider } from "./views/env-diagnostics";

export function activate(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) return;

  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  let report = EnvAuditor.runAudit(workspaceRoot);

  // 1. Diagnostics Provider
  const diagnosticsProvider = new EnvDiagnosticsProvider();
  diagnosticsProvider.updateDiagnostics(workspaceRoot, report);
  context.subscriptions.push(diagnosticsProvider);

  // 2. Tree Data Provider
  const treeDataProvider = new EnvDoctorTreeDataProvider(report);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("envDoctor.auditView", treeDataProvider)
  );

  const refreshAll = () => {
    report = EnvAuditor.runAudit(workspaceRoot);
    diagnosticsProvider.updateDiagnostics(workspaceRoot, report);
    treeDataProvider.refresh(report);
    if (EnvDoctorWebviewPanel.currentPanel) {
      EnvDoctorWebviewPanel.currentPanel.updateReport(report);
    }
  };

  // 3. Command: Open Interactive Dashboard
  context.subscriptions.push(
    vscode.commands.registerCommand("envDoctor.openDashboard", () => {
      EnvDoctorWebviewPanel.createOrShow(context.extensionUri, workspaceRoot);
    })
  );

  // 4. Command: Run Audit & Rescan
  context.subscriptions.push(
    vscode.commands.registerCommand("envDoctor.runAudit", () => {
      refreshAll();
      vscode.window.showInformationMessage(
        `Env Doctor: Audit completed (${report.healthScore}% Health, ${report.issues.length} issue(s)).`
      );
    })
  );

  // 5. Command: Generate Clean .env.example
  context.subscriptions.push(
    vscode.commands.registerCommand("envDoctor.generateExample", () => {
      const res = EnvGenerator.generateCleanExample(workspaceRoot, report);
      if (res.success) {
        refreshAll();
        vscode.window.showInformationMessage("Env Doctor: Generated clean .env.example!");
        vscode.workspace.openTextDocument(res.filePath).then((doc) => vscode.window.showTextDocument(doc));
      } else {
        vscode.window.showErrorMessage("Env Doctor: Failed to generate .env.example.");
      }
    })
  );

  // 6. Command: Add Missing Variables to .env
  context.subscriptions.push(
    vscode.commands.registerCommand("envDoctor.addMissingToEnv", () => {
      const missingKeys = report.issues
        .filter((i) => i.type === "missing_in_env")
        .map((i) => i.variableName);

      if (missingKeys.length === 0) {
        vscode.window.showInformationMessage("Env Doctor: No missing variables to add.");
        return;
      }

      const success = EnvGenerator.addMissingVariablesToEnv(workspaceRoot, missingKeys);
      if (success) {
        refreshAll();
        vscode.window.showInformationMessage(`Env Doctor: Added ${missingKeys.length} missing variable(s) to .env!`);
      } else {
        vscode.window.showErrorMessage("Env Doctor: Failed to update .env.");
      }
    })
  );

  // 7. Watch for .env file modifications
  const watcher = vscode.workspace.createFileSystemWatcher("**/.env*");
  watcher.onDidChange(refreshAll);
  watcher.onDidCreate(refreshAll);
  watcher.onDidDelete(refreshAll);
  context.subscriptions.push(watcher);
}

export function deactivate() {
  if (EnvDoctorWebviewPanel.currentPanel) {
    EnvDoctorWebviewPanel.currentPanel.dispose();
  }
}
