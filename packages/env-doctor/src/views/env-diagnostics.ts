import * as vscode from "vscode";
import * as path from "path";
import { EnvAuditReport } from "../types/env";

export class EnvDiagnosticsProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection("envDoctor");
  }

  public updateDiagnostics(workspaceRoot: string, report: EnvAuditReport): void {
    this.diagnosticCollection.clear();
    const fileDiagsMap = new Map<string, vscode.Diagnostic[]>();

    for (const issue of report.issues) {
      if (issue.type === "duplicate_key") {
        // issue.locations: ["fileName:line"]
        for (const loc of issue.locations) {
          const [file, lineStr] = loc.split(":");
          const fullPath = path.join(workspaceRoot, file);
          const lineNum = parseInt(lineStr, 10) - 1;

          const range = new vscode.Range(
            Math.max(0, lineNum),
            0,
            Math.max(0, lineNum),
            issue.variableName.length
          );

          const diag = new vscode.Diagnostic(
            range,
            `Env Doctor: Duplicate key "${issue.variableName}". Later values override earlier ones.`,
            vscode.DiagnosticSeverity.Warning
          );
          diag.source = "Env Doctor";

          if (!fileDiagsMap.has(fullPath)) {
            fileDiagsMap.set(fullPath, []);
          }
          fileDiagsMap.get(fullPath)!.push(diag);
        }
      }
    }

    for (const [filePath, diags] of fileDiagsMap) {
      this.diagnosticCollection.set(vscode.Uri.file(filePath), diags);
    }
  }

  public dispose(): void {
    this.diagnosticCollection.clear();
    this.diagnosticCollection.dispose();
  }
}
