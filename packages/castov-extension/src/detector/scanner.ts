/**
 * Castov Secret Shield - Fast Linear Scanner Engine
 *
 * Designed to scan 1MB pastes in < 100ms with zero catastrophic backtracking.
 */

import { SecretFinding, ScanOptions, ScanResult } from "./types";
import { DETECTOR_PATTERNS, scanEnvHighEntropyLines } from "./patterns";
import { maskSecret } from "./entropy";

const DEFAULT_MAX_PASTE_SIZE = 2 * 1024 * 1024; // 2 Megabytes

/**
 * Scans a pasted text string for all supported secret types.
 */
export function scanTextForSecrets(text: string, options: ScanOptions = {}): ScanResult {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  if (!text || typeof text !== "string") {
    return {
      findings: [],
      scanDurationMs: 0,
      totalBytesScanned: 0,
      hasFindings: false,
      truncated: false,
    };
  }

  const maxSize = options.maxPasteSize ?? DEFAULT_MAX_PASTE_SIZE;
  const truncated = text.length > maxSize;
  const textToScan = truncated ? text.slice(0, maxSize) : text;

  const rawFindings: SecretFinding[] = [];

  // 1. Run all fixed linear-time regex patterns
  for (const pat of DETECTOR_PATTERNS) {
    pat.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pat.regex.exec(textToScan)) !== null) {
      if (pat.validate && !pat.validate(match, textToScan)) {
        continue;
      }

      if (pat.extractRange) {
        const range = pat.extractRange(match);
        rawFindings.push({
          type: pat.type,
          label: pat.label,
          startIndex: range.start,
          endIndex: range.end,
          raw: range.raw,
          masked: maskSecret(range.raw),
        });
      } else {
        const raw = match[0];
        const start = match.index;
        rawFindings.push({
          type: pat.type,
          label: pat.label,
          startIndex: start,
          endIndex: start + raw.length,
          raw,
          masked: maskSecret(raw),
        });
      }
    }
  }

  // 2. Run .env-style high-entropy line scanner if enabled
  if (options.includeEnvScanner !== false) {
    const envFindings = scanEnvHighEntropyLines(textToScan, rawFindings);
    for (const f of envFindings) {
      rawFindings.push(f);
    }
  }

  // 3. Resolve overlaps & sort by start index
  // Prefer earlier and longer matches
  rawFindings.sort((a, b) => {
    if (a.startIndex !== b.startIndex) {
      return a.startIndex - b.startIndex;
    }
    return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
  });

  const nonOverlapping: SecretFinding[] = [];
  let lastCoveredEnd = -1;

  for (const item of rawFindings) {
    if (item.startIndex >= lastCoveredEnd) {
      nonOverlapping.push(item);
      lastCoveredEnd = item.endIndex;
    }
  }

  const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  const scanDurationMs = Math.round((endTime - startTime) * 100) / 100;

  return {
    findings: nonOverlapping,
    scanDurationMs,
    totalBytesScanned: textToScan.length,
    hasFindings: nonOverlapping.length > 0,
    truncated,
  };
}
