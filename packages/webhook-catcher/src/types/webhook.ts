export interface ForwardResult {
  targetUrl: string;
  statusCode: number;
  durationMs: number;
  timestamp: string;
  responseBody?: string;
  error?: string;
}

export interface CapturedWebhook {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  bodyRaw: string;
  bodyJson?: any;
  sourceService: "Stripe" | "GitHub" | "Shopify" | "Slack" | "Custom";
  eventType?: string;
  forwardHistory: ForwardResult[];
}

export interface ServerStatus {
  running: boolean;
  port: number;
  endpointUrl: string;
  webhooksReceived: number;
  targetUrl: string;
  autoForward: boolean;
}
