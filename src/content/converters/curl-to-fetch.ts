import type { ConverterMeta } from "@/lib/converters/types";

export const curlToFetchMeta: ConverterMeta = {
  slug: "curl-to-fetch",
  name: "cURL to Fetch",
  title: "cURL to JavaScript Fetch Converter",
  metaDescription:
    "Convert cURL commands into modern JavaScript or TypeScript fetch() code in browser. Handles -H headers, -d / --data-raw payloads, -u Basic Auth, and -F FormData.",
  category: "DevOps & Network",
  inputLanguage: "bash",
  outputLanguage: "javascript",
  outputExtension: ".js",
  isQualityApproved: true,
  isIndexed: true,

  defaultSample: `curl -X POST https://api.stripe.com/v1/payment_intents \\
  -u "sk_test_51Nz99a:secret" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: req_88172a" \\
  --data-raw '{"amount": 2900, "currency": "usd", "automatic_payment_methods": {"enabled": true}}'`,

  initialOutput: `const response = await fetch("https://api.stripe.com/v1/payment_intents", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Idempotency-Key": "req_88172a",
    "Authorization": \`Basic \${btoa("sk_test_51Nz99a:secret")}\`,
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
      "When copying a network request as cURL from Chrome DevTools or API documentation (such as Stripe, GitHub, or OpenAI), translating shell flags into native JavaScript fetch() calls involves several subtle traps. Unlike cURL, fetch() does not reject on HTTP 4xx/5xx responses, requires explicit Base64 encoding for -u Basic Auth, and breaks multipart file uploads if you manually copy a Content-Type: multipart/form-data header alongside FormData. This converter parses shell quotes, multiline backslashes, and flags locally in your browser.",
    whyDevelopersUseThis: [
      "Parses shell-quoted arguments (-H, -d, --data-raw, -X, -u, -F) including multiline backslash continuations and ANSI-C $'...' strings copied from Chrome DevTools.",
      "Automatically formats JSON request bodies passed via -d or --data-raw into readable JSON.stringify({...}) objects instead of opaque escaped strings.",
      "Converts -u user:password flags into standard Authorization: Basic ${btoa(...)} headers.",
      "Translates -F / --form multipart flags into native FormData instances while stripping manual multipart/form-data headers so the browser can attach the boundary token.",
    ],
    commonPitfalls: [
      {
        pitfall: "Assuming fetch() throws an error on HTTP 404 or 500",
        solution:
          "The native fetch() Promise only rejects on network failure or DNS/CORS errors. An HTTP 401, 404, or 500 still resolves normally with response.ok set to false. Always check `if (!response.ok)` before calling `response.json()`.",
      },
      {
        pitfall: "Manually setting 'Content-Type: multipart/form-data' when using FormData (-F)",
        solution:
          "When passing a `new FormData()` instance to `fetch({ body: formData })`, you must omit the `Content-Type` header. The browser automatically sets `Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...`. Setting it manually omits the boundary and causes the server parser to fail.",
      },
      {
        pitfall: "Forgetting that -d implies POST even without -X POST",
        solution:
          "In cURL, passing `-d`, `--data`, `--data-raw`, or `-F` automatically switches the HTTP method from GET to POST unless `-G` (`--get`) or an explicit `-X` flag is provided.",
      },
    ],
  },

  edgeCases: [
    {
      title: "Basic Authentication (-u / --user)",
      scenario:
        "Converting a cURL command that uses the -u flag for HTTP Basic Authentication alongside custom headers.",
      inputSnippet: `curl -u "client_id:client_secret" https://oauth.example.com/token -d "grant_type=client_credentials"`,
      outputSnippet: `const response = await fetch("https://oauth.example.com/token", {\n  method: "POST",\n  headers: {\n    "Authorization": \`Basic \${btoa("client_id:client_secret")}\`,\n  },\n  body: "grant_type=client_credentials",\n});`,
      explanation:
        "The -u flag is converted into an Authorization header using Base64 encoding (`btoa`), and the presence of `-d` automatically infers `method: \"POST\"`.",
    },
    {
      title: "Multipart Form Uploads (-F / --form)",
      scenario:
        "Uploading form fields and file attachments using -F flags.",
      inputSnippet: `curl -X POST https://api.example.com/upload -F "purpose=assistants" -F "file=@report.pdf"`,
      outputSnippet: `const formData = new FormData();\nformData.append("purpose", "assistants");\n// Note: Replace Blob placeholder with an actual File or Blob input for "report.pdf"\nformData.append("file", new Blob([]), "report.pdf");\n\nconst response = await fetch("https://api.example.com/upload", {\n  method: "POST",\n  body: formData,\n});`,
      explanation:
        "Each `-F` entry is appended to a `FormData` object, file paths prefixed with `@` generate a 3-argument `formData.append(key, blob, filename)` call, and any manual `multipart/form-data` header is omitted so the browser can inject the multipart boundary.",
    },
    {
      title: "Multiple -d Flags & --data-raw JSON",
      scenario:
        "Combining multiple -d flags into a URL-encoded body or parsing raw JSON payloads containing special characters.",
      inputSnippet: `curl https://api.example.com/search -G -d "q=typescript" -d "limit=20"`,
      outputSnippet: `const response = await fetch("https://api.example.com/search?q=typescript&limit=20", {\n  method: "GET",\n});`,
      explanation:
        "When `-G` (`--get`) is present, multiple `-d` flags are joined with `&` and appended directly to the request URL query string while preserving `method: \"GET\"`.",
    },
  ],

  faqs: [
    {
      question: "How does this converter handle -d vs --data-raw in cURL?",
      answer:
        "In cURL, `--data-raw` behaves identically to `-d` (`--data`) except that it treats the `@` character literally instead of reading from a local file. Both flags set the request payload and default the HTTP method to `POST`. If the payload is valid JSON, our engine formats it cleanly inside `JSON.stringify(...)`.",
    },
    {
      question: "Why does the generated code check 'if (!response.ok)'?",
      answer:
        "Unlike Axios or cURL with `--fail`, the browser `fetch()` API does not throw an exception when the server returns an HTTP 400, 401, 404, or 500 status code. Checking `if (!response.ok)` ensures your application catches HTTP error responses before attempting to parse the body.",
    },
    {
      question: "How are -F multipart file uploads converted to Fetch?",
      answer:
        "When `-F` or `--form` flags are detected, the converter constructs a native `FormData` instance and calls `formData.append(key, value)` for each field. It also strips any explicit `Content-Type: multipart/form-data` header because `fetch()` must generate the multipart boundary string automatically.",
    },
    {
      question: "Are my API keys or Authorization headers sent to a server when I paste a cURL command?",
      answer:
        "No. Every cURL command you paste — including Bearer tokens, session cookies, and `-u` credentials — is parsed 100% locally inside your browser using JavaScript. No network requests are made.",
    },
  ],

  relatedSlugs: ["curl-to-python", "curl-to-axios", "json-to-typescript", "json-to-zod"],
};
