import * as vscode from "vscode";

export class PromptTestCodeLensProvider implements vscode.CodeLensProvider {
  public provideCodeLenses(
    document: vscode.TextDocument
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    const text = document.getText();
    const lenses: vscode.CodeLens[] = [];

    // Top of file CodeLens
    const topRange = new vscode.Range(0, 0, 0, 0);
    lenses.push(
      new vscode.CodeLens(topRange, {
        title: "▶ Run All Tests in File",
        command: "promptTester.runCurrentFile",
      }),
      new vscode.CodeLens(topRange, {
        title: "📊 Open Dashboard",
        command: "promptTester.openDashboard",
      })
    );

    // Look for test names in document
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('"name":') || line.trim().startsWith("- name:") || line.trim().startsWith("name:")) {
        const range = new vscode.Range(i, 0, i, line.length);
        lenses.push(
          new vscode.CodeLens(range, {
            title: "▶ Run Prompt Test",
            command: "promptTester.runCurrentFile",
          })
        );
      }
    }

    return lenses;
  }
}
