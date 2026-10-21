import * as vscode from "vscode";
import { WorkspaceScanSummary, UnicodeThreat } from "../types/bidi";

export class BidiTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemType: "status" | "category" | "threat" | "action",
    public readonly threat?: UnicodeThreat
  ) {
    super(label, collapsibleState);

    if (itemType === "status") {
      this.iconPath = new vscode.ThemeIcon("shield");
      this.command = {
        command: "bidiGuard.openDashboard",
        title: "Open Dashboard",
      };
    } else if (itemType === "category") {
      this.iconPath = new vscode.ThemeIcon("folder");
    } else if (itemType === "threat" && threat) {
      if (threat.category === "trojan_source") {
        this.iconPath = new vscode.ThemeIcon("error", new vscode.ThemeColor("errorForeground"));
      } else if (threat.category === "invisible_char") {
        this.iconPath = new vscode.ThemeIcon("warning", new vscode.ThemeColor("editorWarning.foreground"));
      } else if (threat.category === "rtl_comment") {
        this.iconPath = new vscode.ThemeIcon("comment");
      } else {
        this.iconPath = new vscode.ThemeIcon("info");
      }
      this.description = `${threat.filePath}:${threat.line}`;
      this.tooltip = `${threat.charName} (${threat.codePoint})\n${threat.description}\nClick to open`;

      this.command = {
        command: "vscode.open",
        title: "Open File",
        arguments: [
          vscode.Uri.file(threat.filePath),
          {
            selection: new vscode.Range(
              Math.max(0, threat.line - 1),
              Math.max(0, threat.col - 1),
              Math.max(0, threat.line - 1),
              Math.max(0, threat.col)
            ),
          },
        ],
      };
    } else if (itemType === "action") {
      this.iconPath = new vscode.ThemeIcon("search");
      this.command = {
        command: "bidiGuard.scanWorkspace",
        title: "Scan Workspace",
      };
    }
  }
}

export class BidiTreeDataProvider implements vscode.TreeDataProvider<BidiTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<BidiTreeItem | undefined | void> = new vscode.EventEmitter<BidiTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<BidiTreeItem | undefined | void> = this._onDidChangeTreeData.event;

  constructor(private summary: WorkspaceScanSummary) {}

  public refresh(summary: WorkspaceScanSummary): void {
    this.summary = summary;
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: BidiTreeItem): vscode.TreeItem {
    return element;
  }

  public async getChildren(element?: BidiTreeItem): Promise<BidiTreeItem[]> {
    if (!element) {
      const securityCount = this.summary.threats.filter((t) => t.category !== "rtl_comment").length;
      return [
        new BidiTreeItem(
          securityCount === 0
            ? "🛡️ Security Status: 0 Threats"
            : `⚠️ ${securityCount} Unicode Threat(s) Found`,
          vscode.TreeItemCollapsibleState.None,
          "status"
        ),
        new BidiTreeItem(
          `Trojan Source (${this.summary.trojanSourceCount})`,
          this.summary.trojanSourceCount > 0
            ? vscode.TreeItemCollapsibleState.Expanded
            : vscode.TreeItemCollapsibleState.Collapsed,
          "category"
        ),
        new BidiTreeItem(
          `Invisible / Zero-Width (${this.summary.invisibleCount})`,
          this.summary.invisibleCount > 0
            ? vscode.TreeItemCollapsibleState.Expanded
            : vscode.TreeItemCollapsibleState.Collapsed,
          "category"
        ),
        new BidiTreeItem(
          `Homoglyphs (${this.summary.homoglyphCount})`,
          vscode.TreeItemCollapsibleState.Collapsed,
          "category"
        ),
        new BidiTreeItem(
          `RTL Comments (${this.summary.rtlCommentsCount})`,
          vscode.TreeItemCollapsibleState.Collapsed,
          "category"
        ),
      ];
    }

    if (element.itemType === "category") {
      let filtered: UnicodeThreat[] = [];
      if (element.label.startsWith("Trojan Source")) {
        filtered = this.summary.threats.filter((t) => t.category === "trojan_source");
      } else if (element.label.startsWith("Invisible")) {
        filtered = this.summary.threats.filter((t) => t.category === "invisible_char");
      } else if (element.label.startsWith("Homoglyphs")) {
        filtered = this.summary.threats.filter((t) => t.category === "homoglyph");
      } else if (element.label.startsWith("RTL Comments")) {
        filtered = this.summary.threats.filter((t) => t.category === "rtl_comment");
      }

      if (filtered.length === 0) {
        return [
          new BidiTreeItem("None detected", vscode.TreeItemCollapsibleState.None, "status"),
        ];
      }

      return filtered.map(
        (t) => new BidiTreeItem(`${t.charName}`, vscode.TreeItemCollapsibleState.None, "threat", t)
      );
    }

    return [];
  }
}
