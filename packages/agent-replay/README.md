# Agent Session Replay – Castov (VS Code Extension)

Interactive chronological timeline, visual diff scrubber, and 1-click rewind for AI agent file modifications (Cursor Composer, Claude Code, GitHub Copilot, Cline, Aider) in Visual Studio Code.

Zero external dependencies, instant local execution, zero cloud relay required.

Powered by [Castov.com](https://castov.com).

---

## ✨ Features

### 1. ⏱️ Chronological Session Timeline
- Automatically tracks code edits made by autonomous AI agents and developer prompts.
- Records incremental snapshots with precise lines added (`+`) and lines removed (`-`).

### 2. 🎛️ Interactive Step-by-Step Diff Scrubber
- Move back and forth across agent edit steps with slider controls or `◀ Prev` / `Next ▶` buttons.
- Side-by-side Before vs After diff inspector showing exact line transitions for each step.

### 3. ⏪ 1-Click Code Rewind
- Autonomous AI agents often modify multiple files and inadvertently break working functionality.
- With one click on `⏪ Rewind to Before Step`, restore your file to the exact snapshot state before the regression was introduced.

### 4. 📊 Sidebar Timeline & Status Bar
- Dedicated "Session Timeline" sidebar tree view displaying the history of edits.
- Live status bar item showing current session step counter: `$(history) Replay: Step 4`.

---

## ⌨️ Commands

| Command | Description |
| :--- | :--- |
| `Agent Replay: Open Session Replay & Diff Scrubber` | Opens the full visual timeline scrubber & before/after diff viewer |
| `Agent Replay: Capture Manual Session Snapshot` | Forces an immediate snapshot of the currently focused file |
| `Agent Replay: Clear Session History` | Clears all recorded session snapshots from memory |

---

## 📄 License

MIT © [Castov](https://castov.com)
