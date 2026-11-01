/**
 * Castov Secret Shield - Detector Types & Interfaces
 */

export type SecretType =
  | "AWS_KEY"
  | "GITHUB_TOKEN"
  | "STRIPE_KEY"
  | "OPENAI_KEY"
  | "ANTHROPIC_KEY"
  | "GOOGLE_KEY"
  | "SLACK_TOKEN"
  | "PRIVATE_KEY"
  | "JWT"
  | "DATABASE_URI"
  | "BEARER_TOKEN"
  | "ENV_SECRET";

export interface SecretFinding {
  type: SecretType;
  label: string;
  startIndex: number;
  endIndex: number;
  raw: string;
  masked: string;
}

export interface ScanOptions {
  /** Maximum bytes of paste text to scan before truncating (default: 2,097,152 = 2MB) */
  maxPasteSize?: number;
  /** Whether to scan line-by-line .env high-entropy key-values (default: true) */
  includeEnvScanner?: boolean;
}

export interface ScanResult {
  findings: SecretFinding[];
  scanDurationMs: number;
  totalBytesScanned: number;
  hasFindings: boolean;
  truncated: boolean;
}
