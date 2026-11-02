import type { ConverterMeta } from "@/lib/converters/types";

export const curlToFetchMeta: ConverterMeta = {
  slug: "curl-to-fetch",
  name: "cURL to Fetch",
  title: "cURL to JavaScript Fetch, Node.js & Axios Converter",
  metaDescription:
    "Convert Chrome Copy as cURL commands into Browser Fetch, Node.js Fetch, or Axios code. Handles -H, -d, --data-raw, -u UTF-8 Basic Auth, -F FormData, -b, -L, and -k.",
  category: "DevOps & Network",
  inputLanguage: "bash",
  outputLanguage: "javascript",
  outputExtension: ".js",
  copyButtonLabel: "Copy Code",
  isQualityApproved: true,
  isIndexed: true,

  defaultSample: `curl -X POST https://api.stripe.com/v1/payment_intents \\
  -u "sk_test_51Nz99a:secret" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: req_88172a" \\
  --data-raw '{"amount": 2900, "currency": "usd", "automatic_payment_methods": {"enabled": true}}'`,

  initialOutput: `// UTF-8 safe Base64 encoding for Basic Auth (avoids btoa InvalidCharacterError on non-ASCII characters)
const encodeBasicAuth = (credentials) => {
  const bytes = new TextEncoder().encode(credentials);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
};

const response = await fetch("https://api.stripe.com/v1/payment_intents", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Idempotency-Key": "req_88172a",
    "Authorization": \`Basic \${encodeBasicAuth("sk_test_51Nz99a:secret")}\`,
  },
  body: JSON.stringify({
    "amount": 2900,
    "currency": "usd",
    "automatic_payment_methods": {
      "enabled": true
    }
  }),
});

if (!response.ok) {
  throw new Error(\`HTTP error! Status: \${response.status}\`);
}

const data = await response.json();
console.log(data);
`,

  optionsConfig: [
    {
      id: "targetClient",
      label: "Target Runtime / Client",
      type: "select",
      defaultValue: "browser-fetch",
      options: [
        { label: "Browser fetch() (Standard)", value: "browser-fetch" },
        { label: "Node.js 18+ fetch() (Buffer)", value: "node-fetch" },
        { label: "Axios (axios.request)", value: "axios" },
      ],
      description: "Switch between Browser Fetch, Node.js Fetch, or Axios",
    },
    {
      id: "syntaxStyle",
      label: "Syntax Style",
      type: "select",
      defaultValue: "async-await",
      options: [
        { label: "async / await (Recommended)", value: "async-await" },
        { label: "Promise .then() Chain", value: "promise-then" },
      ],
      description: "Choose between top-level await or Promise chaining",
    },
    {
      id: "responseParser",
      label: "Response Body Parser",
      type: "select",
      defaultValue: "json",
      options: [
        { label: "response.json()", value: "json" },
        { label: "response.text()", value: "text" },
      ],
      description: "How the HTTP response stream should be consumed",
    },
    {
      id: "includeErrorCheck",
      label: "HTTP Status Check (response.ok)",
      type: "boolean",
      defaultValue: true,
      description: "Throw an explicit Error on HTTP 4xx and 5xx status codes",
    },
    {
      id: "includeCredentials",
      label: "Send Cookies (credentials: include)",
      type: "boolean",
      defaultValue: false,
      description: "Include cross-origin cookies and authentication headers",
    },
  ],

  deepDive: {
    overview:
      "When copying a network request via 'Copy as cURL (bash)' from Chrome DevTools or API reference docs, translating shell flags into JavaScript fetch() or Axios code involves several runtime subtleties. Unlike cURL, browser fetch() enforces CORS preflight rules, does not reject on HTTP 4xx/5xx responses, throws DOMExceptions when plain btoa() encounters UTF-8 characters in -u credentials, and breaks multipart file uploads if a manual Content-Type: multipart/form-data header is copied alongside FormData. This converter parses complex shell quotes, ANSI-C strings, cookies (-b), redirects (-L), and form payloads locally in your browser.",
    whyDevelopersUseThis: [
      "Parses real Chrome DevTools 'Copy as cURL' commands containing --compressed, -b cookies, sec-ch-ua client hints, multiline backslashes, and ANSI-C $'...' strings.",
      "Automatically sets 'Content-Type: application/x-www-form-urlencoded' when -d is used without an explicit Content-Type header, matching cURL's native default.",
      "Encodes -u Basic Auth credentials using a UTF-8 safe TextEncoder + btoa pipeline in Browser Fetch, Buffer.from(..., 'utf8') in Node.js Fetch, or native auth objects in Axios.",
      "Detects -k / --insecure flags and displays a visible security alert explaining TLS verification risks in browser and Node.js environments.",
    ],
    commonPitfalls: [
      {
        pitfall: "CORS blocks requests in Browser fetch() that succeeded in terminal cURL",
        solution:
          "cURL runs in your terminal and completely ignores Cross-Origin Resource Sharing (CORS) headers. When you run the exact same request inside a browser tab via fetch(), the browser sends an OPTIONS preflight request (especially when custom headers like Authorization are present) and blocks the response if Access-Control-Allow-Origin is missing. Furthermore, browsers forbid JavaScript from setting restricted headers like Cookie, Host, or User-Agent directly. Run the generated code in a Node.js backend route or API proxy if the target server does not allow browser CORS.",
      },
      {
        pitfall: "Using raw btoa() on Basic Auth credentials (-u) containing UTF-8 characters",
        solution:
          "The browser's built-in `btoa()` function only accepts Latin1 (ISO-8859-1) code points. If a password contains Unicode characters (such as `pässwörd` or emojis), `btoa()` throws `InvalidCharacterError`. Always encode credentials into UTF-8 bytes via `new TextEncoder().encode()` before converting to Base64, or use `Buffer.from(str, 'utf8').toString('base64')` in Node.js.",
      },
      {
        pitfall: "Forgetting that cURL -d defaults to application/x-www-form-urlencoded",
        solution:
          "When you run `curl -d 'a=1&b=2'`, cURL automatically sends `Content-Type: application/x-www-form-urlencoded`. In contrast, passing a plain string body to `fetch()` defaults to `text/plain;charset=UTF-8`, which causes many backend form parsers (like Express `urlencoded` or PHP `$_POST`) to ignore the body unless the header is explicitly added.",
      },
      {
        pitfall: "Manually setting 'Content-Type: multipart/form-data' when using FormData (-F)",
        solution:
          "When passing a `new FormData()` instance to `fetch({ body: formData })`, you must omit the `Content-Type` header so the browser can automatically append the generated `; boundary=----WebKitFormBoundary...` parameter.",
      },
    ],
  },

  edgeCases: [
    {
      title: "Chrome DevTools 'Copy as cURL' (--compressed, -b Cookies & Client Hints)",
      scenario:
        "Converting a real Chrome DevTools cURL command containing --compressed, -b session cookies, and multiple quoted headers.",
      inputSnippet: `curl 'https://api.example.com/v2/profile' \\\n  -H 'accept: application/json' \\\n  -H 'sec-ch-ua: "Chromium";v="128"' \\\n  -b 'session_id=xyz987; theme=dark' \\\n  --compressed`,
      outputSnippet: `const response = await fetch("https://api.example.com/v2/profile", {\n  method: "GET",\n  headers: {\n    "accept": "application/json",\n    "sec-ch-ua": "\\"Chromium\\";v=\\"128\\"",\n    "Cookie": "session_id=xyz987; theme=dark",\n  },\n});`,
      explanation:
        "The tokenizer unescapes nested quotes inside `sec-ch-ua`, converts `-b` into a consolidated `Cookie` header, and strips `--compressed` cleanly because browsers negotiate Brotli/Gzip decompression automatically.",
    },
    {
      title: "Default -d Form-Urlencoded vs Explicit -k Insecure Flag",
      scenario:
        "Using -d without a Content-Type header alongside -L (follow redirects) and -k (--insecure).",
      inputSnippet: `curl -L -k https://internal.example.local/login -d "user=admin&token=42"`,
      outputSnippet: `// ⚠️ SECURITY WARNING (-k / --insecure detected):\n// cURL's -k flag disables TLS/SSL certificate verification, exposing requests to Man-in-the-Middle (MitM) attacks.\n// Browser fetch() strictly enforces HTTPS certificates and cannot bypass TLS validation from client-side code.\n\nconst response = await fetch("https://internal.example.local/login", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/x-www-form-urlencoded",\n  },\n  redirect: "follow",\n  body: "user=admin&token=42",\n});`,
      explanation:
        "The converter automatically injects `Content-Type: application/x-www-form-urlencoded` for `-d`, maps `-L` to `redirect: \"follow\"`, and emits a prominent warning for `-k`.",
    },
    {
      title: "Multipart Form Uploads (-F / --form) & UTF-8 Basic Auth (-u)",
      scenario:
        "Uploading form fields and file attachments using -F flags.",
      inputSnippet: `curl -X POST https://api.example.com/upload -F "purpose=assistants" -F "file=@report.pdf"`,
      outputSnippet: `const formData = new FormData();\nformData.append("purpose", "assistants");\n// Note: Replace Blob placeholder with an actual File or Blob input for "report.pdf"\nformData.append("file", new Blob([]), "report.pdf");\n\nconst response = await fetch("https://api.example.com/upload", {\n  method: "POST",\n  body: formData,\n});`,
      explanation:
        "Each `-F` entry is appended to a `FormData` object, file paths prefixed with `@` generate a 3-argument `formData.append(key, blob, filename)` call, and any manual `multipart/form-data` header is omitted so the browser can inject the multipart boundary.",
    },
  ],

  faqs: [
    {
      question: "Why does my cURL command work in the terminal, but fail with a CORS error in Browser fetch()?",
      answer:
        "Browsers enforce the Same-Origin Policy and require the target server to return `Access-Control-Allow-Origin` headers. Terminal `curl` does not enforce CORS. If you are calling a third-party API that blocks browser requests or requires secret API keys, switch the **Target Runtime / Client** option above to **Node.js 18+ fetch()** or **Axios** and execute the request from a server-side route.",
    },
    {
      question: "How does this converter handle -d vs --data-raw in cURL?",
      answer:
        "Both `-d` and `--data-raw` set the request payload and switch the default HTTP method to `POST`. When no explicit `Content-Type` header is provided in the cURL command, our engine automatically adds `Content-Type: application/x-www-form-urlencoded` to match cURL's specification.",
    },
    {
      question: "Why do you use TextEncoder with btoa() instead of plain btoa() for -u Basic Auth?",
      answer:
        "Standard `btoa()` throws an `InvalidCharacterError` in browsers if the username or password contains any non-ASCII UTF-8 characters (such as accented letters or symbols). Converting the string to UTF-8 bytes via `TextEncoder` first makes Base64 encoding safe for all Unicode strings.",
    },
    {
      question: "Are my API keys, cookies, or Authorization headers sent to a server?",
      answer:
        "No. Every cURL command you paste — including Bearer tokens, `-b` session cookies, and `-u` credentials — is parsed 100% locally inside your browser using JavaScript.",
    },
  ],

  relatedSlugs: ["json-to-typescript", "json-to-zod", "yaml-to-json"],
};
