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
