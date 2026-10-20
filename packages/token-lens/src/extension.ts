import * as vscode from "vscode";
import { TokenHoverProvider } from "./providers/hover-provider";
import { TokenCodeLensProvider } from "./providers/codelens-provider";
import { TokenStatusBar } from "./providers/status-bar";
import { CostCalculatorWebviewPanel } from "./views/cost-calculator-webview";
import { TokenEngine } from "./engine/tokenizer";

export function activate(context: vscode.ExtensionContext) {
  // 1. Status Bar Item
  const statusBar = new TokenStatusBar();
  context.subscriptions.push(statusBar);

  // 2. Hover Provider
  context.subscriptions.push(
    vscode.languages.registerHoverProvider({ scheme: "file" }, new TokenHoverProvider())
  );

  // 3. CodeLens Provider
  const codeLensProvider = new TokenCodeLensProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider({ scheme: "file" }, codeLensProvider)
  );

  // Refresh CodeLens on document changes
  vscode.workspace.onDidChangeTextDocument(
    (e) => {
      if (e.contentChanges.length > 0) {
        codeLensProvider.refresh();
      }
    },
    null,
    context.subscriptions
  );

  // 4. Command: Open Calculator
  context.subscriptions.push(
    vscode.commands.registerCommand("tokenLens.openCalculator", (initialText?: string) => {
      let text = initialText;
      if (!text) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          text = editor.selection.isEmpty
            ? editor.document.getText()
            : editor.document.getText(editor.selection);
        }
      }
      CostCalculatorWebviewPanel.createOrShow(context.extensionUri, text || "");
    })
  );

  // 5. Command: Count Selection
  context.subscriptions.push(
    vscode.commands.registerCommand("tokenLens.countSelection", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.selection.isEmpty) {
        vscode.window.showInformationMessage("Token Lens: Please select text in the editor.");
        return;
      }

      const text = editor.document.getText(editor.selection);
      const analysis = TokenEngine.analyzeText(text);
      const claude = analysis.costs.find((c) => c.model.id === "claude-3-5-sonnet");
      const gemini = analysis.costs.find((c) => c.model.id === "gemini-2-5-flash");

      const msg = `Token Lens: ~${analysis.tokenCount.toLocaleString()} tokens (${analysis.charCount.toLocaleString()} chars). Claude: ${TokenEngine.formatCost(claude?.inputCost || 0)} | Gemini: ${TokenEngine.formatCost(gemini?.inputCost || 0)}`;

      vscode.window.showInformationMessage(msg, "Open Comparison").then((choice) => {
        if (choice === "Open Comparison") {
          CostCalculatorWebviewPanel.createOrShow(context.extensionUri, text);
        }
      });
    })
  );
}

export function deactivate() {
  if (CostCalculatorWebviewPanel.currentPanel) {
    CostCalculatorWebviewPanel.currentPanel.dispose();
  }
}
