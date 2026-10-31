/**
 * Zero-Knowledge Team Encryption Utilities (Phase 2 Hardened)
 * Standard: WebCrypto API, PBKDF2-SHA256 (600,000 iterations), RSA-OAEP (2048-bit), AES-GCM (256-bit).
 * Key Security Invariant: Sensitive in-memory keys default to `extractable: false`.
 */

export const PBKDF2_RECOMMENDED_ITERATIONS = 600000;
export const AES_GCM_KEY_LENGTH = 256;
export const AES_GCM_IV_LENGTH = 12;
export const SALT_LENGTH = 16;

export interface WrappedPrivateKeyBundle {
  version: number;
  iterations: number;
  salt: string; // Base64
  iv: string; // Base64
  encryptedKey: string; // Base64 PKCS#8 ciphertext
  algorithm: "AES-GCM-256";
}

export interface EncryptedTeamKeyRecord {
  key_version: number;
  encrypted_team_key: string; // Base64 RSA-OAEP ciphertext
}

export interface EncryptedVaultPayload {
  key_version: number;
  encrypted_payload: string; // Base64 AES-GCM ciphertext
  iv: string; // Base64 IV
}

// ---------------------------------------------------------------------------
// 1. User Asymmetric Keypair (RSA-OAEP 2048-bit)
// ---------------------------------------------------------------------------

/**
 * Generates an RSA-OAEP 2048-bit keypair for a user.
 * Note: Keypair is generated with extractable=true initially so it can be immediately
 * wrapped (encrypted) with user's KEK before being discarded.
 */
export async function generateUserKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Export Public Key as SPKI Base64 string for public directory / team membership sharing.
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("spki", key);
  return arrayBufferToBase64(exported);
}

/**
 * Export Private Key as PKCS#8 Base64 string (used strictly during key wrapping).
 */
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("pkcs8", key);
  return arrayBufferToBase64(exported);
}

/**
 * Import Public Key from SPKI Base64 string.
 */
export async function importPublicKey(b64: string): Promise<CryptoKey> {
  const binary = base64ToArrayBuffer(b64);
  return await crypto.subtle.importKey(
    "spki",
    binary,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

/**
 * Import Private Key from PKCS#8 Base64 string.
 * Defaults to `extractable: false` for maximum defense in depth against memory exfiltration.
 */
export async function importPrivateKey(
  b64: string,
  extractable = false
): Promise<CryptoKey> {
  const binary = base64ToArrayBuffer(b64);
  return await crypto.subtle.importKey(
    "pkcs8",
    binary,
    { name: "RSA-OAEP", hash: "SHA-256" },
    extractable,
    ["decrypt"]
  );
}

// ---------------------------------------------------------------------------
// 2. Key Encryption Key (KEK) & Private Key Wrapping (Passphrase Protection)
// ---------------------------------------------------------------------------

/**
 * Derives an un-extractable Key Encryption Key (KEK) from user passphrase using PBKDF2-SHA256.
 */
export async function deriveKeyEncryptionKey(
  passphrase: string,
  salt: Uint8Array,
  iterations = PBKDF2_RECOMMENDED_ITERATIONS
): Promise<CryptoKey> {
  if (!passphrase || passphrase.length < 8) {
    throw new Error("Master passphrase must be at least 8 characters long.");
  }
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: AES_GCM_KEY_LENGTH },
    false, // KEK is non-extractable from memory
    ["encrypt", "decrypt"]
  );
}

/**
 * Wraps (encrypts) the user's RSA private key using a Master Passphrase.
 * Resulting bundle is zero-knowledge: safe to sync to database and storage.
 */
export async function wrapPrivateKey(
  privateKey: CryptoKey,
  passphrase: string,
  options?: { iterations?: number }
): Promise<WrappedPrivateKeyBundle> {
  const iterations = options?.iterations ?? PBKDF2_RECOMMENDED_ITERATIONS;
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_LENGTH));

  const kek = await deriveKeyEncryptionKey(passphrase, salt, iterations);

  let pkcs8Buffer: ArrayBuffer | undefined;
  try {
    // Export raw PKCS#8 bytes from the temporary key
    pkcs8Buffer = await crypto.subtle.exportKey("pkcs8", privateKey);

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      kek,
      pkcs8Buffer
    );

    return {
      version: 1,
      iterations,
      salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
      iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
      encryptedKey: arrayBufferToBase64(ciphertext),
      algorithm: "AES-GCM-256",
    };
  } finally {
    if (pkcs8Buffer) {
      new Uint8Array(pkcs8Buffer).fill(0); // Wipe raw private key bytes
    }
  }
}

/**
 * Unwraps (decrypts) the user's RSA private key from an encrypted bundle in memory.
 * Imported into WebCrypto with `extractable: false`.
 */
export async function unwrapPrivateKey(
  bundle: WrappedPrivateKeyBundle | string,
  passphrase: string
): Promise<CryptoKey> {
  let parsed: WrappedPrivateKeyBundle;
  if (typeof bundle === "string") {
    try {
      parsed = JSON.parse(bundle);
    } catch {
      // Legacy packed format: salt:iv:encryptedKey:iterations
      const parts = bundle.split(":");
      if (parts.length < 3) throw new Error("Invalid private key bundle format.");
      parsed = {
        version: 1,
        salt: parts[0],
        iv: parts[1],
        encryptedKey: parts[2],
        iterations: parts[3] ? parseInt(parts[3], 10) : PBKDF2_RECOMMENDED_ITERATIONS,
        algorithm: "AES-GCM-256",
      };
    }
  } else {
    parsed = bundle;
  }

  const salt = new Uint8Array(base64ToArrayBuffer(parsed.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(parsed.iv));
  const ciphertext = base64ToArrayBuffer(parsed.encryptedKey);

  const kek = await deriveKeyEncryptionKey(passphrase, salt, parsed.iterations || PBKDF2_RECOMMENDED_ITERATIONS);

  let decryptedPkcs8: ArrayBuffer | undefined;
  try {
    try {
      decryptedPkcs8 = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        kek,
        ciphertext
      );
    } catch (_e) {
      throw new Error("Failed to decrypt private key. Incorrect passphrase or corrupted bundle.");
    }

    // Import directly as non-extractable private key
    return await crypto.subtle.importKey(
      "pkcs8",
      decryptedPkcs8,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false, // Non-extractable in memory
      ["decrypt"]
    );
  } finally {
    if (decryptedPkcs8) {
      new Uint8Array(decryptedPkcs8).fill(0); // Wipe decrypted private key bytes
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Team Symmetric Keys (AES-GCM 256-bit) & Rotation
// ---------------------------------------------------------------------------

/**
 * Generates a random AES-GCM 256-bit team key.
 */
export async function generateTeamKey(extractable = true): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: AES_GCM_KEY_LENGTH },
    extractable,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts the Team Key with a user's Public Key (RSA-OAEP).
 * Attaches the current `key_version` to support seamless multi-version rotation.
 */
export async function encryptTeamKeyForUser(
  teamKey: CryptoKey,
  userPublicKey: CryptoKey,
  keyVersion = 1
): Promise<EncryptedTeamKeyRecord> {
  let rawTeamKey: ArrayBuffer | undefined;
  try {
    rawTeamKey = await crypto.subtle.exportKey("raw", teamKey);
    const encrypted = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      userPublicKey,
      rawTeamKey
    );

    return {
      key_version: keyVersion,
      encrypted_team_key: arrayBufferToBase64(encrypted),
    };
  } finally {
    if (rawTeamKey) {
      new Uint8Array(rawTeamKey).fill(0); // Wipe raw team key bytes
    }
  }
}

/**
 * Decrypts the Team Key using the user's unwrapped Private Key.
 * Imported into WebCrypto with `extractable: false` by default for secure workspace operation.
 */
export async function decryptTeamKey(
  encryptedTeamKeyB64: string,
  userPrivateKey: CryptoKey,
  extractable = false
): Promise<CryptoKey> {
  const encrypted = base64ToArrayBuffer(encryptedTeamKeyB64);
  let rawTeamKey: ArrayBuffer | undefined;
  try {
    try {
      rawTeamKey = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        userPrivateKey,
        encrypted
      );
    } catch (_e) {
      throw new Error("Failed to decrypt team key with provided private key.");
    }

    return await crypto.subtle.importKey(
      "raw",
      rawTeamKey,
      { name: "AES-GCM" },
      extractable,
      ["encrypt", "decrypt"]
    );
  } finally {
    if (rawTeamKey) {
      new Uint8Array(rawTeamKey).fill(0); // Wipe decrypted team key bytes
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Team Vaults Encryption & Decryption
// ---------------------------------------------------------------------------

/**
 * Encrypts an environment payload for a team vault with AES-GCM and random 12-byte IV.
 */
export async function encryptTeamVault(
  content: string,
  teamKey: CryptoKey,
  keyVersion = 1
): Promise<EncryptedVaultPayload> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    teamKey,
    enc.encode(content)
  );

  return {
    key_version: keyVersion,
    encrypted_payload: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
  };
}

/**
 * Decrypts a team vault's encrypted payload using the active team key.
 */
export async function decryptTeamVault(
  encryptedPayloadB64: string,
  ivB64: string,
  teamKey: CryptoKey
): Promise<string> {
  const ciphertext = base64ToArrayBuffer(encryptedPayloadB64);
  const iv = base64ToArrayBuffer(ivB64);

  let decryptedBuffer: ArrayBuffer;
  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      teamKey,
      ciphertext
    );
  } catch (_e) {
    throw new Error("Vault decryption failed: Authentication tag mismatch or incorrect key version.");
  }

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

// ---------------------------------------------------------------------------
// 5. Emergency Recovery Kit (Disaster Recovery without Backdoors)
// ---------------------------------------------------------------------------

/**
 * Generates an emergency recovery key (256-bit high-entropy secret).
 */
export function generateRecoveryKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Wraps private key with the Emergency Recovery Key.
 */
export async function wrapPrivateKeyWithRecoveryKey(
  privateKey: CryptoKey,
  recoveryKeyHex: string
): Promise<string> {
  const rawKeyBytes = new Uint8Array(
    recoveryKeyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  let pkcs8: ArrayBuffer | undefined;
  try {
    const recoveryCryptoKey = await crypto.subtle.importKey(
      "raw",
      rawKeyBytes,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_LENGTH));
    pkcs8 = await crypto.subtle.exportKey("pkcs8", privateKey);

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      recoveryCryptoKey,
      pkcs8
    );

    return `${arrayBufferToBase64(iv.buffer as ArrayBuffer)}:${arrayBufferToBase64(ciphertext)}`;
  } finally {
    rawKeyBytes.fill(0);
    if (pkcs8) {
      new Uint8Array(pkcs8).fill(0);
    }
  }
}

/**
 * Unwraps private key using the Emergency Recovery Key.
 */
export async function unwrapPrivateKeyWithRecoveryKey(
  encryptedBundleStr: string,
  recoveryKeyHex: string
): Promise<CryptoKey> {
  const [ivB64, cipherB64] = encryptedBundleStr.split(":");
  if (!ivB64 || !cipherB64) {
    throw new Error("Invalid recovery bundle format.");
  }

  const rawKeyBytes = new Uint8Array(
    recoveryKeyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  let decryptedPkcs8: ArrayBuffer | undefined;
  try {
    const recoveryCryptoKey = await crypto.subtle.importKey(
      "raw",
      rawKeyBytes,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const iv = new Uint8Array(base64ToArrayBuffer(ivB64));
    const ciphertext = base64ToArrayBuffer(cipherB64);

    decryptedPkcs8 = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      recoveryCryptoKey,
      ciphertext
    );

    return await crypto.subtle.importKey(
      "pkcs8",
      decryptedPkcs8,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false, // Non-extractable
      ["decrypt"]
    );
  } finally {
    rawKeyBytes.fill(0);
    if (decryptedPkcs8) {
      new Uint8Array(decryptedPkcs8).fill(0);
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Base64 & Buffer Helpers
// ---------------------------------------------------------------------------

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}
