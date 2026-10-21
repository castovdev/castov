# Bidi & Unicode Guard – Castov (VS Code Extension)

Detect invisible Unicode, Trojan Source attacks (CVE-2021-42574), homoglyphs, and render beautiful RTL Arabic comments seamlessly inside Visual Studio Code and Cursor IDE.

Zero dependencies, instant local execution, zero telemetry.

Powered by [Castov.com](https://castov.com).

---

## ✨ Features

### 1. 🛡️ Trojan Source Attack Defense (CVE-2021-42574 & CVE-2021-42694)
- **BiDi Control Override Detection:** Flags dangerous bidirectional control codes like Right-to-Left Override (`U+202E`), Left-to-Right Override (`U+202D`), and embedding characters (`U+202A`–`U+202C`).
- Prevents visual deception attacks where malicious code appears as a comment to humans but executes as active code in compilers.

### 2. 👻 Invisible & Zero-Width Character Scanner
- **Detects Zero-Width Characters:** Identifies Zero-Width Space (`U+200B`), Zero-Width Non-Joiner (`U+200C`), Zero-Width Joiner (`U+200D`), and embedded Byte Order Marks (`U+FEFF`).
- Solves phantom syntax errors where code looks identical to valid syntax but fails compilation.
- **One-Click Cleaner:** Strip all invisible characters from your active file with a single command (`Bidi Guard: Clean & Strip Invisible Characters`).

### 3. 🎭 Homoglyph / Confusable Detection
- Flags confusing characters like the **Greek Question Mark (`U+037E`)** which looks identical to an ASCII semicolon (`;`) but breaks parsers.
- Quick Fix: Replace with standard ASCII semicolon in one click.

### 4. 📖 Bidirectional Arabic & RTL Comment Reader
- Hovering over comments containing Arabic (`[\u0600-\u06FF]`) or Hebrew (`[\u0590-\u05FF]`) renders a clean right-to-left preview.
- **Bidirectional Isolation:** Prevents English terms, code identifiers (e.g. `Docker`, `PostgreSQL`, `process.env`), and punctuation from flipping to the wrong side of the sentence!

---

## ⌨️ Commands

| Command | Description |
| :--- | :--- |
| `Bidi Guard: Open Scanner & RTL Dashboard` | Opens the full visual threat dashboard and RTL sandbox |
| `Bidi Guard: Scan Entire Workspace for Unicode Threats` | Scans all workspace files for Trojan Source & invisible chars |
| `Bidi Guard: Clean & Strip Invisible Characters in Current File` | Automatically strips hidden Unicode from active file |

---

## 📄 License

MIT © [Castov](https://castov.com)
