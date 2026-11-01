import { describe, it, expect } from "vitest";
import { scanTextForSecrets } from "../src/detector/scanner";

describe("Castov Secret Shield - Performance & ReDoS Immunity", () => {
  it("scans a 1 MB paste payload in under 100 ms", () => {
    // Generate ~1 MB payload (1,000,000 characters) composed of realistic code, logs, and prose
    const baseBlock = `
// System log entry 2026-10-28T16:00:00Z
function processIncomingData(buffer: Uint8Array): { valid: boolean; id: string } {
  const sessionId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
  const traceId = "018d3b82-45e0-7813-8a3d-491fb2e3f56a";
  const checksum = "e1f8d488f2be482e91a27e7f91754020c6be4a61";
  console.log(\`Processing trace \${traceId} for session \${sessionId} with sha \${checksum}\`);
  return { valid: buffer.length > 0, id: sessionId };
}
/* A long documentation block describing software architecture and high volume data ingestion */
`;
    // Repeat baseBlock to reach ~1,000,000 characters
    const targetSize = 1024 * 1024; // 1 MB
    const repetitions = Math.ceil(targetSize / baseBlock.length);
    let largePayload = baseBlock.repeat(repetitions);

    // Inject 5 secrets at various positions, separated by clean newlines
    const secret1 = "AKIA1122334455667788";
    const secret2 = "ghp_abcdef1234567890abcdef1234567890abcd";
    const secret3 = "sk_live" + "_99887766554433221100112233445566";
    const secret4 = "AIzaSyD-1234567890abcdefghijklmnopqr-01";
    const secret5 = "Bearer 8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d";

    largePayload =
      largePayload.slice(0, 10000) + "\n" + secret1 + "\n" +
      largePayload.slice(10000, 250000) + "\n" + secret2 + "\n" +
      largePayload.slice(250000, 500000) + "\n" + secret3 + "\n" +
      largePayload.slice(500000, 750000) + "\n" + secret4 + "\n" +
      largePayload.slice(750000, 900000) + "\n" + secret5 + "\n" +
      largePayload.slice(900000);

    expect(largePayload.length).toBeGreaterThanOrEqual(1000000);

    const t0 = performance.now();
    const result = scanTextForSecrets(largePayload);
    const duration = performance.now() - t0;

    // Verify sub-100ms execution on 1 MB
    expect(duration).toBeLessThan(100);
    expect(result.scanDurationMs).toBeLessThan(100);

    // Verify all 5 secrets were accurately found
    expect(result.hasFindings).toBe(true);
    expect(result.findings).toHaveLength(5);
    const types = result.findings.map((f) => f.type);
    expect(types).toContain("AWS_KEY");
    expect(types).toContain("GITHUB_TOKEN");
    expect(types).toContain("STRIPE_KEY");
    expect(types).toContain("GOOGLE_KEY");
    expect(types).toContain("BEARER_TOKEN");
  });

  it("safely enforces maxPasteSize cap and sets truncated flag", () => {
    const hugeString = "a".repeat(5000);
    const result = scanTextForSecrets(hugeString, { maxPasteSize: 1000 });
    expect(result.truncated).toBe(true);
    expect(result.totalBytesScanned).toBe(1000);
  });
});
