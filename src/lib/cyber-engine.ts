/**
 * CyberChef Engine & Magic Decoder
 * Pure TypeScript, zero external dependencies, 100% client-side execution.
 * Provides encoding/decoding, ciphers, hashing, entropy analysis, and automatic data format detection.
 */

// ---------------------------------------------------------------------------
// 1. Text & Base64 Utilities (Isomorphic: Node & Browser)
// ---------------------------------------------------------------------------

export function toBase64(str: string, urlSafe = false): string {
  let b64: string;
  if (typeof Buffer !== "undefined") {
    b64 = Buffer.from(str, "utf-8").toString("base64");
  } else {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    b64 = btoa(bin);
  }
  if (urlSafe) {
    b64 = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return b64;
}

export function fromBase64(str: string): string {
  let clean = str.trim().replace(/-/g, "+").replace(/_/g, "/");
  while (clean.length % 4 !== 0) {
    clean += "=";
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(clean, "base64").toString("utf-8");
  }
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// ---------------------------------------------------------------------------
// 2. Pure JS Cryptographic Hash Functions (MD5, SHA-256, CRC-32)
// ---------------------------------------------------------------------------

export function md5(str: string): string {
  const bytes = new TextEncoder().encode(str);
  function safeAdd(x: number, y: number) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRol(num: number, cnt: number) {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return safeAdd(bitRol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  const n = bytes.length;
  const wordCount = (((n + 8) >> 6) + 1) << 4;
  const words = new Int32Array(wordCount);
  for (let i = 0; i < n; i++) {
    words[i >> 2] |= (bytes[i] & 0xff) << ((i % 4) << 3);
  }
  words[n >> 2] |= 0x80 << ((n % 4) << 3);
  words[wordCount - 2] = (n * 8) & 0xffffffff;
  words[wordCount - 1] = Math.floor((n * 8) / 0x100000000);

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < wordCount; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;

    a = md5ff(a, b, c, d, words[i + 0], 7, -680876936);
    d = md5ff(d, a, b, c, words[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, words[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, words[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, words[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, words[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, words[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, words[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, words[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, words[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, words[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, words[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, words[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, words[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, words[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, words[i + 15], 22, 1236535329);

    a = md5gg(a, b, c, d, words[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, words[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, words[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, words[i + 0], 20, -373897302);
    a = md5gg(a, b, c, d, words[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, words[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, words[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, words[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, words[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, words[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, words[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, words[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, words[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, words[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, words[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, words[i + 12], 20, -1926607734);

    a = md5hh(a, b, c, d, words[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, words[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, words[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, words[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, words[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, words[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, words[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, words[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, words[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, words[i + 0], 11, -358537222);
    c = md5hh(c, d, a, b, words[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, words[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, words[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, words[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, words[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, words[i + 2], 23, -995338651);

    a = md5ii(a, b, c, d, words[i + 0], 6, -198630844);
    d = md5ii(d, a, b, c, words[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, words[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, words[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, words[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, words[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, words[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, words[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, words[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, words[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, words[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, words[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, words[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, words[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, words[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, words[i + 9], 21, -343485551);

    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  const hexDigits = "0123456789abcdef";
  function wordToHex(val: number) {
    let out = "";
    for (let i = 0; i < 4; i++) {
      const byte = (val >>> (i * 8)) & 0xff;
      out += hexDigits.charAt((byte >>> 4) & 0x0f) + hexDigits.charAt(byte & 0x0f);
    }
    return out;
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

export function sha256(str: string): string {
  const bytes = new TextEncoder().encode(str);
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let H0 = 0x6a09e667;
  let H1 = 0xbb67ae85;
  let H2 = 0x3c6ef372;
  let H3 = 0xa54ff53a;
  let H4 = 0x510e527f;
  let H5 = 0x9b05688c;
  let H6 = 0x1f83d9ab;
  let H7 = 0x5be0cd19;

  const length = bytes.length;
  const bitLength = length * 8;
  const newLength = ((length + 8) >> 6) + 1;
  const words = new Int32Array(newLength * 16);

  for (let i = 0; i < length; i++) {
    words[i >> 2] |= (bytes[i] & 0xff) << (24 - (i % 4) * 8);
  }
  words[length >> 2] |= 0x80 << (24 - (length % 4) * 8);
  words[words.length - 1] = bitLength;

  const W = new Int32Array(64);

  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t++) {
      W[t] = words[i + t];
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rightRotate(W[t - 15], 7) ^ rightRotate(W[t - 15], 18) ^ (W[t - 15] >>> 3);
      const s1 = rightRotate(W[t - 2], 17) ^ rightRotate(W[t - 2], 19) ^ (W[t - 2] >>> 10);
      W[t] = (((W[t - 16] + s0) | 0) + ((W[t - 7] + s1) | 0)) | 0;
    }

    let a = H0;
    let b = H1;
    let c = H2;
    let d = H3;
    let e = H4;
    let f = H5;
    let g = H6;
    let h = H7;

    for (let t = 0; t < 64; t++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (((h + S1) | 0) + ((ch + K[t]) | 0) + W[t]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    H0 = (H0 + a) | 0;
    H1 = (H1 + b) | 0;
    H2 = (H2 + c) | 0;
    H3 = (H3 + d) | 0;
    H4 = (H4 + e) | 0;
    H5 = (H5 + f) | 0;
    H6 = (H6 + g) | 0;
    H7 = (H7 + h) | 0;
  }

  function hexWord(h: number) {
    return (h >>> 0).toString(16).padStart(8, "0");
  }

  return (hexWord(H0) + hexWord(H1) + hexWord(H2) + hexWord(H3) + hexWord(H4) + hexWord(H5) + hexWord(H6) + hexWord(H7)).toLowerCase();
}

export function crc32(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let c = 0 ^ -1;
  for (let i = 0; i < bytes.length; i++) {
    c = (c >>> 8) ^ CRC32_TABLE[(c ^ bytes[i]) & 0xff];
  }
  return ((c ^ -1) >>> 0).toString(16).padStart(8, "0").toLowerCase();
}

const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC32_TABLE[i] = c >>> 0;
}

// ---------------------------------------------------------------------------
// 3. Shannon Entropy Calculator
// ---------------------------------------------------------------------------

export function calculateEntropy(str: string): number {
  if (!str) return 0;
  const len = str.length;
  const frequencies = new Map<string, number>();
  for (let i = 0; i < len; i++) {
    const ch = str[i];
    frequencies.set(ch, (frequencies.get(ch) || 0) + 1);
  }

  let entropy = 0;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return Math.round(entropy * 1000) / 1000;
}

export function getEntropyAssessment(entropy: number): { level: "low" | "medium" | "high"; description: string } {
  if (entropy >= 7.2) {
    return {
      level: "high",
      description: "High entropy: typical of encrypted data, compressed archives, or cryptographic keys.",
    };
  }
  if (entropy >= 5.0) {
    return {
      level: "medium",
      description: "Medium entropy: typical of Base64 encoded data, minified scripts, or binary files.",
    };
  }
  return {
    level: "low",
    description: "Low/standard entropy: typical of natural human language, plain JSON, or structured code.",
  };
}

// ---------------------------------------------------------------------------
// 4. Hex Dump Generator
// ---------------------------------------------------------------------------

export interface HexDumpRow {
  offset: string;
  hex: string;
  ascii: string;
}

export function generateHexDump(str: string, maxBytes = 4096): HexDumpRow[] {
  const bytes = new TextEncoder().encode(str.slice(0, maxBytes));
  const rows: HexDumpRow[] = [];
  const chunkSize = 16;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    const offset = i.toString(16).padStart(8, "0");
    const hexParts: string[] = [];
    let ascii = "";

    for (let j = 0; j < chunkSize; j++) {
      if (j < chunk.length) {
        const b = chunk[j];
        hexParts.push(b.toString(16).padStart(2, "0"));
        ascii += b >= 32 && b <= 126 ? String.fromCharCode(b) : ".";
      } else {
        hexParts.push("  ");
      }
    }

    const hex = hexParts.slice(0, 8).join(" ") + "  " + hexParts.slice(8).join(" ");
    rows.push({ offset, hex, ascii });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// 5. Ciphers & Transformations
// ---------------------------------------------------------------------------

export function rot13(str: string): string {
  return str.replace(/[a-zA-Z]/g, (c) => {
    const code = c.charCodeAt(0);
    const base = code >= 65 && code <= 90 ? 65 : 97;
    return String.fromCharCode(((code - base + 13) % 26) + base);
  });
}

export function rot47(str: string): string {
  return str.replace(/[!-~]/g, (c) => {
    const code = c.charCodeAt(0);
    return String.fromCharCode(33 + ((code - 33 + 47) % 94));
  });
}

export function caesarCipher(str: string, shift: number): string {
  const s = ((shift % 26) + 26) % 26;
  return str.replace(/[a-zA-Z]/g, (c) => {
    const code = c.charCodeAt(0);
    const base = code >= 65 && code <= 90 ? 65 : 97;
    return String.fromCharCode(((code - base + s) % 26) + base);
  });
}

const COMMON_ENGLISH_WORDS = new Set([
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "flag", "key", "secret", "token", "password", "admin", "test", "user"
]);

export interface BruteForceCandidate {
  key: string | number;
  score: number;
  sample: string;
}

export function caesarBruteForce(str: string): BruteForceCandidate[] {
  const results: BruteForceCandidate[] = [];
  for (let shift = 1; shift < 26; shift++) {
    const decoded = caesarCipher(str, shift);
    const words = decoded.toLowerCase().split(/[^a-z0-9]+/);
    let score = 0;
    for (const w of words) {
      if (COMMON_ENGLISH_WORDS.has(w)) score += w.length >= 4 ? 3 : 1;
    }
    results.push({
      key: `Shift +${shift} (ROT${shift})`,
      score,
      sample: decoded.slice(0, 100),
    });
  }
  return results.sort((a, b) => b.score - a.score);
}

export function atbash(str: string): string {
  return str.replace(/[a-zA-Z]/g, (c) => {
    const code = c.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCharCode(90 - (code - 65));
    return String.fromCharCode(122 - (code - 97));
  });
}

export function xorCipher(str: string, key: string): string {
  if (!key) return str;
  const isHexKey = /^0x[0-9a-fA-F]+$/i.test(key.trim());
  const keyBytes = isHexKey
    ? [parseInt(key.trim().slice(2), 16)]
    : Array.from(new TextEncoder().encode(key));

  if (keyBytes.length === 0 || keyBytes.some(isNaN)) return str;

  const inputBytes = new TextEncoder().encode(str);
  const outBytes = new Uint8Array(inputBytes.length);
  for (let i = 0; i < inputBytes.length; i++) {
    outBytes[i] = inputBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return new TextDecoder().decode(outBytes);
}

export function xorBruteForce(str: string): BruteForceCandidate[] {
  const bytes = new TextEncoder().encode(str);
  const results: BruteForceCandidate[] = [];

  for (let key = 1; key < 256; key++) {
    const out = new Uint8Array(bytes.length);
    let printable = 0;
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i] ^ key;
      out[i] = b;
      if (b >= 32 && b <= 126) printable++;
    }

    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(out);
    const words = decoded.toLowerCase().split(/[^a-z0-9]+/);
    let score = Math.round((printable / bytes.length) * 50);
    for (const w of words) {
      if (COMMON_ENGLISH_WORDS.has(w)) score += 10;
    }

    results.push({
      key: `0x${key.toString(16).padStart(2, "0").toUpperCase()}`,
      score,
      sample: decoded.slice(0, 100),
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 10);
}

export function vigenereCipher(str: string, key: string, decode = false): string {
  if (!key) return str;
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, "");
  if (!cleanKey) return str;

  let keyIdx = 0;
  return str.replace(/[a-zA-Z]/g, (c) => {
    const isUpper = c >= "A" && c <= "Z";
    const base = isUpper ? 65 : 97;
    const charCode = c.charCodeAt(0) - base;
    const shift = cleanKey.charCodeAt(keyIdx % cleanKey.length) - 65;
    keyIdx++;

    const newCode = decode
      ? ((charCode - shift + 26) % 26) + base
      : ((charCode + shift) % 26) + base;

    return String.fromCharCode(newCode);
  });
}

// ---------------------------------------------------------------------------
// 6. Encodings: Hex, Binary, Morse, HTML Entities, Unicode
// ---------------------------------------------------------------------------

export function hexEncode(str: string, delimiter: "none" | "space" | "0x" | "comma" = "space"): string {
  const bytes = new TextEncoder().encode(str);
  const hexArr: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    const h = bytes[i].toString(16).padStart(2, "0");
    hexArr.push(delimiter === "0x" ? `0x${h}` : h);
  }
  if (delimiter === "space" || delimiter === "0x") return hexArr.join(" ");
  if (delimiter === "comma") return hexArr.join(", ");
  return hexArr.join("");
}

export function hexDecode(str: string): string {
  const clean = str.replace(/0x|\\x|\s+|,|;|:/g, "");
  if (!clean) return "";
  if (clean.length % 2 !== 0) throw new Error("Hex string must have an even number of digits.");
  if (!/^[0-9a-fA-F]+$/.test(clean)) throw new Error("Invalid hexadecimal characters.");

  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

export function binaryEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const bits: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    bits.push(bytes[i].toString(2).padStart(8, "0"));
  }
  return bits.join(" ");
}

export function binaryDecode(str: string): string {
  const clean = str.replace(/[^01]/g, "");
  if (!clean) return "";
  if (clean.length % 8 !== 0) throw new Error("Binary bit length must be a multiple of 8.");

  const bytes = new Uint8Array(clean.length / 8);
  for (let i = 0; i < clean.length; i += 8) {
    bytes[i / 8] = parseInt(clean.slice(i, i + 8), 2);
  }
  return new TextDecoder().decode(bytes);
}

const MORSE_MAP: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
  I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
  Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..", 0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-",
  5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.", ".": ".-.-.-",
  ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--", "/": "-..-.",
  "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...", ";": "-.-.-.",
  "=": "-...-", "+": ".-.-.", "-": "-....-", _: "..--.-", '"': ".-..-.",
  $: "...-..-", "@": ".--.-.", " ": "/",
};

const REVERSE_MORSE_MAP: Record<string, string> = {};
for (const [char, code] of Object.entries(MORSE_MAP)) {
  REVERSE_MORSE_MAP[code] = char;
}

export function morseEncode(str: string): string {
  return str
    .toUpperCase()
    .split("")
    .map((c) => MORSE_MAP[c] || c)
    .join(" ");
}

export function morseDecode(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map((c) => REVERSE_MORSE_MAP[c] || (c === "/" ? " " : "?"))
    .join("")
    .replace(/\s+/g, " ");
}

export function htmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function htmlUnescape(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export function unicodeEscape(str: string): string {
  let out = "";
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    out += code > 127 ? `\\u${code.toString(16).padStart(4, "0")}` : str[i];
  }
  return out;
}

export function unicodeUnescape(str: string): string {
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// ---------------------------------------------------------------------------
// 7. JWT Inspector
// ---------------------------------------------------------------------------

export function decodeJwtFormatted(token: string): string {
  const parts = token.trim().split(".");
  if (parts.length < 2) throw new Error("Invalid JWT: expected at least header and payload separated by '.'");

  const header = JSON.parse(fromBase64(parts[0]));
  const payload = JSON.parse(fromBase64(parts[1]));

  const analysis: Record<string, any> = {
    _status: "Parsed successfully",
    header,
    payload,
  };

  if (payload.exp && typeof payload.exp === "number") {
    const expDate = new Date(payload.exp * 1000);
    analysis._expiration = {
      timestamp: payload.exp,
      iso: expDate.toISOString(),
      expired: Date.now() > expDate.getTime(),
    };
  }

  return JSON.stringify(analysis, null, 2);
}

// ---------------------------------------------------------------------------
// 8. Magic Format Detector
// ---------------------------------------------------------------------------

export interface MagicDetection {
  type: string;
  label: string;
  confidence: "high" | "medium" | "low";
  description: string;
  suggestedOp: OperationId;
  suggestedParams?: Record<string, any>;
}

export function detectMagic(input: string): MagicDetection[] {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const findings: MagicDetection[] = [];

  // 1. JWT Detection
  if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(trimmed)) {
    try {
      const headerStr = fromBase64(trimmed.split(".")[0]);
      if (headerStr.includes('"alg"')) {
        findings.push({
          type: "jwt",
          label: "JSON Web Token (JWT)",
          confidence: "high",
          description: "Detected standard signed/unsigned JWT with JSON header.",
          suggestedOp: "jwt_decode",
        });
      }
    } catch {
      // not JWT
    }
  }

  // 2. Base64 Detection
  if (
    trimmed.length >= 8 &&
    /^[A-Za-z0-9+/]+={0,2}$|^[A-Za-z0-9_-]+$/.test(trimmed) &&
    !trimmed.includes(" ")
  ) {
    try {
      const decoded = fromBase64(trimmed);
      if (decoded && decoded.length > 0 && /^[\x20-\x7E\r\n\t]*$/.test(decoded)) {
        findings.push({
          type: "base64",
          label: "Base64 String",
          confidence: "high",
          description: `Decodes cleanly into printable text: "${decoded.slice(0, 40)}..."`,
          suggestedOp: "base64_decode",
        });
      }
    } catch {
      // not base64
    }
  }

  // 3. Hex String Detection
  const cleanHex = trimmed.replace(/0x|\\x|\s+|,/g, "");
  if (cleanHex.length >= 4 && cleanHex.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(cleanHex)) {
    try {
      const decoded = hexDecode(cleanHex);
      const isPrintable = decoded.length > 0 && /^[\x20-\x7E\r\n\t]*$/.test(decoded);
      findings.push({
        type: "hex",
        label: "Hexadecimal String",
        confidence: isPrintable ? "high" : "medium",
        description: isPrintable
          ? `Decodes into ASCII text: "${decoded.slice(0, 40)}..."`
          : `Raw byte stream (${cleanHex.length / 2} bytes)`,
        suggestedOp: "hex_decode",
      });
    } catch {
      // ignore
    }
  }

  // 4. URL Encoded
  if (/%[0-9a-fA-F]{2}/.test(trimmed)) {
    try {
      const decoded = decodeURIComponent(trimmed.replace(/\+/g, "%20"));
      if (decoded !== trimmed) {
        findings.push({
          type: "url",
          label: "URL Encoded (Percent-encoding)",
          confidence: "high",
          description: `Contains percent-encoded tokens: "${decoded.slice(0, 40)}..."`,
          suggestedOp: "url_decode",
        });
      }
    } catch {
      // ignore
    }
  }

  // 5. HTML Entities
  if (/&(?:amp|lt|gt|quot|#39|#[0-9]+|#x[0-9a-fA-F]+);/.test(trimmed)) {
    findings.push({
      type: "html",
      label: "HTML Entities",
      confidence: "high",
      description: "Contains escaped HTML tags or character references.",
      suggestedOp: "html_decode",
    });
  }

  // 6. Binary bits stream
  const cleanBits = trimmed.replace(/\s+/g, "");
  if (cleanBits.length >= 8 && cleanBits.length % 8 === 0 && /^[01]+$/.test(cleanBits)) {
    try {
      const decoded = binaryDecode(cleanBits);
      findings.push({
        type: "binary",
        label: "Binary Bit Stream (8-bit bytes)",
        confidence: "high",
        description: `Decodes into: "${decoded.slice(0, 40)}..."`,
        suggestedOp: "binary_decode",
      });
    } catch {
      // ignore
    }
  }

  // 7. Morse Code
  if (/^[.\-/\s]+$/.test(trimmed) && trimmed.includes("-") && trimmed.includes(".")) {
    const decoded = morseDecode(trimmed);
    if (decoded && decoded.trim().length > 1) {
      findings.push({
        type: "morse",
        label: "Morse Code",
        confidence: "high",
        description: `Decodes to: "${decoded.slice(0, 40)}..."`,
        suggestedOp: "morse_decode",
      });
    }
  }

  // 8. JSON Object or Array
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      JSON.parse(trimmed);
      findings.push({
        type: "json",
        label: "Valid JSON",
        confidence: "high",
        description: "Parseable JSON data structure.",
        suggestedOp: "json_beautify",
      });
    } catch {
      // not valid JSON
    }
  }

  // 9. Hashes (MD5, SHA1, SHA256)
  if (/^[0-9a-fA-F]{32}$/.test(trimmed)) {
    findings.push({
      type: "hash_md5",
      label: "MD5 Hash Checksum (32 hex characters)",
      confidence: "medium",
      description: "Cryptographic 128-bit digest representation.",
      suggestedOp: "hash_md5",
    });
  } else if (/^[0-9a-fA-F]{40}$/.test(trimmed)) {
    findings.push({
      type: "hash_sha1",
      label: "SHA-1 Hash Checksum (40 hex characters)",
      confidence: "medium",
      description: "Cryptographic 160-bit digest representation.",
      suggestedOp: "hash_sha256",
    });
  } else if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    findings.push({
      type: "hash_sha256",
      label: "SHA-256 Hash Checksum (64 hex characters)",
      confidence: "medium",
      description: "Cryptographic 256-bit digest representation.",
      suggestedOp: "hash_sha256",
    });
  }

  // 10. Unix Timestamp
  if (/^\d{10}$/.test(trimmed)) {
    const sec = parseInt(trimmed, 10);
    const date = new Date(sec * 1000);
    if (date.getFullYear() >= 1971 && date.getFullYear() <= 2099) {
      findings.push({
        type: "timestamp",
        label: "Unix Epoch Timestamp (Seconds)",
        confidence: "high",
        description: `Corresponds to: ${date.toUTCString()}`,
        suggestedOp: "json_beautify",
      });
    }
  } else if (/^\d{13}$/.test(trimmed)) {
    const ms = parseInt(trimmed, 10);
    const date = new Date(ms);
    if (date.getFullYear() >= 1971 && date.getFullYear() <= 2099) {
      findings.push({
        type: "timestamp_ms",
        label: "Unix Epoch Timestamp (Milliseconds)",
        confidence: "high",
        description: `Corresponds to: ${date.toUTCString()}`,
        suggestedOp: "json_beautify",
      });
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// 9. Operations Registry & Recipe Execution Engine
// ---------------------------------------------------------------------------

export type OperationCategory = "Encoding" | "Ciphers" | "Hashing" | "Formatting" | "Utilities";

export type OperationId =
  | "base64_decode"
  | "base64_encode"
  | "hex_decode"
  | "hex_encode"
  | "url_decode"
  | "url_encode"
  | "html_decode"
  | "html_encode"
  | "binary_decode"
  | "binary_encode"
  | "morse_decode"
  | "morse_encode"
  | "unicode_unescape"
  | "unicode_escape"
  | "jwt_decode"
  | "rot13"
  | "rot47"
  | "caesar"
  | "atbash"
  | "xor"
  | "vigenere_decode"
  | "vigenere_encode"
  | "hash_md5"
  | "hash_sha256"
  | "hash_crc32"
  | "json_beautify"
  | "json_minify"
  | "extract_urls"
  | "extract_emails"
  | "extract_ips"
  | "reverse_string"
  | "reverse_lines"
  | "sort_lines"
  | "trim_lines"
  | "uppercase"
  | "lowercase";

export interface OperationParam {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "boolean";
  default: any;
  options?: { label: string; value: string }[];
}

export interface OperationDef {
  id: OperationId;
  name: string;
  category: OperationCategory;
  description: string;
  params: OperationParam[];
  run: (input: string, params: Record<string, any>) => string;
}

export const OPERATIONS: OperationDef[] = [
  // --- ENCODINGS ---
  {
    id: "base64_decode",
    name: "Base64 Decode",
    category: "Encoding",
    description: "Decode standard or URL-safe Base64 string to UTF-8 text.",
    params: [],
    run: (input) => fromBase64(input),
  },
  {
    id: "base64_encode",
    name: "Base64 Encode",
    category: "Encoding",
    description: "Encode UTF-8 text to Base64.",
    params: [
      { id: "urlSafe", label: "URL-safe format (- and _)", type: "boolean", default: false },
    ],
    run: (input, p) => toBase64(input, !!p.urlSafe),
  },
  {
    id: "hex_decode",
    name: "Hex Decode",
    category: "Encoding",
    description: "Convert hex bytes (e.g. 48 65 6c 6c 6f) to UTF-8 text.",
    params: [],
    run: (input) => hexDecode(input),
  },
  {
    id: "hex_encode",
    name: "Hex Encode",
    category: "Encoding",
    description: "Convert text into hexadecimal byte values.",
    params: [
      {
        id: "delimiter",
        label: "Delimiter",
        type: "select",
        default: "space",
        options: [
          { label: "Space (48 65)", value: "space" },
          { label: "None (4865)", value: "none" },
          { label: "0x Prefix (0x48 0x65)", value: "0x" },
          { label: "Comma (48, 65)", value: "comma" },
        ],
      },
    ],
    run: (input, p) => hexEncode(input, p.delimiter || "space"),
  },
  {
    id: "url_decode",
    name: "URL Decode",
    category: "Encoding",
    description: "Decode percent-encoded URL query string or path.",
    params: [],
    run: (input) => decodeURIComponent(input.replace(/\+/g, "%20")),
  },
  {
    id: "url_encode",
    name: "URL Encode",
    category: "Encoding",
    description: "Encode characters into percent-encoding for URLs.",
    params: [],
    run: (input) => encodeURIComponent(input),
  },
  {
    id: "html_decode",
    name: "HTML Unescape",
    category: "Encoding",
    description: "Convert HTML entities (&amp;, &lt;, &#65;) back to characters.",
    params: [],
    run: (input) => htmlUnescape(input),
  },
  {
    id: "html_encode",
    name: "HTML Escape",
    category: "Encoding",
    description: "Escape reserved HTML characters (<, >, &, \", ').",
    params: [],
    run: (input) => htmlEscape(input),
  },
  {
    id: "binary_decode",
    name: "Binary to Text",
    category: "Encoding",
    description: "Convert stream of 8-bit binary numbers into text.",
    params: [],
    run: (input) => binaryDecode(input),
  },
  {
    id: "binary_encode",
    name: "Text to Binary",
    category: "Encoding",
    description: "Convert text characters into 8-bit binary representation.",
    params: [],
    run: (input) => binaryEncode(input),
  },
  {
    id: "morse_decode",
    name: "Morse Code Decode",
    category: "Encoding",
    description: "Translate Morse code dots and dashes back into text.",
    params: [],
    run: (input) => morseDecode(input),
  },
  {
    id: "morse_encode",
    name: "Morse Code Encode",
    category: "Encoding",
    description: "Translate text into international Morse code.",
    params: [],
    run: (input) => morseEncode(input),
  },
  {
    id: "unicode_unescape",
    name: "Unicode Unescape",
    category: "Encoding",
    description: "Convert \\uXXXX escape sequences into UTF-8 characters.",
    params: [],
    run: (input) => unicodeUnescape(input),
  },
  {
    id: "unicode_escape",
    name: "Unicode Escape",
    category: "Encoding",
    description: "Convert non-ASCII characters to \\uXXXX escape sequences.",
    params: [],
    run: (input) => unicodeEscape(input),
  },
  {
    id: "jwt_decode",
    name: "JWT Token Inspector",
    category: "Encoding",
    description: "Inspect JSON Web Token header, claims payload and expiration.",
    params: [],
    run: (input) => decodeJwtFormatted(input),
  },

  // --- CIPHERS ---
  {
    id: "rot13",
    name: "ROT13 Cipher",
    category: "Ciphers",
    description: "Shift alphabetical characters by 13 positions.",
    params: [],
    run: (input) => rot13(input),
  },
  {
    id: "rot47",
    name: "ROT47 Cipher",
    category: "Ciphers",
    description: "Shift printable ASCII characters (33-126) by 47 positions.",
    params: [],
    run: (input) => rot47(input),
  },
  {
    id: "caesar",
    name: "Caesar Cipher",
    category: "Ciphers",
    description: "Shift alphabetical letters by N positions.",
    params: [
      { id: "shift", label: "Shift amount (1-25)", type: "number", default: 3 },
    ],
    run: (input, p) => caesarCipher(input, Number(p.shift) || 3),
  },
  {
    id: "atbash",
    name: "Atbash Cipher",
    category: "Ciphers",
    description: "Reverse alphabet substitution cipher (A <-> Z, B <-> Y).",
    params: [],
    run: (input) => atbash(input),
  },
  {
    id: "xor",
    name: "XOR Cipher",
    category: "Ciphers",
    description: "XOR bitwise encryption/decryption with key (string or 0x hex).",
    params: [
      { id: "key", label: "Key (e.g. 'secret' or '0xAA')", type: "text", default: "0x5A" },
    ],
    run: (input, p) => xorCipher(input, String(p.key || "0x5A")),
  },
  {
    id: "vigenere_decode",
    name: "Vigenère Decrypt",
    category: "Ciphers",
    description: "Decrypt polyalphabetic Vigenère cipher using passphrase.",
    params: [
      { id: "key", label: "Passphrase Key", type: "text", default: "KEY" },
    ],
    run: (input, p) => vigenereCipher(input, String(p.key || "KEY"), true),
  },
  {
    id: "vigenere_encode",
    name: "Vigenère Encrypt",
    category: "Ciphers",
    description: "Encrypt text with polyalphabetic Vigenère cipher using key.",
    params: [
      { id: "key", label: "Passphrase Key", type: "text", default: "KEY" },
    ],
    run: (input, p) => vigenereCipher(input, String(p.key || "KEY"), false),
  },

  // --- HASHING ---
  {
    id: "hash_md5",
    name: "MD5 Hash",
    category: "Hashing",
    description: "Generate 128-bit MD5 digest checksum (32 hex characters).",
    params: [],
    run: (input) => md5(input),
  },
  {
    id: "hash_sha256",
    name: "SHA-256 Hash",
    category: "Hashing",
    description: "Generate 256-bit secure SHA-256 cryptographic digest.",
    params: [],
    run: (input) => sha256(input),
  },
  {
    id: "hash_crc32",
    name: "CRC-32 Checksum",
    category: "Hashing",
    description: "Compute 32-bit cyclic redundancy check checksum.",
    params: [],
    run: (input) => crc32(input),
  },

  // --- FORMATTING ---
  {
    id: "json_beautify",
    name: "JSON Beautify",
    category: "Formatting",
    description: "Format JSON with indentation and readable line breaks.",
    params: [
      {
        id: "indent",
        label: "Indentation",
        type: "select",
        default: "2",
        options: [
          { label: "2 spaces", value: "2" },
          { label: "4 spaces", value: "4" },
          { label: "Tab", value: "\t" },
        ],
      },
    ],
    run: (input, p) => {
      const parsed = JSON.parse(input);
      const indent = p.indent === "\t" ? "\t" : Number(p.indent) || 2;
      return JSON.stringify(parsed, null, indent);
    },
  },
  {
    id: "json_minify",
    name: "JSON Minify",
    category: "Formatting",
    description: "Compact JSON by stripping all whitespace and newlines.",
    params: [],
    run: (input) => JSON.stringify(JSON.parse(input)),
  },
  {
    id: "extract_urls",
    name: "Extract URLs",
    category: "Formatting",
    description: "Find and list all http/https URLs found in text.",
    params: [],
    run: (input) => {
      const matches = input.match(/https?:\/\/[^\s"'<>]+/gi) || [];
      const unique = Array.from(new Set(matches));
      return unique.length > 0 ? unique.join("\n") : "No URLs found.";
    },
  },
  {
    id: "extract_emails",
    name: "Extract Email Addresses",
    category: "Formatting",
    description: "Extract and deduplicate all email addresses.",
    params: [],
    run: (input) => {
      const matches = input.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi) || [];
      const unique = Array.from(new Set(matches));
      return unique.length > 0 ? unique.join("\n") : "No email addresses found.";
    },
  },
  {
    id: "extract_ips",
    name: "Extract IPv4 Addresses",
    category: "Formatting",
    description: "Extract all valid IPv4 network addresses.",
    params: [],
    run: (input) => {
      const matches =
        input.match(/\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g) || [];
      const unique = Array.from(new Set(matches));
      return unique.length > 0 ? unique.join("\n") : "No IP addresses found.";
    },
  },

  // --- UTILITIES ---
  {
    id: "reverse_string",
    name: "Reverse String",
    category: "Utilities",
    description: "Reverse the character order of the entire text.",
    params: [],
    run: (input) => input.split("").reverse().join(""),
  },
  {
    id: "reverse_lines",
    name: "Reverse Lines",
    category: "Utilities",
    description: "Reverse the order of lines in the document.",
    params: [],
    run: (input) => input.split("\n").reverse().join("\n"),
  },
  {
    id: "sort_lines",
    name: "Sort Lines",
    category: "Utilities",
    description: "Sort lines alphabetically, numerically, or unique.",
    params: [
      {
        id: "unique",
        label: "Remove duplicates",
        type: "boolean",
        default: true,
      },
      {
        id: "reverse",
        label: "Reverse order (Z to A)",
        type: "boolean",
        default: false,
      },
    ],
    run: (input, p) => {
      let lines = input.split("\n");
      if (p.unique) lines = Array.from(new Set(lines));
      lines.sort((a, b) => a.localeCompare(b));
      if (p.reverse) lines.reverse();
      return lines.join("\n");
    },
  },
  {
    id: "trim_lines",
    name: "Trim Lines & Whitespace",
    category: "Utilities",
    description: "Remove leading, trailing whitespace and blank lines.",
    params: [],
    run: (input) =>
      input
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .join("\n"),
  },
  {
    id: "uppercase",
    name: "To UPPERCASE",
    category: "Utilities",
    description: "Convert all text to uppercase characters.",
    params: [],
    run: (input) => input.toUpperCase(),
  },
  {
    id: "lowercase",
    name: "To lowercase",
    category: "Utilities",
    description: "Convert all text to lowercase characters.",
    params: [],
    run: (input) => input.toLowerCase(),
  },
];

const OP_MAP = new Map<OperationId, OperationDef>();
for (const op of OPERATIONS) {
  OP_MAP.set(op.id, op);
}

export function getOperation(id: OperationId): OperationDef | undefined {
  return OP_MAP.get(id);
}

// ---------------------------------------------------------------------------
// 10. Pipeline Recipe Execution
// ---------------------------------------------------------------------------

export interface RecipeStep {
  id: string;
  opId: OperationId;
  params: Record<string, any>;
  enabled: boolean;
}

export interface StepExecutionResult {
  stepIndex: number;
  opId: OperationId;
  opName: string;
  outputPreview: string;
  durationMs: number;
  error?: string;
}

export interface RecipeExecutionResult {
  output: string;
  totalDurationMs: number;
  stepResults: StepExecutionResult[];
  errorStepIndex?: number;
  errorMessage?: string;
}

export function executeRecipe(input: string, steps: RecipeStep[]): RecipeExecutionResult {
  const startTime = performance.now();
  let current = input;
  const stepResults: StepExecutionResult[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step.enabled) continue;

    const op = getOperation(step.opId);
    if (!op) {
      return {
        output: current,
        totalDurationMs: Math.round((performance.now() - startTime) * 100) / 100,
        stepResults,
        errorStepIndex: i,
        errorMessage: `Unknown operation ID: ${step.opId}`,
      };
    }

    const stepStart = performance.now();
    try {
      current = op.run(current, step.params);
      stepResults.push({
        stepIndex: i,
        opId: step.opId,
        opName: op.name,
        outputPreview: current.slice(0, 60),
        durationMs: Math.round((performance.now() - stepStart) * 100) / 100,
      });
    } catch (err: any) {
      stepResults.push({
        stepIndex: i,
        opId: step.opId,
        opName: op.name,
        outputPreview: "",
        durationMs: Math.round((performance.now() - stepStart) * 100) / 100,
        error: err.message || "Execution error",
      });
      return {
        output: current,
        totalDurationMs: Math.round((performance.now() - startTime) * 100) / 100,
        stepResults,
        errorStepIndex: i,
        errorMessage: `Step ${i + 1} (${op.name}) failed: ${err.message || "Unknown error"}`,
      };
    }
  }

  return {
    output: current,
    totalDurationMs: Math.round((performance.now() - startTime) * 100) / 100,
    stepResults,
  };
}

// ---------------------------------------------------------------------------
// 11. Presets & Sample Inputs
// ---------------------------------------------------------------------------

export interface RecipePreset {
  id: string;
  title: string;
  description: string;
  sampleInput: string;
  steps: { opId: OperationId; params?: Record<string, any> }[];
}

export const PRESET_RECIPES: RecipePreset[] = [
  {
    id: "jwt_inspector",
    title: "Inspect JWT & Format Payload",
    description: "Decode JWT token, inspect claims, expiration timestamp and pretty-print JSON payload.",
    sampleInput:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzkwMjEiLCJuYW1lIjoiQWxpY2UgRGV2Iiwicm9sZSI6InNlY3VyaXR5X2FkbWluIiwiZXhwIjoxODkzNDU2MDAwfQ.g6oBOD9X5s4F4q9m2L7V1A8k4b_eW3_m9e984",
    steps: [{ opId: "jwt_decode" }],
  },
  {
    id: "nested_base64_url",
    title: "Double Encoded URL / API Token",
    description: "Decode URL-encoded parameters followed by Base64 decode and JSON formatting.",
    sampleInput: "ZXlKamJHbGxibk4wWlhraU9pSnphR0Z6WlhJNklqbzVNekkxTmpBd01EQjlmUT09",
    steps: [
      { opId: "base64_decode" },
      { opId: "base64_decode" },
      { opId: "json_beautify" },
    ],
  },
  {
    id: "deobfuscate_hex_shellcode",
    title: "Hex Byte Stream to String",
    description: "Decode raw hex string (0x48 0x65 0x6c 0x6c 0x6f) and extract printable strings and links.",
    sampleInput:
      "48 65 6c 6c 6f 20 57 6f 72 6c 64 21 20 56 69 73 69 74 20 68 74 74 70 73 3a 2f 2f 63 61 73 74 6f 76 2e 63 6f 6d 20 66 6f 72 20 74 6f 6f 6c 73 2e",
    steps: [
      { opId: "hex_decode" },
      { opId: "extract_urls" },
    ],
  },
  {
    id: "caesar_rot13",
    title: "Classic ROT13 Decryption",
    description: "Decrypt Caesar ROT13 cipher and clean up whitespace.",
    sampleInput: "Pnfgbi vf gur fznfuvat arj fgnqvhz sbe qrirybcre gbbyf naq rapbqvat fbyhgvba.",
    steps: [{ opId: "rot13" }],
  },
  {
    id: "hash_pipeline",
    title: "SHA-256 Checksum Pipeline",
    description: "Trim whitespace, convert to lowercase, and calculate SHA-256 fingerprint.",
    sampleInput: "   Castov Secure Cyber Workbench   ",
    steps: [
      { opId: "trim_lines" },
      { opId: "lowercase" },
      { opId: "hash_sha256" },
    ],
  },
  {
    id: "morse_translation",
    title: "Morse Code SOS Decryption",
    description: "Translate dots and dashes back to English text.",
    sampleInput: "... --- ... / -.-. .- ... - --- ...- / -.. . ...- / - --- --- .-.. ...",
    steps: [{ opId: "morse_decode" }],
  },
];

export const SAMPLE_INPUTS = [
  {
    label: "Suspicious Base64 Token",
    value: "SGVsbG8sIEN5YmVyIFdvcmxkISBUaGlzIGlzIGEgcHJpdmF0ZSBoZXhhZGVjaW1hbCBtZXNzYWdlIGRlc2lnbmVkIGZvciBDYXN0b3Yu",
  },
  {
    label: "Encoded JWT Token",
    value:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE4MDAwMDAwMDB9.4epK_iH-rUvU02t_8r5z04n",
  },
  {
    label: "URL with Hex & Params",
    value:
      "https%3A%2F%2Fapi.castov.com%2Fv1%2Ftelemetry%3Ftoken%3D416c657820446576%26client%3Dcyber_chef%26action%3Ddecode",
  },
  {
    label: "ROT13 Encrypted Message",
    value: "Vs lbh pna ernq guvf, lbhe EBG13 qrpbqre vf jbexvat cresrpwyl!",
  },
  {
    label: "Binary Bitstream",
    value: "01000011 01100001 01110011 01110100 01101111 01110110",
  },
  {
    label: "HTML Entity Encoded Snippet",
    value: "&lt;div class=&quot;security-alert&quot;&gt;&amp;#67;&amp;#97;&amp;#115;&amp;#116;&amp;#111;&amp;#118;&lt;/div&gt;",
  },
];
