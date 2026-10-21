export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE";
export type LicenseType = "PERMISSIVE" | "COPYLEFT" | "PROPRIETARY" | "UNKNOWN";

export interface DependencyRisk {
  name: string;
  version: string;
  isDev: boolean;
  file: string;
  line: number;
  riskLevel: RiskLevel;
  license: string;
  licenseType: LicenseType;
  isTyposquat: boolean;
  squattedTarget?: string;
  suspiciousScripts?: string[];
  unmaintained?: boolean;
  warnings: string[];
}

export interface SupplyChainAuditSummary {
  timestamp: string;
  totalDependencies: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  safeCount: number;
  copyleftCount: number;
  dependencies: DependencyRisk[];
}
