/**
 * JSON to Zod Schema Engine (Client-side, Zero-network)
 *
 * Capabilities:
 * - Detects RFC-3339/ISO-8601 Datetime with offset support (z.string().datetime({ offset: true }))
 * - Detects Email, UUID v4, and HTTP/HTTPS URLs
 * - Smart array object merging (marks absent keys in sibling objects as .optional())
 * - Configurable null handling: z.null(), z.unknown().nullable(), or .nullish()
 * - Configurable strict mode (.strict())
 * - Target Zod version: v3 (standard) or v4 (compatible)
 */

export interface JsonToZodOptions {
  rootName?: string;
  nullHandling?: "null" | "nullable" | "nullish";
  strictMode?: boolean;
  optionalHandling?: "optional" | "nullish";
  zodVersion?: "v3" | "v4";
}

const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

function toPascalCase(str: string): string {
  const cleaned = str.replace(/[^a-zA-Z0-9]/g, " ").trim();
  if (!cleaned) return "Root";
  return cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function inferStringType(str: string): string {
  if (ISO_DATETIME_REGEX.test(str)) {
    return "z.string().datetime({ offset: true })";
  }
  if (EMAIL_REGEX.test(str)) {
    return "z.string().email()";
  }
  if (UUID_REGEX.test(str)) {
    return "z.string().uuid()";
  }
  if (URL_REGEX.test(str)) {
    return "z.string().url()";
  }
  return "z.string()";
}

function mergeObjectArray(arr: any[], options: Required<JsonToZodOptions>, indent: string): string {
  const allKeys = new Set<string>();
  const keyPresenceCount = new Map<string, number>();

  for (const item of arr) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      for (const k of Object.keys(item)) {
        allKeys.add(k);
        keyPresenceCount.set(k, (keyPresenceCount.get(k) || 0) + 1);
      }
    }
  }

  if (allKeys.size === 0) {
    return "z.record(z.unknown())";
  }

  const fields: string[] = [];
  const nextIndent = indent + "  ";

  for (const key of Array.from(allKeys).sort()) {
    const presentInAll = (keyPresenceCount.get(key) || 0) === arr.length;
    // Find first non-null sample for type inference
    let sampleVal: any = undefined;
    for (const item of arr) {
      if (item && item[key] !== undefined && item[key] !== null) {
        sampleVal = item[key];
        break;
      }
    }
    // If all were null/undefined, take null from one
    if (sampleVal === undefined) {
      sampleVal = null;
    }

    let inferredType = inferZodType(sampleVal, options, nextIndent);
    if (!presentInAll) {
      inferredType += options.optionalHandling === "nullish" ? ".nullish()" : ".optional()";
    }

    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
    fields.push(`${nextIndent}${safeKey}: ${inferredType},`);
  }

  const strictModifier = options.strictMode ? ".strict()" : "";
  return `z.object({\n${fields.join("\n")}\n${indent}})${strictModifier}`;
}

function inferZodType(val: any, options: Required<JsonToZodOptions>, indent: string): string {
  if (val === null) {
    if (options.nullHandling === "null") return "z.null()";
    if (options.nullHandling === "nullish") return "z.unknown().nullish()";
    return "z.unknown().nullable()";
  }
  if (val === undefined) {
    return "z.undefined()";
  }
  if (typeof val === "string") {
    return inferStringType(val);
  }
  if (typeof val === "number") {
    return Number.isInteger(val) ? "z.number().int()" : "z.number()";
  }
  if (typeof val === "boolean") {
    return "z.boolean()";
  }
  if (Array.isArray(val)) {
    if (val.length === 0) {
      return "z.array(z.unknown())";
    }
    // Check if array of objects
    const hasObjects = val.some((item) => item !== null && typeof item === "object" && !Array.isArray(item));
    if (hasObjects) {
      const mergedObjectSchema = mergeObjectArray(val, options, indent);
      return `z.array(${mergedObjectSchema})`;
    }
    // Array of primitives
    const sampleVal = val[0];
    return `z.array(${inferZodType(sampleVal, options, indent)})`;
  }
  if (typeof val === "object") {
    const keys = Object.keys(val);
    if (keys.length === 0) {
      return "z.record(z.unknown())";
    }
    const nextIndent = indent + "  ";
    const fields = keys.map((k) => {
      const propVal = val[k];
      let inferred = inferZodType(propVal, options, nextIndent);
      if (propVal === null && options.nullHandling !== "null") {
        // Already handled in null check
      }
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
      return `${nextIndent}${safeKey}: ${inferred},`;
    });

    const strictModifier = options.strictMode ? ".strict()" : "";
    return `z.object({\n${fields.join("\n")}\n${indent}})${strictModifier}`;
  }

  return "z.unknown()";
}

export function convert(input: string, userOptions: JsonToZodOptions = {}): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Input JSON is empty.");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err: any) {
    throw new Error(`Invalid JSON syntax: ${err.message}`);
  }

  const options: Required<JsonToZodOptions> = {
    rootName: userOptions.rootName?.trim() || "RootSchema",
    nullHandling: userOptions.nullHandling || "nullable",
    strictMode: Boolean(userOptions.strictMode),
    optionalHandling: userOptions.optionalHandling || "optional",
    zodVersion: userOptions.zodVersion || "v3",
  };

  const schemaIdentifier = options.rootName.endsWith("Schema")
    ? options.rootName
    : `${options.rootName}Schema`;
  const typeIdentifier = toPascalCase(options.rootName.replace(/Schema$/i, ""));

  let body = "";
  if (Array.isArray(parsed)) {
    const inner = inferZodType(parsed, options, "  ");
    body = `export const ${schemaIdentifier} = ${inner};`;
  } else if (typeof parsed === "object" && parsed !== null) {
    const inner = inferZodType(parsed, options, "");
    body = `export const ${schemaIdentifier} = ${inner};`;
  } else {
    const inner = inferZodType(parsed, options, "");
    body = `export const ${schemaIdentifier} = ${inner};`;
  }

  const versionHeader = options.zodVersion === "v4"
    ? `// Target: Zod v4 (Compatible Syntax)\nimport { z } from "zod";`
    : `// Target: Zod v3 (Standard)\nimport { z } from "zod";`;

  return `${versionHeader}\n\n${body}\n\nexport type ${typeIdentifier} = z.infer<typeof ${schemaIdentifier}>;\n`;
}
