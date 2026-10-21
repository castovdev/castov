export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type Category =
  | "EXPOSED_SECRET"
  | "DANGEROUS_COMMAND"
  | "PROMPT_INJECTION"
  | "UNCONFINED_ACCESS"
  | "CONFIG_HYGIENE";

export interface SecurityFinding {
  id: string;
  serverName: string;
  configFile: string;
  category: Category;
  severity: Severity;
  title: string;
  description: string;
  remediation: string;
  detectedValue?: string;
  line?: number;
}

export interface ServerAuditReport {
  name: string;
  configFile: string;
  command: string;
  args: string[];
  envKeys: string[];
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  riskLevel: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  findings: SecurityFinding[];
}

export interface AuditSummary {
  timestamp: string;
  totalServers: number;
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  overallScore: number;
  overallGrade: "A+" | "A" | "B" | "C" | "D" | "F";
  scannedConfigs: string[];
  serverReports: ServerAuditReport[];
  allFindings: SecurityFinding[];
}
