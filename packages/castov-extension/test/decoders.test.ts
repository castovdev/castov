import { describe, it, expect } from "vitest";
import { decodeJwtLocally } from "../src/decoder/jwt";
import { decodeTimestampLocally } from "../src/decoder/timestamp";
import { decodeBase64Locally } from "../src/decoder/base64";
import { decodeSelectionLocally } from "../src/decoder/index";

describe("Castov Secret Shield - Local Decoders (Offline & In-Memory)", () => {
  describe("JWT Decoder", () => {
    it("decodes valid JWT header and payload", () => {
      // Header: {"alg":"HS256","typ":"JWT"}, Payload: {"sub":"user_123","role":"admin","iat":1516239022}
      const jwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTUxNjIzOTAyMn0.4flKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

      const res = decodeJwtLocally(jwt);
      expect(res).not.toBeNull();
      expect(res?.header).toEqual({ alg: "HS256", typ: "JWT" });
      expect(res?.payload.sub).toBe("user_123");
      expect(res?.payload.role).toBe("admin");
      expect(res?.issuedAtIso).toBe(new Date(1516239022 * 1000).toISOString());
    });

    it("evaluates expired and active status accurately", () => {
      // Expired in 2020 (exp: 1577836800)
      const expiredPayload = Buffer.from(JSON.stringify({ sub: "test", exp: 1577836800 })).toString("base64url");
      const expiredJwt = `eyJhbGciOiJIUzI1NiJ9.${expiredPayload}.signature`;

      const resExpired = decodeJwtLocally(expiredJwt);
      expect(resExpired?.isExpired).toBe(true);
      expect(resExpired?.expiresInSummary).toContain("Expired");

      // Future expiration in 2099 (exp: 4102444800)
      const futurePayload = Buffer.from(JSON.stringify({ sub: "test", exp: 4102444800 })).toString("base64url");
      const futureJwt = `eyJhbGciOiJIUzI1NiJ9.${futurePayload}.signature`;

      const resFuture = decodeJwtLocally(futureJwt);
      expect(resFuture?.isExpired).toBe(false);
      expect(resFuture?.expiresInSummary).toContain("Unexpired");
      expect(resFuture?.expiresInSummary).toContain("signature not verified");
    });

    it("returns null for malformed or non-JWT strings", () => {
      expect(decodeJwtLocally("not.a.jwt")).toBeNull();
      expect(decodeJwtLocally("")).toBeNull();
      expect(decodeJwtLocally("abc.def")).toBeNull();
    });
  });

  describe("Timestamp Decoder", () => {
    it("decodes 10-digit seconds timestamp to UTC and Local formats", () => {
      const tsSec = "1700000000"; // 2023-11-14T22:13:20.000Z
      const res = decodeTimestampLocally(tsSec);

      expect(res).not.toBeNull();
      expect(res?.unit).toBe("seconds");
      expect(res?.utcIso).toBe("2023-11-14T22:13:20.000Z");
      expect(res?.utcString).toBe("Tue, 14 Nov 2023 22:13:20 GMT");
      expect(res?.relative).toContain("ago");
    });

    it("decodes 13-digit milliseconds timestamp", () => {
      const tsMs = "1700000000000";
      const res = decodeTimestampLocally(tsMs);

      expect(res).not.toBeNull();
      expect(res?.unit).toBe("milliseconds");
      expect(res?.utcIso).toBe("2023-11-14T22:13:20.000Z");
    });

    it("rejects non-numeric or out-of-range inputs", () => {
      expect(decodeTimestampLocally("12345")).toBeNull(); // Too short
      expect(decodeTimestampLocally("abc1234567890")).toBeNull(); // Non-numeric
      expect(decodeTimestampLocally("9999999999999999")).toBeNull(); // Year > 2100
    });
  });

  describe("Base64 Decoder", () => {
    it("decodes standard Base64 string with UTF-8 support", () => {
      const encoded = Buffer.from("Hello Castov Shield! 🛡️").toString("base64");
      const res = decodeBase64Locally(encoded);

      expect(res).not.toBeNull();
      expect(res?.decodedText).toBe("Hello Castov Shield! 🛡️");
      expect(res?.isBinary).toBe(false);
    });

    it("decodes base64url characters (- and _)", () => {
      const encoded = Buffer.from("Sample query string?test=true&ok=1").toString("base64url");
      const res = decodeBase64Locally(encoded);

      expect(res).not.toBeNull();
      expect(res?.decodedText).toBe("Sample query string?test=true&ok=1");
    });
  });

  describe("Unified Selection Auto-Inspection", () => {
    it("auto-detects JWT selection", () => {
      const jwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const inspected = decodeSelectionLocally(jwt);

      expect(inspected.type).toBe("jwt");
      expect(inspected.title).toBe("JWT Decoded");
      expect(inspected.jwt).toBeDefined();
    });

    it("auto-detects timestamp selection", () => {
      const inspected = decodeSelectionLocally("1700000000");
      expect(inspected.type).toBe("timestamp");
      expect(inspected.title).toBe("Unix Timestamp Decoded");
    });

    it("auto-detects base64 selection", () => {
      const encoded = Buffer.from("Quick test message").toString("base64");
      const inspected = decodeSelectionLocally(encoded);
      expect(inspected.type).toBe("base64");
      expect(inspected.copyableContent).toBe("Quick test message");
    });

    it("[Regression] caps huge selected input to prevent thread latency (> 64 KB)", () => {
      const hugeInput = "a".repeat(70000); // 70 KB
      const inspected = decodeSelectionLocally(hugeInput);
      expect(inspected.title).toBe("Selection Exceeds Limit");
      expect(inspected.summary).toContain("exceeds the 64 KB limit");
      expect(inspected.copyableContent).toContain("TRUNCATED");
    });

    it("[Regression] safely decodes inputs right under the limit (64 KB)", () => {
      const nearLimit = "1700000000";
      const inspected = decodeSelectionLocally(nearLimit);
      expect(inspected.type).toBe("timestamp");
      expect(inspected.title).toBe("Unix Timestamp Decoded");
    });
  });
});
