/**
 * Castov Secret Shield - Shadow DOM Modal Dialog
 *
 * Renders an isolated dialog inside a Shadow Root so:
 * 1. Host page styles (ChatGPT, Claude, Tailwind, etc.) cannot alter or break modal appearance.
 * 2. Extension styles cannot bleed into the host page.
 * 3. Default focus is set on "Paste Redacted".
 * 4. Keyboard trap (Tab, Shift+Tab, Escape, Enter) for full accessibility, restoring focus on close.
 * 5. Full textContent safety against XSS and chrome.i18n support (_locales/en).
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
 * Helper to resolve localized string via chrome.i18n.getMessage with safe English fallback.
 */
export function getI18nMessage(
  key: string,
  fallback: string,
  substitutions?: string | string[]
): string {
  try {
    if (typeof chrome !== "undefined" && chrome.i18n && typeof chrome.i18n.getMessage === "function") {
      const msg = chrome.i18n.getMessage(key, substitutions);
      if (msg) return msg;
    }
  } catch {
    // Fallback to default English string
  }
  return fallback;
}

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

/**
 * Captures the currently focused element (piercing open shadow roots if applicable)
 * so focus can be restored when the modal closes.
 */
function capturePreviouslyFocusedElement(): HTMLElement | null {
  try {
    if (typeof document !== "undefined") {
      let active = document.activeElement as HTMLElement | null;
      while (active && active.shadowRoot && active.shadowRoot.activeElement) {
        active = active.shadowRoot.activeElement as HTMLElement | null;
      }
      return active;
    }
  } catch {
    // Ignore focus capture errors
  }
  return null;
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
    let previousActiveElement: HTMLElement | null = capturePreviouslyFocusedElement();

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

      // Restore focus to the element that was active before the modal opened
      try {
        if (
          previousActiveElement &&
          typeof previousActiveElement.focus === "function" &&
          previousActiveElement.isConnected
        ) {
          previousActiveElement.focus();
        }
      } catch {
        // Ignore focus restoration errors
      }

      // Break memory references
      if (itemsToRender) {
        itemsToRender.length = 0;
        itemsToRender = null;
      }
      previousActiveElement = null;
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
          <div class="dialog" id="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-subtitle">
            <div class="header">
              <div class="icon-shield" aria-hidden="true">🛡️</div>
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

      // Populate all static text elements via chrome.i18n.getMessage and textContent
      const count = itemsToRender.length;
      const titleText =
        count === 1
          ? getI18nMessage("modalTitleSingle", "1 Sensitive Secret Detected")
          : getI18nMessage("modalTitlePlural", `${count} Sensitive Secrets Detected`, [String(count)]);

      shadow.getElementById("modal-title")!.textContent = titleText;
      shadow.getElementById("modal-subtitle")!.textContent = getI18nMessage(
        "modalSubtitle",
        "Castov Secret Shield intercepted this paste to protect your credentials."
      );
      shadow.getElementById("modal-warning")!.textContent = getI18nMessage(
        "modalWarning",
        "Secrets pasted into AI chats may be permanently logged in conversation history, system logs, or training data."
      );
      shadow.getElementById("modal-footer")!.textContent = getI18nMessage(
        "modalFooter",
        "Castov Secret Shield • Zero Network • Local Only"
      );

      btnCancel = shadow.getElementById("btn-cancel") as HTMLButtonElement;
      const cancelLabel = getI18nMessage("btnCancel", "Cancel");
      btnCancel.textContent = cancelLabel;
      btnCancel.setAttribute(
        "aria-label",
        getI18nMessage("btnCancelAria", "Cancel paste operation and close dialog")
      );

      btnOriginal = shadow.getElementById("btn-original") as HTMLButtonElement;
      const originalLabel = getI18nMessage("btnOriginal", "Paste Original");
      btnOriginal.textContent = originalLabel;
      btnOriginal.title = getI18nMessage("btnOriginalTitle", "Paste without redaction");
      btnOriginal.setAttribute(
        "aria-label",
        getI18nMessage("btnOriginalAria", "Paste original unredacted text containing secrets")
      );

      btnRedact = shadow.getElementById("btn-redact") as HTMLButtonElement;
      const redactLabel = getI18nMessage("btnRedact", "Paste Redacted");
      btnRedact.textContent = redactLabel;
      btnRedact.setAttribute(
        "aria-label",
        getI18nMessage("btnRedactAria", "Paste redacted text with secrets replaced by placeholders")
      );

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

      // Focus default button ("Paste Redacted")
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

      // Keyboard navigation: Escape cancels, Enter activates focused button, Tab/Shift+Tab traps focus inside modal
      const focusableButtons = [btnCancel, btnOriginal, btnRedact];

      onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          cleanup("cancel");
          return;
        }

        if (e.key === "Enter") {
          const activeEl = shadow?.activeElement as HTMLButtonElement | null;
          if (activeEl === btnCancel) {
            e.preventDefault();
            e.stopPropagation();
            cleanup("cancel");
            return;
          }
          if (activeEl === btnOriginal) {
            e.preventDefault();
            e.stopPropagation();
            cleanup("original");
            return;
          }
          if (activeEl === btnRedact || !activeEl) {
            e.preventDefault();
            e.stopPropagation();
            cleanup("redacted");
            return;
          }
        }

        if (e.key === "Tab") {
          e.preventDefault();
          e.stopPropagation();
          const activeEl = shadow?.activeElement as HTMLButtonElement | null;
          const currentIndex = focusableButtons.indexOf(activeEl!);

          if (e.shiftKey) {
            const prevIndex =
              currentIndex <= 0 ? focusableButtons.length - 1 : currentIndex - 1;
            focusableButtons[prevIndex]?.focus();
          } else {
            const nextIndex =
              currentIndex === -1 || currentIndex >= focusableButtons.length - 1
                ? 0
                : currentIndex + 1;
            focusableButtons[nextIndex]?.focus();
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
