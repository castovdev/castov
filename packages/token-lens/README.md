# LLM Token & Cost Lens – Castov (VS Code Extension)

Real-time token counter & LLM cost estimator for Claude, GPT-4o, Gemini, and DeepSeek directly inside Visual Studio Code and Cursor IDE.

Features CodeLens file summaries, instant hover inspector, real-time status bar tracker, and an interactive cost comparison calculator with monthly production scale simulation.

Zero dependencies, instant local execution (<1ms), zero behavioral telemetry.

Powered by [Castov.com](https://castov.com).

---

## ✨ Features

### 1. 🔍 Hover Token & Cost Inspector
- Hover over any selected text, prompt string, or code block.
- Instantly view estimated token count, character count, word count, and a model cost breakdown table (Claude 3.5 Sonnet, GPT-4o, Gemini 2.5 Flash, DeepSeek-R1).

### 2. 📊 CodeLens File Summaries
- Shows an unobtrusive summary at Line 1 of your active file:
  `📊 File: 1.4k tokens (~$0.004 Claude • $0.0001 Gemini) | 0.7% of 200k`
- One click opens the interactive Cost Calculator with the entire file preloaded.

### 3. ⚡ Dynamic Status Bar Tracker
- Status bar displays real-time token count: `$(hubot) 1.2k tokens`.
- When you highlight text, dynamically switches to show selection token count: `$(hubot) Selection: 240 tokens (~$0.0007)`.

### 4. 🧮 Interactive Calculator & Monthly Production Simulator
- Paste any system prompt, RAG context, or user query.
- Real-time token counts as you type.
- Visual comparative cost bars across 6+ frontier models.
- **Production Scale Simulator:** See what your prompt will cost at 1,000, 10,000, 50,000, or 100,000 calls per day.

---

## 🤖 Supported Models & Calibrated Pricing (October 2026)

| Model | Provider | Input / 1M | Output / 1M | Context Window |
| :--- | :--- | :---: | :---: | :---: |
| **Claude 3.5 Sonnet** | Anthropic | $3.00 | $15.00 | 200,000 |
| **Claude 3.5 Haiku** | Anthropic | $0.80 | $4.00 | 200,000 |
| **GPT-4o** | OpenAI | $2.50 | $10.00 | 128,000 |
| **GPT-4o mini** | OpenAI | $0.15 | $0.60 | 128,000 |
| **Gemini 2.5 Flash** | Google | $0.075 | $0.30 | 1,000,000 |
| **Gemini 2.5 Pro** | Google | $1.25 | $5.00 | 2,000,000 |
| **DeepSeek-R1** | DeepSeek | $0.55 | $2.19 | 128,000 |

---

## ⌨️ Commands

| Command | Description |
| :--- | :--- |
| `Token Lens: Open LLM Cost Calculator & Comparison` | Opens the full visual calculator webview |
| `Token Lens: Calculate Tokens & Cost for Selection` | Quick inspection of highlighted text |

---

## 📄 License

MIT © [Castov](https://castov.com)
