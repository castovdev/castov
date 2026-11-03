import type { ConverterMeta } from "@/lib/converters/types";

export const curlToN8nMeta: ConverterMeta = {
  slug: "curl-to-n8n",
  name: "cURL to n8n & Make.com",
  title: "cURL to n8n & Make.com HTTP Node Converter",
  metaDescription:
    "Convert cURL commands into ready-to-paste n8n HTTP Request Node v4.2 JSON workflows, Make.com HTTP blueprints, or n8n Code Node scripts 100% locally.",
  category: "API & Network",
  inputLanguage: "bash",
  outputLanguage: "json",
  outputExtension: ".json",
  copyButtonLabel: "Copy n8n Node JSON",
  isQualityApproved: true,
  isIndexed: true,

  defaultSample: `curl -X POST 'https://api.castov.com/v1/orders?notify=true' \\
  -H 'Authorization: Bearer sk_test_dummy_token' \\
  -H 'Content-Type: application/json' \\
  --data-raw '{"customerId":"cus_9921","items":[{"sku":"PRO-PLAN","qty":1}]}'`,

  initialOutput: `{
  "nodes": [
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.castov.com/v1/orders",
        "authentication": "none",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "notify",
              "value": "true"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer sk_test_dummy_token"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "{\\n  \\"customerId\\": \\"cus_9921\\",\\n  \\"items\\": [\\n    {\\n      \\"sku\\": \\"PRO-PLAN\\",\\n      \\"qty\\": 1\\n    }\\n  ]\\n}",
        "options": {}
      },
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        260,
        300
      ]
    }
  ],
  "connections": {}
}
`,

  optionsConfig: [
    {
      id: "targetPlatform",
      label: "Automation Target",
      type: "select",
      defaultValue: "n8n-node",
      options: [
        { label: "n8n HTTP Request Node v4.2 (Paste to Canvas)", value: "n8n-node" },
        { label: "n8n Code Node (this.helpers.httpRequest)", value: "n8n-code" },
        { label: "Make.com HTTP Module Blueprint JSON (Experimental / untested)", value: "make-http" },
      ],
      description: "Choose n8n canvas node JSON, n8n JS Code node, or Make.com blueprint (Experimental / untested)",
    },
    {
      id: "stripBrowserNoise",
      label: "Strip Chrome DevTools Noise Headers",
      type: "boolean",
      defaultValue: true,
      description: "Remove sec-ch-ua, sec-fetch-*, and priority headers from Copy as cURL",
    },
  ],

  deepDive: {
    overview:
      "Workflow automation engineers using n8n frequently need to translate API documentation examples or Chrome DevTools `Copy as cURL` requests into visual `HTTP Request` nodes. While n8n includes a basic cURL import modal, it often struggles with shell-escaped JSON quotes, `-u` Basic Auth flags, `-b` cookie headers, multipart `-F` uploads, and bloated browser telemetry headers (`sec-ch-ua`, `sec-fetch-*`). Because the output of this converter is a complete `n8n-nodes-base.httpRequest` (typeVersion 4.2) workflow envelope, you can simply click Copy and press `Ctrl+V` (`Cmd+V`) directly onto your n8n canvas to spawn a pre-configured node without exposing your API keys to any server. Note: The Make.com (`http:ActionSendData` v3) blueprint mode is currently marked as Experimental / untested against a live Make.com canvas.",
    whyDevelopersUseThis: [
      "Produces a complete `nodes` workflow JSON envelope that pastes (`Ctrl+V` / `Cmd+V`) directly onto the n8n visual canvas as an `HTTP Request` v4.2 node.",
      "Automatically separates URL query string parameters (`?notify=true&limit=50`) into n8n's structured `queryParameters.parameters` list.",
      "Strips 14 noisy browser telemetry headers (`sec-ch-ua`, `sec-fetch-mode`, `upgrade-insecure-requests`) when importing Chrome DevTools `Copy as cURL` commands.",
      "Supports n8n JavaScript Code Node (`this.helpers.httpRequest`) snippets and an Experimental / untested Make.com (`http:ActionSendData` v3) blueprint output.",
    ],
    commonPitfalls: [
      {
        pitfall: "Pasting raw Chrome DevTools cURL commands into n8n with 15+ browser-only headers",
        solution:
          "Chrome's `Copy as cURL` attaches `sec-ch-ua`, `sec-fetch-site`, and `accept-language` headers that clutter your n8n node and can trigger anti-bot blocks when sent from a server IP. Enable 'Strip Chrome DevTools Noise Headers' to keep only essential API headers.",
      },
      {
        pitfall: "Leaving query parameters hardcoded inside the n8n URL string instead of Query Parameters",
        solution:
          "Splitting `?page=1&limit=100` into n8n's `queryParameters` section makes it easy to bind dynamic expressions (`={{ $json.page }}`) without manual URL encoding issues.",
      },
      {
        pitfall: "Using raw fetch() inside an n8n Code Node when n8n credentials or proxies are needed",
        solution:
          "In n8n Code Nodes, prefer `await this.helpers.httpRequest({ method, url, headers, body, json: true })` so n8n handles JSON parsing, proxy settings, and error logging consistently.",
      },
    ],
  },

  edgeCases: [
    {
      title: "Multipart Form Uploads (-F) and File Fields",
      scenario:
        "A cURL command uploads form fields and files using `-F 'file=@invoice.pdf'` and `-F 'purpose=tax'`.",
      inputSnippet: `curl -X POST https://api.example.com/upload -F 'purpose=tax' -F 'file=@invoice.pdf'`,
      outputSnippet: `"sendBody": true,
"contentType": "multipart-form-data",
"bodyParameters": {
  "parameters": [
    { "name": "purpose", "value": "tax", "parameterType": "formData" },
    { "name": "file", "value": "invoice.pdf", "parameterType": "formBinaryData" }
  ]
}`,
      explanation:
        "Fields prefixed with `@` are mapped to `formBinaryData` in n8n while regular fields map to `formData`.",
    },
    {
      title: "Basic Authentication (-u user:pass) with UTF-8 Characters",
      scenario:
        "A cURL command uses `-u 'client_id:secret_key'` instead of an explicit `Authorization` header.",
      inputSnippet: `curl -u 'my_app:p@ssw0rd' https://api.example.com/token -d 'grant_type=client_credentials'`,
      outputSnippet: `{
  "name": "Authorization",
  "value": "Basic bXlfYXBwOnBAc3N3MHJk"
}`,
      explanation:
        "The `-u` flag is UTF-8 Base64-encoded into a standard `Authorization: Basic ...` header parameter.",
    },
  ],

  faqs: [
    {
      question: "How do I import the generated JSON into my n8n workflow?",
      answer:
        "Click the 'Copy n8n Node JSON' button, open your n8n workflow canvas in the browser, and press `Ctrl+V` (or `Cmd+V` on macOS). n8n automatically recognizes the clipboard JSON and places the configured HTTP Request node onto your canvas.",
    },
    {
      question: "Are my Bearer tokens or Cookies in the cURL command sent to any server?",
      answer:
        "Never. Castov parses the cURL command and builds the n8n / Make.com JSON 100% locally in your browser.",
    },
    {
      question: "Does this support n8n HTTP Request node v4.2?",
      answer:
        "Yes, the generator outputs `typeVersion: 4.2` of `n8n-nodes-base.httpRequest`, compatible with all modern self-hosted and cloud n8n instances.",
    },
  ],

  relatedSlugs: ["curl-to-fetch", "json-to-zod", "webhook-hmac-debugger"],
};
