/**
 * Castov Secret Shield - Shadow DOM Modal Dialog
 *
 * Renders an isolated dialog inside a Shadow Root so:
 * 1. Host page styles (ChatGPT, Claude, Tailwind, etc.) cannot alter or break modal appearance.
 * 2. Extension styles cannot bleed into the host page.
 * 3. Default focus is set on "Paste redacted".
 * 4. Keyboard trap (Tab, Escape, Enter) for full accessibility.
 * 5. Full textContent safety against XSS.
 * 6. Zero raw secret exposure in DOM tree.
 */

import type { SecretFinding } from "../detector/types";
import type { NormalizedFinding } from "../types/findings";

export type ModalUserChoice = "redacted" | "original" | "cancel";

export interface ShowModalOptions {
  findings: readonly (SecretFinding | NormalizedFinding)[];
  redactedPreview?: string;
}

export interface ModalFindingItem {
  readonly displayLabel: string;
  readonly displayMasked: string;
}

const MODAL_HOST_ID = "castov-secret-shield-modal-host";

/**
 * Type guard to safely discriminate NormalizedFinding from SecretFinding.
 */
export function isNormalizedFinding(
  item: SecretFinding | NormalizedFinding
): item is NormalizedFinding {
  return "category" in item && typeof item.category === "string";
}

/**
 * Transforms any finding into a UI view model item.
 * Strictly excludes raw secrets from the returned object.
 */
export function adaptToModalFindingItem(
  item: SecretFinding | NormalizedFinding
): ModalFindingItem {
  return {
    displayLabel: item.label,
    displayMasked: item.masked,
  };
}

export function showSecretDetectedModal(options: ShowModalOptions): Promise<ModalUserChoice> {
  return new Promise((resolve) => {
    let isCleanedUp = false;
    let host: HTMLDivElement | null = null;
    let shadow: ShadowRoot | null = null;
    let backdrop: HTMLDivElement | null = null;
    let btnRedact: HTMLButtonElement | null = null;
    let btnOriginal: HTMLButtonElement | null = null;
    let btnCancel: HTMLButtonElement | null = null;
    let itemsToRender: ModalFindingItem[] | null = null;

    let onKeyDown: ((e: KeyboardEvent) => void) | null = null;
    let onRedactClick: (() => void) | null = null;
    let onOriginalClick: (() => void) | null = null;
    let onCancelClick: (() => void) | null = null;
    let onBackdropClick: ((e: MouseEvent) => void) | null = null;

    const cleanup = (choice: ModalUserChoice) => {
      if (isCleanedUp) return;
      isCleanedUp = true;

      if (onKeyDown) {
        window.removeEventListener("keydown", onKeyDown, true);
      }
      if (btnRedact && onRedactClick) {
        btnRedact.removeEventListener("click", onRedactClick);
      }
      if (btnOriginal && onOriginalClick) {
        btnOriginal.removeEventListener("click", onOriginalClick);
      }
      if (btnCancel && onCancelClick) {
        btnCancel.removeEventListener("click", onCancelClick);
      }
      if (backdrop && onBackdropClick) {
        backdrop.removeEventListener("click", onBackdropClick);
      }

      if (host && host.parentNode) {
        host.parentNode.removeChild(host);
      }

      // Break memory references
      if (itemsToRender) {
        itemsToRender.length = 0;
        itemsToRender = null;
      }
      host = null;
      shadow = null;
      backdrop = null;
      btnRedact = null;
      btnOriginal = null;
      btnCancel = null;
      onKeyDown = null;
      onRedactClick = null;
      onOriginalClick = null;
      onCancelClick = null;
      onBackdropClick = null;

      resolve(choice);
    };

    try {
      // Remove existing modal if any
      const existing = document.getElementById(MODAL_HOST_ID);
      if (existing) {
        existing.remove();
      }

      // Adapt findings into safe view models immediately
      itemsToRender = options.findings.map((f) => adaptToModalFindingItem(f));

      host = document.createElement("div");
      host.id = MODAL_HOST_ID;
      host.style.position = "fixed";
      host.style.top = "0";
      host.style.left = "0";
      host.style.width = "100vw";
      host.style.height = "100vh";
      host.style.zIndex = "2147483647";
      host.style.pointerEvents = "auto";

      shadow = host.attachShadow({ mode: "open" });

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
          .backdrop {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
          }
          .dialog {
            background: #ffffff;
            border-radius: 14px;
            border: 1px solid #e2e8f0;
            border-top: 3.5px solid #2563eb;
            box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(15, 23, 42, 0.05);
            width: 100%;
            max-width: 540px;
            padding: 24px 26px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            animation: popIn 0.16s cubic-bezier(0.16, 1, 0.3, 1);
            text-align: start;
          }
          @keyframes popIn {
            from {
              opacity: 0;
              transform: scale(0.96);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .header {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .icon-shield {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            background: #fee2e2;
            color: #dc2626;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
            flex-shrink: 0;
          }
          .title-block {
            flex: 1;
          }
          .title {
            font-size: 17px;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
          }
          .subtitle {
            font-size: 13px;
            color: #64748b;
            margin: 2px 0 0 0;
          }
          .warning-callout {
            background: #fffbeb;
            border: 1px solid #fef3c7;
            border-radius: 8px;
            padding: 10px 14px;
            font-size: 12.5px;
            color: #92400e;
            line-height: 1.45;
          }
          .findings-container {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            max-height: 180px;
            overflow-y: auto;
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .finding-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 10px;
            background: #ffffff;
            border: 1px solid #f1f5f9;
            border-radius: 6px;
            font-size: 12px;
            gap: 8px;
          }
          .finding-badge {
            font-weight: 600;
            color: #475569;
            white-space: nowrap;
          }
          .finding-masked {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            color: #0f172a;
            font-size: 11.5px;
          }
          .actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 8px;
          }
          button {
            font-family: inherit;
            font-size: 13px;
            font-weight: 600;
            border-radius: 8px;
            padding: 9px 16px;
            cursor: pointer;
            transition: background-color 0.12s ease, transform 0.05s ease;
            border: none;
          }
          button:active {
            transform: scale(0.98);
          }
          button:focus-visible {
            outline: 2px solid #2563eb;
            outline-offset: 2px;
          }
          .btn-cancel {
            background: #f8fafc;
            color: #64748b;
            border: 1px solid #cbd5e1;
          }
          .btn-cancel:hover {
            background: #f1f5f9;
            color: #0f172a;
          }
          .btn-original {
            background: #fff7ed;
            color: #c2410c;
            border: 1px solid #fed7aa;
          }
          .btn-original:hover {
            background: #ffedd5;
            border-color: #fdba74;
          }
          .btn-redact {
            background: #2563eb;
            color: #ffffff;
            box-shadow: 0 2px 6px rgba(37, 99, 235, 0.35);
          }
          .btn-redact:hover {
            background: #1d4ed8;
            box-shadow: 0 4px 10px rgba(37, 99, 235, 0.45);
          }
          .footer-brand {
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
            margin-top: -6px;
          }
        </style>

        <div class="backdrop" id="backdrop">
          <div class="dialog" id="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div class="header">
              <div class="icon-shield">🛡️</div>
              <div class="title-block">
                <h2 class="title" id="modal-title"></h2>
                <p class="subtitle" id="modal-subtitle"></p>
              </div>
            </div>

            <div class="warning-callout" id="modal-warning"></div>

            <div class="findings-container" id="findings-container"></div>

            <div class="actions">
              <button class="btn-cancel" id="btn-cancel" type="button"></button>
              <button class="btn-original" id="btn-original" type="button"></button>
              <button class="btn-redact" id="btn-redact" type="button"></button>
            </div>

            <div class="footer-brand" id="modal-footer"></div>
          </div>
        </div>
      `;

      // Populate static text elements via textContent
      const count = itemsToRender.length;
      const titleText = count === 1 ? "1 Sensitive Secret Detected" : `${count} Sensitive Secrets Detected`;

      shadow.getElementById("modal-title")!.textContent = titleText;
      shadow.getElementById("modal-subtitle")!.textContent =
        "Castov Secret Shield intercepted this paste to protect your credentials.";
      shadow.getElementById("modal-warning")!.textContent =
        "Secrets pasted into AI chats may be permanently logged in conversation history, system logs, or training data.";
      shadow.getElementById("modal-footer")!.textContent =
        "Castov Secret Shield • Zero Network • Local Only";

      btnCancel = shadow.getElementById("btn-cancel") as HTMLButtonElement;
      btnCancel.textContent = "Cancel";

      btnOriginal = shadow.getElementById("btn-original") as HTMLButtonElement;
      btnOriginal.textContent = "Paste Original";
      btnOriginal.title = "Paste without redaction";

      btnRedact = shadow.getElementById("btn-redact") as HTMLButtonElement;
      btnRedact.textContent = "Paste Redacted";

      backdrop = shadow.getElementById("backdrop") as HTMLDivElement;

      // Render findings list safely with DOM APIs and textContent
      const container = shadow.getElementById("findings-container") as HTMLDivElement;
      container.replaceChildren();

      for (const item of itemsToRender) {
        const row = document.createElement("div");
        row.className = "finding-row";

        const badge = document.createElement("span");
        badge.className = "finding-badge";
        badge.textContent = item.displayLabel;

        const code = document.createElement("code");
        code.className = "finding-masked";
        code.textContent = item.displayMasked;

        row.appendChild(badge);
        row.appendChild(code);
        container.appendChild(row);
      }

      document.body.appendChild(host);

      // Focus default button
      btnRedact?.focus();

      onRedactClick = () => cleanup("redacted");
      onOriginalClick = () => cleanup("original");
      onCancelClick = () => cleanup("cancel");
      onBackdropClick = (e: MouseEvent) => {
        if (e.target === backdrop) {
          cleanup("cancel");
        }
      };

      btnRedact?.addEventListener("click", onRedactClick);
      btnOriginal?.addEventListener("click", onOriginalClick);
      btnCancel?.addEventListener("click", onCancelClick);
      backdrop?.addEventListener("click", onBackdropClick);

      // Keyboard navigation: Escape cancels, Tab cycles buttons
      const focusableButtons = [btnCancel, btnOriginal, btnRedact];

      onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          cleanup("cancel");
          return;
        }

        if (e.key === "Tab") {
          const activeEl = shadow?.activeElement;
          const currentIndex = focusableButtons.indexOf(activeEl as HTMLButtonElement);

          if (e.shiftKey) {
            if (currentIndex <= 0) {
              e.preventDefault();
              focusableButtons[focusableButtons.length - 1]?.focus();
            }
          } else {
            if (currentIndex >= focusableButtons.length - 1) {
              e.preventDefault();
              focusableButtons[0]?.focus();
            }
          }
        }
      };

      window.addEventListener("keydown", onKeyDown, true);
    } catch (err: unknown) {
      console.error(
        "[Castov Secret Shield] Modal initialization failed safely:",
        err instanceof Error ? err.message : "DOM Exception"
      );
      cleanup("cancel");
    }
  });
}
