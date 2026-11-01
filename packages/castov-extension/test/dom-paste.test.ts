// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { handlePasteEvent, handleDropEvent } from "../src/content/index";
import { showSecretDetectedModal } from "../src/content/shadow-modal";
import {
  injectTextIntoEditor,
  resolveEditableTarget,
  isEditableElement,
} from "../src/content/editor-injector";
import { getDailyBreakdown } from "../src/storage/counter";

describe("Castov Secret Shield - SafePaste DOM Interception & Shadow DOM", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    const modalHost = document.getElementById("castov-secret-shield-modal-host");
    if (modalHost) modalHost.remove();
    vi.restoreAllMocks();
  });

  function createClipboardEvent(text: string, target: HTMLElement): ClipboardEvent {
    const clipboardData = {
      getData: (type: string) => (type === "text/plain" ? text : ""),
    };
    const event = new Event("paste", { bubbles: true, cancelable: true }) as any;
    event.clipboardData = clipboardData;
    Object.defineProperty(event, "target", { value: target, enumerable: true });
    event.preventDefault = vi.fn();
    event.stopImmediatePropagation = vi.fn();
    return event;
  }

  function createDropEvent(text: string | null, target: HTMLElement): DragEvent {
    const dataTransfer =
      text !== null
        ? {
            getData: (type: string) => (type === "text/plain" ? text : ""),
          }
        : null;
    const event = new Event("drop", { bubbles: true, cancelable: true }) as any;
    event.dataTransfer = dataTransfer;
    Object.defineProperty(event, "target", { value: target, enumerable: true });
    event.preventDefault = vi.fn();
    event.stopImmediatePropagation = vi.fn();
    return event;
  }

  describe("HTMLTextAreaElement Paste Interception", () => {
    it("intercepts paste with secret, calls preventDefault, and injects redacted text upon user approval", async () => {
      const textarea = document.createElement("textarea");
      container.appendChild(textarea);
      textarea.focus();

      const secretText = "AWS credential AKIA1111222233334444 should stay safe";
      const event = createClipboardEvent(secretText, textarea);

      const modalMock = vi.fn().mockResolvedValue("redacted");
      const intercepted = await handlePasteEvent(event, modalMock);

      expect(intercepted).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopImmediatePropagation).toHaveBeenCalled();
      expect(modalMock).toHaveBeenCalledTimes(1);

      // Verify redacted text was inserted into textarea
      expect(textarea.value).toBe("AWS credential [REDACTED:AWS_KEY_1] should stay safe");

      // Verify privacy-first counter was incremented for AWS_KEY
      const breakdown = await getDailyBreakdown();
      expect(breakdown["AWS_KEY"]).toBeGreaterThanOrEqual(1);
    });

    it("injects original text when user explicitly chooses 'original'", async () => {
      const textarea = document.createElement("textarea");
      container.appendChild(textarea);
      textarea.focus();

      const secretText = "Connecting with AKIA1111222233334444";
      const event = createClipboardEvent(secretText, textarea);

      const modalMock = vi.fn().mockResolvedValue("original");
      const intercepted = await handlePasteEvent(event, modalMock);

      expect(intercepted).toBe(true);
      expect(textarea.value).toBe(secretText);
    });

    it("leaves target element unchanged when user clicks 'cancel'", async () => {
      const textarea = document.createElement("textarea");
      textarea.value = "Initial prompt";
      container.appendChild(textarea);
      textarea.focus();

      const secretText = "Pasting " + ("sk_live" + "_123456789012345678901234");
      const event = createClipboardEvent(secretText, textarea);

      const modalMock = vi.fn().mockResolvedValue("cancel");
      const intercepted = await handlePasteEvent(event, modalMock);

      expect(intercepted).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(textarea.value).toBe("Initial prompt");
    });

    it("allows non-sensitive paste through without preventDefault", async () => {
      const textarea = document.createElement("textarea");
      container.appendChild(textarea);

      const safeText = "Explain the difference between useEffect and useLayoutEffect in React.";
      const event = createClipboardEvent(safeText, textarea);

      const modalMock = vi.fn();
      const intercepted = await handlePasteEvent(event, modalMock);

      expect(intercepted).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(modalMock).not.toHaveBeenCalled();
    });
  });

  describe("ContentEditable Rich-Text Editor Interception (ChatGPT / Claude)", () => {
    it("intercepts paste on contenteditable and injects redacted text", async () => {
      const editor = document.createElement("div");
      editor.setAttribute("contenteditable", "true");
      container.appendChild(editor);
      editor.focus();

      const secretText = "Stripe key: " + ("sk_live" + "_51ABCDEF123456789012345678901234567890");
      const event = createClipboardEvent(secretText, editor);

      const modalMock = vi.fn().mockResolvedValue("redacted");
      const intercepted = await handlePasteEvent(event, modalMock);

      expect(intercepted).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(editor.textContent).toContain("[REDACTED:STRIPE_KEY_1]");
      expect(editor.textContent).not.toContain("sk_live" + "_51ABCDEF123456789012345678901234567890");
    });
  });

  describe("Shadow DOM Modal Isolation & Keyboard Navigation", () => {
    it("renders modal inside isolated Shadow Root and cleans up on choice", async () => {
      const findings = [
        {
          type: "AWS_KEY" as const,
          label: "AWS Access Key ID",
          startIndex: 0,
          endIndex: 20,
          raw: "AKIA1111222233334444",
          masked: "AKIA… (20 chars)",
        },
      ];

      const promise = showSecretDetectedModal({ findings });

      const host = document.getElementById("castov-secret-shield-modal-host");
      expect(host).not.toBeNull();
      expect(host?.shadowRoot).not.toBeNull();

      const shadow = host!.shadowRoot!;
      // Verify style isolation
      expect(shadow.querySelector("style")).not.toBeNull();
      expect(shadow.querySelector(".title")?.textContent).toContain("1 Sensitive Secret Detected");

      // Verify masked representation is shown, NOT the raw secret
      const maskedEl = shadow.querySelector(".finding-masked");
      expect(maskedEl?.textContent).toBe("AKIA… (20 chars)");
      expect(shadow.innerHTML).not.toContain("AKIA1111222233334444");

      // Verify default button exists
      const btnRedact = shadow.getElementById("btn-redact") as HTMLButtonElement;
      expect(btnRedact).not.toBeNull();

      // Click "Paste Redacted"
      btnRedact.click();
      const choice = await promise;
      expect(choice).toBe("redacted");

      // Verify host is removed from DOM after resolution
      expect(document.getElementById("castov-secret-shield-modal-host")).toBeNull();
    });

    it("cancels and removes modal on Escape key press", async () => {
      const findings = [
        {
          type: "OPENAI_KEY" as const,
          label: "OpenAI API Key",
          startIndex: 0,
          endIndex: 40,
          raw: "sk-proj-1234567890abcdef1234567890abcdef",
          masked: "sk-p… (40 chars)",
        },
      ];

      const promise = showSecretDetectedModal({ findings });
      const host = document.getElementById("castov-secret-shield-modal-host");
      expect(host).not.toBeNull();

      // Dispatch Escape key
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

      const choice = await promise;
      expect(choice).toBe("cancel");
      expect(document.getElementById("castov-secret-shield-modal-host")).toBeNull();
    });
  });

  describe("Editor Injector Fallback Fidelity", () => {
    it("handles input elements correctly", () => {
      const input = document.createElement("input");
      input.type = "text";
      input.value = "Prefix: ";
      container.appendChild(input);

      injectTextIntoEditor(input, "[REDACTED:AWS_KEY_1]");
      expect(input.value).toBe("Prefix: [REDACTED:AWS_KEY_1]");
    });

    it("[Regression] preserves and restores caret position within surrounding text during paste", async () => {
      const textarea = document.createElement("textarea");
      textarea.value = "Start || End";
      container.appendChild(textarea);
      textarea.focus();
      // Position cursor right between the pipes at index 7
      textarea.setSelectionRange(7, 7);

      const secretText = "AKIA1111222233334444";
      const event = createClipboardEvent(secretText, textarea);

      const modalMock = vi.fn().mockResolvedValue("redacted");
      const intercepted = await handlePasteEvent(event, modalMock);

      expect(intercepted).toBe(true);
      expect(textarea.value).toBe("Start |[REDACTED:AWS_KEY_1]| End");
    });
  });

  describe("Drag & Drop Protection (Issue 1 Regression)", () => {
    it("intercepts drop containing secret, calls preventDefault, and injects redacted text upon approval", async () => {
      const textarea = document.createElement("textarea");
      textarea.value = "Prompt: ";
      container.appendChild(textarea);
      textarea.focus();
      textarea.setSelectionRange(8, 8);

      const secretText = "Database string postgres://usr:SecretPass123456!@pg.internal:5432/db";
      const dropEvent = createDropEvent(secretText, textarea);

      const modalMock = vi.fn().mockResolvedValue("redacted");
      const intercepted = await handleDropEvent(dropEvent, modalMock);

      expect(intercepted).toBe(true);
      expect(dropEvent.preventDefault).toHaveBeenCalled();
      expect(dropEvent.stopImmediatePropagation).toHaveBeenCalled();
      expect(modalMock).toHaveBeenCalledTimes(1);

      expect(textarea.value).toContain("[REDACTED:DATABASE_URI_1]");
      expect(textarea.value).not.toContain("SecretPass123456!");
    });

    it("allows safe text drop through without preventDefault", async () => {
      const textarea = document.createElement("textarea");
      container.appendChild(textarea);

      const safeText = "Help me optimize this SQL query: SELECT id FROM users WHERE active = 1;";
      const dropEvent = createDropEvent(safeText, textarea);

      const modalMock = vi.fn();
      const intercepted = await handleDropEvent(dropEvent, modalMock);

      expect(intercepted).toBe(false);
      expect(dropEvent.preventDefault).not.toHaveBeenCalled();
      expect(modalMock).not.toHaveBeenCalled();
    });

    it("safely ignores drop events with null or non-text dataTransfer", async () => {
      const textarea = document.createElement("textarea");
      container.appendChild(textarea);

      const emptyDropEvent = createDropEvent(null, textarea);
      const intercepted = await handleDropEvent(emptyDropEvent);

      expect(intercepted).toBe(false);
      expect(emptyDropEvent.preventDefault).not.toHaveBeenCalled();
    });

    it("leaves target element unchanged when user cancels drop", async () => {
      const textarea = document.createElement("textarea");
      textarea.value = "Existing content";
      container.appendChild(textarea);

      const secretDrop = createDropEvent("AKIA1111222233334444", textarea);
      const modalMock = vi.fn().mockResolvedValue("cancel");

      const intercepted = await handleDropEvent(secretDrop, modalMock);

      expect(intercepted).toBe(true);
      expect(secretDrop.preventDefault).toHaveBeenCalled();
      expect(textarea.value).toBe("Existing content");
    });
  });

  describe("Shadow DOM & Advanced Target Resolution (Copilot & DeepSeek)", () => {
    it("resolves editable textarea inside an open Shadow DOM (Microsoft Copilot simulation)", async () => {
      const host = document.createElement("div");
      container.appendChild(host);
      const shadowRoot = host.attachShadow({ mode: "open" });
      const innerTextarea = document.createElement("textarea");
      shadowRoot.appendChild(innerTextarea);
      innerTextarea.focus();

      // Simulate W3C event retargeting where event.target is the outer host element
      // but event.composedPath() contains the real leaf target inside the open shadow root
      const event = new Event("paste", { bubbles: true, cancelable: true }) as any;
      event.clipboardData = {
        getData: (type: string) => (type === "text/plain" ? "AKIA1111222233334444" : ""),
      };
      Object.defineProperty(event, "target", { value: host, enumerable: true, configurable: true });
      event.composedPath = () => [innerTextarea, shadowRoot, host, container, document.body, document, window];
      event.preventDefault = vi.fn();
      event.stopImmediatePropagation = vi.fn();

      // 1. Direct unit verification of target resolution
      const resolved = resolveEditableTarget(event);
      expect(resolved).toBe(innerTextarea);

      // 2. Full paste interception pipeline with redaction injection
      const modalMock = vi.fn().mockResolvedValue("redacted");
      const intercepted = await handlePasteEvent(event, modalMock);

      expect(intercepted).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(innerTextarea.value).toBe("[REDACTED:AWS_KEY_1]");
    });

    it("resolves active textarea when paste event targets an outer container (DeepSeek focus simulation)", async () => {
      const wrapper = document.createElement("div");
      const textarea = document.createElement("textarea");
      wrapper.appendChild(textarea);
      container.appendChild(wrapper);
      textarea.focus();

      // Outer container receives event while activeElement is the textarea
      const event = new Event("paste", { bubbles: true, cancelable: true }) as any;
      event.clipboardData = {
        getData: (type: string) => (type === "text/plain" ? "AKIA1111222233334444" : ""),
      };
      Object.defineProperty(event, "target", { value: wrapper, enumerable: true, configurable: true });
      event.preventDefault = vi.fn();
      event.stopImmediatePropagation = vi.fn();

      const resolved = resolveEditableTarget(event);
      expect(resolved).toBe(textarea);

      const modalMock = vi.fn().mockResolvedValue("redacted");
      const intercepted = await handlePasteEvent(event, modalMock);

      expect(intercepted).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(textarea.value).toBe("[REDACTED:AWS_KEY_1]");
    });

    it("recognizes contenteditable='plaintext-only' and contenteditable=''", () => {
      const plaintextDiv = document.createElement("div");
      plaintextDiv.setAttribute("contenteditable", "plaintext-only");
      expect(isEditableElement(plaintextDiv)).toBe(true);

      const emptyCeDiv = document.createElement("div");
      emptyCeDiv.setAttribute("contenteditable", "");
      expect(isEditableElement(emptyCeDiv)).toBe(true);

      const falseCeDiv = document.createElement("div");
      falseCeDiv.setAttribute("contenteditable", "false");
      expect(isEditableElement(falseCeDiv)).toBe(false);
    });

    it("finds internal textarea when event target is an outer container without activeElement focus", () => {
      const outerBox = document.createElement("div");
      outerBox.className = "deepseek-composer-box";
      const innerTextarea = document.createElement("textarea");
      outerBox.appendChild(innerTextarea);
      container.appendChild(outerBox);

      // Ensure activeElement is body to test the container fallback (Step 5)
      document.body.focus();

      const event = new Event("paste", { bubbles: true, cancelable: true }) as any;
      event.clipboardData = {
        getData: (type: string) => (type === "text/plain" ? "AKIA1111222233334444" : ""),
      };
      Object.defineProperty(event, "target", { value: outerBox, enumerable: true, configurable: true });

      const resolved = resolveEditableTarget(event);
      expect(resolved).toBe(innerTextarea);
    });

    it("does NOT select a non-editable container that has no editors", () => {
      const nonEditableBox = document.createElement("div");
      nonEditableBox.innerHTML = "<button>Click</button><span>Static Label</span>";
      container.appendChild(nonEditableBox);

      document.body.focus();

      const event = new Event("paste", { bubbles: true, cancelable: true }) as any;
      Object.defineProperty(event, "target", { value: nonEditableBox, enumerable: true, configurable: true });

      const resolved = resolveEditableTarget(event);
      expect(resolved).toBeNull();
    });
  });
});
