/**
 * Zero-Knowledge Client-Side WebCrypto Helpers for Castov Env Vault.
 * 100% Client-Side AES-256-GCM encryption with PBKDF2 key derivation.
 * Plaintext secrets and passphrases NEVER leave the user's browser.
 */

const PBKDF2_RECOMMENDED_ITERATIONS = 600000;
const PBKDF2_LEGACY_ITERATIONS = 100000;

export interface EncryptedVaultPayload {
  ciphertext: string; // Base64 (includes 16-byte GCM auth tag at end)
  iv: string;         // Base64 (12 bytes)
  salt: string;       // Base64 (16 bytes)
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  try {
    const binary = atob(base64.trim());
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    throw new Error("Invalid base64 payload or corrupted vault metadata.");
  }
}

async function deriveAesKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_RECOMMENDED_ITERATIONS
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts plaintext environment variables using AES-256-GCM.
 */
export async function encryptEnvVault(
  plaintext: string,
  passphrase: string
): Promise<EncryptedVaultPayload> {
  if (!plaintext || !passphrase) {
    throw new Error("Plaintext and passphrase are required for encryption");
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(passphrase, salt);

  const enc = new TextEncoder();
  const plaintextBytes = enc.encode(plaintext);
  let ciphertextBuffer: ArrayBuffer;
  try {
    ciphertextBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      plaintextBytes
    );
  } finally {
    plaintextBytes.fill(0);
  }

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
  };
}

/**
 * Decrypts encrypted environment variables payload using AES-256-GCM.
 */
export async function decryptEnvVault(
  payload: EncryptedVaultPayload,
  passphrase: string
): Promise<string> {
  if (!payload.ciphertext || !payload.iv || !payload.salt || !passphrase) {
    throw new Error("Invalid encrypted payload or missing passphrase");
  }

  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);

  if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 16) {
    throw new Error("Invalid vault payload: corrupted salt, IV, or ciphertext.");
  }

  const dec = new TextDecoder();

  // Try 600,000 PBKDF2 iterations first (modern hardened standard)
  try {
    const key = await deriveAesKey(passphrase, salt, PBKDF2_RECOMMENDED_ITERATIONS);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as any },
      key,
      ciphertext as any
    );
    const result = dec.decode(decryptedBuffer);
    new Uint8Array(decryptedBuffer).fill(0);
    return result;
  } catch {
    // Transparent backward compatibility for vaults derived with legacy 100,000 iterations
    try {
      const legacyKey = await deriveAesKey(passphrase, salt, PBKDF2_LEGACY_ITERATIONS);
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv as any },
        legacyKey,
        ciphertext as any
      );
      const result = dec.decode(decryptedBuffer);
      new Uint8Array(decryptedBuffer).fill(0);
      return result;
    } catch {
      throw new Error("Decryption failed. Incorrect passphrase or corrupted vault data.");
    }
  }
}
