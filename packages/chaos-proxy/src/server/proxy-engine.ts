import * as http from "http";
import * as url from "url";
import { EventEmitter } from "events";
import { ChaosRule, FaultType, InterceptedRequest, ProxyStatus } from "../types/chaos";

export class ProxyEngine extends EventEmitter {
  private server: http.Server | null = null;
  private port = 8080;
  private isRunning = false;
  private requestCount = 0;
  private faultCount = 0;

  private rules: ChaosRule[] = [
    {
      id: "preset-429",
      name: "Simulate 429 Rate Limit",
      enabled: false,
      urlPattern: "*",
      method: "*",
      fault: "rate_limit_429",
      probability: 1.0,
    },
    {
      id: "preset-500",
      name: "Simulate 500 Internal Server Error",
      enabled: false,
      urlPattern: "*",
      method: "*",
      fault: "internal_error_500",
      probability: 1.0,
    },
    {
      id: "preset-latency",
      name: "Inject 3000ms High Latency",
      enabled: false,
      urlPattern: "*",
      method: "*",
      fault: "high_latency",
      latencyMs: 3000,
      probability: 1.0,
    },
  ];

  public getStatus(): ProxyStatus {
    return {
      running: this.isRunning,
      port: this.port,
      requestCount: this.requestCount,
      faultCount: this.faultCount,
      rules: this.rules,
    };
  }

  public setRules(rules: ChaosRule[]): void {
    this.rules = rules;
    this.emit("rulesChanged", this.rules);
  }

  public toggleRule(id: string): void {
    const r = this.rules.find((rule) => rule.id === id);
    if (r) {
      r.enabled = !r.enabled;
      this.emit("rulesChanged", this.rules);
    }
  }

  public async start(port = 8080): Promise<number> {
    if (this.isRunning) return this.port;
    this.port = port;

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          // Retry on next port
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

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const startTime = Date.now();
    this.requestCount++;
    const reqUrl = req.url || "/";
    const reqMethod = (req.method || "GET").toUpperCase();

    // Check matching rules
    const matchedRule = this.rules.find((r) => {
      if (!r.enabled) return false;
      const methodMatches = r.method === "*" || r.method.toUpperCase() === reqMethod;
      const urlMatches = r.urlPattern === "*" || reqUrl.includes(r.urlPattern);
      const probMatches = Math.random() <= (r.probability ?? 1.0);
      return methodMatches && urlMatches && probMatches;
    });

    if (matchedRule) {
      this.faultCount++;
      await this.applyFault(matchedRule, req, res, startTime);
    } else {
      // Forward request or echo mock response
      this.forwardOrEcho(req, res, startTime);
    }
  }

  private async applyFault(
    rule: ChaosRule,
    req: http.IncomingMessage,
    res: http.ServerResponse,
    startTime: number
  ): Promise<void> {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    if (rule.fault === "drop_connection") {
      req.socket.destroy();
      this.recordInterception(req, 0, Date.now() - startTime, rule.name, "Connection Dropped (Socket Reset)");
      return;
    }

    if (rule.latencyMs && rule.latencyMs > 0) {
      await delay(rule.latencyMs);
    }

    const duration = Date.now() - startTime;
    res.setHeader("X-Chaos-Proxy", "Castov-Chaos-v0.1.0");
    res.setHeader("X-Chaos-Rule", rule.name);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");

    switch (rule.fault) {
      case "rate_limit_429":
        res.writeHead(429, {
          "Content-Type": "application/json",
          "Retry-After": "60",
        });
        res.end(JSON.stringify({
          statusCode: 429,
          error: "Too Many Requests",
          message: "Rate limit exceeded. Injected by Castov Chaos Proxy.",
          retryAfterSeconds: 60,
          injectedBy: "Castov Chaos Proxy",
        }, null, 2));
        this.recordInterception(req, 429, duration, rule.name, "429 Rate Limit Injected");
        break;

      case "internal_error_500":
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          statusCode: 500,
          error: "Internal Server Error",
          message: "Simulated server failure injected by Castov Chaos Proxy.",
          injectedBy: "Castov Chaos Proxy",
        }, null, 2));
        this.recordInterception(req, 500, duration, rule.name, "500 Server Error Injected");
        break;

      case "bad_gateway_502":
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          statusCode: 502,
          error: "Bad Gateway",
          message: "Simulated upstream gateway failure injected by Castov Chaos Proxy.",
          injectedBy: "Castov Chaos Proxy",
        }, null, 2));
        this.recordInterception(req, 502, duration, rule.name, "502 Bad Gateway Injected");
        break;

      case "timeout_504":
        await delay(2000);
        res.writeHead(504, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          statusCode: 504,
          error: "Gateway Timeout",
          message: "Upstream service response timed out. Injected by Castov Chaos Proxy.",
          injectedBy: "Castov Chaos Proxy",
        }, null, 2));
        this.recordInterception(req, 504, Date.now() - startTime, rule.name, "504 Timeout Injected");
        break;

      case "mock_payload":
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(rule.mockBody || JSON.stringify({ message: "Mock payload response", status: "ok" }, null, 2));
        this.recordInterception(req, 200, duration, rule.name, "Custom Mock Payload Returned");
        break;

      case "high_latency":
      default:
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          statusCode: 200,
          message: `Success after artificial delay of ${rule.latencyMs || 3000}ms.`,
          latencyMs: duration,
          injectedBy: "Castov Chaos Proxy",
        }, null, 2));
        this.recordInterception(req, 200, duration, rule.name, `High Latency Delay (${duration}ms)`);
        break;
    }
  }

  private forwardOrEcho(req: http.IncomingMessage, res: http.ServerResponse, startTime: number): void {
    const duration = Date.now() - startTime;
    res.setHeader("X-Chaos-Proxy", "Castov-Chaos-v0.1.0");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    res.writeHead(200);
    res.end(JSON.stringify({
      status: "ok",
      proxy: "Castov Chaos Proxy",
      port: this.port,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
      message: "Request passed through without faults applied.",
    }, null, 2));

    this.recordInterception(req, 200, duration, undefined, "Pass-Through (No Fault)");
  }

  private recordInterception(
    req: http.IncomingMessage,
    statusCode: number,
    latencyMs: number,
    matchedRuleName?: string,
    faultApplied?: string
  ): void {
    const entry: InterceptedRequest = {
      id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString(),
      method: (req.method || "GET").toUpperCase(),
      url: req.url || "/",
      matchedRuleName,
      faultApplied,
      statusCode,
      latencyMs,
    };
    this.emit("intercepted", entry);
  }
}
