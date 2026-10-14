import { describe, expect, it } from "vitest";
import {
  toBase64,
  fromBase64,
  md5,
  sha256,
  crc32,
  calculateEntropy,
  getEntropyAssessment,
  generateHexDump,
  rot13,
  rot47,
  caesarCipher,
  caesarBruteForce,
  atbash,
  xorCipher,
  xorBruteForce,
  vigenereCipher,
  hexEncode,
  hexDecode,
  binaryEncode,
  binaryDecode,
  morseEncode,
  morseDecode,
  htmlEscape,
  htmlUnescape,
  unicodeEscape,
  unicodeUnescape,
  decodeJwtFormatted,
  detectMagic,
  executeRecipe,
  serializeSharePayload,
  deserializeSharePayload,
  OPERATIONS,
  type RecipeStep,
} from "@/lib/cyber-engine";

describe("CyberEngine - Encodings", () => {
  it("encodes and decodes Base64 accurately", () => {
    const text = "Hello, Castov! 🚀 123";
    const encoded = toBase64(text);
    expect(fromBase64(encoded)).toBe(text);

    const urlSafe = toBase64("subject?query=test+value", true);
    expect(urlSafe).not.toContain("+");
    expect(urlSafe).not.toContain("/");
    expect(fromBase64(urlSafe)).toBe("subject?query=test+value");
  });

  it("encodes and decodes Hex formats", () => {
    const str = "Castov";
    const hex = hexEncode(str, "space");
    expect(hex).toBe("43 61 73 74 6f 76");
    expect(hexDecode(hex)).toBe(str);

    const hex0x = hexEncode(str, "0x");
    expect(hex0x).toBe("0x43 0x61 0x73 0x74 0x6f 0x76");
    expect(hexDecode(hex0x)).toBe(str);

    expect(hexDecode("436173746f76")).toBe(str);
  });

  it("encodes and decodes 8-bit Binary", () => {
    const text = "Hi";
    const bin = binaryEncode(text);
    expect(bin).toBe("01001000 01101001");
    expect(binaryDecode(bin)).toBe(text);
  });

  it("encodes and decodes Morse Code", () => {
    const text = "SOS";
    const morse = morseEncode(text);
    expect(morse).toBe("... --- ...");
    expect(morseDecode(morse)).toBe("SOS");
  });

  it("escapes and unescapes HTML entities", () => {
    const raw = '<script alert("1")>&copy;\'test\'</script>';
    const escaped = htmlEscape(raw);
    expect(escaped).toContain("&lt;script");
    expect(escaped).toContain("&amp;copy;");
    expect(htmlUnescape(escaped)).toBe(raw);
  });

  it("escapes and unescapes Unicode sequences", () => {
    const unicode = "Castov ✨";
    const escaped = unicodeEscape(unicode);
    expect(escaped).toContain("\\u2728");
    expect(unicodeUnescape(escaped)).toBe(unicode);
  });

  it("inspects and decodes JWT tokens", () => {
    const sampleJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE4MDAwMDAwMDB9.4epK_iH-rUvU02t_8r5z04n";
    const res = decodeJwtFormatted(sampleJwt);
    const parsed = JSON.parse(res);
    expect(parsed.header.alg).toBe("HS256");
    expect(parsed.payload.name).toBe("John Doe");
    expect(parsed._expiration.timestamp).toBe(1800000000);
    expect(parsed._signatureVerified).toBe(false);
    expect(parsed._securityNotice).toContain("UNVERIFIED");
  });
});

describe("CyberEngine - Ciphers & Cryptography", () => {
  it("performs ROT13 and ROT47", () => {
    const text = "The Quick Brown Fox Jumps Over 13 Lazy Dogs.";
    const r13 = rot13(text);
    expect(rot13(r13)).toBe(text);

    const r47 = rot47(text);
    expect(rot47(r47)).toBe(text);
  });

  it("performs Caesar cipher and brute-force ranking", () => {
    const original = "the secret flag is castov";
    const shifted = caesarCipher(original, 3);
    expect(shifted).not.toBe(original);
    expect(caesarCipher(shifted, -3)).toBe(original);

    const bf = caesarBruteForce(shifted);
    expect(bf.length).toBe(25);
    // The top candidate should score the highest or near highest
    const topMatch = bf.find((c) => c.sample.includes("the secret flag is castov"));
    expect(topMatch).toBeDefined();
    expect(topMatch!.score).toBeGreaterThan(0);
  });

  it("performs Atbash mirror cipher", () => {
    const text = "ABCxyz";
    const mirrored = atbash(text);
    expect(mirrored).toBe("ZYXcba");
    expect(atbash(mirrored)).toBe(text);
  });

  it("performs XOR cipher and single-byte brute force", () => {
    const message = "Hello from Castov CyberChef!";
    const encrypted = xorCipher(message, "0x5A");
    expect(encrypted).not.toBe(message);
    const decrypted = xorCipher(encrypted, "0x5A");
    expect(decrypted).toBe(message);

    const bf = xorBruteForce(encrypted);
    expect(bf.length).toBeGreaterThan(0);
    const candidate = bf.find((c) => c.key === "0x5A");
    expect(candidate).toBeDefined();
    expect(candidate!.sample).toContain("Hello from Castov");
  });

  it("performs Vigenère cipher encryption and decryption", () => {
    const text = "ATTACKATDAWN";
    const key = "LEMON";
    const encrypted = vigenereCipher(text, key, false);
    expect(encrypted).toBe("LXFOPVEFRNHR");
    const decrypted = vigenereCipher(encrypted, key, true);
    expect(decrypted).toBe(text);
  });
});

describe("CyberEngine - Hashes, Entropy & Diagnostics", () => {
  it("calculates MD5, SHA-256 and CRC-32", () => {
    const input = "castov";
    expect(md5(input)).toBe("813c0e5c778967c7491488ba8f7cde8a");
    expect(sha256(input)).toBe("08ea93be9e41e398f952e1e24f7fc6d37c5e30b1a885514acd57d985afea934e");
    expect(crc32(input)).toHaveLength(8);
    expect(crc32(input)).toHaveLength(8);
  });

  it("calculates Shannon Entropy accurately", () => {
    const low = "AAAAAAAAAA";
    expect(calculateEntropy(low)).toBe(0);
    expect(getEntropyAssessment(0).level).toBe("low");

    const english = "This is a normal English sentence with predictable letter frequencies.";
    const engEntropy = calculateEntropy(english);
    expect(engEntropy).toBeGreaterThan(3);
    expect(engEntropy).toBeLessThan(5);

    const high = "u4k9$!mP90@#zLq*&^xCvB1%9012!@#";
    expect(calculateEntropy(high)).toBeGreaterThan(4);
  });

  it("generates Hex Dump rows", () => {
    const rows = generateHexDump("Hello World! This is a test.");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].offset).toBe("00000000");
    expect(rows[0].ascii).toContain("Hello World!");
  });
});

describe("CyberEngine - Magic Detector", () => {
  it("detects JWT tokens", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgN_p_v_dummy_sig";
    const findings = detectMagic(jwt);
    expect(findings.some((f) => f.type === "jwt")).toBe(true);
  });

  it("detects Base64 printable strings", () => {
    const b64 = toBase64("Castov secure workbench for cyber tools");
    const findings = detectMagic(b64);
    expect(findings.some((f) => f.type === "base64")).toBe(true);
  });

  it("detects Hex string", () => {
    const hex = "48656c6c6f20576f726c64";
    const findings = detectMagic(hex);
    expect(findings.some((f) => f.type === "hex")).toBe(true);
  });

  it("detects URL encoding", () => {
    const url = "https%3A%2F%2Fcastov.com%2Ftools%3Fquery%3Dtest";
    const findings = detectMagic(url);
    expect(findings.some((f) => f.type === "url")).toBe(true);
  });

  it("detects HTML entities", () => {
    const html = "&lt;span class=&quot;badge&quot;&gt;Cyber&lt;/span&gt;";
    const findings = detectMagic(html);
    expect(findings.some((f) => f.type === "html")).toBe(true);
  });

  it("detects Binary bitstream", () => {
    const bin = "01000011 01100001 01110011 01110100 01101111 01110110";
    const findings = detectMagic(bin);
    expect(findings.some((f) => f.type === "binary")).toBe(true);
  });

  it("detects Morse code", () => {
    const morse = "... --- ...";
    const findings = detectMagic(morse);
    expect(findings.some((f) => f.type === "morse")).toBe(true);
  });

  it("detects JSON and Hashes", () => {
    const json = '{"status":"ok","users":42}';
    expect(detectMagic(json).some((f) => f.type === "json")).toBe(true);

    const md5Hash = "765275812e96d92497fbba1409d9491b";
    expect(detectMagic(md5Hash).some((f) => f.type === "hash_md5")).toBe(true);

    const sha256Hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    expect(detectMagic(sha256Hash).some((f) => f.type === "hash_sha256")).toBe(true);
  });
});

describe("CyberEngine - Recipe Execution Pipeline", () => {
  it("executes multi-step pipeline successfully", () => {
    const raw = '{"hello":"world"}';
    const b64 = toBase64(raw);

    const steps: RecipeStep[] = [
      { id: "1", opId: "base64_decode", params: {}, enabled: true },
      { id: "2", opId: "json_beautify", params: { indent: "2" }, enabled: true },
    ];

    const result = executeRecipe(b64, steps);
    expect(result.errorMessage).toBeUndefined();
    expect(result.stepResults).toHaveLength(2);
    expect(result.output).toBe(JSON.stringify({ hello: "world" }, null, 2));
  });

  it("respects enabled/disabled step flags", () => {
    const input = "castov";
    const steps: RecipeStep[] = [
      { id: "1", opId: "uppercase", params: {}, enabled: false },
      { id: "2", opId: "rot13", params: {}, enabled: true },
    ];

    const result = executeRecipe(input, steps);
    expect(result.output).toBe(rot13("castov"));
    expect(result.stepResults).toHaveLength(1);
  });

  it("handles step failures gracefully without crashing", () => {
    const badBase64 = "this is not base64 %%%";
    const steps: RecipeStep[] = [
      { id: "1", opId: "hex_decode", params: {}, enabled: true },
    ];

    const result = executeRecipe(badBase64, steps);
    expect(result.errorMessage).toBeDefined();
    expect(result.errorStepIndex).toBe(0);
  });

  it("registers all operations with valid run functions", () => {
    expect(OPERATIONS.length).toBeGreaterThan(30);
    for (const op of OPERATIONS) {
      expect(op.id).toBeDefined();
      expect(op.name).toBeDefined();
      expect(typeof op.run).toBe("function");
    }
  });
});

describe("CyberEngine - Security, Privacy & DoS Hardening", () => {
  it("serializeSharePayload defaults to excluding input data to prevent credential leaks", () => {
    const sensitiveInput = "AIzaSyD-dummy-api-key-secret-12345";
    const steps: RecipeStep[] = [{ id: "1", opId: "base64_decode", params: {}, enabled: true }];

    // By default: includeInput is false
    const hashDefault = serializeSharePayload(steps, sensitiveInput);
    const parsedDefault = deserializeSharePayload(hashDefault);

    expect(parsedDefault).not.toBeNull();
    expect(parsedDefault?.hasInput).toBe(false);
    expect(parsedDefault?.input).toBeUndefined();
    expect(parsedDefault?.steps).toHaveLength(1);
    expect(parsedDefault?.steps[0].opId).toBe("base64_decode");
  });

  it("serializeSharePayload with explicit opt-in includes safely truncated input", () => {
    const sampleInput = "public-ctf-sample-flag{123}";
    const steps: RecipeStep[] = [{ id: "1", opId: "rot13", params: {}, enabled: true }];

    const hashWithInput = serializeSharePayload(steps, sampleInput, true);
    const parsed = deserializeSharePayload(hashWithInput);

    expect(parsed).not.toBeNull();
    expect(parsed?.hasInput).toBe(true);
    expect(parsed?.input).toBe(sampleInput);
    expect(parsed?.steps[0].opId).toBe("rot13");
  });

  it("deserializeSharePayload rejects malformed or oversized hashes safely", () => {
    expect(deserializeSharePayload("")).toBeNull();
    expect(deserializeSharePayload("invalid-non-base64-!@#$%^&*()")).toBeNull();

    // Oversized hash (> 16KB)
    const giantHash = "A".repeat(20000);
    expect(deserializeSharePayload(giantHash)).toBeNull();
  });

  it("deserializeSharePayload rejects prototype pollution and unknown operations", () => {
    // Malicious payload trying to inject __proto__ or unknown operations
    const malicious = JSON.stringify({
      v: 1,
      ["__proto__"]: { polluted: true },
      steps: [
        { opId: "malicious_eval_op", params: { code: "alert(1)" } },
        { opId: "base64_decode", params: {} },
      ],
    });
    const bytes = new TextEncoder().encode(malicious);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const hash = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_");

    const result = deserializeSharePayload(hash);
    expect(result).toBeNull(); // Reject prototype pollution
    expect(({} as any).polluted).toBeUndefined();
  });

  it("deserializeSharePayload drops unknown operations and sanitizes parameters", () => {
    const payload = JSON.stringify({
      v: 1,
      steps: [
        { opId: "unknown_hack_tool", params: { foo: "bar" } },
        { opId: "caesar", params: { shift: "25", injectedProp: "bad" } },
      ],
    });
    const bytes = new TextEncoder().encode(payload);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const hash = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_");

    const result = deserializeSharePayload(hash);
    expect(result).not.toBeNull();
    // Unknown operation was dropped
    expect(result?.steps).toHaveLength(1);
    expect(result?.steps[0].opId).toBe("caesar");
    // Parameter was coerced and injected property was dropped
    expect(result?.steps[0].params.shift).toBe(25);
    expect(result?.steps[0].params.injectedProp).toBeUndefined();
  });

  it("fromBase64 strictly rejects non-Base64 characters without crashing", () => {
    expect(() => fromBase64("this is definitely not base64!!")).toThrow(/Invalid Base64/);
    expect(() => fromBase64("====")).toThrow(/Invalid Base64/);
  });

  it("decodeJwtFormatted rejects oversized tokens and malformed JSON safely", () => {
    const hugeToken = "a".repeat(70000);
    expect(() => decodeJwtFormatted(hugeToken)).toThrow(/maximum allowed limit/);

    const badJsonToken = "bm90LWpzb24.bm90LWpzb24";
    expect(() => decodeJwtFormatted(badJsonToken)).toThrow(/unable to parse JSON/);
  });

  it("executeRecipe enforces 5MB input safety bound", () => {
    const hugeInput = "X".repeat(6 * 1024 * 1024); // 6MB
    const steps: RecipeStep[] = [{ id: "1", opId: "uppercase", params: {}, enabled: true }];
    const result = executeRecipe(hugeInput, steps);
    expect(result.errorMessage).toContain("exceeds maximum safe in-browser size limit");
  });

  it("caesarBruteForce and xorBruteForce handle large inputs within milliseconds", () => {
    const largeText = "The quick brown fox jumps over the lazy dog. ".repeat(2000); // ~90KB
    const start = performance.now();
    const caesarCandidates = caesarBruteForce(largeText);
    const xorCandidates = xorBruteForce(largeText);
    const duration = performance.now() - start;

    expect(caesarCandidates.length).toBe(25);
    expect(xorCandidates.length).toBeGreaterThan(0);
    // Must execute fast without freezing the thread
    expect(duration).toBeLessThan(200);
  });

  it("calculateEntropy samples large inputs without CPU lockup", () => {
    const largePayload = "A".repeat(500000);
    const start = performance.now();
    const entropy = calculateEntropy(largePayload);
    const duration = performance.now() - start;

    expect(entropy).toBe(0);
    expect(duration).toBeLessThan(50);
  });

  it("extract_urls does not extract or execute javascript: URIs", () => {
    const attackText = 'Check out javascript:alert("XSS") and https://castov.com/tools';
    const op = OPERATIONS.find((o) => o.id === "extract_urls")!;
    const res = op.run(attackText, {});
    expect(res).not.toContain("javascript:");
    expect(res).toContain("https://castov.com/tools");
  });

  it("htmlEscape neutralizes executable XSS script tags", () => {
    const xss = '<img src=x onerror="alert(document.cookie)">';
    const escaped = htmlEscape(xss);
    expect(escaped).not.toContain("<img");
    expect(escaped).not.toContain(">");
    expect(escaped).toContain("&lt;img");
  });
});
