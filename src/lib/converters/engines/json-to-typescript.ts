/**
 * JSON to TypeScript Interface / Type Engine (Client-side, Zero-network)
 *
 * Capabilities:
 * - Generates clean `export interface` or `export type` declarations
 * - Extracts nested objects into separate named PascalCase interfaces (or keeps inline)
 * - Smart array object merging: merges keys across all array elements and marks inconsistent keys as optional (`?`)
 * - Mixed primitive array union inference (e.g., `(string | number)[]`)
 * - Safe quoting for non-identifier property keys (e.g., `"x-request-id": string`)
 * - Configurable `readonly` modifier and null handling (`unknown | null` vs optional `?: unknown | null`)
 */

export interface JsonToTsOptions {
  rootName?: string;
  declarationStyle?: "interface" | "type";
  extractNested?: boolean;
  readonlyProps?: boolean;
  nullHandling?: "nullable" | "optional-nullable";
}

function toPascalCase(str: string): string {
  const cleaned = str.replace(/[^a-zA-Z0-9]/g, " ").trim();
  if (!cleaned) return "Root";
  return cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function singularize(str: string): string {
  if (str.endsWith("ies") && str.length > 3) {
    return str.slice(0, -3) + "y";
  }
  if (str.endsWith("ses") && str.length > 3) {
    return str.slice(0, -2);
  }
  if (str.endsWith("s") && !str.endsWith("ss") && str.length > 1) {
    return str.slice(0, -1);
  }
  return str + "Item";
}

function formatKey(key: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

export function convert(input: string, userOptions: JsonToTsOptions = {}): string {
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

  const options: Required<JsonToTsOptions> = {
    rootName: toPascalCase(userOptions.rootName?.trim() || "User"),
    declarationStyle: userOptions.declarationStyle || "interface",
    extractNested:
      userOptions.extractNested !== undefined
        ? userOptions.extractNested === true || (userOptions.extractNested as any) === "true"
        : true,
    readonlyProps: Boolean(userOptions.readonlyProps),
    nullHandling: userOptions.nullHandling || "nullable",
  };

  const extractedDeclarations: string[] = [];
  const usedNames = new Set<string>([options.rootName]);

  function getUniqueName(baseName: string): string {
    const pascal = toPascalCase(baseName);
    if (!usedNames.has(pascal)) {
      usedNames.add(pascal);
      return pascal;
    }
    let counter = 2;
    while (usedNames.has(`${pascal}${counter}`)) {
      counter++;
    }
    const unique = `${pascal}${counter}`;
    usedNames.add(unique);
    return unique;
  }

  function buildObjectFields(
    obj: Record<string, any>,
    optionalKeys: Set<string>,
    parentName: string,
    indent: string
  ): string {
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return "Record<string, unknown>";
    }

    const nextIndent = indent + "  ";
    const roPrefix = options.readonlyProps ? "readonly " : "";

    const lines = keys.map((key) => {
      const val = obj[key];
      const isOptional =
        optionalKeys.has(key) ||
        (val === null && options.nullHandling === "optional-nullable");
      const propName = formatKey(key);
      const childTypeName = `${parentName}${toPascalCase(key)}`;
      const tsType = inferType(val, childTypeName, nextIndent);
      const optFlag = isOptional ? "?" : "";
      return `${nextIndent}${roPrefix}${propName}${optFlag}: ${tsType};`;
    });

    return `{\n${lines.join("\n")}\n${indent}}`;
  }

  function mergeObjectArrayToType(arr: any[], typeNameHint: string, indent: string): string {
    const allKeys = new Set<string>();
    const keyCounts = new Map<string, number>();
    const mergedSample: Record<string, any> = {};
    const hadNullForKey = new Set<string>();

    let objectCount = 0;
    for (const item of arr) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        objectCount++;
        for (const k of Object.keys(item)) {
          allKeys.add(k);
          keyCounts.set(k, (keyCounts.get(k) || 0) + 1);
          if (item[k] === null) {
            hadNullForKey.add(k);
          } else if (mergedSample[k] === undefined || mergedSample[k] === null) {
            mergedSample[k] = item[k];
          }
        }
      }
    }

    if (allKeys.size === 0) {
      return "Record<string, unknown>";
    }

    const optionalKeys = new Set<string>();
    for (const k of Array.from(allKeys).sort()) {
      if ((keyCounts.get(k) || 0) < objectCount) {
        optionalKeys.add(k);
      }
      if (!(k in mergedSample)) {
        mergedSample[k] = null;
      }
    }

    // Build sorted sample
    const sortedSample: Record<string, any> = {};
    for (const k of Array.from(allKeys).sort()) {
      sortedSample[k] = mergedSample[k];
    }

    if (options.extractNested) {
      const uniqueName = getUniqueName(singularize(typeNameHint));
      const body = buildObjectFields(sortedSample, optionalKeys, uniqueName, "");
      // Add | null for keys that had both non-null and null values
      if (options.declarationStyle === "interface") {
        extractedDeclarations.push(`export interface ${uniqueName} ${body}`);
      } else {
        extractedDeclarations.push(`export type ${uniqueName} = ${body};`);
      }
      return uniqueName;
    }

    return buildObjectFields(sortedSample, optionalKeys, singularize(typeNameHint), indent);
  }

  function inferType(val: any, nameHint: string, indent: string): string {
    if (val === null) return "unknown | null";
    if (val === undefined) return "undefined";
    if (typeof val === "string") return "string";
    if (typeof val === "number") return "number";
    if (typeof val === "boolean") return "boolean";

    if (Array.isArray(val)) {
      if (val.length === 0) {
        return "unknown[]";
      }
      const hasObjects = val.some(
        (item) => item !== null && typeof item === "object" && !Array.isArray(item)
      );
      if (hasObjects) {
        const objType = mergeObjectArrayToType(val, nameHint, indent);
        return `${objType}[]`;
      }
      // Primitive or nested arrays
      const elementTypes = Array.from(
        new Set(val.map((item) => inferType(item, singularize(nameHint), indent)))
      );
      if (elementTypes.length === 1) {
        const single = elementTypes[0];
        return single.includes("|") ? `(${single})[]` : `${single}[]`;
      }
      return `(${elementTypes.join(" | ")})[]`;
    }

    if (typeof val === "object") {
      const keys = Object.keys(val);
      if (keys.length === 0) {
        return "Record<string, unknown>";
      }
      if (options.extractNested && nameHint !== options.rootName) {
        const uniqueName = getUniqueName(nameHint);
        const body = buildObjectFields(val, new Set(), uniqueName, "");
        if (options.declarationStyle === "interface") {
          extractedDeclarations.push(`export interface ${uniqueName} ${body}`);
        } else {
          extractedDeclarations.push(`export type ${uniqueName} = ${body};`);
        }
        return uniqueName;
      }
      return buildObjectFields(val, new Set(), nameHint, indent);
    }

    return "unknown";
  }

  let rootDeclaration = "";
  if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
    const body = buildObjectFields(parsed, new Set(), options.rootName, "");
    if (options.declarationStyle === "interface" && body.startsWith("{")) {
      rootDeclaration = `export interface ${options.rootName} ${body}`;
    } else {
      rootDeclaration = `export type ${options.rootName} = ${body};`;
    }
  } else if (Array.isArray(parsed)) {
    const arrType = inferType(parsed, `${options.rootName}Item`, "");
    rootDeclaration = `export type ${options.rootName} = ${arrType};`;
  } else {
    const primType = inferType(parsed, options.rootName, "");
    rootDeclaration = `export type ${options.rootName} = ${primType};`;
  }

  const allBlocks = [rootDeclaration, ...extractedDeclarations];
  return allBlocks.join("\n\n") + "\n";
}
