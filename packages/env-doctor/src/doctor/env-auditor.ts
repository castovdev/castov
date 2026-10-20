import * as fs from "fs";
import * as path from "path";
import { EnvParser } from "../scanner/env-parser";
import { CodeScanner } from "../scanner/code-scanner";
import { GitGuard } from "../scanner/git-guard";
import { EnvAuditReport, EnvIssue, EnvFile } from "../types/env";

export class EnvAuditor {
  public static runAudit(workspaceRoot: string): EnvAuditReport {
    // 1. Discover all .env* files in the workspace root
    const envFileNames = [
      ".env",
      ".env.local",
      ".env.development",
      ".env.production",
      ".env.example",
      ".env.template",
      ".env.sample",
    ];

    const envFiles: EnvFile[] = [];
    const envFilePaths: string[] = [];

    for (const name of envFileNames) {
      const fullPath = path.join(workspaceRoot, name);
      if (fs.existsSync(fullPath)) {
        envFilePaths.push(fullPath);
        const parsed = EnvParser.parseFile(fullPath);
        if (parsed) envFiles.push(parsed);
      }
    }

    // Identify primary active env and example env
    const primaryEnv = envFiles.find((f) => f.fileName === ".env" || f.fileName === ".env.local") || null;
    const exampleEnv = envFiles.find((f) => f.fileName === ".env.example" || f.fileName === ".env.template" || f.fileName === ".env.sample") || null;

    // 2. Scan code for references
    const codeRefs = CodeScanner.scanDirectory(workspaceRoot);

    // 3. Check git protection
    const gitSafety = GitGuard.checkGitSafety(workspaceRoot, envFilePaths);

    // 4. Analyze variables and issues
    const issues: EnvIssue[] = [...gitSafety.issues];
    const allKeySet = new Set<string>();

    // Add keys from env files
    for (const file of envFiles) {
      for (const [key, entries] of file.entries) {
        allKeySet.add(key);

        // Check duplicates
        if (entries.length > 1) {
          const lines = entries.map((e) => `line ${e.line}`).join(", ");
          issues.push({
            id: `dup-${file.fileName}-${key}`,
            type: "duplicate_key",
            severity: "high",
            title: `Duplicate Key "${key}" in ${file.fileName}`,
            description: `The variable "${key}" is defined ${entries.length} times (${lines}). Later values override earlier ones.`,
            variableName: key,
            locations: [`${file.fileName}:${entries[0].line}`],
            quickFix: "remove_duplicate",
          });
        }
      }
    }

    // Add keys from code
    for (const key of codeRefs.keys()) {
      allKeySet.add(key);
    }

    const allVariables: EnvAuditReport["allVariables"] = [];

    for (const key of Array.from(allKeySet).sort()) {
      const inPrimaryEnv = primaryEnv ? primaryEnv.entries.has(key) : false;
      const inExample = exampleEnv ? exampleEnv.entries.has(key) : false;
      const refs = codeRefs.get(key) || [];
      const inCode = refs.length > 0;

      allVariables.push({
        key,
        inEnv: inPrimaryEnv,
        inExample,
        inCode,
        codeReferencesCount: refs.length,
      });

      // Issue A: In code, but missing from primary .env
      if (inCode && !inPrimaryEnv && primaryEnv) {
        issues.push({
          id: `missing-env-${key}`,
          type: "missing_in_env",
          severity: "high",
          title: `Missing in .env: "${key}"`,
          description: `Used in code (${refs.length} reference${refs.length > 1 ? "s" : ""}) but not set in ${primaryEnv.fileName}.`,
          variableName: key,
          locations: refs.slice(0, 3).map((r) => `${path.basename(r.filePath)}:${r.line}`),
          quickFix: "add_to_env",
        });
      }

      // Issue B: In primary .env or in code, but missing from .env.example
      if ((inPrimaryEnv || inCode) && !inExample) {
        issues.push({
          id: `missing-example-${key}`,
          type: "missing_in_example",
          severity: "medium",
          title: `Missing in .env.example: "${key}"`,
          description: `Variable is active in ${inPrimaryEnv ? primaryEnv?.fileName : "code"} but missing from .env.example. Teammates and CI/CD won't know to set it.`,
          variableName: key,
          locations: [exampleEnv ? exampleEnv.fileName : ".env.example"],
          quickFix: "add_to_example",
        });
      }

      // Issue C: Defined in .env or .env.example, but never referenced anywhere in code
      if (!inCode && (inPrimaryEnv || inExample)) {
        issues.push({
          id: `dead-code-${key}`,
          type: "dead_in_code",
          severity: "low",
          title: `Dead / Unused Variable: "${key}"`,
          description: `Defined in ${inPrimaryEnv ? primaryEnv?.fileName : ""}${inPrimaryEnv && inExample ? " and " : ""}${inExample ? exampleEnv?.fileName : ""}, but zero references were found across the project code.`,
          variableName: key,
          locations: [inPrimaryEnv ? primaryEnv!.fileName : exampleEnv!.fileName],
        });
      }
    }

    // 5. Calculate Health Score (100 base)
    let penalties = 0;
    for (const issue of issues) {
      if (issue.severity === "critical") penalties += 30;
      else if (issue.severity === "high") penalties += 15;
      else if (issue.severity === "medium") penalties += 5;
      else if (issue.severity === "low") penalties += 2;
    }

    const healthScore = Math.max(0, Math.min(100, 100 - penalties));

    return {
      healthScore,
      issues,
      allVariables,
      envFilesFound: envFiles.map((f) => f.fileName),
      gitSafe: gitSafety.safe,
    };
  }
}
