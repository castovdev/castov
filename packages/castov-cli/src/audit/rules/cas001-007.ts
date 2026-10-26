import type { ParsedConfigFile, McpServerConfig, Finding } from "../types.js";
import { detectSecrets, isSafeOrVariableReference, SENSITIVE_KEY_NAMES, maskSecret } from "../secrets.js";

/**
 * Client-specific remediation messages (Requirement B):
 * - Assertive syntax recommendations ONLY where a live verbatim documentation quote proves the syntax.
 * - Does NOT mix Cline with VS Code.
 * - Uses neutral guidance wherever upstream docs do not explicitly document variable interpolation syntax.
 */
export function getClientSpecificRemediation(clientName: string | undefined, filePath: string, keyName: string): string {
  const normPath = filePath.replace(/\\/g, "/").toLowerCase();
  const normClient = (clientName || "").toLowerCase();

  // 1. Cursor (.cursor/mcp.json or ~/.cursor/mcp.json)
  // Verbatim Quote: "Cursor resolves variables in these fields: command, args, env, url, and headers. Supported syntax: ${env:NAME} environment variables"
  // Source: https://cursor.com/docs/mcp (Fetched: 2026-10-26)
  if (normClient === "cursor" || normPath.includes("/.cursor/mcp.json") || normPath.endsWith(".cursor/mcp.json")) {
    return `Use "\${env:${keyName}}" in Cursor mcp.json and keep the secret outside the file and outside git (Docs: https://cursor.com/docs/mcp).`;
  }

  // 2. VS Code (.vscode/mcp.json) — Strictly separated from Cline
  // Verbatim Quote: "Environment-variable references | ${env:NAME}" and '{"API_KEY": "${input:api-key}"}'
  // Source: https://code.visualstudio.com/docs/agents/reference/mcp-configuration.md (Fetched: 2026-10-26)
  if (
    (normClient === "vs code" || normPath.includes("/.vscode/mcp.json") || normPath.endsWith(".vscode/mcp.json")) &&
    !normClient.includes("cline") &&
    !normPath.includes("cline") &&
    !normPath.includes("saoudrizwan.claude-dev")
  ) {
    return `Use "\${input:${keyName}}" or "\${env:${keyName}}" in .vscode/mcp.json and keep the secret outside the file and outside git (Docs: https://code.visualstudio.com/docs/agents/reference/mcp-configuration).`;
  }

  // 3. Claude Code (.mcp.json or ~/.claude.json)
  // Verbatim Quote: "Claude Code supports environment variable expansion in .mcp.json files... Supported syntax ${VAR} : expands to the value of environment variable VAR ${VAR:-default} : expands to VAR if set, otherwise uses default"
  // Source: https://code.claude.com/docs/en/mcp (Fetched: 2026-10-26)
  if (
    normClient === "claude code" ||
    normPath.endsWith("/.mcp.json") ||
    normPath === ".mcp.json" ||
    normPath.endsWith("/.claude.json") ||
    normPath === ".claude.json"
  ) {
    return `Use "\${${keyName}}" or "\${${keyName}:-default}" and keep the secret outside the file and outside git (Docs: https://code.claude.com/docs/en/mcp).`;
  }

  // 4. Neutral fallback for clients without verified inline variable interpolation syntax (Claude Desktop, Cline, Zed, etc.)
  return `Keep the secret outside the configuration file and outside git version control, and use the client's documented mechanism for passing environment variables.`;
}

function sanitizeArgsForEvidence(args: string[]): string {
  return args
    .map((a) => {
      const m = detectSecrets(a);
      if (m.length > 0) return m[0].masked;
      return a;
    })
    .join(" ");
}

export function runRulesCas001To007(configFile: ParsedConfigFile): Finding[] {
  const findings: Finding[] = [];
  const { filePath, servers } = configFile;

  for (const [serverName, config] of Object.entries(servers)) {
    checkCas001(configFile, serverName, config, findings);
    checkCas002(filePath, serverName, config, findings);
    checkCas003(filePath, serverName, config, findings);
    checkCas004(filePath, serverName, config, findings);
    checkCas005(filePath, serverName, config, findings);
    checkCas006(filePath, serverName, config, findings);
    checkCas007(filePath, serverName, config, findings);
  }

  return findings;
}

/**
 * CAS-001: Hardcoded Secret in Server Config
 */
function checkCas001(configFile: ParsedConfigFile, serverName: string, config: McpServerConfig, findings: Finding[]) {
  const filePath = configFile.filePath;
  const clientName = configFile.clientName;

  // 1. Check environment variables
  if (config.env && typeof config.env === "object") {
    for (const [k, v] of Object.entries(config.env)) {
      if (typeof v !== "string" || isSafeOrVariableReference(v, k)) continue;

      const matched = detectSecrets(v, k);
      if (matched.length > 0) {
        const isCritical = matched[0].isKnownProvider;
        findings.push({
          ruleId: "CAS-001",
          severity: isCritical ? "critical" : "high",
          title: isCritical
            ? `Hardcoded known provider secret in env.${k}`
            : `Hardcoded secret in env.${k}`,
          whyItMatters: `Exposes credential directly in plain text configuration (${matched[0].patternName}).`,
          suggestedFix: getClientSpecificRemediation(clientName, filePath, k),
          file: filePath,
          serverName,
          keyName: `env.${k}`,
          evidenceMasked: `env.${k}=${matched[0].masked}`,
        });
        continue;
      }

      const isSensitiveName = SENSITIVE_KEY_NAMES.some((n) => k.toUpperCase().includes(n));
      if (isSensitiveName && v.trim().length >= 8) {
        findings.push({
          ruleId: "CAS-001",
          severity: "high",
          title: `Hardcoded literal secret in env.${k}`,
          whyItMatters: `Environment variable "${k}" specifies a sensitive credential name with a static literal value.`,
          suggestedFix: getClientSpecificRemediation(clientName, filePath, k),
          file: filePath,
          serverName,
          keyName: `env.${k}`,
          evidenceMasked: `env.${k}=${maskSecret(v)}`,
        });
      }
    }
  }

  // 2. Check command arguments
  if (Array.isArray(config.args)) {
    for (let i = 0; i < config.args.length; i++) {
      const arg = String(config.args[i]);
      if (isSafeOrVariableReference(arg)) continue;

      const matched = detectSecrets(arg);
      if (matched.length > 0) {
        findings.push({
          ruleId: "CAS-001",
          severity: "critical",
          title: `Hardcoded secret in command args`,
          whyItMatters: `Exposes ${matched[0].patternName} on CLI argument list, making it visible in system process tables and config files.`,
          suggestedFix: getClientSpecificRemediation(clientName, filePath, "SECRET_ARG"),
          file: filePath,
          serverName,
          keyName: `args[${i}]`,
          evidenceMasked: `args[${i}]=${matched[0].masked}`,
        });
      }
    }
  }

  // 3. Check headers in remote configs
  if (config.headers && typeof config.headers === "object") {
    for (const [hk, hv] of Object.entries(config.headers)) {
      if (typeof hv !== "string" || isSafeOrVariableReference(hv, hk)) continue;
      const matched = detectSecrets(hv, hk);
      if (matched.length > 0) {
        findings.push({
          ruleId: "CAS-001",
          severity: matched[0].isKnownProvider ? "critical" : "high",
          title: `Hardcoded credential in headers.${hk}`,
          whyItMatters: `Hardcoded authentication header ${hk} exposes tokens in configuration files.`,
          suggestedFix: getClientSpecificRemediation(clientName, filePath, hk),
          file: filePath,
          serverName,
          keyName: `headers.${hk}`,
          evidenceMasked: `headers.${hk}=${matched[0].masked}`,
        });
      } else if (hk.toLowerCase().includes("auth") && hv.trim().length >= 8) {
        findings.push({
          ruleId: "CAS-001",
          severity: "high",
          title: `Hardcoded authorization header in headers.${hk}`,
          whyItMatters: `Static token configured in headers is saved in plain text.`,
          suggestedFix: getClientSpecificRemediation(clientName, filePath, hk),
          file: filePath,
          serverName,
          keyName: `headers.${hk}`,
          evidenceMasked: `headers.${hk}=${maskSecret(hv)}`,
        });
      }
    }
  }

  // 4. Check URL userinfo and query parameters
  if (config.url && typeof config.url === "string") {
    if (!isSafeOrVariableReference(config.url, "url")) {
      const matched = detectSecrets(config.url, "url");
      if (matched.length > 0) {
        let safeOriginPath = "url";
        try {
          const parsedUrl = new URL(config.url);
          safeOriginPath = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`;
        } catch {
          safeOriginPath = "url";
        }
        findings.push({
          ruleId: "CAS-001",
          severity: matched[0].isKnownProvider ? "critical" : "high",
          title: `Hardcoded secret in server URL (${matched[0].patternName})`,
          whyItMatters: `Sensitive credentials embedded in URLs are logged in access logs and plaintext configuration files.`,
          suggestedFix: getClientSpecificRemediation(clientName, filePath, "URL_TOKEN"),
          file: filePath,
          serverName,
          keyName: "url",
          evidenceMasked: `url=${safeOriginPath}?${matched[0].masked}`,
        });
      }
    }
  }
}

/**
 * CAS-002: Unpinned Runtime Launcher
 */
function checkCas002(filePath: string, serverName: string, config: McpServerConfig, findings: Finding[]) {
  const cmd = config.command?.toLowerCase() || "";
  const args = (config.args || []).map((a) => String(a));

  const RUNNERS = new Set(["npx", "pnpm", "bunx", "uvx", "pipx"]);

  if (RUNNERS.has(cmd)) {
    let pkgArg = "";
    for (const a of args) {
      if (a === "-y" || a === "--yes" || a === "run" || a.startsWith("-")) continue;
      pkgArg = a;
      break;
    }

    if (pkgArg) {
      const hasVersion = /@\d+\.\d+/.test(pkgArg);
      const isLatest = pkgArg.endsWith("@latest");

      if (!hasVersion || isLatest) {
        findings.push({
          ruleId: "CAS-002",
          severity: "medium",
          title: `Unpinned package runner: ${cmd} ${pkgArg}`,
          whyItMatters: `Executing packages without explicit version pinning (${pkgArg}) allows automatic pulling of untested or potentially compromised upstream releases.`,
          suggestedFix: `Pin exact version: e.g. "${pkgArg.split("@")[0]}@1.2.3"`,
          file: filePath,
          serverName,
          keyName: "command",
          evidenceMasked: `${cmd} ${sanitizeArgsForEvidence(args)}`,
        });
      }
    }
  }

  if (cmd === "docker") {
    const runIdx = args.indexOf("run");
    if (runIdx !== -1) {
      for (let i = runIdx + 1; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith("-")) {
          if (["-v", "-p", "-e", "--env", "--name"].includes(arg)) i++;
          continue;
        }
        const isLatest = arg.endsWith(":latest");
        const hasTag = arg.includes(":") || arg.includes("@sha256:");
        if (!hasTag || isLatest) {
          findings.push({
            ruleId: "CAS-002",
            severity: "medium",
            title: `Unpinned Docker image: ${arg}`,
            whyItMatters: `Docker containers without explicit immutable tags or SHA256 digests can pull untrusted updates dynamically.`,
            suggestedFix: `Specify immutable container image tag: "${arg.split(":")[0]}:v1.0.0" or @sha256 digest.`,
            file: filePath,
            serverName,
            keyName: "command",
            evidenceMasked: `docker run ... ${arg}`,
          });
        }
        break;
      }
    }
  }
}

/**
 * CAS-003: Shell Wrapper or Embedded Script
 */
function checkCas003(filePath: string, serverName: string, config: McpServerConfig, findings: Finding[]) {
  const cmd = (config.command || "").toLowerCase();
  const args = (config.args || []).map((a) => String(a));
  const fullCmdLine = [cmd, ...args].join(" ");
  const safeEvidence = [cmd, sanitizeArgsForEvidence(args)].join(" ").slice(0, 80);

  const SHELLS = new Set(["sh", "bash", "zsh", "cmd", "cmd.exe", "powershell", "powershell.exe", "pwsh"]);

  if (SHELLS.has(cmd)) {
    const hasEvalFlag = args.some((a) => a === "-c" || a.toLowerCase() === "-command");
    if (hasEvalFlag) {
      findings.push({
        ruleId: "CAS-003",
        severity: "high",
        title: `Shell wrapper with embedded command execution (${cmd})`,
        whyItMatters: `Running tools through a shell command string introduces arbitrary command injection and shell escape vulnerabilities.`,
        suggestedFix: `Invoke target binaries directly as "command" without shell wrappers (-c / -Command).`,
        file: filePath,
        serverName,
        keyName: "command",
        evidenceMasked: safeEvidence,
      });
      return;
    }
  }

  const hasPipeToShell = /(?:curl|wget)\b[^\n|]+\|\s*(?:sh|bash|zsh|pwsh|powershell)/i.test(fullCmdLine);
  const hasSubshell = /\$\([^)]+\)/.test(fullCmdLine) || /`[^`]+`/.test(fullCmdLine);
  const hasEval = /\beval\b/.test(fullCmdLine);

  if (hasPipeToShell || hasSubshell || hasEval) {
    findings.push({
      ruleId: "CAS-003",
      severity: "high",
      title: `Dangerous script piping or subshell execution in arguments`,
      whyItMatters: `Piping remote downloads to shells or invoking subshells executes unverified code dynamically.`,
      suggestedFix: `Pre-install verified binaries locally and call them directly.`,
      file: filePath,
      serverName,
      keyName: "args",
      evidenceMasked: safeEvidence,
    });
  }
}

/**
 * CAS-004: Remote Server Security & Data Flow
 */
function checkCas004(filePath: string, serverName: string, config: McpServerConfig, findings: Finding[]) {
  const url = config.url;
  if (!url || typeof url !== "string") return;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }

  const isLocalhost =
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "::1" ||
    parsed.hostname === "[::1]" ||
    parsed.hostname.endsWith(".localhost");

  if (parsed.protocol === "http:" && !isLocalhost) {
    findings.push({
      ruleId: "CAS-004",
      severity: "high",
      title: `Unencrypted remote HTTP MCP server (${parsed.hostname})`,
      whyItMatters: `Remote MCP server communicates over plaintext HTTP, exposing all prompts, code context, and tool responses to interception.`,
      suggestedFix: `Upgrade endpoint to TLS/HTTPS: "https://${parsed.host}${parsed.pathname}"`,
      file: filePath,
      serverName,
      keyName: "url",
      evidenceMasked: `url=${parsed.protocol}//${parsed.host}${parsed.pathname}`,
    });
    return;
  }

  if (parsed.protocol === "https:" && !isLocalhost) {
    const headers = config.headers || {};
    const hasAuth = Object.keys(headers).some((h) =>
      ["authorization", "x-api-key", "apikey", "bearer"].includes(h.toLowerCase())
    );

    if (!hasAuth) {
      findings.push({
        ruleId: "CAS-004",
        severity: "medium",
        title: `Remote HTTPS server without visible authorization header`,
        whyItMatters: `Remote endpoint ${parsed.hostname} does not declare authentication headers.`,
        suggestedFix: `Configure an explicit Authorization header using your client's documented variable reference mechanism.`,
        file: filePath,
        serverName,
        keyName: "headers",
        evidenceMasked: `url=${parsed.origin}${parsed.pathname}`,
      });
    }

    findings.push({
      ruleId: "CAS-004",
      severity: "info",
      title: `Data flow to third-party remote server (${parsed.hostname})`,
      whyItMatters: `All tool calls dispatched to this server send developer prompts and workspace data to external infrastructure.`,
      suggestedFix: `Verify third-party data processing agreement and privacy policy.`,
      file: filePath,
      serverName,
      keyName: "url.remote",
      evidenceMasked: `remote_host=${parsed.hostname}`,
    });
  }
}

/**
 * CAS-005: Broad Filesystem Scope
 */
function checkCas005(filePath: string, serverName: string, config: McpServerConfig, findings: Finding[]) {
  const args = (config.args || []).map((a) => String(a));

  for (const arg of args) {
    const trimmed = arg.trim();
    const isRoot = trimmed === "/" || trimmed === "C:\\" || trimmed === "C:/" || trimmed === "c:\\" || trimmed === "c:/";
    const isHome = trimmed === "~" || trimmed === "$HOME" || trimmed === "%USERPROFILE%" || trimmed === "%HOMEPATH%";
    const isBroadUnix = trimmed.startsWith("/home") || trimmed.startsWith("/Users");
    const isBroadWin = /^[a-zA-Z]:\\Users(?:\\[^\\]+)?$/i.test(trimmed);

    if (isRoot || isHome || isBroadUnix || isBroadWin) {
      findings.push({
        ruleId: "CAS-005",
        severity: "high",
        title: `Broad filesystem scope argument: "${trimmed}"`,
        whyItMatters: `Granting access to the filesystem root or home directory ("${trimmed}") allows reading private user documents, SSH keys, and system files.`,
        suggestedFix: `Restrict tool directory scope to the current workspace project: "./"`,
        file: filePath,
        serverName,
        keyName: "args.scope",
        evidenceMasked: `arg=${trimmed}`,
      });
      break;
    }
  }
}

/**
 * CAS-006: Docker Container Risks
 */
function checkCas006(filePath: string, serverName: string, config: McpServerConfig, findings: Finding[]) {
  const cmd = (config.command || "").toLowerCase();
  if (cmd !== "docker") return;

  const args = (config.args || []).map((a) => String(a));
  const fullArgs = args.join(" ");

  if (args.includes("--privileged")) {
    findings.push({
      ruleId: "CAS-006",
      severity: "critical",
      title: `Docker container running in privileged mode (--privileged)`,
      whyItMatters: `Privileged containers disable security isolation, granting full root access to host devices and kernel capabilities.`,
      suggestedFix: `Remove --privileged and grant only strictly required capabilities (--cap-add).`,
      file: filePath,
      serverName,
      keyName: "args.privileged",
      evidenceMasked: `docker ... --privileged`,
    });
  }

  if (fullArgs.includes("/var/run/docker.sock")) {
    findings.push({
      ruleId: "CAS-006",
      severity: "critical",
      title: `Host docker.sock mounted into container`,
      whyItMatters: `Mounting the Docker daemon socket provides root-equivalent privilege escalation over the entire host machine.`,
      suggestedFix: `Remove docker.sock volume mount to maintain host container boundary isolation.`,
      file: filePath,
      serverName,
      keyName: "args.docker_sock",
      evidenceMasked: `volume mount: /var/run/docker.sock`,
    });
  }

  if (fullArgs.includes("-v /:/") || fullArgs.includes("--volume /:/")) {
    findings.push({
      ruleId: "CAS-006",
      severity: "high",
      title: `Host filesystem root mounted into Docker container (-v /:/)`,
      whyItMatters: `Mounting host root enables reading and writing all host operating system files directly from the container.`,
      suggestedFix: `Mount only project directory: "-v ./:/app"`,
      file: filePath,
      serverName,
      keyName: "args.root_mount",
      evidenceMasked: `-v /:/`,
    });
  }

  if (args.includes("--network=host") || fullArgs.includes("--network host")) {
    findings.push({
      ruleId: "CAS-006",
      severity: "high",
      title: `Docker host network stack attached (--network host)`,
      whyItMatters: `Host networking bypasses container network isolation, allowing tools to access local loopback services.`,
      suggestedFix: `Use bridge network isolation with explicit port bindings.`,
      file: filePath,
      serverName,
      keyName: "args.network_host",
      evidenceMasked: `--network host`,
    });
  }
}

/**
 * CAS-007: Auto-Approve / Always-Allow Permissions
 */
function checkCas007(filePath: string, serverName: string, config: McpServerConfig, findings: Finding[]) {
  const autoApprove = config.autoApprove ?? config.alwaysAllow;
  if (!autoApprove) return;

  const SENSITIVE_ACTIONS = ["write", "edit", "execute", "exec", "terminal", "bash", "shell", "delete", "remove", "rm"];

  if (autoApprove === true || (Array.isArray(autoApprove) && autoApprove.includes("*"))) {
    findings.push({
      ruleId: "CAS-007",
      severity: "high",
      title: `Wildcard auto-approval enabled (autoApprove: *)`,
      whyItMatters: `All tool actions from "${serverName}" execute automatically without human verification or confirmation prompt.`,
      suggestedFix: `Remove wildcard and require human-in-the-loop confirmation for dangerous operations.`,
      file: filePath,
      serverName,
      keyName: "autoApprove",
      evidenceMasked: `autoApprove: *`,
    });
    return;
  }

  if (Array.isArray(autoApprove) && autoApprove.length > 0) {
    const dangerousTools = autoApprove.filter((tool) =>
      SENSITIVE_ACTIONS.some((act) => String(tool).toLowerCase().includes(act))
    );

    if (dangerousTools.length > 0) {
      findings.push({
        ruleId: "CAS-007",
        severity: "high",
        title: `Auto-approval configured for write/execute tools: [${dangerousTools.join(", ")}]`,
        whyItMatters: `Automatically approving write or shell execution actions allows autonomous agents to modify files or execute arbitrary commands without review.`,
        suggestedFix: `Enforce interactive confirmation for destructive tools: [${dangerousTools.join(", ")}]`,
        file: filePath,
        serverName,
        keyName: "autoApprove",
        evidenceMasked: `autoApprove: [${dangerousTools.join(", ")}]`,
      });
    } else {
      findings.push({
        ruleId: "CAS-007",
        severity: "medium",
        title: `Auto-approval configured for ${autoApprove.length} tool(s)`,
        whyItMatters: `Pre-approving tools bypasses user confirmation prompts for actions performed by this MCP server.`,
        suggestedFix: `Audit approved tools to ensure read-only safety.`,
        file: filePath,
        serverName,
        keyName: "autoApprove",
        evidenceMasked: `autoApprove: [${autoApprove.slice(0, 3).join(", ")}${autoApprove.length > 3 ? "..." : ""}]`,
      });
    }
  }
}
