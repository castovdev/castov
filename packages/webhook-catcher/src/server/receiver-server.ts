import * as http from "http";
import { EventEmitter } from "events";
import { CapturedWebhook, ServerStatus } from "../types/webhook";
import { WebhookForwarder } from "./forwarder";

export class WebhookReceiverServer extends EventEmitter {
  private server: http.Server | null = null;
  private port = 9090;
  private isRunning = false;
  private webhooks: CapturedWebhook[] = [];
  private targetUrl = "http://localhost:3000/api/webhook";
  private autoForward = false;

  public getStatus(): ServerStatus {
    return {
      running: this.isRunning,
      port: this.port,
      endpointUrl: `http://127.0.0.1:${this.port}/webhook`,
      webhooksReceived: this.webhooks.length,
      targetUrl: this.targetUrl,
      autoForward: this.autoForward,
    };
  }

  public getWebhooks(): CapturedWebhook[] {
    return this.webhooks;
  }

  public setTargetUrl(url: string): void {
    this.targetUrl = url;
    this.emit("statusChanged", this.getStatus());
  }

  public setAutoForward(enabled: boolean): void {
    this.autoForward = enabled;
    this.emit("statusChanged", this.getStatus());
  }

  public clearWebhooks(): void {
    this.webhooks = [];
    this.emit("cleared");
  }

  public async start(port = 9090): Promise<number> {
    if (this.isRunning) return this.port;
    this.port = port;

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleIncoming(req, res);
      });

      this.server.on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          this.port++;
          this.server?.listen(this.port, "127.0.0.1");
        } else {
          this.isRunning = false;
          reject(err);
        }
      });

      this.server.listen(this.port, "127.0.0.1", () => {
        this.isRunning = true;
        this.emit("statusChanged", this.getStatus());
        resolve(this.port);
      });
    });
  }

  public async stop(): Promise<void> {
    if (!this.isRunning || !this.server) return;

    return new Promise((resolve) => {
      this.server?.close(() => {
        this.isRunning = false;
        this.server = null;
        this.emit("statusChanged", this.getStatus());
        resolve();
      });
    });
  }

  private handleIncoming(req: http.IncomingMessage, res: http.ServerResponse): void {
    const chunks: Buffer[] = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", async () => {
      const bodyRaw = Buffer.concat(chunks).toString("utf8");
      let bodyJson: any;
      try {
        bodyJson = JSON.parse(bodyRaw);
      } catch {
        bodyJson = undefined;
      }

      const headers = req.headers;
      const { service, eventType } = this.detectServiceAndEvent(headers, bodyJson);

      const webhook: CapturedWebhook = {
        id: `whk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString(),
        method: (req.method || "POST").toUpperCase(),
        path: req.url || "/",
        headers,
        bodyRaw,
        bodyJson,
        sourceService: service,
        eventType,
        forwardHistory: [],
      };

      this.webhooks.unshift(webhook);
      if (this.webhooks.length > 100) this.webhooks.pop();

      // Send 200 OK to sender immediately
      res.writeHead(200, {
        "Content-Type": "application/json",
        "X-Catcher-By": "Castov Webhook Catcher",
      });
      res.end(JSON.stringify({
        received: true,
        id: webhook.id,
        service,
        eventType,
        timestamp: new Date().toISOString(),
      }));

      this.emit("webhookReceived", webhook);

      // Auto-forward if enabled
      if (this.autoForward && this.targetUrl) {
        const result = await WebhookForwarder.forward(webhook, this.targetUrl);
        webhook.forwardHistory.unshift(result);
        this.emit("forwardResult", { webhookId: webhook.id, result });
      }
    });
  }

  private detectServiceAndEvent(
    headers: http.IncomingHttpHeaders,
    json: any
  ): { service: CapturedWebhook["sourceService"]; eventType?: string } {
    if (headers["stripe-signature"]) {
      return { service: "Stripe", eventType: json?.type || "stripe.event" };
    }
    if (headers["x-github-event"]) {
      return { service: "GitHub", eventType: String(headers["x-github-event"]) };
    }
    if (headers["x-shopify-topic"]) {
      return { service: "Shopify", eventType: String(headers["x-shopify-topic"]) };
    }
    if (headers["x-slack-signature"]) {
      return { service: "Slack", eventType: json?.event?.type || "slack.event" };
    }
    return {
      service: "Custom",
      eventType: json?.event || json?.action || json?.type || undefined,
    };
  }
}
