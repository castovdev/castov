# AI Blame – Castov (VS Code Extension)

Visualize lines of code authored by AI agents (Cursor Composer, Claude Code, GitHub Copilot, Aider, Devin) versus human developers with real-time inline annotations, status bar metrics, and workspace telemetry.

Zero external dependencies, instant local git execution, zero telemetry.

Powered by [Castov.com](https://castov.com).

---

## ✨ Features

### 1. 🤖 AI vs Human Inline Blame
- Place your cursor on any line to instantly see who wrote it:
  - `🤖 Claude (AI) • 2 days ago • feat: build mcp router`
  - `👤 Developer • yesterday • fix: edge case in jwt`
- Distinguishes AI synthesized code from human engineering.

### 2. 🔍 Multi-Agent Attribution
- Automatically detects agent signatures across Git commit history (`Co-authored-by: Claude <noreply@anthropic.com>`, `Co-authored-by: Copilot`, `Cursor`, `Aider`, `Devin`).
- Identifies agent prompts, session trailers, and inline generated blocks.

### 3. 📊 Status Bar & Workspace Telemetry
- Real-time status bar metric showing active file authorship ratio: `$(hubot) AI: 38% | $(person) 62%`.
- Dedicated "AI vs Human Authorship" sidebar TreeView.

### 4. 📈 Interactive Analytics Dashboard
- Dual-color visual gauge measuring total AI assistance across your repository.
- Agent leaderboard tracking exact line contributions by agent model.
- Sortable file density table highlighting which files are AI-generated vs human-crafted.

---

## ⌨️ Commands

| Command | Description |
| :--- | :--- |
| `AI Blame: Open Authorship Analytics Dashboard` | Opens the full visual telemetry and agent leaderboard |
| `AI Blame: Scan Workspace Authorship` | Triggers a fresh scan across repository files |
| `AI Blame: Toggle Active Line Annotations` | Toggles inline line blame annotations on/off |

---

## 📄 License

MIT © [Castov](https://castov.com)
