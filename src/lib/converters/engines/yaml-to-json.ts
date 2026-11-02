/**
 * YAML to JSON Engine (Client-side, Zero-network)
 *
 * Capabilities:
 * - Full YAML 1.2 (Recommended) vs YAML 1.1 (Legacy "Norway Problem") mode toggle:
 *   - YAML 1.2: unquoted `yes`, `no`, `on`, `off`, `y`, `n` remain strings ("NO", "off"); `0o14` is octal (12) while `014` is decimal/string; `true`/`false` are booleans.
 *   - YAML 1.1: unquoted `yes`, `no`, `on`, `off`, `y`, `n` are coerced into booleans (`true`/`false`); C-style `014` is parsed as octal `12`.
 * - Resolves YAML Anchors (`&anchor`), Aliases (`*alias`), and Merge Keys (`<<: *alias`) into deeply merged JSON objects
 * - Multi-document YAML (`---` separators): outputs single object if 1 doc, or JSON array of documents (or configurable)
 * - Date & Timestamp handling: converts Date instances to ISO-8601 strings or preserves raw date strings (`2026-11-02`)
 * - Actionable syntax errors with exact Line & Column numbers (`YAML Syntax Error at line X, column Y: ...`)
 */

import * as jsYaml from "js-yaml";

const yaml: any = (jsYaml as any).default?.load ? (jsYaml as any).default : jsYaml;

export interface YamlToJsonOptions {
  yamlVersion?: "1.2" | "1.1";
  indentSize?: "2" | "4" | "minified";
  multiDocMode?: "auto" | "array" | "first";
  sortKeys?: boolean;
}

const YAML_11_TRUE = new Set(["y", "Y", "yes", "Yes", "YES", "on", "On", "ON"]);
const YAML_11_FALSE = new Set(["n", "N", "no", "No", "NO", "off", "Off", "OFF"]);

/**
 * Recursively resolves YAML `<<` merge keys that js-yaml 4+ leaves as literal `"<<"` properties
 * when using the YAML 1.2 Core schema, and applies YAML 1.1 scalar rules when `yamlVersion === "1.1"`.
 */
function transformYamlNode(node: any, isYaml11: boolean): any {
  if (node === null || node === undefined) {
    return null;
  }

  if (node instanceof Date) {
    return node.toISOString();
  }

  if (Array.isArray(node)) {
    return node.map((item) => transformYamlNode(item, isYaml11));
  }

  if (typeof node === "object") {
    const result: Record<string, any> = {};

    // 1. If `<<` merge key exists, merge its properties first (lower precedence than explicit keys)
    if (Object.prototype.hasOwnProperty.call(node, "<<")) {
      const mergeSource = node["<<"];
      if (Array.isArray(mergeSource)) {
        // Earlier items in `<<: [*a, *b]` take precedence over later items in YAML merge spec
        for (let i = mergeSource.length - 1; i >= 0; i--) {
          const resolved = transformYamlNode(mergeSource[i], isYaml11);
          if (resolved && typeof resolved === "object" && !Array.isArray(resolved)) {
            Object.assign(result, resolved);
          }
        }
      } else if (mergeSource && typeof mergeSource === "object") {
        const resolved = transformYamlNode(mergeSource, isYaml11);
        if (resolved && typeof resolved === "object" && !Array.isArray(resolved)) {
          Object.assign(result, resolved);
        }
      }
    }

    // 2. Copy explicit keys (overriding merged defaults)
    for (const [key, val] of Object.entries(node)) {
      if (key === "<<") continue;
      result[key] = transformYamlNode(val, isYaml11);
    }

    return result;
  }

  return node;
}

/**
 * Pre-processes unquoted YAML 1.2 scalars to enforce strict YAML 1.2 Core Schema behavior:
 * - Bare leading-zero integers like `0755` or `014` (without `0o`) are parsed as decimal `755` and `14`,
 *   preventing js-yaml's legacy C-style octal parser (`0755` -> `493`) from firing in YAML 1.2 mode.
 * - Explicit `0o755` and `0o14` remain standard YAML 1.2 octal (`493` and `12`).
 */
function applyYaml12ScalarTransforms(input: string): string {
  return input
    .split("\n")
    .map((line) => {
      if (/^\s*#/.test(line)) return line;
      return line.replace(
        /^(\s*(?:-[ \t]+|[^:#\n]+:[ \t]+))([^'"#\n][^\n#]*?)(\s*(?:#.*)?)$/,
        (full, prefix, rawVal, suffix) => {
          const val = rawVal.trim();
          // Bare leading zero integer (e.g. 0755, 014) -> decimal in YAML 1.2 Core Schema
          if (/^[-+]?0[0-9]+$/.test(val)) {
            return `${prefix}${parseInt(val, 10)}${suffix}`;
          }
          return full;
        }
      );
    })
    .join("\n");
}
function applyYaml11ScalarTransforms(input: string): string {
  return input
    .split("\n")
    .map((line) => {
      // Skip comment-only lines
      if (/^\s*#/.test(line)) return line;

      // Match key: value or - value where value is unquoted
      return line.replace(
        /^(\s*(?:-[ \t]+|[^:#\n]+:[ \t]+))([^'"#\n][^\n#]*?)(\s*(?:#.*)?)$/,
        (full, prefix, rawVal, suffix) => {
          const val = rawVal.trim();
          if (YAML_11_TRUE.has(val)) {
            return `${prefix}true${suffix}`;
          }
          if (YAML_11_FALSE.has(val)) {
            return `${prefix}false${suffix}`;
          }
          // Legacy YAML 1.1 octal: leading 0 followed by octal digits (e.g. 014 -> 12)
          if (/^0[0-7]+$/.test(val) && val.length > 1) {
            return `${prefix}${parseInt(val, 8)}${suffix}`;
          }
          return full;
        }
      );
    })
    .join("\n");
}

function sortObjectKeysRecursively(val: any): any {
  if (Array.isArray(val)) {
    return val.map(sortObjectKeysRecursively);
  }
  if (val !== null && typeof val === "object") {
    const sorted: Record<string, any> = {};
    for (const k of Object.keys(val).sort()) {
      sorted[k] = sortObjectKeysRecursively(val[k]);
    }
    return sorted;
  }
  return val;
}

export function convert(input: string, userOptions: YamlToJsonOptions = {}): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Input YAML is empty.");
  }

  const options: Required<YamlToJsonOptions> = {
    yamlVersion: userOptions.yamlVersion || "1.2",
    indentSize: userOptions.indentSize || "2",
    multiDocMode: userOptions.multiDocMode || "auto",
    sortKeys: Boolean(userOptions.sortKeys),
  };

  const isYaml11 = options.yamlVersion === "1.1";
  const sourceToParse = isYaml11
    ? applyYaml11ScalarTransforms(input)
    : applyYaml12ScalarTransforms(input);

  const docs: any[] = [];
  try {
    yaml.loadAll(sourceToParse, (doc: any) => {
      if (doc !== undefined) {
        docs.push(transformYamlNode(doc, isYaml11));
      }
    });
  } catch (err: any) {
    if (err && err.mark && typeof err.mark.line === "number") {
      const lineNum = err.mark.line + 1;
      const colNum = (err.mark.column ?? 0) + 1;
      const reason = err.reason || err.message || "Invalid YAML syntax";
      throw new Error(`YAML Syntax Error at line ${lineNum}, column ${colNum}: ${reason}`);
    }
    throw new Error(`YAML Syntax Error: ${err?.message || "Unable to parse YAML input."}`);
  }

  let outputData: any;
  if (docs.length === 0) {
    outputData = null;
  } else if (options.multiDocMode === "first") {
    outputData = docs[0];
  } else if (options.multiDocMode === "array") {
    outputData = docs;
  } else {
    // "auto": single document -> unwrapped value, multiple documents -> array
    outputData = docs.length === 1 ? docs[0] : docs;
  }

  if (options.sortKeys) {
    outputData = sortObjectKeysRecursively(outputData);
  }

  const space =
    options.indentSize === "minified" ? undefined : Number(options.indentSize) || 2;

  return JSON.stringify(outputData, null, space) + "\n";
}
