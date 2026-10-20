import * as fs from "fs";
import * as path from "path";
import { EnvFile, EnvEntry } from "../types/env";

export class EnvParser {
  public static parseFile(filePath: string): EnvFile | null {
    if (!fs.existsSync(filePath)) return null;

    try {
      const rawContent = fs.readFileSync(filePath, "utf8");
      const lines = rawContent.split(/\r?\n/);
      const entries = new Map<string, EnvEntry[]>();

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith("#")) continue;

        // Match KEY=VALUE or export KEY=VALUE
        const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (match) {
          const key = match[1];
          let val = match[2];

          // Strip inline comments if not quoted
          if (!val.startsWith('"') && !val.startsWith("'")) {
            const commentIdx = val.indexOf("#");
            if (commentIdx > -1) {
              val = val.slice(0, commentIdx).trim();
            }
          } else {
            // Strip surrounding quotes
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.slice(1, -1);
            } else if (val.startsWith("'") && val.endsWith("'")) {
              val = val.slice(1, -1);
            }
          }

          const entry: EnvEntry = {
            key,
            value: val,
            line: i + 1,
          };

          if (!entries.has(key)) {
            entries.set(key, [entry]);
          } else {
            entry.isDuplicate = true;
            entries.get(key)!.push(entry);
          }
        }
      }

      return {
        filePath,
        fileName: path.basename(filePath),
        entries,
        rawContent,
      };
    } catch {
      return null;
    }
  }
}
