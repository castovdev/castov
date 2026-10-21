import * as vscode from "vscode";
import { MCPConfigFinder } from "../scanner/config-finder";
import { AuditSummary, ServerAuditReport, SecurityFinding } from "../types/security";

export class SecurityTreeItem extends vscode.TreeItem {
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

export class MCPSecurityTreeProvider
  implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined | null | void
  > = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    vscode.TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private cachedSummary: AuditSummary | null = null;

  public refresh(): void {
    this.cachedSummary = null;
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  public async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    if (!this.cachedSummary) {
      this.cachedSummary = await MCPConfigFinder.runAudit();
    }
    const summary = this.cachedSummary;

    if (!element) {
      return this.getRootItems(summary);
    }

    if (element.contextValue === "serversGroup") {
      return this.getServerItems(summary.serverReports);
    }

    if (element.contextValue === "findingsGroup") {
      return this.getFindingItems(summary.allFindings);
    }

    return [];
  }

  private getRootItems(summary: AuditSummary): vscode.TreeItem[] {
    const items: vscode.TreeItem[] = [];

    // 1. Overall Score Badge
    const scoreItem = new SecurityTreeItem(
      `Security Score: ${summary.overallScore}/100 (${summary.overallGrade})`,
      vscode.TreeItemCollapsibleState.None,
      "scoreItem",
      summary.criticalCount > 0
        ? `${summary.criticalCount} Critical Risks`
        : summary.highCount > 0
        ? `${summary.highCount} High Risks`
        : "Safe",
      `MCP Security Audit\nScore: ${summary.overallScore}/100\nGrade: ${summary.overallGrade}\nServers: ${summary.totalServers}`,
      {
        command: "mcpSecurity.openDashboard",
        title: "Open Security Dashboard",
      },
      summary.criticalCount > 0
        ? "shield"
        : summary.highCount > 0
        ? "alert"
        : "verified"
    );
    items.push(scoreItem);

    // 2. Servers Group
    const serversGroup = new SecurityTreeItem(
      `Configured Servers (${summary.totalServers})`,
      summary.totalServers > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None,
      "serversGroup",
      undefined,
      "List of detected MCP servers and their security posture",
      undefined,
      "server-process"
    );
    items.push(serversGroup);

    // 3. Security Findings Group
    if (summary.totalFindings > 0) {
      const findingsGroup = new SecurityTreeItem(
        `Security Findings (${summary.totalFindings})`,
        vscode.TreeItemCollapsibleState.Expanded,
        "findingsGroup",
        summary.criticalCount > 0
          ? `${summary.criticalCount} Critical`
          : undefined,
        "Vulnerabilities, hardcoded secrets, and risks detected in MCP configurations",
        undefined,
        "warning"
      );
      items.push(findingsGroup);
    }

    return items;
  }

  private getServerItems(servers: ServerAuditReport[]): vscode.TreeItem[] {
    return servers.map((s) => {
      let icon = "check";
      if (s.riskLevel === "CRITICAL") icon = "error";
      else if (s.riskLevel === "HIGH") icon = "warning";
      else if (s.riskLevel === "MEDIUM") icon = "info";

      return new SecurityTreeItem(
        s.name,
        vscode.TreeItemCollapsibleState.None,
        "serverItem",
        `[${s.grade}] ${s.riskLevel}`,
        `Server: ${s.name}\nCommand: ${s.command} ${s.args.join(" ")}\nScore: ${s.score}/100\nFindings: ${s.findings.length}`,
        {
          command: "mcpSecurity.openDashboard",
          title: "Inspect in Dashboard",
        },
        icon
      );
    });
  }

  private getFindingItems(findings: SecurityFinding[]): vscode.TreeItem[] {
    return findings.map((f) => {
      let icon = "warning";
      if (f.severity === "CRITICAL") icon = "error";
      else if (f.severity === "MEDIUM" || f.severity === "LOW") icon = "info";

      return new SecurityTreeItem(
        f.title,
        vscode.TreeItemCollapsibleState.None,
        "findingItem",
        `[${f.serverName}] ${f.severity}`,
        `${f.title}\nServer: ${f.serverName}\nSeverity: ${f.severity}\nDescription: ${f.description}\nRemediation: ${f.remediation}`,
        {
          command: "mcpSecurity.openDashboard",
          title: "Open Dashboard",
        },
        icon
      );
    });
  }
}
