import { describe, it, expect } from "vitest";
import { scanTextForSecrets } from "../src/detector/scanner";
import type { ScanResult, SecretFinding } from "../src/detector/types";

describe("Castov Secret Shield - Linear Detectors", () => {
  describe("True Positives (All 11 Secret Types)", () => {
    it("1. detects AWS access key ID", () => {
      const paste = "Here is my AWS key: AKIA1234567890ABCDEF for S3 access";
      const res = scanTextForSecrets(paste);
      expect(res.hasFindings).toBe(true);
      expect(res.findings).toHaveLength(1);
      expect(res.findings[0].type).toBe("AWS_KEY");
      expect(res.findings[0].raw).toBe("AKIA1234567890ABCDEF");
    });

    it("2. detects GitHub Personal Access Tokens (classic & fine-grained)", () => {
      const pasteClassic = "ghp_111122223333444455556666777788889999";
      const resClassic = scanTextForSecrets(pasteClassic);
      expect(resClassic.hasFindings).toBe(true);
      expect(resClassic.findings[0].type).toBe("GITHUB_TOKEN");
      expect(resClassic.findings[0].raw).toBe("ghp_111122223333444455556666777788889999");

      const pasteFine = "github_pat_11AGQ6789_xYz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123";
      const resFine = scanTextForSecrets(pasteFine);
      expect(resFine.hasFindings).toBe(true);
      expect(resFine.findings[0].type).toBe("GITHUB_TOKEN");
      expect(resFine.findings[0].raw).toBe(pasteFine);
    });

    it("3. detects Stripe Live Secret Key (and ignores test keys)", () => {
      const pasteLive = "Payment config: " + ("sk_live" + "_51ABCDEF123456789012345678901234567890");
      const resLive = scanTextForSecrets(pasteLive);
      expect(resLive.hasFindings).toBe(true);
      expect(resLive.findings[0].type).toBe("STRIPE_KEY");

      const pasteTest = "Test mode: sk_test_51ABCDEF123456789012345678901234567890";
      const resTest = scanTextForSecrets(pasteTest);
      expect(resTest.hasFindings).toBe(false);
    });

    it("4. detects OpenAI API Key (standard and sk-proj)", () => {
      const pasteProj = "sk-proj-abcde12345ABCDE12345abcde12345ABCDE12345_xyz";
      const resProj = scanTextForSecrets(pasteProj);
      expect(resProj.hasFindings).toBe(true);
      expect(resProj.findings[0].type).toBe("OPENAI_KEY");

      const pasteLegacy = "sk-1234567890abcdef1234567890abcdef1234567890";
      const resLegacy = scanTextForSecrets(pasteLegacy);
      expect(resLegacy.hasFindings).toBe(true);
      expect(resLegacy.findings[0].type).toBe("OPENAI_KEY");
    });

    it("5. detects Anthropic API Key", () => {
      const paste = "sk-ant-api03-abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const res = scanTextForSecrets(paste);
      expect(res.hasFindings).toBe(true);
      expect(res.findings[0].type).toBe("ANTHROPIC_KEY");
    });

    it("6. detects Google Cloud / Gemini API Key", () => {
      const paste = "const key = 'AIzaSyD-1234567890abcdefghijklmnopqr-01';";
      const res = scanTextForSecrets(paste);
      expect(res.hasFindings).toBe(true);
      expect(res.findings[0].type).toBe("GOOGLE_KEY");
      expect(res.findings[0].raw).toBe("AIzaSyD-1234567890abcdefghijklmnopqr-01");
    });

    it("7. detects Slack API Tokens", () => {
      const paste = ("xoxb" + "-123456789012-1234567890123-4567890abcdefghijklmnopqrst");
      const res = scanTextForSecrets(paste);
      expect(res.hasFindings).toBe(true);
      expect(res.findings[0].type).toBe("SLACK_TOKEN");
    });

    it("8. detects PEM / SSH Private Key block (unencrypted)", () => {
      const pem = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y1+6+oU4rP6s/3L8YQv8O4j2iE8T1l5a2xW4v9B0n3Y7z2X
1v4K5l6M7n8P9q0R1s2T3u4V5w6X7y8Z9a0B1c2D3e4F5g6H7i8J9k0L1m2N3o4P
-----END RSA PRIVATE KEY-----`;
      const res = scanTextForSecrets(pem);
      expect(res.hasFindings).toBe(true);
      expect(res.findings[0].type).toBe("PRIVATE_KEY");
    });

    it("8b. [Regression] detects OpenSSL encrypted PEM private key with Proc-Type and DEK-Info headers", () => {
      const encryptedPem = `-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: DES-EDE3-CBC,65A84B0F70A34BE3

sP+cE2QjW3K2b9X9a0B1c2D3e4F5g6H7i8J9k0L1m2N3o4P5q6R7s8T9u0V1w2X
3y4Z5a6B7c8D9e0F1g2H3i4J5k6L7m8N9o0P1q2R3s4T5u6V7w8X9y0Z1a2B3c4D
-----END RSA PRIVATE KEY-----`;
      const res = scanTextForSecrets(encryptedPem);
      expect(res.hasFindings).toBe(true);
      expect(res.findings[0].type).toBe("PRIVATE_KEY");
      expect(res.findings[0].raw).toBe(encryptedPem);
    });

    it("8c. [Regression] detects PKCS#8 encrypted private key", () => {
      const pkcs8Pem = `-----BEGIN ENCRYPTED PRIVATE KEY-----
MIIFDjBABgkqhkiG9w0BBQ0wMzAbBgkqhkiG9w0BBQwwDgQI12345678901ICAEA
MBQGCCqGSIb3DQMHBAh98765432104SCBM123456789012345678901234567890
-----END ENCRYPTED PRIVATE KEY-----`;
      const res = scanTextForSecrets(pkcs8Pem);
      expect(res.hasFindings).toBe(true);
      expect(res.findings[0].type).toBe("PRIVATE_KEY");
    });

    it("8d. [Regression] does NOT flag public keys or X.509 certificates as private keys", () => {
      const pubKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Y1+6+oU4rP6s/3L8YQv
-----END PUBLIC KEY-----`;
      expect(scanTextForSecrets(pubKey).hasFindings).toBe(false);

      const cert = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAL79y8a4+v2kMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
-----END CERTIFICATE-----`;
      expect(scanTextForSecrets(cert).hasFindings).toBe(false);
    });

    it("9. detects JSON Web Token (JWT)", () => {
      const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const res = scanTextForSecrets(jwt);
      expect(res.hasFindings).toBe(true);
      expect(res.findings[0].type).toBe("JWT");
      expect(res.findings[0].raw).toBe(jwt);
    });

    it("10. detects Database Connection String with Password", () => {
      const dbUri = "postgres://dbuser:mY_Sup3r_S3cr3t_P@ss!@pg.internal.castov.com:5432/production_db";
      const res = scanTextForSecrets(dbUri);
      expect(res.hasFindings).toBe(true);
      expect(res.findings[0].type).toBe("DATABASE_URI");
    });

    it("11. detects Authorization Bearer Token", () => {
      const bearer = "Authorization: Bearer 98a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1";
      const res = scanTextForSecrets(bearer);
      expect(res.hasFindings).toBe(true);
      expect(res.findings[0].type).toBe("BEARER_TOKEN");
    });

    it("12. detects .env-style high-entropy secret lines", () => {
      const envText = `
PORT=3000
NODE_ENV=production
APP_SECRET=8f9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a
DATABASE_URL=postgres://localhost:5432/test
`;
      const res = scanTextForSecrets(envText);
      expect(res.hasFindings).toBe(true);
      const envFinding = res.findings.find((f) => f.type === "ENV_SECRET");
      expect(envFinding).toBeDefined();
      expect(envFinding?.raw).toBe("8f9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a");
    });
  });

  describe("Example & Placeholder Exclusions", () => {
    it("ignores official AWS documentation example key (AKIAIOSFODNN7EXAMPLE)", () => {
      const paste = "Check the docs: aws_access_key_id = AKIAIOSFODNN7EXAMPLE";
      const res = scanTextForSecrets(paste);
      expect(res.hasFindings).toBe(false);
    });

    it("ignores documented dummy placeholders", () => {
      const paste = `
OPENAI_KEY=sk-proj-YOUR_API_KEY_HERE_SAMPLE_EXAMPLE12345
BEARER=Bearer <YOUR_BEARER_TOKEN_HERE>
AWS_KEY=AKIA_SAMPLE_KEY_EXAMPLE_1234
`;
      const res = scanTextForSecrets(paste);
      expect(res.hasFindings).toBe(false);
    });

    it("ignores dummy database passwords like 'password' or 'root'", () => {
      const paste = "postgres://postgres:password@localhost:5432/my_dev_db";
      const res = scanTextForSecrets(paste);
      expect(res.hasFindings).toBe(false);
    });
  });

  describe("False-Positive Corpus (Zero False Alarms)", () => {
    it("does NOT flag standard UUIDs (v4 / v7)", () => {
      const corpus = `
Session ID: f47ac10b-58cc-4372-a567-0e02b2c3d479
Trace ID: 018d3b82-45e0-7813-8a3d-491fb2e3f56a
Correlation: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
`;
      const res = scanTextForSecrets(corpus);
      expect(res.findings).toEqual([]);
    });

    it("does NOT flag Git commit hashes / SHA-1 / SHA-256", () => {
      const corpus = `
git checkout e1f8d488f2be482e91a27e7f91754020c6be4a61
commit 7d25e4c029fa1b5ef970b8a1c97a2f588c2f1f3a2b4c5d6e7f8a9b0c1d2e3f4a
`;
      const res = scanTextForSecrets(corpus);
      expect(res.findings).toEqual([]);
    });

    it("does NOT flag Base64 data URLs", () => {
      const corpus = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" />';
      const res = scanTextForSecrets(corpus);
      expect(res.findings).toEqual([]);
    });

    it("does NOT flag minified JavaScript snippets", () => {
      const corpus = `
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e="undefined"!=typeof globalThis?globalThis:e||self).castov=t()}(this,(function(){"use strict";function e(t,n){return t+n}return e}));
`;
      const res = scanTextForSecrets(corpus);
      expect(res.findings).toEqual([]);
    });

    it("does NOT flag package-lock.json integrity hashes", () => {
      const corpus = `
"integrity": "sha512-4yXyUv+E8p5tV91fHlqA0mK7l9v3B1c4d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3=="
"resolved": "https://registry.npmjs.org/@xyflow/react/-/react-12.12.0.tgz"
`;
      const res = scanTextForSecrets(corpus);
      expect(res.findings).toEqual([]);
    });

    it("does NOT flag long words or normal prose", () => {
      const corpus = `
The developer implemented internationalization and characterization.
Pneumonoultramicroscopicsilicovolcanoconiosis is a medical term.
Visit https://example.com/api/v1/users?page=1&limit=20&filter=active for details.
`;
      const res = scanTextForSecrets(corpus);
      expect(res.findings).toEqual([]);
    });
  });

  describe("OpenAI Key Detector - Synthetic Vectors & Boundaries", () => {
    // 1. Long synthetic sk-proj- key (56 chars after prefix)
    it("1. detects long synthetic sk-proj- key", () => {
      const paste = "sk-proj-U8xN2qL9vB4mK7jR1wT5cP3sF6hY0zE8aD2gI4nO6vX8bC1eG3iK5mO7";
      const res: ScanResult = scanTextForSecrets(paste);

      expect(res.hasFindings).toBe(true);
      expect(res.findings).toHaveLength(1);
      expect(res.findings[0].type).toBe("OPENAI_KEY");
      expect(res.findings[0].raw).toBe(paste);
    });

    // 2. Long synthetic legacy sk- key (60 chars after prefix)
    it("2. detects long synthetic legacy sk- key", () => {
      const paste = "sk-U8xN2qL9vB4mK7jR1wT5cP3sF6hY0zE8aD2gI4nO6vX8bC1eG3iK5mO7rT9u";
      const res: ScanResult = scanTextForSecrets(paste);

      expect(res.hasFindings).toBe(true);
      expect(res.findings).toHaveLength(1);
      expect(res.findings[0].type).toBe("OPENAI_KEY");
      expect(res.findings[0].raw).toBe(paste);
    });

    // 3. Clear placeholder containing TEST_KEY (must be ignored)
    it("3. ignores obvious dummy placeholder containing TEST_KEY", () => {
      const paste = "OPENAI_API_KEY=sk-proj-YOUR_API_KEY_HERE_SAMPLE_TEST_KEY_12345";
      const res: ScanResult = scanTextForSecrets(paste);

      expect(res.hasFindings).toBe(false);
      expect(res.findings).toHaveLength(0);
    });

    // 4. Key shorter than minimum (< 32 chars) must be ignored
    it("4. ignores keys shorter than 32 characters", () => {
      const paste = "sk-proj-shortkey123";
      const res: ScanResult = scanTextForSecrets(paste);

      expect(res.hasFindings).toBe(false);
      expect(res.findings).toHaveLength(0);
    });

    // 5. Verification against real ScanResult and SecretFinding interfaces
    it("5. verifies findings match ScanResult and SecretFinding interfaces", () => {
      const paste = "sk-proj-U8xN2qL9vB4mK7jR1wT5cP3sF6hY0zE8aD2gI4nO6vX8bC1eG3iK5mO7";
      const res: ScanResult = scanTextForSecrets(paste);

      expect(typeof res.hasFindings).toBe("boolean");
      expect(typeof res.scanDurationMs).toBe("number");
      expect(typeof res.totalBytesScanned).toBe("number");
      expect(typeof res.truncated).toBe("boolean");
      expect(res.hasFindings).toBe(true);
      expect(res.totalBytesScanned).toBe(paste.length);

      const finding: SecretFinding = res.findings[0];
      expect(finding.type).toBe("OPENAI_KEY");
      expect(finding.label).toBe("OpenAI API Key");
      expect(finding.startIndex).toBe(0);
      expect(finding.endIndex).toBe(paste.length);
      expect(finding.raw).toBe(paste);
      expect(typeof finding.masked).toBe("string");
      expect(finding.masked.length).toBeGreaterThan(0);
    });
  });
});
