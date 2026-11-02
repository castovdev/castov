/**
 * SQL DDL to Prisma Schema Engine (Client-side, Zero-network)
 *
 * Capabilities:
 * - Parses multiple `CREATE TABLE` statements and PostgreSQL `CREATE TYPE ... AS ENUM (...)` / MySQL inline `ENUM(...)`
 * - Supports PostgreSQL & MySQL column types:
 *   - Serial / Auto-increment: `SERIAL`, `BIGSERIAL`, `SMALLSERIAL`, `AUTO_INCREMENT`, `GENERATED ALWAYS AS IDENTITY`
 *   - UUID: `UUID`, `CHAR(36)` with `gen_random_uuid()` / `uuid_generate_v4()` -> `@default(uuid())`
 *   - Integers & Decimals: `INT`, `INTEGER`, `SMALLINT`, `TINYINT(1)` (boolean in MySQL), `BIGINT` (`BigInt`), `DECIMAL`/`NUMERIC` (`Decimal`), `REAL`/`FLOAT`/`DOUBLE PRECISION` (`Float`)
 *   - Strings & Binary: `VARCHAR(n)` (`@db.VarChar(n)`), `CHAR(n)`, `TEXT`, `CITEXT`, `BYTEA`/`BLOB` (`Bytes`)
 *   - Dates & Times: `TIMESTAMP`, `TIMESTAMPTZ`, `DATETIME`, `DATE`, `TIME` (`DateTime`)
 *   - JSON: `JSON`, `JSONB` (`Json`)
 *   - Arrays: PostgreSQL `TEXT[]`, `INT[]`, `VARCHAR[]` -> `String[]`, `Int[]`
 * - Parses Constraints & Indexes:
 *   - Inline & table-level `PRIMARY KEY` (single `@id` and composite `@@id([a, b])`)
 *   - Inline & table-level `UNIQUE` (single `@unique` and composite `@@unique([a, b])`)
 *   - `@default(...)`: `now()`, `autoincrement()`, `uuid()`, boolean literals, numeric literals, string literals, and `@updatedAt`
 *   - Standalone `CREATE [UNIQUE] INDEX idx_name ON table (col1, col2)` and inline MySQL `INDEX`/`KEY` -> `@@index([col1, col2])`
 * - Infers Relations across tables:
 *   - `1:1` (One-to-One): when the foreign key column is marked `UNIQUE` (or is the `PRIMARY KEY`), generates an optional single relation field `profile Profile?` on the target model.
 *   - `1:n` (One-to-Many): when the foreign key column is not unique, generates a list relation field `posts Post[]` on the target model and `@relation(fields: [...], references: [...], onDelete: ...)` on the owning model.
 *   - `n:m` (Many-to-Many): recognizes pure join tables (composite primary key of 2 foreign keys) and annotates both models + join table relations cleanly.
 * - Configurable camelCase field naming with automatic `@map("snake_case")` and `@@map("table_name")`.
 */

import { singularize } from "./json-to-typescript";

export interface SqlToPrismaOptions {
  provider?: "postgresql" | "mysql" | "sqlite";
  useCamelCase?: boolean;
  includeGeneratorBlock?: boolean;
  includeNativeDbTypes?: boolean;
}

interface ParsedEnum {
  name: string;
  pascalName: string;
  values: string[];
}

interface ParsedForeignKey {
  column: string;
  targetTable: string;
  targetColumn: string;
  onDelete?: string;
  onUpdate?: string;
}

interface ParsedIndex {
  name?: string;
  columns: string[];
  isUnique: boolean;
}

interface ParsedColumn {
  rawName: string;
  fieldName: string;
  rawSqlType: string;
  prismaType: string;
  dbNativeAttr?: string;
  isList: boolean;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isAutoIncrement: boolean;
  isUpdatedAt: boolean;
  defaultAttr?: string;
}

interface ParsedTable {
  rawName: string;
  modelName: string;
  columns: ParsedColumn[];
  compositePrimaryKey: string[];
  foreignKeys: ParsedForeignKey[];
  indexes: ParsedIndex[];
}

function toPascalCase(str: string): string {
  const spaced = str.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  const cleaned = spaced.replace(/[^a-zA-Z0-9]/g, " ").trim();
  if (!cleaned) return "Model";
  return cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toPluralCamelCase(modelName: string): string {
  const camel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  if (camel.endsWith("y") && !/[aeiou]y$/i.test(camel)) {
    return camel.slice(0, -1) + "ies";
  }
  if (/(?:s|x|z|ch|sh)$/i.test(camel)) {
    return camel + "es";
  }
  return camel + "s";
}

function stripIdentifierQuotes(ident: string): string {
  const cleaned = ident.trim().replace(/^[`"'[]+|[`"'\]]+$/g, "");
  // Strip schema prefix like public.users -> users
  const dotIdx = cleaned.lastIndexOf(".");
  return dotIdx >= 0 ? cleaned.slice(dotIdx + 1).replace(/^[`"'[]+|[`"'\]]+$/g, "") : cleaned;
}

/**
 * Splits a comma-separated SQL block at top-level commas (ignoring commas inside parentheses or quotes).
 */
function splitTopLevelCommas(body: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inSingle) {
      current += ch;
      if (ch === "'" && body[i - 1] !== "\\") inSingle = false;
      continue;
    }
    if (inDouble) {
      current += ch;
      if (ch === '"' && body[i - 1] !== "\\") inDouble = false;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      current += ch;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      current += ch;
      continue;
    }
    if (ch === "(") {
      depth++;
      current += ch;
      continue;
    }
    if (ch === ")") {
      depth = Math.max(0, depth - 1);
      current += ch;
      continue;
    }
    if (ch === "," && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function mapReferentialAction(sqlAction: string): string | undefined {
  const upper = sqlAction.trim().toUpperCase();
  if (upper === "CASCADE") return "Cascade";
  if (upper === "RESTRICT") return "Restrict";
  if (upper === "NO ACTION") return "NoAction";
  if (upper === "SET NULL") return "SetNull";
  if (upper === "SET DEFAULT") return "SetDefault";
  return undefined;
}

export function convert(input: string, userOptions: SqlToPrismaOptions = {}): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Input SQL is empty.");
  }

  const options: Required<SqlToPrismaOptions> = {
    provider: userOptions.provider || "postgresql",
    useCamelCase:
      userOptions.useCamelCase !== undefined
        ? userOptions.useCamelCase === true || (userOptions.useCamelCase as any) === "true"
        : true,
    includeGeneratorBlock:
      userOptions.includeGeneratorBlock !== undefined
        ? userOptions.includeGeneratorBlock === true || (userOptions.includeGeneratorBlock as any) === "true"
        : false,
    includeNativeDbTypes:
      userOptions.includeNativeDbTypes !== undefined
        ? userOptions.includeNativeDbTypes === true || (userOptions.includeNativeDbTypes as any) === "true"
        : true,
  };

  // Strip SQL comments (-- line comments and /* block comments */)
  const cleanSql = trimmed
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/--[^\n]*/g, "");

  const enums = new Map<string, ParsedEnum>();
  const tables: ParsedTable[] = [];

  // 1. Parse PostgreSQL CREATE TYPE ... AS ENUM (...)
  const createEnumRegex = /CREATE\s+TYPE\s+([^\s(]+)\s+AS\s+ENUM\s*\(([^)]+)\)/gi;
  let enumMatch: RegExpExecArray | null;
  while ((enumMatch = createEnumRegex.exec(cleanSql)) !== null) {
    const rawEnumName = stripIdentifierQuotes(enumMatch[1]);
    const pascalName = toPascalCase(rawEnumName);
    const values = enumMatch[2]
      .split(",")
      .map((v) => v.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
    if (values.length > 0) {
      enums.set(rawEnumName.toLowerCase(), {
        name: rawEnumName,
        pascalName,
        values,
      });
    }
  }

  // 2. Parse CREATE TABLE statements with balanced parentheses
  const createTableHeaderRegex = /CREATE\s+(?:UNLOGGED\s+|TEMPORARY\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)\s*\(/gi;
  let headerMatch: RegExpExecArray | null;
  while ((headerMatch = createTableHeaderRegex.exec(cleanSql)) !== null) {
    const rawTableName = stripIdentifierQuotes(headerMatch[1]);
    const modelName = singularize(rawTableName);
    const openParenIdx = headerMatch.index + headerMatch[0].length - 1;

    let depth = 1;
    let cursor = openParenIdx + 1;
    let inSingle = false;
    while (cursor < cleanSql.length && depth > 0) {
      const ch = cleanSql[cursor];
      if (ch === "'" && cleanSql[cursor - 1] !== "\\") inSingle = !inSingle;
      else if (!inSingle) {
        if (ch === "(") depth++;
        else if (ch === ")") depth--;
      }
      cursor++;
    }

    if (depth !== 0) {
      throw new Error(`SQL Syntax Error: Unclosed parenthesis in CREATE TABLE ${rawTableName}.`);
    }

    const tableBody = cleanSql.slice(openParenIdx + 1, cursor - 1);
    const definitions = splitTopLevelCommas(tableBody);

    const columns: ParsedColumn[] = [];
    const compositePrimaryKey: string[] = [];
    const foreignKeys: ParsedForeignKey[] = [];
    const indexes: ParsedIndex[] = [];

    for (const def of definitions) {
      const normalizedDef = def.replace(/\s+/g, " ").trim();
      if (!normalizedDef) continue;

      // Check table-level PRIMARY KEY (col1, col2)
      const tablePkMatch = normalizedDef.match(
        /^(?:CONSTRAINT\s+[^\s]+\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i
      );
      if (tablePkMatch) {
        const pkCols = tablePkMatch[1]
          .split(",")
          .map((c) => stripIdentifierQuotes(c))
          .filter(Boolean);
        if (pkCols.length === 1) {
          const col = columns.find((c) => c.rawName.toLowerCase() === pkCols[0].toLowerCase());
          if (col) {
            col.isPrimaryKey = true;
            col.isNullable = false;
          }
        } else if (pkCols.length > 1) {
          compositePrimaryKey.push(...pkCols);
          for (const pkc of pkCols) {
            const col = columns.find((c) => c.rawName.toLowerCase() === pkc.toLowerCase());
            if (col) col.isNullable = false;
          }
        }
        continue;
      }

      // Check table-level FOREIGN KEY (col) REFERENCES target(tcol)
      const tableFkMatch = normalizedDef.match(
        /^(?:CONSTRAINT\s+[^\s]+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^\s(]+)\s*(?:\(([^)]+)\))?(.*)$/i
      );
      if (tableFkMatch) {
        const fkCol = stripIdentifierQuotes(tableFkMatch[1].split(",")[0]);
        const targetTable = stripIdentifierQuotes(tableFkMatch[2]);
        const targetCol = tableFkMatch[3] ? stripIdentifierQuotes(tableFkMatch[3].split(",")[0]) : "id";
        const tail = tableFkMatch[4] || "";
        const onDeleteMatch = tail.match(/ON\s+DELETE\s+(CASCADE|RESTRICT|NO\s+ACTION|SET\s+NULL|SET\s+DEFAULT)/i);
        const onUpdateMatch = tail.match(/ON\s+UPDATE\s+(CASCADE|RESTRICT|NO\s+ACTION|SET\s+NULL|SET\s+DEFAULT)/i);
        foreignKeys.push({
          column: fkCol,
          targetTable,
          targetColumn: targetCol,
          onDelete: onDeleteMatch ? mapReferentialAction(onDeleteMatch[1]) : undefined,
          onUpdate: onUpdateMatch ? mapReferentialAction(onUpdateMatch[1]) : undefined,
        });
        continue;
      }

      // Check table-level UNIQUE [INDEX|KEY] [name] (col1, col2)
      const tableUniqueMatch = normalizedDef.match(
        /^(?:CONSTRAINT\s+([^\s(]+)\s+)?UNIQUE(?:\s+(?:INDEX|KEY))?(?:\s+([^\s(]+))?\s*\(([^)]+)\)/i
      );
      if (tableUniqueMatch) {
        const idxName = tableUniqueMatch[1] || tableUniqueMatch[2];
        const uCols = tableUniqueMatch[3]
          .split(",")
          .map((c) => stripIdentifierQuotes(c))
          .filter(Boolean);
        if (uCols.length === 1) {
          const col = columns.find((c) => c.rawName.toLowerCase() === uCols[0].toLowerCase());
          if (col) col.isUnique = true;
        } else if (uCols.length > 1) {
          indexes.push({
            name: idxName ? stripIdentifierQuotes(idxName) : undefined,
            columns: uCols,
            isUnique: true,
          });
        }
        continue;
      }

      // Check MySQL inline INDEX / KEY name (col1, col2)
      const inlineIdxMatch = normalizedDef.match(
        /^(?:INDEX|KEY)\s+(?:([^\s(]+)\s*)?\(([^)]+)\)/i
      );
      if (inlineIdxMatch) {
        const idxName = inlineIdxMatch[1] ? stripIdentifierQuotes(inlineIdxMatch[1]) : undefined;
        const idxCols = inlineIdxMatch[2]
          .split(",")
          .map((c) => stripIdentifierQuotes(c.split(/\s+/)[0]))
          .filter(Boolean);
        if (idxCols.length > 0) {
          indexes.push({ name: idxName, columns: idxCols, isUnique: false });
        }
        continue;
      }

      // Skip CHECK constraints
      if (/^(?:CONSTRAINT\s+[^\s]+\s+)?CHECK\s*\(/i.test(normalizedDef)) {
        continue;
      }

      // Parse column definition
      const colMatch = normalizedDef.match(/^([`"'[]?[a-zA-Z0-9_]+[`"'\]]?)\s+(.+)$/);
      if (!colMatch) continue;

      const rawColName = stripIdentifierQuotes(colMatch[1]);
      const rest = colMatch[2];
      const fieldName = options.useCamelCase ? toCamelCase(rawColName) : rawColName;

      // Extract SQL data type token (including optional parentheses like VARCHAR(255) or DECIMAL(10,2) or ENUM('a','b') or array [])
      const typeMatch = rest.match(
        /^([a-zA-Z0-9_]+(?:\s+PRECISION|\s+VARYING|\s+WITHOUT\s+TIME\s+ZONE|\s+WITH\s+TIME\s+ZONE)?(?:\s*\([^)]*\))?(?:\s*\[\])?)/i
      );
      const rawSqlType = typeMatch ? typeMatch[1].trim() : rest.split(/\s+/)[0];
      const upperType = rawSqlType.toUpperCase();

      const isList = upperType.endsWith("[]");
      const baseType = isList ? upperType.slice(0, -2).trim() : upperType;

      let prismaType = "String";
      let dbNativeAttr: string | undefined;
      let isAutoIncrement =
        /\b(?:AUTO_INCREMENT|AUTOINCREMENT|IDENTITY)\b/i.test(rest) ||
        baseType === "SERIAL" ||
        baseType === "BIGSERIAL" ||
        baseType === "SMALLSERIAL";

      // Check MySQL inline ENUM('A', 'B')
      if (baseType.startsWith("ENUM(")) {
        const enumInner = rawSqlType.slice(rawSqlType.indexOf("(") + 1, rawSqlType.lastIndexOf(")"));
        const enumValues = enumInner
          .split(",")
          .map((v) => v.trim().replace(/^['"]|['"]$/g, ""))
          .filter(Boolean);
        const enumName = `${modelName}${toPascalCase(rawColName)}`;
        enums.set(enumName.toLowerCase(), {
          name: enumName,
          pascalName: enumName,
          values: enumValues,
        });
        prismaType = enumName;
      } else if (enums.has(baseType.toLowerCase())) {
        prismaType = enums.get(baseType.toLowerCase())!.pascalName;
      } else if (baseType === "BIGSERIAL" || baseType.startsWith("BIGINT") || baseType === "INT8") {
        prismaType = "BigInt";
      } else if (baseType === "TINYINT(1)" || baseType === "BOOLEAN" || baseType === "BOOL") {
        prismaType = "Boolean";
      } else if (
        baseType === "SERIAL" ||
        baseType === "SMALLSERIAL" ||
        baseType.startsWith("INT") ||
        baseType.startsWith("SMALLINT") ||
        baseType.startsWith("MEDIUMINT") ||
        baseType.startsWith("TINYINT")
      ) {
        prismaType = "Int";
      } else if (baseType.startsWith("DECIMAL") || baseType.startsWith("NUMERIC") || baseType === "MONEY") {
        prismaType = "Decimal";
        const decMatch = baseType.match(/\(([^)]+)\)/);
        if (decMatch && options.includeNativeDbTypes && options.provider !== "sqlite") {
          dbNativeAttr = `@db.Decimal(${decMatch[1]})`;
        }
      } else if (
        baseType.startsWith("FLOAT") ||
        baseType.startsWith("DOUBLE") ||
        baseType === "REAL"
      ) {
        prismaType = "Float";
      } else if (
        baseType.startsWith("TIMESTAMP") ||
        baseType.startsWith("DATETIME") ||
        baseType === "DATE" ||
        baseType.startsWith("TIME")
      ) {
        prismaType = "DateTime";
        if (baseType === "DATE" && options.includeNativeDbTypes && options.provider !== "sqlite") {
          dbNativeAttr = "@db.Date";
        }
      } else if (baseType === "JSON" || baseType === "JSONB") {
        prismaType = "Json";
      } else if (baseType === "BYTEA" || baseType.includes("BLOB") || baseType.startsWith("BINARY")) {
        prismaType = "Bytes";
      } else if (baseType === "UUID") {
        prismaType = "String";
        if (options.includeNativeDbTypes && options.provider === "postgresql") {
          dbNativeAttr = "@db.Uuid";
        }
      } else {
        prismaType = "String";
        const varcharMatch = baseType.match(/^(?:VARCHAR|CHARACTER\s+VARYING)\s*\((\d+)\)/i);
        if (varcharMatch && options.includeNativeDbTypes && options.provider !== "sqlite") {
          dbNativeAttr = `@db.VarChar(${varcharMatch[1]})`;
        } else if (baseType === "TEXT" && options.includeNativeDbTypes && options.provider !== "sqlite") {
          dbNativeAttr = "@db.Text";
        }
      }

      const isPrimaryKey = /\bPRIMARY\s+KEY\b/i.test(rest);
      const isUnique = /\bUNIQUE\b/i.test(rest);
      const isNotNull = /\bNOT\s+NULL\b/i.test(rest) || isPrimaryKey || isAutoIncrement;
      const isNullable = !isNotNull && !isList;
      const isUpdatedAt =
        prismaType === "DateTime" &&
        (/^updated_?at$/i.test(rawColName) || /\bON\s+UPDATE\s+CURRENT_TIMESTAMP\b/i.test(rest));

      // Parse inline REFERENCES target(col)
      const inlineRefMatch = rest.match(
        /\bREFERENCES\s+([^\s(]+)\s*(?:\(([^)]+)\))?(.*)$/i
      );
      if (inlineRefMatch) {
        const targetTable = stripIdentifierQuotes(inlineRefMatch[1]);
        const targetCol = inlineRefMatch[2]
          ? stripIdentifierQuotes(inlineRefMatch[2].split(",")[0])
          : "id";
        const tail = inlineRefMatch[3] || "";
        const onDeleteMatch = tail.match(
          /ON\s+DELETE\s+(CASCADE|RESTRICT|NO\s+ACTION|SET\s+NULL|SET\s+DEFAULT)/i
        );
        const onUpdateMatch = tail.match(
          /ON\s+UPDATE\s+(CASCADE|RESTRICT|NO\s+ACTION|SET\s+NULL|SET\s+DEFAULT)/i
        );
        foreignKeys.push({
          column: rawColName,
          targetTable,
          targetColumn: targetCol,
          onDelete: onDeleteMatch ? mapReferentialAction(onDeleteMatch[1]) : undefined,
          onUpdate: onUpdateMatch ? mapReferentialAction(onUpdateMatch[1]) : undefined,
        });
      }

      // Parse DEFAULT value
      let defaultAttr: string | undefined;
      if (isAutoIncrement) {
        defaultAttr = "@default(autoincrement())";
      } else {
        const defMatch = rest.match(
          /\bDEFAULT\s+(\([^)]+\)|'[^']*'|"[^"]*"|[a-zA-Z0-9_().+-]+)/i
        );
        if (defMatch) {
          const rawDef = defMatch[1].trim();
          const upperDef = rawDef.toUpperCase();
          if (upperDef === "NULL") {
            // Do not emit @default(null) in Prisma
          } else if (
            upperDef.includes("CURRENT_TIMESTAMP") ||
            upperDef.startsWith("NOW(") ||
            upperDef.includes("SYSDATE")
          ) {
            defaultAttr = "@default(now())";
          } else if (
            upperDef.includes("GEN_RANDOM_UUID") ||
            upperDef.includes("UUID_GENERATE_V4") ||
            upperDef === "UUID()"
          ) {
            defaultAttr = "@default(uuid())";
          } else if (prismaType === "Boolean") {
            defaultAttr =
              upperDef === "TRUE" || rawDef === "1" || rawDef === "'1'"
                ? "@default(true)"
                : "@default(false)";
          } else if (
            (prismaType === "Int" || prismaType === "BigInt" || prismaType === "Float" || prismaType === "Decimal") &&
            /^-?\d+(\.\d+)?$/.test(rawDef)
          ) {
            defaultAttr = `@default(${rawDef})`;
          } else if (
            enums.has(prismaType.toLowerCase()) ||
            Array.from(enums.values()).some((e) => e.pascalName === prismaType)
          ) {
            const cleanEnumVal = rawDef.replace(/^['"]|['"]$/g, "").replace(/::[a-zA-Z0-9_]+$/, "");
            defaultAttr = `@default(${cleanEnumVal})`;
          } else {
            const cleanStr = rawDef.replace(/^['"]|['"]$/g, "");
            defaultAttr = `@default(${JSON.stringify(cleanStr)})`;
          }
        }
      }

      columns.push({
        rawName: rawColName,
        fieldName,
        rawSqlType,
        prismaType,
        dbNativeAttr,
        isList,
        isNullable,
        isPrimaryKey,
        isUnique,
        isAutoIncrement,
        isUpdatedAt,
        defaultAttr,
      });
    }

    tables.push({
      rawName: rawTableName,
      modelName,
      columns,
      compositePrimaryKey,
      foreignKeys,
      indexes,
    });
  }

  if (tables.length === 0 && enums.size === 0) {
    throw new Error("No valid CREATE TABLE or CREATE TYPE AS ENUM statements found in input SQL.");
  }

  // 3. Parse standalone CREATE [UNIQUE] INDEX idx_name ON table (col1, col2)
  const createIndexRegex =
    /CREATE\s+(UNIQUE\s+)?INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+NOT\s+EXISTS\s+)?([^\s]+)\s+ON\s+([^\s(]+)(?:\s+USING\s+[a-zA-Z0-9_]+)?\s*\(([^)]+)\)/gi;
  let idxMatch: RegExpExecArray | null;
  while ((idxMatch = createIndexRegex.exec(cleanSql)) !== null) {
    const isUnique = Boolean(idxMatch[1]);
    const idxName = stripIdentifierQuotes(idxMatch[2]);
    const targetTableName = stripIdentifierQuotes(idxMatch[3]);
    const cols = idxMatch[4]
      .split(",")
      .map((c) => stripIdentifierQuotes(c.trim().split(/\s+/)[0]))
      .filter(Boolean);

    const targetTable = tables.find(
      (t) => t.rawName.toLowerCase() === targetTableName.toLowerCase()
    );
    if (targetTable && cols.length > 0) {
      targetTable.indexes.push({
        name: idxName,
        columns: cols,
        isUnique,
      });
    }
  }

  // 4. Resolve cross-table relations (1:1, 1:n, n:m)
  const tableByLowerName = new Map<string, ParsedTable>();
  for (const t of tables) {
    tableByLowerName.set(t.rawName.toLowerCase(), t);
  }

  const extraRelationLines = new Map<string, string[]>();
  for (const t of tables) {
    extraRelationLines.set(t.modelName, []);
  }

  for (const sourceTable of tables) {
    for (const fk of sourceTable.foreignKeys) {
      const fkCol = sourceTable.columns.find(
        (c) => c.rawName.toLowerCase() === fk.column.toLowerCase()
      );
      if (!fkCol) continue;

      const targetTable =
        tableByLowerName.get(fk.targetTable.toLowerCase()) ||
        tables.find(
          (t) => t.modelName.toLowerCase() === singularize(fk.targetTable).toLowerCase()
        );

      const targetModelName = targetTable ? targetTable.modelName : singularize(fk.targetTable);
      const targetColObj = targetTable?.columns.find(
        (c) => c.rawName.toLowerCase() === fk.targetColumn.toLowerCase()
      );
      const targetFieldName = targetColObj
        ? targetColObj.fieldName
        : options.useCamelCase
        ? toCamelCase(fk.targetColumn)
        : fk.targetColumn;

      // Determine relation field name on source model (strip trailing _id / Id)
      const baseRelName = fk.column.replace(/_?id$/i, "") || targetModelName;
      let sourceRelFieldName = toCamelCase(baseRelName);
      if (sourceRelFieldName === fkCol.fieldName) {
        sourceRelFieldName = toCamelCase(targetModelName);
      }

      const relOptSign = fkCol.isNullable ? "?" : "";
      const relArgs: string[] = [
        `fields: [${fkCol.fieldName}]`,
        `references: [${targetFieldName}]`,
      ];
      if (fk.onDelete) relArgs.push(`onDelete: ${fk.onDelete}`);
      if (fk.onUpdate) relArgs.push(`onUpdate: ${fk.onUpdate}`);

      extraRelationLines
        .get(sourceTable.modelName)!
        .push(`  ${sourceRelFieldName} ${targetModelName}${relOptSign} @relation(${relArgs.join(", ")})`);

      // Add inverse relation field on targetTable if targetTable is in the parsed SQL
      if (targetTable) {
        const isOneToOne =
          fkCol.isUnique ||
          (fkCol.isPrimaryKey && sourceTable.compositePrimaryKey.length === 0);

        if (isOneToOne) {
          // 1:1 relation
          const invName = toCamelCase(sourceTable.modelName);
          extraRelationLines
            .get(targetTable.modelName)!
            .push(`  ${invName} ${sourceTable.modelName}?`);
        } else {
          // 1:n relation (also works for explicit n:m join tables)
          const invPluralName = toPluralCamelCase(sourceTable.modelName);
          extraRelationLines
            .get(targetTable.modelName)!
            .push(`  ${invPluralName} ${sourceTable.modelName}[]`);
        }
      }
    }
  }

  // 5. Render Prisma Schema Output
  const blocks: string[] = [];

  if (options.includeGeneratorBlock) {
    blocks.push(
      `generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "${options.provider}"\n  url      = env("DATABASE_URL")\n}`
    );
  }

  // Render Enums
  for (const parsedEnum of enums.values()) {
    const enumBody = parsedEnum.values.map((v) => `  ${v}`).join("\n");
    blocks.push(`enum ${parsedEnum.pascalName} {\n${enumBody}\n}`);
  }

  // Render Models
  for (const table of tables) {
    const modelLines: string[] = [];

    for (const col of table.columns) {
      const typeSuffix = col.isList ? "[]" : col.isNullable ? "?" : "";
      const attrs: string[] = [];

      if (col.isPrimaryKey && table.compositePrimaryKey.length === 0) {
        attrs.push("@id");
      }
      if (col.isUnique && !col.isPrimaryKey) {
        attrs.push("@unique");
      }
      if (col.isUpdatedAt) {
        attrs.push("@updatedAt");
      } else if (col.defaultAttr) {
        attrs.push(col.defaultAttr);
      }
      if (col.dbNativeAttr) {
        attrs.push(col.dbNativeAttr);
      }
      if (options.useCamelCase && col.fieldName !== col.rawName) {
        attrs.push(`@map("${col.rawName}")`);
      }

      const attrStr = attrs.length > 0 ? " " + attrs.join(" ") : "";
      modelLines.push(`  ${col.fieldName} ${col.prismaType}${typeSuffix}${attrStr}`);
    }

    // Append relation fields
    const relLines = extraRelationLines.get(table.modelName) || [];
    if (relLines.length > 0) {
      modelLines.push(...relLines);
    }

    // Append model-level attributes (@@id, @@unique, @@index, @@map)
    const modelLevelAttrs: string[] = [];

    if (table.compositePrimaryKey.length > 1) {
      const mappedPkCols = table.compositePrimaryKey.map((rawCol) => {
        const found = table.columns.find((c) => c.rawName.toLowerCase() === rawCol.toLowerCase());
        return found ? found.fieldName : options.useCamelCase ? toCamelCase(rawCol) : rawCol;
      });
      modelLevelAttrs.push(`  @@id([${mappedPkCols.join(", ")}])`);
    }

    for (const idx of table.indexes) {
      const mappedCols = idx.columns.map((rawCol) => {
        const found = table.columns.find((c) => c.rawName.toLowerCase() === rawCol.toLowerCase());
        return found ? found.fieldName : options.useCamelCase ? toCamelCase(rawCol) : rawCol;
      });
      const mapArg = idx.name ? `, map: "${idx.name}"` : "";
      if (idx.isUnique) {
        modelLevelAttrs.push(`  @@unique([${mappedCols.join(", ")}]${mapArg})`);
      } else {
        modelLevelAttrs.push(`  @@index([${mappedCols.join(", ")}]${mapArg})`);
      }
    }

    if (table.rawName !== table.modelName) {
      modelLevelAttrs.push(`  @@map("${table.rawName}")`);
    }

    if (modelLevelAttrs.length > 0) {
      modelLines.push("");
      modelLines.push(...modelLevelAttrs);
    }

    blocks.push(`model ${table.modelName} {\n${modelLines.join("\n")}\n}`);
  }

  return blocks.join("\n\n") + "\n";
}
