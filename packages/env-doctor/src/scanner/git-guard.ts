import * as fs from "fs";
import * as path from "path";
import { EnvIssue } from "../types/env";

export class GitGuard {
  public static checkGitSafety(workspaceRoot: string, envFiles: string[]): { safe: boolean; issues: EnvIssue[] } {
    const issues: EnvIssue[] = [];
    const gitignorePath = path.join(workspaceRoot, ".gitignore");
    const gitDir = path.join(workspaceRoot, ".git");

    // If not a git repo, skip
    if (!fs.existsSync(gitDir)) {
      return { safe: true, issues: [] };
    }

    let gitignoreContent = "";
    if (fs.existsSync(gitignorePath)) {
      try {
        gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
      } catch {
        gitignoreContent = "";
      }
    }

    const lines = gitignoreContent.split(/\r?\n/).map((l) => l.trim());
    const ignoresEnv = lines.some((l) =>
      l === ".env" ||
      l === ".env*" ||
      l === "*.env" ||
      l === ".env.local" ||
      l.startsWith(".env")
    );

    for (const envFile of envFiles) {
      const base = path.basename(envFile);
      // .env.example should be committed, but .env, .env.local, etc. should never be
      if (base === ".env.example" || base === ".env.template" || base === ".env.sample") {
        continue;
      }

      if (!ignoresEnv) {
        issues.push({
          id: `git-leak-${base}`,
          type: "git_leak_risk",
          severity: "critical",
          title: `Secret Leak Risk: "${base}" not protected in .gitignore`,
          description: `The file "${base}" is not ignored in .gitignore and may accidentally be committed and pushed to remote repositories.`,
          variableName: base,
          locations: [envFile],
          quickFix: "add_to_gitignore",
        });
      }
    }

    return {
      safe: issues.length === 0,
      issues,
    };
  }

  public static fixGitignore(workspaceRoot: string): boolean {
    const gitignorePath = path.join(workspaceRoot, ".gitignore");
    try {
      const addition = "\n# Env Doctor: Protect secrets from git\n.env\n.env.local\n.env.*.local\n";
      if (fs.existsSync(gitignorePath)) {
        fs.appendFileSync(gitignorePath, addition, "utf8");
      } else {
        fs.writeFileSync(gitignorePath, addition, "utf8");
      }
      return true;
    } catch {
      return false;
    }
  }
}
