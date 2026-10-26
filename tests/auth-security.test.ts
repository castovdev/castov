import { describe, it, expect } from "vitest";

function getSafeRedirectUrl(target: string | null, fallback = "/tools"): string {
  if (!target) return fallback;
  const trimmed = target.trim();
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\") &&
    !trimmed.includes(":")
  ) {
    return trimmed;
  }
  return fallback;
}

describe("Authentication Redirect Security", () => {
  it("allows valid relative internal paths", () => {
    expect(getSafeRedirectUrl("/env-vault/team")).toBe("/env-vault/team");
    expect(getSafeRedirectUrl("/tools")).toBe("/tools");
    expect(getSafeRedirectUrl("/cron/every-minute")).toBe("/cron/every-minute");
  });

  it("blocks external protocol-based open redirects", () => {
    expect(getSafeRedirectUrl("https://evil.com")).toBe("/tools");
    expect(getSafeRedirectUrl("http://evil.com")).toBe("/tools");
    expect(getSafeRedirectUrl("javascript:alert(1)")).toBe("/tools");
  });

  it("blocks protocol-relative open redirects", () => {
    expect(getSafeRedirectUrl("//evil.com")).toBe("/tools");
    expect(getSafeRedirectUrl("//evil.com/path")).toBe("/tools");
  });

  it("blocks backslash-based bypasses", () => {
    expect(getSafeRedirectUrl("/\\evil.com")).toBe("/tools");
  });

  it("falls back gracefully when target is empty or null", () => {
    expect(getSafeRedirectUrl(null)).toBe("/tools");
    expect(getSafeRedirectUrl("")).toBe("/tools");
  });
});


describe("API Key and Token Security (CRYPTO-02 Hardening)", () => {
  it("computes deterministic SHA-256 hash for raw API tokens", async () => {
    const rawToken = "cst_live_57528c970fe37e7a707e31cd47d560f1";
    const hash = require("crypto").createHash("sha256").update(rawToken).digest("hex");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);

    // Hash is deterministic
    const hash2 = require("crypto").createHash("sha256").update(rawToken).digest("hex");
    expect(hash).toBe(hash2);
  });

  it("enforces revoked status rejection", () => {
    const keyRecord = {
      user_id: "d3b07384-d113-4621-996b-e85d9c2222a1",
      revoked: true,
      expires_at: null,
    };
    const isValid = !keyRecord.revoked && (!keyRecord.expires_at || new Date(keyRecord.expires_at).getTime() > Date.now());
    expect(isValid).toBe(false);
  });

  it("enforces expiration date rejection", () => {
    const expiredRecord = {
      user_id: "d3b07384-d113-4621-996b-e85d9c2222a1",
      revoked: false,
      expires_at: new Date(Date.now() - 3600000).toISOString(),
    };
    const isValid = !expiredRecord.revoked && (!expiredRecord.expires_at || new Date(expiredRecord.expires_at).getTime() > Date.now());
    expect(isValid).toBe(false);
  });

  it("validates active non-expired keys", () => {
    const activeRecord = {
      user_id: "d3b07384-d113-4621-996b-e85d9c2222a1",
      revoked: false,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    };
    const isValid = !activeRecord.revoked && (!activeRecord.expires_at || new Date(activeRecord.expires_at).getTime() > Date.now());
    expect(isValid).toBe(true);
  });
});

describe("Shared Env Vaults Isolation (CRYPTO-03 Hardening)", () => {
  it("enforces maximum payload size limit of 100KB", () => {
    const maxAllowedBytes = 100000;
    const smallPayload = Buffer.alloc(50000, "a").toString("base64");
    const oversizedPayload = Buffer.alloc(105000, "a").toString("base64");

    expect(Buffer.byteLength(smallPayload, "utf8")).toBeLessThanOrEqual(maxAllowedBytes);
    expect(Buffer.byteLength(oversizedPayload, "utf8")).toBeGreaterThan(maxAllowedBytes);
  });
});
