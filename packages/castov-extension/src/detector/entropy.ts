/**
 * Castov Secret Shield - Entropy & Helper Utilities
 */

/**
 * Calculates Shannon Entropy in bits per character.
 * High entropy (> 3.2 for base64/hex/alphanumeric of length >= 20) indicates cryptographic randomness.
 */
export function calculateShannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const len = str.length;
  const frequencies = new Map<string, number>();

  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }

  let entropy = 0;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

/**
 * Calculates the distinct character ratio (unique characters / total length).
 * Low diversity (e.g. repeated "aaaaa" or "00000") is not a secret.
 */
export function calculateCharacterDiversity(str: string): number {
  if (!str || str.length === 0) return 0;
  const uniqueChars = new Set(str).size;
  return uniqueChars / str.length;
}

/**
 * Masks a secret string for safe display in dialogs.
 * - If length < 16: `… (${len} chars)`
 * - If length >= 16: `${first 4 chars}… (${len} chars)`
 */
export function maskSecret(val: string): string {
  if (!val) return "";
  const len = val.length;
  if (len < 16) {
    return `… (${len} chars)`;
  }
  return `${val.slice(0, 4)}… (${len} chars)`;
}

const DOCUMENTED_EXAMPLE_KEYS = new Set([
  "AKIAIOSFODNN7EXAMPLE",
  "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
]);

/**
 * Checks if a string is an obvious documentation example, dummy placeholder, or test mock.
 */
export function isExampleOrPlaceholder(text: string): boolean {
  if (!text) return true;
  const trimmed = text.trim();

  // Exact known documentation examples
  if (DOCUMENTED_EXAMPLE_KEYS.has(trimmed)) {
    return true;
  }

  const upper = trimmed.toUpperCase();

  // Contains obvious mock markers
  if (
    upper.includes("EXAMPLE") ||
    upper.includes("SAMPLE_") ||
    upper.includes("TEST_KEY") ||
    upper.includes("PLACEHOLDER") ||
    upper.includes("YOUR_API_KEY") ||
    upper.includes("YOUR_TOKEN") ||
    upper.includes("CHANGEME") ||
    upper.includes("REPLACE_ME") ||
    upper.includes("DUMMY_KEY")
  ) {
    return true;
  }

  // Bracket placeholders: <YOUR_KEY>, [API_KEY], ${VAR}
  if (/^<[^>]+>$/.test(trimmed) || /^\[[^\]]+\]$/.test(trimmed) || /^\$\{[^}]+\}$/.test(trimmed)) {
    return true;
  }

  // Low diversity check: e.g. "0000000000000000", "xxxxxxxxxxxxxxxx"
  if (trimmed.length >= 10 && calculateCharacterDiversity(trimmed) < 0.2) {
    return true;
  }

  return false;
}
