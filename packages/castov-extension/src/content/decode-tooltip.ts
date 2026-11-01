/**
 * Castov Secret Shield - Shadow DOM Floating Decode Tooltip
 *
 * Displays local inspection results (JWT, Timestamp, Base64) in a floating,
 * isolated Shadow-DOM card positioned near the user's selection.
 */

import { UnifiedDecodeResult } from "../decoder";

const TOOLTIP_HOST_ID = "castov-decode-tooltip-host";

export function showDecodeTooltip(result: UnifiedDecodeResult): void {
  // Remove existing tooltip
  hideDecodeTooltip();

  const host = document.createElement("div");
  host.id = TOOLTIP_HOST_ID;
  host.style.position = "fixed";
  host.style.zIndex = "2147483646";
  host.style.pointerEvents = "auto";

  // Calculate position near selection, or center-top fallback
  const selection = window.getSelection();
  let top = 40;
  let left = Math.max(20, (window.innerWidth - 380) / 2);

  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      top = Math.min(window.innerHeight - 300, Math.max(16, rect.bottom + 8));
      left = Math.min(window.innerWidth - 400, Math.max(16, rect.left));
    }
  }

  host.style.top = `${top}px`;
  host.style.left = `${left}px`;

  const shadow = host.attachShadow({ mode: "open" });

  let contentHtml = "";

  if (result.type === "jwt" && result.jwt) {
    contentHtml = `
      <div class="jwt-warning-notice">
        ⚠️ Claims inspected locally • Digital signature is NOT verified
      </div>
      <div class="meta-badge ${result.jwt.isExpired ? "badge-danger" : "badge-neutral"}">
        ${escapeHtml(result.jwt.expiresInSummary ?? "No Expiration Claim")}
      </div>
      <div class="code-title">Payload:</div>
      <pre class="code-block">${escapeHtml(result.jwt.rawPayloadJson)}</pre>
      <div class="code-title">Header:</div>
      <pre class="code-block">${escapeHtml(result.jwt.rawHeaderJson)}</pre>
    `;
  } else if (result.type === "timestamp" && result.timestamp) {
    contentHtml = `
      <div class="info-row">
        <span class="label">UTC ISO:</span>
        <span class="value font-mono">${escapeHtml(result.timestamp.utcIso)}</span>
      </div>
      <div class="info-row">
        <span class="label">Local:</span>
        <span class="value">${escapeHtml(result.timestamp.localString)}</span>
      </div>
      <div class="info-row">
        <span class="label">Relative:</span>
        <span class="value">${escapeHtml(result.timestamp.relative)}</span>
      </div>
    `;
  } else if (result.type === "base64" && result.base64) {
    contentHtml = `
      <div class="code-title">Decoded Text (${result.base64.byteLength} bytes):</div>
      <pre class="code-block">${escapeHtml(result.base64.decodedText)}</pre>
    `;
  } else {
    contentHtml = `
      <pre class="code-block">${escapeHtml(result.copyableContent)}</pre>
    `;
  }

  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
        box-sizing: border-box;
      }
      *, *::before, *::after {
        box-sizing: inherit;
      }
      .card {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        width: 380px;
        max-width: 90vw;
        max-height: 400px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: tooltipIn 0.12s ease-out;
      }
      @keyframes tooltipIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .card-header {
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .title-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .badge-type {
        background: #e0f2fe;
        color: #0369a1;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
      }
      .title-text {
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
      }
      .btn-close {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 16px;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .btn-close:hover {
        background: #e2e8f0;
        color: #0f172a;
      }
      .card-body {
        padding: 12px 14px;
        overflow-y: auto;
        font-size: 12.5px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .meta-badge {
        font-size: 11.5px;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 6px;
        width: fit-content;
      }
      .badge-success { background: #dcfce7; color: #166534; }
      .badge-neutral { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
      .badge-danger { background: #fee2e2; color: #991b1b; }
      .jwt-warning-notice {
        background: #fffbeb;
        border: 1px solid #fef3c7;
        color: #92400e;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 11px;
        line-height: 1.4;
      }
      .code-title {
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
      }
      .code-block {
        margin: 0;
        padding: 8px 10px;
        background: #0f172a;
        color: #f8fafc;
        border-radius: 6px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 11.5px;
        max-height: 140px;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-all;
      }
      .info-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 0;
        border-bottom: 1px solid #f1f5f9;
        font-size: 12px;
      }
      .info-row:last-child {
        border-bottom: none;
      }
      .label { color: #64748b; font-weight: 500; }
      .value { color: #0f172a; font-weight: 600; }
      .font-mono { font-family: ui-monospace, monospace; }
      .card-footer {
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        padding: 8px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .footer-brand {
        font-size: 10.5px;
        color: #94a3b8;
      }
      .btn-copy {
        background: #2563eb;
        color: #ffffff;
        border: none;
        padding: 5px 10px;
        border-radius: 6px;
        font-size: 11.5px;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-copy:hover {
        background: #1d4ed8;
      }
    </style>

    <div class="card" id="card">
      <div class="card-header">
        <div class="title-group">
          <span class="badge-type">${result.type}</span>
          <span class="title-text">${escapeHtml(result.title)}</span>
        </div>
        <button class="btn-close" id="btn-close" title="Close">✕</button>
      </div>

      <div class="card-body">
        ${contentHtml}
      </div>

      <div class="card-footer">
        <span class="footer-brand">Castov Local Decoder</span>
        <button class="btn-copy" id="btn-copy">Copy Result</button>
      </div>
    </div>
  `;

  document.body.appendChild(host);

  const btnClose = shadow.getElementById("btn-close");
  const btnCopy = shadow.getElementById("btn-copy") as HTMLButtonElement | null;

  btnClose?.addEventListener("click", () => hideDecodeTooltip());

  btnCopy?.addEventListener("click", () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(result.copyableContent).then(() => {
        if (btnCopy) btnCopy.textContent = "Copied!";
        setTimeout(() => {
          if (btnCopy) btnCopy.textContent = "Copy Result";
        }, 1500);
      }).catch(() => {});
    }
  });

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      hideDecodeTooltip();
    }
  };

  const onPointerDown = (e: MouseEvent) => {
    if (!host.contains(e.target as Node)) {
      hideDecodeTooltip();
    }
  };

  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("pointerdown", onPointerDown, true);

  (host as any)._cleanup = () => {
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("pointerdown", onPointerDown, true);
  };
}

export function hideDecodeTooltip(): void {
  const existing = document.getElementById(TOOLTIP_HOST_ID);
  if (existing) {
    if (typeof (existing as any)._cleanup === "function") {
      (existing as any)._cleanup();
    }
    existing.remove();
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
