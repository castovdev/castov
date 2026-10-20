/**
 * Castov Cryptographic & Encoding Utilities
 * Zero external dependencies: pure Node.js crypto module.
 */

import * as crypto from "crypto";

export type HashAlgorithm = "sha256" | "sha512" | "md5" | "sha1";

export function computeHash(text: string, algorithm: HashAlgorithm): string {
  return crypto.createHash(algorithm).update(text, "utf8").digest("hex");
}

export type SecretFormat =
  | "hex32"
  | "hex16"
  | "base64"
  | "alpha32"
  | "alpha64";

export function generateSecret(format: SecretFormat): string {
  switch (format) {
    case "hex32":
      return crypto.randomBytes(32).toString("hex"); // 64 chars
    case "hex16":
      return crypto.randomBytes(16).toString("hex"); // 32 chars
    case "base64":
      return crypto.randomBytes(32).toString("base64");
    case "alpha32": {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      const bytes = crypto.randomBytes(32);
      let res = "";
      for (let i = 0; i < 32; i++) {
        res += chars[bytes[i] % chars.length];
      }
      return res;
    }
    case "alpha64": {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      const bytes = crypto.randomBytes(64);
      let res = "";
      for (let i = 0; i < 64; i++) {
        res += chars[bytes[i] % chars.length];
      }
      return res;
    }
  }
}

export function generateUuidV7(): string {
  const now = Date.now();
  const bytes = crypto.randomBytes(16);
  // Timestamp 48 bits (big endian)
  bytes[0] = Math.floor(now / 0x10000000000) & 0xff;
  bytes[1] = Math.floor(now / 0x100000000) & 0xff;
  bytes[2] = Math.floor(now / 0x1000000) & 0xff;
  bytes[3] = Math.floor(now / 0x10000) & 0xff;
  bytes[4] = Math.floor(now / 0x100) & 0xff;
  bytes[5] = now & 0xff;
  // Version 7
  bytes[6] = 0x70 | (bytes[6] & 0x0f);
  // Variant RFC 4122 (10xx)
  bytes[8] = 0x80 | (bytes[8] & 0x3f);

  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
