import * as vscode from "vscode";
import { TokenEngine } from "../engine/tokenizer";

export class TokenCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  public refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  public provideCodeLenses(
    document: vscode.TextDocument
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    // Only show on editable files
    if (document.lineCount === 0 || document.uri.scheme !== "file") {
      return [];
    }

    const fullText = document.getText();
    if (fullText.trim().length === 0) return [];

    const analysis = TokenEngine.analyzeText(fullText);
    const claudeCost = analysis.costs.find((c) => c.model.id === "claude-3-5-sonnet");
    const geminiCost = analysis.costs.find((c) => c.model.id === "gemini-2-5-flash");

    const tokensStr = TokenEngine.formatTokens(analysis.tokenCount);
    const claudeCostStr = claudeCost ? TokenEngine.formatCost(claudeCost.inputCost) : "";
    const geminiCostStr = geminiCost ? TokenEngine.formatCost(geminiCost.inputCost) : "";
    const contextPct = claudeCost ? `${claudeCost.percentOfContext.toFixed(1)}% of 200k` : "";

    const title = `📊 File: ${tokensStr} tokens (~${claudeCostStr} Claude • ${geminiCostStr} Gemini) | ${contextPct}`;

    const range = new vscode.Range(0, 0, 0, 0);
    const codeLens = new vscode.CodeLens(range, {
      title,
      command: "tokenLens.openCalculator",
      arguments: [fullText],
    });

    return [codeLens];
  }
}
