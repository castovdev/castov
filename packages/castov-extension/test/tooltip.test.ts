// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { showDecodeTooltip, hideDecodeTooltip } from "../src/content/decode-tooltip";
import { decodeSelectionLocally } from "../src/decoder";

describe("Castov Secret Shield - Decode Tooltip Shadow DOM", () => {
  beforeEach(() => {
    hideDecodeTooltip();
  });

  afterEach(() => {
    hideDecodeTooltip();
  });

  it("renders decode tooltip inside isolated shadow DOM and can be closed", () => {
    const decoded = decodeSelectionLocally("1700000000");
    showDecodeTooltip(decoded);

    const host = document.getElementById("castov-decode-tooltip-host");
    expect(host).not.toBeNull();
    expect(host?.shadowRoot).not.toBeNull();

    const shadow = host!.shadowRoot!;
    expect(shadow.querySelector(".title-text")?.textContent).toBe("Unix Timestamp Decoded");
    expect(shadow.querySelector(".badge-type")?.textContent).toBe("timestamp");
    expect(shadow.innerHTML).toContain("2023-11-14T22:13:20.000Z");

    // Close button
    const btnClose = shadow.getElementById("btn-close") as HTMLButtonElement;
    expect(btnClose).not.toBeNull();
    btnClose.click();

    expect(document.getElementById("castov-decode-tooltip-host")).toBeNull();
  });

  it("dismisses tooltip when Escape key is pressed", () => {
    const decoded = decodeSelectionLocally("SGVsbG8gV29ybGQ=");
    showDecodeTooltip(decoded);

    expect(document.getElementById("castov-decode-tooltip-host")).not.toBeNull();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(document.getElementById("castov-decode-tooltip-host")).toBeNull();
  });

  it("[Regression] displays explicit unverified signature disclaimer when viewing JWT", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const decoded = decodeSelectionLocally(jwt);
    showDecodeTooltip(decoded);

    const host = document.getElementById("castov-decode-tooltip-host");
    const shadow = host?.shadowRoot;

    const notice = shadow?.querySelector(".jwt-warning-notice");
    expect(notice).not.toBeNull();
    expect(notice?.textContent).toContain("Digital signature is NOT verified");
  });
});
