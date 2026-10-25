import type { ParsedConfigFile, McpServerConfig, Finding } from "../types.js";
import { detectSecrets, isVariableReference, SENSITIVE_KEY_NAMES, maskSecret } from "../secrets.js";

/**
 * Audit Rules CAS-001 through CAS-007 for MCP Server configurations.
 */
export function getClientSpecificRemediation(clientName: string | undefined, filePath: string, keyName: string): string {
  const norm = ((clientName || "") + " " + filePath).toLowerCase();

  if (norm.includes("cursor")) {
    return `Cursor supports environment variable expansion: replace with "\${env:${keyName}}" and export ${keyName} in your environment or workspace .env. (Docs: https://docs.cursor.com/context/model-context-protocol)`;
  }
  if (norm.includes("cline") || norm.includes("code/user") || norm.includes(".vscode")) {
    return `VS Code / Cline supports environment variable expansion: replace with "\${env:${keyName}}" and set ${keyName} in your local process environment. (Docs: https://github.com/cline/cline/blob/main/docs/mcp.md)`;
  }
  if (norm.includes("claude_desktop") || norm.includes("claude desktop")) {
    return `Claude Desktop does NOT support \${env:...} expansion in claude_desktop_config.json. Set ${keyName} in your operating system environment before launching Claude Desktop, and do not commit this config file. (Docs: https://modelcontextprotocol.io/quickstart/user)`;
  }
  if (norm.includes("claude code") || norm.includes(".claude.json")) {
    return `Claude Code CLI reads system environment variables directly. Export ${keyName} in your shell profile (~/.zshrc, ~/.bashrc) instead of saving plaintext tokens in .claude.json. (Docs: https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview)`;
  }
  if (norm.includes("zed")) {
    return `Zed editor context servers inherit variables from your shell environment. Export ${keyName} in your shell configuration instead of storing plaintext credentials in settings.json. (Docs: https://zed.dev/docs/ai/mcp)`;
  }
  return `Replace hardcoded secret with environment variable reference: "\${env:${keyName}}" or inject from system environment.`;
}

export function runRulesCas001To007(configFile: ParsedConfigFile): Finding[] {
  const findings: Finding[] = [];
  const { filePath, servers } = configFile;

  for (const [serverName, config] of Object.entries(servers)) {
    // -------------------------------------------------------------------------
    // CAS-001: Hardcoded Secret in Server Config (env, args, headers, url query)
    // -------------------------------------------------------------------------
    checkCas001(configFile, serverName, config, findings);

    // -------------------------------------------------------------------------
    // CAS-002: Unpinned Runtime Launcher
    // -------------------------------------------------------------------------
    checkCas002(filePath, serverName, config, findings);

    // -------------------------------------------------------------------------
    // CAS-003: Shell Wrapper or Embedded Script
    // -------------------------------------------------------------------------
    checkCas003(filePath, serverName, config, findings);

    // -------------------------------------------------------------------------
    // CAS-004: Remote Server Security & Data Flow
    // -------------------------------------------------------------------------
    checkCas004(filePath, serverName, config, findings);

    // -------------------------------------------------------------------------
    // CAS-005: Broad Filesystem Scope
    // -------------------------------------------------------------------------
    checkCas005(filePath, serverName, config, findings);

    // -------------------------------------------------------------------------
    // CAS-006: Docker Container Risks
    // -------------------------------------------------------------------------
    checkCas006(filePath, serverName, config, findings);

    // -------------------------------------------------------------------------
    // CAS-007: Auto-Approve / Always-Allow Tool Permissions
    // -------------------------------------------------------------------------
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
      if (typeof v !== "string" || isVariableReference(v)) continue;

      // Check known provider secret patterns first
      const matched = detectSecrets(v);
      if (matched.length > 0) {
        findings.push({
          ruleId: "CAS-001",
          severity: "critical",
          title: `Hardcoded known provider secret in env.${k}`,
          whyItMatters: `Exposes live credentials directly in plain text configuration (${matched[0].patternName}). Anyone with access to the repo can steal these credentials.`,
          suggestedFix: getClientSpecificRemediation(clientName, filePath, k),
          file: filePath,
          serverName,
          evidenceMasked: `env.${k}=${matched[0].masked}`,
        });
        continue;
      }

      // Check sensitive key names with non-placeholder literal values
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
          evidenceMasked: `env.${k}=${maskSecret(v)}`,
        });
      }
    }
  }

  // 2. Check command arguments
  if (Array.isArray(config.args)) {
    for (let i = 0; i < config.args.length; i++) {
      const arg = String(config.args[i]);
      if (isVariableReference(arg)) continue;

      const matched = detectSecrets(arg);
      if (matched.length > 0) {
        findings.push({
          ruleId: "CAS-001",
          severity: "critical",
          title: `Hardcoded known provider secret in command args`,
          whyItMatters: `Exposes ${matched[0].patternName} on CLI argument list, making it visible in system process tables (ps aux) and config files.`,
          suggestedFix: `Pass credentials via secure environment variables rather than command-line arguments.`,
          file: filePath,
          serverName,
          evidenceMasked: `args[${i}]=${matched[0].masked}`,
        });
      }
    }
  }

  // 3. Check headers in remote configs
  if (config.headers && typeof config.headers === "object") {
    for (const [hk, hv] of Object.entries(config.headers)) {
      if (typeof hv !== "string" || isVariableReference(hv)) continue;
      const matched = detectSecrets(hv);
      if (matched.length > 0) {
        findings.push({
          ruleId: "CAS-001",
          severity: "critical",
          title: `Hardcoded credential in headers.${hk}`,
          whyItMatters: `Hardcoded authentication header ${hk} exposes tokens in repository files.`,
          suggestedFix: getClientSpecificRemediation(clientName, filePath, hk),
          file: filePath,
          serverName,
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
          evidenceMasked: `headers.${hk}=${maskSecret(hv)}`,
        });
      }
    }
  }

  // 4. Check URL query parameters
  if (config.url && typeof config.url === "string") {
    try {
      const parsedUrl = new URL(config.url);
      if (parsedUrl.search) {
        const matched = detectSecrets(parsedUrl.search);
        if (matched.length > 0) {
          findings.push({
            ruleId: "CAS-001",
            severity: "critical",
            title: `Hardcoded secret in URL query parameters`,
            whyItMatters: `Sensitive credentials exposed in URL query string are logged in server access logs and intermediate proxies.`,
            suggestedFix: `Pass credentials in Authorization request headers instead of URL query parameters.`,
            file: filePath,
            serverName,
            evidenceMasked: `url=${parsedUrl.origin}${parsedUrl.pathname}?${matched[0].masked}`,
          });
        }
      }
    } catch {
      // ignore invalid URLs here, CAS-004 handles remote URL formats
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
    // Find the package being executed
    let pkgArg = "";
    for (const a of args) {
      if (a === "-y" || a === "--yes" || a === "run" || a.startsWith("-")) continue;
      pkgArg = a;
      break;
    }

    if (pkgArg) {
      // Check if package has version pinning
      const hasVersion = /@\d+\.\d+/.test(pkgArg);
      const isLatest = pkgArg.endsWith("@latest");

      if (!hasVersion || isLatest) {
        findings.push({
          ruleId: "CAS-002",
          severity: "medium",
          title: `Unpinned package runner: ${cmd} ${pkgArg}`,
          whyItMatters: `Executing packages without explicit version pinning (${pkgArg}) allows automatic pulling of untested or potentially compromised upstream releases (Supply Chain Attack).`,
          suggestedFix: `Pin exact version: e.g. "${pkgArg.split("@")[0]}@1.2.3"`,
          file: filePath,
          serverName,
          evidenceMasked: `${cmd} ${args.join(" ")}`,
        });
      }
    }
  }

  // Check Docker launcher without tag or with :latest
  if (cmd === "docker") {
    const runIdx = args.indexOf("run");
    if (runIdx !== -1) {
      // Find image name (last non-flag arg or after options)
      for (let i = runIdx + 1; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith("-")) {
          if (["-v", "-p", "-e", "--env", "--name"].includes(arg)) i++; // skip option value
          continue;
        }
        // Found potential image
        const isLatest = arg.endsWith(":latest");
        const hasTag = arg.includes(":") || arg.includes("@sha256:");
        if (!hasTag || isLatest) {
          findings.push({
            ruleId: "CAS-002",
            severity: "medium",
            title: `Unpinned Docker image: ${arg}`,
            whyItMatters: `Docker containers without explicit immutable tags or SHA256 digests can pull untrusted updates dynamically.`,
            suggestedFix: `Specify immutable container image tag: "${arg.split(":")[0]}:v1.0.0" or sha256 digest.`,
            file: filePath,
            serverName,
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

  const SHELLS = new Set(["sh", "bash", "zsh", "cmd", "cmd.exe", "powershell", "powershell.exe", "pwsh"]);

  // 1. Direct shell with -c / -Command
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
        evidenceMasked: fullCmdLine.slice(0, 80),
      });
      return;
    }
  }

  // 2. Arguments piping curl/wget to shell or containing eval / backticks / subshells
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
      evidenceMasked: fullCmdLine.slice(0, 80),
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
    parsed.hostname.endsWith(".localhost");

  // 1. Unencrypted HTTP to non-localhost
  if (parsed.protocol === "http:" && !isLocalhost) {
    findings.push({
      ruleId: "CAS-004",
      severity: "high",
      title: `Unencrypted remote HTTP MCP server (${parsed.hostname})`,
      whyItMatters: `Remote MCP server communicates over plaintext HTTP, exposing all prompts, code context, and tool responses to Man-in-the-Middle interception.`,
      suggestedFix: `Upgrade endpoint to TLS/HTTPS: "https://${parsed.host}${parsed.pathname}"`,
      file: filePath,
      serverName,
      evidenceMasked: `url=${parsed.protocol}//${parsed.host}${parsed.pathname}`,
    });
    return;
  }

  // 2. HTTPS without visible authentication headers
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
        whyItMatters: `Remote endpoint ${parsed.hostname} does not declare authentication headers, which may indicate unauthenticated access or credential leakage via unmonitored cookies.`,
        suggestedFix: `Configure an explicit Authorization header with environment variable substitution.`,
        file: filePath,
        serverName,
        evidenceMasked: `url=${parsed.origin}${parsed.pathname}`,
      });
    }

    // 3. Info: Data flow to third party
    findings.push({
      ruleId: "CAS-004",
      severity: "info",
      title: `Data flow to third-party remote server (${parsed.hostname})`,
      whyItMatters: `All tool calls dispatched to this server send developer prompts and workspace data to external infrastructure.`,
      suggestedFix: `Verify third-party data processing agreement and privacy policy.`,
      file: filePath,
      serverName,
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
    // Broad directory patterns
    const isRoot = trimmed === "/" || trimmed === "C:\\" || trimmed === "C:/" || trimmed === "c:\\" || trimmed === "c:/";
    const isHome = trimmed === "~" || trimmed === "$HOME" || trimmed === "%USERPROFILE%" || trimmed === "%HOMEPATH%";
    const isBroadUnix = trimmed.startsWith("/home") || trimmed.startsWith("/Users");
    const isBroadWin = /^[a-zA-Z]:\\Users(?:\\[^\\]+)?$/i.test(trimmed);

    if (isRoot || isHome || isBroadUnix || isBroadWin) {
      findings.push({
        ruleId: "CAS-005",
        severity: "high",
        title: `Broad filesystem scope argument: "${trimmed}"`,
        whyItMatters: `Granting access to the filesystem root ("${trimmed}") allows the AI model and external tools to read all private user documents, SSH keys, credentials, and system files.`,
        suggestedFix: `Restrict tool directory scope to the current workspace project: "./"`,
        file: filePath,
        serverName,
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

  // Critical: --privileged or docker.sock binding
  if (args.includes("--privileged")) {
    findings.push({
      ruleId: "CAS-006",
      severity: "critical",
      title: `Docker container running in privileged mode (--privileged)`,
      whyItMatters: `Privileged containers disable all security isolation, granting full root access to host devices and kernel capabilities.`,
      suggestedFix: `Remove --privileged and grant only strictly required capabilities (--cap-add).`,
      file: filePath,
      serverName,
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
      evidenceMasked: `volume mount: /var/run/docker.sock`,
    });
  }

  // High: host root volume mount or host network/pid
  if (fullArgs.includes("-v /:/") || fullArgs.includes("--volume /:/")) {
    findings.push({
      ruleId: "CAS-006",
      severity: "high",
      title: `Host filesystem root mounted into Docker container (-v /:/)`,
      whyItMatters: `Mounting host root enables reading and writing all host operating system files directly from the container.`,
      suggestedFix: `Mount only project directory: "-v ./:/app"`,
      file: filePath,
      serverName,
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

  // 1. Wildcard approval
  if (autoApprove === true || (Array.isArray(autoApprove) && autoApprove.includes("*"))) {
    findings.push({
      ruleId: "CAS-007",
      severity: "high",
      title: `Wildcard auto-approval enabled (autoApprove: *)`,
      whyItMatters: `All tool actions from "${serverName}" execute automatically without human verification or confirmation prompt.`,
      suggestedFix: `Remove wildcard and require human-in-the-loop confirmation for dangerous operations.`,
      file: filePath,
      serverName,
      evidenceMasked: `autoApprove: *`,
    });
    return;
  }

  // 2. Specific tools approved
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
        evidenceMasked: `autoApprove: [${autoApprove.slice(0, 3).join(", ")}${autoApprove.length > 3 ? "..." : ""}]`,
      });
    }
  }
}
