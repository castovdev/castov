import { SecurityFinding } from "../types/security";

interface SecretRule {
  name: string;
  pattern: RegExp;
  severity: "CRITICAL" | "HIGH";
  remediation: string;
}

const SECRET_PATTERNS: SecretRule[] = [
  {
    name: "OpenAI API Key",
    pattern: /sk-(?:live-)?[a-zA-Z0-9_-]{20,}/g,
    severity: "CRITICAL",
    remediation:
      "Move the OpenAI key to your private .env file and reference via environment variables instead of hardcoding in mcp.json.",
  },
  {
    name: "Anthropic Claude API Key",
    pattern: /sk-ant-[a-zA-Z0-9_-]{20,}/g,
    severity: "CRITICAL",
    remediation:
      "Move the Anthropic key to your private .env or system environment variable instead of committing it into mcp.json.",
  },
  {
    name: "Google Gemini API Key",
    pattern: /AIza[0-9A-Za-z-_]{35}/g,
    severity: "CRITICAL",
    remediation:
      "Store GEMINI_API_KEY in your local environment file or secret manager.",
  },
  {
    name: "AWS Access Key ID",
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: "CRITICAL",
    remediation:
      "Use AWS IAM profiles or environment variables (AWS_ACCESS_KEY_ID). Never place AWS credentials in MCP config.",
  },
  {
    name: "GitHub Personal Access Token",
    pattern: /(?:ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})/g,
    severity: "CRITICAL",
    remediation:
      "Use GITHUB_PERSONAL_ACCESS_TOKEN from user environment variables.",
  },
  {
    name: "Slack API / Bot Token",
    pattern: /xox[baprs]-[0-9a-zA-Z]{10,48}/g,
    severity: "HIGH",
    remediation: "Store SLACK_BOT_TOKEN securely in .env.",
  },
  {
    name: "Hardcoded JSON Web Token (JWT)",
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    severity: "HIGH",
    remediation:
      "JWT tokens grant active session authentication; store in secure credential storage.",
  },
  {
    name: "Private Cryptographic Key",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
    severity: "CRITICAL",
    remediation:
      "Private keys should never be present in MCP configuration files. Use ssh-agent or external key files.",
  },
];

export class SecretScanner {
  public static scan(
    serverName: string,
    configFile: string,
    envObj: Record<string, any> = {},
    args: string[] = []
  ): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // Scan args for inline secrets
    for (const arg of args) {
      if (typeof arg !== "string") continue;
      this.checkString(arg, serverName, configFile, "arg", findings);
    }

    // Scan env object
    for (const [key, val] of Object.entries(envObj)) {
      if (typeof val !== "string") continue;

      // Check regex patterns
      const matched = this.checkString(
        val,
        serverName,
        configFile,
        `env.${key}`,
        findings
      );

      // Also check if key name looks like secret and value is raw plaintext
      if (!matched) {
        const lowerKey = key.toLowerCase();
        const isSecretName =
          lowerKey.includes("secret") ||
          lowerKey.includes("token") ||
          lowerKey.includes("api_key") ||
          lowerKey.includes("password") ||
          lowerKey.includes("passwd") ||
          lowerKey.includes("auth");

        const isTemplate =
          val.startsWith("${") ||
          val.startsWith("$") ||
          val.length < 8 ||
          val === "YOUR_KEY_HERE";

        if (isSecretName && !isTemplate) {
          findings.push({
            id: `sec-env-${serverName}-${key}`,
            serverName,
            configFile,
            category: "EXPOSED_SECRET",
            severity: "HIGH",
            title: `Hardcoded Secret in env: ${key}`,
            description: `Environment variable "${key}" appears to hold an unencrypted plaintext secret directly in ${configFile}.`,
            remediation: `Extract "${key}" to a local .env file or use dynamic variable substitution: "\${${key}}".`,
            detectedValue: this.redact(val),
          });
        }
      }
    }

    return findings;
  }

  private static checkString(
    text: string,
    serverName: string,
    configFile: string,
    context: string,
    findings: SecurityFinding[]
  ): boolean {
    let found = false;
    for (const rule of SECRET_PATTERNS) {
      rule.pattern.lastIndex = 0;
      const match = rule.pattern.exec(text);
      if (match) {
        found = true;
        const val = match[0];
        findings.push({
          id: `sec-${serverName}-${rule.name.toLowerCase().replace(/\s+/g, "-")}`,
          serverName,
          configFile,
          category: "EXPOSED_SECRET",
          severity: rule.severity,
          title: `Exposed ${rule.name} detected`,
          description: `Discovered a live ${rule.name} in ${context} within ${configFile}. Anyone with read access to this workspace can extract your API key.`,
          remediation: rule.remediation,
          detectedValue: this.redact(val),
        });
      }
    }
    return found;
  }

  private static redact(val: string): string {
    if (val.length <= 8) return "********";
    return val.slice(0, 4) + "..." + val.slice(-4);
  }
}
