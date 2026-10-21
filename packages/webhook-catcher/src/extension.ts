import * as vscode from "vscode";
import { WebhookReceiverServer } from "./server/receiver-server";
import { WebhookCatcherTreeProvider } from "./views/catcher-tree-provider";
import { WebhookStatusBarItem } from "./views/status-bar";
import { WebhookCatcherWebviewPanel } from "./views/catcher-webview";

let server: WebhookReceiverServer | undefined;

export function activate(context: vscode.ExtensionContext) {
  server = new WebhookReceiverServer();

  // Register Tree View
  const treeProvider = new WebhookCatcherTreeProvider(server);
  const treeView = vscode.window.createTreeView("webhookCatcher.mainView", {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // Register Status Bar
  const statusBar = new WebhookStatusBarItem(server);
  context.subscriptions.push(statusBar);

  // Command: Start / Stop receiver
  context.subscriptions.push(
    vscode.commands.registerCommand("webhookCatcher.toggle", async () => {
      if (!server) return;
      const status = server.getStatus();
      if (status.running) {
        await server.stop();
        vscode.window.showInformationMessage("Webhook Catcher: Server stopped.");
      } else {
        try {
          const port = await server.start(9090);
          vscode.window.showInformationMessage(
            `Webhook Catcher: Listening on http://127.0.0.1:${port}/webhook`
          );
        } catch (err: any) {
          vscode.window.showErrorMessage(
            `Webhook Catcher failed to start: ${err.message}`
          );
        }
      }
    })
  );

  // Command: Open Inspector Dashboard Webview
  context.subscriptions.push(
    vscode.commands.registerCommand("webhookCatcher.openDashboard", () => {
      if (!server) return;
      WebhookCatcherWebviewPanel.createOrShow(context.extensionUri, server);
    })
  );

  // Command: Clear All
  context.subscriptions.push(
    vscode.commands.registerCommand("webhookCatcher.clearAll", () => {
      if (!server) return;
      server.clearWebhooks();
      vscode.window.showInformationMessage("Webhook Catcher: Cleared all captured webhooks.");
    })
  );

  // Automatically start receiver on startup
  server.start(9090).catch(() => {
    // Port might be in use or handled gracefully
  });
}

export function deactivate() {
  if (server) {
    server.stop();
  }
}
