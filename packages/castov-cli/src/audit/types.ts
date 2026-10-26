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
  keyName?: string;
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
  description?: string;
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
  maxEnvVars?: number;
  noGit?: boolean;
  baselineFile?: string;
  saveBaselineFile?: string;
  clientName?: string;
  quiet?: boolean;
  useGitleaks?: boolean;
}

export interface BaselineServerEntry {
  client: string;
  scope: "project" | "user";
  serverName: string;
  file: string; // relative path with '/'
  definitionHash: string;
  coreExecutionHash: string;
}

export interface BaselineData {
  schemaVersion: "1.0.0";
  createdAt: string;
  targetPath: string;
  fingerprints: string[];
  servers?: Record<string, BaselineServerEntry>;
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
    whyItMatters: "Exposes live credentials directly in plain text configuration files.",
    suggestedFix: "Keep secrets outside configuration files and git, and use the client's documented variable reference mechanism.",
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
    title: ".env Unprotected from AI Context or Unrespected .claudeignore",
    severity: "medium",
    whyItMatters: "Plaintext .env files without a verified agent block (Cursor .cursorignore or Claude Code permissions.deny in .claude/settings.json) can be read into LLM context. Note that .claudeignore is not respected by Claude Code.",
    suggestedFix: "Add permissions.deny Read(./.env) / Read(./.env.*) in .claude/settings.json for Claude Code, add .env* to .cursorignore for Cursor, and keep secrets outside the project directory.",
    securitySeverity: 5.5,
  },
  "CAS-009": {
    id: "CAS-009",
    title: "Literal Secret in Config or Git-Tracked/Unignored .env",
    severity: "high",
    whyItMatters: "Hardcoded secrets in environment/config files or .env files tracked/unignored by Git risk leaking credentials into version history.",
    suggestedFix: "Add .env* to .gitignore, remove tracked .env files with git rm --cached, and replace literal secrets with placeholders.",
    securitySeverity: 8.5,
  },
  "CAS-010": {
    id: "CAS-010",
    title: "Duplicate or Conflicting MCP Server Definition",
    severity: "low",
    whyItMatters: "Duplicate server names across project and user scopes lead to ambiguous tool dispatch and unexpected overrides.",
    suggestedFix: "Rename conflicting MCP servers to ensure unique identifiers across scopes.",
    securitySeverity: 3.0,
  },
  "CAS-011": {
    id: "CAS-011",
    title: "MCP Server Baseline Drift (Potential Rug Pull)",
    severity: "high",
    whyItMatters: "A server's executable command, arguments, endpoint URL, or presence changed relative to the approved security baseline.",
    suggestedFix: "Review the server configuration diff against the approved baseline before running the tool.",
    securitySeverity: 8.2,
  },
  "CAS-012": {
    id: "CAS-012",
    title: "Unparseable Configuration File",
    severity: "info",
    whyItMatters: "Configuration file contains syntax errors or invalid formatting preventing tool analysis and loading.",
    suggestedFix: "Fix JSON syntax errors, ensure balanced brackets and valid quotes.",
    securitySeverity: 2.0,
  },
  "CAS-013": {
    id: "CAS-013",
    title: "Insecure or Deprecated Transport",
    severity: "medium",
    whyItMatters: "Using unencrypted or deprecated transport protocols allows eavesdropping on agent-tool communications.",
    suggestedFix: "Use standard stdio or TLS-secured HTTPS/WSS transport protocols.",
    securitySeverity: 6.0,
  },
  "CAS-014": {
    id: "CAS-014",
    title: "Missing or Unresolvable Command Binary",
    severity: "low",
    whyItMatters: "The command path specified for the MCP server does not exist on disk, causing startup failures.",
    suggestedFix: "Ensure the target executable path exists and is built before launching the MCP server.",
    securitySeverity: 2.5,
  },
  "CAS-015": {
    id: "CAS-015",
    title: "Excessive Environment Variable Pass-Through",
    severity: "low",
    whyItMatters: "Passing wildcard or excessive environment variables to child tools violates least privilege and increases secret exposure surface.",
    suggestedFix: "Explicitly declare only the minimal required environment variables.",
    securitySeverity: 3.5,
  },
  "CAS-016": {
    id: "CAS-016",
    title: "Hidden Unicode/Bidi Characters or Override Heuristics in AI Rules",
    severity: "high",
    whyItMatters: "Zero-width, bidirectional control, or tag characters and prompt override directives in AI rule files can hide malicious instructions from human reviewers.",
    suggestedFix: "Strip all hidden Unicode/Bidi/Tag characters and remove unsafe guardrail bypass instructions.",
    securitySeverity: 8.8,
  },
};
