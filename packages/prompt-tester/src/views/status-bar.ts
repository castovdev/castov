import * as vscode from "vscode";
import { SingleTestExecution } from "../types/prompt-test";

export class PromptStatusBarItem implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      94
    );
    this.statusBarItem.command = "promptTester.openDashboard";
    this.statusBarItem.text = "$(beaker) Prompt Tests";
    this.statusBarItem.tooltip = "Click to open Prompt Regression Tester Dashboard";
    this.statusBarItem.show();
  }

  public updateResults(results: SingleTestExecution[]): void {
    if (results.length === 0) {
      this.statusBarItem.text = "$(beaker) Prompt Tests";
      this.statusBarItem.color = undefined;
      return;
    }

    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;

    if (failed > 0) {
      this.statusBarItem.text = `$(error) Prompts: ${failed} Failed`;
      this.statusBarItem.tooltip = `Prompt Regression Alert: ${failed} of ${results.length} tests failed assertions.`;
      this.statusBarItem.color = "#f43f5e";
    } else {
      this.statusBarItem.text = `$(pass) Prompts: ${passed}/${results.length}`;
      this.statusBarItem.tooltip = `All ${passed} prompt tests passed assertions.`;
      this.statusBarItem.color = "#10b981";
    }
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
