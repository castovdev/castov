export interface SqlToDrizzleOptions {
  dialect?: "postgresql" | "mysql" | "sqlite";
  useCamelCase?: boolean | "true" | "false";
  includeRelations?: boolean;
  includeInferTypes?: boolean;
}

export interface ParsedSqlColumn {
  name: string;
  rawType: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
  isAutoIncrement: boolean;
  defaultValue?: string;
  references?: {
    table: string;
    column: string;
    onDelete?: string;
    onUpdate?: string;
  };
}

export interface ParsedSqlIndex {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface ParsedSqlTable {
  name: string;
  columns: ParsedSqlColumn[];
  primaryKeyColumns: string[];
  uniqueConstraints: string[][];
  indexes: ParsedSqlIndex[];
}

export interface ParsedSqlEnum {
  name: string;
  values: string[];
}

function stripIdentifierQuotes(ident: string): string {
  const cleaned = ident.trim().replace(/^[`"'[]+|[`"'\]]+$/g, "");
  const dotIdx = cleaned.lastIndexOf(".");
  return dotIdx >= 0 ? cleaned.slice(dotIdx + 1).replace(/^[`"'[]+|[`"'\]]+$/g, "") : cleaned;
}

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
      if (ch === "'" && body[i + 1] === "'") {
        current += body[++i];
      } else if (ch === "'" && body[i - 1] !== "\\") {
        inSingle = false;
      }
      continue;
    }
    if (inDouble) {
      current += ch;
      if (ch === '"' && body[i - 1] !== "\\") {
        inDouble = false;
      }
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      current += ch;
    } else if (ch === '"') {
      inDouble = true;
      current += ch;
    } else if (ch === "(") {
      depth++;
      current += ch;
    } else if (ch === ")") {
      depth = Math.max(0, depth - 1);
      current += ch;
    } else if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) {
    parts.push(current.trim());
  }
  return parts;
}

export function parseSqlDdl(rawSql: string): {
  enums: ParsedSqlEnum[];
  tables: ParsedSqlTable[];
} {
  const cleanSql = rawSql
    .replace(/--[^\r\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  const enums: ParsedSqlEnum[] = [];
  const tables: ParsedSqlTable[] = [];

  // 1. Parse CREATE TYPE ... AS ENUM (...)
  const enumRegex =
    /CREATE\s+TYPE\s+([^\s]+)\s+AS\s+ENUM\s*\(([^)]+)\)/gi;
  let enumMatch: RegExpExecArray | null;
  while ((enumMatch = enumRegex.exec(cleanSql)) !== null) {
    const rawName = stripIdentifierQuotes(enumMatch[1]);
    const values = enumMatch[2]
      .split(",")
      .map((v: string) => v.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
    if (values.length > 0) {
      enums.push({ name: rawName, values });
    }
  }

  // 2. Parse CREATE TABLE blocks using balanced parenthesis scanning
  const tableHeaderRegex =
    /CREATE\s+(?:UNLOGGED\s+|TEMPORARY\s+|TEMP\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)\s*\(/gi;
  let thMatch: RegExpExecArray | null;
  while ((thMatch = tableHeaderRegex.exec(cleanSql)) !== null) {
    const tableName = stripIdentifierQuotes(thMatch[1]);
    const openParenIdx = thMatch.index + thMatch[0].length - 1;
    let depth = 1;
    let i = openParenIdx + 1;
    let inSingle = false;
    while (i < cleanSql.length && depth > 0) {
      const ch = cleanSql[i];
      if (inSingle) {
        if (ch === "'" && cleanSql[i + 1] === "'") {
          i++;
        } else if (ch === "'" && cleanSql[i - 1] !== "\\") {
          inSingle = false;
        }
      } else if (ch === "'") {
        inSingle = true;
      } else if (ch === "(") {
        depth++;
      } else if (ch === ")") {
        depth--;
      }
      i++;
    }
    const bodyStr = cleanSql.slice(openParenIdx + 1, i - 1);
    const defs = splitTopLevelCommas(bodyStr);

    const columns: ParsedSqlColumn[] = [];
    const primaryKeyColumns: string[] = [];
    const uniqueConstraints: string[][] = [];
    const indexes: ParsedSqlIndex[] = [];

    for (const def of defs) {
      const normalized = def.replace(/\s+/g, " ").trim();
      if (!normalized) continue;

      // Table-level PRIMARY KEY (col1, col2)
      const pkMatch = normalized.match(
        /^(?:CONSTRAINT\s+[^\s]+\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i
      );
      if (pkMatch) {
        const pkCols = pkMatch[1]
          .split(",")
          .map((c: string) => stripIdentifierQuotes(c))
          .filter(Boolean);
        for (const pkCol of pkCols) {
          if (!primaryKeyColumns.includes(pkCol)) {
            primaryKeyColumns.push(pkCol);
          }
          const existing = columns.find((c) => c.name.toLowerCase() === pkCol.toLowerCase());
          if (existing && pkCols.length === 1) {
            existing.isPrimaryKey = true;
            existing.isNullable = false;
          }
        }
        continue;
      }

      // Table-level FOREIGN KEY (col) REFERENCES target(tcol)
      const fkMatch = normalized.match(
        /^(?:CONSTRAINT\s+[^\s]+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^\s(]+)\s*(?:\(([^)]+)\))?(.*)$/i
      );
      if (fkMatch) {
        const localCol = stripIdentifierQuotes(fkMatch[1].split(",")[0]);
        const targetTable = stripIdentifierQuotes(fkMatch[2]);
        const targetCol = fkMatch[3] ? stripIdentifierQuotes(fkMatch[3].split(",")[0]) : "id";
        const tail = fkMatch[4] || "";
        const onDeleteMatch = tail.match(/ON\s+DELETE\s+(CASCADE|RESTRICT|NO\s+ACTION|SET\s+NULL|SET\s+DEFAULT)/i);
        const onUpdateMatch = tail.match(/ON\s+UPDATE\s+(CASCADE|RESTRICT|NO\s+ACTION|SET\s+NULL|SET\s+DEFAULT)/i);
        const colObj = columns.find((c) => c.name.toLowerCase() === localCol.toLowerCase());
        if (colObj) {
          colObj.references = {
            table: targetTable,
            column: targetCol,
            onDelete: onDeleteMatch ? onDeleteMatch[1].toLowerCase() : undefined,
            onUpdate: onUpdateMatch ? onUpdateMatch[1].toLowerCase() : undefined,
          };
        }
        continue;
      }

      // Table-level UNIQUE (col1, col2)
      const uqMatch = normalized.match(
        /^(?:CONSTRAINT\s+[^\s]+\s+)?UNIQUE(?:\s+KEY|\s+INDEX)?(?:\s+[^\s(]+)?\s*\(([^)]+)\)/i
      );
      if (uqMatch) {
        const uCols = uqMatch[1]
          .split(",")
          .map((c: string) => stripIdentifierQuotes(c.split(/\s+/)[0]))
          .filter(Boolean);
        if (uCols.length === 1) {
          const colObj = columns.find((c) => c.name.toLowerCase() === uCols[0].toLowerCase());
          if (colObj) colObj.isUnique = true;
        } else if (uCols.length > 1) {
          uniqueConstraints.push(uCols);
        }
        continue;
      }

      // Skip CHECK or inline INDEX
      if (/^(?:CONSTRAINT\s+[^\s]+\s+)?CHECK\s*\(/i.test(normalized)) {
        continue;
      }
      if (/^(?:INDEX|KEY)\s+/i.test(normalized)) {
        continue;
      }

      // Column definition
      const colMatch = normalized.match(/^([`"'[]?[a-zA-Z0-9_]+[`"'\]]?)\s+(.+)$/);
      if (!colMatch) continue;

      const colName = stripIdentifierQuotes(colMatch[1]);
      const rest = colMatch[2];
      const typeMatch = rest.match(
        /^([a-zA-Z0-9_]+(?:\s+PRECISION|\s+VARYING|\s+WITHOUT\s+TIME\s+ZONE|\s+WITH\s+TIME\s+ZONE)?(?:\s*\([^)]*\))?)/i
      );
      const rawType = typeMatch ? typeMatch[1].trim() : rest.split(/\s+/)[0];

      const isPrimaryKey = /\bPRIMARY\s+KEY\b/i.test(rest);
      if (isPrimaryKey && !primaryKeyColumns.includes(colName)) {
        primaryKeyColumns.push(colName);
      }
      const isAutoIncrement =
        /\b(?:AUTO_INCREMENT|AUTOINCREMENT|IDENTITY)\b/i.test(rest) ||
        /\bSERIAL\b/i.test(rawType);
      const isUnique = /\bUNIQUE\b/i.test(rest);
      const isNotNull = /\bNOT\s+NULL\b/i.test(rest) || isPrimaryKey || isAutoIncrement;

      let defaultValue: string | undefined;
      const defMatch = rest.match(
        /\bDEFAULT\s+(\([^)]+\)|'[^']*'|"[^"]*"|[a-zA-Z0-9_().+-]+)/i
      );
      if (defMatch && defMatch[1].toUpperCase() !== "NULL") {
        defaultValue = defMatch[1].trim();
      }

      let references: ParsedSqlColumn["references"];
      const refMatch = rest.match(
        /\bREFERENCES\s+([^\s(]+)\s*(?:\(([^)]+)\))?(.*)$/i
      );
      if (refMatch) {
        const targetTable = stripIdentifierQuotes(refMatch[1]);
        const targetCol = refMatch[2]
          ? stripIdentifierQuotes(refMatch[2].split(",")[0])
          : "id";
        const tail = refMatch[3] || "";
        const onDeleteMatch = tail.match(
          /ON\s+DELETE\s+(CASCADE|RESTRICT|NO\s+ACTION|SET\s+NULL|SET\s+DEFAULT)/i
        );
        const onUpdateMatch = tail.match(
          /ON\s+UPDATE\s+(CASCADE|RESTRICT|NO\s+ACTION|SET\s+NULL|SET\s+DEFAULT)/i
        );
        references = {
          table: targetTable,
          column: targetCol,
          onDelete: onDeleteMatch ? onDeleteMatch[1].toLowerCase() : undefined,
          onUpdate: onUpdateMatch ? onUpdateMatch[1].toLowerCase() : undefined,
        };
      }

      columns.push({
        name: colName,
        rawType,
        isPrimaryKey,
        isNullable: !isNotNull,
        isUnique,
        isAutoIncrement,
        defaultValue,
        references,
      });
    }

    tables.push({
      name: tableName,
      columns,
      primaryKeyColumns,
      uniqueConstraints,
      indexes,
    });
  }

  // 3. Parse standalone CREATE [UNIQUE] INDEX statements
  const createIndexRegex =
    /CREATE\s+(UNIQUE\s+)?INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+NOT\s+EXISTS\s+)?([^\s]+)\s+ON\s+([^\s(]+)(?:\s+USING\s+[a-zA-Z0-9_]+)?\s*\(([^)]+)\)/gi;
  let idxMatch: RegExpExecArray | null;
  while ((idxMatch = createIndexRegex.exec(cleanSql)) !== null) {
    const unique = Boolean(idxMatch[1]);
    const idxName = stripIdentifierQuotes(idxMatch[2]);
    const targetTableName = stripIdentifierQuotes(idxMatch[3]);
    const cols = idxMatch[4]
      .split(",")
      .map((c: string) => stripIdentifierQuotes(c.trim().split(/\s+/)[0]))
      .filter(Boolean);
    const targetTable = tables.find(
      (t) => t.name.toLowerCase() === targetTableName.toLowerCase()
    );
    if (targetTable && cols.length > 0) {
      targetTable.indexes.push({
        name: idxName,
        columns: cols,
        unique,
      });
    }
  }

  return { enums, tables };
}

function toCamelCase(str: string): string {
  const cleaned = str.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
  if (!cleaned) return "field";
  const parts = cleaned.split(/[^a-zA-Z0-9]+/);
  return parts
    .map((p: string, idx: number) => {
      if (idx === 0) return p.charAt(0).toLowerCase() + p.slice(1);
      return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    })
    .join("");
}

function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function singularize(word: string): string {
  const lower = word.toLowerCase();
  const irregulars: Record<string, string> = {
    children: "child",
    people: "person",
    men: "man",
    women: "woman",
    data: "data",
    series: "series",
    species: "species",
    status: "status",
    statuses: "status",
    addresses: "address",
    categories: "category",
    companies: "company",
    entries: "entry",
    histories: "history",
    policies: "policy",
  };
  if (irregulars[lower]) {
    const target = irregulars[lower];
    return word[0] === word[0].toUpperCase()
      ? target.charAt(0).toUpperCase() + target.slice(1)
      : target;
  }
  if (lower.endsWith("ies") && word.length > 3) {
    return word.slice(0, -3) + "y";
  }
  if (
    lower.endsWith("ses") ||
    lower.endsWith("xes") ||
    lower.endsWith("zes") ||
    lower.endsWith("ches") ||
    lower.endsWith("shes")
  ) {
    return word.slice(0, -2);
  }
  if (
    lower.endsWith("s") &&
    !lower.endsWith("ss") &&
    !lower.endsWith("us") &&
    !lower.endsWith("is") &&
    word.length > 2
  ) {
    return word.slice(0, -1);
  }
  return word;
}

interface DrizzleColumnMap {
  builderCode: string;
  importSymbol: string;
}

function mapColumnToDrizzle(
  col: ParsedSqlColumn,
  dialect: "postgresql" | "mysql" | "sqlite",
  enumVarMap: Map<string, string>
): DrizzleColumnMap {
  const rawUpper = col.rawType.toUpperCase().trim();
  const baseUpper = rawUpper.replace(/\(.*\)/, "").replace(/\s+UNSIGNED/i, "").trim();
  const argsMatch = col.rawType.match(/\(([^)]+)\)/);
  const argsStr = argsMatch ? argsMatch[1].trim() : "";
  const colNameLit = JSON.stringify(col.name);

  if (enumVarMap.has(col.rawType.toLowerCase())) {
    const enumVar = enumVarMap.get(col.rawType.toLowerCase())!;
    if (dialect === "postgresql") {
      return {
        builderCode: `${enumVar}(${colNameLit})`,
        importSymbol: "pgEnum",
      };
    }
  }

  if (dialect === "postgresql") {
    if (baseUpper === "SERIAL" || baseUpper === "SMALLSERIAL") {
      return { builderCode: `serial(${colNameLit})`, importSymbol: "serial" };
    }
    if (baseUpper === "BIGSERIAL") {
      return { builderCode: `bigserial(${colNameLit}, { mode: "number" })`, importSymbol: "bigserial" };
    }
    if (baseUpper === "UUID") {
      return { builderCode: `uuid(${colNameLit})`, importSymbol: "uuid" };
    }
    if (baseUpper === "VARCHAR" || baseUpper === "CHARACTER VARYING") {
      const len = parseInt(argsStr, 10);
      return {
        builderCode: !isNaN(len) ? `varchar(${colNameLit}, { length: ${len} })` : `varchar(${colNameLit})`,
        importSymbol: "varchar",
      };
    }
    if (baseUpper === "CHAR" || baseUpper === "CHARACTER") {
      const len = parseInt(argsStr, 10);
      return {
        builderCode: !isNaN(len) ? `char(${colNameLit}, { length: ${len} })` : `char(${colNameLit})`,
        importSymbol: "char",
      };
    }
    if (baseUpper === "TEXT") {
      return { builderCode: `text(${colNameLit})`, importSymbol: "text" };
    }
    if (baseUpper === "INT" || baseUpper === "INTEGER" || baseUpper === "INT4") {
      return { builderCode: `integer(${colNameLit})`, importSymbol: "integer" };
    }
    if (baseUpper === "SMALLINT" || baseUpper === "INT2") {
      return { builderCode: `smallint(${colNameLit})`, importSymbol: "smallint" };
    }
    if (baseUpper === "BIGINT" || baseUpper === "INT8") {
      return { builderCode: `bigint(${colNameLit}, { mode: "number" })`, importSymbol: "bigint" };
    }
    if (baseUpper === "DECIMAL" || baseUpper === "NUMERIC") {
      if (argsStr.includes(",")) {
        const [p, s] = argsStr.split(",").map((x: string) => parseInt(x.trim(), 10));
        return {
          builderCode: `numeric(${colNameLit}, { precision: ${p}, scale: ${s} })`,
          importSymbol: "numeric",
        };
      }
      return { builderCode: `numeric(${colNameLit})`, importSymbol: "numeric" };
    }
    if (baseUpper === "REAL" || baseUpper === "FLOAT4") {
      return { builderCode: `real(${colNameLit})`, importSymbol: "real" };
    }
    if (baseUpper === "DOUBLE PRECISION" || baseUpper === "FLOAT8" || baseUpper === "FLOAT") {
      return { builderCode: `doublePrecision(${colNameLit})`, importSymbol: "doublePrecision" };
    }
    if (baseUpper === "BOOLEAN" || baseUpper === "BOOL") {
      return { builderCode: `boolean(${colNameLit})`, importSymbol: "boolean" };
    }
    if (baseUpper === "JSONB") {
      return { builderCode: `jsonb(${colNameLit})`, importSymbol: "jsonb" };
    }
    if (baseUpper === "JSON") {
      return { builderCode: `json(${colNameLit})`, importSymbol: "json" };
    }
    if (baseUpper === "TIMESTAMPTZ" || baseUpper === "TIMESTAMP WITH TIME ZONE") {
      return {
        builderCode: `timestamp(${colNameLit}, { withTimezone: true })`,
        importSymbol: "timestamp",
      };
    }
    if (baseUpper.startsWith("TIMESTAMP")) {
      return { builderCode: `timestamp(${colNameLit})`, importSymbol: "timestamp" };
    }
    if (baseUpper === "DATE") {
      return { builderCode: `date(${colNameLit})`, importSymbol: "date" };
    }
    return { builderCode: `text(${colNameLit})`, importSymbol: "text" };
  }

  if (dialect === "mysql") {
    if (baseUpper === "SERIAL") {
      return { builderCode: `serial(${colNameLit})`, importSymbol: "serial" };
    }
    if (baseUpper === "VARCHAR" || baseUpper === "UUID") {
      const len = parseInt(argsStr, 10) || (baseUpper === "UUID" ? 36 : 255);
      return {
        builderCode: `varchar(${colNameLit}, { length: ${len} })`,
        importSymbol: "varchar",
      };
    }
    if (baseUpper === "TEXT" || baseUpper === "LONGTEXT" || baseUpper === "MEDIUMTEXT") {
      return { builderCode: `text(${colNameLit})`, importSymbol: "text" };
    }
    if (baseUpper === "INT" || baseUpper === "INTEGER") {
      return { builderCode: `int(${colNameLit})`, importSymbol: "int" };
    }
    if (baseUpper === "BIGINT") {
      return { builderCode: `bigint(${colNameLit}, { mode: "number" })`, importSymbol: "bigint" };
    }
    if (baseUpper === "DECIMAL" || baseUpper === "NUMERIC") {
      if (argsStr.includes(",")) {
        const [p, s] = argsStr.split(",").map((x: string) => parseInt(x.trim(), 10));
        return {
          builderCode: `decimal(${colNameLit}, { precision: ${p}, scale: ${s} })`,
          importSymbol: "decimal",
        };
      }
      return { builderCode: `decimal(${colNameLit})`, importSymbol: "decimal" };
    }
    if (baseUpper === "BOOLEAN" || baseUpper === "BOOL" || rawUpper === "TINYINT(1)") {
      return { builderCode: `boolean(${colNameLit})`, importSymbol: "boolean" };
    }
    if (baseUpper === "JSON" || baseUpper === "JSONB") {
      return { builderCode: `json(${colNameLit})`, importSymbol: "json" };
    }
    if (baseUpper.startsWith("TIMESTAMP") || baseUpper === "DATETIME") {
      return { builderCode: `timestamp(${colNameLit})`, importSymbol: "timestamp" };
    }
    return { builderCode: `text(${colNameLit})`, importSymbol: "text" };
  }

  // SQLite
  if (
    baseUpper.includes("INT") ||
    baseUpper === "SERIAL" ||
    baseUpper === "BIGSERIAL"
  ) {
    return { builderCode: `integer(${colNameLit})`, importSymbol: "integer" };
  }
  if (baseUpper === "BOOLEAN" || baseUpper === "BOOL") {
    return {
      builderCode: `integer(${colNameLit}, { mode: "boolean" })`,
      importSymbol: "integer",
    };
  }
  if (baseUpper.startsWith("TIMESTAMP") || baseUpper === "DATETIME") {
    return {
      builderCode: `integer(${colNameLit}, { mode: "timestamp" })`,
      importSymbol: "integer",
    };
  }
  if (
    baseUpper === "REAL" ||
    baseUpper === "FLOAT" ||
    baseUpper === "DOUBLE PRECISION" ||
    baseUpper === "DECIMAL" ||
    baseUpper === "NUMERIC"
  ) {
    return { builderCode: `real(${colNameLit})`, importSymbol: "real" };
  }
  if (baseUpper === "JSON" || baseUpper === "JSONB") {
    return {
      builderCode: `text(${colNameLit}, { mode: "json" })`,
      importSymbol: "text",
    };
  }
  return { builderCode: `text(${colNameLit})`, importSymbol: "text" };
}

export function convert(input: string, options?: SqlToDrizzleOptions): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Input SQL is empty. Provide at least one CREATE TABLE statement.");
  }

  const dialect = options?.dialect ?? "postgresql";
  const useCamel = options?.useCamelCase === undefined ? true : String(options.useCamelCase) === "true";
  const includeRelations = options?.includeRelations ?? true;
  const includeInferTypes = options?.includeInferTypes ?? true;

  const parsed = parseSqlDdl(trimmed);
  if (parsed.tables.length === 0) {
    throw new Error(
      "No valid CREATE TABLE statements found. Please provide standard SQL DDL (e.g., CREATE TABLE users (...);)."
    );
  }

  const tableFunc =
    dialect === "mysql" ? "mysqlTable" : dialect === "sqlite" ? "sqliteTable" : "pgTable";
  const corePackage =
    dialect === "mysql"
      ? "drizzle-orm/mysql-core"
      : dialect === "sqlite"
        ? "drizzle-orm/sqlite-core"
        : "drizzle-orm/pg-core";

  const coreImports = new Set<string>([tableFunc]);
  let needsRelationsImport = false;

  const enumVarMap = new Map<string, string>();
  const enumBlocks: string[] = [];

  for (const e of parsed.enums) {
    const varName = `${toCamelCase(e.name)}Enum`;
    enumVarMap.set(e.name.toLowerCase(), varName);
    if (dialect === "postgresql") {
      coreImports.add("pgEnum");
      const vals = e.values.map((v: string) => JSON.stringify(v)).join(", ");
      enumBlocks.push(`export const ${varName} = pgEnum(${JSON.stringify(e.name)}, [${vals}]);`);
    }
  }

  const tableVarNameMap = new Map<string, string>();
  for (const t of parsed.tables) {
    tableVarNameMap.set(t.name.toLowerCase(), useCamel ? toCamelCase(t.name) : t.name);
  }

  const getColFieldKey = (colName: string): string => {
    return useCamel ? toCamelCase(colName) : colName;
  };

  const tableBlocks: string[] = [];
  const relationBlocks: string[] = [];
  const inferBlocks: string[] = [];

  interface IncomingRel {
    fromTable: ParsedSqlTable;
    fromCol: ParsedSqlColumn;
    toColName: string;
    isOneToOne: boolean;
  }
  const incomingByTable = new Map<string, IncomingRel[]>();
  for (const t of parsed.tables) {
    incomingByTable.set(t.name.toLowerCase(), []);
  }

  for (const t of parsed.tables) {
    for (const c of t.columns) {
      if (c.references) {
        const targetKey = c.references.table.toLowerCase();
        const list = incomingByTable.get(targetKey);
        if (list) {
          list.push({
            fromTable: t,
            fromCol: c,
            toColName: c.references.column,
            isOneToOne:
              c.isUnique ||
              (t.primaryKeyColumns.length === 1 &&
                t.primaryKeyColumns[0].toLowerCase() === c.name.toLowerCase()),
          });
        }
      }
    }
  }

  for (const table of parsed.tables) {
    const tableVar = tableVarNameMap.get(table.name.toLowerCase())!;
    const hasCompositePk = table.primaryKeyColumns.length > 1;
    const colLines: string[] = [];

    for (const col of table.columns) {
      const fieldKey = getColFieldKey(col.name);
      const mapped = mapColumnToDrizzle(col, dialect, enumVarMap);
      coreImports.add(mapped.importSymbol);

      let expr = mapped.builderCode;
      const rawUpper = col.rawType.toUpperCase();
      const isSerial = rawUpper.includes("SERIAL");

      if (!hasCompositePk && col.isPrimaryKey) {
        if (dialect === "sqlite" && col.isAutoIncrement) {
          expr += `.primaryKey({ autoIncrement: true })`;
        } else {
          expr += `.primaryKey()`;
        }
      } else if (col.isAutoIncrement && dialect === "mysql" && !isSerial) {
        expr += `.autoincrement()`;
      }

      if (col.defaultValue !== undefined && !isSerial && !col.isAutoIncrement) {
        const def = col.defaultValue.trim();
        const defUpper = def.toUpperCase();
        if (
          defUpper.includes("GEN_RANDOM_UUID()") ||
          defUpper.includes("UUID_GENERATE_V4()")
        ) {
          if (dialect === "postgresql" && mapped.importSymbol === "uuid") {
            expr += `.defaultRandom()`;
          }
        } else if (
          defUpper === "NOW()" ||
          defUpper === "CURRENT_TIMESTAMP" ||
          defUpper.startsWith("CURRENT_TIMESTAMP")
        ) {
          if (mapped.importSymbol === "timestamp") {
            expr += `.defaultNow()`;
          }
        } else if (defUpper === "TRUE" || defUpper === "FALSE") {
          expr += `.default(${defUpper === "TRUE" ? "true" : "false"})`;
        } else if (/^-?\d+(\.\d+)?$/.test(def)) {
          if (mapped.importSymbol === "numeric" || mapped.importSymbol === "decimal") {
            expr += `.default(${JSON.stringify(def)})`;
          } else {
            expr += `.default(${def})`;
          }
        } else {
          const cleanLiteral = def.replace(/^['"]|['"]$/g, "");
          expr += `.default(${JSON.stringify(cleanLiteral)})`;
        }
      }

      if (!col.isNullable && !col.isPrimaryKey && !isSerial) {
        expr += `.notNull()`;
      }

      if (col.isUnique && !col.isPrimaryKey) {
        expr += `.unique()`;
      }

      if (col.references) {
        const targetTableVar = tableVarNameMap.get(col.references.table.toLowerCase());
        const targetFieldKey = getColFieldKey(col.references.column);
        if (targetTableVar) {
          const actions: string[] = [];
          if (col.references.onDelete) {
            actions.push(`onDelete: ${JSON.stringify(col.references.onDelete.toLowerCase())}`);
          }
          if (col.references.onUpdate) {
            actions.push(`onUpdate: ${JSON.stringify(col.references.onUpdate.toLowerCase())}`);
          }
          const actionObj = actions.length > 0 ? `, { ${actions.join(", ")} }` : "";
          expr += `.references(() => ${targetTableVar}.${targetFieldKey}${actionObj})`;
        }
      }

      colLines.push(`  ${fieldKey}: ${expr},`);
    }

    const extraLines: string[] = [];
    if (hasCompositePk) {
      coreImports.add("primaryKey");
      const pkCols = table.primaryKeyColumns.map((c: string) => `t.${getColFieldKey(c)}`).join(", ");
      extraLines.push(`  pk: primaryKey({ columns: [${pkCols}] }),`);
    }

    for (let i = 0; i < table.uniqueConstraints.length; i++) {
      const uCols = table.uniqueConstraints[i];
      if (uCols.length > 1) {
        coreImports.add("uniqueIndex");
        const colsCode = uCols.map((c: string) => `t.${getColFieldKey(c)}`).join(", ");
        const idxName = `${table.name}_${uCols.join("_")}_unique`;
        extraLines.push(`  uniqueIdx${i + 1}: uniqueIndex(${JSON.stringify(idxName)}).on(${colsCode}),`);
      }
    }

    for (const idx of table.indexes) {
      const idxFn = idx.unique ? "uniqueIndex" : "index";
      coreImports.add(idxFn);
      const colsCode = idx.columns.map((c: string) => `t.${getColFieldKey(c)}`).join(", ");
      const propKey = toCamelCase(idx.name);
      extraLines.push(`  ${propKey}: ${idxFn}(${JSON.stringify(idx.name)}).on(${colsCode}),`);
    }

    if (extraLines.length > 0) {
      tableBlocks.push(
        `export const ${tableVar} = ${tableFunc}(\n  ${JSON.stringify(table.name)},\n  {\n${colLines.map((l) => "  " + l).join("\n")}\n  },\n  (t) => ({\n${extraLines.map((l) => "  " + l).join("\n")}\n  })\n);`
      );
    } else {
      tableBlocks.push(
        `export const ${tableVar} = ${tableFunc}(${JSON.stringify(table.name)}, {\n${colLines.join("\n")}\n});`
      );
    }

    if (includeRelations) {
      const outgoing = table.columns.filter(
        (c: ParsedSqlColumn) => c.references && tableVarNameMap.has(c.references.table.toLowerCase())
      );
      const incoming = incomingByTable.get(table.name.toLowerCase()) || [];

      if (outgoing.length > 0 || incoming.length > 0) {
        needsRelationsImport = true;
        const helpers = new Set<string>();
        const relLines: string[] = [];

        for (const col of outgoing) {
          helpers.add("one");
          const targetTableVar = tableVarNameMap.get(col.references!.table.toLowerCase())!;
          const relFieldName = toCamelCase(
            col.name.replace(/_id$/i, "") || singularize(col.references!.table)
          );
          const sourceFieldKey = getColFieldKey(col.name);
          const targetFieldKey = getColFieldKey(col.references!.column);
          relLines.push(
            `  ${relFieldName}: one(${targetTableVar}, {\n    fields: [${tableVar}.${sourceFieldKey}],\n    references: [${targetTableVar}.${targetFieldKey}],\n  }),`
          );
        }

        for (const inc of incoming) {
          const fromTableVar = tableVarNameMap.get(inc.fromTable.name.toLowerCase())!;
          if (inc.isOneToOne) {
            helpers.add("one");
            const propName = toCamelCase(singularize(inc.fromTable.name));
            relLines.push(`  ${propName}: one(${fromTableVar}),`);
          } else {
            helpers.add("many");
            const propName = toCamelCase(inc.fromTable.name);
            relLines.push(`  ${propName}: many(${fromTableVar}),`);
          }
        }

        const helperList = Array.from(helpers).join(", ");
        relationBlocks.push(
          `export const ${tableVar}Relations = relations(${tableVar}, ({ ${helperList} }) => ({\n${relLines.join("\n")}\n}));`
        );
      }
    }

    if (includeInferTypes) {
      const pascalModel = toPascalCase(singularize(table.name));
      inferBlocks.push(
        `export type ${pascalModel} = typeof ${tableVar}.$inferSelect;\nexport type New${pascalModel} = typeof ${tableVar}.$inferInsert;`
      );
    }
  }

  const sections: string[] = [];
  const sortedCoreImports = Array.from(coreImports).sort();
  let importSection = `import {\n  ${sortedCoreImports.join(",\n  ")},\n} from "${corePackage}";`;
  if (needsRelationsImport) {
    importSection += `\nimport { relations } from "drizzle-orm";`;
  }
  sections.push(importSection);

  if (enumBlocks.length > 0) {
    sections.push(enumBlocks.join("\n\n"));
  }
  sections.push(tableBlocks.join("\n\n"));
  if (relationBlocks.length > 0) {
    sections.push(relationBlocks.join("\n\n"));
  }
  if (inferBlocks.length > 0) {
    sections.push(inferBlocks.join("\n"));
  }

  return sections.join("\n\n") + "\n";
}
