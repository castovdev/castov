export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface Finding {
  ruleId: string;
  severity: Severity;
  title: string;
  whyItMatters: string;
  suggestedFix: string;
  file: string;
  line?: number;
  column?: number;
  serverName?: string;
  evidenceMasked?: string;
  fingerprint?: string;
  isBaselineSuppressed?: boolean;
}

export interface RuleDefinition {
  id: string;
  title: string;
  severity: Severity;
  whyItMatters: string;
  suggestedFix: string;
  securitySeverity?: number; // 0.0 - 10.0 for SARIF
}

export interface McpServerConfig {
  name: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  autoApprove?: string[] | boolean;
  alwaysAllow?: string[] | boolean;
  transport?: string;
  [key: string]: unknown;
}

export interface ParsedConfigFile {
  filePath: string;
  clientName?: string;
  scope: "project" | "user";
  servers: Record<string, McpServerConfig>;
  rawContent: string;
  isEnvFile?: boolean;
}

export interface AgentRuleFile {
  filePath: string;
  fileName: string;
  rawContent: string;
}

export interface AuditOptions {
  targetPath?: string;
  includeUserConfigs?: boolean;
  format?: "text" | "json" | "sarif" | "md";
  outputFile?: string;
  failOn?: "critical" | "high" | "medium" | "low" | "none";
  ignoreRules?: string[];
  maxDepth?: number;
  noGit?: boolean;
  baselineFile?: string;
  saveBaselineFile?: string;
  clientName?: string;
  quiet?: boolean;
  useGitleaks?: boolean;
}

export interface BaselineData {
  schemaVersion: "1.0.0";
  createdAt: string;
  targetPath: string;
  fingerprints: string[];
}

export interface AuditResult {
  schemaVersion: "1.0.0";
  toolVersion: string;
  scannedAt: string;
  targetPath: string;
  filesScanned: string[];
  findings: Finding[];
  counts: Record<Severity, number>;
  exitCode: number;
  baselineSummary?: {
    totalSuppressed: number;
    newFindings: number;
  };
}

export const ALL_RULES_METADATA: Record<string, RuleDefinition> = {
  "CAS-001": {
    id: "CAS-001",
    title: "Hardcoded Secret in Server Config",
    severity: "critical",
    whyItMatters: "Exposes live credentials directly in plain text configuration files committed to source control.",
    suggestedFix: "Replace hardcoded secret with client-specific environment variable references.",
    securitySeverity: 9.5,
  },
  "CAS-002": {
    id: "CAS-002",
    title: "Unpinned Runtime Launcher",
    severity: "medium",
    whyItMatters: "Executing packages or containers without explicit version pinning allows automatic pulling of compromised or untested releases.",
    suggestedFix: "Pin exact package versions or immutable container tags/digests.",
    securitySeverity: 5.5,
  },
  "CAS-003": {
    id: "CAS-003",
    title: "Shell Wrapper or Embedded Script",
    severity: "high",
    whyItMatters: "Running tools through a shell command string introduces arbitrary command injection and shell escape vulnerabilities.",
    suggestedFix: "Invoke target binaries directly as executable command without shell wrappers (-c / -Command).",
    securitySeverity: 8.5,
  },
  "CAS-004": {
    id: "CAS-004",
    title: "Remote Server Security & Data Flow",
    severity: "high",
    whyItMatters: "Unencrypted or unauthenticated remote endpoints expose prompts and tool payloads to interception.",
    suggestedFix: "Use HTTPS with explicit authentication headers for all remote servers.",
    securitySeverity: 7.5,
  },
  "CAS-005": {
    id: "CAS-005",
    title: "Broad Filesystem Scope",
    severity: "high",
    whyItMatters: "Granting root or user home directory access exposes private SSH keys, cloud tokens, and system files.",
    suggestedFix: "Restrict tool filesystem arguments to specific project directories.",
    securitySeverity: 8.0,
  },
  "CAS-006": {
    id: "CAS-006",
    title: "Docker Container Risks",
    severity: "critical",
    whyItMatters: "Privileged containers or host docker.sock bindings provide root-equivalent privilege escalation over the host.",
    suggestedFix: "Avoid --privileged mode and docker.sock volume mounts.",
    securitySeverity: 9.8,
  },
  "CAS-007": {
    id: "CAS-007",
    title: "Auto-Approve / Always-Allow Permissions",
    severity: "high",
    whyItMatters: "Automatically approving destructive tool execution bypasses human confirmation.",
    suggestedFix: "Enforce interactive user approval for file modifications and shell execution.",
    securitySeverity: 7.8,
  },
  "CAS-008": {
    id: "CAS-008",
    title: ".env File Committed or Unignored",
    severity: "high",
    whyItMatters: "Plaintext .env files in project root risk accidental git commits and leakage into AI context.",
    suggestedFix: "Add .env to .gitignore and remove it from git tracking if tracked.",
    securitySeverity: 8.2,
  },
  "CAS-009": {
    id: "CAS-009",
    title: "Missing .env.example or Leaked Secret in Example",
    severity: "medium",
    whyItMatters: "Projects without .env.example confuse onboarding, while example files with real secrets leak credentials.",
    suggestedFix: "Provide a .env.example with dummy values, ensuring no real keys are committed.",
    securitySeverity: 5.0,
  },
  "CAS-010": {
    id: "CAS-010",
    title: "AI Rule File Credential Leak or Dangerous Instruction",
    severity: "high",
    whyItMatters: "Rules files (.cursorrules, CLAUDE.md) ingested by AI agents may contain leaked keys or instructions disabling security guardrails.",
    suggestedFix: "Remove plaintext keys and dangerous override directives from AI guideline files.",
    securitySeverity: 7.9,
  },
  "CAS-011": {
    id: "CAS-011",
    title: "Conflicting MCP Server Names",
    severity: "medium",
    whyItMatters: "Duplicate server names across project and user configs lead to ambiguous tool dispatch and unexpected overrides.",
    suggestedFix: "Rename conflicting MCP servers to ensure unique identifiers.",
    securitySeverity: 4.5,
  },
  "CAS-012": {
    id: "CAS-012",
    title: "Syntax Error or Unparseable Config",
    severity: "medium",
    whyItMatters: "Configuration file contains syntax errors or invalid formatting preventing tool loading.",
    suggestedFix: "Fix JSON syntax errors, ensure balanced brackets and valid quotes.",
    securitySeverity: 4.0,
  },
  "CAS-013": {
    id: "CAS-013",
    title: "Insecure or Deprecated Transport",
    severity: "medium",
    whyItMatters: "Using unencrypted or deprecated transport protocols allows eavesdropping on agent-tool communications.",
    suggestedFix: "Use standard stdio or TLS-secured SSE transport protocols.",
    securitySeverity: 6.0,
  },
  "CAS-014": {
    id: "CAS-014",
    title: "Missing or Unresolvable Command Binary",
    severity: "low",
    whyItMatters: "The command specified for the MCP server cannot be found on PATH, causing agent startup failures.",
    suggestedFix: "Ensure executable is installed and available in the system PATH.",
    securitySeverity: 2.5,
  },
  "CAS-015": {
    id: "CAS-015",
    title: "Excessive Environment Variable Pass-Through",
    severity: "medium",
    whyItMatters: "Passing wildcard or entire host environment to child tools can leak unrelated system credentials.",
    suggestedFix: "Explicitly declare only the minimal required environment variables.",
    securitySeverity: 6.5,
  },
};
