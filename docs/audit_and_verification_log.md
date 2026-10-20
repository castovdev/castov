# Castov Audit & Verification Log (Internal Proof of Build & Deployment)

**Project:** Castov (`https://castov.com`)  
**Repository:** `https://github.com/castovdev/castov`  
**Date & Time:** 2026-10-20T13:56:00+01:00  

---

## 1. Summary of Unified Site Facts

1. **Browser Developer Tools:** Exactly **61 interactive browser tools** (33 Developer + 10 experimental Labs + 7 Timestamps + 6 Timezones + 5 Date & Duration). All vague numbers (`63+`, `29+`, `55+`) eliminated.
2. **Error Fix Guides:** Exactly **69 interactive root-cause and fix guides** (54 core in `error-fixes-registry.ts` + 15 in `error-fixes-terminal.ts`), each generating a static SSG page at `/error-fixes/[slug]`.
3. **MCP Server & Local Tools:** Exactly **10 local MCP tools** operating over STDIO JSON-RPC 2.0 with Glama Grade-A specification (`v1.4.0`):
   - `castov_port`
   - `castov_cidr`
   - `castov_detect_id`
   - `castov_timestamp`
   - `castov_cron`
   - `castov_timezone`
   - `castov_secret`
   - `castov_jwt_decode`
   - `castov_hash`
   - `castov_scan_secrets`
   All references to `castov_uuid` have been completely eliminated across the codebase, UI, and live site.
4. **P2P & WebRTC Architecture:**
   - **P2P Ghost Tunnel (`/p2p-ghost-tunnel`):** Serverless WebRTC data channels using Google public STUN (`stun.l.google.com:19302`) for ICE/NAT discovery with manual Base64 copy-paste token exchange. Zero signaling servers, zero payload retention.
   - **Developer Canvas (`/canvas`):** Multi-peer local-first CRDT synchronization via `y-webrtc` connecting to public community signaling servers (`wss://signaling.yjs.dev`). Signaling servers may receive connection metadata (IP/ICE candidates), but never receive or store workflow graphs, node content, or payloads.
5. **Privacy & Telemetry Disclosures:** Replaced absolute claims (`Zero Server Logs`, `Zero Telemetry`, `Zero-Telemetry Stdio`) with verified technical precision: *"No payload logging and no behavioral telemetry. Standard infrastructure logs and aggregate analytics may apply."* All active source files and live UI strictly adhere to this rule.

---

## 2. Technical Verification Records & Exit Codes

### A. TypeScript Typecheck
- **Command:** `npm run typecheck` (`tsc --noEmit`)
- **Status:** PASSED (Exit Code: `0`)
- **Output:**
  ```text
  > castov@1.4.0 typecheck
  > tsc --noEmit

  EXIT_CODE: 0
  ```

### B. Secret & Security Scanner
- **Command:** `node scripts/action-scanner.cjs`
- **Status:** PASSED (Exit Code: `0`)
- **Output:**
  ```text
  Scanning directory: ....
  Scanned 475 files.
  ✅ 0 leaked secrets or high-risk tokens detected.
  EXIT_CODE: 0
  ```

### C. Full Production Build (SSG)
- **Command:** `npm run build` (`next build` with Next.js 16.3.5 Turbopack)
- **Status:** PASSED (Exit Code: `0`)
- **Routes Generated:** 1,095 / 1,095 static pages
- **Key Output:**
  ```text
  ✓ Compiled successfully in 2.4min
    Running TypeScript ...
    Finished TypeScript in 45s ...
    Collecting page data using 3 workers ...
  ✓ Generating static pages using 3 workers (1095/1095) in 4.6min
    Finalizing page optimization ...

  Command exited with code 0.
  ```

### D. Git Commit & Push Trail
- `313932c`: `chore(audit): unify tool counts, clarify client-side and telemetry disclosures, and fix metadata inconsistencies` (15 files modified)
- `3bd1cd8`: `fix(privacy): accurately differentiate P2P Ghost Tunnel (STUN + manual exchange) from Developer Canvas (Yjs public signaling)` (7 files modified)
- `f71dea8`: `fix(privacy): accurately differentiate payload data from connection metadata in Privacy Policy and Canvas` (3 files modified)
- `400f635`: `docs(privacy): clarify public signaling server IP/ICE metadata vs zero payload storage` (1 file modified)
- `7442391`: `fix(mcp): remove stale castov_uuid from live playground so UI, page, CLI and llms files list the same 10 tools` (1 file modified)
- `5b1338f`: `fix(mcp): replace all remaining zero-telemetry references with no behavioral telemetry across repo` (19 files modified)
- **Remote:** Pushed cleanly to `https://github.com/castovdev/castov.git` (`origin/main`).
- **Working Tree:** Clean (`git status --short` returns empty).

### E. Live Deployment Verification (Confirmed against https://www.castov.com)
- **Target URL:** `https://www.castov.com/mcp`
  - `castov_uuid`: **0 occurrences** (Fully eliminated from static HTML & JS bundle).
  - `castov_hash`: **4 occurrences** (Verified present in tools list, schema, code samples).
  - `zero-telemetry`: **0 occurrences** (Eliminated).
  - `no behavioral telemetry`: **10 occurrences** (Verified present).
- **Target URL:** `https://www.castov.com/llms.txt`
  - `castov_uuid`: **0 occurrences**
  - `castov_hash`: **1 occurrence**
- **Target URL:** `https://www.castov.com/llms-full.txt`
  - `castov_uuid`: **0 occurrences**
  - `castov_hash`: **2 occurrences**
