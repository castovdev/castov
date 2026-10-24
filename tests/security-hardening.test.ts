import { describe, it, expect } from "vitest";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limiter";
import { encryptEnvVault, decryptEnvVault } from "@/lib/vault-crypto";

describe("Enterprise Rate Limiter (RFC 6585)", () => {
  it("allows requests under the threshold and tracks remaining balance", () => {
    const req = new Request("https://castov.com/api/test", {
      headers: { "x-forwarded-for": "203.0.113.195" },
    });

    const res1 = checkRateLimit(req, { limit: 3, windowMs: 10000, identifier: "unit_test_1" });
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(req, { limit: 3, windowMs: 10000, identifier: "unit_test_1" });
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(req, { limit: 3, windowMs: 10000, identifier: "unit_test_1" });
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);

    // 4th request must be blocked
    const res4 = checkRateLimit(req, { limit: 3, windowMs: 10000, identifier: "unit_test_1" });
    expect(res4.success).toBe(false);
    expect(res4.remaining).toBe(0);
    expect(res4.resetMs).toBeGreaterThan(0);
  });

  it("generates RFC 6585 compliant HTTP 429 response with Retry-After header", async () => {
    const rateResult = {
      success: false,
      limit: 10,
      remaining: 0,
      resetMs: 4500,
    };

    const resp = rateLimitResponse(rateResult);
    expect(resp.status).toBe(429);
    expect(resp.headers.get("Retry-After")).toBe("5");
    expect(resp.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(resp.headers.get("X-RateLimit-Remaining")).toBe("0");

    const body = await resp.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Too Many Requests");
  });

  it("extracts real client IP from cf-connecting-ip or x-forwarded-for", () => {
    const req1 = new Request("https://castov.com", {
      headers: { "cf-connecting-ip": "198.51.100.42" },
    });
    expect(getClientIp(req1)).toBe("198.51.100.42");

    const req2 = new Request("https://castov.com", {
      headers: { "x-forwarded-for": "198.51.100.99, 10.0.0.1" },
    });
    expect(getClientIp(req2)).toBe("198.51.100.99");
  });
});

describe("Hardened Zero-Knowledge Vault Cryptography (AES-256-GCM + PBKDF2 600k)", () => {
  it("encrypts and decrypts payload correctly with high-entropy keys", async () => {
    const plaintext = "DATABASE_URL=postgres://user:pass@db.internal:5432/main\nAPI_SECRET=cst_live_9988776655";
    const passphrase = "CorrectHorseBatteryStaple#2026!";

    const encrypted = await encryptEnvVault(plaintext, passphrase);
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.salt).toBeDefined();

    const decrypted = await decryptEnvVault(encrypted, passphrase);
    expect(decrypted).toBe(plaintext);
  });

  it("fails decryption when passphrase is incorrect", async () => {
    const encrypted = await encryptEnvVault("SECRET_VALUE=12345", "RightPassword123!");
    await expect(decryptEnvVault(encrypted, "WrongPassword999!")).rejects.toThrow(
      "Decryption failed"
    );
  });
});
