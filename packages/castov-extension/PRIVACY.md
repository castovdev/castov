# Privacy Policy — Castov Secret Shield

**Effective Date:** November 14, 2026  
**Commitment:** 100% Offline, Zero Network Calls, Zero Telemetry, Zero Data Collection.

---

## 1. Core Principles

Castov Secret Shield is designed from the ground up for software developers and security engineers. Our architecture enforces privacy mathematically and at the browser policy level:

1. **Zero Network Connectivity**: The extension has NO permission to make network requests. Its Content Security Policy strictly enforces `connect-src 'none'`. It contains zero `fetch()`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, or external analytics scripts.
2. **Zero Plaintext Storage**: The extension NEVER writes your secrets, tokens, clipboard contents, surrounding text, prompt bodies, or visited URLs to disk, `chrome.storage`, or logs.
3. **Local & Ephemeral Processing**: Secret detection and redaction occur entirely in-memory on your local machine using fast, linear-time regular expressions. Once the paste dialog is closed, the text in memory is discarded.

---

## 2. What Data Is Stored Locally?

The extension uses `chrome.storage.local` exclusively on your computer for:

1. **Aggregated Daily Counter**:
   - Stores only integer counts grouped by secret category per calendar date (e.g., `{"2026-11-14": {"AWS_KEY": 2, "GITHUB_TOKEN": 1}}`).
   - Entries older than 30 days are automatically deleted.
   - **No identifiers, no URLs, no text.**
2. **User Preferences**:
   - Master on/off toggle (`enabled: true/false`).
   - Local counting toggle (`countingEnabled: true/false`).
   - Per-site toggles (`siteToggles: { "chatgpt.com": true, ... }`).

If you disable local counting in the extension popup, **absolutely no counts are recorded**.

---

## 3. Permissions & Content Script Host Matches Requested & Why

- **`storage`**: Used solely to persist your local toggle settings and the anonymous blocked counter on your device.
- **Content Script Matches**: Limited strictly to 11 verified AI chat domains across 6 AI platforms:
  1. `*://chatgpt.com/*` (OpenAI ChatGPT)
  2. `*://chat.openai.com/*` (OpenAI ChatGPT Legacy)
  3. `*://claude.ai/*` (Anthropic Claude)
  4. `*://gemini.google.com/*` (Google Gemini)
  5. `*://chat.deepseek.com/*` (DeepSeek Chat)
  6. `*://deepseek.com/*` (DeepSeek Web)
  7. `*://www.deepseek.com/*` (DeepSeek WWW)
  8. `*://www.perplexity.ai/*` (Perplexity AI)
  9. `*://copilot.microsoft.com/*` (Microsoft Copilot)
  10. `*://copilot.cloud.microsoft/*` (Microsoft 365 Copilot)
  11. `*://copilot.com/*` (Microsoft Copilot Consumer)

---

## 4. What Is Strictly Forbidden in Our Codebase

- ❌ NO `<all_urls>` permission.
- ❌ NO `clipboardRead` background permission (clipboard data is read exclusively within the active user `paste` or `drop` event).
- ❌ NO `webRequest`, `cookies`, `history`, `identity`, `tabs`, `activeTab`, or `contextMenus` permissions.
- ❌ NO dynamic evaluation (`eval`, `new Function`).
- ❌ NO remote code or CDN dependencies.
- ❌ NO analytics, telemetry, crash reporting, or user tracking.
- ❌ NO account registration, logins, or paid subscription upsells.

---

## 5. Open Source & Auditability

The entire source code of Castov Secret Shield is open source. You can audit the compiled bundle yourself or run our automated verification suite:

```bash
# Automated security check verifying zero network calls and strict CSP
npm test
```

For questions or security disclosures: [security@castov.com](mailto:security@castov.com) or visit [https://castov.com/privacy/secret-shield](https://castov.com/privacy/secret-shield).
