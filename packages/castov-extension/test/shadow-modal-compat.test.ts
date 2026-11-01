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

describe("Castov Secret Shield - Shadow Modal V1 Compatibility & Security", () => {
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

  describe("Verbatim V1 English Modal Baseline", () => {
    it("renders exact legacy V1 text in English for single finding", async () => {
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
      expect(shadow.getElementById("btn-cancel")!.textContent).toBe("Cancel");
      expect(shadow.getElementById("btn-original")!.textContent).toBe("Paste Original");
      expect(shadow.getElementById("btn-original")!.getAttribute("title")).toBe("Paste without redaction");
      expect(shadow.getElementById("btn-redact")!.textContent).toBe("Paste Redacted");
      expect(shadow.getElementById("modal-footer")!.textContent).toBe(
        "Castov Secret Shield • Zero Network • Local Only"
      );

      // Verify zero occurrences of raw secret in DOM
      expect(shadow.innerHTML).not.toContain(sampleV1Finding.raw);

      // Click cancel to cleanup
      const btnCancel = shadow.getElementById("btn-cancel") as HTMLButtonElement;
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
