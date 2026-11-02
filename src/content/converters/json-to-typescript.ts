import type { ConverterMeta } from "@/lib/converters/types";

export const jsonToTypescriptMeta: ConverterMeta = {
  slug: "json-to-typescript",
  name: "JSON to TypeScript",
  title: "JSON to TypeScript Interface & Type Converter",
  metaDescription: "Convert JSON payloads into clean TypeScript interfaces or type aliases in browser. Extracts nested interfaces, merges optional array keys, and handles readonly modifiers.",
  category: "JSON & Schemas",
  inputLanguage: "json",
  outputLanguage: "typescript",
  outputExtension: ".d.ts",
  copyButtonLabel: "Copy Types",
  isQualityApproved: true,
  isIndexed: true,

  defaultSample: JSON.stringify(
    {
      id: "ord_77410",
      status: "completed",
      totalCents: 14900,
      currency: "USD",
      isTaxExempt: false,
      discountCode: null,
      "x-request-id": "req_99a81bc",
      customer: {
        id: "cus_301",
        email: "elena.rostova@acme.dev",
        tier: "enterprise",
      },
      lineItems: [
        { sku: "PRO-PLAN-ANNUAL", quantity: 1, unitPriceCents: 12000 },
        { sku: "ADDON-AUDIT-LOG", quantity: 2, unitPriceCents: 1450, notes: "Priority provisioning" },
      ],
    },
    null,
    2
  ),

  initialOutput: `export interface OrderResponse {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  isTaxExempt: boolean;
  discountCode: null;
  "x-request-id": string;
  customer: OrderResponseCustomer;
  lineItems: OrderResponseLineItem[];
}

export interface OrderResponseCustomer {
  id: string;
  email: string;
  tier: string;
}

export interface OrderResponseLineItem {
  notes?: string;
  quantity: number;
  sku: string;
  unitPriceCents: number;
}
`,

  optionsConfig: [
    {
      id: "rootName",
      label: "Root Interface / Type Name",
      type: "text",
      defaultValue: "OrderResponse",
      description: "PascalCase identifier for the root TypeScript declaration",
    },
    {
      id: "declarationStyle",
      label: "Declaration Style",
      type: "select",
      defaultValue: "interface",
      options: [
        { label: "export interface (Recommended)", value: "interface" },
        { label: "export type = { ... }", value: "type" },
      ],
      description: "Choose between extendable interfaces or type aliases",
    },
    {
      id: "nullHandling",
      label: "Null Value Type",
      type: "select",
      defaultValue: "null",
      options: [
        { label: "null (Strict Null)", value: "null" },
        { label: "unknown (Safe Placeholder)", value: "unknown" },
      ],
      description: "Type assigned to JSON properties whose sample value is null",
    },
    {
      id: "extractNested",
      label: "Nested Objects",
      type: "select",
      defaultValue: "true",
      options: [
        { label: "Extract Named Interfaces", value: "true" },
        { label: "Inline Nested Objects", value: "false" },
      ],
      description: "Flatten nested objects into standalone exported types",
    },
    {
      id: "readonlyProps",
      label: "Immutability (readonly)",
      type: "boolean",
      defaultValue: false,
      description: "Prefix all generated properties with readonly",
    },
  ],

  deepDive: {
    overview: "When integrating REST APIs, GraphQL responses, or static configuration files into a TypeScript project, manually writing interface definitions for deeply nested JSON objects is error-prone. A single missing optional modifier (?) on an inconsistent array element can trigger runtime TypeErrors when accessing undefined properties. This converter analyzes the structure of your JSON payload, extracts reusable sub-interfaces, and infers union and optional types.",
    whyDevelopersUseThis: [
      "Extracts deeply nested JSON objects into standalone, named PascalCase interfaces that can be imported directly into React props or service layers.",
      "Inspects every object inside an array rather than only the first element, marking keys missing in sibling items as optional (?).",
      "Automatically quotes non-standard property keys (such as HTTP headers like 'x-request-id' or kebab-case keys) so the output compiles without syntax errors.",
      "Uses unknown instead of any for empty arrays and untyped nulls, complying with strict @typescript-eslint/no-explicit-any rules."
    ],
    commonPitfalls: [
      {
        pitfall: "Assuming TypeScript interfaces validate API data at runtime",
        solution: "TypeScript interfaces and type aliases are completely erased during compilation. If an external API returns a number where your interface expects a string, TypeScript will not throw an error at runtime. If you need runtime payload verification, use our JSON to Zod converter."
      },
      {
        pitfall: "Inferring types from only the first element of an array",
        solution: "Naive converters only inspect array[0]. If array[1] contains an extra optional field or a nullable field, the generated type will be incomplete. Always inspect all elements in a sample array to detect optional properties."
      },
      {
        pitfall: "Using any[] for empty JSON arrays",
        solution: "Typing an empty array [] as any[] silently disables type checking whenever items are pushed or mapped. Use unknown[] until the element structure is known, forcing explicit type narrowing."
      }
    ]
  },

  edgeCases: [
    {
      title: "Heterogeneous Object Arrays (Optional Key Merging)",
      scenario: "An array of objects where some elements include optional metadata fields that are absent in other elements.",
      inputSnippet: `[\n  { "sku": "BASIC", "price": 10 },\n  { "sku": "PRO", "price": 25, "coupon": "SAVE20" }\n]`,
      outputSnippet: `export type OrderResponse = OrderResponseItem[];\n\nexport interface OrderResponseItem {\n  coupon?: string;\n  price: number;\n  sku: string;\n}`,
      explanation: "The engine scans all objects in the array, takes the union of all property keys, and appends the optional '?' modifier to keys that do not appear in every element."
    },
    {
      title: "Hyphenated & Special Character Keys",
      scenario: "JSON payloads containing HTTP headers, namespace prefixes, or numeric keys that are invalid bare TypeScript identifiers.",
      inputSnippet: `{\n  "content-type": "application/json",\n  "@context": "https://schema.org",\n  "200": "OK"\n}`,
      outputSnippet: `export interface HeadersMap {\n  "200": string;\n  "content-type": string;\n  "@context": string;\n}`,
      explanation: "Keys that do not match standard ECMAScript identifier rules (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) are safely quoted with JSON.stringify."
    },
    {
      title: "Mixed Primitive Arrays (Union Types)",
      scenario: "Arrays containing a mix of strings, numbers, or booleans.",
      inputSnippet: `{\n  "coordinates": [40.7128, -74.006, "NYC"]\n}`,
      outputSnippet: `export interface LocationData {\n  coordinates: (number | string)[];\n}`,
      explanation: "Instead of falling back to unknown[], distinct primitive types inside an array are combined into a parenthesized TypeScript union array."
    }
  ],

  faqs: [
    {
      question: "Should I generate a TypeScript 'interface' or a 'type' alias?",
      answer: "For object shapes, `export interface` is generally preferred because it supports declaration merging, `extends` clauses, and produces cleaner error messages in TypeScript compiler output. However, if your root JSON payload is a top-level array or primitive union, a `type` alias is required and generated automatically."
    },
    {
      question: "How are JSON null values typed, and when should I switch between 'null' and 'unknown'?",
      answer: "By default, properties with a `null` value in the JSON sample are typed strictly as `null` (e.g., `discountCode: null;`). If the property is an unpopulated field whose actual runtime type is not yet known from the sample, you can switch the Null Value Type option to `unknown` so it acts as a type-safe placeholder without resorting to `any`."
    },
    {
      question: "How does the 'Immutability (readonly)' option affect the output?",
      answer: "Enabling `readonly` prefixes every property with the `readonly` keyword (e.g., `readonly id: string;`). This prevents accidental mutation of API response objects in Redux state, React props, or functional pipelines at compile time."
    },
    {
      question: "Does this tool send my JSON payload to any server?",
      answer: "No. All JSON parsing and TypeScript AST generation happen 100% locally in your browser using pure JavaScript. Your API payloads never leave your machine."
    }
  ],

  relatedSlugs: ["json-to-zod", "sql-to-prisma", "curl-to-fetch", "yaml-to-json"]
};
