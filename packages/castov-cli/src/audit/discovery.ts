import { readdirSync, lstatSync, readFileSync, existsSync } from "node:fs";
import { join, basename, relative } from "node:path";
import { execFileSync } from "node:child_process";
import {
  PROJECT_MCP_CONFIG_PATHS,
  CLAUDE_CODE_PROJECT_SETTINGS_PATHS,
  getClaudeCodeUserSettingsPath,
  VERIFIED_CURSOR_IGNORE_FILE,
  getUserMcpConfigPaths,
} from "../data/client-configs.js";
import { parseJsonc } from "./jsonc.js";
import type { ParsedConfigFile, McpServerConfig, Finding, AgentRuleFile } from "./types.js";

const DEFAULT_IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  ".vercel",
  ".turbo",
  "target",
  "vendor",
]);

export interface DiscoveredEnvFile {
  filePath: string;
  fileName: string;
  rawContent: string;
  isGitTracked?: boolean;
  isGitIgnored?: boolean;
}

export interface DiscoveredClaudeSettings {
  filePath: string;
  scope: "project" | "user";
  denyRules: string[];
}

export interface DiscoveryResult {
  configFiles: ParsedConfigFile[];
  agentRuleFiles: AgentRuleFile[];
  envFiles: DiscoveredEnvFile[];
  hasGitignore: boolean;
  gitignoreContent: string;
  hasCursorIgnore: boolean;
  cursorIgnoreContent: string;
  hasClaudeIgnore: boolean;
  claudeIgnorePath?: string;
  claudeSettings: DiscoveredClaudeSettings[];
  /** @deprecated kept for backwards compatibility in tests; equals hasCursorIgnore */
  hasAgentIgnore: boolean;
  /** @deprecated kept for backwards compatibility in tests; equals cursorIgnoreContent */
  agentIgnoreContent: string;
  scannedFiles: string[];
  parseErrors: Finding[];
}

/**
 * Detect client name from file path
 */
export function detectClientName(filePath: string): string {
  const norm = filePath.replace(/\\/g, "/").toLowerCase();
  if (norm.includes("saoudrizwan.claude-dev") || norm.includes("cline_mcp_settings.json") || norm.includes("/.cline/")) return "Cline";
  if (norm.includes("/.cursor/") || norm.endsWith(".cursor/mcp.json")) return "Cursor";
  if (norm.includes("claude_desktop_config.json") || norm.includes("/claude/claude_desktop")) return "Claude Desktop";
  if (norm.endsWith("/.claude.json") || norm === ".claude.json" || norm.endsWith("/.mcp.json") || norm === ".mcp.json") return "Claude Code";
  if (norm.includes("/.vscode/mcp.json") || norm.endsWith(".vscode/mcp.json")) return "VS Code";
  if (norm.includes("/.zed/") || norm.includes("/zed/settings.json")) return "Zed";
  if (norm.includes(".windsurf") || norm.includes("windsurf/mcp_config.json")) return "Windsurf";
  return basename(filePath);
}

/**
 * Extract MCP servers block from varied root keys (mcpServers, servers, context_servers)
 */
export function extractServersBlock(parsedJson: unknown): Record<string, McpServerConfig> {
  if (!parsedJson || typeof parsedJson !== "object") return {};

  const record = parsedJson as Record<string, unknown>;
  const possibleRoots = ["mcpServers", "servers", "context_servers", "mcp_servers"];

  for (const root of possibleRoots) {
    if (record[root] && typeof record[root] === "object" && !Array.isArray(record[root])) {
      const servers: Record<string, McpServerConfig> = {};
      const entries = Object.entries(record[root] as Record<string, unknown>);
      for (const [sName, sVal] of entries) {
        if (sVal && typeof sVal === "object" && !Array.isArray(sVal)) {
          servers[sName] = {
            name: sName,
            ...(sVal as Record<string, unknown>),
          };
        }
      }
      return servers;
    }
  }

  return {};
}

/**
 * Extract `permissions.deny` string array from a parsed Claude Code settings.json file
 */
export function extractClaudeDenyRules(parsedJson: unknown): string[] {
  if (!parsedJson || typeof parsedJson !== "object" || Array.isArray(parsedJson)) return [];
  const rec = parsedJson as Record<string, unknown>;
  const perms = rec.permissions;
  if (!perms || typeof perms !== "object" || Array.isArray(perms)) return [];
  const deny = (perms as Record<string, unknown>).deny;
  if (!Array.isArray(deny)) return [];
  return deny.filter((r): r is string => typeof r === "string");
}

/**
 * Discovers project-level and optional user-level MCP, environment files, and AI agent rule files.
 */
export function discoverConfigFiles(
  targetDir: string,
  options: {
    maxDepth?: number;
    includeUserConfigs?: boolean;
    platform?: NodeJS.Platform;
    noGit?: boolean;
  } = {}
): DiscoveryResult {
  const maxDepth = options.maxDepth ?? 6;
  const configFiles: ParsedConfigFile[] = [];
  const agentRuleFiles: AgentRuleFile[] = [];
  const envFiles: DiscoveredEnvFile[] = [];
  const scannedFiles: string[] = [];
  const parseErrors: Finding[] = [];
  const visitedPaths = new Set<string>();

  // Check .gitignore in targetDir
  let hasGitignore = false;
  let gitignoreContent = "";
  const gitignorePath = join(targetDir, ".gitignore");
  if (existsSync(gitignorePath)) {
    try {
      gitignoreContent = readFileSync(gitignorePath, "utf8");
      hasGitignore = true;
    } catch {
      // ignore read error
    }
  }

  // 1. Check Verified Cursor Ignore file (.cursorignore)
  // Verbatim Quote: "Control which directories and files Cursor can access using a .cursorignore file in your root directory... Environment files: **/.env , **/.env.*"
  // Source: https://cursor.com/docs/context/ignore-files (Fetched: 2026-10-26)
  let hasCursorIgnore = false;
  let cursorIgnoreContent = "";
  const cursorIgnorePath = join(targetDir, VERIFIED_CURSOR_IGNORE_FILE);
  if (existsSync(cursorIgnorePath)) {
    try {
      cursorIgnoreContent = readFileSync(cursorIgnorePath, "utf8");
      hasCursorIgnore = true;
    } catch {
      // ignore
    }
  }

  // 2. Check .claudeignore presence (NOT respected by Claude Code — triggers warning finding in CAS-008)
  let hasClaudeIgnore = false;
  let claudeIgnorePath: string | undefined;
  const candidateClaudeIgnore = join(targetDir, ".claudeignore");
  if (existsSync(candidateClaudeIgnore)) {
    hasClaudeIgnore = true;
    claudeIgnorePath = candidateClaudeIgnore;
  }

  // 3. Check Verified Claude Code settings.json files for `permissions.deny`
  // Verbatim Quote: "Shared project .claude/settings.json... Project local .claude/settings.local.json... ~/.claude/settings.json"
  // Source: https://code.claude.com/docs/en/settings (Fetched: 2026-10-26)
  const claudeSettings: DiscoveredClaudeSettings[] = [];
  for (const relSettingsPath of CLAUDE_CODE_PROJECT_SETTINGS_PATHS) {
    const fullSettingsPath = join(targetDir, relSettingsPath);
    if (existsSync(fullSettingsPath)) {
      try {
        const raw = readFileSync(fullSettingsPath, "utf8");
        const { data } = parseJsonc(raw);
        if (data) {
          claudeSettings.push({
            filePath: fullSettingsPath,
            scope: "project",
            denyRules: extractClaudeDenyRules(data),
          });
        }
      } catch {
        // ignore
      }
    }
  }
  if (options.includeUserConfigs) {
    const userClaudeSettings = getClaudeCodeUserSettingsPath();
    if (existsSync(userClaudeSettings)) {
      try {
        const raw = readFileSync(userClaudeSettings, "utf8");
        const { data } = parseJsonc(raw);
        if (data) {
          claudeSettings.push({
            filePath: userClaudeSettings,
            scope: "user",
            denyRules: extractClaudeDenyRules(data),
          });
        }
      } catch {
        // ignore
      }
    }
  }

  // Helper to test if a file is tracked in git (completely offline check)
  const isTrackedByGit = (fullPath: string): boolean => {
    if (options.noGit) return false;
    try {
      const rel = relative(targetDir, fullPath).replace(/\\/g, "/");
      const out = execFileSync("git", ["ls-files", rel], {
        cwd: targetDir,
        stdio: ["ignore", "pipe", "ignore"],
        encoding: "utf8",
      });
      return out.trim().length > 0;
    } catch {
      return false;
    }
  };

  // Helper to safely parse and push a config file
  const processCandidate = (fullPath: string, clientName?: string, scope: "project" | "user" = "project") => {
    if (visitedPaths.has(fullPath)) return;
    visitedPaths.add(fullPath);

    if (!existsSync(fullPath)) return;

    try {
      const st = lstatSync(fullPath);
      if (!st.isFile() || st.size > 2_000_000) return; // 2MB limit
    } catch {
      return;
    }

    scannedFiles.push(fullPath);
    const fileName = basename(fullPath);
    const isEnv = fileName.startsWith(".env");

    let rawContent = "";
    try {
      rawContent = readFileSync(fullPath, "utf8");
    } catch {
      parseErrors.push({
        ruleId: "CAS-012",
        severity: "info",
        title: "Unreadable configuration file",
        whyItMatters: "File exists but could not be read due to permission or I/O failure.",
        suggestedFix: "Check read permissions for this configuration file.",
        file: fullPath,
        keyName: "parse_error",
      });
      return;
    }

    const inferredClient = clientName || detectClientName(fullPath);

    if (isEnv) {
      envFiles.push({
        filePath: fullPath,
        fileName,
        rawContent,
        isGitTracked: isTrackedByGit(fullPath),
      });
      configFiles.push({
        filePath: fullPath,
        clientName: inferredClient || "Environment File",
        scope,
        servers: {},
        rawContent,
        isEnvFile: true,
      });
      return;
    }

    // JSON / JSONC Config parsing
    const { data, error } = parseJsonc(rawContent);
    if (error || !data) {
      parseErrors.push({
        ruleId: "CAS-012",
        severity: "info",
        title: "Unparseable or invalid JSON configuration",
        whyItMatters: "Configuration file contains syntax errors or invalid formatting that may prevent the AI agent from loading tools.",
        suggestedFix: "Fix JSON syntax errors, ensure balanced brackets and valid quotes.",
        file: fullPath,
        keyName: "parse_error",
      });
      return;
    }

    const servers = extractServersBlock(data);
    configFiles.push({
      filePath: fullPath,
      clientName: inferredClient,
      scope,
      servers,
      rawContent,
      isEnvFile: false,
    });
  };

  // 1. Direct checks for known project config paths
  for (const relPath of PROJECT_MCP_CONFIG_PATHS) {
    const fullPath = join(targetDir, relPath);
    processCandidate(fullPath, detectClientName(fullPath), "project");
  }

  // 2. Direct checks for known AI agent rule files
  const AGENT_RULE_PATHS = [
    ".cursorrules",
    "CLAUDE.md",
    ".github/copilot-instructions.md",
    ".windsurfrules",
  ];

  for (const relRule of AGENT_RULE_PATHS) {
    const fullRulePath = join(targetDir, relRule);
    if (existsSync(fullRulePath)) {
      try {
        const content = readFileSync(fullRulePath, "utf8");
        agentRuleFiles.push({
          filePath: fullRulePath,
          fileName: basename(fullRulePath),
          rawContent: content,
        });
        scannedFiles.push(fullRulePath);
      } catch {
        // ignore
      }
    }
  }

  // 3. Scan .cursor/rules directory for .mdc files if present
  const cursorRulesDir = join(targetDir, ".cursor", "rules");
  if (existsSync(cursorRulesDir)) {
    try {
      const ruleEntries = readdirSync(cursorRulesDir);
      for (const re of ruleEntries) {
        if (re.endsWith(".mdc") || re.endsWith(".md")) {
          const rulePath = join(cursorRulesDir, re);
          try {
            const content = readFileSync(rulePath, "utf8");
            agentRuleFiles.push({
              filePath: rulePath,
              fileName: re,
              rawContent: content,
            });
            scannedFiles.push(rulePath);
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // 4. Recursive scan for project .env* and nested mcp.json
  const walk = (dir: string, depth = 0) => {
    if (depth > maxDepth) return;
    let entries: string[] = [];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (DEFAULT_IGNORE_DIRS.has(entry)) continue;
      const fullPath = join(dir, entry);
      let st;
      try {
        st = lstatSync(fullPath);
      } catch {
        continue;
      }

      if (st.isSymbolicLink()) continue;

      if (st.isDirectory()) {
        walk(fullPath, depth + 1);
      } else if (st.isFile()) {
        const lower = entry.toLowerCase();
        if (
          lower.startsWith(".env") ||
          lower === "mcp.json" ||
          lower === ".mcp.json" ||
          lower.endsWith(".mcp.json")
        ) {
          processCandidate(fullPath, undefined, "project");
        }
      }
    }
  };

  walk(targetDir, 0);

  // 5. User (Home) level configs if explicitly requested
  if (options.includeUserConfigs) {
    const userConfigs = getUserMcpConfigPaths(options.platform);
    for (const uConfig of userConfigs) {
      processCandidate(uConfig.pathPattern, uConfig.clientName, "user");
    }
  }

  return {
    configFiles,
    agentRuleFiles,
    envFiles,
    hasGitignore,
    gitignoreContent,
    hasCursorIgnore,
    cursorIgnoreContent,
    hasClaudeIgnore,
    claudeIgnorePath,
    claudeSettings,
    hasAgentIgnore: hasCursorIgnore,
    agentIgnoreContent: cursorIgnoreContent,
    scannedFiles,
    parseErrors,
  };
}
