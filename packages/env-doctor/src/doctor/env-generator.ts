import * as fs from "fs";
import * as path from "path";
import { EnvAuditReport } from "../types/env";

export class EnvGenerator {
  public static generateCleanExample(workspaceRoot: string, report: EnvAuditReport): { success: boolean; filePath: string } {
    const targetPath = path.join(workspaceRoot, ".env.example");

    const lines: string[] = [
      "# =============================================================================",
      "# Environment Variables Template",
      "# Generated automatically by Env Doctor (Castov)",
      "# Copy this file to .env or .env.local and configure your actual values.",
      "# =============================================================================",
      "",
    ];

    // Group variables logically
    const publicVars: string[] = [];
    const dbVars: string[] = [];
    const authVars: string[] = [];
    const otherVars: string[] = [];

    for (const v of report.allVariables) {
      if (v.key.startsWith("NEXT_PUBLIC_") || v.key.startsWith("VITE_") || v.key.startsWith("PUBLIC_")) {
        publicVars.push(v.key);
      } else if (v.key.includes("DATABASE") || v.key.includes("DB_") || v.key.includes("POSTGRES") || v.key.includes("REDIS")) {
        dbVars.push(v.key);
      } else if (v.key.includes("SECRET") || v.key.includes("AUTH") || v.key.includes("KEY") || v.key.includes("TOKEN") || v.key.includes("JWT")) {
        authVars.push(v.key);
      } else {
        otherVars.push(v.key);
      }
    }

    const appendGroup = (title: string, keys: string[]) => {
      if (keys.length === 0) return;
      lines.push(`# --- ${title} ---`);
      for (const k of keys) {
        lines.push(`${k}=${this.getSafePlaceholder(k)}`);
      }
      lines.push("");
    };

    appendGroup("Public / Client-Side Variables", publicVars);
    appendGroup("Database & Storage Connections", dbVars);
    appendGroup("Authentication & API Credentials", authVars);
    appendGroup("Application & Server Configuration", otherVars);

    try {
      fs.writeFileSync(targetPath, lines.join("\n") + "\n", "utf8");
      return { success: true, filePath: targetPath };
    } catch {
      return { success: false, filePath: targetPath };
    }
  }

  public static addMissingVariablesToEnv(workspaceRoot: string, missingKeys: string[]): boolean {
    const envPath = path.join(workspaceRoot, ".env");
    const targetPath = fs.existsSync(envPath) ? envPath : path.join(workspaceRoot, ".env.local");

    const lines: string[] = [
      "",
      "# --- Added by Env Doctor ---",
    ];

    for (const key of missingKeys) {
      lines.push(`${key}=`);
    }

    try {
      if (fs.existsSync(targetPath)) {
        fs.appendFileSync(targetPath, lines.join("\n") + "\n", "utf8");
      } else {
        fs.writeFileSync(targetPath, lines.join("\n") + "\n", "utf8");
      }
      return true;
    } catch {
      return false;
    }
  }

  private static getSafePlaceholder(key: string): string {
    const k = key.toUpperCase();
    if (k.includes("PORT")) return "3000";
    if (k.includes("URL") && k.includes("SITE")) return "http://localhost:3000";
    if (k.includes("URL") && k.includes("API")) return "https://api.example.com";
    if (k.includes("DATABASE_URL") || k.includes("POSTGRES")) return "postgresql://user:password@localhost:5432/mydb";
    if (k.includes("REDIS")) return "redis://localhost:6379";
    if (k.includes("OPENAI")) return "your-openai-api-key-here";
    if (k.includes("ANTHROPIC")) return "your-anthropic-api-key-here";
    if (k.includes("STRIPE")) return "sk_test_your_stripe_key_here";
    if (k.includes("JWT") || k.includes("SECRET")) return "your-cryptographically-secure-secret-here";
    if (k.includes("ENABLE") || k.includes("DEBUG") || k.includes("FLAG")) return "true";
    return "";
  }
}
