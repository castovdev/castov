# Castov Secret Shield — Chrome Extension (Manifest V3)

> Stops developers from pasting secrets into AI chat sites. 100% offline, zero network calls, zero telemetry.

---

## Supported AI Chat Domains (11 Explicit Hosts)
1. `*://chatgpt.com/*` (`chatgpt.com`)
2. `*://chat.openai.com/*` (`chat.openai.com`)
3. `*://claude.ai/*` (`claude.ai`)
4. `*://gemini.google.com/*` (`gemini.google.com`)
5. `*://chat.deepseek.com/*` (`chat.deepseek.com`)
6. `*://deepseek.com/*` (`deepseek.com`)
7. `*://www.deepseek.com/*` (`www.deepseek.com`)
8. `*://www.perplexity.ai/*` (`www.perplexity.ai`)
9. `*://copilot.microsoft.com/*` (`copilot.microsoft.com`)
10. `*://copilot.cloud.microsoft/*` (`copilot.cloud.microsoft`)
11. `*://copilot.com/*` (`copilot.com`)

---

## Features

- **SafePaste (Core Single Purpose)**: Intercepts `paste` and `drop` events (capture phase) on `textarea`, `input`, `contenteditable` (ProseMirror/Lexical), and Open Shadow DOM editors. Scans text locally in $< 50\text{ ms}$ for 11+ credential types.
- **Isolated Shadow-DOM Modal**: Completely isolated modal dialog with zero style leakage and strict secret masking (`AKIA… (20 chars)`).
  - **Paste Redacted** (Default & focused): Replaces secrets with `[REDACTED:<TYPE>_<n>]`.
  - **Paste Original**: Inserts original unredacted text.
  - **Cancel**: Aborts paste cleanly.
- **Popup & Local Counter**: Weekly blocked count, daily category breakdown, master on/off switch, and independent per-site toggles stored locally in `chrome.storage.local`.

---

## Quick Start & Build

```bash
# 1. Build and package the extension (creates dist/ and dist/castov-secret-shield-1.0.0.zip)
npm --prefix packages/castov-extension run package

# 2. Check TypeScript types
npm --prefix packages/castov-extension run typecheck

# 3. Run all unit, DOM, and bundle security tests
npm --prefix packages/castov-extension test
```

---

## Manual Testing Instructions (In Chrome Browser)

### Step 1: Load the Unpacked Extension in Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** toggle in the top-right corner.
3. Click the **Load unpacked** button in the top-left.
4. Select the directory:
   `packages/castov-extension/dist`
5. The extension "Castov Secret Shield" will now appear in your extensions list with version `1.0.0` and active status.

### Step 2: Test SafePaste Interception
1. Copy the following sample text with a synthetic AWS access key:
   ```text
   Connecting to S3 bucket using AKIA1234567890ABCDEF in production.
   ```
2. Navigate to any supported AI chat site (e.g. `https://chatgpt.com` or `https://claude.ai`).
3. Click into the message prompt input field and press `Ctrl+V` (or `Cmd+V`).
4. **Expected Result:**
   - The paste is intercepted and does NOT immediately appear in the chat prompt.
   - The Castov Secret Shield modal appears with:
     - Heading showing "1 Sensitive Secret Detected"
     - Masked preview: `AKIA… (20 chars)`
     - Default focused button: **Paste Redacted**
5. Hit `Enter` (or click "Paste Redacted"):
   - The text is inserted as: `Connecting to S3 bucket using [REDACTED:AWS_KEY_1] in production.`
   - Modern React/ProseMirror state is registered correctly.

### Step 3: Test the Popup & Per-Site Controls
1. Click the Castov Secret Shield icon in your Chrome toolbar.
2. Verify:
   - "Secrets Blocked This Week" reflects the blocked secrets.
   - Today's breakdown shows the secret type badge (e.g. `AWS_KEY: 1`).
   - Toggling the Master switch or individual site toggles persists across page reloads.
   - Clicking `castov.com ↗` opens `https://castov.com` in a new tab.

---

## Privacy & Security Verification

Our automated test suite enforces that:
- `dist/` contains ZERO instances of `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `eval`, or `new Function`.
- Manifest permissions are strictly limited to `["storage"]` with no background service worker and no `<all_urls>`.
- Content Security Policy enforces `connect-src 'none'`.
