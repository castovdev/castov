/**
 * Castov Secret Shield - Text Redaction Engine
 *
 * Produces surgical redactions in the exact format: [REDACTED:<TYPE>_<n>]
 * Uses reverse-order replacement to preserve exact character index alignment.
 */

import { SecretFinding, SecretType } from "./types";

export interface RedactionEntry {
  type: SecretType;
  index: number;
  placeholder: string;
  originalLength: number;
  masked: string;
}

export interface RedactionResult {
  redactedText: string;
  entries: RedactionEntry[];
  totalRedacted: number;
}

/**
 * Replaces all detected secrets in the input text with standardized placeholders.
 * E.g. [REDACTED:AWS_KEY_1], [REDACTED:GITHUB_TOKEN_1], [REDACTED:AWS_KEY_2]
 */
export function redactSecrets(text: string, findings: readonly SecretFinding[]): RedactionResult {
  if (!text || findings.length === 0) {
    return {
      redactedText: text,
      entries: [],
      totalRedacted: 0,
    };
  }

  // Count occurrences per type to generate 1-based sequential indices (e.g. AWS_KEY_1, AWS_KEY_2)
  const typeCounters: Record<string, number> = {};
  const indexedFindings = findings.map((f) => {
    typeCounters[f.type] = (typeCounters[f.type] || 0) + 1;
    const index = typeCounters[f.type];
    const placeholder = `[REDACTED:${f.type}_${index}]`;
    return {
      ...f,
      index,
      placeholder,
    };
  });

  // Sort in descending order of startIndex so replacing from back to front doesn't shift earlier character offsets
  const sortedDesc = [...indexedFindings].sort((a, b) => b.startIndex - a.startIndex);

  let result = text;
  for (const item of sortedDesc) {
    result = result.slice(0, item.startIndex) + item.placeholder + result.slice(item.endIndex);
  }

  const entries: RedactionEntry[] = indexedFindings.map((item) => ({
    type: item.type,
    index: item.index,
    placeholder: item.placeholder,
    originalLength: item.endIndex - item.startIndex,
    masked: item.masked,
  }));

  return {
    redactedText: result,
    entries,
    totalRedacted: indexedFindings.length,
  };
}
