import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { PromptRunner } from "./runner/prompt-runner";
import { PromptTestTreeProvider } from "./views/test-tree-provider";
import { PromptTestCodeLensProvider } from "./views/codelens-provider";
import { PromptStatusBarItem } from "./views/status-bar";
import { PromptTesterWebviewPanel } from "./views/prompt-webview";
import { SingleTestExecution } from "./types/prompt-test";

export function activate(context: vscode.ExtensionContext) {
  // Tree View
  const treeProvider = new PromptTestTreeProvider();
  const treeView = vscode.window.createTreeView("promptTester.testView", {
    treeDataProvider: treeProvider,
  });
  context.subscriptions.push(treeView);

  // Status Bar
  const statusBar = new PromptStatusBarItem();
  context.subscriptions.push(statusBar);

  // CodeLens Provider for .prompt.json and .prompt.yaml
  const codeLensProvider = new PromptTestCodeLensProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      [
        { pattern: "**/*.prompt.json" },
        { pattern: "**/*.prompt.yaml" },
        { pattern: "**/*.prompt.yml" },
      ],
      codeLensProvider
    )
  );

  // Helper to run tests and notify UI
  async function runAndNotify(
    runnerFn: () => Promise<SingleTestExecution[]>,
    title: string
  ) {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title,
        cancellable: false,
      },
      async () => {
        const results = await runnerFn();
        treeProvider.updateResults(results);
        statusBar.updateResults(results);

        if (PromptTesterWebviewPanel.currentPanel) {
          PromptTesterWebviewPanel.currentPanel.setResults(results);
        }

        const passed = results.filter((r) => r.passed).length;
        const failed = results.length - passed;

        if (failed > 0) {
          vscode.window.showErrorMessage(
            `Prompt Tests: ${failed} failed out of ${results.length}.`,
            "View Dashboard"
          ).then((action) => {
            if (action === "View Dashboard") {
              PromptTesterWebviewPanel.createOrShow(context.extensionUri);
            }
          });
        } else if (results.length > 0) {
          vscode.window.showInformationMessage(
            `Prompt Tests: All ${passed} tests passed successfully!`
          );
        } else {
          vscode.window.showWarningMessage(
            "No prompt test files found. Use 'Prompt Tester: Create Sample Suite' to get started."
          );
        }
      }
    );
  }

  // Command: Run All Tests
  context.subscriptions.push(
    vscode.commands.registerCommand("promptTester.runAll", async () => {
      await runAndNotify(async () => {
        const files = await PromptRunner.discoverTestFiles();
        const all: SingleTestExecution[] = [];
        for (const f of files) {
          const res = await PromptRunner.runSuite(f);
          all.push(...res);
        }
        return all;
      }, "Prompt Tester: Executing all test suites...");
    })
  );

  // Command: Run Current File
  context.subscriptions.push(
    vscode.commands.registerCommand("promptTester.runCurrentFile", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor.");
        return;
      }
      const filePath = editor.document.fileName;
      if (!filePath.includes(".prompt.")) {
        vscode.window.showErrorMessage(
          "Current file is not a prompt test file (*.prompt.json or *.prompt.yaml)."
        );
        return;
      }

      await runAndNotify(async () => {
        return await PromptRunner.runSuite(filePath);
      }, `Prompt Tester: Executing ${path.basename(filePath)}...`);
    })
  );

  // Command: Open Dashboard
  context.subscriptions.push(
    vscode.commands.registerCommand("promptTester.openDashboard", () => {
      PromptTesterWebviewPanel.createOrShow(context.extensionUri);
    })
  );

  // Command: Create Sample Test Suite
  context.subscriptions.push(
    vscode.commands.registerCommand("promptTester.createSampleTest", async () => {
      const folders = vscode.workspace.workspaceFolders;
      if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage("Open a workspace folder first.");
        return;
      }

      const samplePath = path.join(
        folders[0].uri.fsPath,
        "sample.prompt.json"
      );

      const sampleSuite = {
        name: "E-Commerce Assistant Prompt Suite",
        version: "1.0",
        defaultModel: "gemini-2.5-flash",
        tests: [
          {
            name: "Order Status Inquiry Test",
            model: "gemini-2.5-flash",
            systemPrompt:
              "You are a helpful customer service assistant for an online store.",
            userPrompt:
              "Where is my package? Order ID is {{orderId}} and customer name is {{name}}.",
            variables: {
              orderId: "ORD-94821",
              name: "Alice",
            },
            expect: {
              contains: ["ORD-94821", "Alice"],
              notContains: ["error", "unknown system failure"],
              maxTokens: 120,
              maxLatencyMs: 3000,
            },
          },
          {
            name: "Structured Invoice Extractor Test",
            model: "gemini-2.5-flash",
            systemPrompt:
              "Extract invoice line items and output strictly valid JSON format.",
            userPrompt:
              "Extract: 2x Wireless Mouse @ $25 each, Total: $50.",
            expect: {
              isValidJson: true,
              jsonKeys: ["status", "result"],
              maxTokens: 150,
            },
          },
        ],
      };

      fs.writeFileSync(samplePath, JSON.stringify(sampleSuite, null, 2), "utf8");
      const doc = await vscode.workspace.openTextDocument(samplePath);
      await vscode.window.showTextDocument(doc);
      vscode.window.showInformationMessage(
        "Created sample prompt test suite at sample.prompt.json! Click '▶ Run All Tests' to test it."
      );
    })
  );
}

export function deactivate() {}
