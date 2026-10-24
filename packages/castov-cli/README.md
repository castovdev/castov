# castov — Official Developer CLI & MCP Server

[![npm version](https://img.shields.io/npm/v/castov.svg?color=2563eb)](https://www.npmjs.com/package/castov)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![MCP Certified](https://img.shields.io/badge/MCP-Certified%20Grade%20A-emerald.svg)](https://www.castov.com/mcp)
[![Zero Data Logging](https://img.shields.io/badge/Privacy-Zero--Data%20Logging-success.svg)](https://www.castov.com)

**Castov in your terminal & AI editors**: A high-performance, 100% offline-first developer toolkit. Includes a certified **Model Context Protocol (MCP)** server for Cursor and Claude Desktop, port conflict resolver (`castov port`), cryptographic secret generator (`castov secret`), IPv4 CIDR subnet calculator (`castov cidr`), local credential leak scanner (`castov scan`), and multi-stage workflow pipelines.

Zero behavioral telemetry. Zero remote cloud calls during local operations. Sub-millisecond execution.

---

## 🚀 Quick Run (No Installation Needed)

Run any command instantly via `npx`:

```bash
# Inspect and kill a process blocking a port
npx castov port 3000 --kill

# Generate cryptographic .env secrets
npx castov secret

# Start MCP Server for Cursor or Claude Desktop
npx -y castov mcp

# Calculate IPv4 CIDR subnet range
npx castov cidr 192.168.1.0/24

# Scan repository for leaked API keys before commit
npx castov scan .

# Decode and inspect a JWT
npx castov jwt <token>

# Parse cron expression and print next execution times
npx castov cron "*/15 * * * *"
```

Or install globally:

```bash
npm install -g castov
```

---

## 🔌 Model Context Protocol (MCP) Server for Cursor & Claude Desktop

Castov includes a built-in, local **Model Context Protocol (MCP)** server over standard I/O (`stdio`). It equips your AI assistants with **13 certified local developer tools** — including 3 multi-stage pipeline tools that perform compound operations in a single AI invocation.

### 1. Cursor IDE Setup
Add to your `~/.cursor/mcp.json` (or via Cursor Settings → Features → MCP Servers):

```json
{
  "mcpServers": {
    "castov": {
      "command": "castov",
      "args": ["mcp"]
    }
  }
}
```

### 2. Claude Desktop Setup
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "castov": {
      "command": "npx",
      "args": ["-y", "castov", "mcp"]
    }
  }
}
```

### Supported MCP Tools (13 Local Utilities)

| Tool Name | Type | Description |
|---|---|---|
| `castov_json_to_ts_pipeline` | **Pipeline** | Validates JSON/Base64, analyzes hierarchy, and generates strongly-typed TypeScript interfaces. |
| `castov_cron_timezone_pipeline` | **Pipeline** | Explains cron expressions and calculates upcoming runs matrix across UTC, EST, GMT, CET, and JST. |
| `castov_jwt_inspect_pipeline` | **Pipeline** | Decodes JWT, evaluates expiration status (`exp`, `iat`, `nbf`), remaining TTL, and security flags. |
| `castov_timestamp` | Core | Converts Unix timestamps (seconds or ms) to UTC, ISO 8601, and localized human time. |
| `castov_detect_id` | Core | Identifies and extracts timestamps from UUIDv7, ULID, MongoDB ObjectId, and Snowflake IDs. |
| `castov_cidr` | Core | Computes network address, subnet mask, wildcard mask, usable IP range, and host count. |
| `castov_port` | Core | Inspects standard IANA port allocations (TCP/UDP) and detects known service purposes. |
| `castov_cron` | Core | Explains 5-field cron syntax in human English and computes the next 5 runs in any timezone. |
| `castov_timezone` | Core | Converts dates between two IANA time zones with DST offset warnings. |
| `castov_secret` | Core | Generates CSPRNG secrets: 256-bit Hex, Base64URL, `sk_live_...` API keys, and UUIDv7. |
| `castov_jwt_decode` | Core | Decodes JWT header and payload locally without network calls. |
| `castov_hash` | Core | Computes sha256, sha384, sha512, sha1, md5, Base64, and Base64URL representations. |
| `castov_scan_secrets` | Core | Audits files or diffs for leaked AWS, Stripe, OpenAI, GitHub, Slack, and RSA keys. |

---

## 🔑 Workspace Authentication & CLI Linking

Synchronize your pinned utilities, developer defaults, and Zero-Knowledge Team Vaults across your machines:

```bash
# Interactive browser login flow (automatically opens https://castov.com/account?cli_auth=true)
castov login

# Direct authentication with Personal Access Token (PAT)
castov login --token cst_live_xxxxxxxxxxxxxxxx

# Check current active authentication session
castov whoami

# Logout and revoke local configuration
castov logout
```

---

## 💻 CLI Commands & Examples

### ⚡ Port Inspector & Process Killer
Find which process is occupying a port and kill it instantly:
```bash
castov port 3000
castov port 5432 --kill
```

### 🔐 Cryptographic Secret Generator
Generate cryptographically random secrets for `.env` files:
```bash
castov secret
castov secret --len 64
```

### 🌐 IPv4 CIDR Calculator
Calculate subnet topology, wildcard mask, and address ranges:
```bash
castov cidr 10.0.0.0/16
castov cidr /24
```

### 🛡️ Secret & Credential Leak Scanner
Audit codebases or configuration files for hardcoded secrets:
```bash
castov scan .
castov scan ./config.env
```

### 🕒 Unix Timestamp Converter
Auto-detects seconds (10-digit) vs milliseconds (13-digit):
```bash
castov ts 1713456789
castov ts now
```

### 🌍 IANA Timezone Converter
Convert datetime strings across international timezones with DST transition awareness:
```bash
castov tz "2026-06-15 14:00" "America/New_York" "Europe/Paris"
```

### 📅 Cron Explainer & Next Runs
```bash
castov cron "0 9 * * 1-5"
```

### 🆔 ID Format & Creation Timestamp Detector
Extract the exact embedded millisecond timestamp from modern identifiers:
```bash
castov detect 018e5f2a-7b3c-7890-a1b2-c3d4e5f6a7b8   # UUIDv7
castov detect 01ARZ3NDEKTSV4RRFFQ69G5FAV              # ULID
castov detect 507f1f77bcf86cd799439011                # MongoDB ObjectId
castov detect 1754890638571839488                     # Snowflake ID
```

### 🔑 Local Offline JWT Decoder
Inspect headers, claims, and payload without exposing tokens to web servers:
```bash
castov jwt eyJhbGciOiJIUzI1Ni...
```

### 🔤 Base64 & Cryptographic Hashing
```bash
castov hash "payload" --algorithm sha256
echo "hello world" | castov hash
castov b64 encode "hello world"
castov b64 decode "aGVsbG8gd29ybGQ="
```

---

## 🛡️ Security & Privacy Architecture

- **Zero Data Logging**: Your source code, queries, and generated secrets never leave your device.
- **Client-Side Cryptography**: Uses Node's built-in `crypto` module (WebCrypto compliant) with CSPRNG entropy.
- **Offline Reliability**: Every utility works completely offline (Airplane Mode compliant).

---

## 🌐 Ecosystem Links

- **Web Platform**: [https://www.castov.com](https://www.castov.com)
- **MCP Playground**: [https://www.castov.com/mcp](https://www.castov.com/mcp)
- **Developer Documentation**: [https://www.castov.com/developer](https://www.castov.com/developer)
- **GitHub Repository**: [https://github.com/castovdev/castov](https://github.com/castovdev/castov)

---

## 📄 License

MIT © [Castov](https://www.castov.com) — Abdelmalik Benidir
