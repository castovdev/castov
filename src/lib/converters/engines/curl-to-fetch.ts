/**
 * cURL to Fetch Engine (Client-side, Zero-network)
 *
 * Capabilities:
 * - Full shell tokenizer supporting single quotes, double quotes, ANSI-C $'...' strings, and backslash line continuations
 * - Handles flags:
 *   - -X / --request (explicit HTTP method)
 *   - -H / --header (custom HTTP headers)
 *   - -d / --data / --data-raw / --data-binary / --data-ascii (request body; multiple -d flags joined with '&')
 *   - -u / --user (Basic Auth -> Authorization: Basic btoa("user:pass"))
 *   - -F / --form (Multipart FormData -> generates `const formData = new FormData(); formData.append(...)` and omits manual Content-Type boundary)
 *   - -G / --get (forces GET and appends -d data to URL query string)
 *   - -b / --cookie (sets Cookie header)
 *   - -A / --user-agent (sets User-Agent header)
 *   - -e / --referer (sets Referer header)
 */

export interface CurlToFetchOptions {
  syntaxStyle?: "async-await" | "promise-then";
  responseParser?: "json" | "text";
  includeErrorCheck?: boolean;
  includeCredentials?: boolean;
}

export interface ParsedCurl {
  url: string;
  method: string;
  headers: Record<string, string>;
  dataParts: string[];
  formParts: { key: string; value: string; isFile: boolean }[];
  auth: string | null;
  forceGet: boolean;
}

export function tokenizeShell(cmd: string): string[] {
  // Normalize backslash-newline continuations outside single quotes
  const normalized = cmd.replace(/\\\r?\n/g, " ");
  const tokens: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let inAnsiSingle = false;
  let hasTokenContent = false;

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];

    if (inSingle) {
      if (ch === "'") {
        inSingle = false;
      } else {
        current += ch;
      }
      continue;
    }

    if (inAnsiSingle) {
      if (ch === "'" && normalized[i - 1] !== "\\") {
        inAnsiSingle = false;
      } else if (ch === "\\" && i + 1 < normalized.length) {
        const next = normalized[++i];
        if (next === "n") current += "\n";
        else if (next === "r") current += "\r";
        else if (next === "t") current += "\t";
        else current += next;
      } else {
        current += ch;
      }
      continue;
    }

    if (inDouble) {
      if (ch === '"') {
        inDouble = false;
      } else if (ch === "\\" && i + 1 < normalized.length) {
        const next = normalized[++i];
        if (next === '"' || next === "\\" || next === "$" || next === "`") {
          current += next;
        } else if (next === "n") {
          current += "\n";
        } else {
          current += "\\" + next;
        }
      } else {
        current += ch;
      }
      continue;
    }

    // Outside quotes
    if (/\s/.test(ch)) {
      if (hasTokenContent || current.length > 0) {
        tokens.push(current);
        current = "";
        hasTokenContent = false;
      }
      continue;
    }

    if (ch === "$" && normalized[i + 1] === "'") {
      inAnsiSingle = true;
      hasTokenContent = true;
      i++; // skip "'"
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      hasTokenContent = true;
      continue;
    }

    if (ch === '"') {
      inDouble = true;
      hasTokenContent = true;
      continue;
    }

    if (ch === "\\" && i + 1 < normalized.length) {
      current += normalized[++i];
      hasTokenContent = true;
      continue;
    }

    current += ch;
    hasTokenContent = true;
  }

  if (hasTokenContent || current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

export function parseCurl(input: string): ParsedCurl {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Input cURL command is empty.");
  }

  const tokens = tokenizeShell(trimmed);
  if (tokens.length === 0) {
    throw new Error("Unable to parse cURL command.");
  }

  let startIdx = 0;
  if (tokens[0].toLowerCase() === "curl" || tokens[0].toLowerCase() === "curl.exe") {
    startIdx = 1;
  }

  let url = "";
  let explicitMethod = "";
  const headers: Record<string, string> = {};
  const dataParts: string[] = [];
  const formParts: { key: string; value: string; isFile: boolean }[] = [];
  let auth: string | null = null;
  let forceGet = false;

  const VALUE_FLAGS = new Set([
    "-X",
    "--request",
    "-H",
    "--header",
    "-d",
    "--data",
    "--data-raw",
    "--data-binary",
    "--data-ascii",
    "--data-urlencode",
    "-u",
    "--user",
    "-F",
    "--form",
    "--form-string",
    "-b",
    "--cookie",
    "-A",
    "--user-agent",
    "-e",
    "--referer",
    "--url",
  ]);

  for (let i = startIdx; i < tokens.length; i++) {
    let tok = tokens[i];
    let inlineVal: string | null = null;

    // Support --header="Value" or -XPOST or -H"Accept: */*"
    if (tok.startsWith("--") && tok.includes("=")) {
      const eqIdx = tok.indexOf("=");
      inlineVal = tok.slice(eqIdx + 1);
      tok = tok.slice(0, eqIdx);
    } else if (/^-[XHduFbAe].+/.test(tok)) {
      inlineVal = tok.slice(2);
      tok = tok.slice(0, 2);
    }

    const nextVal = (): string => {
      if (inlineVal !== null) return inlineVal;
      return i + 1 < tokens.length ? tokens[++i] : "";
    };

    if (tok === "-X" || tok === "--request") {
      explicitMethod = nextVal().toUpperCase();
    } else if (tok === "-H" || tok === "--header") {
      const rawHeader = nextVal();
      const colonIdx = rawHeader.indexOf(":");
      if (colonIdx > 0) {
        const key = rawHeader.slice(0, colonIdx).trim();
        const val = rawHeader.slice(colonIdx + 1).trim();
        headers[key] = val;
      }
    } else if (
      tok === "-d" ||
      tok === "--data" ||
      tok === "--data-raw" ||
      tok === "--data-binary" ||
      tok === "--data-ascii" ||
      tok === "--data-urlencode"
    ) {
      dataParts.push(nextVal());
    } else if (tok === "-u" || tok === "--user") {
      auth = nextVal();
    } else if (tok === "-F" || tok === "--form" || tok === "--form-string") {
      const rawForm = nextVal();
      const eqIdx = rawForm.indexOf("=");
      if (eqIdx > 0) {
        const key = rawForm.slice(0, eqIdx).trim();
        let val = rawForm.slice(eqIdx + 1).trim();
        let isFile = false;
        if (tok !== "--form-string" && val.startsWith("@")) {
          isFile = true;
          val = val.slice(1);
        }
        formParts.push({ key, value: val, isFile });
      }
    } else if (tok === "-G" || tok === "--get") {
      forceGet = true;
    } else if (tok === "-I" || tok === "--head") {
      if (!explicitMethod) explicitMethod = "HEAD";
    } else if (tok === "-b" || tok === "--cookie") {
      headers["Cookie"] = nextVal();
    } else if (tok === "-A" || tok === "--user-agent") {
      headers["User-Agent"] = nextVal();
    } else if (tok === "-e" || tok === "--referer") {
      headers["Referer"] = nextVal();
    } else if (tok === "--url") {
      url = nextVal();
    } else if (tok === "--compressed" || tok === "-s" || tok === "--silent" || tok === "-L" || tok === "--location" || tok === "-k" || tok === "--insecure" || tok === "-v" || tok === "--verbose" || tok === "-i" || tok === "--include") {
      // Ignore non-payload curl flags
      continue;
    } else if (!tok.startsWith("-")) {
      if (!url || /^https?:\/\//i.test(tok)) {
        url = tok;
      }
    } else if (VALUE_FLAGS.has(tok)) {
      nextVal();
    }
  }

  if (!url) {
    throw new Error("No target URL found in cURL command.");
  }

  let method = explicitMethod;
  if (!method) {
    if (forceGet) {
      method = "GET";
    } else if (formParts.length > 0 || dataParts.length > 0) {
      method = "POST";
    } else {
      method = "GET";
    }
  }

  if (forceGet && dataParts.length > 0) {
    const queryStr = dataParts.join("&");
    url += (url.includes("?") ? "&" : "?") + queryStr;
    dataParts.length = 0;
  }

  return {
    url,
    method,
    headers,
    dataParts,
    formParts,
    auth,
    forceGet,
  };
}

export function convert(input: string, userOptions: CurlToFetchOptions = {}): string {
  const parsed = parseCurl(input);

  const options: Required<CurlToFetchOptions> = {
    syntaxStyle: userOptions.syntaxStyle || "async-await",
    responseParser: userOptions.responseParser || "json",
    includeErrorCheck:
      userOptions.includeErrorCheck !== undefined
        ? userOptions.includeErrorCheck === true || (userOptions.includeErrorCheck as any) === "true"
        : true,
    includeCredentials: Boolean(userOptions.includeCredentials),
  };

  const finalHeaders: Record<string, string> = { ...parsed.headers };

  // Handle -u / --user Basic Auth
  const hasExplicitAuthHeader = Object.keys(finalHeaders).some(
    (k) => k.toLowerCase() === "authorization"
  );
  if (parsed.auth && !hasExplicitAuthHeader) {
    finalHeaders["Authorization"] = `__BASIC_AUTH__(${JSON.stringify(parsed.auth)})__`;
  }

  // Handle -F / --form Multipart FormData
  const lines: string[] = [];
  let bodyExpr: string | null = null;

  if (parsed.formParts.length > 0) {
    // When using FormData in fetch(), never set a static Content-Type: multipart/form-data header
    // because the browser must auto-generate the multipart boundary.
    for (const k of Object.keys(finalHeaders)) {
      if (k.toLowerCase() === "content-type" && finalHeaders[k].toLowerCase().includes("multipart/form-data")) {
        delete finalHeaders[k];
      }
    }

    lines.push("const formData = new FormData();");
    for (const part of parsed.formParts) {
      if (part.isFile) {
        lines.push(
          `// Note: Replace Blob placeholder with an actual File or Blob input for "${part.value}"`
        );
        lines.push(
          `formData.append(${JSON.stringify(part.key)}, new Blob([]), ${JSON.stringify(part.value)});`
        );
      } else {
        lines.push(`formData.append(${JSON.stringify(part.key)}, ${JSON.stringify(part.value)});`);
      }
    }
    lines.push("");
    bodyExpr = "formData";
  } else if (parsed.dataParts.length > 0) {
    const combinedData = parsed.dataParts.join("&");
    try {
      const parsedJson = JSON.parse(combinedData);
      const formattedJson = JSON.stringify(parsedJson, null, 2)
        .split("\n")
        .map((line, idx) => (idx === 0 ? line : "  " + line))
        .join("\n");
      bodyExpr = `JSON.stringify(${formattedJson})`;
    } catch {
      bodyExpr = JSON.stringify(combinedData);
    }
  }

  // Build fetch init object lines
  const initProps: string[] = [];
  initProps.push(`  method: ${JSON.stringify(parsed.method)},`);

  const headerKeys = Object.keys(finalHeaders);
  if (headerKeys.length > 0) {
    const headerLines = headerKeys.map((k) => {
      const val = finalHeaders[k];
      if (val.startsWith("__BASIC_AUTH__(") && val.endsWith(")__")) {
        const inner = val.slice("__BASIC_AUTH__(".length, -3);
        return `    ${JSON.stringify(k)}: \`Basic \${btoa(${inner})}\`,`;
      }
      return `    ${JSON.stringify(k)}: ${JSON.stringify(val)},`;
    });
    initProps.push(`  headers: {\n${headerLines.join("\n")}\n  },`);
  }

  if (options.includeCredentials) {
    initProps.push(`  credentials: "include",`);
  }

  if (bodyExpr) {
    initProps.push(`  body: ${bodyExpr},`);
  }

  const fetchCall = `fetch(${JSON.stringify(parsed.url)}, {\n${initProps.join("\n")}\n})`;

  if (options.syntaxStyle === "promise-then") {
    lines.push(`${fetchCall}`);
    if (options.includeErrorCheck) {
      lines.push(`  .then((response) => {`);
      lines.push(`    if (!response.ok) {`);
      lines.push(`      throw new Error(\`HTTP error! Status: \${response.status}\`);`);
      lines.push(`    }`);
      lines.push(`    return response.${options.responseParser}();`);
      lines.push(`  })`);
    } else {
      lines.push(`  .then((response) => response.${options.responseParser}())`);
    }
    lines.push(`  .then((data) => console.log(data))`);
    lines.push(`  .catch((error) => console.error("Request failed:", error));`);
  } else {
    lines.push(`const response = await ${fetchCall};`);
    if (options.includeErrorCheck) {
      lines.push("");
      lines.push("if (!response.ok) {");
      lines.push("  throw new Error(`HTTP error! Status: ${response.status}`);");
      lines.push("}");
    }
    lines.push("");
    lines.push(`const data = await response.${options.responseParser}();`);
    lines.push("console.log(data);");
  }

  return lines.join("\n") + "\n";
}
