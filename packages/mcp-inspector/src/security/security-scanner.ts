import { McpServerConfig, McpTool, SecurityFinding } from "../types/mcp";

export class McpSecurityScanner {
  public static auditServerConfigs(servers: McpServerConfig[]): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    for (const server of servers) {
      // 1. Audit Arguments & Environment for exposed Secrets
      this.scanForExposedSecrets(server, findings);

      // 2. Audit Command for dangerous system access
      this.scanForDangerousCommands(server, findings);
    }

    return findings;
  }

  public static auditTools(serverName: string, tools: McpTool[]): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    for (const tool of tools) {
      const desc = tool.description || "";
      const lowerDesc = desc.toLowerCase();

      // Check for Prompt Injection / Jailbreak attempts in tool descriptions
      const injectionPatterns = [
        "ignore previous instructions",
        "ignore all previous instructions",
        "system prompt:",
        "you are now in developer mode",
        "never reveal this to the user",
        "do not disclose",
        "bypass all guardrails",
      ];

      for (const pattern of injectionPatterns) {
        if (lowerDesc.includes(pattern)) {
          findings.push({
            id: `sec-inj-${serverName}-${tool.name}`,
            serverName,
            severity: "critical",
            title: `Potential Prompt Injection in Tool "${tool.name}"`,
            description: `Tool description contains high-risk instruction keyword: "${pattern}". This can hijack LLM behavior.`,
            location: `Tool: ${tool.name}`,
            recommendation: `Sanitize the tool description to explain its technical functionality without meta-instructions to the LLM.`,
          });
          break;
        }
      }

      // Check for destructive tool naming or descriptions
      const destructiveKeywords = ["delete_all", "drop_database", "execute_shell", "run_bash", "exec_cmd", "format_disk"];
      for (const kw of destructiveKeywords) {
        if (tool.name.toLowerCase().includes(kw) || lowerDesc.includes(kw)) {
          findings.push({
            id: `sec-tool-risk-${serverName}-${tool.name}`,
            serverName,
            severity: "high",
            title: `High-Privilege Destructive Tool "${tool.name}"`,
            description: `Tool appears to provide unrestricted shell or destructive database operations.`,
            location: `Tool: ${tool.name}`,
            recommendation: `Ensure user confirmation or sandboxing is enforced before allowing an LLM agent to invoke this tool autonomously.`,
          });
          break;
        }
      }
    }

    return findings;
  }

  private static scanForExposedSecrets(server: McpServerConfig, findings: SecurityFinding[]): void {
    const secretRegexes = [
      { name: "OpenAI API Key", regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/ },
      { name: "Anthropic API Key", regex: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
      { name: "GitHub Personal Access Token", regex: /\b(?:ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82})\b/ },
      { name: "AWS Access Key ID", regex: /\bAKIA[0-9A-Z]{16}\b/ },
    ];

    const inspectString = (str: string, context: string) => {
      for (const { name, regex } of secretRegexes) {
        if (regex.test(str)) {
          findings.push({
            id: `sec-key-${server.name}-${context}`,
            serverName: server.name,
            severity: "critical",
            title: `Hardcoded ${name} Detected`,
            description: `Found a plaintext ${name} exposed directly in ${context}.`,
            location: `${server.configSource} (${context})`,
            recommendation: `Never store API keys in mcp.json files. Move this key to a local .env file or reference it via process.env.`,
          });
        }
      }
    };

    // Check args
    for (let i = 0; i < server.args.length; i++) {
      inspectString(server.args[i], `arg[${i}]`);
    }

    // Check env vars
    if (server.env) {
      for (const [key, val] of Object.entries(server.env)) {
        inspectString(String(val), `env.${key}`);
        if (/secret|token|password|api_key|auth/i.test(key) && String(val).length > 10 && !String(val).startsWith("${")) {
          // Flag if hardcoded and not an interpolation variable
          findings.push({
            id: `sec-env-${server.name}-${key}`,
            serverName: server.name,
            severity: "medium",
            title: `Potential Plaintext Secret in Environment Variable "${key}"`,
            description: `Environment variable "${key}" contains what appears to be a raw hardcoded secret value.`,
            location: `${server.configSource} (env.${key})`,
            recommendation: `Load secrets from protected environment variables rather than committing them in JSON config.`,
          });
        }
      }
    }
  }

  private static scanForDangerousCommands(server: McpServerConfig, findings: SecurityFinding[]): void {
    const cmd = server.command.toLowerCase().trim();
    const argsStr = server.args.join(" ").toLowerCase();

    // Direct shell
    if (cmd === "bash" || cmd === "sh" || cmd === "cmd.exe" || cmd === "cmd" || cmd === "powershell" || cmd === "powershell.exe") {
      findings.push({
        id: `sec-shell-${server.name}`,
        serverName: server.name,
        severity: "high",
        title: `Direct Shell Execution (${server.command})`,
        description: `Server launches directly into an interactive system shell without command-level sandboxing.`,
        location: `${server.configSource} (command: ${server.command})`,
        recommendation: `Use dedicated CLI executables rather than exposing a raw shell environment to agents.`,
      });
    }

    // Remote curl/wget pipe
    if (argsStr.includes("curl") && argsStr.includes("|") && (argsStr.includes("sh") || argsStr.includes("bash"))) {
      findings.push({
        id: `sec-pipe-${server.name}`,
        serverName: server.name,
        severity: "critical",
        title: `Remote Script Execution via Pipe (curl | sh)`,
        description: `Command contains dynamic remote script download and shell piping, which introduces supply-chain risks.`,
        location: `${server.configSource}`,
        recommendation: `Download, verify checksums, and audit scripts locally before execution.`,
      });
    }

    // Sudo
    if (cmd === "sudo" || argsStr.includes("sudo ")) {
      findings.push({
        id: `sec-sudo-${server.name}`,
        serverName: server.name,
        severity: "critical",
        title: `Elevated Privileges (sudo / Administrator)`,
        description: `MCP Server runs with elevated administrative permissions. Any exploited tool has complete host takeover.`,
        location: `${server.configSource}`,
        recommendation: `Run MCP servers strictly under unprivileged, least-privilege user accounts.`,
      });
    }
  }
}
