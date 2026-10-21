import * as vscode from "vscode";
import { LogAnalysisReport, TraceStory } from "../types/log-story";

export class LogTraceTreeItem extends vscode.TreeItem {
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

export class LogStoryTreeProvider
  implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined | null | void
  > = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    vscode.TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private currentReport: LogAnalysisReport | null = null;

  public setReport(report: LogAnalysisReport): void {
    this.currentReport = report;
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  public async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    if (!element) {
      return this.getRootItems();
    }
    return [];
  }

  private getRootItems(): vscode.TreeItem[] {
    const items: vscode.TreeItem[] = [];

    if (!this.currentReport) {
      items.push(
        new LogTraceTreeItem(
          "No logs analyzed yet",
          vscode.TreeItemCollapsibleState.None,
          "empty",
          "Paste or open a log file",
          "Click to open Log Story Analyzer",
          {
            command: "logStory.openDashboard",
            title: "Open Dashboard",
          },
          "book"
        )
      );
      return items;
    }

    const report = this.currentReport;

    // Root Cause Item
    if (report.rootCause) {
      items.push(
        new LogTraceTreeItem(
          `Root Cause: ${report.rootCause.service}`,
          vscode.TreeItemCollapsibleState.None,
          "rootCause",
          report.rootCause.message.slice(0, 40) + "...",
          `Root Cause Failure\nService: ${report.rootCause.service}\nTime: ${report.rootCause.timestamp}\nMessage: ${report.rootCause.message}`,
          {
            command: "logStory.openDashboard",
            title: "Inspect in Dashboard",
          },
          "flame"
        )
      );
    }

    // Stats
    items.push(
      new LogTraceTreeItem(
        `Lines: ${report.totalRawLines} (-${report.foldedLinesCount} folded)`,
        vscode.TreeItemCollapsibleState.None,
        "stats",
        `${report.errorCount} errors`,
        `Raw lines: ${report.totalRawLines}\nFolded duplicate lines: ${report.foldedLinesCount}\nTraces: ${report.totalTraces}`,
        {
          command: "logStory.openDashboard",
          title: "Open Dashboard",
        },
        "list-filter"
      )
    );

    // Traces
    for (const t of report.traces) {
      items.push(
        new LogTraceTreeItem(
          `Trace: ${t.requestId}`,
          vscode.TreeItemCollapsibleState.None,
          "traceItem",
          `${t.steps.length} steps • ${t.servicesInvolved.join("→")}`,
          `Request ID: ${t.requestId}\nStatus: ${t.hasError ? "Failed" : "Success"}\nServices: ${t.servicesInvolved.join(", ")}`,
          {
            command: "logStory.openDashboard",
            title: "Open Dashboard",
          },
          t.hasError ? "error" : "check"
        )
      );
    }

    return items;
  }
}
