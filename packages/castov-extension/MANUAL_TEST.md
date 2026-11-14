# Manual Testing Checklist — Castov Secret Shield

Follow these steps to manually verify the extension in Google Chrome before submitting to the Chrome Web Store.

---

## 1. Load Unpacked Extension
- [ ] Open Google Chrome and navigate to `chrome://extensions/`.
- [ ] Enable **Developer mode** (top-right toggle).
- [ ] Click **Load unpacked** and select `packages/castov-extension/dist`.
- [ ] Verify the extension card displays:
  - Name: **Castov Secret Shield**
  - Version: **1.0.0**
  - Zero errors or warnings under the **Errors** button.
  - Under **Details > Permissions**: only `Read and change your data on a number of websites` (the 11 explicit AI chat hosts) is shown; no `<all_urls>`, no `tabs`, and no background service worker.

---

## 2. Verify SafePaste Interception & Redaction
- [ ] Copy the following synthetic test snippet to your clipboard:
  ```text
  AWS_ACCESS_KEY_ID=AKIA1234567890ABCDEF
  OPENAI_API_KEY=sk-proj-abcde12345ABCDE12345abcde12345ABCDE12345_xyz
  ```
- [ ] Open a supported AI chat website (e.g., `https://chatgpt.com` or `https://claude.ai`) and focus the prompt input box.
- [ ] Press `Ctrl+V` (or `Cmd+V`).
- [ ] Verify the paste is blocked immediately (zero raw secrets appear in the prompt box) and the **Castov Secret Shield** dialog opens.
- [ ] Verify the dialog shows:
  - Heading: `2 Sensitive Secrets Detected`
  - Masked previews only (`AKIA… (20 chars)` and `sk-p… (52 chars)`), never the full secret strings.
- [ ] Click **Paste Redacted**:
  - Verify the prompt input receives `[REDACTED:AWS_KEY_1]` and `[REDACTED:OPENAI_KEY_1]`.

---

## 3. Verify "Paste Original" & "Cancel" Actions
- [ ] Paste the synthetic test snippet again into the prompt input.
- [ ] Click **Cancel** (or click the backdrop outside the dialog):
  - Verify nothing is inserted into the prompt input and the dialog closes cleanly.
- [ ] Paste the synthetic test snippet again and click **Paste Original**:
  - Verify the original unredacted text is inserted into the prompt input.

---

## 4. Verify Keyboard Accessibility & Focus Management
- [ ] Focus the chat prompt input and paste a synthetic secret to open the dialog.
- [ ] Verify initial focus is automatically placed on the **Paste Redacted** button.
- [ ] Press `Tab` repeatedly:
  - Verify focus cycles strictly inside the dialog (`Cancel` -> `Paste Original` -> `Paste Redacted` -> `Cancel`) and never escapes to the background page.
- [ ] Press `Shift+Tab` repeatedly:
  - Verify focus cycles backward (`Paste Redacted` -> `Paste Original` -> `Cancel` -> `Paste Redacted`).
- [ ] Focus **Paste Redacted** and press `Enter`:
  - Verify the redacted text is pasted and focus returns to the chat prompt input.
- [ ] Paste a synthetic secret again and press `Escape`:
  - Verify the paste is cancelled, the dialog closes, and focus returns to the previously focused prompt element.

---

## 5. Verify Normal Non-Secret Paste Preservation
- [ ] Copy normal prose or code without secrets (e.g., `function add(a, b) { return a + b; }`).
- [ ] Paste into the chat prompt input.
- [ ] Verify the paste succeeds immediately with zero dialog interruption and normal formatting preserved.

---

## 6. Verify Toolbar Popup & Per-Site Toggles
- [ ] Click the **Castov Secret Shield** icon in the Chrome toolbar.
- [ ] Verify **Secrets Blocked This Week** increments after clicking **Paste Redacted**, and today's category pills (`AWS_KEY`, `OPENAI_KEY`) are displayed.
- [ ] Toggle off **Local Counters**, perform a redacted paste, and verify the counter does not increment while disabled.
- [ ] Toggle off the switch for a specific domain (e.g., `chatgpt.com`), reload the tab, and verify paste interception is disabled on that domain while remaining active on other domains.
- [ ] Toggle **Shield Protection** (master switch) off and back on, verifying settings persist across browser restarts.
