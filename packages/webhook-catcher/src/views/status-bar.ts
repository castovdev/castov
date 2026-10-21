import * as vscode from "vscode";
import { WebhookReceiverServer } from "../server/receiver-server";
import { ServerStatus } from "../types/webhook";

export class WebhookStatusBarItem implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;

  constructor(private readonly server: WebhookReceiverServer) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      95
    );
    this.statusBarItem.command = "webhookCatcher.openDashboard";

    this.server.on("statusChanged", () => this.update());
    this.server.on("webhookReceived", () => this.update());
    this.server.on("cleared", () => this.update());

    this.update();
    this.statusBarItem.show();
  }

  public update(): void {
    const status: ServerStatus = this.server.getStatus();
    if (status.running) {
      const count = status.webhooksReceived;
      this.statusBarItem.text = `$(radio-tower) Webhook :${status.port}${
        count > 0 ? ` (${count})` : ""
      }`;
      this.statusBarItem.tooltip = `Webhook Catcher is running on http://127.0.0.1:${status.port}/webhook\nCaptured: ${count} requests\nClick to open inspector`;
      this.statusBarItem.color = "#38bdf8"; // cyan / light blue
    } else {
      this.statusBarItem.text = "$(debug-disconnect) Webhook: Off";
      this.statusBarItem.tooltip =
        "Webhook Catcher is stopped. Click to open dashboard or start receiver.";
      this.statusBarItem.color = undefined;
    }
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
