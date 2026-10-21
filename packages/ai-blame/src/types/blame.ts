export type AuthorType = "HUMAN" | "AI_AGENT";

export type AIAgentType =
  | "Claude"
  | "Cursor"
  | "Copilot"
  | "Aider"
  | "Devin"
  | "ChatGPT"
  | "Antigravity"
  | "GenericAI";

export interface LineBlame {
  lineNumber: number;
  author: string;
  authorEmail: string;
  authorType: AuthorType;
  agentType?: AIAgentType;
  commitHash: string;
  commitDate: string;
  commitSummary: string;
}

export interface FileBlameSummary {
  filePath: string;
  fileName: string;
  totalLines: number;
  aiLines: number;
  humanLines: number;
  aiPercentage: number;
  agentCounts: Record<string, number>;
  lines: LineBlame[];
}

export interface WorkspaceBlameSummary {
  timestamp: string;
  totalFiles: number;
  totalLines: number;
  totalAiLines: number;
  totalHumanLines: number;
  overallAiPercentage: number;
  agentBreakdown: Record<string, number>;
  files: FileBlameSummary[];
}
