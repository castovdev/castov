import * as fs from "fs";
import * as path from "path";
import { UnicodeScanner } from "./unicode-patterns";
import { WorkspaceScanSummary, UnicodeThreat } from "../types/bidi";

export class WorkspaceScanner {
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
    ".c",
    ".cpp",
    ".h",
    ".java",
    ".php",
    ".rb",
    ".sh",
    ".bash",
    ".yaml",
    ".yml",
    ".json",
    ".md",
    ".sol",
  ]);

  public static scanWorkspace(rootDir: string): WorkspaceScanSummary {
    const filesToScan: string[] = [];

    const crawl = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            if (!this.IGNORED_DIRS.has(entry.name)) {
              crawl(path.join(dir, entry.name));
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (this.SUPPORTED_EXTS.has(ext)) {
              filesToScan.push(path.join(dir, entry.name));
            }
          }
        }
      } catch {
        // Ignore read errors
      }
    };

    crawl(rootDir);

    const allThreats: UnicodeThreat[] = [];

    for (const filePath of filesToScan) {
      try {
        const content = fs.readFileSync(filePath, "utf8");
        const relPath = path.relative(rootDir, filePath);
        const threats = UnicodeScanner.scanText(content, relPath);
        allThreats.push(...threats);
      } catch {
        // Ignore
      }
    }

    return {
      totalFilesScanned: filesToScan.length,
      threats: allThreats,
      trojanSourceCount: allThreats.filter((t) => t.category === "trojan_source").length,
      invisibleCount: allThreats.filter((t) => t.category === "invisible_char").length,
      homoglyphCount: allThreats.filter((t) => t.category === "homoglyph").length,
      rtlCommentsCount: allThreats.filter((t) => t.category === "rtl_comment").length,
    };
  }
}
