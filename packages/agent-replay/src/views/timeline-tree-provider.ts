import * as vscode from "vscode";
import { SessionRecorder } from "../recorder/session-recorder";
import { FileChangeSnapshot } from "../types/replay";

export class TimelineTreeItem extends vscode.TreeItem {
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

export class AgentReplayTreeProvider
  implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined | null | void
  > = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    vscode.TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private recorder: SessionRecorder;

  constructor() {
    this.recorder = SessionRecorder.getInstance();
    this.recorder.on("snapshotAdded", () => this.refresh());
    this.recorder.on("cleared", () => this.refresh());
    this.recorder.on("rewound", () => this.refresh());
  }

  public refresh(): void {
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
    const snapshots = this.recorder.getSnapshots();
    const items: vscode.TreeItem[] = [];

    if (snapshots.length === 0) {
      items.push(
        new TimelineTreeItem(
          "No agent edits recorded",
          vscode.TreeItemCollapsibleState.None,
          "empty",
          "Waiting for changes...",
          "Edits by agents or developers will appear here chronologically",
          undefined,
          "history"
        )
      );
      return items;
    }

    // Reverse chronological order (latest edit first)
    const reversed = [...snapshots].reverse();
    for (const s of reversed) {
      const item = new TimelineTreeItem(
        `Step ${s.stepNumber}: ${s.fileName}`,
        vscode.TreeItemCollapsibleState.None,
        "stepItem",
        `+${s.linesAdded} -${s.linesRemoved} • ${s.timestamp}`,
        `File: ${s.filePath}\nTimestamp: ${s.timestamp}\nLines added: ${s.linesAdded}\nLines removed: ${s.linesRemoved}\nClick to inspect diff and scrubber`,
        {
          command: "agentReplay.openDashboard",
          title: "Inspect in Replay Scrubber",
        },
        "diff"
      );
      items.push(item);
    }

    return items;
  }
}
