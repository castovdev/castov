# Env Doctor – Castov (VS Code Extension)

Audit, compare, sync & fix `.env` vs `.env.example` vs source code. Detect missing, dead, duplicate, and leaked environment variables directly inside Visual Studio Code and Cursor IDE.

No external dependencies, instant local execution, zero behavioral telemetry.

Powered by [Castov.com](https://castov.com).

---

## ✨ Features

### 1. 🩺 3-Way Environment Audit
- **Code vs .env:** Scans source code (`process.env.XYZ`, `import.meta.env.XYZ`, `os.getenv()`, `getenv()`) and detects variables used in code but missing from `.env`.
- **.env vs .env.example:** Flags active variables missing from `.env.example`, preventing broken CI/CD builds or onboarding friction for teammates.
- **Dead / Unused Variable Detection:** Highlights variables declared in `.env` that are no longer used anywhere in the codebase.
- **Duplicate Key Detection:** Finds keys defined multiple times within the same `.env` file where later lines unexpectedly override earlier ones.

### 2. 🛡️ Git Secret Leak Protection
- Checks if `.env` and `.env.local` are properly protected in `.gitignore`.
- One-click fix to append standard `.env*` exclusion rules to `.gitignore`.

### 3. ✨ One-Click Clean `.env.example` Generator
- Intelligently generates a clean `.env.example` file.
- Groups variables logically (Public/Frontend, Database, Auth & Secrets, Server).
- Strips real secrets and replaces them with safe, standard development placeholders.

### 4. 📊 Interactive Dashboard & Sidebar
- **Health Score Gauge:** Visual score (0-100%) indicating the hygiene of your environment configuration.
- **Variables Matrix:** Tabular overview showing the exact state of each variable across Code, `.env`, and `.env.example`.
- **Live Diagnostics:** Squiggly warnings directly inside `.env` files for duplicate keys and issues.

---

## ⌨️ Commands

| Command | Description |
| :--- | :--- |
| `Env Doctor: Open Interactive Dashboard` | Opens the full visual dashboard and variable matrix |
| `Env Doctor: Run Audit & Rescan` | Rescans workspace code and env files |
| `Env Doctor: Generate Clean .env.example` | Generates or updates `.env.example` with safe placeholders |
| `Env Doctor: Add Missing Variables to .env` | Appends missing variables found in code to `.env` |

---

## 📄 License

MIT © [Castov](https://castov.com)
