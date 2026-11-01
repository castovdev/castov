/**
 * Castov Secret Shield - Editor Text Injector
 *
 * Reliably inserts redacted or original text into:
 * - ProseMirror / Lexical rich text contenteditable editors (ChatGPT, Claude, Gemini, DeepSeek, etc.)
 * - Standard HTMLTextAreaElement and HTMLInputElement with React synthetic event compatibility
 */

export interface SavedSelectionState {
  isFormInput: boolean;
  start?: number;
  end?: number;
  range?: Range | null;
}

/**
 * Captures the current caret position or text selection before opening the modal dialog.
 */
export function captureSelectionState(target: HTMLElement): SavedSelectionState {
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
    try {
      return {
        isFormInput: true,
        start: target.selectionStart ?? target.value.length,
        end: target.selectionEnd ?? target.value.length,
      };
    } catch {
      return { isFormInput: true };
    }
  }

  // ContentEditable / Rich-Text selection
  try {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      return {
        isFormInput: false,
        range: sel.getRangeAt(0).cloneRange(),
      };
    }
  } catch {
    // Ignore selection capture error in restricted environments
  }

  return { isFormInput: false };
}

/**
 * Restores the captured caret position or selection range prior to text injection.
 */
export function restoreSelectionState(target: HTMLElement, state?: SavedSelectionState): boolean {
  if (!state) return false;

  target.focus();

  if (state.isFormInput && (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement)) {
    if (typeof state.start === "number" && typeof state.end === "number") {
      try {
        target.setSelectionRange(state.start, state.end);
        return true;
      } catch {
        return false;
      }
    }
  }

  if (!state.isFormInput && state.range) {
    try {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(state.range);
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Checks whether an element is editable.
 */
export function isEditableElement(el: Element | null): el is HTMLElement {
  if (!el || !(el instanceof HTMLElement)) return false;

  if (el.tagName === "TEXTAREA") return true;
  if (el.tagName === "INPUT") {
    const type = (el.getAttribute("type") || "text").toLowerCase();
    return ["text", "search", "url", "email", ""].includes(type);
  }

  if (el.isContentEditable) return true;
  const ce = el.getAttribute("contenteditable");
  if (ce !== null && ce.toLowerCase() !== "false") return true;
  if (el.getAttribute("role") === "textbox") return true;

  return false;
}

const EDITABLE_SELECTOR = 'textarea, input, [contenteditable], [role="textbox"]';

/**
 * Resolves the actual editable target element across Light DOM, React wrappers, and Open Shadow Roots.
 * Follows an orderly, robust resolution hierarchy:
 * 1. Checks event.composedPath() for Open Shadow Roots (Microsoft Copilot).
 * 2. Checks event.target directly if already an editable element.
 * 3. Checks closest editable ancestor (for child tags inside rich-text editors e.g. <p>, <span>).
 * 4. Prioritizes document.activeElement (including pierced open shadow roots) if valid.
 * 5. Falls back to searching inside the target container for internal editable elements (DeepSeek wrappers).
 * Never accepts any element without validating through isEditableElement.
 */
export function resolveEditableTarget(event: Event): HTMLElement | null {
  // Step 1: Check composedPath() for Open Shadow DOM (Microsoft Copilot)
  if (typeof event.composedPath === "function") {
    try {
      const path = event.composedPath();
      if (Array.isArray(path)) {
        for (const node of path) {
          if (node instanceof HTMLElement && isEditableElement(node)) {
            return node;
          }
        }
      }
    } catch {
      // Ignore composedPath error
    }
  }

  // Step 2: Direct target check
  const rawTarget = event.target as Element | null;
  if (rawTarget && rawTarget instanceof HTMLElement && isEditableElement(rawTarget)) {
    return rawTarget;
  }

  // Step 3: Closest editable ancestor (ChatGPT, Claude, Perplexity child tags)
  if (rawTarget && typeof rawTarget.closest === "function") {
    try {
      const closest = rawTarget.closest(EDITABLE_SELECTOR) as HTMLElement | null;
      if (closest && isEditableElement(closest)) {
        return closest;
      }
    } catch {
      // Ignore closest error
    }
  }

  // Step 4: Prioritize document.activeElement (and pierced shadow roots) if valid
  try {
    if (typeof document !== "undefined") {
      let active = document.activeElement as HTMLElement | null;
      while (active && active.shadowRoot && active.shadowRoot.activeElement) {
        active = active.shadowRoot.activeElement as HTMLElement | null;
      }
      if (active && isEditableElement(active)) {
        return active;
      }
    }
  } catch {
    // Ignore activeElement error
  }

  // Step 5: Fallback - search inside target container for wrapped editor (DeepSeek React wrapper)
  if (rawTarget && typeof rawTarget.querySelectorAll === "function") {
    try {
      const descendants = rawTarget.querySelectorAll(EDITABLE_SELECTOR);
      for (const el of descendants) {
        if (el instanceof HTMLElement && isEditableElement(el)) {
          return el;
        }
      }
    } catch {
      // Ignore querySelectorAll error
    }
  }

  return null;
}

/**
 * Injects text into an editable element with full framework compatibility.
 */
export function injectTextIntoEditor(target: HTMLElement, text: string): boolean {
  if (!target) return false;
  target.focus();

  // 1. Textarea / Input Elements
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
    return injectIntoFormInput(target, text);
  }

  // 2. Rich Text / Contenteditable Elements (ProseMirror, Lexical, Draft.js)
  return injectIntoContentEditable(target, text);
}

/**
 * Handles HTMLTextAreaElement and HTMLInputElement.
 */
function injectIntoFormInput(input: HTMLTextAreaElement | HTMLInputElement, text: string): boolean {
  try {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;

    // Use native setRangeText if available
    if (typeof input.setRangeText === "function") {
      input.setRangeText(text, start, end, "end");
    } else {
      const current = input.value;
      input.value = current.slice(0, start) + text + current.slice(end);
    }

    // Trigger React 16+ synthetic event system
    const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (nativeSetter) {
      nativeSetter.call(input, input.value);
    }

    // Dispatch input and change events
    input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Handles contenteditable elements (used by modern AI chat editors).
 */
function injectIntoContentEditable(element: HTMLElement, text: string): boolean {
  // Strategy A: document.execCommand('insertText') - preferred for ProseMirror/Lexical
  try {
    if (typeof document.execCommand === "function") {
      const executed = document.execCommand("insertText", false, text);
      if (executed) return true;
    }
  } catch {
    // execCommand may throw or fail in restricted contexts; fall through
  }

  // Strategy B: Dispatch InputEvent('beforeinput') with inputType 'insertText'
  try {
    if (typeof InputEvent !== "undefined") {
      const beforeInputEvent = new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: text,
      });
      const allowed = element.dispatchEvent(beforeInputEvent);
      if (!allowed) {
        // Event was consumed and handled by editor framework
        return true;
      }
    }
  } catch {
    // Fall through
  }

  // Strategy C: Manual Range manipulation with fallback input event
  try {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);

      // Move cursor right after inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);

      element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
      return true;
    }
  } catch {
    // Fall through
  }

  // Strategy D: Last resort append
  element.textContent = (element.textContent || "") + text;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}
