import { relative } from "node:path";
import type { AuditResult, Finding, Severity, RuleDefinition } from "../types.js";
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

export function formatSarifOutput(result: AuditResult): string {
  const targetDir = result.targetPath;

  // Build unique rules used in results or standard dictionary
  const usedRuleIds = new Set(result.findings.map((f) => f.ruleId));
  const rulesList: Array<Record<string, unknown>> = [];

  for (const [rId, rDef] of Object.entries(ALL_RULES_METADATA)) {
    if (usedRuleIds.has(rId) || rulesList.length < 15) {
      rulesList.push({
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
          precision: "very-high",
          "security-severity": String(rDef.securitySeverity ?? 6.0),
          tags: ["security", "ai-agents", "mcp", "credentials"],
        },
      });
    }
  }

  // Build SARIF results
  const sarifResults = result.findings.map((f) => {
    const relFile = relative(targetDir, f.file).replace(/\\/g, "/");
    const uri = relFile.startsWith(".") ? relFile : relFile;

    return {
      ruleId: f.ruleId,
      level: severityToSarifLevel(f.severity),
      message: {
        text: `${f.title}. ${f.whyItMatters}`,
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: {
              uri: uri || f.file,
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
        primaryLocationHash: f.fingerprint || `${f.ruleId}:${uri}:${f.title}`,
      },
      properties: {
        severity: f.severity,
        evidenceMasked: f.evidenceMasked,
        suggestedFix: f.suggestedFix,
        serverName: f.serverName,
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
