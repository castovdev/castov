import { existsSync } from "node:fs";
import { delimiter } from "node:path";
import type { Finding, ParsedConfigFile, AgentRuleFile } from "../types.js";
import { detectSecrets, maskSecret, isSafeOrVariableReference, SENSITIVE_KEY_NAMES } from "../secrets.js";

/**
 * CAS-008: Check .env files for git commit status and .gitignore exclusion
 */
export function checkCas008(
  envFiles: { filePath: string; fileName: string; isGitTracked?: boolean; isGitIgnored?: boolean }[],
  hasGitignore: boolean,
  gitignoreContent: string
): Finding[] {
  const findings: Finding[] = [];

  for (const env of envFiles) {
    // Only check non-example env files
    if (env.fileName === ".env.example" || env.fileName === ".env.template" || env.fileName === ".env.sample") {
      continue;
    }

    // 1. Actively tracked in Git
    if (env.isGitTracked) {
      findings.push({
        ruleId: "CAS-008",
        severity: "critical",
        title: `Plaintext environment file actively tracked in Git: ${env.fileName}`,
        whyItMatters: `Committing "${env.fileName}" exposes production secrets and API credentials to repository history and all collaborators.`,
        suggestedFix: `Run "git rm --cached ${env.fileName}" and add "${env.fileName}" to .gitignore immediately. Rotate all exposed credentials.`,
        file: env.filePath,
        evidenceMasked: `tracked_in_git: ${env.fileName}`,
      });
      continue;
    }

    // 2. Not ignored in .gitignore
    const isIgnored = checkIsEnvIgnored(env.fileName, gitignoreContent);
    if (!hasGitignore || !isIgnored) {
      findings.push({
        ruleId: "CAS-008",
        severity: "high",
        title: `Environment file "${env.fileName}" is not ignored in .gitignore`,
        whyItMatters: `Unignored .env files risk accidental git commits during "git add ." or staging.`,
        suggestedFix: `Add "${env.fileName}" or ".env*" to your root .gitignore file.`,
        file: env.filePath,
        evidenceMasked: `gitignore_missing: ${env.fileName}`,
      });
    }
  }

  return findings;
}

/**
 * Helper to test if .env is matched in .gitignore lines
 */
export function checkIsEnvIgnored(fileName: string, gitignoreText: string): boolean {
  if (!gitignoreText) return false;
  const lines = gitignoreText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

  for (const pattern of lines) {
    if (pattern === ".env" || pattern === ".env*" || pattern === "*.env" || pattern === ".env.*") {
      return true;
    }
    if (pattern === fileName || pattern === `/${fileName}`) {
      return true;
    }
  }
  return false;
}

/**
 * CAS-009: Check for missing .env.example or hardcoded credentials inside .env.example
 */
export function checkCas009(
  targetDir: string,
  envFiles: { filePath: string; fileName: string; rawContent: string }[]
): Finding[] {
  const findings: Finding[] = [];

  const realEnvFiles = envFiles.filter(
    (e) => !e.fileName.endsWith(".example") && !e.fileName.endsWith(".template") && !e.fileName.endsWith(".sample")
  );
  const exampleFile = envFiles.find(
    (e) => e.fileName === ".env.example" || e.fileName === ".env.template" || e.fileName === ".env.sample"
  );

  // 1. Missing .env.example when .env exists
  if (realEnvFiles.length > 0 && !exampleFile) {
    findings.push({
      ruleId: "CAS-009",
      severity: "medium",
      title: "Missing .env.example template file",
      whyItMatters: "Repository contains real .env files but lacks a documented .env.example template for developers and CI pipelines.",
      suggestedFix: "Create a .env.example file listing required variable names with placeholder values (e.g. API_KEY=your_key_here).",
      file: realEnvFiles[0].filePath,
      evidenceMasked: "missing .env.example",
    });
  }

  // 2. Real secrets committed inside .env.example
  if (exampleFile) {
    const lines = exampleFile.rawContent.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#") || !line.includes("=")) continue;

      const [k, ...vParts] = line.split("=");
      const val = vParts.join("=").trim();
      if (!val || isSafeOrVariableReference(val)) continue;

      const secrets = detectSecrets(val);
      if (secrets.length > 0) {
        findings.push({
          ruleId: "CAS-009",
          severity: "high",
          title: `Hardcoded live credential in ${exampleFile.fileName}`,
          whyItMatters: `The example environment template "${exampleFile.fileName}" contains a live ${secrets[0].patternName}. Example files must only contain dummy placeholders.`,
          suggestedFix: `Replace "${k}=${secrets[0].masked}" with a placeholder like "${k}=your_${k.toLowerCase()}_here". Rotate the exposed key.`,
          file: exampleFile.filePath,
          line: i + 1,
          evidenceMasked: `${k}=${secrets[0].masked}`,
        });
      }
    }
  }

  return findings;
}

/**
 * CAS-010: Check AI Agent Rule Files (.cursorrules, CLAUDE.md, etc.)
 */
export function checkCas010(agentRuleFiles: AgentRuleFile[]): Finding[] {
  const findings: Finding[] = [];

  const DANGEROUS_PROMPTS = [
    { pattern: /bypass(?:ing)?\s+(?:all\s+)?(?:security|safety|guardrails)/i, label: "Bypassing safety guardrails directive" },
    { pattern: /ignore\s+(?:all\s+)?previous\s+instructions/i, label: "Prompt injection override (ignore previous instructions)" },
    { pattern: /always\s+(?:run|execute)\s+(?:[a-z0-9_-]+\s+)*(?:commands|scripts|tools|code)\s+without\s+(?:asking|confirmation|prompt)/i, label: "Unrestricted automatic command execution directive" },
    { pattern: /auto[-_]?approve\s+(?:all|everything|\*)/i, label: "Wildcard auto-approve directive in AI instructions" },
    { pattern: /do\s+not\s+ask\s+(?:for\s+)?confirmation\s+before\s+(?:deleting|removing|executing)/i, label: "Suppression of user confirmation prompts" },
  ];

  for (const ruleFile of agentRuleFiles) {
    const lines = ruleFile.rawContent.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 1. Secrets check
      const matched = detectSecrets(line);
      if (matched.length > 0) {
        findings.push({
          ruleId: "CAS-010",
          severity: "high",
          title: `Hardcoded secret in AI rule file (${ruleFile.fileName})`,
          whyItMatters: `AI agents ingest ${ruleFile.fileName} into context on every interaction. Storing ${matched[0].patternName} here leaks keys into LLM context logs.`,
          suggestedFix: "Remove the hardcoded secret from AI prompt guidelines and supply it via environment variables.",
          file: ruleFile.filePath,
          line: i + 1,
          evidenceMasked: matched[0].masked,
        });
      }

      // 2. Dangerous prompt injection / security overrides
      for (const dp of DANGEROUS_PROMPTS) {
        if (dp.pattern.test(line)) {
          findings.push({
            ruleId: "CAS-010",
            severity: "high",
            title: `Dangerous security override in ${ruleFile.fileName}: ${dp.label}`,
            whyItMatters: `Instructions telling the AI model to "${line.trim().slice(0, 60)}" weaken or disable user confirmation checks for destructive tool executions.`,
            suggestedFix: "Enforce human-in-the-loop review for shell execution and filesystem deletions.",
            file: ruleFile.filePath,
            line: i + 1,
            evidenceMasked: line.trim().slice(0, 80),
          });
        }
      }
    }
  }

  return findings;
}

/**
 * CAS-011: Check for duplicate or conflicting MCP server names across configs
 */
export function checkCas011(configFiles: ParsedConfigFile[]): Finding[] {
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
        ruleId: "CAS-011",
        severity: "medium",
        title: `Conflicting duplicate MCP server name: "${sName}"`,
        whyItMatters: `Server "${sName}" is configured in multiple files: ${filesStr}. AI clients may overwrite or nondeterministically pick between them.`,
        suggestedFix: `Give each MCP server a distinct, descriptive name across project and user settings.`,
        file: list[0].file,
        serverName: sName,
        evidenceMasked: `defined in ${list.length} files: ${filesStr}`,
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
      // 1. Check unencrypted websocket (ws://)
      if (server.url && typeof server.url === "string") {
        if (server.url.startsWith("ws://") && !server.url.includes("localhost") && !server.url.includes("127.0.0.1")) {
          findings.push({
            ruleId: "CAS-013",
            severity: "high",
            title: `Insecure WebSocket transport: ${server.url}`,
            whyItMatters: "Unencrypted ws:// transport sends tool payloads and responses in cleartext over the network.",
            suggestedFix: `Upgrade to encrypted WebSocket (wss://).`,
            file: cfg.filePath,
            serverName,
            evidenceMasked: `url=${server.url}`,
          });
        }
      }

      // 2. Explicit transport attribute checks
      const transport = String(server.transport || "").toLowerCase();
      if (transport === "tcp" || transport === "udp") {
        findings.push({
          ruleId: "CAS-013",
          severity: "medium",
          title: `Unsupported or non-standard transport: "${transport}"`,
          whyItMatters: `MCP standard mandates stdio or SSE/HTTP transports. Direct raw ${transport.toUpperCase()} sockets lack TLS and authentication negotiation.`,
          suggestedFix: `Use stdio or SSE transport.`,
          file: cfg.filePath,
          serverName,
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
  const systemPathDirs = (process.env.PATH || "").split(delimiter).filter(Boolean);

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

      // Skip common ubiquitous runners
      if (KNOWN_GLOBAL_BINARIES.has(lower)) continue;

      // Check if it's a relative path on disk
      if (trimmed.startsWith("./") || trimmed.startsWith("../") || trimmed.includes("/") || trimmed.includes("\\")) {
        if (!existsSync(trimmed)) {
          findings.push({
            ruleId: "CAS-014",
            severity: "low",
            title: `Command path does not exist on disk: "${trimmed}"`,
            whyItMatters: `The server specifies a relative or absolute executable path that cannot be found. The AI agent will fail when attempting to start this server.`,
            suggestedFix: `Ensure "${trimmed}" is built and available at the specified path, or update the config.`,
            file: cfg.filePath,
            serverName,
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
 */
export function checkCas015(configFiles: ParsedConfigFile[]): Finding[] {
  const findings: Finding[] = [];

  for (const cfg of configFiles) {
    if (cfg.isEnvFile) continue;

    for (const [serverName, server] of Object.entries(cfg.servers)) {
      if (!server.env || typeof server.env !== "object") continue;

      const keys = Object.keys(server.env);

      // 1. Passing wildcard or whole process env
      const hasWildcard = keys.some((k) => k === "*" || k === "ALL" || server.env![k] === "*");
      if (hasWildcard) {
        findings.push({
          ruleId: "CAS-015",
          severity: "high",
          title: `Wildcard environment variable pass-through in server "${serverName}"`,
          whyItMatters: `Passing wildcard environment variables exposes all parent system tokens, credentials, and user data to the MCP server process.`,
          suggestedFix: `Explicitly declare only the minimal environment variables needed by this tool.`,
          file: cfg.filePath,
          serverName,
          evidenceMasked: `env: wildcard * detected`,
        });
        continue;
      }

      // 2. Count threshold (> 25 variables is excessive for a single tool server)
      if (keys.length > 25) {
        findings.push({
          ruleId: "CAS-015",
          severity: "medium",
          title: `Excessive environment variables configured (${keys.length} variables)`,
          whyItMatters: `Configuring ${keys.length} environment variables for "${serverName}" violates the principle of least privilege and increases secret leakage surface.`,
          suggestedFix: `Audit and trim environment variables to only those strictly required by ${serverName}.`,
          file: cfg.filePath,
          serverName,
          evidenceMasked: `env count: ${keys.length}`,
        });
      }
    }
  }

  return findings;
}
