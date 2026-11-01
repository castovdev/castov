/**
 * Castov Secret Shield - Unified Selection Decoder
 */

import { decodeJwtLocally, DecodedJwtResult } from "./jwt";
import { decodeTimestampLocally, DecodedTimestampResult } from "./timestamp";
import { decodeBase64Locally, DecodedBase64Result } from "./base64";

export * from "./jwt";
export * from "./timestamp";
export * from "./base64";

export type DecodeType = "jwt" | "timestamp" | "base64" | "text";

export interface UnifiedDecodeResult {
  type: DecodeType;
  title: string;
  summary: string;
  jwt?: DecodedJwtResult;
  timestamp?: DecodedTimestampResult;
  base64?: DecodedBase64Result;
  copyableContent: string;
}

export const MAX_DECODE_INPUT_LENGTH = 65536; // 64 KB max input cap

export function decodeSelectionLocally(selectionText: string): UnifiedDecodeResult {
  if (!selectionText || typeof selectionText !== "string") {
    return {
      type: "text",
      title: "Selected Text",
      summary: "Empty selection",
      copyableContent: "",
    };
  }

  // Security guard: Cap maximum input size to prevent main-thread freezing
  if (selectionText.length > MAX_DECODE_INPUT_LENGTH) {
    const sizeKb = Math.round(selectionText.length / 1024);
    return {
      type: "text",
      title: "Selection Exceeds Limit",
      summary: `Selected text (${sizeKb} KB) exceeds the 64 KB limit for local decoding.`,
      copyableContent: selectionText.slice(0, 512) + `\n... [TRUNCATED ${selectionText.length - 512} CHARACTERS]`,
    };
  }

  const trimmed = selectionText.trim();

  // 1. Test JWT (must have 3 parts and start with eyJ)
  if (trimmed.startsWith("eyJ") && trimmed.includes(".")) {
    const jwt = decodeJwtLocally(trimmed);
    if (jwt) {
      const expStatus = jwt.expiresInSummary ? ` • ${jwt.expiresInSummary}` : "";
      return {
        type: "jwt",
        title: "JWT Decoded",
        summary: `Algorithm: ${jwt.header.alg ?? "unknown"}${expStatus}`,
        jwt,
        copyableContent: jwt.rawPayloadJson,
      };
    }
  }

  // 2. Test Unix Epoch Timestamp
  const ts = decodeTimestampLocally(trimmed);
  if (ts) {
    return {
      type: "timestamp",
      title: "Unix Timestamp Decoded",
      summary: `${ts.utcString} (${ts.relative})`,
      timestamp: ts,
      copyableContent: ts.utcIso,
    };
  }

  // 3. Test Base64
  const b64 = decodeBase64Locally(trimmed);
  if (b64 && !b64.isBinary && b64.decodedText.length > 0) {
    return {
      type: "base64",
      title: "Base64 Decoded",
      summary: `UTF-8 Text (${b64.byteLength} bytes)`,
      base64: b64,
      copyableContent: b64.decodedText,
    };
  }

  // 4. Fallback text info
  return {
    type: "text",
    title: "Selected Text",
    summary: `${trimmed.length} characters`,
    copyableContent: trimmed,
  };
}
