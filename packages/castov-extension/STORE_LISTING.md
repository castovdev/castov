# Chrome Web Store Submission Package — Castov Secret Shield

---

## 1. Permission Justifications (For CWS Developer Dashboard)

### Single Purpose Description
> "Castov Secret Shield protects developers from accidentally leaking sensitive credentials (API keys, private keys, tokens, and database URIs) by scanning clipboard text locally and offering instant redaction before pasting into AI chat interfaces."

### Permissions

#### `storage`
> **Justification:**  
> "Used exclusively to store user configuration preferences (master protection toggle, per-site toggles, and counter preferences) and local daily integer aggregates of blocked secret categories on the user's device. No secret values, prompt text, or URLs are ever stored."

### Content Script Host Matches
- `*://chatgpt.com/*`
- `*://chat.openai.com/*`
- `*://claude.ai/*`
- `*://gemini.google.com/*`
- `*://chat.deepseek.com/*`
- `*://deepseek.com/*`
- `*://www.deepseek.com/*`
- `*://www.perplexity.ai/*`
- `*://copilot.microsoft.com/*`
- `*://copilot.cloud.microsoft/*`
- `*://copilot.com/*`

> **Justification:**  
> "Content scripts are restricted strictly to these 11 verified AI chat domains (covering ChatGPT on `chatgpt.com` and `chat.openai.com`, Claude on `claude.ai`, Google Gemini on `gemini.google.com`, DeepSeek across `chat.deepseek.com`, `deepseek.com`, and `www.deepseek.com`, Perplexity on `www.perplexity.ai`, and Microsoft Copilot across `copilot.microsoft.com`, `copilot.cloud.microsoft`, and `copilot.com`) to intercept paste and drop events in the capture phase and prevent accidental leaks of sensitive credentials into prompts. Broad `<all_urls>` permissions are intentionally not requested."

---

## 2. Store Listing Draft

### Extension Name
> Castov Secret Shield — AI Paste & Secret Leak Blocker

### Short Description (Max 132 chars)
> Prevents accidental leaks of API keys, tokens, and credentials when pasting into AI chats. 100% offline with zero network calls.

### Detailed Description
```markdown
Stop accidentally leaking your company's API keys, database passwords, and secrets into AI chat models!

Castov Secret Shield is a zero-network, privacy-first Chrome extension that intercepts clipboard paste and drag-and-drop events in real time on AI chat websites and warns you before credentials reach the chat box.

🛡️ WHAT IT DOES

1. SafePaste™ Real-Time Interception
When you paste or drop text into ChatGPT, Claude, Gemini, DeepSeek, Perplexity, or Microsoft Copilot, Castov Secret Shield scans the text locally in < 50ms. If a secret is detected, it halts the paste and offers you three choices:
• Paste Redacted (Default): Replaces secrets with [REDACTED:<TYPE>_n] placeholders so you can safely share code structure and logs without exposing credentials.
• Paste Original: Proceeds with the raw text if you deliberately want to include it.
• Cancel: Cancels the paste operation cleanly.

2. Detects 11+ Common Secret Types
• AWS Access Key IDs (AKIA..., ASIA...)
• GitHub Personal Access Tokens (Classic & Fine-grained github_pat_...)
• Stripe Live Secret Keys (sk_live_..., rk_live_...)
• OpenAI API Keys (sk-... and sk-proj-...)
• Anthropic API Keys (sk-ant-...)
• Google Cloud & Gemini API Keys (AIza...)
• Slack API Tokens (xoxb-..., xoxp-...)
• PEM & SSH Private Key Blocks (RSA, EC, OpenSSH, Encrypted PKCS#8)
• JSON Web Tokens (JWT)
• Database Connection URIs with Passwords (postgres, mysql, mongodb, redis)
• Authorization Bearer Tokens
• .env-style high-entropy secret variables

3. Granular Per-Site Controls & Masked Previews
• Strict Secret Masking: Never displays full raw keys on screen — previews show only masked summaries (e.g., AKIA… (20 chars)).
• Per-Domain Shield Toggles: Enable or disable protection independently for each supported AI chat domain from the toolbar popup.
• Local Anonymous Counter: Optional 7-day and daily counter of blocked secret categories stored strictly in local storage.

🔒 HARD PRIVACY GUARANTEES
• Zero Network Calls: The extension has no network permissions. connect-src 'none' is enforced at the browser level.
• Single Permission: Requests only the 'storage' permission for local preferences. No <all_urls>, no tabs, no background service worker.
• Zero Data Collection: No telemetry, no analytics, no user tracking, and no external CDNs.
• Zero Secret Logging: Matched secrets and prompt texts are never saved to disk, storage, or console.
• Isolated Shadow DOM: Warning dialogs render inside isolated Shadow DOM boundaries, preventing CSS leakage and page interference.
• Open Source: Fully auditable, lightweight, and built with developer trust.

Visit https://castov.com for more developer tools.
```

### Category
> Developer Tools / Productivity

### Keywords
> secret scanner, api key protector, ai paste shield, credential redactor, developer security, data loss prevention, local dlp, env secret detector
```
