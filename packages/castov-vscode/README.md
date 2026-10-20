# Smart Hover Pack, UUID, Secrets & MCP – Castov (VS Code Extension)

Instant developer tooltips on hover (Unix Timestamp, Cron, Chmod, CIDR), 1-click MCP Server setup for Cursor/VS Code, UUID v4/v7 generation, cryptographic Hashing (SHA-256/MD5), Secrets, JWT inspection & Base64 conversions right inside Visual Studio Code & Cursor IDE.

No behavioral telemetry, zero external dependencies, instant local execution.

Powered by [Castov.com](https://castov.com).

---

## ✨ Features

### 1. 🔍 Smart Hover Pack (Context-Aware Tooltips)
- **⏱️ Unix Timestamp Hover:** Hover over any 10-digit (seconds) or 13-digit (milliseconds) timestamp in code, logs, or JSON files to see the human-readable UTC and local date instantly.
- **⏲️ Cron Schedule Hover:** Hover over standard 5-part cron expressions (e.g. `*/15 * * * *`, `0 0 * * *`) in config files, workflows, or code to read plain-English descriptions and see upcoming execution times.
- **🛡️ Chmod Permissions Hover:** Hover over octal permissions (e.g. `755`, `644`, `777`, `0755`) inside Shell scripts, Dockerfiles, or YAML files to view an intuitive permission matrix (Owner, Group, Others with `rwx` details).
- **🌐 CIDR Subnet Calculator Hover:** Hover over IPv4 CIDR blocks (e.g. `192.168.1.0/24`, `10.0.0.0/16`) to view Netmask, Wildcard mask, usable host range, broadcast address, and network classification.

### 2. ⚡ Developer Utility Commands
- **🆔 UUID v4 & v7 Generation:** Insert standard cryptographically random UUID v4 or time-ordered UUID v7 directly at your cursor.
- **🔑 Cryptographic Secret Generator:** Generate secure Hex (32/64 chars), Base64, or high-entropy alphanumeric API keys & secrets for `.env` files.
- **#️⃣ Hash Selection:** Hash selected text using **SHA-256**, **SHA-512**, **MD5**, or **SHA-1** directly in-place or copy to clipboard.
- **🔐 JWT Inspector:** Select any JSON Web Token, right-click, and inspect its decoded Header, Payload, and expiration status in a dedicated Output Channel.
- **🔗 URL & Base64 Encoders:** Quick Base64 and URL (`encodeURIComponent` / `decodeURIComponent`) encoding/decoding.
- **🤖 1-Click MCP Server Setup:** Instantly write Castov MCP configuration into `.cursor/mcp.json` or `.vscode/mcp.json`.

---

## ⌨️ Commands & Shortcuts

Open the Command Palette (`Ctrl+Shift+P` on Windows/Linux or `Cmd+Shift+P` on macOS) and type **Castov**:

| Command | Description |
| :--- | :--- |
| `Castov: Setup MCP Server (Cursor / VS Code)` | Auto-configures `.cursor/mcp.json` or `.vscode/mcp.json` |
| `Castov: Insert UUID v4` | Generates and inserts a cryptographically secure UUID v4 |
| `Castov: Insert UUID v7` | Generates a chronological time-ordered UUID v7 |
| `Castov: Insert Current Unix Timestamp` | Choose seconds or milliseconds to insert at cursor |
| `Castov: Hash Selection` | Hash selected text (SHA-256, SHA-512, MD5, SHA-1) |
| `Castov: Generate Secure Secret / API Key` | Generate high-entropy hex/base64/alphanumeric secrets |
| `Castov: Convert Selected Timestamp to Date` | Converts selected number to ISO/Local date |
| `Castov: Decode Selected JWT Token` | Inspects token payload, claims, and validity |
| `Castov: Base64 Encode Selection` | Encodes text to Base64 |
| `Castov: Base64 Decode Selection` | Decodes Base64 to text |
| `Castov: URL Encode Selection` | Encodes text using encodeURIComponent |
| `Castov: URL Decode Selection` | Decodes URL encoded text |
| `Castov: Open castov.com in Browser` | Opens the Castov developer toolbox |

---

## 🖱️ Editor Context Menu

Select text in any file and right-click to find:
- **Castov: Convert Selected Timestamp to Date**
- **Castov: Decode Selected JWT Token**
- **Castov: Hash Selection (SHA-256, SHA-512, MD5, SHA-1)**
- **Castov: Base64 Encode Selection**
- **Castov: Base64 Decode Selection**
- **Castov: URL Encode Selection**
- **Castov: URL Decode Selection**

---

## 🌐 Web & CLI Tools

Need deeper analysis, timezone comparisons, cron schedule visualizers, or Linux chmod calculations?
Visit **[castov.com](https://castov.com)** or install our CLI:

```bash
npm install -g castov-cli
castov --help
```

---

## 📄 License

MIT © [Castov](https://castov.com)
