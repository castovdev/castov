export interface FileChangeSnapshot {
  id: string;
  stepNumber: number;
  timestamp: string;
  filePath: string;
  fileName: string;
  linesAdded: number;
  linesRemoved: number;
  beforeContent: string;
  afterContent: string;
  description: string;
}

export interface AgentSession {
  id: string;
  startedAt: string;
  totalSnapshots: number;
  snapshots: FileChangeSnapshot[];
}
