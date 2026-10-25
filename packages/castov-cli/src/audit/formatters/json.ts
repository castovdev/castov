import type { AuditResult } from "../types.js";

export function formatJsonOutput(result: AuditResult): string {
  return JSON.stringify(result, null, 2);
}
