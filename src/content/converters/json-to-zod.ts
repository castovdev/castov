import type { ConverterMeta } from "@/lib/converters/types";

export const jsonToZodMeta: ConverterMeta = {
  slug: "json-to-zod",
  name: "JSON to Zod Schema",
  title: "JSON to Zod Schema Converter",
  metaDescription: "Convert raw JSON into strict, production-ready Zod schemas. Supports ISO datetime offsets, email, URLs, nullish options, and inferred TypeScript types in browser.",
  category: "JSON & Schemas",
  inputLanguage: "json",
  outputLanguage: "typescript",
  outputExtension: ".ts",
  copyButtonLabel: "Copy Schema",
  isQualityApproved: true,
  isIndexed: true,

  initialOutput: `// Target: Zod v4 (Stable)
import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  email: z.email(),
  website: z.url(),
  role: z.string(),
  loginCount: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  tags: z.array(z.string()),
  profile: z.object({
    avatarUrl: z.url(),
    bio: z.unknown().nullable(),
    twoFactorEnabled: z.boolean(),
  }),
  auditLog: z.array(z.object({
    action: z.string(),
    reason: z.string().optional(),
    timestamp: z.iso.datetime({ offset: true }),
  })),
});

export type User = z.infer<typeof UserSchema>;
`,

  defaultSample: JSON.stringify(
    {
      id: "usr_99x82",
      email: "alex.mercer@cyberdyne.io",
      website: "https://castov.com",
      role: "admin",
      loginCount: 42,
      isActive: true,
      createdAt: "2026-11-01T20:30:00+01:00",
      tags: ["security", "audit", "lead"],
      profile: {
        avatarUrl: "https://castov.com/avatars/alex.png",
        bio: null,
        twoFactorEnabled: true,
      },
      auditLog: [
        { action: "login", timestamp: "2026-11-01T20:00:00Z" },
        { action: "revoke_key", timestamp: "2026-11-01T20:15:00Z", reason: "compromised" }
      ]
    },
    null,
    2
  ),

  optionsConfig: [
    {
      id: "rootName",
      label: "Root Schema Name",
      type: "text",
      defaultValue: "UserSchema",
      description: "Name of the exported Zod schema constant",
    },
    {
      id: "zodVersion",
      label: "Target Zod Version",
      type: "select",
      defaultValue: "v4",
      options: [
        { label: "Zod v4 (Stable)", value: "v4" },
        { label: "Zod v3 (Standard)", value: "v3" },
      ],
      description: "Target syntax for stable Zod v4 or standard Zod v3",
    },
    {
      id: "nullHandling",
      label: "Null Values Handling",
      type: "select",
      defaultValue: "nullable",
      options: [
        { label: "z.unknown().nullable() (Safe)", value: "nullable" },
        { label: "z.null() (Strict)", value: "null" },
        { label: ".nullish() (Allow Null & Undefined)", value: "nullish" },
      ],
      description: "How JSON null values are typed in schema",
    },
    {
      id: "strictMode",
      label: "Strict Mode (.strict())",
      type: "boolean",
      defaultValue: false,
      description: "Disallow unrecognized keys on objects instead of stripping them",
    },
  ],

  deepDive: {
    overview: "TypeScript types exist only at compile time and disappear completely in production JavaScript. When your application receives unknown JSON from external APIs, webhooks (e.g., Stripe or GitHub), or user submissions, trusting plain TypeScript interfaces creates blind spots. Zod validates incoming data at runtime and infers matching compile-time types via z.infer, protecting your application from malformed payloads.",
    whyDevelopersUseThis: [
      "Guarantees runtime validation for Next.js Server Actions, Route Handlers, and Express endpoints before data reaches database models.",
      "Eliminates hours of manually writing and maintaining verbose Zod schemas for complex third-party API payloads.",
      "Integrates natively with frontend form validation libraries such as React Hook Form via @hookform/resolvers/zod.",
      "Provides granular error messages highlighting exact path, line, and expected type when validation fails."
    ],
    commonPitfalls: [
      {
        pitfall: "Using z.date() on raw JSON parsed payloads",
        solution: "JSON.parse() produces strings, not JavaScript Date objects. Using z.date() will always fail validation on JSON strings because typeof string !== 'object'. Use z.string().datetime() or z.coerce.date() to parse strings into Date instances during validation."
      },
      {
        pitfall: "Omitting { offset: true } in z.string().datetime()",
        solution: "By default in Zod v3, z.string().datetime() only accepts UTC strings strictly ending in 'Z'. If an API returns an ISO timestamp with a timezone offset like +02:00 or -05:00, validation will fail. Always specify z.string().datetime({ offset: true }) unless UTC 'Z' is strictly required."
      },
      {
        pitfall: "Confusing .optional() with .nullable()",
        solution: "In JSON, an omitted property is undefined, whereas a property set to null is explicitly present. Use .optional() when a key may be missing, .nullable() when the key exists with a null value, and .nullish() if both conditions are permitted."
      }
    ]
  },

  edgeCases: [
    {
      title: "ISO-8601 Timestamps with Timezone Offsets",
      scenario: "APIs frequently return ISO dates with local timezone offsets (+01:00, -04:00) rather than strict UTC 'Z'.",
      inputSnippet: `{\n  "event_time": "2026-11-01T22:30:00+02:00",\n  "api_endpoint": "https://api.castov.com/v1/telemetry"\n}`,
      outputSnippet: `export const EventSchema = z.object({\n  event_time: z.string().datetime({ offset: true }),\n  api_endpoint: z.string().url(),\n});`,
      explanation: "Using { offset: true } prevents validation failures on RFC-3339 timestamps that include nonzero timezone offsets."
    },
    {
      title: "Heterogeneous Object Arrays (Inconsistent Keys)",
      scenario: "Arrays of objects where certain keys appear in some items but are absent in others.",
      inputSnippet: `[\n  { "id": 1, "status": "active" },\n  { "id": 2, "status": "pending", "retryCount": 3 }\n]`,
      outputSnippet: `export const RootSchema = z.array(z.object({\n  id: z.number().int(),\n  retryCount: z.number().int().optional(),\n  status: z.string(),\n}));`,
      explanation: "The engine merges sibling keys across array elements, marking keys absent in any element as .optional() automatically."
    },
    {
      title: "Explicit Nulls vs Dynamic Values",
      scenario: "Fields like bio, middleName, or deletedAt that frequently contain null.",
      inputSnippet: `{\n  "username": "alex",\n  "bio": null\n}`,
      outputSnippet: `export const RootSchema = z.object({\n  username: z.string(),\n  bio: z.unknown().nullable(),\n});`,
      explanation: "Mapping null to z.unknown().nullable() provides a safe placeholder that permits valid null values while flagging missing keys."
    }
  ],

  faqs: [
    {
      question: "How do I infer TypeScript types from the generated Zod schema?",
      answer: "Use Zod's z.infer utility type: `type User = z.infer<typeof UserSchema>;`. This creates a TypeScript type that stays synchronized with your schema without maintaining separate interface definitions."
    },
    {
      question: "Does Zod validation introduce performance overhead?",
      answer: "Yes, runtime schema validation executes JavaScript parsing logic for every validated payload. For standard API requests, this overhead is minimal (microseconds for typical payloads), but for high-throughput batch pipelines processing millions of records per second, you should validate at application boundaries rather than inside tight inner loops."
    },
    {
      question: "Why does z.string().datetime() fail on some ISO strings?",
      answer: "Zod v3's default datetime validator requires strings to end with UTC 'Z'. ISO-8601 strings with timezone offsets (such as +02:00) require passing the `{ offset: true }` option to pass validation."
    },
    {
      question: "Is this conversion processed securely on my machine?",
      answer: "Yes. Castov executes all schema generation 100% client-side inside your browser engine. No JSON payloads or schema definitions are ever transmitted across the network."
    }
  ],

  relatedSlugs: ["json-to-typescript", "sql-to-prisma", "curl-to-fetch", "yaml-to-json"]
};
