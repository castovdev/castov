# Timestamp Hover & UUID – Castov (VS Code Extension)

Instant Unix timestamp inspection, UUID v4/v7 generation, JWT decoding, Base64 conversion, and automatic timestamp hover tooltips right inside Visual Studio Code. Zero telemetry, zero bloat, instant execution.

Powered by [Castov.com](https://castov.com).

---

## ✨ Features

- **⏱️ Timestamp Hover Tooltip:** Hover over any 10-digit (seconds) or 13-digit (milliseconds) timestamp in code, logs, or JSON files to see the human-readable UTC and local date instantly.
- **🆔 UUID v4 & v7 Generation:** Insert standard cryptographically random UUID v4 or time-ordered UUID v7 directly at your cursor.
- **🕒 Current Unix Timestamp:** Insert current Unix seconds or milliseconds with a single shortcut.
- **🔍 Timestamp Converter:** Select any numeric timestamp in your editor, right-click, and convert it to ISO/UTC or replace it in-place.
- **🔐 JWT Inspector:** Select any JSON Web Token, right-click, and inspect its decoded Header, Payload, and expiration status in a dedicated Output Channel.
- **📦 Base64 Encode / Decode:** Quick encoding and decoding of selected text.

---

## ⌨️ Commands & Shortcuts

Open the Command Palette (`Ctrl+Shift+P` on Windows/Linux or `Cmd+Shift+P` on macOS) and type **Castov**:

| Command | Description |
| :--- | :--- |
| `Castov: Insert UUID v4` | Generates and inserts a cryptographically secure UUID v4 |
| `Castov: Insert UUID v7` | Generates a chronological time-ordered UUID v7 |
| `Castov: Insert Current Unix Timestamp` | Choose seconds or milliseconds to insert at cursor |
| `Castov: Convert Selected Timestamp to Date` | Converts selected number to ISO/Local date |
| `Castov: Decode Selected JWT Token` | Inspects token payload, claims, and validity |
| `Castov: Base64 Encode Selection` | Encodes text to Base64 |
| `Castov: Base64 Decode Selection` | Decodes Base64 to text |
| `Castov: Open castov.com in Browser` | Opens the Castov developer toolbox |

---

## 🖱️ Editor Context Menu

Select text in any file and right-click to find:
- **Castov: Convert Selected Timestamp to Date**
- **Castov: Decode Selected JWT Token**
- **Castov: Base64 Encode Selection**
- **Castov: Base64 Decode Selection**

---

## 🌐 Web & CLI Tools

Need deeper analysis, timezone comparisons, cron schedule visualizers, or Linux chmod calculations?
Visit **[castov.com](https://castov.com)** or install our CLI:

```bash
npm install -g castov-cli
castov --help
```

---

## 📄 License

MIT © [Castov](https://castov.com)
