import { existsSync } from "node:fs";
import { relative, resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import type { Finding, ParsedConfigFile, AgentRuleFile, BaselineServerEntry, McpServerConfig } from "../types.js";
import type { DiscoveredClaudeSettings } from "../discovery.js";
import { detectSecrets, isSafeOrVariableReference } from "../secrets.js";

// Helper to test if an env file is matched in Cursor's verified .cursorignore file.
// Verbatim Quote: "Control which directories and files Cursor can access using a .cursorignore file in your root directory... Environment files: **/.env , **/.env.*"
// Source: https://cursor.com/docs/context/ignore-files (Fetched: 2026-10-26)
export function checkIsEnvIgnored(fileName: string, ignoreText: string): boolean {
  if (!ignoreText) return false;
  const lines = ignoreText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  for (const pattern of lines) {
    if (
      pattern === ".env" ||
      pattern === ".env*" ||
      pattern === "**/.env*" ||
      pattern === "**/.env" ||
      pattern === "**/.env.*" ||
      pattern === "*.env" ||
      pattern === ".env.*"
    ) {
      return true;
    }
    if (pattern === fileName || pattern === `/${fileName}` || pattern === `**/${fileName}` || pattern === `./${fileName}`) {
      return true;
    }
  }
  return false;
}

/**
 * Check if Claude Code `permissions.deny` rules in `.claude/settings.json` / `.claude/settings.local.json` / `~/.claude/settings.json`
 * block reading the given `.env` file.
 * Verbatim Quote: '"permissions" : { "allow" : [ "Bash(npm run lint)" , "Bash(npm run test *)" ], "deny" : [ "Read(./.env)" , "Read(./.env.*)" ] }'
 * Source: https://code.claude.com/docs/en/settings (Fetched: 2026-10-26)
 */
export function checkIsEnvDeniedInClaudeSettings(
  fileName: string,
  claudeSettings: DiscoveredClaudeSettings[] = []
): boolean {
  for (const s of claudeSettings) {
    for (const rawRule of s.denyRules) {
      const m = /^Read\((.+)\)$/i.exec(rawRule.trim());
      if (!m) continue;
      const pat = m[1].trim().replace(/^\.\//, "");
      if (
        pat === ".env" ||
        pat === ".env*" ||
        pat === "**/.env" ||
        pat === "**/.env*" ||
        pat === fileName ||
        pat === `**/${fileName}`
      ) {
        if (pat === ".env" && fileName !== ".env") continue;
        return true;
      }
      if ((pat === ".env.*" || pat === "**/.env.*") && fileName.startsWith(".env.")) {
        return true;
      }
    }
  }
  return false;
}

export interface Cas008Options {
  hasClaudeIgnore?: boolean;
  claudeIgnorePath?: string;
  claudeSettings?: DiscoveredClaudeSettings[];
}

/**
 * CAS-008: .env AI Agent Context Exposure & Unrespected .claudeignore
 * - Claude Code does NOT respect `.claudeignore` (documented in official issues and absent from https://code.claude.com/docs/en/settings).
 *   Instead, Claude Code requires `permissions.deny` (e.g. `Read(./.env)`, `Read(./.env.*)`) in `.claude/settings.json`.
 *   If `.claudeignore` is present, emits a finding ("ملف تجاهل غير محترم من Claude Code (.claudeignore)").
 * - For Cursor, `.cursorignore` is verified via https://cursor.com/docs/context/ignore-files.
 * - Unverified ignore files (.aiignore, .windsurfignore, .copilotignore) are NOT relied upon.
 * - Remediation explicitly recommends keeping secrets outside the project directory (e.g., OS keychain or external secret manager).
 */
export function checkCas008(
  envFiles: { filePath: string; fileName: string }[],
  hasCursorIgnore: boolean,
  cursorIgnoreContent: string,
  options: Cas008Options = {}
): Finding[] {
  const findings: Finding[] = [];
  const { hasClaudeIgnore = false, claudeIgnorePath, claudeSettings = [] } = options;

  // 1. If .claudeignore is present, warn that Claude Code does not respect it
  if (hasClaudeIgnore && claudeIgnorePath) {
    findings.push({
      ruleId: "CAS-008",
      severity: "medium",
      title: `ملف تجاهل غير محترم من Claude Code (.claudeignore)`,
      whyItMatters: `Claude Code does not honor ".claudeignore" for blocking file reads. Relying on ".claudeignore" leaves ".env" and secret files accessible to the agent.`,
      suggestedFix: `Configure "permissions.deny": ["Read(./.env)", "Read(./.env.*)"] in ".claude/settings.json" (or "~/.claude/settings.json") as documented at https://code.claude.com/docs/en/settings, and store sensitive secrets outside the project directory.`,
      file: claudeIgnorePath,
      keyName: ".claudeignore:unrespected",
      evidenceMasked: `unrespected_ignore_file: .claudeignore`,
    });
  }

  // 2. Check each non-template .env file for verified agent protection
  for (const env of envFiles) {
    if (env.fileName === ".env.example" || env.fileName === ".env.template" || env.fileName === ".env.sample") {
      continue;
    }

    const isProtectedByCursorIgnore = hasCursorIgnore && checkIsEnvIgnored(env.fileName, cursorIgnoreContent);
    const isProtectedByClaudeDeny = checkIsEnvDeniedInClaudeSettings(env.fileName, claudeSettings);

    // Protected only if covered by Cursor's verified .cursorignore OR Claude Code's verified permissions.deny
    // (Unless .claudeignore is present without Claude Code permissions.deny, which is NEVER sufficient protection)
    const isProtected = (isProtectedByCursorIgnore || isProtectedByClaudeDeny) && !(hasClaudeIgnore && !isProtectedByClaudeDeny);

    if (!isProtected) {
      findings.push({
        ruleId: "CAS-008",
        severity: "medium",
        title: `Environment file "${env.fileName}" is not protected from AI agent context ingestion`,
        whyItMatters: `Plaintext "${env.fileName}" exists in the workspace without a verified agent access block (Cursor ".cursorignore" or Claude Code "permissions.deny" in ".claude/settings.json"). Note that ".claudeignore" is not respected by Claude Code.`,
        suggestedFix: `For Claude Code, add "permissions": { "deny": ["Read(./.env)", "Read(./.env.*)"] } in ".claude/settings.json" (https://code.claude.com/docs/en/settings). For Cursor, add "${env.fileName}" to ".cursorignore" (https://cursor.com/docs/context/ignore-files). Best practice: keep real secrets outside the project directory entirely.`,
        file: env.filePath,
        keyName: env.fileName,
        evidenceMasked: `agent_context_unprotected: ${env.fileName}`,
      });
    }
  }

  return findings;
}

/**
 * CAS-009: Literal secret in config/env file OR .env tracked/unignored in git
 * Severity: High
 */
export function checkCas009(
  envFiles: { filePath: string; fileName: string; rawContent?: string; isGitTracked?: boolean }[],
  hasGitignore: boolean,
  gitignoreContent: string
): Finding[] {
  const findings: Finding[] = [];

  for (const env of envFiles) {
    const isExample =
      env.fileName === ".env.example" || env.fileName === ".env.template" || env.fileName === ".env.sample";

    if (!isExample) {
      // 1. Actively tracked in Git
      if (env.isGitTracked) {
        findings.push({
          ruleId: "CAS-009",
          severity: "high",
          title: `Environment file "${env.fileName}" is tracked in Git`,
          whyItMatters: `Tracking "${env.fileName}" in version control exposes secrets to repository history and clones.`,
          suggestedFix: `Run "git rm --cached ${env.fileName}", add "${env.fileName}" to .gitignore, and rotate any exposed secrets.`,
          file: env.filePath,
          keyName: `${env.fileName}:git_tracked`,
          evidenceMasked: `tracked_in_git: ${env.fileName}`,
        });
      } else if (!hasGitignore || !checkIsEnvIgnored(env.fileName, gitignoreContent)) {
        // 2. Not ignored in .gitignore
        findings.push({
          ruleId: "CAS-009",
          severity: "high",
          title: `Environment file "${env.fileName}" is not ignored in .gitignore`,
          whyItMatters: `Unignored "${env.fileName}" risks accidental commits during git staging.`,
          suggestedFix: `Add ".env*" to your root .gitignore file.`,
          file: env.filePath,
          keyName: `${env.fileName}:git_unignored`,
          evidenceMasked: `gitignore_missing: ${env.fileName}`,
        });
      }
    }

    // 3. Check for literal secrets inside .env files
    if (env.rawContent) {
      const lines = env.rawContent.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith("#") || !line.includes("=")) continue;

        const eqIdx = line.indexOf("=");
        const k = line.slice(0, eqIdx).trim();
        const rawVal = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!rawVal || isSafeOrVariableReference(rawVal, k)) continue;

        const secrets = detectSecrets(rawVal, k);
        if (secrets.length > 0) {
          findings.push({
            ruleId: "CAS-009",
            severity: "high",
            title: `Hardcoded secret in ${env.fileName} (${k})`,
            whyItMatters: `File "${env.fileName}" contains a literal credential (${secrets[0].patternName}).`,
            suggestedFix: `Keep literal secrets out of tracked or unignored files, store secrets outside the project directory, and replace with placeholders in templates.`,
            file: env.filePath,
            line: i + 1,
            keyName: k,
            evidenceMasked: `${k}=${secrets[0].masked}`,
          });
        }
      }
    }
  }

  return findings;
}

/**
 * CAS-010: Duplicate or conflicting MCP server definitions across project and user scopes
 * Severity: Low
 */
export function checkCas010(configFiles: ParsedConfigFile[]): Finding[] {
  const findings: Finding[] = [];
  const serverOccurrences = new Map<string, { file: string; scope: string }[]>();

  for (const cfg of configFiles) {
    if (cfg.isEnvFile) continue;
    for (const sName of Object.keys(cfg.servers)) {
      const list = serverOccurrences.get(sName) || [];
      list.push({ file: cfg.filePath, scope: cfg.scope });
      serverOccurrences.set(sName, list);
    }
  }

  for (const [sName, list] of serverOccurrences.entries()) {
    if (list.length > 1) {
      const filesStr = list.map((l) => `${l.file} (${l.scope})`).join(", ");
      findings.push({
        ruleId: "CAS-010",
        severity: "low",
        title: `Conflicting duplicate MCP server name: "${sName}"`,
        whyItMatters: `Server "${sName}" is defined in multiple configuration files (${filesStr}), which can cause ambiguous overrides between project and user scopes.`,
        suggestedFix: `Use unique, descriptive MCP server names across project and user configurations.`,
        file: list[0].file,
        serverName: sName,
        keyName: sName,
        evidenceMasked: `defined in ${list.length} files`,
      });
    }
  }

  return findings;
}

/**
 * Normalize a URL by stripping userinfo and query parameter values (keeping sorted query key names only).
 */
export function normalizeUrlWithoutSecrets(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    const queryKeys = Array.from(new Set(Array.from(parsed.searchParams.keys()))).sort();
    const querySkeleton = queryKeys.length > 0 ? `?${queryKeys.join("&")}` : "";
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}${querySkeleton}`;
  } catch {
    const base = trimmed.split("?")[0];
    const matched = detectSecrets(base);
    if (matched.length > 0) return "<SECRET_URL>";
    return base;
  }
}

/**
 * Normalize an MCP server definition for CAS-011 baseline drift detection (Requirement E):
 * client + scope + serverName + command + args (secrets replaced with "<SECRET>") +
 * sorted env keys without values + URL without query values + transport.
 */
export function computeNormalizedServerEntry(
  cfg: ParsedConfigFile,
  serverName: string,
  server: McpServerConfig,
  targetDir: string
): BaselineServerEntry {
  const client = (cfg.clientName || "generic").toLowerCase();
  const scope = cfg.scope;
  const command = (server.command || "").trim();

  const rawArgs = (server.args || []).map((a) => String(a));
  const normalizedArgs = rawArgs.map((s, idx) => {
    const prevArg = idx > 0 ? rawArgs[idx - 1].trim() : "";
    const prevContext = prevArg.startsWith("-") ? prevArg.replace(/^-+/, "") : undefined;
    if (!isSafeOrVariableReference(s, prevContext) && detectSecrets(s, prevContext).length > 0) {
      return "<SECRET>";
    }
    return s;
  });

  const envKeys = Object.keys(server.env || {}).sort();
  const normalizedUrl = normalizeUrlWithoutSecrets(server.url);
  const transport = String(server.transport || server.type || (server.url ? "http" : "stdio")).toLowerCase();

  const canonicalDefinition = JSON.stringify({
    client,
    scope,
    serverName,
    command,
    args: normalizedArgs,
    envKeys,
    url: normalizedUrl,
    transport,
  });

  const coreExecution = JSON.stringify({
    command,
    args: normalizedArgs,
    url: normalizedUrl,
    transport,
  });

  const definitionHash = createHash("sha256").update(canonicalDefinition).digest("hex");
  const coreExecutionHash = createHash("sha256").update(coreExecution).digest("hex");
  const relFile = relative(targetDir, cfg.filePath).replace(/\\/g, "/");

  return {
    client,
    scope,
    serverName,
    file: relFile || cfg.filePath.replace(/\\/g, "/"),
    definitionHash,
    coreExecutionHash,
  };
}

/**
 * Build map of all normalized servers across discovered config files
 */
export function buildBaselineServersMap(
  configFiles: ParsedConfigFile[],
  targetDir: string
): Record<string, BaselineServerEntry> {
  const map: Record<string, BaselineServerEntry> = {};
  for (const cfg of configFiles) {
    if (cfg.isEnvFile) continue;
    for (const [sName, sConfig] of Object.entries(cfg.servers)) {
      const entry = computeNormalizedServerEntry(cfg, sName, sConfig, targetDir);
      const key = `${entry.client}|${entry.scope}|${sName}`;
      map[key] = entry;
    }
  }
  return map;
}

/**
 * CAS-011: Baseline Drift / Rug Pull Detection (Requirement E)
 * - Modified command, args, or url (or definition) -> High
 * - New server added -> Medium
 * - Server removed -> Info
 */
export function checkCas011(
  currentServers: Record<string, BaselineServerEntry>,
  baselineServers: Record<string, BaselineServerEntry> | undefined,
  targetDir: string
): Finding[] {
  const findings: Finding[] = [];
  if (!baselineServers) return findings;

  for (const [key, curr] of Object.entries(currentServers)) {
    const prev = baselineServers[key];
    const absFile = resolve(targetDir, curr.file);

    if (!prev) {
      findings.push({
        ruleId: "CAS-011",
        severity: "medium",
        title: `New MCP server added since baseline: "${curr.serverName}"`,
        whyItMatters: `Server "${curr.serverName}" was not present in the saved baseline and introduces new tool execution capabilities.`,
        suggestedFix: `Audit the new server configuration and update the baseline if approved.`,
        file: absFile,
        serverName: curr.serverName,
        keyName: `drift.added.${curr.serverName}`,
        evidenceMasked: `new_server=${curr.serverName} (hash=${curr.definitionHash.slice(0, 12)})`,
      });
      continue;
    }

    if (curr.definitionHash !== prev.definitionHash) {
      findings.push({
        ruleId: "CAS-011",
        severity: "high",
        title: `MCP server definition drifted from baseline: "${curr.serverName}"`,
        whyItMatters: `The command, arguments, URL, transport, or environment keys of "${curr.serverName}" changed since the baseline was recorded (potential supply-chain or rug-pull modification).`,
        suggestedFix: `Inspect changes to "${curr.serverName}" against version control and re-verify package/URL integrity.`,
        file: absFile,
        serverName: curr.serverName,
        keyName: `drift.modified.${curr.serverName}`,
        evidenceMasked: `baseline_hash=${prev.definitionHash.slice(0, 12)} != current_hash=${curr.definitionHash.slice(0, 12)}`,
      });
    }
  }

  for (const [key, prev] of Object.entries(baselineServers)) {
    if (!currentServers[key]) {
      const absFile = resolve(targetDir, prev.file);
      findings.push({
        ruleId: "CAS-011",
        severity: "info",
        title: `MCP server removed since baseline: "${prev.serverName}"`,
        whyItMatters: `Server "${prev.serverName}" was recorded in the baseline but is no longer present in the configuration.`,
        suggestedFix: `Update the baseline file if the removal of "${prev.serverName}" was intentional.`,
        file: absFile,
        serverName: prev.serverName,
        keyName: `drift.removed.${prev.serverName}`,
        evidenceMasked: `removed_server=${prev.serverName}`,
      });
    }
  }

  return findings;
}

/**
 * CAS-013: Deprecated or Insecure Transport Protocols
 */
export function checkCas013(configFiles: ParsedConfigFile[]): Finding[] {
  const findings: Finding[] = [];

  for (const cfg of configFiles) {
    if (cfg.isEnvFile) continue;

    for (const [serverName, server] of Object.entries(cfg.servers)) {
      if (server.url && typeof server.url === "string") {
        if (server.url.startsWith("ws://") && !server.url.includes("localhost") && !server.url.includes("127.0.0.1")) {
          const safeUrl = normalizeUrlWithoutSecrets(server.url);
          findings.push({
            ruleId: "CAS-013",
            severity: "high",
            title: `Insecure WebSocket transport: ${safeUrl}`,
            whyItMatters: "Unencrypted ws:// transport sends tool payloads and responses in cleartext over the network.",
            suggestedFix: `Upgrade to encrypted WebSocket (wss://).`,
            file: cfg.filePath,
            serverName,
            keyName: "url.transport",
            evidenceMasked: `url=${safeUrl}`,
          });
        }
      }

      const transport = String(server.transport || "").toLowerCase();
      if (transport === "tcp" || transport === "udp") {
        findings.push({
          ruleId: "CAS-013",
          severity: "medium",
          title: `Unsupported or non-standard transport: "${transport}"`,
          whyItMatters: `MCP standard mandates stdio or SSE/HTTP transports. Direct raw ${transport.toUpperCase()} sockets lack TLS and authentication negotiation.`,
          suggestedFix: `Use stdio or HTTPS/SSE transport.`,
          file: cfg.filePath,
          serverName,
          keyName: "transport",
          evidenceMasked: `transport=${transport}`,
        });
      }
    }
  }

  return findings;
}

/**
 * CAS-014: Stale or Missing Binary in Command
 */
export function checkCas014(configFiles: ParsedConfigFile[]): Finding[] {
  const findings: Finding[] = [];

  const KNOWN_GLOBAL_BINARIES = new Set([
    "node", "npx", "npm", "pnpm", "bun", "bunx", "deno",
    "python", "python3", "py", "pip", "pipx", "uv", "uvx",
    "docker", "docker-compose", "podman",
    "cargo", "rustc", "go", "java", "mvn", "gradle",
    "git", "bash", "sh", "zsh", "cmd", "cmd.exe", "powershell", "pwsh"
  ]);

  for (const cfg of configFiles) {
    if (cfg.isEnvFile) continue;

    for (const [serverName, server] of Object.entries(cfg.servers)) {
      const cmd = server.command;
      if (!cmd || typeof cmd !== "string") continue;

      const trimmed = cmd.trim();
      const lower = trimmed.toLowerCase();

      if (KNOWN_GLOBAL_BINARIES.has(lower)) continue;

      if (trimmed.startsWith("./") || trimmed.startsWith("../") || trimmed.includes("/") || trimmed.includes("\\")) {
        const resolvedCmd = resolve(dirname(cfg.filePath), trimmed);
        if (!existsSync(trimmed) && !existsSync(resolvedCmd)) {
          findings.push({
            ruleId: "CAS-014",
            severity: "low",
            title: `Command path does not exist on disk: "${trimmed}"`,
            whyItMatters: `The server specifies a relative or absolute executable path that cannot be found on disk.`,
            suggestedFix: `Ensure "${trimmed}" is built and available at the specified path.`,
            file: cfg.filePath,
            serverName,
            keyName: "command.exists",
            evidenceMasked: `command=${trimmed}`,
          });
        }
      }
    }
  }

  return findings;
}

/**
 * CAS-015: Excessive Environment Variable Pass-Through
 * Severity: Low, with configurable threshold (default: 25)
 */
export function checkCas015(configFiles: ParsedConfigFile[], maxEnvVars = 25): Finding[] {
  const findings: Finding[] = [];

  for (const cfg of configFiles) {
    if (cfg.isEnvFile) continue;

    for (const [serverName, server] of Object.entries(cfg.servers)) {
      if (!server.env || typeof server.env !== "object") continue;

      const keys = Object.keys(server.env);

      const hasWildcard = keys.some((k) => k === "*" || k === "ALL" || server.env![k] === "*");
      if (hasWildcard) {
        findings.push({
          ruleId: "CAS-015",
          severity: "low",
          title: `Wildcard environment variable pass-through in server "${serverName}"`,
          whyItMatters: `Passing wildcard environment variables exposes parent system tokens and environment state to the MCP server process.`,
          suggestedFix: `Explicitly declare only the minimal environment variables needed by this tool.`,
          file: cfg.filePath,
          serverName,
          keyName: "env.wildcard",
          evidenceMasked: `env: wildcard * detected`,
        });
        continue;
      }

      if (keys.length > maxEnvVars) {
        findings.push({
          ruleId: "CAS-015",
          severity: "low",
          title: `Excessive environment variables configured (${keys.length} > ${maxEnvVars})`,
          whyItMatters: `Configuring ${keys.length} environment variables for "${serverName}" exceeds the threshold (${maxEnvVars}) and increases secret exposure surface.`,
          suggestedFix: `Trim environment variables to only those required by ${serverName}.`,
          file: cfg.filePath,
          serverName,
          keyName: "env.count",
          evidenceMasked: `env count: ${keys.length} (threshold: ${maxEnvVars})`,
        });
      }
    }
  }

  return findings;
}

/**
 * Detect hidden Unicode characters (Requirement H):
 * - Zero-width: U+200B..U+200D, U+2060, U+FEFF
 * - Bidi control: U+202A..U+202E, U+2066..U+2069
 * - Tag characters: U+E0000..U+E007F (surrogate pair \uDB40[\uDC00-\uDC7F])
 */
export function detectHiddenUnicode(text: string): { type: string; codePoint: string } | null {
  for (let i = 0; i < text.length; i++) {
    const cp = text.codePointAt(i)!;
    if (cp > 0xffff) i++; // advance past surrogate pair

    if ((cp >= 0x200b && cp <= 0x200d) || cp === 0x2060 || cp === 0xfeff) {
      return {
        type: "Zero-Width Hidden Character",
        codePoint: `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`,
      };
    }

    if ((cp >= 0x202a && cp <= 0x202e) || (cp >= 0x2066 && cp <= 0x2069)) {
      return {
        type: "Bidirectional (Bidi) Override/Isolate Character",
        codePoint: `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`,
      };
    }

    if (cp >= 0xe0000 && cp <= 0xe007f) {
      return {
        type: "Unicode Tag Smuggling Character",
        codePoint: `U+${cp.toString(16).toUpperCase()}`,
      };
    }
  }
  return null;
}

/**
 * CAS-016: AI Agent Rule Files & Config Descriptions
 * - Hidden Unicode (zero-width, bidi, tag chars): High
 * - Hardcoded secrets in rule files: High
 * - Prompt injection / override phrases: Medium (marked as heuristic)
 */
export function checkCas016(agentRuleFiles: AgentRuleFile[], configFiles: ParsedConfigFile[] = []): Finding[] {
  const findings: Finding[] = [];

  const HEURISTIC_PROMPTS = [
    { pattern: /bypass(?:ing)?\s+(?:all\s+)?(?:security|safety|guardrails)/i, label: "Bypassing safety guardrails directive" },
    { pattern: /ignore\s+(?:all\s+)?previous\s+instructions/i, label: "Prompt injection override (ignore previous instructions)" },
    { pattern: /always\s+(?:run|execute)\s+(?:[a-z0-9_-]+\s+)*(?:commands|scripts|tools|code)\s+without\s+(?:asking|confirmation|prompt)/i, label: "Unrestricted automatic command execution directive" },
    { pattern: /auto[-_]?approve\s+(?:all|everything|\*)/i, label: "Wildcard auto-approve directive in AI instructions" },
    { pattern: /do\s+not\s+ask\s+(?:for\s+)?confirmation\s+before\s+(?:deleting|removing|executing)/i, label: "Suppression of user confirmation prompts" },
  ];

  // 1. Inspect AI Agent Rule Files (.cursorrules, CLAUDE.md, etc.)
  for (const ruleFile of agentRuleFiles) {
    const lines = ruleFile.rawContent.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // A. Hidden Unicode characters -> High
      const hidden = detectHiddenUnicode(line);
      if (hidden) {
        findings.push({
          ruleId: "CAS-016",
          severity: "high",
          title: `Hidden Unicode character (${hidden.type} ${hidden.codePoint}) in ${ruleFile.fileName}`,
          whyItMatters: `File "${ruleFile.fileName}" contains invisible ${hidden.type} (${hidden.codePoint}) on line ${i + 1}, which can smuggle hidden prompt injection instructions past human code review.`,
          suggestedFix: `Strip all non-printable zero-width, bidirectional, and Unicode tag characters from ${ruleFile.fileName}.`,
          file: ruleFile.filePath,
          line: i + 1,
          keyName: `unicode.${hidden.codePoint}`,
          evidenceMasked: `line ${i + 1}: detected ${hidden.codePoint} (${hidden.type})`,
        });
      }

      // B. Hardcoded secrets -> High
      const matched = detectSecrets(line);
      if (matched.length > 0) {
        findings.push({
          ruleId: "CAS-016",
          severity: "high",
          title: `Hardcoded secret in AI rule file (${ruleFile.fileName})`,
          whyItMatters: `AI agents ingest ${ruleFile.fileName} into context on every interaction. Storing ${matched[0].patternName} here leaks credentials into LLM context logs.`,
          suggestedFix: "Remove the hardcoded secret from AI prompt guidelines and supply credentials via environment variables.",
          file: ruleFile.filePath,
          line: i + 1,
          keyName: `secret.line_${i + 1}`,
          evidenceMasked: matched[0].masked,
        });
      }

      // C. Heuristic prompt override phrases -> Medium (explicitly marked as heuristic)
      for (const hp of HEURISTIC_PROMPTS) {
        if (hp.pattern.test(line)) {
          findings.push({
            ruleId: "CAS-016",
            severity: "medium",
            title: `[Heuristic] Suspicious instruction override in ${ruleFile.fileName}: ${hp.label}`,
            whyItMatters: `[Heuristic detection] Line ${i + 1} matches a phrase pattern ("${hp.label}") commonly used to weaken or bypass human-in-the-loop confirmation checks.`,
            suggestedFix: "Review this instruction manually and ensure destructive operations require user confirmation.",
            file: ruleFile.filePath,
            line: i + 1,
            keyName: `heuristic.${hp.label}`,
            evidenceMasked: `heuristic match: ${hp.label}`,
          });
        }
      }
    }
  }

  // 2. Inspect MCP config descriptions / metadata for hidden Unicode characters -> High
  for (const cfg of configFiles) {
    if (cfg.isEnvFile) continue;
    for (const [serverName, server] of Object.entries(cfg.servers)) {
      const fieldsToCheck: Array<[string, unknown]> = [
        ["description", server.description],
        ["command", server.command],
        ...(server.args || []).map((a, idx): [string, unknown] => [`args[${idx}]`, a]),
      ];

      for (const [fieldName, fieldVal] of fieldsToCheck) {
        if (typeof fieldVal !== "string") continue;
        const hidden = detectHiddenUnicode(fieldVal);
        if (hidden) {
          findings.push({
            ruleId: "CAS-016",
            severity: "high",
            title: `Hidden Unicode character (${hidden.type} ${hidden.codePoint}) in server "${serverName}" ${fieldName}`,
            whyItMatters: `Configuration field "${fieldName}" of server "${serverName}" contains invisible ${hidden.type} (${hidden.codePoint}) that can disguise malicious commands or descriptions.`,
            suggestedFix: `Remove invisible Unicode characters (${hidden.codePoint}) from server "${serverName}".`,
            file: cfg.filePath,
            serverName,
            keyName: `${fieldName}.${hidden.codePoint}`,
            evidenceMasked: `${fieldName}: detected ${hidden.codePoint}`,
          });
        }
      }
    }
  }

  return findings;
}
