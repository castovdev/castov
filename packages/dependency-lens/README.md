# Dependency Risk Lens – Castov (VS Code Extension)

Supply chain security, typosquatting detector, lifecycle script auditor, and license compliance checker for `package.json` directly inside Visual Studio Code and Cursor IDE.

Zero external dependencies, instant local execution, zero telemetry.

Powered by [Castov.com](https://castov.com).

---

## ✨ Features

### 1. 🚨 Typosquatting Threat Detection
- Identifies packages deliberately named with subtle typos to impersonate popular packages (e.g., `expres` vs `express`, `reactdom` vs `react-dom`, `crossenv` vs `cross-env`).
- Protects your codebase from malicious packages designed to steal environment credentials and SSH keys during `npm install`.

### 2. ⚡ Suspicious Lifecycle Script Scanner
- Detects arbitrary code execution in `preinstall` and `postinstall` hooks inside packages.
- Flags dangerous execution patterns before they execute on your machine.

### 3. 📜 License Compliance & Copyleft Guard
- Categorizes dependencies by license types:
  - **Permissive:** MIT, Apache-2.0, BSD, ISC.
  - **Copyleft (Reciprocal):** GPL-2.0, GPL-3.0, AGPL-3.0 (alerting developers of viral open-source obligations).
- Warns of unpinned wildcard versions (`*`, `latest`).

### 4. 🔍 In-Editor Hover & CodeLens
- Hover over any package in `package.json` to see an instant security card with license details, risk grade, and npm links.
- CodeLens above dependencies displays real-time audit status at a glance.

---

## ⌨️ Commands

| Command | Description |
| :--- | :--- |
| `Dependency Lens: Open Supply Chain Dashboard` | Opens the full visual dependency audit table and risk metrics |
| `Dependency Lens: Audit Workspace Dependencies` | Triggers a fresh supply chain security scan |

---

## 📄 License

MIT © [Castov](https://castov.com)
