# Changelog

All notable changes to `castov` CLI and MCP server are documented in this file.

## [1.6.0] - 2026-10-27

### Added
- Adds anonymous, opt-out usage statistics (no arguments, paths, secrets or IPs stored). Disable with CASTOV_TELEMETRY=0 or DO_NOT_TRACK=1. `castov audit` never sends anything.
- Lightweight MCP session telemetry: tracks `initialize` handshake with client info (name/version), castov version, and OS.
- In-memory aggregation of MCP tool calls (counts, total duration, error count per tool), flushed at most once per hour or on clean process exit in a single batched payload.
- One-time first-run notice displayed on stderr for interactive non-mcp commands.
- Full opt-out support via `CASTOV_TELEMETRY=0`, `DO_NOT_TRACK=1`, and automatic disablement in CI environments.
- Zero-network guarantee and strict quarantine for `castov audit`.
