import * as vscode from "vscode";
import { MCPConfigFinder } from "../scanner/config-finder";

export class MCPSecurityStatusBarItem implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      96
    );
    this.statusBarItem.command = "mcpSecurity.openDashboard";
    this.statusBarItem.text = "$(shield) MCP Audit";
    this.statusBarItem.tooltip = "Click to run MCP Security Audit";
    this.statusBarItem.show();
  }

  public async update(): Promise<void> {
    try {
      const summary = await MCPConfigFinder.runAudit();
      if (summary.totalServers === 0) {
        this.statusBarItem.text = "$(shield) MCP: None";
        this.statusBarItem.tooltip = "No MCP configuration files detected.";
        this.statusBarItem.color = undefined;
        return;
      }

      if (summary.criticalCount > 0) {
        this.statusBarItem.text = `$(alert) MCP: ${summary.criticalCount} Critical!`;
        this.statusBarItem.tooltip = `MCP Security Alert: ${summary.criticalCount} critical vulnerabilities found in MCP configurations. Click to review.`;
        this.statusBarItem.color = "#f43f5e"; // red
      } else if (summary.highCount > 0) {
        this.statusBarItem.text = `$(warning) MCP: ${summary.highCount} Warnings`;
        this.statusBarItem.tooltip = `MCP Security: ${summary.highCount} high risk findings detected. Click to review.`;
        this.statusBarItem.color = "#f59e0b"; // yellow
      } else {
        this.statusBarItem.text = `$(verified) MCP: Safe (${summary.overallGrade})`;
        this.statusBarItem.tooltip = `MCP Security Audit: All ${summary.totalServers} servers configured safely. Score: ${summary.overallScore}/100.`;
        this.statusBarItem.color = "#10b981"; // green
      }
    } catch {
      this.statusBarItem.text = "$(shield) MCP Security";
    }
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
