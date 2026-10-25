# 🚀 Castov Global Launch Playbook (Show HN, Product Hunt, Reddit, X)

This document contains ready-to-publish launch copy, technical positioning, timing recommendations, and community interaction guidelines to take Castov to a worldwide developer audience.

---

## 🎯 Best Launch Timing
- **Day of Week**: Tuesday or Wednesday (highest developer traffic globally).
- **Time**: 00:01 AM PT / 03:01 AM ET (for Product Hunt) and 08:00 AM ET / 12:00 PM UTC (for Hacker News & Reddit).

---

## 1. 🔶 Hacker News — "Show HN" Launch

### Post Title Options
- **Option A (Recommended - Technical & Direct)**:
  `Show HN: Castov – 61 client-side dev tools, zero payload logging, and a local MCP server`
- **Option B (Problem-focused)**:
  `Show HN: Castov – An offline, zero-tracking alternative to CyberChef and DevToys`
- **Option C (AI & Agent focus)**:
  `Show HN: Castov – Open-source local dev tools and MCP execution layer for Cursor/Claude`

### Post Body (Markdown)

```markdown
Hi HN,

I’m Abdelmalik, creator of Castov (https://www.castov.com).

Like many of you, I grew frustrated with having to paste sensitive strings, JWTs, private keys, and JSON payloads into random online converters that run dozens of third-party tracking scripts and log payloads to remote servers. At the same time, tools like CyberChef feel dated, and desktop apps like DevToys or Raycast are tied to specific operating systems.

We built Castov with three core rules:
1. 100% Client-Side Privacy: All operations (cryptographic hashing, AES-256-GCM vault, JWT decoding, UUID generation) run strictly in-browser via the Web Crypto API (`crypto.subtle`). Zero payload logging.
2. Cross-Environment Availability: Use it in your browser (61 tools), in your terminal (`npx castov`), or as a local Docker container (`castovdev/castov`).
3. Model Context Protocol (MCP) Support: Castov ships with an open, local JSON-RPC stdio MCP server (Grade A certified) so your AI coding agents in Cursor, Claude Desktop, and Windsurf can execute exact CIDR math, port inspections, and cron breakdowns without hallucinating.

Some popular tools included:
- EADDRINUSE Port Killer: Inspect and terminate blocked listening ports (`castov port 3000 --kill`).
- Zero-Knowledge Env Vault: Client-side AES-GCM encrypted .env sharing via URL hash fragment (#payload=...).
- Cyber Decoder: Multi-stage cyber forensics recipe engine with real-time Shannon entropy calculation.
- Offline JWT Inspector: Decodes headers, claims, expiration, and nbf without sending tokens over the wire.
- 3D JSON Galaxy & AST Telepathy: High-performance data visualizers built on WebGL.

GitHub (MIT): https://github.com/castovdev/castov
Web: https://www.castov.com
npm: https://www.npmjs.com/package/castov

I’d love to hear your feedback on the architecture, tool ergonomics, and what utilities you’d like to see next!
```

---

## 2. 🐱 Product Hunt Launch

### Headline & Tagline
- **Name**: Castov
- **Tagline**: The open-source AI execution layer & privacy-first dev suite
- **Categories**: Developer Tools, Open Source, Artificial Intelligence, Productivity

### Maker's First Comment

```text
Hey Product Hunt! 👋

I'm Abdelmalik, creator of Castov.

We all use developer utilities every day — timestamp converters, regex testers, JWT decoders, subnet calculators. But modern engineering teams face two huge issues:
1. Data Privacy: Sending proprietary tokens, secrets, or logs to web converters is a severe compliance risk.
2. AI Agent Hallucinations: When Claude or Cursor attempts to calculate subnet masks or verify complex cron expressions, LLMs often hallucinate arithmetic.

Castov solves both:
⚡ 61 In-Browser Web Tools running 100% client-side with native WebCrypto.
🤖 Local Model Context Protocol (MCP) Server for Cursor & Claude Desktop.
💻 Instant Terminal CLI via `npx castov` (port killer, secret generator, CIDR math).
🔒 Air-gap safe: Zero tracking, zero telemetry, zero server-side payload logging.

Everything is free and open-source under the MIT license. Check it out at https://www.castov.com or run `npx castov` in your terminal!

Looking forward to your questions and feedback! 🚀
```

---

## 3. 🔴 Reddit Tech Communities

### A. Subreddit: `r/webdev` & `r/programming`
**Title**: `We built Castov: An open-source, zero-tracking developer toolkit with 61 browser tools, a local CLI, and an MCP server`

**Body**:
```markdown
Most online developer utilities (converters, decoders, beautifiers) track your sessions or send your pasted payloads to backend analytics servers.

To fix this, we created **Castov** (https://www.castov.com) — an open-source (MIT) platform designed with a strict zero-knowledge architecture:

- **100% In-Browser Cryptography**: JWT decoding, AES-256-GCM vault, hashing (SHA-256/512/MD5), and Base64 run entirely via `window.crypto.subtle`.
- **Integrated Terminal CLI**: Run `npx castov` to kill processes on busy ports (`castov port 3000 --kill`), generate 256-bit secrets, or inspect CIDR subnets offline.
- **Certified MCP Server**: Plug it directly into Cursor or Claude Desktop (`npx -y castov mcp`) so your AI assistant can calculate deterministic math without hallucinating.
- **61 Web Utilities**: Timezone matrices, cron visualizer, JSON to TypeScript generator, in-browser SQLite WASM fiddle, and a line-by-line diff checker.

Code is available on GitHub: https://github.com/castovdev/castov

Feedback, bug reports, and tool suggestions are greatly appreciated!
```

### B. Subreddit: `r/ClaudeAI` & `r/Cursor`
**Title**: `Free local MCP server with 13 developer tools for Cursor & Claude Desktop (Port killer, CIDR, Secret Scanner, Cron)`

**Body**:
```markdown
If you use Cursor or Claude Desktop for engineering work, you might have noticed models sometimes hallucinating exact arithmetic (subnet ranges, cron next runs, timezone offsets, or generating weak random secrets).

You can connect **Castov MCP** with a single line:

**Cursor MCP Config (`~/.cursor/mcp.json`)**:
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

It gives your model access to 13 deterministic offline tools:
- `castov_port`: Checks what is running on a port and kills the PID.
- `castov_cidr`: Computes IPv4 subnet masks, broadcast, and usable host count.
- `castov_cron`: Parses cron schedules into English and calculates exact execution runs.
- `castov_secret`: Generates cryptographically secure CSPRNG keys.
- `castov_scan_secrets`: Scans local files or diffs for leaked API keys.

100% local, runs over stdio, and open-source (MIT): https://github.com/castovdev/castov
```

---

## 4. 🐦 X (Twitter) Launch Thread

**Tweet 1 (Hook)**:
> Today we’re launching Castov: The privacy-first developer execution layer.
>
> 61 client-side browser tools.
> A high-performance terminal CLI.
> A local MCP server for Claude & Cursor.
> 
> 100% offline-first. Zero telemetry. Zero payload logging.
> 
> 🔗 https://www.castov.com
> 🧵👇

**Tweet 2 (The Problem)**:
> We all use online dev tools daily.
> 
> But pasting JWTs, database URLs, and API keys into random websites is an unacceptable security hazard. Most tools log your payloads or track your IP.
> 
> Castov runs entirely inside your browser using the native Web Crypto API. Your data never leaves your device.

**Tweet 3 (The CLI)**:
> Need quick answers without leaving your terminal?
> 
> `npx castov port 3000 --kill` → kills stubborn EADDRINUSE processes.
> `npx castov secret` → generates 256-bit CSPRNG keys.
> `npx castov cidr 10.0.0.0/16` → instant subnet math.

**Tweet 4 (AI & MCP)**:
> Castov also includes a certified Grade-A Model Context Protocol (MCP) server.
> 
> Plug it into @cursor_run or Claude Desktop with one line:
> `npx -y castov mcp`
> 
> Give your AI deterministic tools for ports, cron, CIDR, and secret scanning.

**Tweet 5 (Open Source & Call to Action)**:
> Castov is 100% free and open-source under the MIT license.
> 
> ⭐ Star on GitHub: https://github.com/castovdev/castov
> 🌐 Try the tools: https://www.castov.com
> 📦 npm: `npx castov`
> 
> Built by @castovdev. RTs and feedback appreciated! 🚀
