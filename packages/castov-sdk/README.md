# @castov/sdk

Zero-dependency, zero-server developer utilities from [Castov](https://castov.com).
~6 kB, tree-shakeable, works in **Node.js ≥ 20, Deno, Bun, Cloudflare Workers and browsers** (built on the standard Web Crypto API).

```bash
npm install @castov/sdk
```

## Quick start

```ts
import { castov } from '@castov/sdk';

const id = castov.uuid();          // 'bde2b3f7-cf85-44a2-a596-5a6b1fc3cbfc'
```

CommonJS works too:

```js
const { castov } = require('@castov/sdk');
```

Or import only what you need (tree-shakeable):

```ts
import { uuid, uuidv7, nanoid } from '@castov/sdk';
```

## API

| Function | Description |
|---|---|
| `castov.uuid()` | RFC 9562 UUID v4 (native `crypto.randomUUID` when available) |
| `castov.uuidv7(ms?)` | UUID v7 — time-ordered, ideal for database primary keys |
| `castov.isUuid(value)` | Validates any UUID v1–v8 |
| `castov.nanoid(size = 21)` | URL-safe random ID |
| `castov.base64.encode(text, { url? })` | UTF-8 safe Base64 (optionally URL-safe) |
| `castov.base64.decode(b64)` | Decodes standard or URL-safe Base64 |
| `castov.unix()` | Current Unix timestamp (seconds) |
| `castov.unixToIso(ts)` | Unix (s or ms, auto-detected) → ISO 8601 |
| `castov.isoToUnix(iso)` | ISO 8601 → Unix seconds |
| `await castov.hash(text, algo = 'sha256')` | Hex digest: `sha1`, `sha256`, `sha384`, `sha512` |
| `castov.jwtDecode(token)` | Decodes header + payload locally (**does not verify** the signature) |

## CLI

Prefer the terminal? `npm install -g castov-cli` then `castov uuid`.

## License

MIT © Castov
