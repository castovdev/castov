# Castov Secret Shield — Chrome Extension (Manifest V3)

> Stops developers from pasting secrets into AI chat sites, plus a local offline decoder. 100% offline, zero network calls, zero telemetry.

---

## Supported AI Platforms (Fixed List)
1. `chatgpt.com`
2. `chat.openai.com`
3. `claude.ai`
4. `gemini.google.com`
5. `chat.deepseek.com`
6. `www.perplexity.ai`
7. `copilot.microsoft.com`

---

## Features

- **SafePaste (Core)**: Intercepts paste events (capture phase) on `textarea`, `input`, and `contenteditable`. Scans pasted clipboard text in $< 50\text{ ms}$ for 11+ credential types.
- **Shadow-DOM Modal**: Completely isolated modal dialog with zero style leakage.
  - "Paste redacted" (Default & focused): Replaces secrets with `[REDACTED:<TYPE>_<n>]`.
  - "Paste original": Inserts original unredacted text.
  - "Cancel": Aborts paste.
- **Select-to-Decode**: Context menu on selected text:
  - Decodes JWT (header, payload, expiration status).
  - Decodes Unix Epoch Timestamps (seconds/milliseconds to UTC, Local, and relative time).
  - Decodes Base64/Base64URL into readable UTF-8 text.
- **Popup & Local Counter**: Weekly blocked count, master on/off switch, per-site toggles, and zero-network verification.

---

## Quick Start & Build

```bash
# 1. Run all unit and DOM tests (54 automated tests)
npx vitest run --config packages/castov-extension/vitest.config.ts

# 2. Check TypeScript types
npx tsc --project packages/castov-extension/tsconfig.json --noEmit

# 3. Build the extension package (creates dist/ and dist/castov-secret-shield.zip)
node packages/castov-extension/scripts/build.mjs
```

---

## Manual Testing Instructions (In Chrome Browser)

### Step 1: Load the Unpacked Extension in Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** toggle in the top-right corner.
3. Click the **Load unpacked** button in the top-left.
4. Select the directory:
   `e:\time\packages\castov-extension\dist`
5. The extension "Castov Secret Shield" will now appear in your extensions list with version `1.0.0` and active status.

### Step 2: Test SafePaste Interception
1. Copy the following sample text with an AWS access key:
   ```text
   Connecting to S3 bucket using AKIA1234567890ABCDEF in production.
   ```
2. Navigate to any supported AI chat site (e.g. `https://chatgpt.com` or `https://claude.ai`).
3. Click into the message prompt input field and press `Ctrl+V` (or `Cmd+V`).
4. **Expected Result:**
   - The paste is intercepted and does NOT immediately appear in the chat prompt.
   - The Castov Secret Shield modal appears with:
     - Badge showing "1 Sensitive Secret Detected"
     - Masked preview: `AKIA… (20 chars)`
     - Default focused button: **Paste Redacted**
5. Hit `Enter` (or click "Paste Redacted"):
   - The text is inserted as: `Connecting to S3 bucket using [REDACTED:AWS_KEY_1] in production.`
   - Modern React/ProseMirror state is registered correctly.

### Step 3: Test Select-to-Decode
1. On any webpage, highlight a sample JWT or Unix timestamp, for example:
   `1700000000`
2. Right-click the selected text and choose **"Castov: Decode Selection"** from the context menu.
3. **Expected Result:**
   - An isolated Shadow-DOM card appears near your selection showing:
     - Title: `Unix Timestamp Decoded`
     - UTC: `2023-11-14T22:13:20.000Z`
     - Local time and relative time duration
     - Click **Copy Result** to copy the formatted UTC string to your clipboard.
     - Press `Escape` or click the `✕` button to dismiss the card.

### Step 4: Test the Popup & Controls
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
- Manifest permissions are strictly limited to `["storage", "contextMenus", "activeTab"]`.
- Content Security Policy enforces `connect-src 'none'`.
