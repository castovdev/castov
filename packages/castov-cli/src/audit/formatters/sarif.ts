import { relative, basename } from "node:path";
import type { AuditResult, Severity } from "../types.js";
import { ALL_RULES_METADATA } from "../types.js";

function severityToSarifLevel(sev: Severity): "error" | "warning" | "note" {
  switch (sev) {
    case "critical":
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
    case "info":
    default:
      return "note";
  }
}

/**
 * Converts a file path into a relative, forward-slash, URI-encoded path suitable for SARIF
 * and GitHub Code Scanning (never contains file:///, drive letters, leading '/', or '..').
 */
export function toSafeRelativeUri(targetDir: string, filePath: string): string {
  let rel = relative(targetDir, filePath).replace(/\\/g, "/");
  rel = rel.replace(/^(?:\.\/)+/, "");

  if (
    !rel ||
    rel.startsWith("..") ||
    rel.startsWith("/") ||
    /^[a-zA-Z]:/.test(rel) ||
    rel.toLowerCase().startsWith("file:")
  ) {
    const cleanSegments = filePath
      .replace(/^file:\/*/i, "")
      .replace(/^[a-zA-Z]:[\\/]?/, "")
      .replace(/\\/g, "/")
      .split("/")
      .filter((s) => s && s !== "." && s !== "..")
      .slice(-3);
    rel = `external-configs/${cleanSegments.join("/") || basename(filePath) || "config.json"}`;
  }

  return rel
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

export function formatSarifOutput(result: AuditResult): string {
  const targetDir = result.targetPath;

  const ruleEntries = Object.entries(ALL_RULES_METADATA);
  const ruleIndexMap = new Map<string, number>();

  const rulesList = ruleEntries.map(([rId, rDef], idx) => {
    ruleIndexMap.set(rId, idx);
    return {
      id: rDef.id,
      name: rDef.title.replace(/[^a-zA-Z0-9]/g, ""),
      shortDescription: {
        text: rDef.title,
      },
      fullDescription: {
        text: rDef.whyItMatters,
      },
      help: {
        text: rDef.suggestedFix,
        markdown: `### Remediation\n\n${rDef.suggestedFix}\n\n**Impact**: ${rDef.whyItMatters}`,
      },
      defaultConfiguration: {
        level: severityToSarifLevel(rDef.severity),
      },
      properties: {
        precision: "high",
        "security-severity": Number(rDef.securitySeverity ?? 5.0).toFixed(1),
        tags: ["security", "ai-agents", "mcp", "credentials"],
      },
    };
  });

  const sarifResults = result.findings.map((f) => {
    const uri = toSafeRelativeUri(targetDir, f.file);
    const ruleIndex = ruleIndexMap.get(f.ruleId) ?? 0;

    return {
      ruleId: f.ruleId,
      ruleIndex,
      level: severityToSarifLevel(f.severity),
      message: {
        text: `${f.title}. ${f.whyItMatters}`,
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: {
              uri,
              uriBaseId: "%SRCROOT%",
            },
            region: {
              startLine: f.line && f.line > 0 ? f.line : 1,
              startColumn: f.column && f.column > 0 ? f.column : 1,
            },
          },
        },
      ],
      partialFingerprints: {
        primaryLocationLineHash: f.fingerprint || `${f.ruleId}|${uri}|${f.serverName || ""}|${f.keyName || ""}`,
      },
      properties: {
        severity: f.severity,
        evidenceMasked: f.evidenceMasked,
        suggestedFix: f.suggestedFix,
        ...(f.serverName ? { serverName: f.serverName } : {}),
      },
    };
  });

  const sarifLog = {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "Castov",
            version: result.toolVersion,
            informationUri: "https://www.castov.com",
            rules: rulesList,
          },
        },
        results: sarifResults,
      },
    ],
  };

  return JSON.stringify(sarifLog, null, 2);
}
