# Castov Audit Security Rules (`CAS-001` – `CAS-016`)

This document defines the canonical, immutable rule identifiers, severities, and descriptions for `castov audit`.

> **Stability Guarantee:** Rule identifiers (`CAS-001` through `CAS-016`) are locked and permanent. Existing IDs will never be reassigned to different checks.

---

## Rule Summary Table

| Rule ID | Title | Default Severity | SARIF Security Severity | Category |
| :--- | :--- | :---: | :---: | :--- |
| **`CAS-001`** | Hardcoded Secret in Server Config | `critical` / `high` | `9.5` | Secrets & Credentials |
| **`CAS-002`** | Unpinned Runtime Launcher | `medium` | `5.5` | Supply Chain |
| **`CAS-003`** | Shell Wrapper or Embedded Script | `high` | `8.5` | Command Injection |
| **`CAS-004`** | Remote Server Security & Data Flow | `high` / `medium` / `info` | `7.5` | Network & Transport |
| **`CAS-005`** | Broad Filesystem Scope | `high` | `8.0` | Least Privilege |
| **`CAS-006`** | Docker Container Risks | `critical` / `high` | `9.8` | Container Isolation |
| **`CAS-007`** | Auto-Approve / Always-Allow Permissions | `high` / `medium` | `7.8` | Human-in-the-Loop |
| **`CAS-008`** | `.env` Unprotected from AI Context or Unrespected `.claudeignore` | `medium` | `5.5` | AI Context Exposure |
| **`CAS-009`** | Literal Secret in Config or Git-Tracked/Unignored `.env` | `high` | `8.5` | Secrets & Git Hygiene |
| **`CAS-010`** | Duplicate or Conflicting MCP Server Definition | `low` | `3.0` | Configuration Hygiene |
| **`CAS-011`** | MCP Server Baseline Drift (Potential Rug Pull) | `high` / `medium` / `info` | `8.2` | Drift & Integrity |
| **`CAS-012`** | Unparseable Configuration File | `info` | `2.0` | Syntax & Availability |
| **`CAS-013`** | Insecure or Deprecated Transport | `high` / `medium` | `6.0` | Network & Transport |
| **`CAS-014`** | Missing or Unresolvable Command Binary | `low` | `2.5` | Operational Readiness |
| **`CAS-015`** | Excessive Environment Variable Pass-Through | `low` | `3.5` | Least Privilege |
| **`CAS-016`** | Hidden Unicode/Bidi Characters or Override Heuristics in AI Rules | `high` / `medium` | `8.8` | Prompt Injection & Smuggling |

---

## Detailed Rule Reference

### `CAS-001` — Hardcoded Secret in Server Config
- **Severity:** `critical` (known provider keys, database URIs with passwords) / `high` (context-sensitive secrets in `env`, `args`, `headers`, or `url` query parameters/userinfo)
- **What it checks:**
  - Known provider tokens (AWS, Stripe, OpenAI, Anthropic, GitHub PAT, Slack, Discord, Google Cloud, Azure, JWT, Private Keys, Database URIs).
  - 40/64-char hex strings and UUIDs when paired with sensitive key names (`SECRET`, `KEY`, `TOKEN`, `PASSWORD`, `PASS`, `CREDENTIAL`, `AUTH`) in `env`, `headers`, URL query params, or preceding CLI flags in `args` (e.g., `["--api-key", "<UUID>"]`).
  - Default values inside variable expansion syntax `${VAR:-default}`: the portion after `:-` is inspected as a normal value.
  - Partial variable references mixed with literal tokens (e.g., `"Bearer secret_${X}"`).
- **Remediation:** Keep secrets outside configuration files and outside git; use the client's documented environment variable mechanism (`${env:KEY}` in Cursor, `${input:KEY}` or `${env:KEY}` in VS Code, `${KEY}` in Claude Code).

### `CAS-002` — Unpinned Runtime Launcher
- **Severity:** `medium`
- **What it checks:** Dynamic package runners (`npx`, `uvx`, `bunx`, `pnpm`, `pipx`, `dlx`) or `docker run` images invoked without an explicit pinned version or using `@latest` / `:latest`.
- **Remediation:** Pin an exact semantic version (`pkg@1.2.3`) or immutable container digest (`image@sha256:...`).

### `CAS-003` — Shell Wrapper or Embedded Script
- **Severity:** `high`
- **What it checks:** MCP servers launched via shell interpreters (`sh -c`, `bash -c`, `cmd /c`, `powershell -Command`), remote shell pipes (`curl ... | sh`), subshells (`$(...)`), or `eval`.
- **Remediation:** Invoke target binaries directly without shell wrapper flags.

### `CAS-004` — Remote Server Security & Data Flow
- **Severity:** `high` (unencrypted `http://` non-localhost) / `medium` (`https://` without auth headers) / `info` (external third-party data flow notice)
- **What it checks:** Remote MCP server URLs for cleartext HTTP transport, missing authentication headers, and external prompt/context transmission.
- **Remediation:** Use HTTPS endpoints with explicit authentication headers.

### `CAS-005` — Broad Filesystem Scope
- **Severity:** `high`
- **What it checks:** Server arguments granting access to the root filesystem (`/`, `C:\`) or entire user home directory (`~`, `/Users`, `/home`, `$HOME`, `%USERPROFILE%`).
- **Remediation:** Restrict filesystem server arguments to the specific workspace directory (`./`).

### `CAS-006` — Docker Container Risks
- **Severity:** `critical` (`--privileged`, `/var/run/docker.sock` mount) / `high` (root filesystem mount `-v /:/`, `--network host`)
- **What it checks:** Dangerous Docker runtime flags in MCP server definitions that allow container escape or host root takeover.
- **Remediation:** Remove `--privileged`, `docker.sock` mounts, host root volume bindings, and `--network host`.

### `CAS-007` — Auto-Approve / Always-Allow Permissions
- **Severity:** `high` (wildcard `*` or destructive write/execute tools) / `medium` (other pre-approved tools)
- **What it checks:** `autoApprove` or `alwaysAllow` settings that bypass human-in-the-loop confirmation.
- **Remediation:** Remove wildcard auto-approval and require interactive confirmation for state-modifying or shell execution tools.

### `CAS-008` — `.env` Unprotected from AI Context or Unrespected `.claudeignore`
- **Severity:** `medium`
- **What it checks:**
  1. Whether `.claudeignore` exists in the workspace — Claude Code does **not** respect `.claudeignore` (documented in official issues and absent from `https://code.claude.com/docs/en/settings`), emitting a warning finding (`ملف تجاهل غير محترم من Claude Code (.claudeignore)`).
  2. Whether non-template `.env*` files are protected by a verified client mechanism:
     - **Claude Code:** `permissions.deny` containing `Read(./.env)` / `Read(./.env.*)` in `.claude/settings.json`, `.claude/settings.local.json`, or `~/.claude/settings.json` (`https://code.claude.com/docs/en/settings`).
     - **Cursor:** `.cursorignore` in project root (`https://cursor.com/docs/context/ignore-files`).
- **Remediation:** Configure `permissions.deny` in `.claude/settings.json` for Claude Code, `.cursorignore` for Cursor, and store sensitive secrets outside the project directory.

### `CAS-009` — Literal Secret in Config or Git-Tracked/Unignored `.env`
- **Severity:** `high`
- **What it checks:** `.env*` files that are tracked in Git (`git ls-files`), missing from `.gitignore`, or containing hardcoded plaintext secrets.
- **Remediation:** Untrack `.env` files (`git rm --cached`), add `.env*` to `.gitignore`, and store secrets outside the project directory.

### `CAS-010` — Duplicate or Conflicting MCP Server Definition
- **Severity:** `low`
- **What it checks:** Identical MCP server names defined across multiple configuration files or scopes (project vs. user).
- **Remediation:** Assign distinct, unambiguous server names across configuration scopes.

### `CAS-011` — MCP Server Baseline Drift (Potential Rug Pull)
- **Severity:** `high` (modified `command`, `args`, `url`, `transport`, or `env` keys) / `medium` (newly added server) / `info` (removed server)
- **What it checks:** Compares normalized server definitions against a saved baseline (`--baseline`). Secret values are stripped before hashing so rotating a secret value does not trigger false drift alerts.
- **Remediation:** Audit configuration changes against version control and update the baseline only after verification.

### `CAS-012` — Unparseable Configuration File
- **Severity:** `info`
- **What it checks:** Malformed JSON/JSONC syntax or unreadable configuration files.
- **Remediation:** Fix JSON syntax errors.

### `CAS-013` — Insecure or Deprecated Transport
- **Severity:** `high` (remote cleartext `ws://`) / `medium` (raw `tcp` or `udp` transport)
- **What it checks:** Non-standard or unencrypted streaming transports in MCP server configurations.
- **Remediation:** Use `stdio` or TLS-encrypted `https://` / `wss://` transports.

### `CAS-014` — Missing or Unresolvable Command Binary
- **Severity:** `low`
- **What it checks:** Relative or absolute executable paths in `command` (e.g., `./bin/missing-server`) that do not exist on disk.
- **Remediation:** Build or install the target binary at the configured path.

### `CAS-015` — Excessive Environment Variable Pass-Through
- **Severity:** `low`
- **What it checks:** Wildcard environment pass-through (`*`, `ALL`) or excessive environment variable count exceeding the threshold (default `25`, configurable via `maxEnvVars` or `CASTOV_AUDIT_MAX_ENV_VARS`).
- **Remediation:** Pass only the minimal required environment variables to each MCP server.

### `CAS-016` — Hidden Unicode/Bidi Characters or Override Heuristics in AI Rules
- **Severity:** `high` (hidden Unicode zero-width `U+200B..U+200D`, `U+2060`, `U+FEFF`; Bidi control `U+202A..U+202E`, `U+2066..U+2069`; Tag characters `U+E0000..U+E007F`; or plaintext secrets in rule files) / `medium` (heuristic prompt override phrases marked `[Heuristic]`)
- **What it checks:** AI agent instruction files (`.cursorrules`, `CLAUDE.md`, `.cursor/rules/*.mdc`, `.github/copilot-instructions.md`, `.windsurfrules`) and MCP server descriptions/commands/args for invisible Unicode smuggling and guardrail bypass instructions.
- **Remediation:** Strip all hidden Unicode characters and remove prompt override directives.

---

## Rules Changelog (`CHANGELOG`)

### v1.5.0-hardening.2 (2026-10-26) — Locked Canonical Numbering
- **Locked `CAS-001`..`CAS-007` to Phase 1 numbering:**
  - `CAS-001`: Hardcoded Secret in Server Config (includes `${VAR:-default}` default inspection and preceding-arg context in `args`)
  - `CAS-002`: Unpinned Runtime Launcher
  - `CAS-003`: Shell Wrapper or Embedded Script
  - `CAS-004`: Remote Server Security & Data Flow
  - `CAS-005`: Broad Filesystem Scope
  - `CAS-006`: Docker Container Risks (`--privileged`, `docker.sock`, `-v /:/`, `--network host`)
  - `CAS-007`: Auto-Approve / Always-Allow Permissions
- **Redesigned `CAS-008`:**
  - Added verification of Claude Code `permissions.deny` (`Read(./.env)`, `Read(./.env.*)`) in `.claude/settings.json`, `.claude/settings.local.json`, and `~/.claude/settings.json`.
  - Added explicit detection for `.claudeignore` (`ملف تجاهل غير محترم من Claude Code (.claudeignore)`) since Claude Code does not respect `.claudeignore`.
  - Restricted verified ignore file check to Cursor's documented `.cursorignore`.
- **Locked `CAS-009`..`CAS-016`:**
  - `CAS-009`: Literal Secret in Config or Git-Tracked/Unignored `.env` (`high`)
  - `CAS-010`: Duplicate or Conflicting MCP Server Definition (`low`)
  - `CAS-011`: MCP Server Baseline Drift (`high` / `medium` / `info`)
  - `CAS-012`: Unparseable Configuration File (`info`)
  - `CAS-013`: Insecure or Deprecated Transport (`high` / `medium`)
  - `CAS-014`: Missing or Unresolvable Command Binary (`low`)
  - `CAS-015`: Excessive Environment Variable Pass-Through (`low`)
  - `CAS-016`: Hidden Unicode/Bidi/Tag Characters (`high`) and Heuristic Prompt Override Phrases (`medium [Heuristic]`)

### v1.5.0-hardening.1 (2026-10-26)
- Split AI rule file hidden Unicode/prompt injection into `CAS-016`, added baseline server drift in `CAS-011`, and moved duplicate server names to `CAS-010`.

### v1.5.0 (Phase 1 Initial Implementation)
- Initial introduction of `CAS-001` through `CAS-015`.
