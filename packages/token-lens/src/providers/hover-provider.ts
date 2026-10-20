import * as vscode from "vscode";
import { TokenEngine } from "../engine/tokenizer";

export class TokenHoverProvider implements vscode.HoverProvider {
  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.ProviderResult<vscode.Hover> {
    const editor = vscode.window.activeTextEditor;
    let textToAnalyze = "";
    let targetRange: vscode.Range | undefined;

    // 1. If user has active selection covering position
    if (editor && !editor.selection.isEmpty && editor.selection.contains(position)) {
      textToAnalyze = document.getText(editor.selection);
      targetRange = editor.selection;
    } else {
      // 2. Otherwise analyze string literal or block under cursor
      const range = document.getWordRangeAtPosition(position, /["'`][\s\S]*?["'`]/);
      if (range) {
        textToAnalyze = document.getText(range).slice(1, -1);
        targetRange = range;
      } else {
        // Line or paragraph under cursor if non-empty
        const line = document.lineAt(position.line);
        if (line.text.trim().length > 30) {
          textToAnalyze = line.text;
          targetRange = line.range;
        }
      }
    }

    if (!textToAnalyze || textToAnalyze.trim().length < 10) return null;

    const analysis = TokenEngine.analyzeText(textToAnalyze);

    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.appendMarkdown(`### 🧮 Castov Token & Cost Lens\n\n`);
    md.appendMarkdown(
      `**Tokens:** \`${TokenEngine.formatTokens(analysis.tokenCount)}\` (${analysis.tokenCount.toLocaleString()}) • ` +
      `**Characters:** \`${analysis.charCount.toLocaleString()}\` • ` +
      `**Words:** \`${analysis.wordCount.toLocaleString()}\`\n\n`
    );

    md.appendMarkdown(`| Model | Input Cost | Context % |\n`);
    md.appendMarkdown(`| :--- | :---: | :---: |\n`);

    for (const c of analysis.costs) {
      const pctStr = c.percentOfContext < 0.01 ? "< 0.01%" : `${c.percentOfContext.toFixed(2)}%`;
      md.appendMarkdown(
        `| **${c.model.name}** | \`${TokenEngine.formatCost(c.inputCost)}\` | ${pctStr} of ${TokenEngine.formatTokens(c.model.contextWindow)} |\n`
      );
    }

    md.appendMarkdown(`\n[Open Full Cost Calculator & Simulator](command:tokenLens.openCalculator)\n`);

    return new vscode.Hover(md, targetRange);
  }
}
