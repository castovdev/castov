import * as vscode from "vscode";
import { UnicodeScanner } from "../scanner/unicode-patterns";
import { UnicodeThreat } from "../types/bidi";

export class BidiDiagnosticsProvider implements vscode.CodeActionProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection("bidiGuard");
  }

  public updateDiagnostics(document: vscode.TextDocument): void {
    if (document.uri.scheme !== "file") return;

    const text = document.getText();
    const threats = UnicodeScanner.scanText(text, document.uri.fsPath);

    const diagnostics: vscode.Diagnostic[] = [];

    for (const t of threats) {
      if (t.category === "rtl_comment") continue; // comments are not security diagnostics

      const line = Math.max(0, t.line - 1);
      const col = Math.max(0, t.col - 1);
      const range = new vscode.Range(line, col, line, col + 1);

      let severity = vscode.DiagnosticSeverity.Warning;
      if (t.severity === "critical") severity = vscode.DiagnosticSeverity.Error;
      else if (t.severity === "medium") severity = vscode.DiagnosticSeverity.Information;

      const diag = new vscode.Diagnostic(
        range,
        `Bidi Guard [${t.codePoint}]: ${t.charName}. ${t.description}`,
        severity
      );
      diag.source = "Bidi Guard";
      diag.code = t.codePoint;

      diagnostics.push(diag);
    }

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  public clearDocument(document: vscode.TextDocument): void {
    this.diagnosticCollection.delete(document.uri);
  }

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    for (const diag of context.diagnostics) {
      if (diag.source !== "Bidi Guard") continue;

      if (diag.code === "U+037E") {
        const fix = new vscode.CodeAction(
          "Replace Greek Question Mark with ASCII Semicolon (;)",
          vscode.CodeActionKind.QuickFix
        );
        fix.edit = new vscode.WorkspaceEdit();
        fix.edit.replace(document.uri, diag.range, ";");
        fix.isPreferred = true;
        actions.push(fix);
      } else {
        const fix = new vscode.CodeAction(
          `Remove invisible/BiDi character (${diag.code})`,
          vscode.CodeActionKind.QuickFix
        );
        fix.edit = new vscode.WorkspaceEdit();
        fix.edit.delete(document.uri, diag.range);
        fix.isPreferred = true;
        actions.push(fix);
      }
    }

    return actions;
  }

  public dispose(): void {
    this.diagnosticCollection.clear();
    this.diagnosticCollection.dispose();
  }
}
