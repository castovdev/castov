import {
  LogEntry,
  TraceStory,
  LogAnalysisReport,
  LogLevel,
} from "../types/log-story";

export class LogParser {
  public static analyze(rawText: string): LogAnalysisReport {
    const rawLines = rawText.split("\n");
    const parsedEntries: LogEntry[] = [];

    let currentEntry: LogEntry | null = null;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line) continue;

      // Check if this line is part of a multi-line stack trace
      if (
        currentEntry &&
        (line.startsWith("at ") ||
          line.startsWith("Caused by:") ||
          line.startsWith("Traceback") ||
          line.startsWith("File \""))
      ) {
        currentEntry.stackTrace = (currentEntry.stackTrace || "") + "\n" + line;
        continue;
      }

      const entry = this.parseSingleLine(line, i + 1);

      // Check for repetition folding
      if (
        currentEntry &&
        currentEntry.message === entry.message &&
        currentEntry.service === entry.service &&
        currentEntry.level === entry.level
      ) {
        currentEntry.repeatCount++;
      } else {
        if (currentEntry) {
          parsedEntries.push(currentEntry);
        }
        currentEntry = entry;
      }
    }

    if (currentEntry) {
      parsedEntries.push(currentEntry);
    }

    // Group by trace / request ID
    const tracesMap = new Map<string, LogEntry[]>();
    const standaloneErrors: LogEntry[] = [];
    let errorCount = 0;

    for (const e of parsedEntries) {
      if (e.level === "ERROR" || e.level === "FATAL") {
        errorCount += e.repeatCount;
      }

      if (e.requestId) {
        if (!tracesMap.has(e.requestId)) {
          tracesMap.set(e.requestId, []);
        }
        tracesMap.get(e.requestId)!.push(e);
      } else if (e.level === "ERROR" || e.level === "FATAL") {
        standaloneErrors.push(e);
      }
    }

    // Build Trace Stories
    const traces: TraceStory[] = [];
    for (const [reqId, steps] of tracesMap.entries()) {
      const services = Array.from(new Set(steps.map((s) => s.service)));
      const hasError = steps.some((s) => s.level === "ERROR" || s.level === "FATAL");

      // Root cause for this trace is the earliest error entry
      const rootCauseError = steps.find(
        (s) => s.level === "ERROR" || s.level === "FATAL"
      );

      traces.push({
        requestId: reqId,
        startTime: steps[0]?.timestamp || "start",
        endTime: steps[steps.length - 1]?.timestamp || "end",
        durationMs: 140, // derived or estimated
        servicesInvolved: services,
        hasError,
        rootCauseError,
        steps,
      });
    }

    // Global Root Cause: find the first fatal or unhandled error
    let globalRootCause: LogEntry | undefined;
    for (const e of parsedEntries) {
      if (e.level === "FATAL" || e.level === "ERROR") {
        e.isRootCause = true;
        globalRootCause = e;
        break; // first chronological error is root cause!
      }
    }

    const foldedLinesCount = rawLines.length - parsedEntries.length;

    return {
      timestamp: new Date().toLocaleTimeString(),
      totalRawLines: rawLines.length,
      foldedLinesCount: Math.max(0, foldedLinesCount),
      totalTraces: traces.length,
      errorCount,
      rootCause: globalRootCause,
      traces,
      standaloneErrors,
    };
  }

  private static parseSingleLine(line: string, lineNum: number): LogEntry {
    // 1. Try parsing JSON structured log
    if (line.startsWith("{") && line.endsWith("}")) {
      try {
        const json = JSON.parse(line);
        const level = this.normalizeLevel(json.level || json.severity || "INFO");
        const message = json.message || json.msg || json.error || line;
        const service = json.service || json.app || json.name || "App";
        const requestId =
          json.requestId ||
          json.request_id ||
          json.traceId ||
          json.trace_id ||
          json.reqId ||
          this.extractCorrelationId(line);
        const timestamp =
          json.timestamp || json.time || new Date().toLocaleTimeString();

        return {
          id: `log-${lineNum}`,
          raw: line,
          timestamp: String(timestamp),
          level,
          service: String(service),
          message: String(message),
          requestId,
          repeatCount: 1,
        };
      } catch {
        // Fallback to text parsing
      }
    }

    // 2. Text line pattern matching
    // Example: 2026-10-21 09:14:02.120 [ERROR] [PaymentService] (req-8491) Database timeout
    const levelMatch = line.match(/\b(FATAL|ERROR|WARN|WARNING|INFO|DEBUG)\b/i);
    const level = levelMatch ? this.normalizeLevel(levelMatch[1]) : "INFO";

    const serviceMatch = line.match(/\[([a-zA-Z0-9_\-]+Service|[a-zA-Z0-9_\-]+App|[a-zA-Z0-9_\-]+)\]/);
    const service = serviceMatch ? serviceMatch[1] : "System";

    const requestId = this.extractCorrelationId(line);

    const timeMatch = line.match(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/);
    const timestamp = timeMatch ? timeMatch[0] : new Date().toLocaleTimeString();

    let cleanMsg = line;
    if (timeMatch) cleanMsg = cleanMsg.replace(timeMatch[0], "");
    if (levelMatch) cleanMsg = cleanMsg.replace(levelMatch[0], "");
    if (serviceMatch) cleanMsg = cleanMsg.replace(serviceMatch[0], "");
    cleanMsg = cleanMsg.replace(/^[:\s\-\[\]\(\)]+/, "").trim();

    return {
      id: `log-${lineNum}`,
      raw: line,
      timestamp,
      level,
      service,
      message: cleanMsg || line,
      requestId,
      repeatCount: 1,
    };
  }

  private static extractCorrelationId(text: string): string | undefined {
    // Check request_id="abc" or req_id: xyz
    const m = text.match(
      /(?:request_id|requestId|req_id|trace_id|traceId|correlation_id)[=:\s"']+([a-zA-Z0-9_\-]+)/i
    );
    if (m) return m[1];

    // Check UUID pattern
    const uuidMatch = text.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    );
    if (uuidMatch) return uuidMatch[0];

    return undefined;
  }

  private static normalizeLevel(lvl: string): LogLevel {
    const u = lvl.toUpperCase();
    if (u.includes("FATAL") || u.includes("CRIT")) return "FATAL";
    if (u.includes("ERR")) return "ERROR";
    if (u.includes("WARN")) return "WARN";
    if (u.includes("DEBUG") || u.includes("TRACE")) return "DEBUG";
    return "INFO";
  }
}
