# Chrome Web Store Submission Package — Castov Secret Shield

---

## 1. Permission Justifications (For CWS Developer Dashboard)

### Single Purpose Description
> "Castov Secret Shield protects developers by detecting and redacting sensitive credentials (API keys, private keys, tokens) before they are pasted into AI chat interfaces, and provides offline local decoding for selected tokens and timestamps."

### Permissions

#### `storage`
> **Justification:**  
> "Used exclusively to store user configuration preferences (master protection toggle, per-site toggles, and counter preferences) and local daily integer aggregates of blocked secret categories on the user's device. No secret values, prompt text, or URLs are ever stored."

#### `contextMenus`
> **Justification:**  
> "Used to register a single context menu entry ('Castov: Decode Selection') when text is selected, enabling developers to inspect JWT headers/payloads, Unix epoch timestamps, or Base64 strings locally without external tools."

#### `activeTab`
> **Justification:**  
> "Used to display a lightweight, isolated Shadow-DOM inspection tooltip on the active tab only after the user explicitly triggers the 'Castov: Decode Selection' context menu action."

### Host Permissions (`*://chatgpt.com/*`, `*://chat.openai.com/*`, `*://claude.ai/*`, `*://gemini.google.com/*`, `*://chat.deepseek.com/*`, `*://www.perplexity.ai/*`, `*://copilot.microsoft.com/*`)
> **Justification:**  
> "Content scripts are restricted strictly to these 7 verified AI chat platforms to intercept paste events and prevent accidental leaks of sensitive credentials into prompts. Broad `<all_urls>` permissions are intentionally not requested."

---

## 2. Store Listing Draft

### Extension Name
> Castov Secret Shield — AI Paste & Secret Leak Blocker

### Short Description (Max 132 chars)
> Prevents accidental leaks of API keys, tokens, and credentials when pasting into AI chats. 100% offline with zero network calls.

### Detailed Description
```markdown
Stop accidentally leaking your company's API keys, database passwords, and secrets into AI chat models!

Castov Secret Shield is a zero-network, privacy-first Chrome extension that intercepts clipboard paste events in real time on AI chat websites and warns you before credentials reach the chat box.

🛡️ WHAT IT DOES

1. SafePaste™ Interception
When you paste text into ChatGPT, Claude, Gemini, DeepSeek, Perplexity, or Microsoft Copilot, Castov Secret Shield scans the clipboard data in < 50ms. If a secret is detected, it halts the paste and offers you three choices:
• Paste Redacted (Default): Replaces secrets with [REDACTED:<TYPE>_n] placeholders.
• Paste Original: Proceeds with the raw text if you deliberately want to include it.
• Cancel: Cancels the paste operation cleanly.

2. Detects 11+ Common Secret Types
• AWS Access Key IDs (AKIA...)
• GitHub Personal Access Tokens (Classic & Fine-grained github_pat_...)
• Stripe Live Secret Keys (sk_live_...)
• OpenAI API Keys (sk-... and sk-proj-...)
• Anthropic API Keys (sk-ant-...)
• Google Cloud & Gemini API Keys (AIza...)
• Slack API Tokens (xoxb-...)
• PEM & SSH Private Key Blocks (RSA, EC, OpenSSH)
• JSON Web Tokens (JWT)
• Database Connection URIs with Passwords (postgres, mysql, mongodb, redis)
• Authorization Bearer Tokens
• .env-style high-entropy secret variables

3. Instant Offline Select-to-Decode
Highlight any token on a webpage, right-click, and select "Castov: Decode Selection" to inspect:
• JWT: Decodes headers, payload claims, and expiration status in readable JSON.
• Unix Timestamps: Instant conversion to UTC, local time, and relative duration.
• Base64: Safe UTF-8 decoding for encoded payloads and debugging strings.

🔒 HARD PRIVACY GUARANTEES
• Zero Network Calls: The extension has no network permissions. connect-src 'none' is enforced at the browser level.
• Zero Data Collection: No telemetry, no analytics, no user tracking, and no external CDNs.
• Zero Secret Logging: Matched secrets and prompt texts are never saved to disk, storage, or console.
• Isolated Shadow DOM: Dialogs and tooltips render inside closed Shadow DOM boundaries, preventing CSS leakage and page interference.
• Open Source: Fully auditable, lightweight, and built with developer trust.

Visit https://castov.com for more developer tools.
```

### Category
> Developer Tools / Productivity

### Keywords
> secret scanner, api key protector, chatgpt security, claude paste shield, jwt decoder, unix timestamp, developer security, data loss prevention, redactor
