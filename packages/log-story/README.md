# Log Story – Castov (VS Code Extension)

Developer log analyzer, spam noise folding, and root-cause story builder. Turn thousands of lines of chaotic error logs into clean, chronological request timelines and instantly pinpoint the true first failure.

Zero external dependencies, instant local execution, zero telemetry.

Powered by [Castov.com](https://castov.com).

---

## ✨ Features

### 1. 🚨 Automatic Root Cause Detection
- In cascading production failures (e.g., database connection pool exhaustion triggering hundreds of timeouts across 20 microservices), Log Story identifies the true, chronologically initial failure (`FATAL / ERROR`).
- Flags the exact service, timestamp, and stack trace behind the cascade.

### 2. 🗜️ Repetition & Noise Folding
- Folds repetitive log spam (e.g. 100 identical `Connection refused` lines) into compact single entries (`x100 repeated`).
- Reduces log volume by 70–90% while preserving critical anomaly details.

### 3. ⏱️ Correlation ID & Request Story Reconstruction
- Automatically correlates logs by `request_id`, `trace_id`, `correlation_id`, or UUIDs across services.
- Visualizes end-to-end multi-service call flow:
  `api-gateway (200) → auth-service (200) → payment-service (🚨 ERROR) → rollback`.

### 4. 📋 1-Click Clipboard & Active File Analysis
- Analyze `.log` files in your workspace with `Log Story: Analyze Current Log File`.
- Or paste logs straight from terminal with `Log Story: Analyze Logs from Clipboard`.

---

## ⌨️ Commands

| Command | Description |
| :--- | :--- |
| `Log Story: Open Log Analyzer & Story Dashboard` | Opens the full visual log story visualizer and root-cause banner |
| `Log Story: Analyze Current Log File` | Parses the active editor's log file into stories |
| `Log Story: Analyze Logs from Clipboard` | Immediately analyzes logs copied to your clipboard |

---

## 📄 License

MIT © [Castov](https://castov.com)
