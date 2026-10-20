import * as vscode from "vscode";
import { ProxyEngine } from "../server/proxy-engine";

export class ChaosStatusBar {
  private item: vscode.StatusBarItem;

  constructor(private engine: ProxyEngine) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = "chaosProxy.toggle";
    this.update();
    this.item.show();

    this.engine.on("statusChanged", () => this.update());
    this.engine.on("rulesChanged", () => this.update());
  }

  private update(): void {
    const status = this.engine.getStatus();
    const activeRulesCount = status.rules.filter((r) => r.enabled).length;

    if (status.running) {
      this.item.text = `$(zap) Chaos: ON (${status.port})${activeRulesCount > 0 ? ` [${activeRulesCount} active]` : ""}`;
      this.item.tooltip = `Chaos Proxy is running on port ${status.port}. Click to toggle.`;
      this.item.backgroundColor = activeRulesCount > 0
        ? new vscode.ThemeColor("statusBarItem.warningBackground")
        : undefined;
    } else {
      this.item.text = `$(circle-slash) Chaos: OFF`;
      this.item.tooltip = "Chaos Proxy is stopped. Click to start.";
      this.item.backgroundColor = undefined;
    }
  }

  public dispose(): void {
    this.item.dispose();
  }
}
