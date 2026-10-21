import * as vscode from "vscode";
import { PromptRunner } from "../runner/prompt-runner";
import { SingleTestExecution } from "../types/prompt-test";

export class PromptTestTreeItem extends vscode.TreeItem {
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

export class PromptTestTreeProvider
  implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined | null | void
  > = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    vscode.TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private latestResults: SingleTestExecution[] = [];

  public updateResults(results: SingleTestExecution[]): void {
    this.latestResults = results;
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

  private async getRootItems(): Promise<vscode.TreeItem[]> {
    const items: vscode.TreeItem[] = [];

    if (this.latestResults.length === 0) {
      const files = await PromptRunner.discoverTestFiles();
      if (files.length === 0) {
        items.push(
          new PromptTestTreeItem(
            "No prompt test files found",
            vscode.TreeItemCollapsibleState.None,
            "empty",
            "Create .prompt.json",
            "Click to generate a sample prompt test suite",
            {
              command: "promptTester.createSampleTest",
              title: "Create Sample Suite",
            },
            "file-add"
          )
        );
      } else {
        items.push(
          new PromptTestTreeItem(
            `Found ${files.length} test suite(s)`,
            vscode.TreeItemCollapsibleState.None,
            "ready",
            "Click to Run",
            "Run all discovered prompt suites",
            {
              command: "promptTester.runAll",
              title: "Run Tests",
            },
            "play-all"
          )
        );
      }
      return items;
    }

    // Results Summary
    const passed = this.latestResults.filter((r) => r.passed).length;
    const total = this.latestResults.length;
    const passRate = Math.round((passed / total) * 100);

    const summaryItem = new PromptTestTreeItem(
      `Results: ${passed}/${total} Passed (${passRate}%)`,
      vscode.TreeItemCollapsibleState.None,
      "summary",
      undefined,
      `Passed: ${passed}\nFailed: ${total - passed}\nClick to open dashboard`,
      {
        command: "promptTester.openDashboard",
        title: "Open Dashboard",
      },
      passed === total ? "pass-filled" : "error"
    );
    items.push(summaryItem);

    // List individual tests
    for (const res of this.latestResults) {
      const item = new PromptTestTreeItem(
        res.testName,
        vscode.TreeItemCollapsibleState.None,
        "testItem",
        `${res.latencyMs}ms • ${res.tokensUsed} tokens`,
        `Model: ${res.model}\nOutput: ${res.responseOutput}\nAssertions: ${
          res.assertions.filter((a) => a.passed).length
        }/${res.assertions.length} passed`,
        {
          command: "promptTester.openDashboard",
          title: "Open Dashboard",
        },
        res.passed ? "check" : "error"
      );
      items.push(item);
    }

    return items;
  }
}
