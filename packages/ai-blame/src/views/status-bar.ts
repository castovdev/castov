import * as vscode from "vscode";
import { GitBlameParser } from "../blame/git-blame-parser";

export class AIBlameStatusBarItem implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      92
    );
    this.statusBarItem.command = "aiBlame.openDashboard";
    this.statusBarItem.text = "$(hubot) AI Blame";
    this.statusBarItem.tooltip = "Click to open AI Authorship Analytics";
    this.statusBarItem.show();

    vscode.window.onDidChangeActiveTextEditor(() => this.update());
    this.update();
  }

  public async update(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this.statusBarItem.text = "$(hubot) AI Blame";
      this.statusBarItem.color = undefined;
      return;
    }

    try {
      const summary = await GitBlameParser.analyzeFile(editor.document.fileName);
      if (summary && summary.totalLines > 0) {
        this.statusBarItem.text = `$(hubot) AI: ${summary.aiPercentage}% | $(person) ${100 - summary.aiPercentage}%`;
        this.statusBarItem.tooltip = `AI Blame for ${summary.fileName}\nAI Lines: ${summary.aiLines}\nHuman Lines: ${summary.humanLines}\nClick to view project analytics`;
        this.statusBarItem.color = summary.aiPercentage > 50 ? "#c084fc" : undefined;
      } else {
        this.statusBarItem.text = "$(hubot) AI Blame";
        this.statusBarItem.color = undefined;
      }
    } catch {
      this.statusBarItem.text = "$(hubot) AI Blame";
    }
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
