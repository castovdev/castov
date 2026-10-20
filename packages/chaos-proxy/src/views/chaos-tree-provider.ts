import * as vscode from "vscode";
import { ProxyEngine } from "../server/proxy-engine";
import { ChaosRule, ProxyStatus } from "../types/chaos";

export class ChaosTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemType: "status" | "rules_group" | "rule" | "dashboard_action",
    public readonly rule?: ChaosRule
  ) {
    super(label, collapsibleState);

    if (itemType === "status") {
      this.iconPath = new vscode.ThemeIcon("pulse");
      this.command = {
        command: "chaosProxy.toggle",
        title: "Toggle Proxy",
      };
    } else if (itemType === "rules_group") {
      this.iconPath = new vscode.ThemeIcon("law");
    } else if (itemType === "rule" && rule) {
      this.iconPath = rule.enabled
        ? new vscode.ThemeIcon("check", new vscode.ThemeColor("charts.green"))
        : new vscode.ThemeIcon("circle-slash", new vscode.ThemeColor("disabledForeground"));
      this.description = rule.enabled ? "ACTIVE" : "OFF";
      this.tooltip = `${rule.name}\nFault: ${rule.fault}\nPattern: ${rule.urlPattern}\nClick to toggle`;
      this.command = {
        command: "chaosProxy.toggleRule",
        title: "Toggle Rule",
        arguments: [rule.id],
      };
    } else if (itemType === "dashboard_action") {
      this.iconPath = new vscode.ThemeIcon("dashboard");
      this.command = {
        command: "chaosProxy.openDashboard",
        title: "Open Control Panel",
      };
    }
  }
}

export class ChaosTreeDataProvider implements vscode.TreeDataProvider<ChaosTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ChaosTreeItem | undefined | void> = new vscode.EventEmitter<ChaosTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ChaosTreeItem | undefined | void> = this._onDidChangeTreeData.event;

  constructor(private engine: ProxyEngine) {
    this.engine.on("statusChanged", () => this.refresh());
    this.engine.on("rulesChanged", () => this.refresh());
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: ChaosTreeItem): vscode.TreeItem {
    return element;
  }

  public async getChildren(element?: ChaosTreeItem): Promise<ChaosTreeItem[]> {
    const status = this.engine.getStatus();

    if (!element) {
      return [
        new ChaosTreeItem(
          status.running ? `Proxy: ACTIVE (Port ${status.port})` : "Proxy: STOPPED (Click to Start)",
          vscode.TreeItemCollapsibleState.None,
          "status"
        ),
        new ChaosTreeItem(
          `Fault Rules (${status.rules.filter((r) => r.enabled).length}/${status.rules.length} active)`,
          vscode.TreeItemCollapsibleState.Expanded,
          "rules_group"
        ),
        new ChaosTreeItem(
          "Open Full Control Panel",
          vscode.TreeItemCollapsibleState.None,
          "dashboard_action"
        ),
      ];
    }

    if (element.itemType === "rules_group") {
      return status.rules.map(
        (r) => new ChaosTreeItem(r.name, vscode.TreeItemCollapsibleState.None, "rule", r)
      );
    }

    return [];
  }
}
