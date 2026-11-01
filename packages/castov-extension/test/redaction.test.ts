import { describe, it, expect } from "vitest";
import { scanTextForSecrets } from "../src/detector/scanner";
import { redactSecrets } from "../src/detector/redaction";
import { maskSecret } from "../src/detector/entropy";

describe("Castov Secret Shield - Redaction Engine", () => {
  it("redacts a single secret to [REDACTED:<TYPE>_1]", () => {
    const input = "Connecting with AWS key AKIA1111222233334444 to bucket.";
    const scan = scanTextForSecrets(input);
    expect(scan.findings).toHaveLength(1);

    const redacted = redactSecrets(input, scan.findings);
    expect(redacted.redactedText).toBe("Connecting with AWS key [REDACTED:AWS_KEY_1] to bucket.");
    expect(redacted.totalRedacted).toBe(1);
    expect(redacted.entries[0]).toEqual({
      type: "AWS_KEY",
      index: 1,
      placeholder: "[REDACTED:AWS_KEY_1]",
      originalLength: 20,
      masked: "AKIA… (20 chars)",
    });
  });

  it("handles multiple occurrences with sequential 1-based indices per type", () => {
    const input = `
AWS primary: AKIA1111222233334444
AWS replica: AKIA9999888877776666
Stripe live: ${"sk_live" + "_123456789012345678901234"}
OpenAI key:  sk-proj-1234567890abcdef1234567890abcdef1234
`;
    const scan = scanTextForSecrets(input);
    expect(scan.findings).toHaveLength(4);

    const redacted = redactSecrets(input, scan.findings);
    expect(redacted.redactedText).toContain("[REDACTED:AWS_KEY_1]");
    expect(redacted.redactedText).toContain("[REDACTED:AWS_KEY_2]");
    expect(redacted.redactedText).toContain("[REDACTED:STRIPE_KEY_1]");
    expect(redacted.redactedText).toContain("[REDACTED:OPENAI_KEY_1]");

    // Verify raw secret values are completely absent from the redacted output
    expect(redacted.redactedText).not.toContain("AKIA1111222233334444");
    expect(redacted.redactedText).not.toContain("AKIA9999888877776666");
    expect(redacted.redactedText).not.toContain("sk_live" + "_123456789012345678901234");
    expect(redacted.redactedText).not.toContain("sk-proj-1234567890abcdef1234567890abcdef1234");
  });

  it("preserves exact indentation and newlines around redacted tokens", () => {
    const input = "{\n  \"apiKey\": \"AIzaSyD-1234567890abcdefghijklmnopqr-01\"\n}";
    const scan = scanTextForSecrets(input);
    const redacted = redactSecrets(input, scan.findings);
    expect(redacted.redactedText).toBe("{\n  \"apiKey\": \"[REDACTED:GOOGLE_KEY_1]\"\n}");
  });

  it("correctly masks secrets according to length rules", () => {
    // Length < 16
    expect(maskSecret("secret123")).toBe("… (9 chars)");
    // Length >= 16
    expect(maskSecret("AKIA1234567890ABCDEF")).toBe("AKIA… (20 chars)");
  });
});
