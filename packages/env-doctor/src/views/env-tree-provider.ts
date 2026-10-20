import * as vscode from "vscode";
import { EnvAuditReport, EnvIssue } from "../types/env";

export class EnvTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemType: "root_health" | "issues_group" | "vars_group" | "issue" | "variable",
    public readonly issue?: EnvIssue,
    public readonly varKey?: string
  ) {
    super(label, collapsibleState);

    if (itemType === "root_health") {
      this.iconPath = new vscode.ThemeIcon("heart");
      this.command = {
        command: "envDoctor.openDashboard",
        title: "Open Dashboard",
      };
    } else if (itemType === "issues_group") {
      this.iconPath = new vscode.ThemeIcon("warning");
    } else if (itemType === "vars_group") {
      this.iconPath = new vscode.ThemeIcon("list-unordered");
    } else if (itemType === "issue") {
      this.iconPath = issue?.severity === "critical"
        ? new vscode.ThemeIcon("error", new vscode.ThemeColor("errorForeground"))
        : new vscode.ThemeIcon("warning", new vscode.ThemeColor("editorWarning.foreground"));
      this.description = issue?.variableName;
      this.tooltip = `${issue?.title}\n${issue?.description}`;
      this.command = {
        command: "envDoctor.openDashboard",
        title: "Open Dashboard",
      };
    } else if (itemType === "variable") {
      this.iconPath = new vscode.ThemeIcon("symbol-variable");
    }
  }
}

export class EnvDoctorTreeDataProvider implements vscode.TreeDataProvider<EnvTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<EnvTreeItem | undefined | void> = new vscode.EventEmitter<EnvTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<EnvTreeItem | undefined | void> = this._onDidChangeTreeData.event;

  private report: EnvAuditReport;

  constructor(initialReport: EnvAuditReport) {
    this.report = initialReport;
  }

  public refresh(report: EnvAuditReport): void {
    this.report = report;
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: EnvTreeItem): vscode.TreeItem {
    return element;
  }

  public async getChildren(element?: EnvTreeItem): Promise<EnvTreeItem[]> {
    if (!element) {
      return [
        new EnvTreeItem(
          `Health Score: ${this.report.healthScore}% (${this.report.issues.length} issues)`,
          vscode.TreeItemCollapsibleState.None,
          "root_health"
        ),
        new EnvTreeItem(
          `Issues (${this.report.issues.length})`,
          vscode.TreeItemCollapsibleState.Expanded,
          "issues_group"
        ),
        new EnvTreeItem(
          `Tracked Variables (${this.report.allVariables.length})`,
          vscode.TreeItemCollapsibleState.Collapsed,
          "vars_group"
        ),
      ];
    }

    if (element.itemType === "issues_group") {
      if (this.report.issues.length === 0) {
        return [
          new EnvTreeItem("✅ No issues found", vscode.TreeItemCollapsibleState.None, "root_health"),
        ];
      }
      return this.report.issues.map(
        (iss) => new EnvTreeItem(iss.title, vscode.TreeItemCollapsibleState.None, "issue", iss)
      );
    }

    if (element.itemType === "vars_group") {
      return this.report.allVariables.map((v) => {
        const item = new EnvTreeItem(v.key, vscode.TreeItemCollapsibleState.None, "variable", undefined, v.key);
        item.description = v.inEnv ? "in .env" : "missing in .env";
        return item;
      });
    }

    return [];
  }
}
