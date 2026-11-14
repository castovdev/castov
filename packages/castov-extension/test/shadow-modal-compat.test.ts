// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  showSecretDetectedModal,
  adaptToModalFindingItem,
  isNormalizedFinding,
  ModalUserChoice,
} from "../src/content/shadow-modal";
import { handlePasteEvent, handleDropEvent } from "../src/content/index";
import { SecretFinding } from "../src/detector/types";
import { NormalizedFinding } from "../src/types/findings";

describe("Castov Secret Shield - Shadow Modal V1 Compatibility, Accessibility & i18n", () => {
  const sampleV1Finding: SecretFinding = {
    type: "AWS_KEY",
    label: "AWS Access Key",
    startIndex: 0,
    endIndex: 20,
    raw: "AKIA1111222233334444",
    masked: "AKIA****************",
  };

  const sampleNormalizedFinding: NormalizedFinding = {
    id: "v2_test_1",
    category: "SECRET",
    type: "AWS_KEY",
    label: "AWS Access Key",
    startIndex: 0,
    endIndex: 20,
    raw: "AKIA1111222233334444",
    masked: "AKIA****************",
    baseWeight: 80,
    severity: "HIGH",
  };

  afterEach(() => {
    const existing = document.getElementById("castov-secret-shield-modal-host");
    if (existing) existing.remove();
    delete (globalThis as any).chrome;
    vi.restoreAllMocks();
  });

  describe("Finding Adapter & Privacy Guarantees", () => {
    it("distinguishes NormalizedFinding from SecretFinding via isNormalizedFinding type guard", () => {
      expect(isNormalizedFinding(sampleNormalizedFinding)).toBe(true);
      expect(isNormalizedFinding(sampleV1Finding)).toBe(false);
    });

    it("adapts findings without exposing the raw secret property", () => {
      const adapted = adaptToModalFindingItem(sampleV1Finding);
      expect(adapted.displayLabel).toBe("AWS Access Key");
      expect(adapted.displayMasked).toBe("AKIA****************");
      expect((adapted as any).raw).toBeUndefined();

      const adaptedV2 = adaptToModalFindingItem(sampleNormalizedFinding);
      expect(adaptedV2.displayLabel).toBe("AWS Access Key");
      expect((adaptedV2 as any).raw).toBeUndefined();
    });
  });

  describe("Verbatim V1 English Modal Baseline & ARIA Attributes", () => {
    it("renders exact legacy V1 text in English for single finding and sets accessible aria-labels", async () => {
      const modalPromise = showSecretDetectedModal({
        findings: [sampleV1Finding],
      });

      const host = document.getElementById("castov-secret-shield-modal-host");
      expect(host).not.toBeNull();
      const shadow = host!.shadowRoot!;

      // Exact V1 baseline strings
      expect(shadow.getElementById("modal-title")!.textContent).toBe("1 Sensitive Secret Detected");
      expect(shadow.getElementById("modal-subtitle")!.textContent).toBe(
        "Castov Secret Shield intercepted this paste to protect your credentials."
      );
      expect(shadow.getElementById("modal-warning")!.textContent).toBe(
        "Secrets pasted into AI chats may be permanently logged in conversation history, system logs, or training data."
      );

      const btnCancel = shadow.getElementById("btn-cancel") as HTMLButtonElement;
      const btnOriginal = shadow.getElementById("btn-original") as HTMLButtonElement;
      const btnRedact = shadow.getElementById("btn-redact") as HTMLButtonElement;

      expect(btnCancel.textContent).toBe("Cancel");
      expect(btnCancel.getAttribute("aria-label")).toBe("Cancel paste operation and close dialog");

      expect(btnOriginal.textContent).toBe("Paste Original");
      expect(btnOriginal.getAttribute("title")).toBe("Paste without redaction");
      expect(btnOriginal.getAttribute("aria-label")).toBe("Paste original unredacted text containing secrets");

      expect(btnRedact.textContent).toBe("Paste Redacted");
      expect(btnRedact.getAttribute("aria-label")).toBe(
        "Paste redacted text with secrets replaced by placeholders"
      );

      expect(shadow.getElementById("modal-footer")!.textContent).toBe(
        "Castov Secret Shield • Zero Network • Local Only"
      );

      // Verify zero occurrences of raw secret in DOM
      expect(shadow.innerHTML).not.toContain(sampleV1Finding.raw);

      // Click cancel to cleanup
      btnCancel.click();
      const choice = await modalPromise;
      expect(choice).toBe("cancel");
      expect(document.getElementById("castov-secret-shield-modal-host")).toBeNull();
    });

    it("renders exact legacy V1 plural count for multiple findings", async () => {
      const modalPromise = showSecretDetectedModal({
        findings: [sampleV1Finding, sampleV1Finding],
      });

      const host = document.getElementById("castov-secret-shield-modal-host")!;
      const shadow = host.shadowRoot!;
      expect(shadow.getElementById("modal-title")!.textContent).toBe("2 Sensitive Secrets Detected");

      const btnRedact = shadow.getElementById("btn-redact") as HTMLButtonElement;
      btnRedact.click();
      const choice = await modalPromise;
      expect(choice).toBe("redacted");
    });

    it("routes all modal text and aria-labels through chrome.i18n.getMessage when available", async () => {
      const getMessageMock = vi.fn((key: string, substitutions?: string | string[]) => {
        if (key === "modalTitlePlural" && Array.isArray(substitutions)) {
          return `${substitutions[0]} Sensitive Secrets Detected [i18n]`;
        }
        return `[i18n:${key}]`;
      });
      (globalThis as any).chrome = {
        i18n: {
          getMessage: getMessageMock,
        },
      };

      const modalPromise = showSecretDetectedModal({
        findings: [sampleV1Finding, sampleV1Finding],
      });

      const host = document.getElementById("castov-secret-shield-modal-host")!;
      const shadow = host.shadowRoot!;

      expect(shadow.getElementById("modal-title")!.textContent).toBe("2 Sensitive Secrets Detected [i18n]");
      expect(shadow.getElementById("modal-subtitle")!.textContent).toBe("[i18n:modalSubtitle]");
      expect(shadow.getElementById("modal-warning")!.textContent).toBe("[i18n:modalWarning]");
      expect(shadow.getElementById("modal-footer")!.textContent).toBe("[i18n:modalFooter]");
      expect(shadow.getElementById("btn-cancel")!.textContent).toBe("[i18n:btnCancel]");
      expect(shadow.getElementById("btn-cancel")!.getAttribute("aria-label")).toBe("[i18n:btnCancelAria]");
      expect(shadow.getElementById("btn-original")!.textContent).toBe("[i18n:btnOriginal]");
      expect(shadow.getElementById("btn-original")!.getAttribute("aria-label")).toBe("[i18n:btnOriginalAria]");
      expect(shadow.getElementById("btn-redact")!.textContent).toBe("[i18n:btnRedact]");
      expect(shadow.getElementById("btn-redact")!.getAttribute("aria-label")).toBe("[i18n:btnRedactAria]");

      const btnCancel = shadow.getElementById("btn-cancel") as HTMLButtonElement;
      btnCancel.click();
      await modalPromise;
    });
  });

  describe("Keyboard Navigation, Focus Trap & Focus Restoration", () => {
    it("traps focus with Tab and Shift+Tab, activates with Enter, and restores focus to previous element on close", async () => {
      const promptInput = document.createElement("textarea");
      document.body.appendChild(promptInput);
      promptInput.focus();
      expect(document.activeElement).toBe(promptInput);

      const modalPromise = showSecretDetectedModal({
        findings: [sampleV1Finding],
      });

      const host = document.getElementById("castov-secret-shield-modal-host")!;
      const shadow = host.shadowRoot!;
      const btnCancel = shadow.getElementById("btn-cancel") as HTMLButtonElement;
      const btnOriginal = shadow.getElementById("btn-original") as HTMLButtonElement;
      const btnRedact = shadow.getElementById("btn-redact") as HTMLButtonElement;

      // Default focus is on Paste Redacted (index 2)
      expect(shadow.activeElement).toBe(btnRedact);

      // Tab from last button wraps around to first button (Cancel)
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
      expect(shadow.activeElement).toBe(btnCancel);

      // Tab moves to Paste Original
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
      expect(shadow.activeElement).toBe(btnOriginal);

      // Shift+Tab moves back to Cancel
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true })
      );
      expect(shadow.activeElement).toBe(btnCancel);

      // Shift+Tab from first button wraps around to last button (Paste Redacted)
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true })
      );
      expect(shadow.activeElement).toBe(btnRedact);

      // Pressing Enter on focused Paste Redacted button resolves with 'redacted'
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
      const choice = await modalPromise;
      expect(choice).toBe("redacted");

      // Focus is restored to the previously focused promptInput
      expect(document.activeElement).toBe(promptInput);
      promptInput.remove();
    });

    it("restores focus to previous element when closed via Escape key", async () => {
      const promptInput = document.createElement("textarea");
      document.body.appendChild(promptInput);
      promptInput.focus();

      const modalPromise = showSecretDetectedModal({
        findings: [sampleV1Finding],
      });

      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
      const choice = await modalPromise;
      expect(choice).toBe("cancel");
      expect(document.activeElement).toBe(promptInput);

      promptInput.remove();
    });
  });

  describe("XSS Prevention via textContent", () => {
    it("renders malicious payload as plain text without executing or injecting script tags", async () => {
      const maliciousFinding: SecretFinding = {
        type: "ENV_SECRET",
        label: "<script id='xss-test'>window.hacked = true;</script>",
        startIndex: 0,
        endIndex: 10,
        raw: "SECRET_PASSWORD",
        masked: "<img src=x onerror='window.imgHacked=true;'>",
      };

      const modalPromise = showSecretDetectedModal({
        findings: [maliciousFinding],
      });

      const host = document.getElementById("castov-secret-shield-modal-host")!;
      const shadow = host.shadowRoot!;

      // Verify no script or img elements were injected
      expect(shadow.getElementById("xss-test")).toBeNull();
      expect(shadow.querySelector("img")).toBeNull();
      expect((window as any).hacked).toBeUndefined();
      expect((window as any).imgHacked).toBeUndefined();

      // Verify the badge text matches the literal string safely
      const badge = shadow.querySelector(".finding-badge");
      expect(badge!.textContent).toBe("<script id='xss-test'>window.hacked = true;</script>");

      const btnCancel = shadow.getElementById("btn-cancel") as HTMLButtonElement;
      btnCancel.click();
      await modalPromise;
    });
  });

  describe("Synchronous Preemption Order in Paste and Drop Interception", () => {
    it("proves preventDefault and stopImmediatePropagation precede opening modal in handlePasteEvent", async () => {
      const executionOrder: string[] = [];

      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);
      textarea.focus();

      const event = new Event("paste", { bubbles: true, cancelable: true }) as any;
      event.clipboardData = {
        getData: () => "Testing AKIA1111222233334444 secret",
      };
      Object.defineProperty(event, "target", { value: textarea, enumerable: true });
      event.preventDefault = vi.fn(() => executionOrder.push("preventDefault"));
      event.stopImmediatePropagation = vi.fn(() => executionOrder.push("stopImmediatePropagation"));

      const modalMock = vi.fn(async (_options: any): Promise<ModalUserChoice> => {
        executionOrder.push("openModal");
        return "cancel";
      });

      await handlePasteEvent(event, modalMock);

      expect(executionOrder).toEqual([
        "preventDefault",
        "stopImmediatePropagation",
        "openModal",
      ]);

      textarea.remove();
    });

    it("proves preventDefault and stopImmediatePropagation precede opening modal in handleDropEvent", async () => {
      const executionOrder: string[] = [];

      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      const dropEvent = new Event("drop", { bubbles: true, cancelable: true }) as any;
      dropEvent.dataTransfer = {
        getData: () => "Testing " + ("sk_live" + "_123456789012345678901234") + " dropped secret",
      };
      Object.defineProperty(dropEvent, "target", { value: textarea, enumerable: true });
      dropEvent.preventDefault = vi.fn(() => executionOrder.push("preventDefault"));
      dropEvent.stopImmediatePropagation = vi.fn(() => executionOrder.push("stopImmediatePropagation"));

      const modalMock = vi.fn(async (_options: any): Promise<ModalUserChoice> => {
        executionOrder.push("openModal");
        return "cancel";
      });

      await handleDropEvent(dropEvent, modalMock);

      expect(executionOrder).toEqual([
        "preventDefault",
        "stopImmediatePropagation",
        "openModal",
      ]);

      textarea.remove();
    });
  });
});
