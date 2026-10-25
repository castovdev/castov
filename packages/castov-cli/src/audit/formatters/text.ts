import type { AuditResult, Finding, Severity } from "../types.js";

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export function formatTextOutput(result: AuditResult, useColor = true): string {
  const lines: string[] = [];

  const red = (s: string) => (useColor ? `\x1b[31m${s}\x1b[0m` : s);
  const yellow = (s: string) => (useColor ? `\x1b[33m${s}\x1b[0m` : s);
  const blue = (s: string) => (useColor ? `\x1b[34m${s}\x1b[0m` : s);
  const gray = (s: string) => (useColor ? `\x1b[90m${s}\x1b[0m` : s);
  const bold = (s: string) => (useColor ? `\x1b[1m${s}\x1b[0m` : s);
  const green = (s: string) => (useColor ? `\x1b[32m${s}\x1b[0m` : s);

  lines.push(bold("🛡️ Castov Local MCP & AI Agent Security Audit"));
  lines.push(gray(`Scanned ${result.filesScanned.length} configuration file(s) across "${result.targetPath}"`));
  lines.push("");

  // Summary counts
  const countParts = [
    result.counts.critical > 0 ? red(`${result.counts.critical} Critical`) : "0 Critical",
    result.counts.high > 0 ? yellow(`${result.counts.high} High`) : "0 High",
    result.counts.medium > 0 ? blue(`${result.counts.medium} Medium`) : "0 Medium",
    result.counts.low > 0 ? gray(`${result.counts.low} Low`) : "0 Low",
    result.counts.info > 0 ? gray(`${result.counts.info} Info`) : "0 Info",
  ];
  lines.push(`Summary: ${countParts.join(" | ")}`);
  lines.push("");

  if (result.findings.length === 0) {
    lines.push(green("✓ Zero security vulnerabilities detected in AI agent and MCP configurations."));
    return lines.join("\n");
  }

  // Findings list
  lines.push(bold("Detected Findings:"));
  for (const f of result.findings) {
    let badge = `[${f.severity.toUpperCase()}]`;
    if (f.severity === "critical") badge = red(bold(badge));
    else if (f.severity === "high") badge = yellow(bold(badge));
    else if (f.severity === "medium") badge = blue(badge);
    else badge = gray(badge);

    lines.push(`  ${badge} ${bold(f.ruleId)}: ${f.title}`);
    lines.push(`     File: ${gray(f.file)}${f.serverName ? ` (Server: ${f.serverName})` : ""}`);
    if (f.evidenceMasked) {
      lines.push(`     Evidence: ${gray(f.evidenceMasked)}`);
    }
    lines.push(`     Fix: ${f.suggestedFix}`);
    lines.push("");
  }

  return lines.join("\n");
}
