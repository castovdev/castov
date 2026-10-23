import * as vscode from "vscode";
import { GitBlameParser } from "../blame/git-blame-parser";
import { WorkspaceBlameSummary } from "../types/blame";

export class AIBlameTreeItem extends vscode.TreeItem {
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

export class AIBlameTreeProvider
  implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined | null | void
  > = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    vscode.TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private cachedSummary: WorkspaceBlameSummary | null = null;

  public refresh(): void {
    this.cachedSummary = null;
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  public async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    if (!this.cachedSummary) {
      this.cachedSummary = await GitBlameParser.analyzeWorkspace();
    }
    const summary = this.cachedSummary;

    if (!element) {
      return this.getRootItems(summary);
    }

    if (element.contextValue === "agentsGroup") {
      return Object.entries(summary.agentBreakdown).map(
        ([agent, lines]) =>
          new AIBlameTreeItem(
            agent,
            vscode.TreeItemCollapsibleState.None,
            "agentItem",
            `${lines} lines`,
            `${agent} generated ${lines} lines of code`,
            {
              command: "aiBlame.openDashboard",
              title: "Open Dashboard",
            },
            "robot"
          )
      );
    }

    if (element.contextValue === "topFilesGroup") {
      return summary.files.slice(0, 10).map(
        (f) =>
          new AIBlameTreeItem(
            f.fileName,
            vscode.TreeItemCollapsibleState.None,
            "fileItem",
            `${f.aiPercentage}% AI (${f.aiLines}/${f.totalLines})`,
            f.filePath,
            {
              command: "vscode.open",
              title: "Open File",
              arguments: [vscode.Uri.file(f.filePath)],
            },
            "file-code"
          )
      );
    }

    return [];
  }

  private getRootItems(summary: WorkspaceBlameSummary): vscode.TreeItem[] {
    const items: vscode.TreeItem[] = [];

    // Summary item
    items.push(
      new AIBlameTreeItem(
        `Workspace: ${summary.overallAiPercentage}% AI • ${100 - summary.overallAiPercentage}% Human`,
        vscode.TreeItemCollapsibleState.None,
        "summary",
        undefined,
        `Total Lines: ${summary.totalLines}\nAI Lines: ${summary.totalAiLines}\nHuman Lines: ${summary.totalHumanLines}`,
        {
          command: "aiBlame.openDashboard",
          title: "Open Dashboard",
        },
        "graph"
      )
    );

    // Agents Group
    const agentCount = Object.keys(summary.agentBreakdown).length;
    if (agentCount > 0) {
      items.push(
        new AIBlameTreeItem(
          `Detected Agents (${agentCount})`,
          vscode.TreeItemCollapsibleState.Expanded,
          "agentsGroup",
          undefined,
          "AI agents contributing to this project",
          undefined,
          "hubot"
        )
      );
    }

    // Top Files Group
    if (summary.files.length > 0) {
      items.push(
        new AIBlameTreeItem(
          `Top AI-Assisted Files (${Math.min(10, summary.files.length)})`,
          vscode.TreeItemCollapsibleState.Collapsed,
          "topFilesGroup",
          undefined,
          "Files with highest AI code density",
          undefined,
          "files"
        )
      );
    }

    return items;
  }
}
