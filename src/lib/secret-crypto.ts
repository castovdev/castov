/**
 * Zero-Knowledge Client-Side Encryption for Expiring / Burn-After-Reading Secrets.
 * The encryption key stays in the URL hash (#key=...) and is NEVER sent to any server.
 */

function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToBuffer(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface EncryptedSecretPackage {
  ciphertext: string; // Base64URL
  iv: string;         // Base64URL (12 bytes)
  key: string;        // Base64URL (32 bytes raw key for URL hash)
}

/**
 * Encrypts secret text using a fresh 256-bit AES-GCM key generated in the browser.
 */
export async function encryptSecretForSharing(plaintext: string): Promise<EncryptedSecretPackage> {
  const rawKey = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const enc = new TextEncoder();
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    enc.encode(plaintext)
  );

  return {
    ciphertext: bufferToBase64Url(ciphertextBuffer),
    iv: bufferToBase64Url(iv),
    key: bufferToBase64Url(rawKey),
  };
}

/**
 * Decrypts secret text in the browser using the raw key passed in the URL hash.
 */
export async function decryptSharedSecret(
  ciphertextBase64Url: string,
  ivBase64Url: string,
  keyBase64Url: string
): Promise<string> {
  const rawKey = base64UrlToBuffer(keyBase64Url);
  const iv = base64UrlToBuffer(ivBase64Url);
  const ciphertext = base64UrlToBuffer(ciphertextBase64Url);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey as any,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as any },
      cryptoKey,
      ciphertext as any
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch {
    throw new Error("Decryption failed. The secret link is corrupt or the key in the URL hash is invalid.");
  }
}
