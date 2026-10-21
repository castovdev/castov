import * as http from "http";
import * as https from "https";
import * as url from "url";
import { CapturedWebhook, ForwardResult } from "../types/webhook";

export class WebhookForwarder {
  public static async forward(webhook: CapturedWebhook, targetUrlStr: string): Promise<ForwardResult> {
    const startTime = Date.now();
    const timestamp = new Date().toLocaleTimeString();

    return new Promise((resolve) => {
      try {
        const parsedUrl = new url.URL(targetUrlStr);
        const isHttps = parsedUrl.protocol === "https:";
        const transport = isHttps ? https : http;

        const forwardHeaders: Record<string, string | string[]> = {};
        for (const [key, val] of Object.entries(webhook.headers)) {
          if (!val) continue;
          const k = key.toLowerCase();
          // Filter hop-by-hop headers
          if (k !== "host" && k !== "connection" && k !== "content-length") {
            forwardHeaders[key] = val;
          }
        }

        const bodyBuffer = Buffer.from(webhook.bodyRaw, "utf8");
        forwardHeaders["content-length"] = bodyBuffer.length.toString();
        forwardHeaders["x-forwarded-by"] = "Castov-Webhook-Catcher";

        const options: http.RequestOptions = {
          protocol: parsedUrl.protocol,
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: webhook.method,
          headers: forwardHeaders,
          timeout: 10000,
        };

        const req = transport.request(options, (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            const durationMs = Date.now() - startTime;
            const resBody = Buffer.concat(chunks).toString("utf8");
            resolve({
              targetUrl: targetUrlStr,
              statusCode: res.statusCode || 200,
              durationMs,
              timestamp,
              responseBody: resBody.slice(0, 500),
            });
          });
        });

        req.on("error", (err: any) => {
          resolve({
            targetUrl: targetUrlStr,
            statusCode: 0,
            durationMs: Date.now() - startTime,
            timestamp,
            error: err.message,
          });
        });

        req.on("timeout", () => {
          req.destroy();
          resolve({
            targetUrl: targetUrlStr,
            statusCode: 504,
            durationMs: Date.now() - startTime,
            timestamp,
            error: "Forwarding request timed out (10s).",
          });
        });

        req.write(bodyBuffer);
        req.end();
      } catch (err: any) {
        resolve({
          targetUrl: targetUrlStr,
          statusCode: 0,
          durationMs: Date.now() - startTime,
          timestamp,
          error: `Invalid URL or request error: ${err.message}`,
        });
      }
    });
  }

  public static generateCurl(webhook: CapturedWebhook, targetUrl: string): string {
    const parts = [`curl -X ${webhook.method} "${targetUrl}"`];
    for (const [key, val] of Object.entries(webhook.headers)) {
      if (!val) continue;
      const k = key.toLowerCase();
      if (k !== "host" && k !== "content-length") {
        parts.push(`-H "${key}: ${val}"`);
      }
    }
    if (webhook.bodyRaw) {
      parts.push(`--data-raw '${webhook.bodyRaw.replace(/'/g, "'\\''")}'`);
    }
    return parts.join(" \\\n  ");
  }
}
