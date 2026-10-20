export interface McpServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  configSource: string;
}

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: {
    type?: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface TrafficLogEntry {
  id: string;
  timestamp: string;
  type: "request" | "response" | "error";
  serverName: string;
  method?: string;
  durationMs?: number;
  payload: any;
}

export interface SecurityFinding {
  id: string;
  serverName: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  location: string;
  recommendation: string;
}
