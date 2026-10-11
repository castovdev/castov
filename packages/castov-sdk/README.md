# @castov/sdk

Zero-dependency, zero-server developer utilities from [Castov](https://castov.com).
Tree-shakeable, lightweight (~10 kB), and runs universally in **Node.js ≥ 20, Deno, Bun, Cloudflare Workers, and modern browsers**.

Built purely on the standard Web Crypto API and ECMAScript Intl APIs.

---

## Why @castov/sdk?

- **Zero Runtime Dependencies:** No dependency hell, no supply-chain vulnerabilities, zero bloat.
- **100% Local & Offline:** Never makes background HTTP requests or phones home. Safe for air-gapped environments and sensitive credentials.
- **Universal:** First-class support for ESM, CommonJS, TypeScript declarations, and Edge runtimes.
- **Accurate Time Math:** Built-in DST gap and overlap diagnostics for reliable scheduling across time zones.

---

## Installation

```bash
npm install @castov/sdk
```

---

## Quick Start

```ts
import { castov, ts, detect, cron, tz, uuid, uuidv7 } from '@castov/sdk';

// 1. Generate UUIDs
const id = uuidv7(); // '018bcfe5-6800-7d90-bc4e-2895f32a762c'

// 2. Parse timestamps with unit auto-detection
const timeInfo = ts(1700000000);
console.log(timeInfo.iso); // '2023-11-14T22:13:20.000Z'
```

CommonJS is fully supported:

```js
const { castov, ts, detect, cron, tz } = require('@castov/sdk');
```

---

## API Reference & Examples

### 1. `ts(value: string | number)`
Parses a Unix timestamp in seconds or milliseconds (auto-detects based on magnitude) and returns ISO, UTC, and local representations.

```ts
import { ts } from '@castov/sdk';

const res = ts(1700000000);
// {
//   unit: 'seconds',
//   seconds: 1700000000,
//   milliseconds: 1700000000000,
//   iso: '2023-11-14T22:13:20.000Z',
//   utc: 'Tue, 14 Nov 2023 22:13:20 GMT',
//   local: 'Tuesday, November 14, 2023 at 11:13:20 PM GMT+1',
//   date: Date
// }
```

---

### 2. `detect(value: string)`
Scans a string and identifies whether it matches any known timestamp or identifier format:
- Unix timestamp (seconds)
- Unix timestamp (milliseconds)
- MongoDB ObjectId (extracts embedded Unix seconds)
- Discord Snowflake (custom 2015 epoch)
- Twitter/X Snowflake (custom 2010 epoch)
- UUIDv7 (extracts 48-bit Unix millisecond timestamp)
- ULID (extracts 48-bit Crockford Base32 timestamp)

```ts
import { detect } from '@castov/sdk';

const matches = detect('018bcfe5-6800-7d90-bc4e-2895f32a762c');
console.log(matches[0].label); // 'UUIDv7'
console.log(matches[0].iso);   // '2023-11-14T22:13:20.000Z'

const oid = detect('507f1f77bcf86cd799439011');
console.log(oid[0].label);     // 'MongoDB ObjectId'
console.log(oid[0].iso);       // '2012-10-17T21:13:27.000Z'
```

---

### 3. `cron(expression: string, timezone?: string)`
Translates 5-field cron patterns into plain English and computes the next 5 run times in any specified IANA time zone (or system local time).

```ts
import { cron } from '@castov/sdk';

const schedule = cron('0 9 * * 1-5', 'America/New_York');
console.log(schedule.description);
// 'At 09:00, on Monday through Friday'

console.log(schedule.nextRuns[0]);
// {
//   timestampMs: 1791795600000,
//   iso: '2026-10-12T13:00:00.000Z',
//   local: '10/12/2026, 09:00:00 EDT',
//   utc: 'Mon, 12 Oct 2026 13:00:00 GMT'
// }
```

---

### 4. `tz(dateTime: string, fromZone: string, toZone: string)`
Converts dates between IANA time zones with automatic Daylight Saving Time (DST) gap and overlap detection.

```ts
import { tz } from '@castov/sdk';

// Standard conversion:
const res = tz('2026-10-11 14:00:00', 'America/New_York', 'Europe/Paris');
console.log(res.toFormatted); // '2026-10-11 20:00:00'
console.log(res.toOffset);    // 'UTC+02:00'

// DST Spring Forward Gap (nonexistent hour):
const gap = tz('2026-03-08 02:30:00', 'America/New_York', 'UTC');
console.log(gap.hasDstWarning); // true
console.log(gap.warning);
// 'Warning: "2026-03-08 02:30:00" does not exist in America/New_York due to a DST spring-forward gap (+60m)... Adjusted forward to 2026-03-08 03:30:00.'
```

---

### 5. `uuid()` & `uuidv7(timestampMs?)`

```ts
import { uuid, uuidv7 } from '@castov/sdk';

const v4 = uuid();   // 'e0a16fc4-52eb-4581-9b62-9e900c6183a6'
const v7 = uuidv7(); // '01927702-8bcf-7b32-84f1-bc1b22119f92' (time-sortable)
```

---

### 6. `base64Encode()` & `base64Decode()`

```ts
import { base64Encode, base64Decode } from '@castov/sdk';

const b64 = base64Encode('Castov 🚀', { url: true }); // 'Q2FzdG92IPCfmIA'
const text = base64Decode(b64);                       // 'Castov 🚀'
```

---

### 7. `hash(text: string, algorithm?: HashAlgorithm)`
Computes cryptographic digests using standard SubtleCrypto (`sha1`, `sha256`, `sha384`, `sha512`).

```ts
import { hash } from '@castov/sdk';

const digest = await hash('hello', 'sha256');
// '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
```

---

### 8. `jwtDecode(token: string)`
Decodes JWT header and payload locally without verifying signatures.

```ts
import { jwtDecode } from '@castov/sdk';

const { header, payload } = jwtDecode(token);
```

---

## License

MIT © [Castov](https://castov.com)
