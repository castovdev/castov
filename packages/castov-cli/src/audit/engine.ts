import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve, relative } from "node:path";
import { createHash } from "node:crypto";
import type { AuditOptions, AuditResult, Finding, Severity, BaselineData } from "./types.js";
import { discoverConfigFiles } from "./discovery.js";
import { runRulesCas001To007 } from "./rules/cas001-007.js";
import {
  checkCas008,
  checkCas009,
  checkCas010,
  checkCas011,
  checkCas013,
  checkCas014,
  checkCas015,
} from "./rules/cas008-015.js";
import { formatTextOutput } from "./formatters/text.js";
import { formatJsonOutput } from "./formatters/json.js";
import { formatMarkdownReport } from "./formatters/md.js";
import { formatSarifOutput } from "./formatters/sarif.js";

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const FAIL_ON_THRESHOLDS: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: -1,
};

export function runAudit(options: AuditOptions, toolVersion = "1.5.0"): { result: AuditResult; formatted: string } {
  const targetPath = resolve(options.targetPath || ".");
  const ignoreSet = new Set((options.ignoreRules || []).map((r) => r.toUpperCase()));

  // 1. Discovery
  const discovery = discoverConfigFiles(targetPath, {
    maxDepth: options.maxDepth ?? 6,
    includeUserConfigs: options.includeUserConfigs,
    noGit: options.noGit,
  });

  const rawFindings: Finding[] = [];

  // Add discovery parse errors (CAS-012)
  for (const pErr of discovery.parseErrors) {
    if (!ignoreSet.has(pErr.ruleId.toUpperCase())) {
      rawFindings.push(pErr);
    }
  }

  // 2. Run CAS-001 through CAS-007 on each MCP config file
  for (const cfg of discovery.configFiles) {
    if (cfg.isEnvFile) continue;
    const fileFindings = runRulesCas001To007(cfg);
    for (const f of fileFindings) {
      if (!ignoreSet.has(f.ruleId.toUpperCase())) {
        rawFindings.push(f);
      }
    }
  }

  // 3. Run Phase 2 Rules (CAS-008 through CAS-015)
  // CAS-008: .env git tracking & .gitignore
  const cas008Findings = checkCas008(discovery.envFiles, discovery.hasGitignore, discovery.gitignoreContent);
  for (const f of cas008Findings) {
    if (!ignoreSet.has("CAS-008")) rawFindings.push(f);
  }

  // CAS-009: Missing .env.example or secrets in example
  const cas009Findings = checkCas009(targetPath, discovery.envFiles);
  for (const f of cas009Findings) {
    if (!ignoreSet.has("CAS-009")) rawFindings.push(f);
  }

  // CAS-010: AI agent rule files (.cursorrules, CLAUDE.md, etc.)
  const cas010Findings = checkCas010(discovery.agentRuleFiles);
  for (const f of cas010Findings) {
    if (!ignoreSet.has("CAS-010")) rawFindings.push(f);
  }

  // CAS-011: Conflicting duplicate MCP server names
  const cas011Findings = checkCas011(discovery.configFiles);
  for (const f of cas011Findings) {
    if (!ignoreSet.has("CAS-011")) rawFindings.push(f);
  }

  // CAS-013: Deprecated or insecure transport protocols
  const cas013Findings = checkCas013(discovery.configFiles);
  for (const f of cas013Findings) {
    if (!ignoreSet.has("CAS-013")) rawFindings.push(f);
  }

  // CAS-014: Missing or unresolvable command binaries
  const cas014Findings = checkCas014(discovery.configFiles);
  for (const f of cas014Findings) {
    if (!ignoreSet.has("CAS-014")) rawFindings.push(f);
  }

  // CAS-015: Excessive environment variable pass-through
  const cas015Findings = checkCas015(discovery.configFiles);
  for (const f of cas015Findings) {
    if (!ignoreSet.has("CAS-015")) rawFindings.push(f);
  }

  // 4. Compute deterministic fingerprints
  for (const f of rawFindings) {
    const rel = relative(targetPath, f.file).replace(/\\/g, "/");
    const sName = f.serverName || "";
    const line = f.line || 1;
    f.fingerprint = createHash("sha256")
      .update(`${f.ruleId}:${rel}:${sName}:${f.title}:${line}`)
      .digest("hex")
      .slice(0, 16);
  }

  // 5. Baseline handling
  let baselineFingerprints = new Set<string>();
  if (options.baselineFile) {
    const bPath = resolve(options.baselineFile);
    if (existsSync(bPath)) {
      try {
        const bContent = readFileSync(bPath, "utf8");
        const bData = JSON.parse(bContent) as BaselineData;
        if (Array.isArray(bData.fingerprints)) {
          baselineFingerprints = new Set(bData.fingerprints);
        }
      } catch {
        // invalid baseline format ignored
      }
    }
  }

  let totalSuppressed = 0;
  for (const f of rawFindings) {
    if (f.fingerprint && baselineFingerprints.has(f.fingerprint)) {
      f.isBaselineSuppressed = true;
      totalSuppressed++;
    }
  }

  // 6. Save baseline if requested
  if (options.saveBaselineFile) {
    const bPayload: BaselineData = {
      schemaVersion: "1.0.0",
      createdAt: new Date().toISOString(),
      targetPath,
      fingerprints: rawFindings.map((f) => f.fingerprint || ""),
    };
    writeFileSync(resolve(options.saveBaselineFile), JSON.stringify(bPayload, null, 2), "utf8");
  }

  // 7. Deterministic Sorting
  // Primary: Severity (critical -> info)
  // Secondary: File path (alphabetical)
  // Tertiary: Rule ID
  // Quaternary: Title
  rawFindings.sort((a, b) => {
    const sevDiff = SEVERITY_WEIGHT[a.severity] - SEVERITY_WEIGHT[b.severity];
    if (sevDiff !== 0) return sevDiff;
    const fileDiff = a.file.localeCompare(b.file);
    if (fileDiff !== 0) return fileDiff;
    const ruleDiff = a.ruleId.localeCompare(b.ruleId);
    if (ruleDiff !== 0) return ruleDiff;
    return a.title.localeCompare(b.title);
  });

  // 8. Counts
  const counts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  for (const f of rawFindings) {
    counts[f.severity]++;
  }

  // 9. Exit Code calculation (only non-suppressed findings trigger failure)
  const failThresholdName = options.failOn || "high";
  const failThreshold = FAIL_ON_THRESHOLDS[failThresholdName] ?? 1;

  let hasFailingFindings = false;
  if (failThreshold !== -1) {
    for (const f of rawFindings) {
      if (!f.isBaselineSuppressed && SEVERITY_WEIGHT[f.severity] <= failThreshold) {
        hasFailingFindings = true;
        break;
      }
    }
  }

  const exitCode = hasFailingFindings ? 1 : 0;

  const result: AuditResult = {
    schemaVersion: "1.0.0",
    toolVersion,
    scannedAt: "2026-10-25T21:30:00Z",
    targetPath,
    filesScanned: discovery.scannedFiles.sort(),
    findings: rawFindings,
    counts,
    exitCode,
    ...(options.baselineFile ? { baselineSummary: { totalSuppressed, newFindings: rawFindings.length - totalSuppressed } } : {}),
  };

  // 10. Format output
  const format = options.format || "text";
  let formatted = "";

  if (format === "json") {
    formatted = formatJsonOutput(result);
  } else if (format === "sarif") {
    formatted = formatSarifOutput(result);
  } else if (format === "md") {
    formatted = formatMarkdownReport(result, options.clientName);
  } else {
    formatted = formatTextOutput(result, !process.env.NO_COLOR && !options.quiet);
  }

  // 11. Output to file if requested
  if (options.outputFile) {
    writeFileSync(resolve(options.outputFile), formatted, "utf8");
  }

  return { result, formatted };
}
