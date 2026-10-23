import * as vscode from "vscode";
import { WebhookReceiverServer } from "../server/receiver-server";
import { ServerStatus } from "../types/webhook";

export class WebhookCatcherTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public readonly description?: string,
    public readonly tooltip?: string,
    public readonly command?: vscode.Command,
    icon?: string
  ) {
    super(label, collapsibleState);
    if (icon) {
      this.iconPath = new vscode.ThemeIcon(icon);
    }
  }
}

export class WebhookCatcherTreeProvider
  implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined | null | void
  > = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    vscode.TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor(private readonly server: WebhookReceiverServer) {
    this.server.on("statusChanged", () => this.refresh());
    this.server.on("webhookReceived", () => this.refresh());
    this.server.on("cleared", () => this.refresh());
    this.server.on("forwardResult", () => this.refresh());
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  public getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (!element) {
      return Promise.resolve(this.getRootItems());
    }
    return Promise.resolve([]);
  }

  private getRootItems(): vscode.TreeItem[] {
    const status: ServerStatus = this.server.getStatus();
    const items: vscode.TreeItem[] = [];

    // 1. Server status indicator
    if (status.running) {
      const serverItem = new WebhookCatcherTreeItem(
        `Receiver: Listening on :${status.port}`,
        vscode.TreeItemCollapsibleState.None,
        "serverRunning",
        "Active",
        `Endpoint: ${status.endpointUrl}\nClick to open dashboard`,
        {
          command: "webhookCatcher.openDashboard",
          title: "Open Dashboard",
        },
        "radio-tower"
      );
      items.push(serverItem);
    } else {
      const serverItem = new WebhookCatcherTreeItem(
        "Receiver: Stopped",
        vscode.TreeItemCollapsibleState.None,
        "serverStopped",
        "Offline",
        "Click to start webhook receiver",
        {
          command: "webhookCatcher.toggle",
          title: "Start Receiver",
        },
        "debug-disconnect"
      );
      items.push(serverItem);
    }

    // 2. Target Forwarding URL
    const targetItem = new WebhookCatcherTreeItem(
      `Target: ${status.targetUrl}`,
      vscode.TreeItemCollapsibleState.None,
      "targetUrl",
      status.autoForward ? "Auto-Forward ON" : "Manual Replay",
      `Target: ${status.targetUrl}\nAuto-Forward: ${status.autoForward ? "Enabled" : "Disabled"}`,
      {
        command: "webhookCatcher.openDashboard",
        title: "Open Dashboard",
      },
      status.autoForward ? "zap" : "arrow-right"
    );
    items.push(targetItem);

    // 3. Webhooks list header or items
    const webhooks = this.server.getWebhooks();
    if (webhooks.length === 0) {
      const emptyItem = new WebhookCatcherTreeItem(
        "No webhooks captured yet",
        vscode.TreeItemCollapsibleState.None,
        "empty",
        status.running ? "Waiting for requests..." : "Start receiver to listen",
        undefined,
        undefined,
        "inbox"
      );
      items.push(emptyItem);
    } else {
      // Show list of captured webhooks in reverse chronological order
      const reversed = [...webhooks].reverse();
      for (const wh of reversed) {
        const title = wh.eventType
          ? `[${wh.sourceService}] ${wh.eventType}`
          : `[${wh.sourceService}] ${wh.method} ${wh.path}`;

        let icon = "globe";
        if (wh.sourceService === "Stripe") icon = "credit-card";
        else if (wh.sourceService === "GitHub") icon = "repo-forked";
        else if (wh.sourceService === "Shopify") icon = "package";

        const hasForwards = wh.forwardHistory.length > 0;
        const lastForward = hasForwards
          ? wh.forwardHistory[wh.forwardHistory.length - 1]
          : undefined;

        let desc = wh.timestamp;
        if (lastForward) {
          desc += ` • Replayed (${lastForward.statusCode || "Err"})`;
        }

        const item = new WebhookCatcherTreeItem(
          title,
          vscode.TreeItemCollapsibleState.None,
          "webhookItem",
          desc,
          `ID: ${wh.id}\nTime: ${wh.timestamp}\nMethod: ${wh.method}\nService: ${wh.sourceService}\nClick to inspect in dashboard`,
          {
            command: "webhookCatcher.openDashboard",
            title: "Inspect Webhook",
          },
          icon
        );
        items.push(item);
      }
    }

    return items;
  }
}
