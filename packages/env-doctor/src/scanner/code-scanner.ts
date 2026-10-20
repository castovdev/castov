import * as fs from "fs";
import * as path from "path";
import { CodeReference } from "../types/env";

export class CodeScanner {
  private static readonly IGNORED_DIRS = new Set([
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "out",
    "coverage",
    ".turbo",
    "venv",
    ".venv",
    "__pycache__",
    ".vscode",
  ]);

  private static readonly SUPPORTED_EXTS = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".py",
    ".go",
    ".rs",
    ".php",
    ".rb",
    ".vue",
    ".svelte",
  ]);

  public static scanDirectory(rootDir: string): Map<string, CodeReference[]> {
    const references = new Map<string, CodeReference[]>();
    const filesToScan: string[] = [];

    const crawl = (currentDir: string) => {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            if (!this.IGNORED_DIRS.has(entry.name)) {
              crawl(path.join(currentDir, entry.name));
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (this.SUPPORTED_EXTS.has(ext)) {
              filesToScan.push(path.join(currentDir, entry.name));
            }
          }
        }
      } catch {
        // Ignore read errors
      }
    };

    crawl(rootDir);

    // Scan each file for env patterns
    const patterns = [
      /\bprocess\.env\.([A-Za-z_][A-Za-z0-9_]*)\b/g,
      /\bprocess\.env\[['"]([A-Za-z_][A-Za-z0-9_]*)['"]\]/g,
      /\bimport\.meta\.env\.([A-Za-z_][A-Za-z0-9_]*)\b/g,
      /\bos\.getenv\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]\)/g,
      /\bos\.environ(?:\[|\.get\()['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g,
      /\bgetenv\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]\)/g,
      /\benv::var\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]\)/g,
    ];

    for (const filePath of filesToScan) {
      try {
        const content = fs.readFileSync(filePath, "utf8");
        const lines = content.split(/\r?\n/);

        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
          const line = lines[lineNum];
          // Skip lines that look like comments
          const trimmed = line.trim();
          if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("/*")) continue;

          for (const pattern of patterns) {
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(line)) !== null) {
              const key = match[1];
              // Ignore standard internal node flags
              if (key === "NODE_ENV" || key === "PORT") continue;

              const ref: CodeReference = {
                key,
                filePath,
                line: lineNum + 1,
                snippet: trimmed.slice(0, 100),
              };

              if (!references.has(key)) {
                references.set(key, [ref]);
              } else {
                references.get(key)!.push(ref);
              }
            }
          }
        }
      } catch {
        // Ignore file read error
      }
    }

    return references;
  }
}
