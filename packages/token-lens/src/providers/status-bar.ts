import * as vscode from "vscode";
import { TokenEngine } from "../engine/tokenizer";

export class TokenStatusBar {
  private item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 90);
    this.item.command = "tokenLens.openCalculator";
    this.update();
    this.item.show();

    vscode.window.onDidChangeActiveTextEditor(() => this.update());
    vscode.window.onDidChangeTextEditorSelection(() => this.update());
  }

  public update(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.scheme !== "file") {
      this.item.hide();
      return;
    }

    this.item.show();
    const selection = editor.selection;

    if (!selection.isEmpty) {
      const selectedText = editor.document.getText(selection);
      const analysis = TokenEngine.analyzeText(selectedText);
      const claudeCost = analysis.costs.find((c) => c.model.id === "claude-3-5-sonnet");
      const costStr = claudeCost ? TokenEngine.formatCost(claudeCost.inputCost) : "";

      this.item.text = `$(hubot) Selection: ${TokenEngine.formatTokens(analysis.tokenCount)} tokens (${costStr})`;
      this.item.tooltip = `Selected: ${analysis.tokenCount.toLocaleString()} tokens, ${analysis.charCount.toLocaleString()} chars, ${analysis.wordCount.toLocaleString()} words.\nClick to open cost calculator.`;
    } else {
      const text = editor.document.getText();
      const tokens = TokenEngine.countTokens(text);
      this.item.text = `$(hubot) ${TokenEngine.formatTokens(tokens)} tokens`;
      this.item.tooltip = `File has ~${tokens.toLocaleString()} tokens.\nClick to open LLM cost calculator.`;
    }
  }

  public dispose(): void {
    this.item.dispose();
  }
}
