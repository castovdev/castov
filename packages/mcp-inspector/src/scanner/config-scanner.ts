import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { McpServerConfig } from "../types/mcp";

export class ConfigScanner {
  public static scanAllServers(): McpServerConfig[] {
    const servers: McpServerConfig[] = [];
    const scannedPaths = new Set<string>();

    // 1. Workspace scans (.cursor/mcp.json, .vscode/mcp.json, mcp.json)
    const workspaceFolders = vscode.workspace.workspaceFolders || [];
    for (const folder of workspaceFolders) {
      const root = folder.uri.fsPath;
      const candidates = [
        path.join(root, ".cursor", "mcp.json"),
        path.join(root, ".vscode", "mcp.json"),
        path.join(root, "mcp.json"),
      ];

      for (const p of candidates) {
        if (!scannedPaths.has(p) && fs.existsSync(p)) {
          scannedPaths.add(p);
          servers.push(...this.parseConfigFile(p));
        }
      }
    }

    // 2. Global Claude Desktop config
    const globalClaudePath = this.getGlobalClaudePath();
    if (globalClaudePath && !scannedPaths.has(globalClaudePath) && fs.existsSync(globalClaudePath)) {
      scannedPaths.add(globalClaudePath);
      servers.push(...this.parseConfigFile(globalClaudePath));
    }

    return servers;
  }

  private static parseConfigFile(filePath: string): McpServerConfig[] {
    const list: McpServerConfig[] = [];
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const json = JSON.parse(content);

      const serverMap = json.mcpServers || json.servers || {};
      for (const [name, rawConfig] of Object.entries<any>(serverMap)) {
        if (rawConfig && typeof rawConfig === "object" && rawConfig.command) {
          list.push({
            name,
            command: String(rawConfig.command),
            args: Array.isArray(rawConfig.args) ? rawConfig.args.map(String) : [],
            env: rawConfig.env && typeof rawConfig.env === "object" ? rawConfig.env : undefined,
            configSource: filePath,
          });
        }
      }
    } catch {
      // Ignore parse errors
    }
    return list;
  }

  private static getGlobalClaudePath(): string | null {
    const home = os.homedir();
    if (process.platform === "win32") {
      const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
      return path.join(appData, "Claude", "claude_desktop_config.json");
    } else if (process.platform === "darwin") {
      return path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
    } else {
      return path.join(home, ".config", "Claude", "claude_desktop_config.json");
    }
  }
}
