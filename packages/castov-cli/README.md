# castov (Official Castov CLI)

Fast, 100% offline developer utilities right in your terminal: **EADDRINUSE port killer (`castov port`)**, **cryptographic `.env` secret generator (`castov secret`)**, **IPv4 CIDR subnet calculator (`castov cidr`)**, **local secret scanner (`castov scan`)**, **terminal error healer (`castov fix`)**, **AI `.cursorrules` generator (`castov rules`)**, **MCP server (`castov mcp`)**, Unix timestamps, ID detector, cron explainer, IANA timezone converter, UUID v4/v7, and JWT decoding.

Zero telemetry, zero cloud calls, zero configuration. Powered by [Castov.com](https://www.castov.com) and [`castov-sdk`](https://www.npmjs.com/package/castov-sdk).

## Installation & Quick Run

Run instantly with `npx` (no installation needed):

```bash
npx castov port 3000 --kill
npx castov secret
npx castov cidr 192.168.1.0/24
npx castov scan .
npx castov rules nextjs --write
npx castov fix "EADDRINUSE: address already in use :::3000"
npx -y castov mcp
```

Or install globally:

```bash
npm install -g castov
```

---

## Flagship Terminal Commands

### ⚡ `castov port <port> [--kill]` (Inspect & Kill Occupying Port Process)
Check which service uses a port, detect active listening PIDs on Windows/macOS/Linux, and optionally terminate the process:
```bash
npx castov port 3000
npx castov port 3000 --kill
```

### 🔐 `castov secret` (Cryptographic `.env` Secret Generator)
Generate 256-bit Hex, Base64URL, `sk_live_` API keys, and sortable UUIDv7 secrets ready for `AUTH_SECRET` / `JWT_SECRET`:
```bash
npx castov secret
```

### 🌐 `castov cidr <ip/prefix>` (IPv4 Subnet Calculator)
Calculate subnet mask, wildcard mask, network/broadcast address, and usable host IP range:
```bash
npx castov cidr 192.168.1.0/24
```

### 🛡️ `castov scan [dir]` (Offline Secret & API Key Leak Scanner)
Scan your repository before `git push` for hardcoded AWS, OpenAI, Stripe, GitHub, Slack, or RSA private keys:
```bash
npx castov scan .
```

### 🤖 `castov rules <stack> [--write]` (`.cursorrules` & AI Guidelines)
Generate battle-tested `.cursorrules` directly in your workspace:
```bash
npx castov rules nextjs --write
```

### 🔌 `castov mcp` (Model Context Protocol Server for Claude & Cursor)
Castov includes a built-in, local **Model Context Protocol (MCP)** server over standard I/O (stdio) to equip AI assistants (like Claude Desktop and Cursor) with offline developer tools (`castov_timestamp`, `castov_detect_id`, `castov_cidr`, and `castov_port`).

#### Transport & Specifications
- **Dual Transport Support**: Automatically detects and handles both **Newline-Delimited JSON (ndjson)** (single JSON line per message) and **Framed MCP Transport** (`Content-Length: <bytes>\r\n\r\n` headers).
- **Symmetric Responses**: Always replies using the exact transport mode initiated by the client.
- **Safety Limits**: Bounded buffers with a strict maximum payload size of **4 MiB** and header limit of **8 KiB**.

#### Setup with Claude Desktop
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

#### Setup with Cursor
In Cursor Settings → Features → MCP Servers → Add New MCP Server:
- **Type**: `command`
- **Command**: `npx -y castov mcp`

---

## Core Time, ID & Crypto Commands

### 1. `castov ts` (Unix Timestamp Inspector)
Auto-detects seconds vs. milliseconds and prints UTC, ISO 8601, and local representations.

```bash
castov ts 1700000000
```
```text
UTC:      Tue, 14 Nov 2023 22:13:20 GMT
ISO 8601: 2023-11-14T22:13:20.000Z
Local:    Tuesday, November 14, 2023 at 11:13:20 PM GMT+1
```

Supports piped input:
```bash
echo "1700000000123" | castov ts
```
```text
UTC:      Tue, 14 Nov 2023 22:13:20 GMT
ISO 8601: 2023-11-14T22:13:20.123Z
Local:    Tuesday, November 14, 2023 at 11:13:20 PM GMT+1
```

---

### 2. `castov detect` (ID & Timestamp Detector)
Identifies Unix timestamps, MongoDB ObjectIds, Discord/Twitter Snowflakes, UUIDv7, and ULIDs, extracting and decoding their embedded timestamps.

```bash
castov detect 018bcfe5-6800-7d90-bc4e-2895f32a762c
```
```text
Detected 1 format for "018bcfe5-6800-7d90-bc4e-2895f32a762c":
  • UUIDv7: 2023-11-14T22:13:20.000Z (UTC: Tue, 14 Nov 2023 22:13:20 GMT)
```

```bash
castov detect 507f1f77bcf86cd799439011
```
```text
Detected 1 format for "507f1f77bcf86cd799439011":
  • MongoDB ObjectId: 2012-10-17T21:13:27.000Z (UTC: Wed, 17 Oct 2012 21:13:27 GMT)
```

```bash
castov detect 01ARZ3NDEKTSV4RRFFQ69G5FAV
```
```text
Detected 1 format for "01ARZ3NDEKTSV4RRFFQ69G5FAV":
  • ULID: 2016-07-30T23:54:10.259Z (UTC: Sat, 30 Jul 2016 23:54:10 GMT)
```

```bash
castov detect 841126781289193472
```
```text
Detected 2 formats for "841126781289193472":
  • Snowflake (Discord epoch)   : 2021-05-10T01:37:32.039Z (UTC: Mon, 10 May 2021 01:37:32 GMT)
  • Snowflake (Twitter epoch)   : 2017-03-13T03:20:26.696Z (UTC: Mon, 13 Mar 2017 03:20:26 GMT)
```

---

### 3. `castov cron` (Cron Explainer & Next Runs)
Explains 5-field cron patterns in plain English and calculates the next 5 executions in any IANA time zone.

```bash
castov cron "0 9 * * 1-5" "America/New_York"
```
```text
Schedule:  At 09:00, on Monday through Friday
Timezone:  America/New_York

Next 5 runs:
  1. 10/12/2026, 09:00:00 EDT (2026-10-12T13:00:00.000Z)
  2. 10/13/2026, 09:00:00 EDT (2026-10-13T13:00:00.000Z)
  3. 10/14/2026, 09:00:00 EDT (2026-10-14T13:00:00.000Z)
  4. 10/15/2026, 09:00:00 EDT (2026-10-15T13:00:00.000Z)
  5. 10/16/2026, 09:00:00 EDT (2026-10-16T13:00:00.000Z)
```

---

### 4. `castov tz` (Time Zone Converter with DST Diagnostics)
Converts dates across IANA time zones and detects Daylight Saving Time gaps (skipped hours) and overlaps (repeated hours).

Standard conversion:
```bash
castov tz "2026-10-11 14:00:00" America/New_York Europe/Paris
```
```text
From:     2026-10-11 14:00:00 America/New_York (EDT, UTC-04:00)
To:       2026-10-11 20:00:00 Europe/Paris (CEST, UTC+02:00)
ISO 8601: 2026-10-11T18:00:00.000Z
```

DST Spring Forward Gap handling:
```bash
castov tz "2026-03-08 02:30:00" America/New_York UTC
```
```text
From:     2026-03-08 03:30:00 America/New_York (EDT, UTC-04:00)
To:       2026-03-08 07:30:00 UTC (UTC, UTC+00:00)
ISO 8601: 2026-03-08T07:30:00.000Z

⚠ Warning: "2026-03-08 02:30:00" does not exist in America/New_York due to a DST spring-forward gap (+60m). Clocks skipped this time. Adjusted forward to 2026-03-08 03:30:00.
```

---

### 5. `castov uuid` (UUID v4 & v7 Generator)

```bash
castov uuid
```
```text
c678a1be-710c-43f2-8929-43c22adfdc3b
```

Generate multiple uppercase time-ordered UUIDv7s:
```bash
castov uuid -n 3 --v7 --upper
```
```text
01927702-8BCF-7B32-84F1-BC1B22119F92
01927702-8BD0-7B32-9F12-40292CD126A3
01927702-8BD1-7B32-AE94-43282914DF39
```

---

### 6. `castov nanoid` (URL-Safe Random IDs)

```bash
castov nanoid 24
```
```text
V1StGXR8_Z5jdHi6B-myT
```

---

### 7. `castov encode` & `castov decode` (Base64)
Full UTF-8 support including non-Latin scripts and emoji.

```bash
castov encode "Hello World 🚀"
```
```text
SGVsbG8gV29ybGQg8J+agA==
```

```bash
castov decode "SGVsbG8gV29ybGQg8J+agA=="
```
```text
Hello World 🚀
```

---

### 8. `castov hash` (Cryptographic Hashes)

```bash
castov hash "password123" -a sha256
```
```text
ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
```

---

### 9. `castov now` & `castov unix`

```bash
castov now
```
```text
1791728400
2026-10-11T16:20:00.000Z
```

```bash
castov unix 1700000000
```
```text
2023-11-14T22:13:20.000Z
```

---

### 10. `castov jwt` (Local JWT Decoder)
Decodes payload and header without sending tokens to any external server.

```bash
castov jwt "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIn0.signature"
```
```json
{
  "header": {
    "alg": "HS256"
  },
  "payload": {
    "sub": "1234567890",
    "name": "Alice"
  },
  "signature": "signature"
}
```

---

## Help & Documentation

Every command features built-in help flags:

```bash
castov --help
castov ts --help
castov detect --help
castov cron --help
castov tz --help
castov uuid --help
```

---

## License

MIT © [Castov](https://castov.com)
