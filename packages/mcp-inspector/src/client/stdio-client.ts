import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { EventEmitter } from "events";
import { McpServerConfig, McpTool, JsonRpcRequest, JsonRpcResponse, TrafficLogEntry } from "../types/mcp";

export class StdioMcpClient extends EventEmitter {
  private config: McpServerConfig;
  private process: ChildProcessWithoutNullStreams | null = null;
  private requestId = 1;
  private pendingRequests = new Map<number | string, {
    resolve: (res: any) => void;
    reject: (err: any) => void;
    method: string;
    startTime: number;
    reqPayload: any;
  }>();
  private buffer = "";

  constructor(config: McpServerConfig) {
    super();
    this.config = config;
  }

  public async connect(): Promise<void> {
    if (this.process) return;

    return new Promise<void>((resolve, reject) => {
      try {
        const env = { ...process.env, ...(this.config.env || {}) };
        this.process = spawn(this.config.command, this.config.args, {
          env,
          shell: true,
        });

        this.process.stdout.on("data", (data: Buffer) => {
          this.handleIncomingData(data.toString("utf8"));
        });

        this.process.stderr.on("data", (data: Buffer) => {
          // Log stderr output
          this.emit("traffic", {
            id: `err-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            type: "error",
            serverName: this.config.name,
            payload: data.toString("utf8").trim(),
          } as TrafficLogEntry);
        });

        this.process.on("error", (err) => {
          reject(err);
        });

        this.process.on("close", (code) => {
          this.cleanup();
        });

        // Initialize handshake
        this.initializeHandshake()
          .then(() => resolve())
          .catch((err) => reject(err));
      } catch (err) {
        reject(err);
      }
    });
  }

  private async initializeHandshake(): Promise<void> {
    const initParams = {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "castov-mcp-inspector",
        version: "0.1.0",
      },
    };

    await this.sendRequest("initialize", initParams);
    // Send initialized notification (no id)
    this.sendNotification("notifications/initialized");
  }

  public async listTools(): Promise<McpTool[]> {
    const res = await this.sendRequest("tools/list", {});
    if (res && Array.isArray(res.tools)) {
      return res.tools;
    }
    return [];
  }

  public async callTool(name: string, args: Record<string, any>): Promise<any> {
    return this.sendRequest("tools/call", {
      name,
      arguments: args,
    });
  }

  public sendNotification(method: string, params?: any): void {
    if (!this.process) return;
    const msg = {
      jsonrpc: "2.0",
      method,
      params,
    };
    this.process.stdin.write(JSON.stringify(msg) + "\n");
  }

  public sendRequest(method: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        return reject(new Error("Server process is not running."));
      }

      const id = this.requestId++;
      const req: JsonRpcRequest = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      };

      const startTime = Date.now();
      this.pendingRequests.set(id, {
        resolve,
        reject,
        method,
        startTime,
        reqPayload: req,
      });

      // Emit request traffic log
      this.emit("traffic", {
        id: `req-${id}-${startTime}`,
        timestamp: new Date().toLocaleTimeString(),
        type: "request",
        serverName: this.config.name,
        method,
        payload: req,
      } as TrafficLogEntry);

      // Write to stdin
      this.process.stdin.write(JSON.stringify(req) + "\n");

      // Timeout safeguard 20s
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`MCP Request timed out for method "${method}" (20s).`));
        }
      }, 20000);
    });
  }

  private handleIncomingData(chunk: string): void {
    this.buffer += chunk;
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const msg = JSON.parse(trimmed);
        if (msg.id !== undefined && this.pendingRequests.has(msg.id)) {
          const pending = this.pendingRequests.get(msg.id)!;
          this.pendingRequests.delete(msg.id);
          const durationMs = Date.now() - pending.startTime;

          // Emit response traffic log
          this.emit("traffic", {
            id: `res-${msg.id}-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            type: msg.error ? "error" : "response",
            serverName: this.config.name,
            method: pending.method,
            durationMs,
            payload: msg,
          } as TrafficLogEntry);

          if (msg.error) {
            pending.reject(new Error(msg.error.message || `RPC Error code ${msg.error.code}`));
          } else {
            pending.resolve(msg.result);
          }
        }
      } catch {
        // Line wasn't valid JSON, could be server log line
      }
    }
  }

  public disconnect(): void {
    if (this.process) {
      try {
        this.process.kill();
      } catch {
        // Ignore kill error
      }
      this.cleanup();
    }
  }

  private cleanup(): void {
    this.process = null;
    this.pendingRequests.clear();
    this.buffer = "";
  }
}
