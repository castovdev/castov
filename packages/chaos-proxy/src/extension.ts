import * as vscode from "vscode";
import { ProxyEngine } from "./server/proxy-engine";
import { ChaosWebviewPanel } from "./views/chaos-webview";
import { ChaosTreeDataProvider } from "./views/chaos-tree-provider";
import { ChaosStatusBar } from "./views/status-bar";

let globalEngine: ProxyEngine | null = null;

export function activate(context: vscode.ExtensionContext) {
  const engine = new ProxyEngine();
  globalEngine = engine;

  // 1. Status Bar Item
  const statusBar = new ChaosStatusBar(engine);
  context.subscriptions.push(statusBar);

  // 2. Sidebar Tree Data Provider
  const treeDataProvider = new ChaosTreeDataProvider(engine);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("chaosProxy.mainView", treeDataProvider)
  );

  // 3. Command: Toggle Start/Stop
  context.subscriptions.push(
    vscode.commands.registerCommand("chaosProxy.toggle", async () => {
      if (engine.getStatus().running) {
        await engine.stop();
        vscode.window.showInformationMessage("Chaos Proxy: Stopped.");
      } else {
        try {
          const port = await engine.start(8080);
          vscode.window.showInformationMessage(
            `Chaos Proxy: Active on http://127.0.0.1:${port}. Ready to intercept traffic!`
          );
        } catch (err: any) {
          vscode.window.showErrorMessage(`Chaos Proxy failed to start: ${err.message}`);
        }
      }
    })
  );

  // 4. Command: Open Interactive Control Panel
  context.subscriptions.push(
    vscode.commands.registerCommand("chaosProxy.openDashboard", () => {
      ChaosWebviewPanel.createOrShow(context.extensionUri, engine);
    })
  );

  // 5. Command: Toggle Rule from Tree
  context.subscriptions.push(
    vscode.commands.registerCommand("chaosProxy.toggleRule", (ruleId: string) => {
      engine.toggleRule(ruleId);
    })
  );

  // 6. Command: Quick Preset 429
  context.subscriptions.push(
    vscode.commands.registerCommand("chaosProxy.inject429", async () => {
      if (!engine.getStatus().running) await engine.start(8080);
      engine.toggleRule("preset-429");
      vscode.window.showInformationMessage("Chaos Proxy: 429 Rate Limit preset toggled.");
    })
  );

  // 7. Command: Quick Preset 500
  context.subscriptions.push(
    vscode.commands.registerCommand("chaosProxy.inject500", async () => {
      if (!engine.getStatus().running) await engine.start(8080);
      engine.toggleRule("preset-500");
      vscode.window.showInformationMessage("Chaos Proxy: 500 Server Error preset toggled.");
    })
  );

  // 8. Command: Quick Preset High Latency
  context.subscriptions.push(
    vscode.commands.registerCommand("chaosProxy.injectLatency", async () => {
      if (!engine.getStatus().running) await engine.start(8080);
      engine.toggleRule("preset-latency");
      vscode.window.showInformationMessage("Chaos Proxy: 3000ms Latency preset toggled.");
    })
  );
}

export function deactivate() {
  if (globalEngine) {
    globalEngine.stop();
  }
}
