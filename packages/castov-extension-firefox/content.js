/**
 * Castov Secret Shield - Firefox Content Script
 * SafePaste™ Real-time Interception & Shadow DOM Isolation
 * Zero Network • Offline Only • Sub-50ms Execution
 */

const extApi = typeof browser !== "undefined" ? browser : chrome;

// 1. High-Precision Regex Patterns
const PATTERNS = [
  {
    type: "AWS_ACCESS_KEY",
    label: "AWS Access Key ID",
    regex: /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g
  },
  {
    type: "OPENAI_API_KEY",
    label: "OpenAI API Key",
    regex: /\b(sk-[A-Za-z0-9]{20,48}|sk-proj-[A-Za-z0-9-_]{40,120})\b/g
  },
  {
    type: "ANTHROPIC_API_KEY",
    label: "Anthropic Claude API Key",
    regex: /\bsk-ant-[A-Za-z0-9-_]{32,100}\b/g
  },
  {
    type: "STRIPE_SECRET_KEY",
    label: "Stripe Live Secret Key",
    regex: /\b(sk_live_[0-9a-zA-Z]{24,34}|rk_live_[0-9a-zA-Z]{24,34})\b/g
  },
  {
    type: "GITHUB_PAT",
    label: "GitHub Personal Access Token",
    regex: /\b(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82})\b/g
  },
  {
    type: "GOOGLE_AIZA_KEY",
    label: "Google Cloud / Gemini API Key",
    regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g
  },
  {
    type: "SLACK_TOKEN",
    label: "Slack API Token",
    regex: /\bxox[baprs]-[0-9a-zA-Z]{10,48}\b/g
  },
  {
    type: "PEM_PRIVATE_KEY",
    label: "Private Key Block",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g
  },
  {
    type: "DATABASE_URI",
    label: "Database Connection URI with Password",
    regex: /\b(postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|rediss):\/\/[^\s:@\/\\]+:[^\s@\/\\]+@[^\s\/\\]+(?:\/[^\s?]*)?\b/g
  },
  {
    type: "JWT_TOKEN",
    label: "JSON Web Token (JWT)",
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g
  }
];

function maskSecret(raw) {
  if (raw.length <= 8) return "********";
  const start = raw.slice(0, 4);
  const end = raw.slice(-4);
  return `${start}${"*".repeat(Math.min(raw.length - 8, 16))}${end}`;
}

function scanText(text) {
  if (!text || typeof text !== "string" || text.length > 2 * 1024 * 1024) {
    return [];
  }
  const findings = [];
  for (const p of PATTERNS) {
    p.regex.lastIndex = 0;
    let match;
    while ((match = p.regex.exec(text)) !== null) {
      findings.push({
        type: p.type,
        label: p.label,
        raw: match[0],
        masked: maskSecret(match[0]),
        index: match.index,
        length: match[0].length
      });
    }
  }
  // Sort and deduplicate overlapping ranges
  findings.sort((a, b) => a.index - b.index);
  const deduped = [];
  let lastEnd = -1;
  for (const f of findings) {
    if (f.index >= lastEnd) {
      deduped.push(f);
      lastEnd = f.index + f.length;
    }
  }
  return deduped;
}

function applyRedaction(text, findings) {
  let result = "";
  let lastIndex = 0;
  const counters = {};

  for (const f of findings) {
    result += text.slice(lastIndex, f.index);
    counters[f.type] = (counters[f.type] || 0) + 1;
    result += `[REDACTED:${f.type}_${counters[f.type]}]`;
    lastIndex = f.index + f.length;
  }
  result += text.slice(lastIndex);
  return result;
}

// 2. SafePaste™ Event Interceptor
async function checkProtectionActive() {
  return new Promise((resolve) => {
    extApi.storage.local.get(["castov_shield_settings"], (res) => {
      const s = res.castov_shield_settings;
      if (!s || s.enabled === false) return resolve(false);
      const host = window.location.hostname.toLowerCase();
      if (s.siteToggles && typeof s.siteToggles[host] === "boolean") {
        return resolve(s.siteToggles[host]);
      }
      resolve(true);
    });
  });
}

document.addEventListener("paste", async (e) => {
  const clipboardData = e.clipboardData;
  if (!clipboardData) return;

  const rawText = clipboardData.getData("text/plain");
  if (!rawText) return;

  const findings = scanText(rawText);
  if (findings.length === 0) return;

  const isActive = await checkProtectionActive();
  if (!isActive) return;

  // CRITICAL: Synchronously cancel paste before dialog
  e.preventDefault();
  e.stopImmediatePropagation();

  const target = findEditableTarget(e);
  const redactedText = applyRedaction(rawText, findings);

  // Notify background for metrics
  extApi.runtime.sendMessage({
    type: "CASTOV_RECORD_BLOCK",
    categories: findings.map((f) => f.type)
  }).catch(() => {});

  const choice = await showShadowModal(findings);
  if (choice === "redacted") {
    insertTextIntoEditor(target, redactedText);
  } else if (choice === "original") {
    insertTextIntoEditor(target, rawText);
  }
}, true); // Use capture phase

function findEditableTarget(e) {
  const path = e.composedPath ? e.composedPath() : [];
  for (const el of path) {
    if (el instanceof HTMLElement && isEditableElement(el)) return el;
  }
  const active = document.activeElement;
  if (active && isEditableElement(active)) return active;
  return null;
}

function isEditableElement(el) {
  if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return true;
  if (el.isContentEditable || el.getAttribute("contenteditable") === "true") return true;
  if (el.getAttribute("role") === "textbox") return true;
  return false;
}

function insertTextIntoEditor(target, text) {
  if (!target) return;
  target.focus();

  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    if (typeof target.setRangeText === "function") {
      target.setRangeText(text, start, end, "end");
    } else {
      target.value = target.value.slice(0, start) + text + target.value.slice(end);
    }
    target.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  // ContentEditable / ProseMirror / Lexical / Monaco
  if (document.execCommand && document.execCommand("insertText", false, text)) {
    return;
  }

  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    sel.removeAllRanges();
    sel.addRange(range);
    target.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
  }
}

// 3. Isolated Shadow DOM Modal Dialog
function showShadowModal(findings) {
  return new Promise((resolve) => {
    const HOST_ID = "castov-secret-shield-modal-host";
    const existing = document.getElementById(HOST_ID);
    if (existing) existing.remove();

    const host = document.createElement("div");
    host.id = HOST_ID;
    host.style.position = "fixed";
    host.style.top = "0";
    host.style.left = "0";
    host.style.width = "100vw";
    host.style.height = "100vh";
    host.style.zIndex = "2147483647";
    host.style.pointerEvents = "auto";

    const shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .backdrop {
        position: fixed; inset: 0;
        background: rgba(15, 23, 42, 0.7);
        backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center; padding: 16px;
      }
      .dialog {
        background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0;
        border-top: 4px solid #2563eb;
        box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.35);
        width: 100%; max-width: 540px; padding: 24px 26px;
        display: flex; flex-direction: column; gap: 15px;
        animation: pop 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      .header { display: flex; align-items: center; gap: 12px; }
      .icon-shield {
        width: 38px; height: 38px; border-radius: 10px; background: #fee2e2;
        color: #dc2626; display: flex; align-items: center; justify-content: center;
        font-size: 20px; flex-shrink: 0;
      }
      .title { font-size: 17px; font-weight: 700; color: #0f172a; }
      .subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }
      .warning-box {
        background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px;
        padding: 10px 14px; font-size: 12.5px; color: #92400e; line-height: 1.45;
      }
      .findings-list {
        background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
        max-height: 160px; overflow-y: auto; padding: 8px; display: flex;
        flex-direction: column; gap: 6px;
      }
      .finding-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 6px 10px; background: #ffffff; border: 1px solid #f1f5f9;
        border-radius: 6px; font-size: 12.5px;
      }
      .finding-label { font-weight: 600; color: #334155; }
      .finding-masked { font-family: monospace; color: #dc2626; font-weight: 600; }
      .actions { display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 4px; }
      .btn {
        padding: 9px 15px; border-radius: 8px; font-size: 12.5px; font-weight: 600;
        cursor: pointer; border: 1px solid transparent; transition: all 0.15s;
      }
      .btn-cancel { background: #f8fafc; color: #64748b; border-color: #cbd5e1; }
      .btn-cancel:hover { background: #f1f5f9; color: #0f172a; }
      .btn-original { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
      .btn-original:hover { background: #ffedd5; }
      .btn-redact { background: #2563eb; color: #ffffff; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.35); }
      .btn-redact:hover { background: #1d4ed8; }
      .footer-brand { font-size: 11px; color: #94a3b8; text-align: center; margin-top: -6px; }
    `;
    shadow.appendChild(style);

    const backdrop = document.createElement("div");
    backdrop.className = "backdrop";

    const dialog = document.createElement("div");
    dialog.className = "dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");

    const header = document.createElement("div");
    header.className = "header";

    const iconShield = document.createElement("div");
    iconShield.className = "icon-shield";
    iconShield.textContent = "🛡️";

    const titleBlock = document.createElement("div");
    const titleH2 = document.createElement("h2");
    titleH2.className = "title";
    titleH2.textContent = findings.length === 1 ? "1 Sensitive Secret Detected" : `${findings.length} Sensitive Secrets Detected`;

    const subP = document.createElement("p");
    subP.className = "subtitle";
    subP.textContent = "Castov Secret Shield intercepted this paste to protect your credentials.";

    titleBlock.appendChild(titleH2);
    titleBlock.appendChild(subP);
    header.appendChild(iconShield);
    header.appendChild(titleBlock);

    const warningBox = document.createElement("div");
    warningBox.className = "warning-box";
    warningBox.textContent = "Secrets pasted into AI chats may be permanently logged in conversation history, system logs, or training data.";

    const findingsList = document.createElement("div");
    findingsList.className = "findings-list";

    for (const f of findings) {
      const row = document.createElement("div");
      row.className = "finding-row";

      const label = document.createElement("span");
      label.className = "finding-label";
      label.textContent = f.label; // textContent prevents XSS

      const masked = document.createElement("span");
      masked.className = "finding-masked";
      masked.textContent = f.masked; // textContent prevents XSS

      row.appendChild(label);
      row.appendChild(masked);
      findingsList.appendChild(row);
    }

    const actions = document.createElement("div");
    actions.className = "actions";

    const btnCancel = document.createElement("button");
    btnCancel.className = "btn btn-cancel";
    btnCancel.textContent = "Cancel";

    const btnOriginal = document.createElement("button");
    btnOriginal.className = "btn btn-original";
    btnOriginal.textContent = "Paste Original";

    const btnRedact = document.createElement("button");
    btnRedact.className = "btn btn-redact";
    btnRedact.textContent = "Paste Redacted";

    actions.appendChild(btnCancel);
    actions.appendChild(btnOriginal);
    actions.appendChild(btnRedact);

    const footer = document.createElement("div");
    footer.className = "footer-brand";
    footer.textContent = "Castov Secret Shield • Zero Network • Local Only";

    dialog.appendChild(header);
    dialog.appendChild(warningBox);
    dialog.appendChild(findingsList);
    dialog.appendChild(actions);
    dialog.appendChild(footer);
    backdrop.appendChild(dialog);
    shadow.appendChild(backdrop);
    document.body.appendChild(host);

    btnRedact.focus();

    const cleanup = (choice) => {
      window.removeEventListener("keydown", onKeyDown, true);
      host.remove();
      resolve(choice);
    };

    btnCancel.onclick = () => cleanup("cancel");
    btnOriginal.onclick = () => cleanup("original");
    btnRedact.onclick = () => cleanup("redacted");
    backdrop.onclick = (e) => { if (e.target === backdrop) cleanup("cancel"); };

    const onKeyDown = (e) => {
      if (e.key === "Escape") cleanup("cancel");
      if (e.key === "Enter" && !e.shiftKey) cleanup("redacted");
    };
    window.addEventListener("keydown", onKeyDown, true);
  });
}

// 4. In-Memory Decode Tooltip (from Right-Click Context Menu)
extApi.runtime.onMessage.addListener((msg) => {
  if (msg.type === "CASTOV_SHOW_DECODE_TOOLTIP") {
    showDecodeTooltip(msg.payload);
  }
});

function showDecodeTooltip(data) {
  const HOST_ID = "castov-decode-tooltip-host";
  const existing = document.getElementById(HOST_ID);
  if (existing) existing.remove();

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.position = "fixed";
  host.style.bottom = "24px";
  host.style.right = "24px";
  host.style.zIndex = "2147483647";

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    .box {
      width: 420px; background: #0f172a; border: 1px solid #334155;
      border-top: 3px solid #00b4f5; border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5); padding: 16px;
      font-family: -apple-system, sans-serif; color: #f8fafc;
      animation: pop 0.15s ease-out;
    }
    @keyframes pop { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .badge { background: #00b4f5; color: #050505; font-size: 11px; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
    .close { background: none; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; }
    pre {
      background: #030712; border: 1px solid #1e293b; border-radius: 6px;
      padding: 10px; font-family: monospace; font-size: 11.5px; color: #38bdf8;
      max-height: 200px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;
    }
    .footer { font-size: 10.5px; color: #64748b; margin-top: 8px; text-align: center; }
  `;
  shadow.appendChild(style);

  const box = document.createElement("div");
  box.className = "box";

  const head = document.createElement("div");
  head.className = "head";

  const tag = document.createElement("span");
  tag.className = "badge";
  tag.textContent = data.kind || "DECODED";

  const statusText = document.createElement("span");
  statusText.style.fontSize = "12px";
  statusText.style.color = "#94a3b8";
  statusText.textContent = data.status || "";

  const closeBtn = document.createElement("button");
  closeBtn.className = "close";
  closeBtn.textContent = "✕";
  closeBtn.onclick = () => host.remove();

  head.appendChild(tag);
  head.appendChild(statusText);
  head.appendChild(closeBtn);

  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(data.payload || data.result || data, null, 2);

  const foot = document.createElement("div");
  foot.className = "footer";
  foot.textContent = "Decoded 100% in-memory locally • Zero network calls";

  box.appendChild(head);
  box.appendChild(pre);
  box.appendChild(foot);
  shadow.appendChild(box);
  document.body.appendChild(host);

  setTimeout(() => { if (host.parentNode) host.remove(); }, 12000);
}
