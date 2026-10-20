export type FaultType =
  | "rate_limit_429"
  | "internal_error_500"
  | "bad_gateway_502"
  | "timeout_504"
  | "high_latency"
  | "drop_connection"
  | "mock_payload";

export interface ChaosRule {
  id: string;
  name: string;
  enabled: boolean;
  urlPattern: string; // glob or substring match, e.g. "*", "api/v1/users", "openai.com"
  method: string;     // "*", "GET", "POST", etc.
  fault: FaultType;
  latencyMs?: number; // e.g. 2500
  probability: number;// 0.0 - 1.0 (1.0 = 100%)
  mockBody?: string;  // Custom JSON string
}

export interface InterceptedRequest {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  matchedRuleName?: string;
  faultApplied?: string;
  statusCode: number;
  latencyMs: number;
}

export interface ProxyStatus {
  running: boolean;
  port: number;
  requestCount: number;
  faultCount: number;
  rules: ChaosRule[];
}
