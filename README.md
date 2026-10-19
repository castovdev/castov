# Castov

<p align="center">
  <a href="https://www.castov.com">
    <img src="https://raw.githubusercontent.com/castovdev/castov/main/public/logo.png?v=2" alt="Castov Logo" width="180" />
  </a>
</p>

<h3 align="center">The Open-Source AI Execution Layer & Zero-Telemetry Developer Suite</h3>

<p align="center">
  Deterministic local tooling for <strong>Claude Desktop</strong>, <strong>Cursor</strong>, <strong>Windsurf</strong>, and <strong>Local LLMs</strong> via the Model Context Protocol (MCP) — backed by a high-performance CLI, Docker image, IDE extension, and 63+ offline-first browser utilities.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/castov"><img src="https://img.shields.io/npm/v/castov.svg?style=flat-square&color=2563eb&label=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/castov"><img src="https://img.shields.io/npm/dw/castov?style=flat-square&color=2563eb&label=npm%20downloads" alt="npm downloads" /></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=Castov.castov-vscode"><img src="https://img.shields.io/visual-studio-marketplace/i/Castov.castov-vscode?style=flat-square&color=007acc&label=VS%20Code" alt="VS Code installs" /></a>
  <a href="https://open-vsx.org/extension/castov/castov-vscode"><img src="https://img.shields.io/open-vsx/dt/castov/castov-vscode?style=flat-square&color=7c3aed&label=Open%20VSX" alt="Open VSX" /></a>
  <a href="https://hub.docker.com/r/castovdev/castov"><img src="https://img.shields.io/badge/docker-castovdev%2Fcastov-blue?style=flat-square&logo=docker" alt="Docker Hub" /></a>
  <a href="https://glama.ai/mcp/servers/castovdev/castov"><img src="https://glama.ai/mcp/servers/castovdev/castov/badges/score.svg" alt="Castov MCP server Glama score" /></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-Protocol%202024--11--05-8b5cf6?style=flat-square" alt="MCP Protocol" /></a>
  <a href="#privacy--zero-telemetry"><img src="https://img.shields.io/badge/telemetry-zero%20tracking-10b981?style=flat-square" alt="Zero Telemetry" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" /></a>
</p>

---

## ⚡ What is Castov?

Modern AI agents and developer workflows suffer from two critical flaws:
1. **Agent Hallucinations on Exact Operations**: LLMs frequently blunder arithmetic for CIDR network masks, time zone offsets, epoch milliseconds, and cryptographic key derivations.
2. **Data & Secret Leakage**: Sending system logs, environment variables, or tokens to third-party cloud APIs presents unacceptable security hazards.

**Castov solves both.** It acts as an **in-situ Execution Layer** for developer environments. It provides deterministic, offline, and instant utilities delivered directly to your terminal, editor, Docker containers, and AI agents through the **Model Context Protocol (MCP)**.

Everything runs **100% locally**. No external analytics, no telemetry, and zero cloud roundtrips.

---

## 🤖 AI Agent Setup (Model Context Protocol - MCP)

Castov ships with a built-in, production-grade JSON-RPC 2.0 stdio MCP server supporting both `Content-Length` framed and `ndjson` stream protocols.

### 1. Claude Desktop
Add Castov to your `claude_desktop_config.json`:

* **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
* **Linux**: `~/.config/Claude/claude_desktop_config.json`

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

### 2. Cursor IDE & Windsurf
Go to **Settings** → **Features** → **MCP Servers** → **Add New MCP Server**:
* **Name**: `castov`
* **Type**: `command`
* **Command**: `npx -y castov mcp`

Alternatively, add to your project's `.cursor/mcp.json`:
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

### Native Tools Exposed to Agents (10 Tools — All 100% Local & Read-Only)
| MCP Tool | Capability | Example Agent Prompt |
|---|---|---|
| `castov_port` | Identifies listening services, protocol mappings, and inspects process collision | *"Why is port 3000 busy and what service uses it?"* |
| `castov_cidr` | Calculates IPv4 subnet masks, wildcard, broadcast, and usable host count | *"Calculate usable IP range and subnet mask for 10.240.0.0/22"* |
| `castov_detect_id` | Decodes embedded creation timestamps from UUIDv7, ULID, ObjectId, Snowflake | *"When was this MongoDB ObjectId or Snowflake ID created?"* |
| `castov_timestamp` | Bidirectional epoch conversion to ISO 8601, UTC, and localized representations | *"Convert 1713456789 to human UTC and ISO format"* |
| `castov_cron` | Parses 5-field cron schedules into plain English and computes next 5 runs | *"Explain cron `0 9 * * 1-5` and show the next 5 runs in `America/New_York`"* |
| `castov_timezone` | Converts timestamps across IANA time zones with DST transition warnings | *"Convert `2026-03-29 14:30` from `America/New_York` to `Europe/Paris`"* |
| `castov_secret` | Generates CSPRNG 256-bit Hex, Base64URL, API keys, and sortable UUIDv7 secrets | *"Generate a 256-bit cryptographic secret for `AUTH_SECRET` and `JWT_SECRET`"* |
| `castov_jwt_decode` | Decodes JWT headers, payloads, and `exp` status offline with zero network calls | *"Decode this JWT offline and check if it is expired"* |
| `castov_hash` | Computes SHA-256/384/512, SHA-1, MD5 digests and Base64/Base64URL encodings | *"Compute the SHA-256 hex digest and Base64URL encoding of this webhook payload"* |
| `castov_scan_secrets` | Audits code snippets, git diffs, or `.env` blocks for leaked API keys & private keys | *"Scan this git diff for any accidentally hardcoded AWS, Stripe, or OpenAI keys"* |

---

## 📦 Multi-Channel Distribution

Castov is available everywhere modern engineering happens:

### 1. Terminal CLI (Node.js / npm)
Run instantly without installation:
```bash
npx castov --help
```
Or install globally:
```bash
npm install -g castov
castov --help
```

### 2. Docker Container (Docker Hub)
Lightweight Alpine Linux container (`node:20-alpine`) running under a non-root `node` user:
```bash
# Run one-off command
docker run --rm castovdev/castov:latest uuid --v7

# Interactive diagnostic shell
docker run -it --rm castovdev/castov:latest
```

### 3. Homebrew Tap (macOS & Linux)
Install natively via Brew:
```bash
brew tap castovdev/castov
brew install castov

# Verify installation
castov --version
```

### 4. VS Code, Cursor & Windsurf Extensions
Install the official extension directly within your editor:
* **VS Code Marketplace**: Search `Castov` or install `Castov.castov-vscode`
* **Open VSX Registry**: Available for Cursor, Windsurf, VSCodium: `castov/castov-vscode`

```bash
# Command line installation
code --install-extension Castov.castov-vscode
```

### 5. GitHub Action (CI/CD Pipelines)
Automate security scans, secret leakage audits, and environment checks in your GitHub workflows:
```yaml
- name: Run Castov Secret Scanner
  uses: castovdev/castov-action@v1.0.0
  with:
    command: 'scan .'
```

---

## 🛠️ CLI Quickstart & Core Commands

```text
castov <command> [options]
```

### 🔍 Process & Port Manager (`EADDRINUSE` Killer)
Inspect what process is occupying a port or kill it cleanly:
```bash
# Inspect service and protocol
castov port 3000

# Inspect active process PID and terminate it immediately
castov port 3000 --kill
```

### 🔐 Cryptographic Secret Generator
Generate high-entropy keys for `.env`, `NEXTAUTH_SECRET`, JWT signing, and API authentication:
```bash
castov secret
castov secret --len 64
```

### 🌐 Subnet & CIDR Calculator
Calculate network masks, wildcard masks, and usable host ranges with zero external lookups:
```bash
castov cidr 192.168.1.0/24
castov cidr 10.0.0.0/16
```

### 🛡️ Local Secret Leak Scanner
Recursively scan local directories for committed or uncommitted API tokens (AWS, Stripe, OpenAI, GitHub, Private Keys):
```bash
castov scan .
```

### 🚑 Crash Log & Terminal Error Healer
Pipe terminal crashes or paste error stack traces for instant, deterministic remediation:
```bash
castov fix "Error: listen EADDRINUSE: address already in use :::8080"
npm run build 2>&1 | castov fix
```

### 🧠 AI Rules & System Prompt Generator
Bootstrap `.cursorrules` or `CLAUDE.md` with hardened engineering practices:
```bash
castov rules nextjs --write
castov rules fastapi
castov rules rust
```

### ⏱️ Universal ID & Timestamp Detector
Extract metadata and epoch timestamps from any modern distributed identifier:
```bash
castov detect 018e3a2b-8a5c-7b00-9821-654321abcdef
castov detect 507f1f77bcf86cd799439011
castov ts 1713456789
```

---

## 🌐 Complete Suite of 63 Developer Tools

In addition to the CLI and MCP Server, Castov provides 63 client-side web tools accessible at [castov.com](https://castov.com):

| Category | Featured Tools |
|---|---|
| **Security & Privacy** | Steganography Env Vault, Client-Side Secret Scanner, Zero-Knowledge Env Vault, Hash Generator (SHA-256/512/MD5), JWT Decoder, Base64 Encoder/Decoder, UUID v4/v7 Generator. |
| **Networking & DevOps** | EADDRINUSE Port Inspector, IPv4 CIDR Calculator, Dockerfile Visualizer, P2P Ghost Tunnel, Fetch Mock Generator, API Load Tester, DNS & Header Inspector. |
| **Data & Architecture** | JSON to TypeScript Type Generator, 3D JSON Galaxy, Interactive JSON Formatter & Viewer, SQLite In-Browser Fiddle, Line-by-Line Diff Checker, AST Conflict Telepathy. |
| **Frontend & UI** | Glassmorphism CSS Studio, App Mockup Generator, High-Resolution Code-to-Image Renderer, Favicon Generator, GitHub Profile README Builder. |
| **Time & Scheduling (25+ Tools)** | Unix Timestamp Converter, Epoch Converter, ISO 8601 & RFC 3339 Parser, Timezone Converter & Simulator, Plain-English Cron Generator & Explainer, World Clock, Business Hours Matrix, Milliseconds to Date. |

---

## 🔒 Privacy & Zero-Telemetry Guarantee

Engineering tools should never leak your IP, company secrets, or code snippets. 

* **0 Analytics or Tracking Cookies**: No PostHog, Google Analytics, or third-party telemetry scripts.
* **Offline First**: All cryptographic operations rely on the browser and runtime's native `SubtleCrypto` / Web Crypto API.
* **Air-Gap Compatible**: Both the CLI, Docker image, and web application can run in offline and restricted intranet environments.

---

## 💻 Local Development

Castov is built with **Next.js 16 (App Router)**, **TypeScript (Strict)**, and **Tailwind CSS v4**.

```bash
# 1. Clone repository
git clone https://github.com/castovdev/castov.git
cd castov

# 2. Install dependencies
npm install

# 3. Setup local environment
cp .env.example .env.local

# 4. Start development server
npm run dev

# 5. Build CLI and Web applications
npm run build
```

To run tests across packages:
```bash
npm run test
```

---

## 📄 License

Castov is open-source software licensed under the **[MIT License](./LICENSE)**. Free for personal, commercial, and enterprise usage.
