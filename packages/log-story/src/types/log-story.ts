export type LogLevel = "FATAL" | "ERROR" | "WARN" | "INFO" | "DEBUG";

export interface LogEntry {
  id: string;
  raw: string;
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  requestId?: string;
  stackTrace?: string;
  isRootCause?: boolean;
  repeatCount: number;
}

export interface TraceStory {
  requestId: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  servicesInvolved: string[];
  hasError: boolean;
  rootCauseError?: LogEntry;
  steps: LogEntry[];
}

export interface LogAnalysisReport {
  timestamp: string;
  totalRawLines: number;
  foldedLinesCount: number;
  totalTraces: number;
  errorCount: number;
  rootCause?: LogEntry;
  traces: TraceStory[];
  standaloneErrors: LogEntry[];
}
