import * as vscode from "vscode";
import { PackageAnalyzer } from "../analyzer/package-analyzer";

export class DependencyStatusBarItem implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      93
    );
    this.statusBarItem.command = "dependencyLens.openDashboard";
    this.statusBarItem.text = "$(shield) Deps Audit";
    this.statusBarItem.tooltip = "Click to run Supply Chain Security Audit";
    this.statusBarItem.show();
  }

  public async update(): Promise<void> {
    try {
      const summary = await PackageAnalyzer.auditWorkspace();
      const typosquats = summary.dependencies.filter((d) => d.isTyposquat).length;

      if (typosquats > 0) {
        this.statusBarItem.text = `$(alert) Deps: ${typosquats} Typosquat!`;
        this.statusBarItem.tooltip = `CRITICAL: ${typosquats} package(s) detected as suspected typosquatting attacks! Click to review.`;
        this.statusBarItem.color = "#f43f5e";
      } else if (summary.highCount > 0) {
        this.statusBarItem.text = `$(warning) Deps: ${summary.highCount} Warnings`;
        this.statusBarItem.tooltip = `${summary.highCount} package(s) with lifecycle scripts or unpinned versions.`;
        this.statusBarItem.color = "#f59e0b";
      } else {
        this.statusBarItem.text = `$(shield) Deps: Safe (${summary.totalDependencies})`;
        this.statusBarItem.tooltip = `Supply chain audit: All ${summary.totalDependencies} dependencies verified safe.`;
        this.statusBarItem.color = "#10b981";
      }
    } catch {
      this.statusBarItem.text = "$(shield) Deps Audit";
    }
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
