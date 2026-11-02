/**
 * cURL to Fetch / Node / Axios Engine (Client-side, Zero-network)
 *
 * Capabilities:
 * - Full shell tokenizer supporting single quotes, double quotes, ANSI-C $'...' strings, and backslash line continuations
 * - Handles real-world Chrome DevTools "Copy as cURL (bash)" commands (--compressed, sec-ch-ua, -b cookies, many headers)
 * - Handles flags:
 *   - -X / --request (explicit HTTP method)
 *   - -H / --header (custom HTTP headers)
 *   - -d / --data / --data-ascii / --data-urlencode (defaults to application/x-www-form-urlencoded when no Content-Type is set)
 *   - --data-raw / --data-binary (request body; auto-detects JSON or defaults to application/x-www-form-urlencoded)
 *   - -u / --user (UTF-8 safe Basic Auth -> TextEncoder + btoa in browser, or Buffer.from in Node.js)
 *   - -F / --form (Multipart FormData -> generates `new FormData()` and strips manual multipart Content-Type boundary)
 *   - -G / --get (forces GET and appends -d data to URL query string)
 *   - -I / --head (sets HTTP method to HEAD)
 *   - -L / --location (sets redirect: "follow" in fetch)
 *   - -b / --cookie (sets Cookie header)
 *   - --url (explicit target URL)
 *   - --compressed (parsed cleanly; emits Accept-Encoding note/header handling)
 *   - -k / --insecure (emits prominent TLS/SSL security warning banner in output)
 * - Target Runtime Output Option:
 *   - "browser-fetch": Browser Fetch API (UTF-8 TextEncoder Basic Auth, credentials/cookie note)
 *   - "node-fetch": Node.js 18+ Native Fetch (Buffer.from Basic Auth,dispatcher/TLS note for -k)
 *   - "axios": Axios Request Config (axios.request with data, headers, auth/headers, maxRedirects)
 */

export interface CurlToFetchOptions {
  targetClient?: "browser-fetch" | "node-fetch" | "axios";
  syntaxStyle?: "async-await" | "promise-then";
  responseParser?: "json" | "text";
  includeErrorCheck?: boolean;
  includeCredentials?: boolean;
}

export interface ParsedCurl {
  url: string;
  method: string;
  headers: Record<string, string>;
  dataParts: { value: string; flag: string }[];
  formParts: { key: string; value: string; isFile: boolean }[];
  auth: string | null;
  forceGet: boolean;
  followRedirects: boolean;
  isHead: boolean;
  compressed: boolean;
  insecure: boolean;
  cookies: string[];
}

export function encodeBasicAuthUtf8(credentials: string): string {
  const bytes = new TextEncoder().encode(credentials);
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

export function tokenizeShell(cmd: string): string[] {
  // Normalize backslash-newline continuations
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
  const dataParts: { value: string; flag: string }[] = [];
  const formParts: { key: string; value: string; isFile: boolean }[] = [];
  const cookies: string[] = [];
  let auth: string | null = null;
  let forceGet = false;
  let followRedirects = false;
  let isHead = false;
  let compressed = false;
  let insecure = false;

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
        if (key.toLowerCase() === "cookie") {
          cookies.push(val);
        } else {
          headers[key] = val;
        }
      }
    } else if (
      tok === "-d" ||
      tok === "--data" ||
      tok === "--data-raw" ||
      tok === "--data-binary" ||
      tok === "--data-ascii" ||
      tok === "--data-urlencode"
    ) {
      dataParts.push({ value: nextVal(), flag: tok });
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
      isHead = true;
      if (!explicitMethod) explicitMethod = "HEAD";
    } else if (tok === "-L" || tok === "--location") {
      followRedirects = true;
    } else if (tok === "-b" || tok === "--cookie") {
      cookies.push(nextVal());
    } else if (tok === "-A" || tok === "--user-agent") {
      headers["User-Agent"] = nextVal();
    } else if (tok === "-e" || tok === "--referer") {
      headers["Referer"] = nextVal();
    } else if (tok === "--url") {
      url = nextVal();
    } else if (tok === "--compressed") {
      compressed = true;
    } else if (tok === "-k" || tok === "--insecure") {
      insecure = true;
    } else if (
      tok === "-s" ||
      tok === "--silent" ||
      tok === "-v" ||
      tok === "--verbose" ||
      tok === "-i" ||
      tok === "--include" ||
      tok === "-S" ||
      tok === "--show-error"
    ) {
      continue;
    } else if (!tok.startsWith("-")) {
      if (!url || /^https?:\/\//i.test(tok)) {
        url = tok;
      }
    } else if (VALUE_FLAGS.has(tok)) {
      nextVal();
    }
  }

  if (cookies.length > 0) {
    headers["Cookie"] = cookies.join("; ");
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
    } else if (isHead) {
      method = "HEAD";
    } else {
      method = "GET";
    }
  }

  if (forceGet && dataParts.length > 0) {
    const queryStr = dataParts.map((d) => d.value).join("&");
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
    followRedirects,
    isHead,
    compressed,
    insecure,
    cookies,
  };
}

export function convert(input: string, userOptions: CurlToFetchOptions = {}): string {
  const parsed = parseCurl(input);

  const options: Required<CurlToFetchOptions> = {
    targetClient: userOptions.targetClient || "browser-fetch",
    syntaxStyle: userOptions.syntaxStyle || "async-await",
    responseParser: userOptions.responseParser || "json",
    includeErrorCheck:
      userOptions.includeErrorCheck !== undefined
        ? userOptions.includeErrorCheck === true || (userOptions.includeErrorCheck as any) === "true"
        : true,
    includeCredentials: Boolean(userOptions.includeCredentials),
  };

  const finalHeaders: Record<string, string> = { ...parsed.headers };
  const lines: string[] = [];

  // 1. Prominent security warning when -k / --insecure is detected
  if (parsed.insecure) {
    lines.push(
      "// ⚠️ SECURITY WARNING (-k / --insecure detected):",
      "// cURL's -k flag disables TLS/SSL certificate verification, exposing requests to Man-in-the-Middle (MitM) attacks.",
      options.targetClient === "browser-fetch"
        ? "// Browser fetch() strictly enforces HTTPS certificates and cannot bypass TLS validation from client-side code."
        : "// In Node.js, never set NODE_TLS_REJECT_UNAUTHORIZED='0' in production; configure a custom CA certificate instead.",
      ""
    );
  }

  // 2. Note on --compressed if present
  if (parsed.compressed && options.targetClient === "node-fetch") {
    const hasAcceptEncoding = Object.keys(finalHeaders).some(
      (k) => k.toLowerCase() === "accept-encoding"
    );
    if (!hasAcceptEncoding) {
      finalHeaders["Accept-Encoding"] = "gzip, deflate, br";
    }
  }

  // 3. Handle -u / --user UTF-8 safe Basic Auth
  const hasExplicitAuthHeader = Object.keys(finalHeaders).some(
    (k) => k.toLowerCase() === "authorization"
  );
  let needsUtf8AuthHelper = false;
  if (parsed.auth && !hasExplicitAuthHeader) {
    if (options.targetClient === "node-fetch") {
      finalHeaders["Authorization"] = `__NODE_BASIC_AUTH__(${JSON.stringify(parsed.auth)})__`;
    } else if (options.targetClient === "browser-fetch") {
      needsUtf8AuthHelper = true;
      finalHeaders["Authorization"] = `__BROWSER_BASIC_AUTH__(${JSON.stringify(parsed.auth)})__`;
    }
  }

  if (needsUtf8AuthHelper && parsed.auth) {
    lines.push(
      "// UTF-8 safe Base64 encoding for Basic Auth (avoids btoa InvalidCharacterError on non-ASCII characters)",
      "const encodeBasicAuth = (credentials) => {",
      "  const bytes = new TextEncoder().encode(credentials);",
      "  let binary = \"\";",
      "  for (const b of bytes) binary += String.fromCharCode(b);",
      "  return btoa(binary);",
      "};",
      ""
    );
  }

  // 4. Handle Body (-F FormData or -d / --data-raw)
  let bodyExpr: string | null = null;
  let axiosDataExpr: string | null = null;

  const hasContentType = Object.keys(finalHeaders).some(
    (k) => k.toLowerCase() === "content-type"
  );

  if (parsed.formParts.length > 0) {
    // Strip manual multipart/form-data header so runtime generates boundary
    for (const k of Object.keys(finalHeaders)) {
      if (
        k.toLowerCase() === "content-type" &&
        finalHeaders[k].toLowerCase().includes("multipart/form-data")
      ) {
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
    axiosDataExpr = "formData";
  } else if (parsed.dataParts.length > 0) {
    const combinedData = parsed.dataParts.map((d) => d.value).join("&");
    let isJsonBody = false;
    let parsedJson: any = null;

    const trimmedData = combinedData.trim();
    if (
      (trimmedData.startsWith("{") && trimmedData.endsWith("}")) ||
      (trimmedData.startsWith("[") && trimmedData.endsWith("]"))
    ) {
      try {
        parsedJson = JSON.parse(combinedData);
        isJsonBody = true;
      } catch {
        isJsonBody = false;
      }
    }

    // cURL -d defaults to Content-Type: application/x-www-form-urlencoded when not specified
    if (!hasContentType) {
      finalHeaders["Content-Type"] = "application/x-www-form-urlencoded";
    }

    if (isJsonBody) {
      const formattedJson = JSON.stringify(parsedJson, null, 2)
        .split("\n")
        .map((line, idx) => (idx === 0 ? line : "  " + line))
        .join("\n");
      bodyExpr = `JSON.stringify(${formattedJson})`;
      axiosDataExpr = formattedJson;
    } else {
      bodyExpr = JSON.stringify(combinedData);
      axiosDataExpr = JSON.stringify(combinedData);
    }
  }

  // 5. Render Axios output if targetClient === "axios"
  if (options.targetClient === "axios") {
    const axiosLines: string[] = ['import axios from "axios";', ""];
    if (lines.length > 0) {
      axiosLines.push(...lines);
    }

    const configProps: string[] = [
      `  method: ${JSON.stringify(parsed.method.toLowerCase())},`,
      `  url: ${JSON.stringify(parsed.url)},`,
    ];

    const headerKeys = Object.keys(finalHeaders);
    if (headerKeys.length > 0) {
      const headerEntries = headerKeys.map(
        (k) => `    ${JSON.stringify(k)}: ${JSON.stringify(finalHeaders[k])},`
      );
      configProps.push(`  headers: {\n${headerEntries.join("\n")}\n  },`);
    }

    if (parsed.auth && !hasExplicitAuthHeader) {
      const colonIdx = parsed.auth.indexOf(":");
      const username = colonIdx >= 0 ? parsed.auth.slice(0, colonIdx) : parsed.auth;
      const password = colonIdx >= 0 ? parsed.auth.slice(colonIdx + 1) : "";
      configProps.push(
        `  auth: {\n    username: ${JSON.stringify(username)},\n    password: ${JSON.stringify(password)},\n  },`
      );
    }

    if (options.includeCredentials) {
      configProps.push(`  withCredentials: true,`);
    }

    if (!parsed.followRedirects) {
      // By default Axios follows redirects in Node, or if -L is explicit we can note it
    } else {
      configProps.push(`  maxRedirects: 5,`);
    }

    if (axiosDataExpr) {
      configProps.push(`  data: ${axiosDataExpr},`);
    }

    axiosLines.push(`const response = await axios.request({\n${configProps.join("\n")}\n});`);
    axiosLines.push("");
    axiosLines.push("console.log(response.data);");
    return axiosLines.join("\n") + "\n";
  }

  // 6. Render Browser Fetch or Node.js Fetch
  const initProps: string[] = [];
  initProps.push(`  method: ${JSON.stringify(parsed.method)},`);

  const headerKeys = Object.keys(finalHeaders);
  if (headerKeys.length > 0) {
    const headerLines = headerKeys.map((k) => {
      const val = finalHeaders[k];
      if (val.startsWith("__BROWSER_BASIC_AUTH__(") && val.endsWith(")__")) {
        const inner = val.slice("__BROWSER_BASIC_AUTH__(".length, -3);
        return `    ${JSON.stringify(k)}: \`Basic \${encodeBasicAuth(${inner})}\`,`;
      }
      if (val.startsWith("__NODE_BASIC_AUTH__(") && val.endsWith(")__")) {
        const inner = val.slice("__NODE_BASIC_AUTH__(".length, -3);
        return `    ${JSON.stringify(k)}: \`Basic \${Buffer.from(${inner}, "utf8").toString("base64")}\`,`;
      }
      return `    ${JSON.stringify(k)}: ${JSON.stringify(val)},`;
    });
    initProps.push(`  headers: {\n${headerLines.join("\n")}\n  },`);
  }

  if (parsed.followRedirects) {
    initProps.push(`  redirect: "follow",`);
  }

  if (options.includeCredentials) {
    initProps.push(`  credentials: "include",`);
  }

  if (bodyExpr && parsed.method !== "GET" && parsed.method !== "HEAD") {
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
      if (parsed.method === "HEAD") {
        lines.push(`    return Object.fromEntries(response.headers.entries());`);
      } else {
        lines.push(`    return response.${options.responseParser}();`);
      }
      lines.push(`  })`);
    } else {
      lines.push(
        `  .then((response) => ${
          parsed.method === "HEAD"
            ? "Object.fromEntries(response.headers.entries())"
            : `response.${options.responseParser}()`
        })`
      );
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
    if (parsed.method === "HEAD") {
      lines.push("const headers = Object.fromEntries(response.headers.entries());");
      lines.push("console.log(headers);");
    } else {
      lines.push(`const data = await response.${options.responseParser}();`);
      lines.push("console.log(data);");
    }
  }

  return lines.join("\n") + "\n";
}
