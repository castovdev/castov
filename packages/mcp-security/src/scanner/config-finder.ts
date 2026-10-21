import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as vscode from "vscode";
import {
  AuditSummary,
  ServerAuditReport,
  SecurityFinding,
} from "../types/security";
import { SecretScanner } from "./secret-scanner";
import { ToolRiskScanner } from "./tool-risk-scanner";

export class MCPConfigFinder {
  public static async runAudit(): Promise<AuditSummary> {
    const configPaths = this.findCandidateConfigs();
    const serverReports: ServerAuditReport[] = [];
    const allFindings: SecurityFinding[] = [];
    const scannedConfigs: string[] = [];

    for (const cfgPath of configPaths) {
      if (!fs.existsSync(cfgPath)) continue;

      try {
        const raw = fs.readFileSync(cfgPath, "utf8");
        const parsed = JSON.parse(raw);
        scannedConfigs.push(cfgPath);

        const mcpServers = parsed.mcpServers || parsed.servers || {};
        for (const [serverName, serverCfg] of Object.entries(mcpServers)) {
          const cfg = (serverCfg || {}) as any;
          const command = cfg.command || "";
          const args = Array.isArray(cfg.args) ? cfg.args : [];
          const envObj = cfg.env || {};
          const envKeys = Object.keys(envObj);

          // 1. Scan secrets
          const secretFindings = SecretScanner.scan(
            serverName,
            cfgPath,
            envObj,
            args
          );

          // 2. Scan dangerous tools / command risks / injection
          const toolFindings = ToolRiskScanner.scan(
            serverName,
            cfgPath,
            command,
            args
          );

          const findings = [...secretFindings, ...toolFindings];

          // Calculate score
          const { score, grade, riskLevel } = this.calculateServerScore(findings);

          const report: ServerAuditReport = {
            name: serverName,
            configFile: cfgPath,
            command,
            args,
            envKeys,
            score,
            grade,
            riskLevel,
            findings,
          };

          serverReports.push(report);
          allFindings.push(...findings);
        }
      } catch {
        // Skip unparseable files
      }
    }

    // Calculate overall stats
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    for (const f of allFindings) {
      if (f.severity === "CRITICAL") criticalCount++;
      else if (f.severity === "HIGH") highCount++;
      else if (f.severity === "MEDIUM") mediumCount++;
      else lowCount++;
    }

    let overallScore = 100;
    if (serverReports.length > 0) {
      const sumScores = serverReports.reduce((acc, s) => acc + s.score, 0);
      overallScore = Math.round(sumScores / serverReports.length);
    }

    const overallGrade = this.scoreToGrade(overallScore);

    return {
      timestamp: new Date().toLocaleTimeString(),
      totalServers: serverReports.length,
      totalFindings: allFindings.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      overallScore,
      overallGrade,
      scannedConfigs,
      serverReports,
      allFindings,
    };
  }

  private static findCandidateConfigs(): string[] {
    const list: string[] = [];

    // Workspace configurations
    const folders = vscode.workspace.workspaceFolders;
    if (folders) {
      for (const f of folders) {
        const root = f.uri.fsPath;
        list.push(path.join(root, ".cursor", "mcp.json"));
        list.push(path.join(root, ".vscode", "mcp.json"));
        list.push(path.join(root, "mcp.json"));
      }
    }

    // Claude Desktop configuration
    const platform = os.platform();
    if (platform === "win32") {
      const appdata = process.env.APPDATA;
      if (appdata) {
        list.push(path.join(appdata, "Claude", "claude_desktop_config.json"));
      }
    } else if (platform === "darwin") {
      list.push(
        path.join(
          os.homedir(),
          "Library",
          "Application Support",
          "Claude",
          "claude_desktop_config.json"
        )
      );
    } else {
      list.push(
        path.join(os.homedir(), ".config", "Claude", "claude_desktop_config.json")
      );
    }

    return list;
  }

  private static calculateServerScore(findings: SecurityFinding[]): {
    score: number;
    grade: "A+" | "A" | "B" | "C" | "D" | "F";
    riskLevel: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  } {
    let penalty = 0;
    let hasCritical = false;
    let hasHigh = false;

    for (const f of findings) {
      if (f.severity === "CRITICAL") {
        penalty += 40;
        hasCritical = true;
      } else if (f.severity === "HIGH") {
        penalty += 25;
        hasHigh = true;
      } else if (f.severity === "MEDIUM") {
        penalty += 10;
      } else {
        penalty += 5;
      }
    }

    const score = Math.max(0, 100 - penalty);
    const grade = this.scoreToGrade(score);

    let riskLevel: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "SAFE";
    if (hasCritical) riskLevel = "CRITICAL";
    else if (hasHigh) riskLevel = "HIGH";
    else if (penalty > 15) riskLevel = "MEDIUM";
    else if (penalty > 0) riskLevel = "LOW";

    return { score, grade, riskLevel };
  }

  private static scoreToGrade(score: number): "A+" | "A" | "B" | "C" | "D" | "F" {
    if (score >= 95) return "A+";
    if (score >= 85) return "A";
    if (score >= 70) return "B";
    if (score >= 50) return "C";
    if (score >= 30) return "D";
    return "F";
  }
}
