# MCP Inspector & Debugger – Castov (VS Code Extension)

Inspect, debug, test, audit, and log Model Context Protocol (MCP) servers directly inside Visual Studio Code and Cursor IDE.

No external web browsers needed, zero bloat, native STDIO JSON-RPC 2.0 communication.

Powered by [Castov.com](https://castov.com/mcp).

---

## ✨ Features

### 1. 🔍 Auto-Discovery of MCP Servers
- Automatically detects servers defined in:
  - `.cursor/mcp.json`
  - `.vscode/mcp.json`
  - Local workspace `mcp.json`
  - Claude Desktop config (`claude_desktop_config.json` on Windows, macOS, Linux)
- Live file watcher automatically reloads server lists when configuration files change.

### 2. ⚡ Interactive Tool Tester & Form Generator
- Dynamic UI generated automatically from the tool's JSON Schema (`inputSchema.properties`).
- Supports booleans, numbers, strings, and JSON objects/arrays.
- One-click tool execution (`tools/call`) over STDIO JSON-RPC 2.0 with formatted JSON responses and real-time execution latency (`⏱️ 35ms`).

### 3. 📡 Real-Time JSON-RPC Traffic Logger
- View raw JSON-RPC 2.0 messages passing between VS Code and the server in real-time.
- Tracks method names, timestamps, execution latency, and full request/response payloads.

### 4. 🛡️ MCP Security Audit & Vulnerability Scanner
- **Exposed Secret Detection:** Catches hardcoded API keys in plain text `args` or `env` (OpenAI `sk-...`, Anthropic `sk-ant-...`, GitHub `ghp_...`, AWS keys).
- **Dangerous System Privileges:** Flags unrestricted shells (`bash`, `cmd.exe`, `powershell`), `sudo` elevation, and remote script pipes (`curl | sh`).
- **Prompt Injection Defense:** Scans tool descriptions for jailbreak and system hijacking patterns (e.g. "Ignore previous instructions", "SYSTEM PROMPT:").

---

## ⌨️ Commands

| Command | Description |
| :--- | :--- |
| `MCP: Open Interactive Inspector & Tester` | Opens the full-featured Webview Playground |
| `MCP: Refresh & Discover Servers` | Rescans workspace and global paths for MCP servers |
| `MCP: Run Security Audit on Configs` | Audits server configs and tool definitions for vulnerabilities |
| `MCP: Test Selected Tool` | Jumps directly to testing a specific tool from the sidebar |

---

## 🚀 Quick Start

1. Install `mcp-inspector` in VS Code or Cursor.
2. Open any workspace with a `.cursor/mcp.json` or `.vscode/mcp.json`.
3. Click the **MCP Inspector** icon in the Activity Bar or press `Ctrl+Shift+P` -> `MCP: Open Interactive Inspector & Tester`.
4. Select your server, pick a tool, fill in test parameters, and press **Execute Tool**!

---

## 📄 License

MIT © [Castov](https://castov.com)
