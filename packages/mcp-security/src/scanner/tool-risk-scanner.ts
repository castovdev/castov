import { SecurityFinding } from "../types/security";

export class ToolRiskScanner {
  public static scan(
    serverName: string,
    configFile: string,
    command: string,
    args: string[]
  ): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const fullCmd = [command, ...args].join(" ");

    // 1. Check for shell interpreters that allow arbitrary command execution
    const shellExecutables = ["bash", "sh", "zsh", "cmd.exe", "powershell", "pwsh"];
    const baseCommand = command.toLowerCase().replace(/\\/g, "/").split("/").pop() || "";

    if (shellExecutables.includes(baseCommand)) {
      findings.push({
        id: `risk-shell-${serverName}`,
        serverName,
        configFile,
        category: "DANGEROUS_COMMAND",
        severity: "CRITICAL",
        title: "Unrestricted Shell Execution",
        description: `MCP Server "${serverName}" launches directly via '${command}'. A malicious prompt or tool can execute arbitrary system commands with the privileges of your user account.`,
        remediation:
          "Wrap the server in a container or isolate it to a dedicated executable binary instead of a raw shell.",
        detectedValue: command,
      });
    }

    // 2. Check for inline code execution flags (eval / -e / -c)
    if (
      (baseCommand === "node" || baseCommand === "node.exe") &&
      args.includes("-e")
    ) {
      findings.push({
        id: `risk-eval-node-${serverName}`,
        serverName,
        configFile,
        category: "DANGEROUS_COMMAND",
        severity: "HIGH",
        title: "Inline Node.js Code Execution (-e)",
        description: `Server "${serverName}" executes inline JavaScript code passed as a CLI flag. This is prone to injection.`,
        remediation: "Save the server code to a static `.js` file and run that file directly.",
        detectedValue: args.join(" "),
      });
    }

    if (
      (baseCommand === "python" || baseCommand === "python3") &&
      args.includes("-c")
    ) {
      findings.push({
        id: `risk-eval-py-${serverName}`,
        serverName,
        configFile,
        category: "DANGEROUS_COMMAND",
        severity: "HIGH",
        title: "Inline Python Code Execution (-c)",
        description: `Server "${serverName}" executes inline Python script passed as a CLI argument.`,
        remediation: "Execute a defined Python script file rather than passing code inline.",
        detectedValue: args.join(" "),
      });
    }

    // 3. Sudo / Privileged execution
    if (baseCommand === "sudo" || baseCommand === "doas" || fullCmd.includes("sudo ")) {
      findings.push({
        id: `risk-sudo-${serverName}`,
        serverName,
        configFile,
        category: "DANGEROUS_COMMAND",
        severity: "CRITICAL",
        title: "Root / Sudo Privileges Requested",
        description: `MCP Server "${serverName}" is being invoked with superuser/sudo privileges. Any model hallucination or injection has unrestricted root control.`,
        remediation:
          "Remove 'sudo'. MCP servers must strictly run in unprivileged user space.",
        detectedValue: fullCmd,
      });
    }

    // 4. Docker unconfined or privileged
    if (baseCommand === "docker" || baseCommand === "podman") {
      if (args.includes("--privileged") || fullCmd.includes("--privileged")) {
        findings.push({
          id: `risk-docker-priv-${serverName}`,
          serverName,
          configFile,
          category: "UNCONFINED_ACCESS",
          severity: "CRITICAL",
          title: "Docker Container with --privileged Flag",
          description: `MCP container server "${serverName}" runs in privileged mode, disabling container isolation and exposing host devices.`,
          remediation:
            "Remove '--privileged'. Grant only explicitly required capabilities with '--cap-add'.",
          detectedValue: "--privileged",
        });
      }

      // Root filesystem mount
      if (fullCmd.includes("-v /:/") || fullCmd.includes("-v C:\\:C:\\")) {
        findings.push({
          id: `risk-docker-rootmount-${serverName}`,
          serverName,
          configFile,
          category: "UNCONFINED_ACCESS",
          severity: "CRITICAL",
          title: "Host Root Directory Mounted",
          description: `Server mounts the entire host root directory inside the container, granting read/write access to system binaries and private keys.`,
          remediation:
            "Scope volume mounts strictly to your specific project workspace directory.",
          detectedValue: "-v /:/",
        });
      }
    }

    // 5. Prompt injection checks in CLI arguments or descriptions
    const injectionPhrases = [
      "ignore previous instructions",
      "ignore all previous",
      "disregard previous instructions",
      "override system prompt",
      "override constraints",
      "bypass safety filters",
      "you are now DAN",
      "developer mode enabled",
      "jailbreak",
    ];

    for (const phrase of injectionPhrases) {
      if (fullCmd.toLowerCase().includes(phrase)) {
        findings.push({
          id: `risk-injection-${serverName}`,
          serverName,
          configFile,
          category: "PROMPT_INJECTION",
          severity: "CRITICAL",
          title: "Adversarial Prompt Injection Vector",
          description: `CLI command/args for "${serverName}" contain adversarial override instruction: "${phrase}".`,
          remediation:
            "Sanitize tool configuration arguments to prevent prompt hijack attacks.",
          detectedValue: phrase,
        });
        break;
      }
    }

    // 6. Network exposure: --allow-all, 0.0.0.0 bind
    if (fullCmd.includes("0.0.0.0")) {
      findings.push({
        id: `risk-bind-all-${serverName}`,
        serverName,
        configFile,
        category: "UNCONFINED_ACCESS",
        severity: "MEDIUM",
        title: "Server Binds to All Network Interfaces (0.0.0.0)",
        description: `Server is configured to listen on 0.0.0.0, exposing its endpoints to the local network or internet instead of localhost.`,
        remediation: "Bind exclusively to loopback interface '127.0.0.1'.",
        detectedValue: "0.0.0.0",
      });
    }

    return findings;
  }
}
