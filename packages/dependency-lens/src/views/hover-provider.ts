import * as vscode from "vscode";
import { PackageAnalyzer } from "../analyzer/package-analyzer";
import { DependencyRisk } from "../types/dependency";

export class DependencyHoverProvider implements vscode.HoverProvider {
  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.ProviderResult<vscode.Hover> {
    if (!document.fileName.endsWith("package.json")) return null;

    const lineText = document.lineAt(position.line).text;
    const match = lineText.match(/"(@?[a-zA-Z0-9_.\-\/]+)"\s*:\s*"([^"]+)"/);
    if (!match) return null;

    const depName = match[1];
    const depVersion = match[2];

    const range = document.getWordRangeAtPosition(position, /"@?[a-zA-Z0-9_.\-\/]+"/);
    if (!range) return null;

    const allDeps = PackageAnalyzer.auditPackageJson(document.fileName);
    const dep = allDeps.find((d) => d.name === depName);
    if (!dep) return null;

    const md = this.buildHoverMarkdown(dep);
    return new vscode.Hover(md, range);
  }

  private buildHoverMarkdown(dep: DependencyRisk): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;

    if (dep.isTyposquat) {
      md.appendMarkdown(
        `### 🚨 CRITICAL: Suspected Typosquatting!\n\n` +
          `**Package:** \`${dep.name}\`\n\n` +
          `**Impersonating:** \`${dep.squattedTarget}\`\n\n` +
          `⚠️ **High Supply-Chain Risk:** This package name resembles a top-ranked package by 1 typo. Hackers use typosquatting to deliver credential stealers.\n\n` +
          `[Inspect on npm](https://www.npmjs.com/package/${encodeURIComponent(dep.name)})\n`
      );
      return md;
    }

    const riskBadge =
      dep.riskLevel === "SAFE"
        ? "🟢 **Low Risk (Safe)**"
        : dep.riskLevel === "LOW"
        ? "🟡 **Low Risk**"
        : dep.riskLevel === "MEDIUM"
        ? "🟠 **Medium Risk**"
        : "🔴 **High Risk**";

    md.appendMarkdown(
      `### 📦 \`${dep.name}\` \`${dep.version}\`\n\n` +
        `- **Risk Posture:** ${riskBadge}\n` +
        `- **License:** \`${dep.license}\` (${dep.licenseType})\n` +
        `- **Scope:** ${dep.isDev ? "Development (`devDependencies`)" : "Production (`dependencies`)"}\n\n`
    );

    if (dep.suspiciousScripts && dep.suspiciousScripts.length > 0) {
      md.appendMarkdown(
        `> ⚠️ **Lifecycle Scripts:**\n> - ${dep.suspiciousScripts.join("\n> - ")}\n\n`
      );
    }

    if (dep.warnings.length > 0) {
      md.appendMarkdown(`**Audit Warnings:**\n`);
      for (const w of dep.warnings) {
        md.appendMarkdown(`- ${w}\n`);
      }
      md.appendMarkdown(`\n`);
    }

    md.appendMarkdown(
      `[npmjs.com](https://www.npmjs.com/package/${encodeURIComponent(dep.name)}) • [Open Security Dashboard](command:dependencyLens.openDashboard)\n`
    );

    return md;
  }
}
