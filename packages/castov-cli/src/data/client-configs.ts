/**
 * Verified Client Configuration Paths for MCP Servers & AI Agents.
 * Every active path has been verified against live official upstream documentation on 2026-10-26,
 * with the verbatim quote from the live page recorded alongside the source URL and fetch date.
 * Paths without a live verbatim upstream quote are marked TODO-VERIFY (isVerified: false) and excluded.
 */

import { homedir } from "node:os";
import { join } from "node:path";

export interface ClientConfigDefinition {
  clientName: string;
  scope: "project" | "user";
  platform: "all" | "win32" | "darwin" | "linux";
  pathPattern: string;
  format: "json" | "jsonc";
  verbatimQuote: string;
  sourceDoc: string;
  verifiedAt: string; // ISO date of live documentation fetch
  isVerified: boolean;
}

/**
 * Verified project-relative MCP configuration paths
 */
export const PROJECT_MCP_CONFIG_PATHS = [
  // 1. Cursor Project MCP config
  // Verbatim Quote: "Project Configuration Create .cursor/mcp.json in your project for project-specific tools."
  // Source: https://cursor.com/docs/mcp
  // Fetched: 2026-10-26
  ".cursor/mcp.json",

  // 2. Claude Code & VS Code Portable Project MCP config
  // Verbatim Quote (Claude Code): "add the entry under mcpServers in .mcp.json at your project root and commit it."
  // Source: https://code.claude.com/docs/en/mcp
  // Verbatim Quote (VS Code): "The portable Copilot format is stored in `.mcp.json` at the root of your workspace"
  // Source: https://code.visualstudio.com/docs/agents/reference/mcp-configuration.md
  // Fetched: 2026-10-26
  ".mcp.json",

  // 3. VS Code Workspace MCP config
  // Verbatim Quote: "The VS Code format is stored in `.vscode/mcp.json` in your workspace or in your user profile. It defines servers in a top-level `servers` object."
  // Source: https://code.visualstudio.com/docs/agents/reference/mcp-configuration.md
  // Fetched: 2026-10-26
  ".vscode/mcp.json",

  // 4. Zed Project Settings (context_servers block)
  // Verbatim Quote: '"**/.zed/settings.json"' and '"context_servers": { "local-mcp-server": { "command": "some-command"'
  // Source: https://zed.dev/docs/configuring-zed and https://zed.dev/docs/ai/mcp
  // Fetched: 2026-10-26
  ".zed/settings.json",

  // TODO-VERIFY: Windsurf project config (https://docs.windsurf.com/windsurf/mcp returned HTTP 404 on 2026-10-26)
  // ".windsurf/mcp.json",
];

/**
 * Resolves user-level (global) configuration files based on current operating system.
 * Only included when the user explicitly passes --include-user-configs.
 */
export function getUserMcpConfigPaths(platform: NodeJS.Platform = process.platform, home = homedir()): ClientConfigDefinition[] {
  const configs: ClientConfigDefinition[] = [];

  // 1. Cursor Global Configuration (~/.cursor/mcp.json across platforms)
  // Verbatim Quote: "Global Configuration Create ~/.cursor/mcp.json in your home directory for tools available across all your workspaces."
  // Source: https://cursor.com/docs/mcp
  // Fetched: 2026-10-26
  configs.push({
    clientName: "Cursor",
    scope: "user",
    platform: "all",
    pathPattern: join(home, ".cursor", "mcp.json"),
    format: "json",
    verbatimQuote: "Global Configuration Create ~/.cursor/mcp.json in your home directory for tools available across all your workspaces.",
    sourceDoc: "https://cursor.com/docs/mcp",
    verifiedAt: "2026-10-26",
    isVerified: true,
  });

  // 2. Claude Code CLI User Configuration (~/.claude.json)
  // Verbatim Quote: "When configuring MCP servers via JSON in .mcp.json, ~/.claude.json, or claude mcp add-json"
  // Source: https://code.claude.com/docs/en/mcp
  // Fetched: 2026-10-26
  configs.push({
    clientName: "Claude Code",
    scope: "user",
    platform: "all",
    pathPattern: join(home, ".claude.json"),
    format: "json",
    verbatimQuote: "When configuring MCP servers via JSON in .mcp.json, ~/.claude.json, or claude mcp add-json",
    sourceDoc: "https://code.claude.com/docs/en/mcp",
    verifiedAt: "2026-10-26",
    isVerified: true,
  });

  // 3. Claude Desktop App (macOS & Windows only; Linux has no official upstream path in modelcontextprotocol.io docs)
  // Verbatim Quote: "The file is located at: macOS : ~/Library/Application Support/Claude/claude_desktop_config.json Windows : %APPDATA%\\Claude\\claude_desktop_config.json"
  // Source: https://modelcontextprotocol.io/docs/2026-07-28/develop/connect-local-servers
  // Fetched: 2026-10-26
  if (platform === "darwin") {
    configs.push({
      clientName: "Claude Desktop",
      scope: "user",
      platform: "darwin",
      pathPattern: join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json"),
      format: "json",
      verbatimQuote: "The file is located at: macOS : ~/Library/Application Support/Claude/claude_desktop_config.json",
      sourceDoc: "https://modelcontextprotocol.io/docs/2026-07-28/develop/connect-local-servers",
      verifiedAt: "2026-10-26",
      isVerified: true,
    });
  } else if (platform === "win32") {
    const appData = process.env.APPDATA || join(home, "AppData", "Roaming");
    configs.push({
      clientName: "Claude Desktop",
      scope: "user",
      platform: "win32",
      pathPattern: join(appData, "Claude", "claude_desktop_config.json"),
      format: "json",
      verbatimQuote: "Windows : %APPDATA%\\Claude\\claude_desktop_config.json",
      sourceDoc: "https://modelcontextprotocol.io/docs/2026-07-28/develop/connect-local-servers",
      verifiedAt: "2026-10-26",
      isVerified: true,
    });
  } else {
    // TODO-VERIFY: Linux path for Claude Desktop is not documented on modelcontextprotocol.io
    configs.push({
      clientName: "Claude Desktop",
      scope: "user",
      platform: "linux",
      pathPattern: join(home, ".config", "Claude", "claude_desktop_config.json"),
      format: "json",
      verbatimQuote: "TODO-VERIFY: Not present in official Claude Desktop documentation",
      sourceDoc: "https://modelcontextprotocol.io/docs/2026-07-28/develop/connect-local-servers",
      verifiedAt: "2026-10-26",
      isVerified: false,
    });
  }

  // 4. Cline CLI (~/.cline/data/settings/cline_mcp_settings.json)
  // Verbatim Quote: "CLI: ~/.cline/data/settings/cline_mcp_settings.json (override with the CLINE_MCP_SETTINGS_PATH env var)"
  // Source: https://docs.cline.bot/mcp/mcp-overview
  // Fetched: 2026-10-26
  configs.push({
    clientName: "Cline",
    scope: "user",
    platform: "all",
    pathPattern: join(home, ".cline", "data", "settings", "cline_mcp_settings.json"),
    format: "json",
    verbatimQuote: "CLI: ~/.cline/data/settings/cline_mcp_settings.json (override with the CLINE_MCP_SETTINGS_PATH env var)",
    sourceDoc: "https://docs.cline.bot/mcp/mcp-overview",
    verifiedAt: "2026-10-26",
    isVerified: true,
  });

  // 5. Cline IDE Extension (macOS, Windows, Linux)
  // Verbatim Quote: "macOS: ~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json Windows: %APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json Linux: ~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json"
  // Source: https://github.com/cline/linear-mcp
  // Fetched: 2026-10-26
  if (platform === "darwin") {
    configs.push({
      clientName: "Cline",
      scope: "user",
      platform: "darwin",
      pathPattern: join(home, "Library", "Application Support", "Code", "User", "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json"),
      format: "json",
      verbatimQuote: "macOS: ~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
      sourceDoc: "https://github.com/cline/linear-mcp",
      verifiedAt: "2026-10-26",
      isVerified: true,
    });
  } else if (platform === "win32") {
    const appData = process.env.APPDATA || join(home, "AppData", "Roaming");
    configs.push({
      clientName: "Cline",
      scope: "user",
      platform: "win32",
      pathPattern: join(appData, "Code", "User", "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json"),
      format: "json",
      verbatimQuote: "Windows: %APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
      sourceDoc: "https://github.com/cline/linear-mcp",
      verifiedAt: "2026-10-26",
      isVerified: true,
    });
  } else if (platform === "linux") {
    configs.push({
      clientName: "Cline",
      scope: "user",
      platform: "linux",
      pathPattern: join(home, ".config", "Code", "User", "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json"),
      format: "json",
      verbatimQuote: "Linux: ~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
      sourceDoc: "https://github.com/cline/linear-mcp",
      verifiedAt: "2026-10-26",
      isVerified: true,
    });
  }

  // 6. Zed Editor User Settings (~/.config/zed/settings.json on macOS/Linux)
  // Verbatim Quote: "// ~/.config/zed/settings.json" and '"context_servers": { "local-mcp-server": { "command": "some-command"'
  // Source: https://zed.dev/docs/configuring-zed and https://zed.dev/docs/ai/mcp
  // Fetched: 2026-10-26
  if (platform === "darwin" || platform === "linux") {
    configs.push({
      clientName: "Zed",
      scope: "user",
      platform: platform === "darwin" ? "darwin" : "linux",
      pathPattern: join(home, ".config", "zed", "settings.json"),
      format: "jsonc",
      verbatimQuote: "// ~/.config/zed/settings.json",
      sourceDoc: "https://zed.dev/docs/configuring-zed",
      verifiedAt: "2026-10-26",
      isVerified: true,
    });
  } else {
    // TODO-VERIFY: Zed Windows settings path not verbatim in configuring-zed snippet
    const appData = process.env.APPDATA || join(home, "AppData", "Roaming");
    configs.push({
      clientName: "Zed",
      scope: "user",
      platform: "win32",
      pathPattern: join(appData, "Zed", "settings.json"),
      format: "jsonc",
      verbatimQuote: "TODO-VERIFY: Windows path requires verification",
      sourceDoc: "https://zed.dev/docs/configuring-zed",
      verifiedAt: "2026-10-26",
      isVerified: false,
    });
  }

  // 7. Windsurf (TODO-VERIFY: upstream docs URL returned HTTP 404 on 2026-10-26)
  configs.push({
    clientName: "Windsurf",
    scope: "user",
    platform: "all",
    pathPattern: join(home, ".codeium", "windsurf", "mcp_config.json"),
    format: "json",
    verbatimQuote: "TODO-VERIFY: Upstream docs URL https://docs.windsurf.com/windsurf/mcp returned 404 on 2026-10-26",
    sourceDoc: "https://docs.windsurf.com/windsurf/mcp",
    verifiedAt: "2026-10-26",
    isVerified: false,
  });

  // Return only strictly verified configs
  return configs.filter((c) => c.isVerified);
}
