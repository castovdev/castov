/**
 * Fault-tolerant JSON with Comments (JSONC) Parser.
 * Safely strips comments and trailing commas without crashing on malformed files.
 */

export interface JsoncParseResult<T = unknown> {
  data: T | null;
  error?: string;
}

export function parseJsonc<T = unknown>(text: string): JsoncParseResult<T> {
  if (!text || text.trim() === "") {
    return { data: null, error: "Empty content" };
  }

  try {
    // 1. Strip comments while preserving line count (or basic replacement)
    // Avoid stripping inside quoted strings:
    let insideString = false;
    let escape = false;
    let result = "";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];

      if (insideString) {
        result += char;
        if (escape) {
          escape = false;
        } else if (char === "\\") {
          escape = true;
        } else if (char === '"') {
          insideString = false;
        }
        continue;
      }

      if (char === '"') {
        insideString = true;
        result += char;
        continue;
      }

      // Check single-line comment //
      if (char === "/" && next === "/") {
        // Skip until newline
        while (i < text.length && text[i] !== "\n") {
          i++;
        }
        result += "\n";
        continue;
      }

      // Check multi-line comment /* */
      if (char === "/" && next === "*") {
        i += 2;
        while (i < text.length - 1 && !(text[i] === "*" && text[i + 1] === "/")) {
          if (text[i] === "\n") result += "\n";
          i++;
        }
        i++; // skip /
        continue;
      }

      result += char;
    }

    // 2. Remove trailing commas before } or ]
    const cleaned = result.replace(/,\s*([\]}])/g, "$1");

    const parsed = JSON.parse(cleaned) as T;
    return { data: parsed };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { data: null, error: msg };
  }
}
