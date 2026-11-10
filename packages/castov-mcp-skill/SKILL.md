---
name: Castov MCP DevSecOps
description: 13 deterministic local developer and security tools for AI agents. Run secret scans, JWT audits, CIDR subnetting, cron predictions, and crypto offline with zero data leaks.
version: 1.5.0
author: Castov
homepage: https://castov.com
repository: https://github.com/castovdev/castov
license: MIT
tags:
  - mcp
  - devsecops
  - security
  - secret-scanner
  - developer-tools
---

# Castov MCP — Local DevSecOps & Deterministic Tools for AI Agents

The **Castov MCP Server** equips AI agents (Claude Desktop, Cursor, Windsurf, Copilot, ChatGPT, Antigravity) with 13 deterministic, zero-latency local developer and security tools.

Instead of hallucinating network calculations, timezone offsets, or regex parsing, agents delegate sensitive computations to Castov's strictly offline, compiled algorithms.

## Security & Privacy Guarantee

- **Zero-Data Logging**: Operates 100% locally on your machine via stdio.
- **Zero Cloud Latency**: Responses return in under 2ms.
- **No Network Transmission**: Secrets, tokens, and payloads are never sent to external servers.

## Quick MCP Connection

Add Castov to your AI agent's MCP configuration:

### Claude Desktop / Cursor / Windsurf (`mcp.json` / `claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "castov": {
      "command": "npx",
      "args": ["-y", "castov@1.5.0", "mcp"]
    }
  }
}
```

*On Windows, if running via cmd wrapper:*
```json
{
  "mcpServers": {
    "castov": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "castov@1.5.0", "mcp"]
    }
  }
}
```

### Docker
```bash
docker run -i --rm ghcr.io/castovdev/castov:latest mcp
```

## Available Tools Catalog

### 1. In-Memory Secret & Credential Leak Scanner (`castov_scan_secrets`)
Audits code snippets, `.env` files, or terminal logs in-memory for leaked AWS keys, GitHub PATs, Stripe live keys, OpenAI keys, Slack tokens, and PEM private keys with redacted output.
- **Parameters**: `content` (string)
- **Use When**: Before committing code or when checking if sensitive credentials were leaked in logs.

### 2. Offline JWT Header & Claims Inspector (`castov_jwt_decode`)
Decodes JWT header and payload claims locally, formatting issued-at (`iat`), not-before (`nbf`), and expiration (`exp`) timestamps without sending tokens over the wire.
- **Parameters**: `token` (string)
- **Use When**: Validating authentication tokens, inspecting claims, or checking expiration.

### 3. JWT Security & Expiry Pipeline (`castov_jwt_inspect_pipeline`)
Decodes JWT claims, audits token lifetime, checks expiration threshold warnings, and validates algorithm signature strength completely offline.
- **Parameters**: `token` (string)

### 4. IPv4 CIDR & Subnet Calculator (`castov_cidr`)
Calculates exact IPv4 network address, subnet mask, wildcard mask, broadcast address, first/last usable host IPs, and total host capacity (including RFC 3021 `/31` and `/32`).
- **Parameters**: `cidr` (string, e.g. `10.240.0.0/22`)
- **Use When**: Setting up VPCs, firewalls, routing tables, and Kubernetes cluster CIDRs.

### 5. Cron Schedule Explainer & Next Run Predictor (`castov_cron`)
Parses 5-field POSIX cron expressions into human-readable descriptions and computes the exact next 5 execution timestamps in any IANA timezone.
- **Parameters**: `expression` (string), `timezone` (optional string)
- **Use When**: Verifying scheduled jobs, cron syntax, and DST-safe execution times.

### 6. Cron Multi-Timezone Pipeline (`castov_cron_timezone_pipeline`)
Parses a Cron expression and projects the next 5 execution timestamps across UTC, America/New_York, Europe/London, and Asia/Tokyo simultaneously.
- **Parameters**: `expression` (string), `timezone` (optional string)

### 7. CSPRNG Cryptographic Secret Generator (`castov_secret`)
Generates high-entropy cryptographic secrets (16 to 128 bytes) in Hex, Base64, Base64URL, and ready-to-use `.env` key formats via Node.js `crypto.randomBytes`.
- **Parameters**: `bytes` (optional number, e.g. `32` for 256-bit)
- **Use When**: Creating `AUTH_SECRET`, `JWT_SECRET`, database encryption keys, and session cookies.

### 8. Cryptographic Digest Calculator (`castov_hash`)
Computes deterministic cryptographic digests (MD5, SHA-1, SHA-256, SHA-384, SHA-512) in both hexadecimal and Base64 encodings.
- **Parameters**: `text` (string), `algorithm` (optional: `md5` | `sha1` | `sha256` | `sha384` | `sha512`)
- **Use When**: Generating webhook signatures, verifying file integrity, or hashing API payloads.

### 9. Port & Process Inspector (`castov_port`)
Identifies standard service registrations for TCP/UDP ports (1–65535) and inspects active local processes listening on the port across Linux, macOS, and Windows.
- **Parameters**: `port` (number)
- **Use When**: Debugging `EADDRINUSE` port conflicts when starting development servers.

### 10. Distributed ID & Timestamp Decoder (`castov_detect_id`)
Detects and extracts embedded creation timestamps from UUIDv7, UUIDv1/v4, ULID, MongoDB ObjectId, and Discord/Twitter Snowflake IDs.
- **Parameters**: `id` (string)
- **Use When**: Investigating database record timestamps, sorting events, or debugging distributed IDs.

### 11. Unix Epoch & ISO 8601 Converter (`castov_timestamp`)
Converts Unix epoch timestamps (seconds or milliseconds) or ISO date strings into UTC, ISO 8601, local time, and relative time offsets.
- **Parameters**: `value` (string)

### 12. IANA Timezone Converter (`castov_timezone`)
Converts dates, times, or timestamps accurately between any two IANA timezones with automatic DST offset calculation.
- **Parameters**: `dateTime` (string), `fromZone` (string), `toZone` (string)

### 13. JSON to TypeScript Pipeline (`castov_json_to_ts_pipeline`)
Decodes Base64/raw JSON, formats and validates syntax, and compiles complete TypeScript interfaces in a single roundtrip.
- **Parameters**: `json` (string), `rootInterfaceName` (optional string)

## Usage Instructions for Agents

1. When a user asks to scan, inspect, decode, or calculate any of the supported operations, **do not attempt mental arithmetic or regex approximations**.
2. Trigger the corresponding Castov MCP tool via stdio JSON-RPC.
3. Parse the structured JSON output and present the verified results directly to the user.
4. For all security-sensitive operations (JWT tokens, credentials, keys), remind the user that execution took place entirely on their local machine.
