export interface EnvEntry {
  key: string;
  value: string;
  line: number;
  isDuplicate?: boolean;
}

export interface EnvFile {
  filePath: string;
  fileName: string;
  entries: Map<string, EnvEntry[]>;
  rawContent: string;
}

export interface CodeReference {
  key: string;
  filePath: string;
  line: number;
  snippet: string;
}

export type EnvIssueType =
  | "missing_in_env"
  | "missing_in_example"
  | "dead_in_code"
  | "duplicate_key"
  | "git_leak_risk";

export interface EnvIssue {
  id: string;
  type: EnvIssueType;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  variableName: string;
  locations: string[];
  quickFix?: "add_to_env" | "add_to_example" | "remove_duplicate" | "add_to_gitignore";
}

export interface EnvAuditReport {
  healthScore: number;
  issues: EnvIssue[];
  allVariables: Array<{
    key: string;
    inEnv: boolean;
    inExample: boolean;
    inCode: boolean;
    codeReferencesCount: number;
  }>;
  envFilesFound: string[];
  gitSafe: boolean;
}
