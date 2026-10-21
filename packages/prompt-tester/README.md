# Prompt Regression Tester – Castov (VS Code Extension)

Unit testing, regression assertion, and eval framework for Large Language Model (LLM) prompts inside Visual Studio Code and Cursor IDE. Run `.prompt.json` and `.prompt.yaml` test files, assert output criteria, and catch prompt regressions before pushing to production.

Zero dependencies, instant local execution, works with online LLMs (Gemini, OpenAI, Claude, Ollama) and offline simulation.

Powered by [Castov.com](https://castov.com).

---

## ✨ Features

### 1. 🧪 Automated Prompt Unit Testing
- Define test suites in standard `.prompt.json` or `.prompt.yaml` format.
- Run variable interpolation using `{{variable}}` syntax across system prompts and user prompts.
- Test against multiple models (`gemini-2.5-flash`, `gpt-4o`, `claude-3-5-sonnet`, `ollama/llama3`).

### 2. ✅ Rich Assertion Engine
- **Content Assertions:** `contains: ["phrase1", "phrase2"]` and `notContains: ["confidential", "error"]`.
- **JSON Schema / Structure:** `isValidJson: true`, `jsonKeys: ["id", "price", "status"]`.
- **Regex Pattern Matching:** Validate outputs against custom regular expressions.
- **Budget & Performance Limits:** Guard against token bloat (`maxTokens: 250`) and slow response times (`maxLatencyMs: 2500`).

### 3. 🎯 In-Editor CodeLens & Test Explorer
- Click `▶ Run All Tests in File` right above your `.prompt.json` code.
- Dedicated "Prompt Tests" sidebar TreeView showing live pass/fail status per test case.
- Status bar summary indicating passed / failed test suites.

### 4. 📊 Regression Dashboard Webview
- Visual interactive test suite runner.
- Latency and token consumption metrics.
- Side-by-side prompt input vs model output inspector with full assertion breakdown.

---

## ⌨️ Commands

| Command | Description |
| :--- | :--- |
| `Prompt Tester: Open Regression Dashboard` | Opens the full visual prompt test runner and assertion inspector |
| `Prompt Tester: Run All Prompt Tests` | Discovers and executes all prompt test suites across workspace |
| `Prompt Tester: Run Current Prompt File` | Runs test cases in the currently focused prompt file |
| `Prompt Tester: Create Sample .prompt.json Suite` | Generates a ready-to-run sample test suite |

---

## 📄 License

MIT © [Castov](https://castov.com)
