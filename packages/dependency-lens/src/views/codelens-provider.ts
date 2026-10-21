import * as vscode from "vscode";
import { PackageAnalyzer } from "../analyzer/package-analyzer";

export class DependencyCodeLensProvider implements vscode.CodeLensProvider {
  public provideCodeLenses(
    document: vscode.TextDocument
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    if (!document.fileName.endsWith("package.json")) return null;

    const text = document.getText();
    const lines = text.split("\n");
    const lenses: vscode.CodeLens[] = [];

    const deps = PackageAnalyzer.auditPackageJson(document.fileName);
    const typosquats = deps.filter((d) => d.isTyposquat).length;
    const criticals = deps.filter((d) => d.riskLevel === "CRITICAL").length;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('"dependencies":') || line.includes('"devDependencies":')) {
        const range = new vscode.Range(i, 0, i, line.length);

        const statusLabel =
          typosquats > 0
            ? `🚨 ${typosquats} Typosquat Detected!`
            : criticals > 0
            ? `⚠️ ${criticals} Risks Detected`
            : `🛡️ Clean (${deps.length} Dependencies Audited)`;

        lenses.push(
          new vscode.CodeLens(range, {
            title: statusLabel,
            command: "dependencyLens.openDashboard",
          }),
          new vscode.CodeLens(range, {
            title: "Open Supply Chain Dashboard",
            command: "dependencyLens.openDashboard",
          })
        );
      }
    }

    return lenses;
  }
}
