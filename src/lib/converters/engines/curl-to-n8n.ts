import { parseCurl, encodeBasicAuthUtf8 } from "./curl-to-fetch";

export interface CurlToN8nOptions {
  targetPlatform?: "n8n-node" | "make-http" | "n8n-code";
  stripBrowserNoise?: boolean;
}

const BROWSER_NOISE_HEADERS = new Set([
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
  "sec-fetch-dest",
  "sec-fetch-mode",
  "sec-fetch-site",
  "sec-fetch-user",
  "upgrade-insecure-requests",
  "priority",
  "accept-language",
  "connection",
  "keep-alive",
  "cache-control",
  "pragma",
]);

export function convert(input: string, options?: CurlToN8nOptions): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Input cURL command is empty. Paste a valid curl command.");
  }

  const targetPlatform = options?.targetPlatform ?? "n8n-node";
  const stripBrowserNoise = options?.stripBrowserNoise ?? true;

  const parsed = parseCurl(trimmed);

  // Combine dataParts into body string
  const combinedBody =
    parsed.dataParts.length > 0
      ? parsed.dataParts.map((d) => d.value).join("&")
      : "";

  // Determine effective HTTP method
  const effectiveMethod = (
    parsed.method ||
    (parsed.formParts.length > 0 || combinedBody ? "POST" : "GET")
  ).toUpperCase();

  // Separate query parameters from base URL if possible
  let cleanUrl = parsed.url;
  const queryParams: Array<{ name: string; value: string }> = [];
  try {
    const u = new URL(parsed.url);
    u.searchParams.forEach((value, name) => {
      queryParams.push({ name, value });
    });
    if (queryParams.length > 0) {
      cleanUrl = `${u.origin}${u.pathname}`;
    }
  } catch {
    // Keep raw URL if not parseable or contains {{expressions}}
  }

  // Filter headers
  const finalHeaders: Array<{ name: string; value: string }> = [];
  let contentTypeValue = "";

  for (const [k, v] of Object.entries(parsed.headers)) {
    const lower = k.toLowerCase();
    if (lower === "content-type") {
      contentTypeValue = v;
    }
    if (stripBrowserNoise && BROWSER_NOISE_HEADERS.has(lower)) {
      continue;
    }
    finalHeaders.push({ name: k, value: v });
  }

  if (parsed.auth) {
    finalHeaders.push({
      name: "Authorization",
      value: `Basic ${encodeBasicAuthUtf8(parsed.auth)}`,
    });
  }

  if (targetPlatform === "n8n-node") {
    const parameters: Record<string, any> = {
      method: effectiveMethod,
      url: cleanUrl,
      authentication: "none",
    };

    if (queryParams.length > 0) {
      parameters.sendQuery = true;
      parameters.queryParameters = {
        parameters: queryParams,
      };
    }

    if (finalHeaders.length > 0) {
      parameters.sendHeaders = true;
      parameters.headerParameters = {
        parameters: finalHeaders,
      };
    }

    if (parsed.formParts.length > 0) {
      parameters.sendBody = true;
      parameters.contentType = "multipart-form-data";
      parameters.bodyParameters = {
        parameters: parsed.formParts.map((f: { key: string; value: string; isFile: boolean }) => ({
          name: f.key,
          value: f.value,
          parameterType: f.isFile ? "formBinaryData" : "formData",
        })),
      };
    } else if (combinedBody) {
      parameters.sendBody = true;
      let isJson = false;
      let formattedJsonBody = combinedBody;
      try {
        const parsedJson = JSON.parse(combinedBody);
        formattedJsonBody = JSON.stringify(parsedJson, null, 2);
        isJson = true;
      } catch {
        isJson = contentTypeValue.toLowerCase().includes("application/json");
      }

      if (isJson) {
        parameters.specifyBody = "json";
        parameters.jsonBody = formattedJsonBody;
      } else if (contentTypeValue.toLowerCase().includes("application/x-www-form-urlencoded")) {
        parameters.contentType = "form-urlencoded";
        const formPairs: Array<{ name: string; value: string }> = [];
        const sp = new URLSearchParams(combinedBody);
        sp.forEach((value, name) => {
          formPairs.push({ name, value });
        });
        parameters.bodyParameters = { parameters: formPairs };
      } else {
        parameters.contentType = "raw";
        parameters.rawContentType = contentTypeValue || "text/plain";
        parameters.body = combinedBody;
      }
    }

    const optionsObj: Record<string, any> = {};
    if (parsed.insecure) {
      optionsObj.allowUnauthorizedCerts = true;
    }
    if (parsed.followRedirects) {
      optionsObj.redirect = { redirect: { followRedirects: true } };
    }
    parameters.options = optionsObj;

    const n8nWorkflow = {
      nodes: [
        {
          parameters,
          name: "HTTP Request",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4.2,
          position: [260, 300],
        },
      ],
      connections: {},
    };

    return JSON.stringify(n8nWorkflow, null, 2) + "\n";
  }

  if (targetPlatform === "make-http") {
    const makeBlueprint = {
      subflows: [
        {
          flow: [
            {
              id: 1,
              module: "http:ActionSendData",
              version: 3,
              parameters: {
                handleErrors: true,
                useNewZLibDeCompress: true,
              },
              mapper: {
                url: parsed.url,
                serializeUrl: false,
                method: effectiveMethod.toLowerCase(),
                headers: finalHeaders,
                qs: queryParams,
                bodyType: parsed.formParts.length > 0 ? "multipart_form_data" : "raw",
                parseResponse: true,
                contentType: contentTypeValue || (combinedBody ? "application/json" : ""),
                data: combinedBody || "",
                followRedirect: parsed.followRedirects,
                rejectUnauthorized: !parsed.insecure,
              },
            },
          ],
        },
      ],
    };

    return JSON.stringify(makeBlueprint, null, 2) + "\n";
  }

  // n8n-code (JavaScript Code Node for n8n)
  const headersObj: Record<string, string> = {};
  for (const h of finalHeaders) {
    headersObj[h.name] = h.value;
  }

  let bodySnippet = "";
  if (combinedBody) {
    try {
      const j = JSON.parse(combinedBody);
      bodySnippet = `  body: ${JSON.stringify(j, null, 2).replace(/\n/g, "\n  ")},\n  json: true,\n`;
    } catch {
      bodySnippet = `  body: ${JSON.stringify(combinedBody)},\n`;
    }
  }

  return `// Paste inside an n8n Code Node (Run Once for All Items)
const response = await this.helpers.httpRequest({
  method: ${JSON.stringify(effectiveMethod)},
  url: ${JSON.stringify(parsed.url)},
  headers: ${JSON.stringify(headersObj, null, 2).replace(/\n/g, "\n  ")},
${bodySnippet}});

return [{ json: response }];
`;
}
