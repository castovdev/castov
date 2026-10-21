import * as vscode from "vscode";
import { PackageAnalyzer } from "../analyzer/package-analyzer";
import { SupplyChainAuditSummary, DependencyRisk } from "../types/dependency";

export class DependencyRiskTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public readonly description?: string,
    public readonly tooltip?: string,
    public readonly command?: vscode.Command,
    icon?: string
  ) {
    super(label, collapsibleState);
    if (icon) {
      this.iconPath = new vscode.ThemeIcon(icon);
    }
  }
}

export class DependencyRiskTreeProvider
  implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined | null | void
  > = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    vscode.TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private cachedSummary: SupplyChainAuditSummary | null = null;

  public refresh(): void {
    this.cachedSummary = null;
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  public async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    if (!this.cachedSummary) {
      this.cachedSummary = await PackageAnalyzer.auditWorkspace();
    }
    const summary = this.cachedSummary;

    if (!element) {
      return this.getRootItems(summary);
    }

    if (element.contextValue === "risksGroup") {
      const risks = summary.dependencies.filter(
        (d) => d.riskLevel === "CRITICAL" || d.riskLevel === "HIGH"
      );
      return this.getDependencyItems(risks);
    }

    if (element.contextValue === "allGroup") {
      return this.getDependencyItems(summary.dependencies);
    }

    return [];
  }

  private getRootItems(summary: SupplyChainAuditSummary): vscode.TreeItem[] {
    const items: vscode.TreeItem[] = [];
    const typosquats = summary.dependencies.filter((d) => d.isTyposquat).length;

    // Summary item
    const summaryItem = new DependencyRiskTreeItem(
      typosquats > 0
        ? `🚨 ${typosquats} Typosquat Threat!`
        : `Supply Chain: ${summary.totalDependencies} Audited`,
      vscode.TreeItemCollapsibleState.None,
      "summary",
      typosquats > 0 ? "Critical Warning" : "Verified",
      `Audited: ${summary.totalDependencies}\nTyposquats: ${typosquats}\nCopyleft: ${summary.copyleftCount}`,
      {
        command: "dependencyLens.openDashboard",
        title: "Open Supply Chain Dashboard",
      },
      typosquats > 0 ? "alert" : "shield"
    );
    items.push(summaryItem);

    // Risks Group (if any)
    const riskyDeps = summary.dependencies.filter(
      (d) => d.riskLevel === "CRITICAL" || d.riskLevel === "HIGH"
    );
    if (riskyDeps.length > 0) {
      const risksGroup = new DependencyRiskTreeItem(
        `High Priority Warnings (${riskyDeps.length})`,
        vscode.TreeItemCollapsibleState.Expanded,
        "risksGroup",
        undefined,
        "Packages with typosquatting warnings or suspicious lifecycle scripts",
        undefined,
        "warning"
      );
      items.push(risksGroup);
    }

    // All Dependencies Group
    const allGroup = new DependencyRiskTreeItem(
      `All Dependencies (${summary.totalDependencies})`,
      summary.totalDependencies > 0
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None,
      "allGroup",
      undefined,
      "Full list of workspace packages",
      undefined,
      "package"
    );
    items.push(allGroup);

    return items;
  }

  private getDependencyItems(deps: DependencyRisk[]): vscode.TreeItem[] {
    return deps.map((d) => {
      let icon = "check";
      if (d.riskLevel === "CRITICAL") icon = "error";
      else if (d.riskLevel === "HIGH") icon = "warning";
      else if (d.riskLevel === "MEDIUM") icon = "info";

      return new DependencyRiskTreeItem(
        d.name,
        vscode.TreeItemCollapsibleState.None,
        "depItem",
        `${d.version} • ${d.license}`,
        `Package: ${d.name}\nVersion: ${d.version}\nRisk: ${d.riskLevel}\nLicense: ${d.license} (${d.licenseType})\nWarnings: ${d.warnings.join(", ") || "None"}`,
        {
          command: "dependencyLens.openDashboard",
          title: "Inspect in Dashboard",
        },
        icon
      );
    });
  }
}
