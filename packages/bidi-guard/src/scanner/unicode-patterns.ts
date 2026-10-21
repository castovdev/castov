import { UnicodeThreat } from "../types/bidi";

export interface PatternDefinition {
  name: string;
  codePoint: string;
  char: string;
  category: "trojan_source" | "invisible_char" | "homoglyph";
  severity: "critical" | "high" | "medium";
  description: string;
}

export const TROJAN_SOURCE_PATTERNS: PatternDefinition[] = [
  {
    name: "Right-to-Left Override (RLO)",
    codePoint: "U+202E",
    char: "\u202E",
    category: "trojan_source",
    severity: "critical",
    description: "Reverses visual text order. Used in Trojan Source attacks (CVE-2021-42574) to disguise malicious code as harmless comments.",
  },
  {
    name: "Left-to-Right Override (LRO)",
    codePoint: "U+202D",
    char: "\u202D",
    category: "trojan_source",
    severity: "critical",
    description: "Forces visual left-to-right rendering regardless of natural character direction.",
  },
  {
    name: "Right-to-Left Embedding (RLE)",
    codePoint: "U+202B",
    char: "\u202B",
    category: "trojan_source",
    severity: "high",
    description: "Embedded bidirectional formatting character alters logical code flow display.",
  },
  {
    name: "Left-to-Right Embedding (LRE)",
    codePoint: "U+202A",
    char: "\u202A",
    category: "trojan_source",
    severity: "high",
    description: "Embedded bidirectional formatting character alters logical code flow display.",
  },
  {
    name: "Pop Directional Formatting (PDF)",
    codePoint: "U+202C",
    char: "\u202C",
    category: "trojan_source",
    severity: "high",
    description: "Terminates bidirectional embedding/override context.",
  },
  {
    name: "Right-to-Left Isolate (RLI)",
    codePoint: "U+2067",
    char: "\u2067",
    category: "trojan_source",
    severity: "high",
    description: "Isolates bidirectional content in modern Unicode algorithms.",
  },
  {
    name: "Left-to-Right Isolate (LRI)",
    codePoint: "U+2066",
    char: "\u2066",
    category: "trojan_source",
    severity: "high",
    description: "Isolates bidirectional content in modern Unicode algorithms.",
  },
  {
    name: "Pop Directional Isolate (PDI)",
    codePoint: "U+2069",
    char: "\u2069",
    category: "trojan_source",
    severity: "high",
    description: "Terminates bidirectional isolate context.",
  },
];

export const INVISIBLE_CHAR_PATTERNS: PatternDefinition[] = [
  {
    name: "Zero-Width Space (ZWSP)",
    codePoint: "U+200B",
    char: "\u200B",
    category: "invisible_char",
    severity: "high",
    description: "Invisible character with zero width. Can cause mystery syntax errors, altered tokenization, or watermarking.",
  },
  {
    name: "Zero-Width Non-Joiner (ZWNJ)",
    codePoint: "U+200C",
    char: "\u200C",
    category: "invisible_char",
    severity: "medium",
    description: "Zero-width formatting character. Flagged when found inside variable identifiers or ASCII strings.",
  },
  {
    name: "Zero-Width Joiner (ZWJ)",
    codePoint: "U+200D",
    char: "\u200D",
    category: "invisible_char",
    severity: "medium",
    description: "Zero-width ligature joiner character.",
  },
  {
    name: "Byte Order Mark (BOM) in body",
    codePoint: "U+FEFF",
    char: "\uFEFF",
    category: "invisible_char",
    severity: "medium",
    description: "Zero-width no-break space embedded inside file text instead of at file start.",
  },
  {
    name: "Line Separator (U+2028)",
    codePoint: "U+2028",
    char: "\u2028",
    category: "invisible_char",
    severity: "high",
    description: "Unicode line break that causes JavaScript parser crashes inside strings.",
  },
  {
    name: "Paragraph Separator (U+2029)",
    codePoint: "U+2029",
    char: "\u2029",
    category: "invisible_char",
    severity: "high",
    description: "Unicode paragraph break that causes JavaScript parser crashes inside strings.",
  },
];

export class UnicodeScanner {
  public static scanText(text: string, filePath: string): UnicodeThreat[] {
    const threats: UnicodeThreat[] = [];
    const lines = text.split(/\r?\n/);

    const allPatterns = [...TROJAN_SOURCE_PATTERNS, ...INVISIBLE_CHAR_PATTERNS];

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];

      // 1. Scan for Trojan Source & Invisible characters
      for (const pat of allPatterns) {
        let col = line.indexOf(pat.char);
        while (col !== -1) {
          threats.push({
            id: `${filePath}:${lineIdx + 1}:${col + 1}-${pat.codePoint}`,
            category: pat.category,
            charName: pat.name,
            codePoint: pat.codePoint,
            severity: pat.severity,
            filePath,
            line: lineIdx + 1,
            col: col + 1,
            description: pat.description,
            snippet: line.trim().slice(0, 80),
            quickFix: "remove",
          });
          col = line.indexOf(pat.char, col + 1);
        }
      }

      // 2. Scan for Greek Question Mark homoglyph (looks like semicolon)
      const greekSemicolon = "\u037E";
      let colG = line.indexOf(greekSemicolon);
      while (colG !== -1) {
        threats.push({
          id: `${filePath}:${lineIdx + 1}:${colG + 1}-U+037E`,
          category: "homoglyph",
          charName: "Greek Question Mark (Confusable with Semicolon)",
          codePoint: "U+037E",
          severity: "critical",
          filePath,
          line: lineIdx + 1,
          col: colG + 1,
          description: "Looks visually identical to ASCII semicolon (;) but causes mysterious syntax errors.",
          snippet: line.trim().slice(0, 80),
          quickFix: "replace_ascii",
        });
        colG = line.indexOf(greekSemicolon, colG + 1);
      }

      // 3. Scan for RTL Arabic / Hebrew comments
      const isComment = /^\s*(?:\/\/|#|\/\*|\*)/.test(line);
      const hasRtl = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0590-\u05FF]/.test(line);

      if (isComment && hasRtl) {
        threats.push({
          id: `${filePath}:${lineIdx + 1}:rtl-comment`,
          category: "rtl_comment",
          charName: "Bidi Arabic/Hebrew Comment",
          codePoint: "RTL",
          severity: "info",
          filePath,
          line: lineIdx + 1,
          col: 1,
          description: "Comment contains Right-to-Left Arabic/Hebrew script mixed with code.",
          snippet: line.trim().slice(0, 80),
        });
      }
    }

    return threats;
  }
}
