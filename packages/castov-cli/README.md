# castov-cli

Fast, offline developer utilities right in your terminal. Zero telemetry, zero cloud calls, zero configuration. Powered by [`@castov/sdk`](https://www.npmjs.com/package/@castov/sdk).

## Why castov-cli?

- **100% Offline & Private:** Never sends your timestamps, tokens, IDs, or inputs over the internet.
- **Zero Bloat:** Single tiny dependency (`@castov/sdk`), starts in milliseconds.
- **Cross-Platform:** Works seamlessly across Linux, macOS, and Windows.
- **Composable:** Clean raw outputs when piping or scripting; automatic `NO_COLOR` detection.
- **DST-Aware:** Handles Daylight Saving Time gaps and overlaps with clear diagnostic warnings.

---

## Installation

Install globally:

```bash
npm install -g castov-cli
```

Or run directly without installing:

```bash
npx castov-cli <command>
```

---

## Commands & Examples with Real Output

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

### 11. `castov chmod` (Linux Permissions Breakdown)
Translates between octal codes (e.g. `755`) and symbolic notation (`rwxr-xr-x`) with verbal descriptions and security audits.

```bash
castov chmod 755
```
```text
Octal:     755 (0755)
Symbolic:  rwxr-xr-x
Owner:     Read, Write, Execute (rwx)
Group:     Read, Execute (r-x)
Public:    Read, Execute (r-x)
Command:   chmod 755 <file>
```

Also supports symbolic inputs:
```bash
castov chmod rwxr-xr-x
```

---

### 12. `castov diff` (Date & Timestamp Difference)
Calculates exact time difference between two dates or timestamps with human breakdown.

```bash
castov diff 2026-01-01 2026-10-11
```
```text
Start:       2026-01-01T00:00:00.000Z
End:         2026-10-11T00:00:00.000Z
Difference:  283 days, 0 hours, 0 minutes
Total days:  283
Total hours: 6792
Total ms:    24451200000
```

---

### 13. `castov duration` (Human-Readable Duration)
Converts raw milliseconds into concise, human-readable units.

```bash
castov duration 3661000
```
```text
1h 1m 1s
```

---

### 14. `castov color` (Color Converter & WCAG Contrast)
Converts Hex/RGB into RGB, HSL, and evaluates WCAG AA/AAA contrast ratios against white and black.

```bash
castov color "#2563eb"
```
```text
Hex:        #2563eb
RGB:        rgb(37, 99, 235)
HSL:        hsl(221, 83%, 53%)
Contrast:   vs white 4.54:1 | vs black 4.62:1
Best Text:  #ffffff
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
