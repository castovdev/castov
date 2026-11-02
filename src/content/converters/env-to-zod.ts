import type { ConverterMeta } from "@/lib/converters/types";

export const envToZodMeta: ConverterMeta = {
  slug: "env-to-zod",
  name: ".env to Zod & T3 Env",
  title: ".env to Zod & T3 Env Schema Generator",
  metaDescription:
    "Convert .env files into Zod v4, Zod v3, or @t3-oss/env-nextjs schemas in your browser. Infers types without exposing secret values and generates .env.example.",
  category: "JSON & Schemas",
  inputLanguage: "dotenv",
  outputLanguage: "typescript",
  outputExtension: ".ts",
  copyButtonLabel: "Copy Schema",
  isQualityApproved: true,
  isIndexed: true,

  defaultSample: `# Server & Database Configuration (Dummy Sample Values)
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://db_user:dummy_password@localhost:5432/app_dev
REDIS_URL=redis://localhost:6379
STRIPE_SECRET_KEY=sk_live_dummy_key_val
STRIPE_WEBHOOK_SECRET=whsec_dummy_secret_val
ENABLE_RATE_LIMIT=true
ADMIN_EMAIL=ops@example.com
OPTIONAL_SENTRY_DSN=

# Next.js Public Client Variables
NEXT_PUBLIC_APP_URL=https://app.example.com
NEXT_PUBLIC_ENABLE_ANALYTICS=false`,

  initialOutput: `// Target: Zod v4 (Stable) — Values scrubbed, only types inferred
import { z } from "zod";

export const envSchema = z.object({
  /** Server & Database Configuration (Dummy Sample Values) */
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  /** ⚠️ Sensitive — never log or expose to client bundles */
  STRIPE_SECRET_KEY: z.string().min(1),
  /** ⚠️ Sensitive — never log or expose to client bundles */
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  ENABLE_RATE_LIMIT: z.stringbool(),
  ADMIN_EMAIL: z.email(),
  OPTIONAL_SENTRY_DSN: z.string().optional(),
  /** Next.js Public Client Variables */
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.stringbool(),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
`,

  optionsConfig: [
    {
      id: "outputMode",
      label: "Output Target",
      type: "select",
      defaultValue: "zod-v4",
      options: [
        { label: "Zod v4 Schema (Stable)", value: "zod-v4" },
        { label: "Zod v3 Schema (Standard)", value: "zod-v3" },
        { label: "@t3-oss/env-nextjs (createEnv)", value: "t3-env" },
        { label: "Safe .env.example (Scrubbed)", value: "env-example" },
      ],
      description: "Choose Zod v4, Zod v3, T3 Env, or safe .env.example",
    },
    {
      id: "t3RuntimeStyle",
      label: "T3 Runtime Mapping",
      type: "select",
      defaultValue: "experimental__runtimeEnv",
      options: [
        {
          label: "experimental__runtimeEnv (Next.js >= 13.4.4 Client Only)",
          value: "experimental__runtimeEnv",
        },
        {
          label: "runtimeEnv (Full Server + Client Mapping)",
          value: "runtimeEnv",
        },
      ],
      description: "Destructure client-only or all variables in T3 Env mode",
    },
    {
      id: "nodeEnvAsEnum",
      label: "NODE_ENV as z.enum()",
      type: "boolean",
      defaultValue: true,
      description: "Map NODE_ENV to z.enum(['development', 'production', 'test'])",
    },
    {
      id: "schemaName",
      label: "Schema Identifier",
      type: "text",
      defaultValue: "envSchema",
      description: "Exported Zod schema variable name",
    },
  ],

  deepDive: {
    overview:
      "Environment variables in Node.js and Next.js are always loaded from .env files as raw strings (or undefined when missing). Relying on unvalidated process.env access scatters string-to-number and string-to-boolean conversions across your codebase and risks runtime failures when a required secret or connection string is missing in production. Generating a strict Zod v4, Zod v3, or @t3-oss/env-nextjs schema validates your configuration at application startup while keeping raw secret values completely out of your source code.",
    whyDevelopersUseThis: [
      "Zero secret exposure: The engine inspects value patterns locally in your browser to infer types (URLs, ports, booleans, emails) and never prints raw secret values in the generated code.",
      "Eliminates the repetitive @t3-oss/env-nextjs boilerplate of declaring every variable across server, client, and runtimeEnv blocks.",
      "Prevents the classic JavaScript Boolean('false') === true bug by using z.stringbool() in Zod v4 or strict enum transforms in Zod v3.",
      "Flags accidental NEXT_PUBLIC_ secret leaks (such as NEXT_PUBLIC_STRIPE_SECRET_KEY) before they are bundled into browser JavaScript.",
    ],
    commonPitfalls: [
      {
        pitfall:
          "Calling envSchema.parse(process.env) inside Next.js Client Components",
        solution:
          "Next.js bundlers (Webpack and Turbopack) do not pass the full process.env object to the browser; they only inline literal property accesses like process.env.NEXT_PUBLIC_APP_URL at build time. In the browser, process.env evaluates to an empty object {}, causing envSchema.parse(process.env) to throw a ZodError for every variable. Use @t3-oss/env-nextjs with experimental__runtimeEnv (or explicit runtimeEnv destructuring) so Next.js can inline NEXT_PUBLIC_ variables safely.",
      },
      {
        pitfall:
          "Using z.coerce.boolean() on environment variables (turns \"false\" into true)",
        solution:
          "Under the hood, z.coerce.boolean() calls JavaScript's Boolean(value) constructor. Because any non-empty string in JavaScript is truthy, Boolean(\"false\") and Boolean(\"0\") both evaluate to true! Always use z.stringbool() in Zod v4 or z.enum([\"true\", \"false\"]).transform((v) => v === \"true\") in Zod v3.",
      },
      {
        pitfall:
          "Typing every variable three times manually in @t3-oss/env-nextjs",
        solution:
          "When configuring createEnv() manually, developers have to maintain server keys, client NEXT_PUBLIC_ keys, and the runtimeEnv mapping in sync. Switching the Output Target to '@t3-oss/env-nextjs (createEnv)' partitions server and client keys automatically and generates either experimental__runtimeEnv (for Next.js >= 13.4.4 client keys) or full runtimeEnv.",
      },
    ],
  },

  edgeCases: [
    {
      title: "Non-HTTP Connection Strings (postgresql://, redis://, mongodb+srv://)",
      scenario:
        "Database and cache URLs use custom URI schemes rather than http:// or https://, which naive regex matchers misclassify as plain strings.",
      inputSnippet: `DATABASE_URL=postgresql://user:pass@localhost:5432/prod\nREDIS_URL=redis://127.0.0.1:6379\nEMPTY_OPTIONAL_KEY=`,
      outputSnippet: `export const envSchema = z.object({\n  DATABASE_URL: z.url(),\n  REDIS_URL: z.url(),\n  EMPTY_OPTIONAL_KEY: z.string().optional(),\n});`,
      explanation:
        "Our parser recognizes any valid RFC-3986 URI scheme (postgresql://, redis://, amqp://, wss://) as a URL validator and maps empty keys to z.string().optional().",
    },
    {
      title: "Quoted Hash Characters (#), export Prefixes, and Multiline Keys",
      scenario:
        "Shell-compatible .env files often prefix variables with `export`, include `#` characters inside quoted passwords, or span PEM keys across multiple lines.",
      inputSnippet: `export API_PORT=8080 # inline comment\nREDIS_PASSWORD="p@ss#word#with#hash"\nJWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC\n-----END PRIVATE KEY-----"`,
      outputSnippet: `export const envSchema = z.object({\n  API_PORT: z.coerce.number().int().positive(),\n  /** ⚠️ Sensitive — never log or expose to client bundles */\n  REDIS_PASSWORD: z.string().min(1),\n  /** ⚠️ Sensitive — never log or expose to client bundles */\n  JWT_PRIVATE_KEY: z.string().min(1),\n});`,
      explanation:
        "The lexer strips `export `, ignores `#` comments outside quotes while preserving `#` inside quotes, collapses multiline quoted strings into a single variable, and never leaks the raw secret into the output.",
    },
    {
      title: "Detecting Accidental NEXT_PUBLIC_ Secret Leaks",
      scenario:
        "Prefixing a sensitive API key or webhook secret with NEXT_PUBLIC_ causes Next.js to inline the secret directly into public client JavaScript bundles.",
      inputSnippet: `NEXT_PUBLIC_APP_URL=https://castov.com\nNEXT_PUBLIC_STRIPE_SECRET_KEY=sk_live_0000000000`,
      outputSnippet: `// ⚠️ PUBLIC SECRET WARNING (NEXT_PUBLIC_STRIPE_SECRET_KEY): Variables prefixed with NEXT_PUBLIC_ are inlined into client-side JavaScript bundles!\nexport const envSchema = z.object({\n  NEXT_PUBLIC_APP_URL: z.url(),\n  /** ⚠️ SECURITY WARNING: NEXT_PUBLIC_ exposes 'NEXT_PUBLIC_STRIPE_SECRET_KEY' to browser bundles! */\n  NEXT_PUBLIC_STRIPE_SECRET_KEY: z.string().min(1),\n});`,
      explanation:
        "Whenever a NEXT_PUBLIC_ variable name contains SECRET, KEY, TOKEN, or PASSWORD, both the code output and UI banner trigger an immediate security warning.",
    },
  ],

  faqs: [
    {
      question: "Are my .env secret values ever sent to a server or included in the output?",
      answer:
        "No. Conversion runs 100% client-side in your browser with zero network requests. Furthermore, our generator only inspects the format of each value (to determine whether it is a URL, integer, boolean, or email) and discards the value itself—your actual secrets never appear in the generated Zod schema.",
    },
    {
      question: "Why does z.coerce.boolean() fail on 'false' in .env files?",
      answer:
        "In JavaScript, process.env values are strings, and z.coerce.boolean() passes the raw string to Boolean(val). Since Boolean('false') is true for any non-empty string, setting FEATURE_FLAG=false in your .env file evaluates to true at runtime! Our Zod v4 mode outputs z.stringbool() and our Zod v3 mode outputs z.enum(['true', 'false']).transform((v) => v === 'true') to handle boolean strings safely.",
    },
    {
      question: "What is the difference between runtimeEnv and experimental__runtimeEnv in @t3-oss/env-nextjs?",
      answer:
        "In Next.js < 13.4.4, you had to manually list every server and client variable inside runtimeEnv. Starting in Next.js 13.4.4, you only need to destructure client-side NEXT_PUBLIC_ variables inside experimental__runtimeEnv while server variables are read automatically from process.env.",
    },
    {
      question: "How can I generate a clean .env.example file to commit to Git?",
      answer:
        "Click the 'Generate Safe .env.example' button in the toolbar or select 'Safe .env.example (Scrubbed)' in Output Target. It preserves your section comments and variable names while replacing real credentials with safe dummy placeholders.",
    },
  ],

  relatedSlugs: [
    "json-to-zod",
    "json-to-typescript",
    "yaml-to-json",
    "sql-to-prisma",
  ],
};
