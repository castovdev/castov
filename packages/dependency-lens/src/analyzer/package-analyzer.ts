import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import {
  DependencyRisk,
  SupplyChainAuditSummary,
  RiskLevel,
  LicenseType,
} from "../types/dependency";
import { TyposquatDetector } from "./typosquat-detector";

const PERMISSIVE_LICENSES = new Set([
  "mit", "apache-2.0", "bsd-2-clause", "bsd-3-clause", "isc", "unlicense", "0bsd"
]);

const COPYLEFT_LICENSES = new Set([
  "gpl-2.0", "gpl-3.0", "agpl-3.0", "lgpl-2.1", "lgpl-3.0", "mpl-2.0"
]);

export class PackageAnalyzer {
  public static async auditWorkspace(): Promise<SupplyChainAuditSummary> {
    const pkgFiles = await vscode.workspace.findFiles(
      "**/package.json",
      "**/node_modules/**"
    );

    const allDeps: DependencyRisk[] = [];

    for (const fileUri of pkgFiles) {
      const deps = this.auditPackageJson(fileUri.fsPath);
      allDeps.push(...deps);
    }

    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let safeCount = 0;
    let copyleftCount = 0;

    for (const d of allDeps) {
      if (d.riskLevel === "CRITICAL") criticalCount++;
      else if (d.riskLevel === "HIGH") highCount++;
      else if (d.riskLevel === "MEDIUM") mediumCount++;
      else safeCount++;

      if (d.licenseType === "COPYLEFT") copyleftCount++;
    }

    return {
      timestamp: new Date().toLocaleTimeString(),
      totalDependencies: allDeps.length,
      criticalCount,
      highCount,
      mediumCount,
      safeCount,
      copyleftCount,
      dependencies: allDeps,
    };
  }

  public static auditPackageJson(filePath: string): DependencyRisk[] {
    if (!fs.existsSync(filePath)) return [];

    try {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");
      const parsed = JSON.parse(content);
      const projectDir = path.dirname(filePath);

      const list: DependencyRisk[] = [];

      const analyzeMap = (map: Record<string, string>, isDev: boolean) => {
        if (!map || typeof map !== "object") return;

        for (const [name, version] of Object.entries(map)) {
          // Find line number in file
          let lineNum = 0;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(`"${name}"`)) {
              lineNum = i;
              break;
            }
          }

          const warnings: string[] = [];
          let riskLevel: RiskLevel = "SAFE";

          // 1. Typosquat check
          const squatCheck = TyposquatDetector.check(name);
          let isTyposquat = false;
          let squattedTarget: string | undefined;

          if (squatCheck.isSquat) {
            isTyposquat = true;
            squattedTarget = squatCheck.target;
            riskLevel = "CRITICAL";
            warnings.push(
              `Suspected Typosquatting! Name is suspiciously similar to popular package "${squattedTarget}". Verify authenticity!`
            );
          }

          // 2. Check local node_modules for installed metadata
          const installedPkgJson = path.join(
            projectDir,
            "node_modules",
            name,
            "package.json"
          );

          let license = "MIT";
          let licenseType: LicenseType = "PERMISSIVE";
          const suspiciousScripts: string[] = [];

          if (fs.existsSync(installedPkgJson)) {
            try {
              const installed = JSON.parse(
                fs.readFileSync(installedPkgJson, "utf8")
              );
              license =
                (typeof installed.license === "string"
                  ? installed.license
                  : installed.license?.type) || "MIT";

              // Check lifecycle scripts
              const scripts = installed.scripts || {};
              if (scripts.postinstall) {
                suspiciousScripts.push(`postinstall: "${scripts.postinstall}"`);
                if (riskLevel !== "CRITICAL") riskLevel = "HIGH";
                warnings.push(
                  `Package executes automatic postinstall script: "${scripts.postinstall}"`
                );
              }
              if (scripts.preinstall) {
                suspiciousScripts.push(`preinstall: "${scripts.preinstall}"`);
                if (riskLevel !== "CRITICAL") riskLevel = "HIGH";
                warnings.push(
                  `Package executes preinstall script: "${scripts.preinstall}"`
                );
              }
            } catch {
              // fallback to defaults
            }
          }

          // 3. License evaluation
          const cleanLic = license.toLowerCase().trim();
          if (COPYLEFT_LICENSES.has(cleanLic)) {
            licenseType = "COPYLEFT";
            if (riskLevel === "SAFE") riskLevel = "MEDIUM";
            warnings.push(
              `Copyleft License (${license}): May impose open-source reciprocal obligations on proprietary codebases.`
            );
          } else if (PERMISSIVE_LICENSES.has(cleanLic)) {
            licenseType = "PERMISSIVE";
          } else {
            licenseType = "UNKNOWN";
            if (riskLevel === "SAFE") riskLevel = "LOW";
          }

          // 4. Wildcard or unpinned version
          if (version === "*" || version === "latest") {
            if (riskLevel === "SAFE") riskLevel = "MEDIUM";
            warnings.push(
              `Unpinned version "${version}". Vulnerable to automated supply-chain hijacking on next install.`
            );
          }

          list.push({
            name,
            version,
            isDev,
            file: filePath,
            line: lineNum,
            riskLevel,
            license,
            licenseType,
            isTyposquat,
            squattedTarget,
            suspiciousScripts,
            warnings,
          });
        }
      };

      analyzeMap(parsed.dependencies, false);
      analyzeMap(parsed.devDependencies, true);

      return list;
    } catch {
      return [];
    }
  }
}
