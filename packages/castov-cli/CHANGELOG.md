# Changelog

All notable changes to `castov` CLI and MCP server are documented in this file.

## [1.7.0] - 2026-11-03

### Added
- `castov env-check`: Local-first `.env` security scanner that detects client-side secret leaks (`NEXT_PUBLIC_*` containing secret/key/token patterns), missing keys between `.env` and `.env.example`, and empty required variables.
- `castov hook install` & `castov hook uninstall`: Safe Git `pre-commit` hook manager with automatic backup (`pre-commit.castov.bak`), interactive confirmation (`--force` / `-y`), Git worktree/submodule `.git` file resolution, and non-destructive `core.hooksPath` / Husky v9 detection.
- Extended MCP server schema converter tools (`castov_json_to_zod`, `castov_env_to_zod`, `castov_sql_to_prisma`).

## [1.6.0] - 2026-10-27

### Added
- Adds anonymous, opt-out usage statistics (no arguments, paths, secrets or IPs stored). Disable with CASTOV_TELEMETRY=0 or DO_NOT_TRACK=1. `castov audit` never sends anything.
- Lightweight MCP session telemetry: tracks `initialize` handshake with client info (name/version), castov version, and OS.
- In-memory aggregation of MCP tool calls (counts, total duration, error count per tool), flushed at most once per hour or on clean process exit in a single batched payload.
- One-time first-run notice displayed on stderr for interactive non-mcp commands.
- Full opt-out support via `CASTOV_TELEMETRY=0`, `DO_NOT_TRACK=1`, and automatic disablement in CI environments.
- Zero-network guarantee and strict quarantine for `castov audit`.
