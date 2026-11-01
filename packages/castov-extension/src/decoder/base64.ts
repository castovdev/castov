/**
 * Castov Secret Shield - Local Base64 / Base64URL Decoder
 *
 * Decodes strings to UTF-8 text offline without external libraries or network calls.
 */

import { base64UrlDecodeUtf8 } from "./jwt";

export interface DecodedBase64Result {
  decodedText: string;
  isBinary: boolean;
  byteLength: number;
}

export function decodeBase64Locally(input: string): DecodedBase64Result | null {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim();
  // Minimum length check and valid base64 character set
  if (trimmed.length < 4 || !/^[A-Za-z0-9+/=_-]+$/.test(trimmed)) {
    return null;
  }

  // Pure digits are more likely numeric IDs or timestamps than base64
  if (/^\d+$/.test(trimmed)) {
    return null;
  }

  try {
    const text = base64UrlDecodeUtf8(trimmed);
    if (!text) return null;

    // Check if the decoded output has non-printable binary characters
    // Control chars other than tab (\t), newline (\n), carriage return (\r)
    let nonPrintableCount = 0;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 65533) {
        nonPrintableCount++;
      }
    }

    const isBinary = nonPrintableCount > text.length * 0.1;

    return {
      decodedText: isBinary ? `[Binary Data: ${text.length} bytes]` : text,
      isBinary,
      byteLength: text.length,
    };
  } catch {
    return null;
  }
}
