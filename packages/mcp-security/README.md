# MCP Config Security Scanner – Castov (VS Code Extension)

Security audit and vulnerability scanner for Model Context Protocol (MCP) server configurations (`mcp.json`, `claude_desktop_config.json`, and `.cursor/mcp.json`). Detects exposed API keys, dangerous shell commands, root execution, and hidden prompt injection.

Zero external dependencies, instant local execution, zero telemetry.

Powered by [Castov.com](https://castov.com).

---

## ✨ Features

### 1. 🔑 Exposed API Keys & Secret Leaks
- **Deep Token Scanner:** Scans inline command arguments, environment variables, and config payloads for live credentials.
- **Recognized Credentials:**
  - OpenAI API Keys (`sk-...`)
  - Anthropic Claude API Keys (`sk-ant-...`)
  - Google Gemini API Keys (`AIza...`)
  - AWS Access Keys (`AKIA...`)
  - GitHub Personal Access Tokens (`ghp_...`, `github_pat_...`)
  - Slack Bot / User Tokens (`xoxb-...`, `xoxp-...`)
  - Hardcoded JSON Web Tokens (JWT) & Private Keys

### 2. ⚡ Dangerous Command & System Tampering Detection
- **Shell Interpreter Abuse:** Flags servers launched directly via `bash`, `sh`, `zsh`, `cmd.exe`, or `powershell` which permit arbitrary remote command execution.
- **Code Injection (`-e` / `-c`):** Detects inline execution flags in `node -e` or `python -c`.
- **Root / Sudo Escalation:** Detects `sudo` or `doas` commands running MCP servers under superuser authority.
- **Docker Privileged Container Flag:** Flags `--privileged` or root host mounts (`-v /:/`).

### 3. 🛡️ Adversarial Prompt Injection Guard
- Inspects MCP server arguments and tool descriptions for prompt injection phrases, jailbreak instructions, and system override attempts (`ignore previous instructions`, `override system prompt`, `bypass safety filters`).

### 4. 📊 Security Posture Rating (A+ to F)
- Calculates a granular security score (0 to 100) and letter grade for every configured server and your entire workspace.
- Highlights actionable remediation guides to fix configuration flaws in seconds.

---

## ⌨️ Commands

| Command | Description |
| :--- | :--- |
| `MCP Security: Open Security Audit Dashboard` | Opens the full visual MCP security report & server inspector |
| `MCP Security: Scan All MCP Configs` | Triggers a fresh audit across workspace & desktop MCP configurations |

---

## 📄 License

MIT © [Castov](https://castov.com)
