import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { AuditOptions, AuditResult, Finding, Severity, BaselineData, BaselineServerEntry } from "./types.js";
import { discoverConfigFiles } from "./discovery.js";
import { runRulesCas001To007 } from "./rules/cas001-007.js";
import {
  checkCas008,
  checkCas009,
  checkCas010,
  buildBaselineServersMap,
  checkCas011,
  checkCas013,
  checkCas014,
  checkCas015,
  checkCas016,
} from "./rules/cas008-015.js";
import { formatTextOutput } from "./formatters/text.js";
import { formatJsonOutput } from "./formatters/json.js";
import { formatMarkdownReport } from "./formatters/md.js";
import { formatSarifOutput, toSafeRelativeUri } from "./formatters/sarif.js";

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

/**
 * Compute finding fingerprint strictly from:
 * ruleId + relativePath (with '/' separators) + serverName + keyName
 * Contains NO secret value, NO hash of a secret value, and NO line number (Requirement F).
 */
export function computeFindingFingerprint(targetPath: string, f: Finding): string {
  const rel = toSafeRelativeUri(targetPath, f.file);
  const sName = f.serverName || "";
  const kName = f.keyName || "";
  return `${f.ruleId}|${rel}|${sName}|${kName}`;
}

export function runAudit(options: AuditOptions, toolVersion = "1.5.0"): { result: AuditResult; formatted: string } {
  const targetPath = resolve(options.targetPath || ".");
  const ignoreSet = new Set((options.ignoreRules || []).map((r) => r.toUpperCase()));
  const maxEnvVars =
    options.maxEnvVars ??
    (process.env.CASTOV_AUDIT_MAX_ENV_VARS ? parseInt(process.env.CASTOV_AUDIT_MAX_ENV_VARS, 10) : 25);

  // 1. Discovery
  const discovery = discoverConfigFiles(targetPath, {
    maxDepth: options.maxDepth ?? 6,
    includeUserConfigs: options.includeUserConfigs,
    noGit: options.noGit,
  });

  const rawFindings: Finding[] = [];

  // Add discovery parse errors (CAS-012, Severity: info)
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

  // 3. Run CAS-008 through CAS-016
  // CAS-008: .env AI agent context protection (Cursor .cursorignore / Claude Code permissions.deny) & unrespected .claudeignore
  const cas008Findings = checkCas008(
    discovery.envFiles,
    discovery.hasCursorIgnore,
    discovery.cursorIgnoreContent,
    {
      hasClaudeIgnore: discovery.hasClaudeIgnore,
      claudeIgnorePath: discovery.claudeIgnorePath,
      claudeSettings: discovery.claudeSettings,
    }
  );
  for (const f of cas008Findings) {
    if (!ignoreSet.has("CAS-008")) rawFindings.push(f);
  }

  // CAS-009: Literal secret in config/env OR .env tracked/unignored in git (High)
  const cas009Findings = checkCas009(discovery.envFiles, discovery.hasGitignore, discovery.gitignoreContent);
  for (const f of cas009Findings) {
    if (!ignoreSet.has("CAS-009")) rawFindings.push(f);
  }

  // CAS-010: Duplicate or conflicting MCP server names across project and user scopes (Low)
  const cas010Findings = checkCas010(discovery.configFiles);
  for (const f of cas010Findings) {
    if (!ignoreSet.has("CAS-010")) rawFindings.push(f);
  }

  // CAS-013: Deprecated or insecure transport protocols (High / Medium)
  const cas013Findings = checkCas013(discovery.configFiles);
  for (const f of cas013Findings) {
    if (!ignoreSet.has("CAS-013")) rawFindings.push(f);
  }

  // CAS-014: Missing or unresolvable command binaries (Low)
  const cas014Findings = checkCas014(discovery.configFiles);
  for (const f of cas014Findings) {
    if (!ignoreSet.has("CAS-014")) rawFindings.push(f);
  }

  // CAS-015: Excessive environment variable pass-through (Low, configurable threshold)
  const cas015Findings = checkCas015(discovery.configFiles, maxEnvVars);
  for (const f of cas015Findings) {
    if (!ignoreSet.has("CAS-015")) rawFindings.push(f);
  }

  // CAS-016: AI agent rule files & config descriptions (Hidden Unicode High, Prompt Heuristics Medium)
  const cas016Findings = checkCas016(discovery.agentRuleFiles, discovery.configFiles);
  for (const f of cas016Findings) {
    if (!ignoreSet.has("CAS-016")) rawFindings.push(f);
  }

  // 4. Build current normalized servers map for CAS-011 baseline drift detection
  const currentServersMap = buildBaselineServersMap(discovery.configFiles, targetPath);

  // 5. Load baseline if provided
  let baselineFingerprints = new Set<string>();
  let baselineServersMap: Record<string, BaselineServerEntry> | undefined;

  if (options.baselineFile) {
    const bPath = resolve(options.baselineFile);
    if (existsSync(bPath)) {
      try {
        const bContent = readFileSync(bPath, "utf8");
        const bData = JSON.parse(bContent) as BaselineData;
        if (Array.isArray(bData.fingerprints)) {
          baselineFingerprints = new Set(bData.fingerprints);
        }
        if (bData.servers && typeof bData.servers === "object") {
          baselineServersMap = bData.servers;
        }
      } catch {
        // invalid baseline format ignored
      }
    }
  }

  // 6. Compute deterministic finding fingerprints & suppress known baseline findings
  let totalSuppressed = 0;
  for (const f of rawFindings) {
    f.fingerprint = computeFindingFingerprint(targetPath, f);
    if (baselineFingerprints.has(f.fingerprint)) {
      f.isBaselineSuppressed = true;
      totalSuppressed++;
    }
  }

  // 7. Run CAS-011 (Baseline Drift / Rug Pull) if baseline servers map is loaded
  if (baselineServersMap && !ignoreSet.has("CAS-011")) {
    const cas011Findings = checkCas011(currentServersMap, baselineServersMap, targetPath);
    for (const f of cas011Findings) {
      f.fingerprint = computeFindingFingerprint(targetPath, f);
      rawFindings.push(f);
    }
  }

  // 8. Save baseline if requested (stores finding fingerprints + normalized server hashes)
  if (options.saveBaselineFile) {
    const bPayload: BaselineData = {
      schemaVersion: "1.0.0",
      createdAt: new Date().toISOString(),
      targetPath: ".",
      fingerprints: Array.from(new Set(rawFindings.map((f) => f.fingerprint || ""))).sort(),
      servers: currentServersMap,
    };
    writeFileSync(resolve(options.saveBaselineFile), JSON.stringify(bPayload, null, 2), "utf8");
  }

  // 9. Deterministic Sorting
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

  // 10. Counts
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

  // 11. Exit Code calculation (only non-suppressed findings trigger failure)
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
    scannedAt: "2026-10-26T10:00:00Z",
    targetPath,
    filesScanned: discovery.scannedFiles.sort(),
    findings: rawFindings,
    counts,
    exitCode,
    ...(options.baselineFile
      ? { baselineSummary: { totalSuppressed, newFindings: rawFindings.length - totalSuppressed } }
      : {}),
  };

  // 12. Format output
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

  // 13. Output to file if requested
  if (options.outputFile) {
    writeFileSync(resolve(options.outputFile), formatted, "utf8");
  }

  return { result, formatted };
}
