import * as jsYaml from "js-yaml";

const yaml: any = (jsYaml as any).default?.load ? (jsYaml as any).default : jsYaml;

export interface CodeConverter {
  slug: string;
  name: string;
  title: string;
  description: string;
  category: "JSON & Schemas" | "DevOps & Network" | "SQL & Database" | "Data Formats";
  inputLanguage: string;
  outputLanguage: string;
  outputFileExtension: string;
  defaultSample: string;
  convert: (input: string) => string;
  faqs: { q: string; a: string }[];
  explanation: {
    summary: string;
    whyUse: string;
    sampleBefore: string;
    sampleAfter: string;
  };
  relatedSlugs: string[];
}

// -----------------------------------------------------------------------------
// Helper parsing functions
// -----------------------------------------------------------------------------

function safeParseJson(input: string): any {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Input is empty.");
  return JSON.parse(trimmed);
}

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]/g, " ")
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("") || "Root";
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase();
}

// -----------------------------------------------------------------------------
// 1. JSON to Zod
// -----------------------------------------------------------------------------
function jsonToZod(input: string): string {
  const data = safeParseJson(input);

  function inferZod(val: any, indent = "  "): string {
    if (val === null || val === undefined) return "z.null()";
    if (typeof val === "string") return "z.string()";
    if (typeof val === "number") return Number.isInteger(val) ? "z.number().int()" : "z.number()";
    if (typeof val === "boolean") return "z.boolean()";
    if (Array.isArray(val)) {
      if (val.length === 0) return "z.array(z.unknown())";
      return `z.array(${inferZod(val[0], indent)})`;
    }
    if (typeof val === "object") {
      const keys = Object.keys(val);
      if (keys.length === 0) return "z.record(z.unknown())";
      const fields = keys
        .map((k) => `${indent}  ${JSON.stringify(k)}: ${inferZod(val[k], indent + "  ")},`)
        .join("\n");
      return `z.object({\n${fields}\n${indent}})`;
    }
    return "z.unknown()";
  }

  const schema = inferZod(data);
  return `import { z } from "zod";\n\nexport const RootSchema = ${schema};\n\nexport type Root = z.infer<typeof RootSchema>;\n`;
}

// -----------------------------------------------------------------------------
// 2. JSON to Prisma
// -----------------------------------------------------------------------------
function jsonToPrisma(input: string): string {
  const data = safeParseJson(input);
  const obj = Array.isArray(data) ? (data[0] || {}) : data;

  let out = `model GeneratedModel {\n`;
  let hasId = false;

  for (const [key, val] of Object.entries(obj)) {
    const isIdField = key.toLowerCase() === "id" || key.toLowerCase().endsWith("_id");
    let type = "String";
    if (typeof val === "number") type = Number.isInteger(val) ? "Int" : "Float";
    else if (typeof val === "boolean") type = "Boolean";
    else if (Array.isArray(val)) type = "Json";
    else if (typeof val === "object" && val !== null) type = "Json";

    if (isIdField && !hasId) {
      out += `  ${key} ${type} @id @default(uuid())\n`;
      hasId = true;
    } else {
      out += `  ${key} ${type}?\n`;
    }
  }

  if (!hasId) {
    out = `model GeneratedModel {\n  id String @id @default(uuid())\n` + out.slice(23);
  }
  out += `  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n`;
  return out;
}

// -----------------------------------------------------------------------------
// 3. JSON to Drizzle ORM
// -----------------------------------------------------------------------------
function jsonToDrizzle(input: string): string {
  const data = safeParseJson(input);
  const obj = Array.isArray(data) ? (data[0] || {}) : data;

  const imports = new Set(["pgTable", "text", "timestamp"]);
  const fields: string[] = [];

  for (const [key, val] of Object.entries(obj)) {
    const snake = toSnakeCase(key);
    if (key.toLowerCase() === "id") {
      imports.add("uuid");
      fields.push(`  id: uuid("id").primaryKey().defaultRandom(),`);
    } else if (typeof val === "number") {
      if (Number.isInteger(val)) {
        imports.add("integer");
        fields.push(`  ${key}: integer("${snake}"),`);
      } else {
        imports.add("doublePrecision");
        fields.push(`  ${key}: doublePrecision("${snake}"),`);
      }
    } else if (typeof val === "boolean") {
      imports.add("boolean");
      fields.push(`  ${key}: boolean("${snake}").default(false),`);
    } else if (typeof val === "object" && val !== null) {
      imports.add("jsonb");
      fields.push(`  ${key}: jsonb("${snake}"),`);
    } else {
      fields.push(`  ${key}: text("${snake}"),`);
    }
  }

  fields.push(`  createdAt: timestamp("created_at").defaultNow().notNull(),`);

  return `import { ${Array.from(imports).join(", ")} } from "drizzle-orm/pg-core";\n\nexport const itemsTable = pgTable("items", {\n${fields.join("\n")}\n});\n\nexport type Item = typeof itemsTable.$inferSelect;\nexport type NewItem = typeof itemsTable.$inferInsert;\n`;
}

// -----------------------------------------------------------------------------
// 4. JSON to SQL (DDL + INSERT)
// -----------------------------------------------------------------------------
function jsonToSql(input: string): string {
  const data = safeParseJson(input);
  const list = Array.isArray(data) ? data : [data];
  if (list.length === 0) return "-- Empty JSON provided";

  const first = list[0];
  const columns: string[] = [];

  for (const [key, val] of Object.entries(first)) {
    let sqlColType = "TEXT";
    if (typeof val === "number") sqlColType = Number.isInteger(val) ? "INTEGER" : "REAL";
    else if (typeof val === "boolean") sqlColType = "BOOLEAN";
    else if (typeof val === "object" && val !== null) sqlColType = "JSONB";

    columns.push(`  "${key}" ${sqlColType}`);
  }

  let sql = `CREATE TABLE IF NOT EXISTS "records" (\n  "id" SERIAL PRIMARY KEY,\n${columns.join(",\n")}\n);\n\n`;

  const colNames = Object.keys(first);
  const insertRows = list.map((item) => {
    const vals = colNames.map((k) => {
      const v = item[k];
      if (v === null || v === undefined) return "NULL";
      if (typeof v === "number" || typeof v === "boolean") return String(v);
      if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
      return `'${String(v).replace(/'/g, "''")}'`;
    });
    return `  (${vals.join(", ")})`;
  });

  sql += `INSERT INTO "records" ("${colNames.join('", "')}") VALUES\n${insertRows.join(",\n")};\n`;
  return sql;
}

// -----------------------------------------------------------------------------
// 5. JSON to Rust Serde Struct
// -----------------------------------------------------------------------------
function jsonToRust(input: string): string {
  const data = safeParseJson(input);
  const obj = Array.isArray(data) ? (data[0] || {}) : data;

  const structName = "GeneratedRecord";
  let fields = "";

  for (const [key, val] of Object.entries(obj)) {
    let rustType = "String";
    if (typeof val === "number") rustType = Number.isInteger(val) ? "i64" : "f64";
    else if (typeof val === "boolean") rustType = "bool";
    else if (Array.isArray(val)) {
      const elemType = val.length > 0 && typeof val[0] === "number" ? "i64" : "String";
      rustType = `Vec<${elemType}>`;
    } else if (typeof val === "object" && val !== null) {
      rustType = "serde_json::Value";
    }

    const snake = toSnakeCase(key);
    if (snake !== key) {
      fields += `    #[serde(rename = "${key}")]\n`;
    }
    fields += `    pub ${snake}: ${rustType},\n`;
  }

  return `use serde::{Deserialize, Serialize};\n\n#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]\npub struct ${structName} {\n${fields}}\n`;
}

// -----------------------------------------------------------------------------
// 6. JSON to Golang Struct
// -----------------------------------------------------------------------------
function jsonToGo(input: string): string {
  const data = safeParseJson(input);
  const obj = Array.isArray(data) ? (data[0] || {}) : data;

  let fields = "";
  for (const [key, val] of Object.entries(obj)) {
    const fieldName = toPascalCase(key);
    let goType = "string";
    if (typeof val === "number") goType = Number.isInteger(val) ? "int64" : "float64";
    else if (typeof val === "boolean") goType = "bool";
    else if (Array.isArray(val)) goType = "[]any";
    else if (typeof val === "object" && val !== null) goType = "map[string]any";

    fields += `\t${fieldName} ${goType} \`json:"${key}"\`\n`;
  }

  return `package models\n\ntype GeneratedRecord struct {\n${fields}}\n`;
}

// -----------------------------------------------------------------------------
// 7. JSON to Python Pydantic
// -----------------------------------------------------------------------------
function jsonToPydantic(input: string): string {
  const data = safeParseJson(input);
  const obj = Array.isArray(data) ? (data[0] || {}) : data;

  let fields = "";
  for (const [key, val] of Object.entries(obj)) {
    let pyType = "str";
    if (typeof val === "number") pyType = Number.isInteger(val) ? "int" : "float";
    else if (typeof val === "boolean") pyType = "bool";
    else if (Array.isArray(val)) pyType = "list[Any]";
    else if (typeof val === "object" && val !== null) pyType = "dict[str, Any]";

    fields += `    ${toSnakeCase(key)}: ${pyType}\n`;
  }

  return `from typing import Any\nfrom pydantic import BaseModel, Field\n\n\nclass GeneratedRecord(BaseModel):\n${fields || "    pass\n"}`;
}

// -----------------------------------------------------------------------------
// 8. JSON to GraphQL
// -----------------------------------------------------------------------------
function jsonToGraphQL(input: string): string {
  const data = safeParseJson(input);
  const obj = Array.isArray(data) ? (data[0] || {}) : data;

  let fields = "";
  for (const [key, val] of Object.entries(obj)) {
    let gqlType = "String";
    if (key.toLowerCase() === "id") gqlType = "ID!";
    else if (typeof val === "number") gqlType = Number.isInteger(val) ? "Int" : "Float";
    else if (typeof val === "boolean") gqlType = "Boolean";
    else if (Array.isArray(val)) gqlType = "[String]";

    fields += `  ${key}: ${gqlType}\n`;
  }

  return `type GeneratedRecord {\n${fields}}\n\ninput GeneratedRecordInput {\n${fields}}\n`;
}

// -----------------------------------------------------------------------------
// 9. JSON to JSDoc
// -----------------------------------------------------------------------------
function jsonToJSDoc(input: string): string {
  const data = safeParseJson(input);
  const obj = Array.isArray(data) ? (data[0] || {}) : data;

  let fields = "";
  for (const [key, val] of Object.entries(obj)) {
    let jsType = "string";
    if (typeof val === "number") jsType = "number";
    else if (typeof val === "boolean") jsType = "boolean";
    else if (Array.isArray(val)) jsType = "Array<*>";
    else if (typeof val === "object" && val !== null) jsType = "Object";

    fields += ` * @property {${jsType}} ${key}\n`;
  }

  return `/**\n * @typedef {Object} GeneratedRecord\n${fields} */\n`;
}

// -----------------------------------------------------------------------------
// 10. JSON to TypeScript Interfaces
// -----------------------------------------------------------------------------
function jsonToTypeScript(input: string): string {
  const data = safeParseJson(input);

  function inferType(val: any, indent = "  "): string {
    if (val === null || val === undefined) return "any";
    if (typeof val === "string") return "string";
    if (typeof val === "number") return "number";
    if (typeof val === "boolean") return "boolean";
    if (Array.isArray(val)) {
      if (val.length === 0) return "any[]";
      return `${inferType(val[0], indent)}[]`;
    }
    if (typeof val === "object") {
      const fields = Object.entries(val).map(
        ([k, v]) => `${indent}  ${k}: ${inferType(v, indent + "  ")};`
      );
      return `{\n${fields.join("\n")}\n${indent}}`;
    }
    return "any";
  }

  const result = inferType(data);
  return `export interface RootObject ${result}\n`;
}

// -----------------------------------------------------------------------------
// cURL Parser Helper
// -----------------------------------------------------------------------------
function parseCurlCommand(input: string): { url: string; method: string; headers: Record<string, string>; body: string | null } {
  const clean = input.replace(/\\\r?\n/g, " ").trim();

  let url = "https://api.example.com";
  const urlHttpMatch = clean.match(/https?:\/\/[^\s'"]+/);
  if (urlHttpMatch) {
    url = urlHttpMatch[0];
  } else {
    const tokens = clean.split(/\s+/);
    for (let i = 1; i < tokens.length; i++) {
      const tok = tokens[i].replace(/^['"]|['"]$/g, "");
      const prev = tokens[i - 1];
      if (!tok.startsWith("-") && !["-X", "--request", "-H", "--header", "-d", "--data", "--data-raw", "-u", "--user"].includes(prev)) {
        url = tok;
        break;
      }
    }
  }

  let method = "GET";
  const xMatch = clean.match(/(?:-X|--request)\s+['"]?([A-Za-z]+)['"]?/i);
  if (xMatch) {
    method = xMatch[1].toUpperCase();
  } else if (/(-d|--data|--data-raw)\s+/.test(clean)) {
    method = "POST";
  }

  const headers: Record<string, string> = {};
  const headerRegex = /(?:-H|--header)\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = headerRegex.exec(clean)) !== null) {
    const colonIdx = m[1].indexOf(":");
    if (colonIdx > 0) {
      const k = m[1].slice(0, colonIdx).trim();
      const v = m[1].slice(colonIdx + 1).trim();
      headers[k] = v;
    }
  }

  let body: string | null = null;
  const dataMatch = clean.match(/(?:-d|--data|--data-raw)\s+['"]([^'"]+)['"]/);
  if (dataMatch) {
    body = dataMatch[1];
  }

  return { url, method, headers, body };
}

// -----------------------------------------------------------------------------
// 11. cURL to Fetch
// -----------------------------------------------------------------------------
function curlToFetch(input: string): string {
  const { url, method, headers, body } = parseCurlCommand(input);

  const options: any = { method };
  if (Object.keys(headers).length) options.headers = headers;
  if (body) {
    try {
      JSON.parse(body);
      options.body = `JSON.stringify(${body})`;
    } catch {
      options.body = JSON.stringify(body);
    }
  }

  let optionsStr = JSON.stringify(options, null, 2);
  if (options.body && options.body.startsWith("JSON.stringify")) {
    optionsStr = optionsStr.replace(`"body": "JSON.stringify(${body})"`, `"body": JSON.stringify(${body})`);
  }

  return `const response = await fetch(${JSON.stringify(url)}, ${optionsStr});\n\nconst data = await response.json();\nconsole.log(data);\n`;
}

// -----------------------------------------------------------------------------
// 12. cURL to Python Requests
// -----------------------------------------------------------------------------
function curlToPython(input: string): string {
  const { url, method, headers, body } = parseCurlCommand(input);
  const m = method.toLowerCase();

  let py = `import requests\n\nurl = ${JSON.stringify(url)}\n`;
  if (Object.keys(headers).length) {
    py += `headers = ${JSON.stringify(headers, null, 4)}\n`;
  }
  if (body) {
    try {
      JSON.parse(body);
      py += `payload = ${body}\n`;
    } catch {
      py += `payload = ${JSON.stringify(body)}\n`;
    }
  }

  const args = ["url"];
  if (Object.keys(headers).length) args.push("headers=headers");
  if (body) args.push(body.startsWith("{") ? "json=payload" : "data=payload");

  py += `\nresponse = requests.${m}(${args.join(", ")})\nprint(response.status_code)\nprint(response.json())\n`;
  return py;
}

// -----------------------------------------------------------------------------
// 13. cURL to Axios
// -----------------------------------------------------------------------------
function curlToAxios(input: string): string {
  const { url, method, headers, body } = parseCurlCommand(input);
  const m = method.toLowerCase();

  let parsedBody: any = null;
  if (body) {
    try {
      parsedBody = JSON.parse(body);
    } catch {
      parsedBody = body;
    }
  }

  return `import axios from "axios";\n\nconst response = await axios({\n  method: "${m}",\n  url: ${JSON.stringify(url)},\n${Object.keys(headers).length ? `  headers: ${JSON.stringify(headers, null, 4)},\n` : ""}${parsedBody ? `  data: ${JSON.stringify(parsedBody, null, 4)},\n` : ""}});\n\nconsole.log(response.data);\n`;
}

// -----------------------------------------------------------------------------
// 14. Docker run to Docker Compose
// -----------------------------------------------------------------------------
function dockerRunToCompose(input: string): string {
  const clean = input.replace(/\\\n/g, " ").replace(/\s+/g, " ").trim();
  const parts = clean.split(/\s+/);

  let image = "nginx:latest";
  let containerName = "app";
  const ports: string[] = [];
  const volumes: string[] = [];
  const envs: string[] = [];
  let restart = "unless-stopped";

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p === "--name" && parts[i + 1]) containerName = parts[++i];
    else if ((p === "-p" || p === "--publish") && parts[i + 1]) ports.push(parts[++i].replace(/['"]/g, ""));
    else if ((p === "-v" || p === "--volume") && parts[i + 1]) volumes.push(parts[++i].replace(/['"]/g, ""));
    else if ((p === "-e" || p === "--env") && parts[i + 1]) envs.push(parts[++i].replace(/['"]/g, ""));
    else if (p === "--restart" && parts[i + 1]) restart = parts[++i];
    else if (!p.startsWith("-") && p !== "docker" && p !== "run" && i === parts.length - 1) {
      image = p;
    }
  }

  let yamlOut = `version: "3.8"\n\nservices:\n  ${containerName}:\n    image: ${image}\n    container_name: ${containerName}\n    restart: ${restart}\n`;

  if (ports.length) {
    yamlOut += `    ports:\n` + ports.map((p) => `      - "${p}"`).join("\n") + "\n";
  }
  if (volumes.length) {
    yamlOut += `    volumes:\n` + volumes.map((v) => `      - "${v}"`).join("\n") + "\n";
  }
  if (envs.length) {
    yamlOut += `    environment:\n` + envs.map((e) => `      - ${e}`).join("\n") + "\n";
  }

  return yamlOut;
}

// -----------------------------------------------------------------------------
// 15. .env to Docker Compose & K8s ConfigMap
// -----------------------------------------------------------------------------
function envToComposeAndK8s(input: string): string {
  const lines = input
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  const envMap: Record<string, string> = {};
  for (const line of lines) {
    const idx = line.indexOf("=");
    if (idx !== -1) {
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
      envMap[k] = v;
    }
  }

  let compose = `# 1. Docker Compose Format\nenvironment:\n`;
  for (const [k, v] of Object.entries(envMap)) {
    compose += `  - ${k}=${v}\n`;
  }

  compose += `\n# 2. Kubernetes ConfigMap Format\napiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: app-config\ndata:\n`;
  for (const [k, v] of Object.entries(envMap)) {
    compose += `  ${k}: "${v}"\n`;
  }

  return compose;
}

// -----------------------------------------------------------------------------
// 16. SQL DDL to Prisma Schema
// -----------------------------------------------------------------------------
function sqlToPrisma(input: string): string {
  const tableMatch = input.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([a-zA-Z0-9_]+)["`]?/i);
  const tableName = tableMatch ? toPascalCase(tableMatch[1]) : "AppModel";

  const lines = input.split("\n");
  const fields: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim().replace(/,$/, "");
    if (/CREATE\s+TABLE/i.test(trimmed) || /^\s*\)/.test(trimmed) || !trimmed) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) continue;

    const colName = parts[0].replace(/["`]/g, "");
    const rawType = parts[1].toUpperCase();

    let prismaType = "String";
    if (rawType.includes("INT")) prismaType = "Int";
    else if (rawType.includes("BOOL")) prismaType = "Boolean";
    else if (rawType.includes("FLOAT") || rawType.includes("REAL") || rawType.includes("DOUBLE")) prismaType = "Float";
    else if (rawType.includes("TIME") || rawType.includes("DATE")) prismaType = "DateTime";
    else if (rawType.includes("JSON")) prismaType = "Json";

    const isPrimary = /PRIMARY\s+KEY/i.test(trimmed);
    const isUnique = /UNIQUE/i.test(trimmed);

    let attrs = "";
    if (isPrimary) attrs += " @id @default(autoincrement())";
    if (isUnique) attrs += " @unique";

    fields.push(`  ${colName} ${prismaType}${attrs}`);
  }

  return `model ${tableName} {\n${fields.join("\n")}\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n`;
}

// -----------------------------------------------------------------------------
// 17. SQL DDL to TypeScript
// -----------------------------------------------------------------------------
function sqlToTypeScript(input: string): string {
  const tableMatch = input.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([a-zA-Z0-9_]+)["`]?/i);
  const interfaceName = tableMatch ? toPascalCase(tableMatch[1]) : "DatabaseRecord";

  const lines = input.split("\n");
  const fields: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim().replace(/,$/, "");
    if (/CREATE\s+TABLE/i.test(trimmed) || /^\s*\)/.test(trimmed) || !trimmed) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) continue;

    const colName = parts[0].replace(/["`]/g, "");
    const rawType = parts[1].toUpperCase();

    let tsType = "string";
    if (rawType.includes("INT") || rawType.includes("FLOAT") || rawType.includes("REAL") || rawType.includes("NUMERIC")) tsType = "number";
    else if (rawType.includes("BOOL")) tsType = "boolean";
    else if (rawType.includes("TIME") || rawType.includes("DATE")) tsType = "Date | string";
    else if (rawType.includes("JSON")) tsType = "Record<string, unknown>";

    const isNullable = !/NOT\s+NULL/i.test(trimmed) && !/PRIMARY\s+KEY/i.test(trimmed);
    fields.push(`  ${colName}${isNullable ? "?" : ""}: ${tsType};`);
  }

  return `export interface ${interfaceName} {\n${fields.join("\n")}\n}\n`;
}

// -----------------------------------------------------------------------------
// 18. CSV to JSON
// -----------------------------------------------------------------------------
function csvToJson(input: string): string {
  const lines = input.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 1) return "[]";

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^['"]|['"]$/g, ""));
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim().replace(/^['"]|['"]$/g, ""));
    const row: Record<string, any> = {};
    headers.forEach((h, idx) => {
      const val = cells[idx] ?? "";
      if (val === "true") row[h] = true;
      else if (val === "false") row[h] = false;
      else if (val !== "" && !isNaN(Number(val))) row[h] = Number(val);
      else row[h] = val;
    });
    records.push(row);
  }

  return JSON.stringify(records, null, 2);
}

// -----------------------------------------------------------------------------
// 19. JSON to CSV
// -----------------------------------------------------------------------------
function jsonToCsv(input: string): string {
  const data = safeParseJson(input);
  const arr = Array.isArray(data) ? data : [data];
  if (arr.length === 0) return "";

  const headers = Array.from(new Set(arr.flatMap((item) => Object.keys(item))));
  const csvRows = [headers.join(",")];

  for (const item of arr) {
    const row = headers.map((h) => {
      const v = item[h];
      if (v === null || v === undefined) return "";
      const str = typeof v === "object" ? JSON.stringify(v) : String(v);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    csvRows.push(row.join(","));
  }

  return csvRows.join("\n");
}

// -----------------------------------------------------------------------------
// 20. YAML to JSON & JSON to YAML
// -----------------------------------------------------------------------------
function yamlToJson(input: string): string {
  const parsed = yaml.load(input);
  return JSON.stringify(parsed, null, 2);
}

function jsonToYaml(input: string): string {
  const parsed = safeParseJson(input);
  return yaml.dump(parsed, { indent: 2 });
}

// -----------------------------------------------------------------------------
// REGISTRY DICTIONARY OF CONVERTERS
// -----------------------------------------------------------------------------

export const CODE_CONVERTERS: CodeConverter[] = [
  {
    slug: "json-to-zod",
    name: "JSON to Zod Schema",
    title: "JSON to Zod Schema Converter — Free Online TypeScript Validator Generator",
    description: "Convert JSON data to TypeScript Zod schemas instantly. Generates nested z.object, arrays, optional types, and type inference client-side.",
    category: "JSON & Schemas",
    inputLanguage: "json",
    outputLanguage: "typescript",
    outputFileExtension: ".ts",
    defaultSample: `{\n  "id": "usr_9918",\n  "name": "Sarah Connor",\n  "email": "sarah@cyberdyne.io",\n  "isActive": true,\n  "role": "admin",\n  "loginCount": 42,\n  "tags": ["security", "lead"]\n}`,
    convert: jsonToZod,
    faqs: [
      {
        q: "What is Zod and why use it over plain TypeScript interfaces?",
        a: "Zod provides runtime type validation in addition to static TypeScript inference. While TypeScript types vanish after compilation, Zod schemas parse and validate actual API payloads and user inputs safely at runtime.",
      },
      {
        q: "Does this converter run securely in the browser?",
        a: "Yes, 100%. All schema parsing runs client-side inside your browser engine. Zero data is transmitted to external servers.",
      },
    ],
    explanation: {
      summary: "Transforms raw JSON responses into production-ready Zod validator schemas with full TypeScript type inference.",
      whyUse: "Eliminates repetitive manual typing of validation rules when building API clients, form handlers, or tRPC procedures.",
      sampleBefore: `{"id": "usr_1", "name": "Alice", "score": 98}`,
      sampleAfter: `export const RootSchema = z.object({\n  id: z.string(),\n  name: z.string(),\n  score: z.number().int(),\n});`,
    },
    relatedSlugs: ["json-to-prisma", "json-to-drizzle", "json-to-rust-struct", "json-to-go-struct"],
  },
  {
    slug: "json-to-prisma",
    name: "JSON to Prisma Schema",
    title: "JSON to Prisma Model Converter — Instant PostgreSQL & MySQL Schema Generator",
    description: "Generate production Prisma models from JSON objects. Automatically detects IDs, UUIDs, relations, DateTime fields, and JSON types.",
    category: "JSON & Schemas",
    inputLanguage: "json",
    outputLanguage: "prisma",
    outputFileExtension: ".prisma",
    defaultSample: `{\n  "id": "e4b5c6d7",\n  "username": "alex_dev",\n  "salary": 145000.50,\n  "isVerified": true,\n  "metadata": { "theme": "dark" }\n}`,
    convert: jsonToPrisma,
    faqs: [
      {
        q: "How does the converter identify the primary key?",
        a: "Fields named 'id' or ending with '_id' are automatically annotated with @id @default(uuid()).",
      },
    ],
    explanation: {
      summary: "Converts JSON payloads directly into Prisma ORM schema models.",
      whyUse: "Quickly bootstrap your Prisma database schema directly from prototype mock payloads or API JSON responses.",
      sampleBefore: `{"id": "1", "title": "Post", "views": 100}`,
      sampleAfter: `model GeneratedModel {\n  id String @id @default(uuid())\n  title String?\n  views Int?\n}`,
    },
    relatedSlugs: ["json-to-zod", "json-to-drizzle", "sql-to-prisma", "json-to-sql"],
  },
  {
    slug: "json-to-drizzle",
    name: "JSON to Drizzle ORM",
    title: "JSON to Drizzle ORM Converter — PostgreSQL Table Generator",
    description: "Convert JSON payloads into typed Drizzle ORM table definitions with pgTable, UUIDs, integer, and jsonb column mapping.",
    category: "JSON & Schemas",
    inputLanguage: "json",
    outputLanguage: "typescript",
    outputFileExtension: ".ts",
    defaultSample: `{\n  "id": "7f8a9b",\n  "title": "Modern Edge Architecture",\n  "views": 1420,\n  "published": true\n}`,
    convert: jsonToDrizzle,
    faqs: [
      {
        q: "Which SQL dialect does this Drizzle generator target?",
        a: "It generates PostgreSQL tables via drizzle-orm/pg-core with snake_case column names and camelCase TypeScript properties.",
      },
    ],
    explanation: {
      summary: "Translates JSON structures into Drizzle ORM table schemas with inferSelect and inferInsert types.",
      whyUse: "Saves time when migrating legacy APIs or building new PostgreSQL microservices with Drizzle.",
      sampleBefore: `{"id": "uuid", "name": "Item"}`,
      sampleAfter: `export const itemsTable = pgTable("items", { id: uuid("id").primaryKey(), name: text("name") });`,
    },
    relatedSlugs: ["json-to-prisma", "json-to-sql", "sql-to-typescript"],
  },
  {
    slug: "json-to-sql",
    name: "JSON to SQL (CREATE & INSERT)",
    title: "JSON to SQL Converter — Free Online DDL & INSERT Statement Generator",
    description: "Generate SQL CREATE TABLE and INSERT INTO statements from any JSON object or array of objects. Handles escaped quotes and types.",
    category: "SQL & Database",
    inputLanguage: "json",
    outputLanguage: "sql",
    outputFileExtension: ".sql",
    defaultSample: `[\n  { "id": 1, "username": "alice", "isAdmin": true, "balance": 450.25 },\n  { "id": 2, "username": "bob", "isAdmin": false, "balance": 120.00 }\n]`,
    convert: jsonToSql,
    faqs: [
      {
        q: "Can I convert an array of multiple objects?",
        a: "Yes. The converter extracts columns from the first object and generates multiple-row SQL INSERT statements.",
      },
    ],
    explanation: {
      summary: "Turns JSON arrays into relational SQL schema definitions and batch INSERT commands.",
      whyUse: "Ideal for seeding relational databases (PostgreSQL, MySQL, SQLite) directly from JSON data exports.",
      sampleBefore: `[{"id": 1, "name": "Demo"}]`,
      sampleAfter: `CREATE TABLE "records" (...);\nINSERT INTO "records" ("id", "name") VALUES (1, 'Demo');`,
    },
    relatedSlugs: ["json-to-prisma", "json-to-drizzle", "sql-to-typescript"],
  },
  {
    slug: "json-to-rust-struct",
    name: "JSON to Rust Struct (Serde)",
    title: "JSON to Rust Struct Converter — Free Online Serde Model Generator",
    description: "Convert JSON to idiomatic Rust structs with serde::Serialize and serde::Deserialize derives, snake_case renaming, and Vec types.",
    category: "JSON & Schemas",
    inputLanguage: "json",
    outputLanguage: "rust",
    outputFileExtension: ".rs",
    defaultSample: `{\n  "firstName": "Linus",\n  "commitCount": 18500,\n  "isMaintainer": true,\n  "languages": ["C", "Rust"]\n}`,
    convert: jsonToRust,
    faqs: [
      {
        q: "Does it support field renaming?",
        a: "Yes, camelCase JSON keys are automatically converted to idiomatic snake_case with #[serde(rename = \"...\")].",
      },
    ],
    explanation: {
      summary: "Transforms JSON into strongly-typed Rust struct models with Serde serialization support.",
      whyUse: "Rapidly write Actix, Axum, or CLI integrations consuming external JSON web services.",
      sampleBefore: `{"userId": 1, "userName": "Ferris"}`,
      sampleAfter: `#[derive(Serialize, Deserialize)]\npub struct GeneratedRecord {\n    #[serde(rename = "userId")]\n    pub user_id: i64,\n}`,
    },
    relatedSlugs: ["json-to-go-struct", "json-to-python-pydantic", "json-to-zod"],
  },
  {
    slug: "json-to-go-struct",
    name: "JSON to Go Struct",
    title: "JSON to Go Struct Converter — Free Online Golang Type Generator",
    description: "Convert JSON to Golang structs with struct tags (`json:\"...\"`), PascalCase fields, int64, float64, and slice inference.",
    category: "JSON & Schemas",
    inputLanguage: "json",
    outputLanguage: "go",
    outputFileExtension: ".go",
    defaultSample: `{\n  "service_name": "auth-gateway",\n  "port": 8080,\n  "debug_mode": false,\n  "allowed_origins": ["https://castov.com"]\n}`,
    convert: jsonToGo,
    faqs: [
      {
        q: "Are Go field names exported?",
        a: "Yes, field names are converted to PascalCase so they are exported and accessible to the Go json package.",
      },
    ],
    explanation: {
      summary: "Converts arbitrary JSON schemas into idiomatic Golang struct definitions.",
      whyUse: "Speeds up backend Go microservice development when implementing REST or gRPC HTTP gateways.",
      sampleBefore: `{"task_id": 42, "done": true}`,
      sampleAfter: `type GeneratedRecord struct {\n\tTaskId int64 \`json:"task_id"\`\n\tDone bool \`json:"done"\`\n}`,
    },
    relatedSlugs: ["json-to-rust-struct", "json-to-python-pydantic", "json-to-ts"],
  },
  {
    slug: "json-to-python-pydantic",
    name: "JSON to Python Pydantic",
    title: "JSON to Python Pydantic Model Converter — FastAPI & Type Hints Generator",
    description: "Convert JSON to Python Pydantic v2 BaseModel classes. Infers int, float, str, bool, list[Any], and dict[str, Any].",
    category: "JSON & Schemas",
    inputLanguage: "json",
    outputLanguage: "python",
    outputFileExtension: ".py",
    defaultSample: `{\n  "model_name": "llama-3-8b",\n  "temperature": 0.7,\n  "max_tokens": 4096,\n  "stream": true\n}`,
    convert: jsonToPydantic,
    faqs: [
      {
        q: "Is the generated model compatible with FastAPI?",
        a: "Yes, Pydantic BaseModels can be directly plugged into FastAPI route signatures for automated request validation.",
      },
    ],
    explanation: {
      summary: "Turns JSON dictionaries into clean Pydantic classes with standard Python 3.10+ type annotations.",
      whyUse: "Essential for FastAPI, AI agent tool schemas, and data engineering pipelines.",
      sampleBefore: `{"name": "Agent", "step": 1}`,
      sampleAfter: `class GeneratedRecord(BaseModel):\n    name: str\n    step: int`,
    },
    relatedSlugs: ["json-to-rust-struct", "json-to-go-struct", "json-to-zod"],
  },
  {
    slug: "json-to-graphql",
    name: "JSON to GraphQL Schema",
    title: "JSON to GraphQL Type Definition Converter — Free Online SDL Generator",
    description: "Convert JSON payloads into GraphQL Object Types and Input Types with ID, Int, Float, String, and Boolean inference.",
    category: "JSON & Schemas",
    inputLanguage: "json",
    outputLanguage: "graphql",
    outputFileExtension: ".gql",
    defaultSample: `{\n  "id": "item_123",\n  "title": "Quantum Computing Essentials",\n  "rating": 4.9,\n  "inStock": true\n}`,
    convert: jsonToGraphQL,
    faqs: [
      {
        q: "Does it generate input types?",
        a: "Yes, it generates both the query Object type and the mutation Input type simultaneously.",
      },
    ],
    explanation: {
      summary: "Transforms JSON into GraphQL Schema Definition Language (SDL) types.",
      whyUse: "Instantly draft GraphQL schemas when prototyping Apollo, Yoga, or Relay APIs.",
      sampleBefore: `{"id": "1", "score": 9.5}`,
      sampleAfter: `type GeneratedRecord {\n  id: ID!\n  score: Float\n}`,
    },
    relatedSlugs: ["json-to-zod", "json-to-ts", "json-to-prisma"],
  },
  {
    slug: "json-to-jsdoc",
    name: "JSON to JSDoc Typedef",
    title: "JSON to JSDoc @typedef Converter — Type Annotations for Vanilla JavaScript",
    description: "Convert JSON objects into detailed JSDoc @typedef blocks. Get full IDE autocomplete and type safety in plain JavaScript.",
    category: "JSON & Schemas",
    inputLanguage: "json",
    outputLanguage: "javascript",
    outputFileExtension: ".js",
    defaultSample: `{\n  "apiKey": "sk_test_9912",\n  "retryCount": 3,\n  "enabled": true\n}`,
    convert: jsonToJSDoc,
    faqs: [
      {
        q: "Why use JSDoc instead of TypeScript?",
        a: "JSDoc gives you VS Code autocomplete and type safety in vanilla Node.js or browser scripts without requiring a compile step.",
      },
    ],
    explanation: {
      summary: "Generates JSDoc comments defining object structure from JSON.",
      whyUse: "Ideal for Node.js scripts, browser libraries, or projects where TypeScript cannot be introduced.",
      sampleBefore: `{"port": 3000, "host": "localhost"}`,
      sampleAfter: `/**\n * @typedef {Object} GeneratedRecord\n * @property {number} port\n * @property {string} host\n */`,
    },
    relatedSlugs: ["json-to-ts", "json-to-zod"],
  },
  {
    slug: "json-to-ts",
    name: "JSON to TypeScript",
    title: "JSON to TypeScript Interface Converter — Free Online Type Generator",
    description: "Convert JSON to clean TypeScript interfaces with nested object resolution, primitive mapping, and optional properties.",
    category: "JSON & Schemas",
    inputLanguage: "json",
    outputLanguage: "typescript",
    outputFileExtension: ".ts",
    defaultSample: `{\n  "user": {\n    "id": 101,\n    "profile": {\n      "displayName": "Ada Lovelace",\n      "verified": true\n    }\n  }\n}`,
    convert: jsonToTypeScript,
    faqs: [
      {
        q: "Does it support deep nested objects?",
        a: "Yes, child objects and arrays are recursively typed into valid TypeScript interface structures.",
      },
    ],
    explanation: {
      summary: "Converts JSON documents directly into TypeScript interface declarations.",
      whyUse: "Saves hours of manual type declaration when integrating third-party REST APIs.",
      sampleBefore: `{"count": 10, "label": "items"}`,
      sampleAfter: `export interface RootObject {\n  count: number;\n  label: string;\n}`,
    },
    relatedSlugs: ["json-to-zod", "json-to-jsdoc", "sql-to-typescript"],
  },
  {
    slug: "curl-to-fetch",
    name: "cURL to JavaScript Fetch",
    title: "cURL to Fetch Converter — Convert cURL Command to JavaScript / TypeScript",
    description: "Convert any cURL command line string into a modern async fetch() call. Parses HTTP methods, custom headers, and JSON body payloads.",
    category: "DevOps & Network",
    inputLanguage: "bash",
    outputLanguage: "javascript",
    outputFileExtension: ".js",
    defaultSample: `curl -X POST "https://api.example.com/v1/auth" \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer my_secret_token" \\\n  -d '{"username": "dev", "pass": "secret"}'`,
    convert: curlToFetch,
    faqs: [
      {
        q: "Can I use the output in browser scripts and Node.js?",
        a: "Yes, modern fetch() is standard in all modern browsers and Node.js 18+.",
      },
    ],
    explanation: {
      summary: "Transforms shell cURL commands into JavaScript Fetch code.",
      whyUse: "Convert API documentation examples or Postman cURL snippets into frontend or backend code instantly.",
      sampleBefore: `curl -H "Auth: 123" https://api.com`,
      sampleAfter: `fetch("https://api.com", { headers: { "Auth": "123" } });`,
    },
    relatedSlugs: ["curl-to-python", "curl-to-axios"],
  },
  {
    slug: "curl-to-python",
    name: "cURL to Python Requests",
    title: "cURL to Python Converter — Convert cURL to Python requests Library",
    description: "Convert cURL commands into clean Python requests code. Automatically configures query params, headers, and json data payloads.",
    category: "DevOps & Network",
    inputLanguage: "bash",
    outputLanguage: "python",
    outputFileExtension: ".py",
    defaultSample: `curl -X POST "https://api.castov.com/v1/webhook" \\\n  -H "Content-Type: application/json" \\\n  -d '{"event": "deployment_succeeded", "env": "prod"}'`,
    convert: curlToPython,
    faqs: [
      {
        q: "Which Python HTTP library does this use?",
        a: "It generates code for the standard 'requests' library, compatible with all Python 3.8+ environments.",
      },
    ],
    explanation: {
      summary: "Translates terminal cURL syntax into idiomatic Python requests script format.",
      whyUse: "Quickly migrate terminal commands into Python automation scripts or Jupyter notebooks.",
      sampleBefore: `curl https://httpbin.org/get`,
      sampleAfter: `import requests\nresponse = requests.get("https://httpbin.org/get")`,
    },
    relatedSlugs: ["curl-to-fetch", "curl-to-axios"],
  },
  {
    slug: "curl-to-axios",
    name: "cURL to Axios",
    title: "cURL to Axios Converter — Convert cURL Command to Node.js & React Axios",
    description: "Convert cURL commands to Axios HTTP request options with method, headers, and request body configuration.",
    category: "DevOps & Network",
    inputLanguage: "bash",
    outputLanguage: "javascript",
    outputFileExtension: ".js",
    defaultSample: `curl -X PUT "https://api.example.com/users/42" \\\n  -H "Authorization: Bearer token123" \\\n  -H "Content-Type: application/json" \\\n  -d '{"status": "active"}'`,
    convert: curlToAxios,
    faqs: [
      {
        q: "Does Axios handle JSON serialization automatically?",
        a: "Yes, passing an object to Axios's data parameter automatically sets the Content-Type header to application/json.",
      },
    ],
    explanation: {
      summary: "Converts terminal cURL commands into an Axios configuration block.",
      whyUse: "Perfect for React, Vue, Next.js, and Node.js applications that standardize on Axios.",
      sampleBefore: `curl -X DELETE https://api.com/item/1`,
      sampleAfter: `await axios({ method: "delete", url: "https://api.com/item/1" });`,
    },
    relatedSlugs: ["curl-to-fetch", "curl-to-python"],
  },
  {
    slug: "docker-run-to-compose",
    name: "Docker Run to Docker Compose",
    title: "Docker Run to Docker Compose Converter — Convert CLI Flags to docker-compose.yml",
    description: "Convert docker run commands into clean docker-compose.yml files. Extracts image, container_name, ports, volumes, and environment variables.",
    category: "DevOps & Network",
    inputLanguage: "bash",
    outputLanguage: "yaml",
    outputFileExtension: ".yml",
    defaultSample: `docker run -d --name redis-cache \\\n  -p 6379:6379 \\\n  -v redis_data:/data \\\n  -e REDIS_PASSWORD=secret123 \\\n  --restart always \\\n  redis:7-alpine`,
    convert: dockerRunToCompose,
    faqs: [
      {
        q: "Which flags are supported?",
        a: "Supports -p / --publish, -v / --volume, -e / --env, --name, --restart, -d, and image name.",
      },
    ],
    explanation: {
      summary: "Converts single docker run shell commands into multi-container Docker Compose specifications.",
      whyUse: "Makes commands reproducible and version-controllable in your Git repository.",
      sampleBefore: `docker run -p 80:80 nginx`,
      sampleAfter: `version: "3.8"\nservices:\n  app:\n    image: nginx\n    ports:\n      - "80:80"`,
    },
    relatedSlugs: ["env-to-docker-compose", "yaml-to-json"],
  },
  {
    slug: "env-to-docker-compose",
    name: ".env to Docker Compose & K8s",
    title: ".env to Docker Compose & Kubernetes ConfigMap Converter",
    description: "Convert raw .env files into Docker Compose environment blocks and Kubernetes ConfigMap YAML definitions.",
    category: "DevOps & Network",
    inputLanguage: "env",
    outputLanguage: "yaml",
    outputFileExtension: ".yml",
    defaultSample: `DATABASE_URL=postgres://user:pass@localhost:5432/db\nJWT_SECRET=super_secret_jwt_key_2026\nPORT=3000\nNODE_ENV=production`,
    convert: envToComposeAndK8s,
    faqs: [
      {
        q: "Does it strip comments and empty lines?",
        a: "Yes, comments starting with '#' and blank lines are ignored automatically.",
      },
    ],
    explanation: {
      summary: "Formats environment variable lists into Docker Compose and Kubernetes deployment syntax.",
      whyUse: "Eliminates tedious manual indentation when moving local .env variables into deployment pipelines.",
      sampleBefore: `API_KEY=xyz123`,
      sampleAfter: `environment:\n  - API_KEY=xyz123`,
    },
    relatedSlugs: ["docker-run-to-compose", "yaml-to-json"],
  },
  {
    slug: "sql-to-prisma",
    name: "SQL DDL to Prisma Schema",
    title: "SQL to Prisma Schema Converter — Convert CREATE TABLE to Prisma Models",
    description: "Convert SQL CREATE TABLE statements into Prisma schema models with @id, @unique, types, and timestamp defaults.",
    category: "SQL & Database",
    inputLanguage: "sql",
    outputLanguage: "prisma",
    outputFileExtension: ".prisma",
    defaultSample: `CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  email VARCHAR(255) UNIQUE NOT NULL,\n  full_name TEXT,\n  is_active BOOLEAN DEFAULT true,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);`,
    convert: sqlToPrisma,
    faqs: [
      {
        q: "Does it handle primary keys?",
        a: "Yes, columns marked with PRIMARY KEY or SERIAL are mapped to Prisma's @id @default(autoincrement()).",
      },
    ],
    explanation: {
      summary: "Translates relational SQL CREATE TABLE statements into Prisma ORM schema models.",
      whyUse: "Quickly migrate existing SQL database tables into a modern Prisma ORM codebase.",
      sampleBefore: `CREATE TABLE posts (id INT PRIMARY KEY, title TEXT);`,
      sampleAfter: `model Posts {\n  id Int @id @default(autoincrement())\n  title String?\n}`,
    },
    relatedSlugs: ["sql-to-typescript", "json-to-prisma", "json-to-sql"],
  },
  {
    slug: "sql-to-typescript",
    name: "SQL DDL to TypeScript",
    title: "SQL to TypeScript Interface Converter — Free Online Table-to-Type Generator",
    description: "Convert SQL CREATE TABLE statements into TypeScript interfaces. Automatically maps SQL types to number, string, boolean, Date, and nullable fields.",
    category: "SQL & Database",
    inputLanguage: "sql",
    outputLanguage: "typescript",
    outputFileExtension: ".ts",
    defaultSample: `CREATE TABLE products (\n  id INT PRIMARY KEY,\n  name VARCHAR(100) NOT NULL,\n  price NUMERIC(10, 2) NOT NULL,\n  description TEXT,\n  created_at TIMESTAMP\n);`,
    convert: sqlToTypeScript,
    faqs: [
      {
        q: "How does it handle nullable columns?",
        a: "Columns that do not have NOT NULL or PRIMARY KEY are marked as optional TypeScript properties (e.g. col?: string).",
      },
    ],
    explanation: {
      summary: "Converts SQL table schemas directly into TypeScript type definitions.",
      whyUse: "Gives backend developers full compile-time type safety when querying relational tables via pg, mysql2, or sqlite3.",
      sampleBefore: `CREATE TABLE logs (id INT, message TEXT);`,
      sampleAfter: `export interface Logs {\n  id?: number;\n  message?: string;\n}`,
    },
    relatedSlugs: ["sql-to-prisma", "json-to-ts", "json-to-sql"],
  },
  {
    slug: "csv-to-json",
    name: "CSV to JSON Converter",
    title: "CSV to JSON Converter — Free Online Delimited Data Parser",
    description: "Convert CSV spreadsheets into clean JSON arrays of objects. Automatically parses numbers, booleans, and quoted cells client-side.",
    category: "Data Formats",
    inputLanguage: "csv",
    outputLanguage: "json",
    outputFileExtension: ".json",
    defaultSample: `id,product_name,price,in_stock\n1,Mechanical Keyboard,129.99,true\n2,Wireless Mouse,49.50,true\n3,USB-C Dock,89.00,false`,
    convert: csvToJson,
    faqs: [
      {
        q: "Is there a row limit?",
        a: "Because processing runs 100% locally in your browser memory, it can handle tens of thousands of rows without server timeouts.",
      },
    ],
    explanation: {
      summary: "Converts comma-separated values into a structured JSON array.",
      whyUse: "Essential for data pipelines, mock testing, and importing tabular data into modern web applications.",
      sampleBefore: `id,name\n1,Castov`,
      sampleAfter: `[{"id": 1, "name": "Castov"}]`,
    },
    relatedSlugs: ["json-to-csv", "json-to-sql", "yaml-to-json"],
  },
  {
    slug: "json-to-csv",
    name: "JSON to CSV Converter",
    title: "JSON to CSV Converter — Convert JSON Array to Spreadsheet Format",
    description: "Convert JSON arrays of objects into RFC 4180 compliant CSV files with headers, escaping, and instant download.",
    category: "Data Formats",
    inputLanguage: "json",
    outputLanguage: "csv",
    outputFileExtension: ".csv",
    defaultSample: `[\n  { "id": 101, "name": "Antigravity", "role": "AI Architect", "department": "Core" },\n  { "id": 102, "name": "Castov User", "role": "Senior Engineer", "department": "Platform" }\n]`,
    convert: jsonToCsv,
    faqs: [
      {
        q: "Can I open the generated CSV in Microsoft Excel or Google Sheets?",
        a: "Yes, the output adheres to standard RFC 4180 CSV specifications and opens natively in all spreadsheet editors.",
      },
    ],
    explanation: {
      summary: "Turns nested JSON datasets into flat, comma-separated values.",
      whyUse: "Great for exporting user lists, audit logs, or metrics reports to Excel or Google Sheets.",
      sampleBefore: `[{"id": 1, "status": "ok"}]`,
      sampleAfter: `id,status\n1,ok`,
    },
    relatedSlugs: ["csv-to-json", "json-to-sql", "json-to-yaml"],
  },
  {
    slug: "yaml-to-json",
    name: "YAML to JSON Converter",
    title: "YAML to JSON Converter — Free Online YAML Parser",
    description: "Convert YAML configuration files into valid JSON. Powered by js-yaml for full YAML 1.2 specification compliance.",
    category: "Data Formats",
    inputLanguage: "yaml",
    outputLanguage: "json",
    outputFileExtension: ".json",
    defaultSample: `server:\n  port: 8080\n  host: 0.0.0.0\nfeatures:\n  telemetry: false\n  caching: true\nworkers:\n  - worker-1\n  - worker-2`,
    convert: yamlToJson,
    faqs: [
      {
        q: "Does it support YAML anchors and aliases?",
        a: "Yes, js-yaml supports standard YAML specifications including anchors, aliases, and multiline strings.",
      },
    ],
    explanation: {
      summary: "Parses YAML syntax and outputs formatted, indented JSON.",
      whyUse: "Useful for converting Kubernetes manifests, GitHub Actions workflows, or Docker Compose files into JSON.",
      sampleBefore: `name: Castov\nversion: 1`,
      sampleAfter: `{\n  "name": "Castov",\n  "version": 1\n}`,
    },
    relatedSlugs: ["json-to-yaml", "docker-run-to-compose", "env-to-docker-compose"],
  },
  {
    slug: "json-to-yaml",
    name: "JSON to YAML Converter",
    title: "JSON to YAML Converter — Convert JSON to YAML Configs",
    description: "Convert JSON data into clean, human-readable YAML configurations with 2-space indentation.",
    category: "Data Formats",
    inputLanguage: "json",
    outputLanguage: "yaml",
    outputFileExtension: ".yml",
    defaultSample: `{\n  "apiVersion": "apps/v1",\n  "kind": "Deployment",\n  "metadata": {\n    "name": "castov-service"\n  },\n  "spec": {\n    "replicas": 3\n  }\n}`,
    convert: jsonToYaml,
    faqs: [
      {
        q: "Is YAML indentation preserved?",
        a: "Yes, the generator formats clean 2-space indentation with clean array lists.",
      },
    ],
    explanation: {
      summary: "Transforms JSON objects into readable YAML syntax.",
      whyUse: "Essential for creating Kubernetes manifests, Helm values, and CI/CD configuration files from JSON.",
      sampleBefore: `{"env": "production", "debug": false}`,
      sampleAfter: `env: production\ndebug: false\n`,
    },
    relatedSlugs: ["yaml-to-json", "env-to-docker-compose"],
  },
];

export function getConverterBySlug(slug: string): CodeConverter | undefined {
  return CODE_CONVERTERS.find((c) => c.slug === slug);
}
