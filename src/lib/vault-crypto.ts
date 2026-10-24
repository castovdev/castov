/**
 * Zero-Knowledge Client-Side WebCrypto Helpers for Castov Env Vault.
 * 100% Client-Side AES-256-GCM encryption with PBKDF2 key derivation.
 * Plaintext secrets and passphrases NEVER leave the user's browser.
 */

const PBKDF2_ITERATIONS = 100000;

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
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveAesKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
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
      iterations: PBKDF2_ITERATIONS,
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
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );

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

  const key = await deriveAesKey(passphrase, salt);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as any },
      key,
      ciphertext as any
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch {
    throw new Error("Decryption failed. Incorrect passphrase or corrupted vault data.");
  }
}
