import { describe, it, expect } from "vitest";
import { convert as convertJsonToZod } from "@/lib/converters/engines/json-to-zod";
import { convert as convertJsonToTs, singularize } from "@/lib/converters/engines/json-to-typescript";
import { convert as convertCurlToFetch, encodeBasicAuthUtf8 } from "@/lib/converters/engines/curl-to-fetch";
import { convert as convertYamlToJson } from "@/lib/converters/engines/yaml-to-json";
import { convert as convertSqlToPrisma } from "@/lib/converters/engines/sql-to-prisma";
import {
  convert as convertEnvToZod,
  parseEnvFile,
  generateSafeEnvExample,
} from "@/lib/converters/engines/env-to-zod";
import { convert as convertSqlToDrizzle } from "@/lib/converters/engines/sql-to-drizzle";
import { convert as convertWebhookHmac, hmacSha256 } from "@/lib/converters/engines/webhook-hmac-debugger";
import { convert as convertCurlToN8n } from "@/lib/converters/engines/curl-to-n8n";
import { convert as convertHarSanitizer } from "@/lib/converters/engines/har-sanitizer";
import { jsonToTypescriptMeta } from "@/content/converters/json-to-typescript";
import { MODULAR_CONVERTERS, getModularConverter } from "@/content/converters";

describe("Modular Code Converters Architecture", () => {
  describe("Metadata, <title> Length (<60 chars), & Quality Standards", () => {
    it("registers all 10 modular converters with quality approval and <title> under 60 chars", () => {
      for (const slug of [
        "json-to-zod",
        "json-to-typescript",
        "curl-to-fetch",
        "yaml-to-json",
        "sql-to-prisma",
        "env-to-zod",
        "sql-to-drizzle",
        "webhook-hmac-debugger",
        "curl-to-n8n",
        "har-sanitizer",
      ]) {
        const meta = getModularConverter(slug);
        expect(meta).toBeDefined();
        expect(meta?.slug).toBe(slug);
        expect(meta?.isQualityApproved).toBe(true);
        expect(meta?.isIndexed).toBe(true);
        expect(meta?.initialOutput).toBeTruthy();

        const fullHtmlTitle = `${meta!.title} | Castov`;
        expect(fullHtmlTitle.length).toBeLessThanOrEqual(60);
      }
    });

    it("satisfies strict SEO quality constraints for all modular converters", () => {
      for (const meta of MODULAR_CONVERTERS) {
        expect(meta.edgeCases.length).toBeGreaterThanOrEqual(2);
        expect(meta.faqs.length).toBeGreaterThanOrEqual(3);
        expect(meta.deepDive.whyDevelopersUseThis.length).toBeGreaterThanOrEqual(3);
        expect(meta.deepDive.commonPitfalls.length).toBeGreaterThanOrEqual(2);
        expect(meta.deepDive.overview.length).toBeGreaterThanOrEqual(120);

        const fullContent = JSON.stringify(meta);
        expect(fullContent).not.toContain("zero runtime overhead");
        expect(fullContent).not.toContain("100% type safety");
      }
    });
  });

  describe("JSON to Zod Engine (v3 vs v4 Differentiation)", () => {
    const samplePayload = JSON.stringify({
      createdAt: "2026-11-01T20:30:00+02:00",
      endpoint: "https://castov.com",
      contact: "dev@castov.com",
      userId: "123e4567-e89b-12d3-a456-426614174000",
    });

    it("outputs Zod v3 chained string validators when zodVersion is 'v3'", () => {
      const res = convertJsonToZod(samplePayload, { zodVersion: "v3" });
      expect(res).toContain("Target: Zod v3 (Standard)");
      expect(res).toContain("createdAt: z.string().datetime({ offset: true })");
      expect(res).toContain("endpoint: z.string().url()");
      expect(res).toContain("contact: z.string().email()");
      expect(res).toContain("userId: z.string().uuid()");
    });

    it("outputs Zod v4 top-level format validators when zodVersion is 'v4'", () => {
      const res = convertJsonToZod(samplePayload, { zodVersion: "v4" });
      expect(res).toContain("Target: Zod v4 (Stable)");
      expect(res).toContain("createdAt: z.iso.datetime({ offset: true })");
      expect(res).toContain("endpoint: z.url()");
      expect(res).toContain("contact: z.email()");
      expect(res).toContain("userId: z.uuid()");
    });

    it("merges heterogeneous object arrays with .optional()", () => {
      const input = JSON.stringify([
        { id: 1, name: "Alpha" },
        { id: 2, name: "Beta", tags: ["a", "b"] },
      ]);

      const res = convertJsonToZod(input);
      expect(res).toContain("tags: z.array(z.string()).optional()");
      expect(res).toContain("id: z.number().int()");
      expect(res).toContain("name: z.string()");
    });

    it("supports null handling configurations and strict mode", () => {
      const input = JSON.stringify({ bio: null });

      expect(convertJsonToZod(input, { nullHandling: "nullable" })).toContain("bio: z.unknown().nullable()");
      expect(convertJsonToZod(input, { nullHandling: "null" })).toContain("bio: z.null()");
      expect(convertJsonToZod(input, { nullHandling: "nullish" })).toContain("bio: z.unknown().nullish()");
      expect(convertJsonToZod(input, { rootName: "Product", strictMode: true })).toContain("}).strict();");
    });
  });

  describe("JSON to TypeScript Engine", () => {
    it("generates exported interfaces and extracts nested objects", () => {
      const res = convertJsonToTs(jsonToTypescriptMeta.defaultSample, {
        rootName: "OrderResponse",
        declarationStyle: "interface",
        extractNested: true,
      });

      expect(res).toContain("export interface OrderResponse {");
      expect(res).toContain("discountCode: null;");
      expect(res).toContain('"x-request-id": string;');
      expect(res).toContain("customer: OrderResponseCustomer;");
      expect(res).toContain("lineItems: OrderResponseLineItem[];");
      expect(res).toContain("export interface OrderResponseCustomer {");
      expect(res).toContain("export interface OrderResponseLineItem {");
      expect(res).toContain("notes?: string;");
    });

    it("handles null values as 'null' by default and 'unknown' when nullHandling is 'unknown'", () => {
      const input = JSON.stringify({ discountCode: null, deletedAt: null });

      const strictNullOutput = convertJsonToTs(input, { rootName: "Order", nullHandling: "null" });
      expect(strictNullOutput).toContain("discountCode: null;");
      expect(strictNullOutput).not.toContain("unknown | null");

      const unknownOutput = convertJsonToTs(input, { rootName: "Order", nullHandling: "unknown" });
      expect(unknownOutput).toContain("discountCode: unknown;");
      expect(unknownOutput).not.toContain("unknown | null");
    });

    it("correctly singularizes plural interface names (categories, children, addresses, data, series)", () => {
      expect(singularize("categories")).toBe("Category");
      expect(singularize("children")).toBe("Child");
      expect(singularize("addresses")).toBe("Address");
      expect(singularize("data")).toBe("Data");
      expect(singularize("series")).toBe("Series");

      const payload = JSON.stringify({
        categories: [{ id: 1 }],
        children: [{ name: "Leo" }],
        addresses: [{ zip: "10001" }],
        data: [{ metric: 42 }],
        series: [{ episode: 1 }],
      });

      const res = convertJsonToTs(payload, { rootName: "Payload", extractNested: true });
      expect(res).toContain("categories: PayloadCategory[];");
      expect(res).toContain("children: PayloadChild[];");
      expect(res).toContain("addresses: PayloadAddress[];");
      expect(res).toContain("data: PayloadData[];");
      expect(res).toContain("series: PayloadSeries[];");
      expect(res).toContain("export interface PayloadCategory {");
      expect(res).toContain("export interface PayloadChild {");
      expect(res).toContain("export interface PayloadAddress {");
      expect(res).toContain("export interface PayloadData {");
      expect(res).toContain("export interface PayloadSeries {");
    });

    it("properly quotes weird keys (spaces, leading digits, hyphens) while keeping valid identifiers unquoted", () => {
      const payload = JSON.stringify({
        "first name": "Ada",
        "123start": 99,
        "x-api-key": "secret",
        normalKey: true,
        $valid_ident: "ok",
      });

      const res = convertJsonToTs(payload, { rootName: "WeirdKeys" });
      expect(res).toContain('"first name": string;');
      expect(res).toContain('"123start": number;');
      expect(res).toContain('"x-api-key": string;');
      expect(res).toContain("normalKey: boolean;");
      expect(res).toContain("$valid_ident: string;");
    });

    it("supports type aliases, inline objects, and readonly properties", () => {
      const input = JSON.stringify({
        id: 1,
        meta: { region: "eu-west-1" },
        values: [1, "two"],
      });

      const res = convertJsonToTs(input, {
        rootName: "ConfigPayload",
        declarationStyle: "type",
        extractNested: false,
        readonlyProps: true,
      });

      expect(res).toContain("export type ConfigPayload = {");
      expect(res).toContain("readonly id: number;");
      expect(res).toContain("readonly region: string;");
      expect(res).toContain("readonly values: (number | string)[];");
    });
  });

  describe("cURL to Fetch Engine (-H, -d, -X, --data-raw, -u, -F, -L, -I, -b, --url, --compressed, -k)", () => {
    it("parses real-world Chrome DevTools 'Copy as cURL' with --compressed, -b cookies, and sec-ch-ua headers", () => {
      const chromeCurl = `curl 'https://api.castov.com/v1/projects?page=1' \\
  -H 'accept: application/json, text/plain, */*' \\
  -H 'accept-language: en-US,en;q=0.9,ar;q=0.8' \\
  -H 'cache-control: no-cache' \\
  -b 'session_token=eyJhbGciOiJIUzI1NiJ9; theme=dark' \\
  -H 'origin: https://castov.com' \\
  -H 'referer: https://castov.com/dashboard' \\
  -H 'sec-ch-ua: "Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"' \\
  -H 'sec-ch-ua-mobile: ?0' \\
  -H 'sec-ch-ua-platform: "Windows"' \\
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' \\
  --compressed`;

      const res = convertCurlToFetch(chromeCurl);
      expect(res).toContain('fetch("https://api.castov.com/v1/projects?page=1"');
      expect(res).toContain('method: "GET"');
      expect(res).toContain('"Cookie": "session_token=eyJhbGciOiJIUzI1NiJ9; theme=dark"');
      expect(res).toContain('"sec-ch-ua": "\\"Chromium\\";v=\\"128\\", \\"Not;A=Brand\\";v=\\"24\\", \\"Google Chrome\\";v=\\"128\\""');
      expect(res).toContain('"origin": "https://castov.com"');
    });

    it("parses -H custom headers accurately", () => {
      const cmd = `curl https://api.example.com/users -H "Accept: application/json" -H 'X-Custom-Token: abc-123'`;
      const res = convertCurlToFetch(cmd);
      expect(res).toContain('method: "GET"');
      expect(res).toContain('"Accept": "application/json"');
      expect(res).toContain('"X-Custom-Token": "abc-123"');
    });

    it("parses -d payload, defaults method to POST, and automatically adds Content-Type: application/x-www-form-urlencoded", () => {
      const cmd = `curl https://api.example.com/login -d "username=admin&role=superuser"`;
      const res = convertCurlToFetch(cmd);
      expect(res).toContain('method: "POST"');
      expect(res).toContain('"Content-Type": "application/x-www-form-urlencoded"');
      expect(res).toContain('body: "username=admin&role=superuser"');
    });

    it("parses explicit -X method flag (PUT, DELETE, PATCH)", () => {
      const cmd = `curl -X DELETE https://api.example.com/items/42`;
      const res = convertCurlToFetch(cmd);
      expect(res).toContain('method: "DELETE"');
      expect(res).toContain('fetch("https://api.example.com/items/42"');
    });

    it("parses --data-raw JSON payload and formats as JSON.stringify", () => {
      const cmd = `curl https://api.example.com/events -H "Content-Type: application/json" --data-raw '{"event":"signup","email":"user@domain.com"}'`;
      const res = convertCurlToFetch(cmd);
      expect(res).toContain('method: "POST"');
      expect(res).toContain("body: JSON.stringify(");
      expect(res).toContain('"email": "user@domain.com"');
    });

    it("parses -u Basic Auth using UTF-8 safe TextEncoder helper and handles non-ASCII characters without throwing", () => {
      const utf8Credentials = "üser:pässwörd🔒";
      expect(encodeBasicAuthUtf8(utf8Credentials)).toBe(
        Buffer.from(utf8Credentials, "utf8").toString("base64")
      );

      const cmd = `curl -u "üser:pässwörd🔒" https://api.example.com/private`;
      const browserRes = convertCurlToFetch(cmd, { targetClient: "browser-fetch" });
      expect(browserRes).toContain("new TextEncoder().encode(credentials)");
      expect(browserRes).toContain('"Authorization": `Basic ${encodeBasicAuth("üser:pässwörd🔒")}`');

      const nodeRes = convertCurlToFetch(cmd, { targetClient: "node-fetch" });
      expect(nodeRes).toContain('Buffer.from("üser:pässwörd🔒", "utf8").toString("base64")');
    });

    it("parses -F multipart FormData fields and file uploads while omitting manual multipart Content-Type", () => {
      const cmd = `curl -X POST https://api.example.com/upload -H "Content-Type: multipart/form-data" -F "title=Quarterly Report" -F "attachment=@report.pdf"`;
      const res = convertCurlToFetch(cmd);
      expect(res).toContain("const formData = new FormData();");
      expect(res).toContain('formData.append("title", "Quarterly Report");');
      expect(res).toContain('formData.append("attachment", new Blob([]), "report.pdf");');
      expect(res).toContain("body: formData,");
      expect(res).not.toContain("multipart/form-data");
    });

    it("supports -L (redirect: follow), -I (HEAD), -b (cookies), --url, --compressed, and -k (security warning)", () => {
      const cmd = `curl -L -I -k --compressed --url "https://self-signed.example.com/health" -b "sid=9981"`;
      const res = convertCurlToFetch(cmd, { targetClient: "node-fetch" });
      expect(res).toContain("SECURITY WARNING (-k / --insecure detected)");
      expect(res).toContain('fetch("https://self-signed.example.com/health"');
      expect(res).toContain('method: "HEAD"');
      expect(res).toContain('redirect: "follow"');
      expect(res).toContain('"Cookie": "sid=9981"');
      expect(res).toContain('"Accept-Encoding": "gzip, deflate, br"');
    });

    it("supports targetClient output switching between Browser fetch, Node.js fetch, and Axios", () => {
      const cmd = `curl -X POST https://api.example.com/orders -u "api:key123" -H "X-Trace: 1" --data-raw '{"sku":"PRO"}'`;

      const axiosRes = convertCurlToFetch(cmd, { targetClient: "axios" });
      expect(axiosRes).toContain('import axios from "axios";');
      expect(axiosRes).toContain("await axios.request({");
      expect(axiosRes).toContain('method: "post"');
      expect(axiosRes).toContain('username: "api"');
      expect(axiosRes).toContain('password: "key123"');
      expect(axiosRes).toContain('"sku": "PRO"');
    });
  });

  describe("YAML to JSON Engine (Anchors/Aliases, Multi-doc, YAML 1.1 vs 1.2 0755 vs 0o755, Line Error Reporting)", () => {
    it("resolves YAML anchors (&), aliases (*), and merge keys (<<) into expanded JSON objects", () => {
      const yamlInput = `
defaults: &def
  timeout: 3000
  retries: 2

production:
  <<: *def
  retries: 5
  region: eu-central-1
`;
      const parsed = JSON.parse(convertYamlToJson(yamlInput));
      expect(parsed.production).toEqual({
        timeout: 3000,
        retries: 5,
        region: "eu-central-1",
      });
    });

    it("parses multi-document YAML streams (---) into a JSON array", () => {
      const multiYaml = `
apiVersion: v1
kind: Namespace
metadata:
  name: prod
---
apiVersion: v1
kind: Service
metadata:
  name: web-api
`;
      const parsed = JSON.parse(convertYamlToJson(multiYaml));
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].kind).toBe("Namespace");
      expect(parsed[1].kind).toBe("Service");
    });

    it("differentiates YAML 1.2 vs YAML 1.1 for yes/no booleans, bare 0755 vs 0o755 octals, and ISO dates", () => {
      const scalarYaml = `
country: NO
confirm: yes
filePermissions: 0755
octalExplicit: 0o755
modernOctal: 0o14
legacyOctal: 014
releaseDate: 2026-11-02T10:00:00Z
`;

      // YAML 1.2 (Default): yes/NO stay strings, 0o755 is 493, bare 0755 is decimal 755, 0o14 is 12, bare 014 is 14
      const v12 = JSON.parse(convertYamlToJson(scalarYaml, { yamlVersion: "1.2" }));
      expect(v12.country).toBe("NO");
      expect(v12.confirm).toBe("yes");
      expect(v12.filePermissions).toBe(755);
      expect(v12.octalExplicit).toBe(493);
      expect(v12.modernOctal).toBe(12);
      expect(v12.legacyOctal).toBe(14);
      expect(v12.releaseDate).toBe("2026-11-02T10:00:00Z");

      // YAML 1.1: NO -> false, yes -> true, bare 0755 -> 493, bare 014 -> 12
      const v11 = JSON.parse(convertYamlToJson(scalarYaml, { yamlVersion: "1.1" }));
      expect(v11.country).toBe(false);
      expect(v11.confirm).toBe(true);
      expect(v11.filePermissions).toBe(493);
      expect(v11.octalExplicit).toBe(493);
      expect(v11.modernOctal).toBe(12);
      expect(v11.legacyOctal).toBe(12);
    });

    it("throws a clear error message containing exact line and column numbers on invalid YAML", () => {
      const badYaml = `server:\n  port: 8080\n   badIndent: true\n  unclosed: "hello`;
      expect(() => convertYamlToJson(badYaml)).toThrow(/YAML Syntax Error at line \d+, column \d+/);
    });
  });

  describe("SQL to Prisma Schema Engine (CREATE TABLE, 1:1 / 1:n / n:m Relations, Enums, @default, @unique, @@index, Postgres/MySQL)", () => {
    it("parses PostgreSQL enums, 1:1 unique FK, 1:n FK, @default, @unique, and CREATE INDEX", () => {
      const sql = `
CREATE TYPE user_role AS ENUM ('ADMIN', 'MEMBER');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  published BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_posts_author ON posts (author_id, published);
`;
      const prisma = convertSqlToPrisma(sql);
      expect(prisma).toContain("enum UserRole {\n  ADMIN\n  MEMBER\n}");
      expect(prisma).toContain("id String @id @default(uuid()) @db.Uuid");
      expect(prisma).toContain("email String @unique @db.VarChar(255)");
      expect(prisma).toContain("role UserRole @default(MEMBER)");
      expect(prisma).toContain('updatedAt DateTime @updatedAt @map("updated_at")');
      // 1:1 relation on User -> userProfile UserProfile?
      expect(prisma).toContain("userProfile UserProfile?");
      // 1:n relation on User -> posts Post[]
      expect(prisma).toContain("posts Post[]");
      // Owning @relation with onDelete: Cascade
      expect(prisma).toContain(
        "user User @relation(fields: [userId], references: [id], onDelete: Cascade)"
      );
      expect(prisma).toContain(
        "author User @relation(fields: [authorId], references: [id], onDelete: Cascade)"
      );
      // @@index
      expect(prisma).toContain('@@index([authorId, published], map: "idx_posts_author")');
    });

    it("parses n:m join tables with composite PRIMARY KEY (@@id) and MySQL types (AUTO_INCREMENT, TINYINT(1), DECIMAL, inline ENUM)", () => {
      const sql = `
CREATE TABLE invoices (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  amount DECIMAL(10, 2) NOT NULL,
  is_paid TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('DRAFT', 'PAID', 'VOID') NOT NULL DEFAULT 'DRAFT'
);

CREATE TABLE invoice_tags (
  invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  tag_id BIGINT NOT NULL,
  PRIMARY KEY (invoice_id, tag_id)
);
`;
      const prisma = convertSqlToPrisma(sql, { provider: "mysql" });
      expect(prisma).toContain("enum InvoiceStatus {\n  DRAFT\n  PAID\n  VOID\n}");
      expect(prisma).toContain("id BigInt @id @default(autoincrement())");
      expect(prisma).toContain("amount Decimal @db.Decimal(10, 2)");
      expect(prisma).toContain('isPaid Boolean @default(false) @map("is_paid")');
      expect(prisma).toContain("status InvoiceStatus @default(DRAFT)");
      expect(prisma).toContain("@@id([invoiceId, tagId])");
    });
  });

  describe(".env to Zod & T3 Env Engine (Zod v4, Zod v3, @t3-oss/env-nextjs, Parser Edge Cases & Privacy)", () => {
    it("parses export KEY=..., single/double/backtick quotes, full-line and inline comments, and preserves # inside quotes", () => {
      const envInput = `
# Database & Redis Section
export DB_HOST="db.internal.local" # inline comment after double quotes
export REDIS_PASS='p@ss#word#with#hash' # inline comment after single quotes
BACKTICK_KEY=\`value#inside#backticks\`
UNQUOTED_KEY=hello_world # inline comment after unquoted value
HASH_WITHOUT_SPACE=abc#123
`;
      const parsed = parseEnvFile(envInput);
      const map = new Map(parsed.entries.map((e) => [e.key, e]));

      expect(map.get("DB_HOST")?.value).toBe("db.internal.local");
      expect(map.get("DB_HOST")?.sectionComment).toBe("Database & Redis Section");
      expect(map.get("DB_HOST")?.inlineComment).toBe("inline comment after double quotes");

      expect(map.get("REDIS_PASS")?.value).toBe("p@ss#word#with#hash");
      expect(map.get("BACKTICK_KEY")?.value).toBe("value#inside#backticks");
      expect(map.get("UNQUOTED_KEY")?.value).toBe("hello_world");
      // '#' not preceded by whitespace in unquoted value is kept as part of value
      expect(map.get("HASH_WITHOUT_SPACE")?.value).toBe("abc#123");
    });

    it("parses multiline quoted values and handles duplicate keys (last value wins while recording duplicates)", () => {
      const envInput = `
PORT=3000
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC
-----END PRIVATE KEY-----"
ESCAPED_NEWLINE="line1\\nline2"
PORT=8080
`;
      const parsed = parseEnvFile(envInput);
      expect(parsed.duplicateKeys).toEqual(["PORT"]);

      const portEntry = parsed.entries.find((e) => e.key === "PORT")!;
      expect(portEntry.value).toBe("8080");
      expect(portEntry.overriddenCount).toBe(1);

      const pemEntry = parsed.entries.find((e) => e.key === "JWT_PRIVATE_KEY")!;
      expect(pemEntry.value).toContain("-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC\n-----END PRIVATE KEY-----");

      const escapedEntry = parsed.entries.find((e) => e.key === "ESCAPED_NEWLINE")!;
      expect(escapedEntry.value).toBe("line1\nline2");

      const output = convertEnvToZod(envInput, { outputMode: "zod-v4" });
      expect(output).toContain("Duplicate keys detected (PORT)");
      // Raw private key value must NEVER appear in the output
      expect(output).not.toContain("MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC");
    });

    it("infers numbers, booleans, any-scheme URLs (postgresql://, redis://), emails, NODE_ENV enum, empty optional, and Sensitive comments without leaking values", () => {
      const envInput = `
NODE_ENV=production
PORT=4000
RATE_LIMIT_RATIO=0.75
ENABLE_CACHE=true
DEBUG_LOGGING=false
DATABASE_URL=postgresql://admin:super_secret_pw@db.example.com:5432/prod
REDIS_URL=redis://localhost:6379
AMQP_URL=amqp://guest:guest@localhost:5672
SUPPORT_EMAIL=ops@castov.com
STRIPE_SECRET_KEY=sk_live_dummy_val_999
WEBHOOK_SECRET=whsec_dummy_val_888
OPTIONAL_SENTRY_DSN=
`;
      // 1. Zod v4 Mode
      const v4Out = convertEnvToZod(envInput, {
        outputMode: "zod-v4",
        nodeEnvAsEnum: true,
      });
      expect(v4Out).toContain('NODE_ENV: z.enum(["development", "production", "test"]),');
      expect(v4Out).toContain("PORT: z.coerce.number().int().positive(),");
      expect(v4Out).toContain("RATE_LIMIT_RATIO: z.coerce.number(),");
      expect(v4Out).toContain("ENABLE_CACHE: z.stringbool(),");
      expect(v4Out).toContain("DEBUG_LOGGING: z.stringbool(),");
      expect(v4Out).toContain("DATABASE_URL: z.url(),");
      expect(v4Out).toContain("REDIS_URL: z.url(),");
      expect(v4Out).toContain("AMQP_URL: z.url(),");
      expect(v4Out).toContain("SUPPORT_EMAIL: z.email(),");
      expect(v4Out).toContain("/** ⚠️ Sensitive — never log or expose to client bundles */\n  STRIPE_SECRET_KEY: z.string().min(1),");
      expect(v4Out).toContain("/** ⚠️ Sensitive — never log or expose to client bundles */\n  WEBHOOK_SECRET: z.string().min(1),");
      expect(v4Out).toContain("OPTIONAL_SENTRY_DSN: z.string().optional(),");

      // Privacy guarantee: no secret values in output
      expect(v4Out).not.toContain("super_secret_pw");
      expect(v4Out).not.toContain("sk_live_dummy_val_999");
      expect(v4Out).not.toContain("whsec_dummy_val_888");
      expect(v4Out).not.toContain("ops@castov.com");

      // 2. Toggle NODE_ENV enum off -> z.string().min(1)
      const v4NoEnum = convertEnvToZod(envInput, {
        outputMode: "zod-v4",
        nodeEnvAsEnum: false,
      });
      expect(v4NoEnum).toContain("NODE_ENV: z.string().min(1),");

      // 3. Zod v3 Mode
      const v3Out = convertEnvToZod(envInput, {
        outputMode: "zod-v3",
        nodeEnvAsEnum: true,
      });
      expect(v3Out).toContain("DATABASE_URL: z.string().url(),");
      expect(v3Out).toContain("SUPPORT_EMAIL: z.string().email(),");
      expect(v3Out).toContain('ENABLE_CACHE: z.enum(["true", "false"]).transform((v) => v === "true"),');
    });

    it("generates @t3-oss/env-nextjs createEnv with server/client separation and supports both experimental__runtimeEnv and runtimeEnv", () => {
      const envInput = `
DATABASE_URL=postgresql://localhost:5432/app
STRIPE_SECRET_KEY=sk_live_123456
NEXT_PUBLIC_APP_URL=https://castov.com
NEXT_PUBLIC_ANALYTICS_ENABLED=false
`;
      // Default: experimental__runtimeEnv (client-only destructuring for Next.js >= 13.4.4)
      const t3Experimental = convertEnvToZod(envInput, {
        outputMode: "t3-env",
        t3RuntimeStyle: "experimental__runtimeEnv",
      });
      expect(t3Experimental).toContain('import { createEnv } from "@t3-oss/env-nextjs";');
      expect(t3Experimental).toContain("server: {\n    DATABASE_URL: z.url(),");
      expect(t3Experimental).toContain("client: {\n    NEXT_PUBLIC_APP_URL: z.url(),\n    NEXT_PUBLIC_ANALYTICS_ENABLED: z.stringbool(),\n  },");
      expect(t3Experimental).toContain("experimental__runtimeEnv: {\n    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,\n    NEXT_PUBLIC_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,\n  },");
      expect(t3Experimental).not.toContain("DATABASE_URL: process.env.DATABASE_URL");

      // Full runtimeEnv (for Next.js < 13.4.4)
      const t3Full = convertEnvToZod(envInput, {
        outputMode: "t3-env",
        t3RuntimeStyle: "runtimeEnv",
      });
      expect(t3Full).toContain("runtimeEnv: {\n    DATABASE_URL: process.env.DATABASE_URL,\n    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,\n    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,\n    NEXT_PUBLIC_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,\n  },");
    });

    it("warns when a NEXT_PUBLIC_ variable name suggests a secret (SECRET, KEY, TOKEN, PASSWORD)", () => {
      const envInput = `
NEXT_PUBLIC_APP_URL=https://castov.com
NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_live_123
NEXT_PUBLIC_AUTH_TOKEN=tok_abc
`;
      const parsed = parseEnvFile(envInput);
      expect(parsed.publicSecretWarnings).toEqual([
        "NEXT_PUBLIC_STRIPE_SECRET_KEY",
        "NEXT_PUBLIC_AUTH_TOKEN",
      ]);

      const out = convertEnvToZod(envInput, { outputMode: "zod-v4" });
      expect(out).toContain("PUBLIC SECRET WARNING (NEXT_PUBLIC_STRIPE_SECRET_KEY, NEXT_PUBLIC_AUTH_TOKEN)");
      expect(out).toContain("SECURITY WARNING: NEXT_PUBLIC_ exposes 'NEXT_PUBLIC_STRIPE_SECRET_KEY' to browser bundles!");
    });

    it("generates a safe .env.example with all secrets scrubbed", () => {
      const envInput = `
# Production Secrets
DATABASE_URL=postgresql://admin:real_password_123@prod.db.internal:5432/live
STRIPE_SECRET_KEY=sk_live_9988776655
ADMIN_EMAIL=ceo@company.com
PORT=8080
ENABLE_TLS=true
OPTIONAL_KEY=
`;
      const example = convertEnvToZod(envInput, { outputMode: "env-example" });
      expect(example).toContain("# Production Secrets");
      expect(example).toContain("DATABASE_URL=postgresql://user:password@localhost:5432/dbname");
      expect(example).toContain("STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here");
      expect(example).toContain("ADMIN_EMAIL=admin@example.com");
      expect(example).toContain("PORT=8080");
      expect(example).toContain("ENABLE_TLS=true");
      expect(example).toContain("OPTIONAL_KEY=");
      expect(example).not.toContain("real_password_123");
      expect(example).not.toContain("sk_live_9988776655");
      expect(example).not.toContain("ceo@company.com");
    });
  });

  describe("SQL to Drizzle ORM Engine (pgTable, mysqlTable, sqliteTable, relations, composite PK, $inferSelect)", () => {
    const sampleSql = `
CREATE TYPE user_role AS ENUM ('ADMIN', 'MEMBER');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL
);

CREATE TABLE post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_posts_author ON posts (author_id);
`;

    it("generates PostgreSQL pgTable, pgEnum, relations(), composite primaryKey(), and $inferSelect/$inferInsert", () => {
      const out = convertSqlToDrizzle(sampleSql, {
        dialect: "postgresql",
        includeRelations: true,
        includeInferTypes: true,
      });
      expect(out).toContain('from "drizzle-orm/pg-core"');
      expect(out).toContain('export const userRoleEnum = pgEnum("user_role", ["ADMIN", "MEMBER"]);');
      expect(out).toContain('export const users = pgTable("users"');
      expect(out).toContain('id: uuid("id").primaryKey().defaultRandom()');
      expect(out).toContain('authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" })');
      expect(out).toContain("pk: primaryKey({ columns: [t.postId, t.tagId] })");
      expect(out).toContain('idxPostsAuthor: index("idx_posts_author").on(t.authorId)');
      expect(out).toContain("export const usersRelations = relations(users, ({ many }) => ({");
      expect(out).toContain("export type User = typeof users.$inferSelect;");
      expect(out).toContain("export type NewUser = typeof users.$inferInsert;");
    });

    it("supports MySQL (mysqlTable) and SQLite (sqliteTable) dialects", () => {
      const mysqlOut = convertSqlToDrizzle(sampleSql, { dialect: "mysql" });
      expect(mysqlOut).toContain('from "drizzle-orm/mysql-core"');
      expect(mysqlOut).toContain("mysqlTable(");

      const sqliteOut = convertSqlToDrizzle(sampleSql, { dialect: "sqlite" });
      expect(sqliteOut).toContain('from "drizzle-orm/sqlite-core"');
      expect(sqliteOut).toContain("sqliteTable(");
    });
  });

  describe("Webhook HMAC Debugger & Zod Handler Generator (Shopify, Stripe, GitHub)", () => {
    it("diagnoses exact and mutated HMAC-SHA256 signatures and generates timingSafeEqual handler + Zod schema", () => {
      const rawBody = '{"id":101,"email":"buyer@shop.com"}';
      const secret = "shpss_test_secret";
      const { base64 } = hmacSha256(secret, rawBody);

      const input = JSON.stringify({
        provider: "shopify",
        secret,
        signature: base64,
        payload: JSON.parse(rawBody),
      });

      const out = convertWebhookHmac(input, {
        provider: "shopify",
        framework: "nextjs-app",
        zodVersion: "v4",
      });

      expect(out).toContain("SIGNATURE MATCHED");
      expect(out).toContain("z.email()");
      expect(out).toContain("await req.text()");
      expect(out).toContain("crypto.timingSafeEqual(a, b)");
    });

    it("supports Stripe timestamped v1 signatures and Express raw-body handlers", () => {
      const rawBody = '{"id":"evt_1","type":"charge.succeeded"}';
      const secret = "whsec_stripe_secret";
      const ts = "1714500000";
      const { hex } = hmacSha256(secret, `${ts}.${rawBody}`);

      const input = JSON.stringify({
        provider: "stripe",
        secret,
        signature: `t=${ts},v1=${hex}`,
        payload: rawBody,
      });

      const out = convertWebhookHmac(input, {
        provider: "auto",
        framework: "express",
        zodVersion: "v3",
      });

      expect(out).toContain("Provider Mode        : STRIPE");
      expect(out).toContain("SIGNATURE MATCHED : Stripe Timestamped Payload");
      expect(out).toContain('express.raw({ type: "application/json" })');
      expect(out).toContain("STRIPE_TIMESTAMP_TOLERANCE_SEC = 300");
      expect(out).toContain("Math.abs(nowSec - timestampSec) > STRIPE_TIMESTAMP_TOLERANCE_SEC");
    });

    it("verifies official GitHub documentation test vector and self-consistency against Node crypto for Stripe and Shopify", () => {
      // 1. Official GitHub Docs Test Vector (literal vector from GitHub documentation):
      // https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries#testing-the-webhook-payload-validation
      const ghSecret = "It's a Secret to Everybody";
      const ghPayload = "Hello, World!";
      const ghExpectedHex = "757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17";
      const ghComputed = hmacSha256(ghSecret, ghPayload);
      expect(ghComputed.hex).toBe(ghExpectedHex);

      const ghOut = convertWebhookHmac(
        JSON.stringify({
          provider: "github",
          secret: ghSecret,
          signature: `sha256=${ghExpectedHex}`,
          payload: ghPayload,
        }),
        { provider: "github", framework: "nextjs-app" }
      );
      expect(ghOut).toContain("SIGNATURE MATCHED : GitHub / Generic Exact Raw Body (Hex)");
      expect(ghOut).toContain("crypto.timingSafeEqual(a, b)");

      // 2. Self-Consistency Test (اختبار اتساق ذاتي مقابل node:crypto — ليس vector رسمياً من وثائق Stripe):
      // Follows Stripe's documented scheme `${timestamp}.${rawBody}` (https://docs.stripe.com/webhooks/signature#verify-manually)
      const stripeSecret = "whsec_test_secret";
      const stripeTimestamp = "1492774577";
      const stripePayload = '{"id":"evt_test_webhook","object":"event"}';
      const stripeSignedPayload = `${stripeTimestamp}.${stripePayload}`;
      const stripeExpectedHex = "88a022085c6bdb887b02cb26ff76dd681234d9675c0f22844059f55552a8883a";
      const stripeComputed = hmacSha256(stripeSecret, stripeSignedPayload);
      expect(stripeComputed.hex).toBe(stripeExpectedHex);

      const stripeOut = convertWebhookHmac(
        JSON.stringify({
          provider: "stripe",
          secret: stripeSecret,
          signature: `t=${stripeTimestamp},v1=${stripeExpectedHex}`,
          payload: stripePayload,
        }),
        { provider: "stripe", framework: "nextjs-app" }
      );
      expect(stripeOut).toContain("SIGNATURE MATCHED : Stripe Timestamped Payload");
      expect(stripeOut).toContain("STRIPE_TIMESTAMP_TOLERANCE_SEC = 300");
      expect(stripeOut).toContain("v1Signatures.some");

      // 3. Self-Consistency Test (اختبار اتساق ذاتي مقابل node:crypto — ليس vector رسمياً من وثائق Shopify):
      // Follows Shopify's documented Base64 scheme (https://shopify.dev/docs/apps/build/webhooks/subscribe/https#step-5-verify-the-webhook)
      const shopifySecret = "hush";
      const shopifyPayload = '{"id":123456,"topic":"orders/create"}';
      const shopifyExpectedBase64 = "qjUsWDnSC3ZXYpc3wZvhadS+YZ/TqmuuaAmmEYu9D7w=";
      const shopifyComputed = hmacSha256(shopifySecret, shopifyPayload);
      expect(shopifyComputed.base64).toBe(shopifyExpectedBase64);
      const shopifyOut = convertWebhookHmac(
        JSON.stringify({
          provider: "shopify",
          secret: shopifySecret,
          signature: shopifyExpectedBase64,
          payload: shopifyPayload,
        }),
        { provider: "shopify", framework: "nextjs-app" }
      );
      expect(shopifyOut).toContain("SIGNATURE MATCHED : Shopify Exact Raw Body (Base64)");
    });

    it("handles Stripe-Signature headers with multiple v1 values during secret rotation (matches if any v1 is valid)", () => {
      const stripeSecret = "whsec_rolled_secret_2026";
      const stripeTimestamp = "1714500000";
      const stripePayload = '{"id":"evt_rotation_test","type":"invoice.paid"}';
      const validV1 = hmacSha256(stripeSecret, `${stripeTimestamp}.${stripePayload}`).hex;
      const staleRolledV1 = "000000000000000000000000000000000000000000000000000000000000dead";

      // Header has an old/rotated v1 first and the active valid v1 second
      const multiV1Header = `t=${stripeTimestamp},v1=${staleRolledV1},v1=${validV1},v0=legacy123`;

      const out = convertWebhookHmac(
        JSON.stringify({
          provider: "stripe",
          secret: stripeSecret,
          signature: multiV1Header,
          payload: stripePayload,
        }),
        { provider: "stripe", framework: "nextjs-app" }
      );

      expect(out).toContain("SIGNATURE MATCHED : Stripe Timestamped Payload");
      expect(out).toContain("const v1Signatures: string[] = [];");
      expect(out).toContain("const isVerified = v1Signatures.some((sig) => {");
      expect(out).toContain("stripe.webhooks.constructEvent");
    });
  });

  describe("cURL to n8n & Make.com HTTP Node Converter", () => {
    it("converts cURL with query params, headers, Basic Auth, and JSON body into n8n v4.2 node JSON while stripping browser noise", () => {
      const cmd = `curl -X POST 'https://api.castov.com/v1/hooks?env=prod' -u 'admin:secret' -H 'sec-ch-ua: "Chromium"' -H 'Content-Type: application/json' --data-raw '{"active":true}'`;
      const out = convertCurlToN8n(cmd, {
        targetPlatform: "n8n-node",
        stripBrowserNoise: true,
      });

      const parsed = JSON.parse(out);
      expect(parsed.nodes).toHaveLength(1);
      const node = parsed.nodes[0];
      expect(node.type).toBe("n8n-nodes-base.httpRequest");
      expect(node.typeVersion).toBe(4.2);
      expect(node.parameters.method).toBe("POST");
      expect(node.parameters.url).toBe("https://api.castov.com/v1/hooks");
      expect(node.parameters.queryParameters.parameters).toEqual([
        { name: "env", value: "prod" },
      ]);
      // Noise header sec-ch-ua stripped
      const headerNames = node.parameters.headerParameters.parameters.map((h: any) => h.name);
      expect(headerNames).not.toContain("sec-ch-ua");
      expect(headerNames).toContain("Authorization");
    });

    it("supports Make.com HTTP module blueprint and n8n Code Node output modes", () => {
      const cmd = `curl https://api.castov.com/v1/ping -H "X-Api-Key: 123"`;
      const makeOut = JSON.parse(convertCurlToN8n(cmd, { targetPlatform: "make-http" }));
      expect(makeOut.subflows[0].flow[0].module).toBe("http:ActionSendData");

      const codeOut = convertCurlToN8n(cmd, { targetPlatform: "n8n-code" });
      expect(codeOut).toContain("this.helpers.httpRequest");
    });
  });

  describe("HAR File & JSON Log Secret Sanitizer", () => {
    it("redacts headers, cookies, query string tokens, and recursively scrubs stringified JSON inside postData.text", () => {
      const harSample = JSON.stringify({
        log: {
          version: "1.2",
          entries: [
            {
              request: {
                url: "https://api.example.com/pay?api_key=sk_live_secret999&page=1",
                headers: [
                  { name: "Authorization", value: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig123456" },
                  { name: "Cookie", value: "sid=12345" },
                  { name: "Accept", value: "application/json" },
                ],
                cookies: [{ name: "sid", value: "12345" }],
                postData: {
                  mimeType: "application/json",
                  text: JSON.stringify({
                    email: "cto@company.com",
                    password: "SuperPassword!",
                    stripeKey: "sk_live_abc123456789",
                  }),
                },
              },
            },
          ],
        },
      });

      const out = convertHarSanitizer(harSample, {
        scrubBodies: true,
        scrubEmails: true,
        includeAuditHeader: false,
      });

      const sanitized = JSON.parse(out);
      const req = sanitized.log.entries[0].request;
      expect(req.url).toContain("api_key=[REDACTED_QUERY_SECRET]");
      expect(req.url).toContain("page=1");
      expect(req.headers[0].value).toBe("[REDACTED_AUTHORIZATION]");
      expect(req.headers[1].value).toBe("[REDACTED_COOKIE]");
      expect(req.headers[2].value).toBe("application/json");
      expect(req.cookies[0].value).toBe("[REDACTED_COOKIE_VALUE]");

      const innerBody = JSON.parse(req.postData.text);
      expect(innerBody.email).toBe("[REDACTED_EMAIL]");
      expect(innerBody.password).toBe("[REDACTED_PASSWORD]");
      expect(innerBody.stripeKey).toBe("[REDACTED_SK_LIVE_KEY]");
    });

    it("sanitizes a complete Chrome DevTools HAR 1.2 archive (request/response headers, cookies, queryString, postData, and response.content.text)", () => {
      const chromeHarArchive = JSON.stringify({
        log: {
          version: "1.2",
          creator: { name: "WebInspector", version: "537.36" },
          pages: [
            {
              startedDateTime: "2026-11-02T19:30:00.000Z",
              id: "page_1",
              title: "https://castov.com/checkout",
              pageTimings: { onContentLoad: 182.4, onLoad: 310.1 },
            },
          ],
          entries: [
            {
              _initiator: { type: "script" },
              _priority: "High",
              _resourceType: "fetch",
              cache: {},
              connection: "443",
              pageref: "page_1",
              startedDateTime: "2026-11-02T19:30:01.120Z",
              time: 94.5,
              request: {
                method: "POST",
                url: "https://api.castov.com/v1/sessions?access_token=ghp_1234567890abcdefghijklmn&locale=en",
                httpVersion: "http/2.0",
                headers: [
                  { name: ":authority", value: "api.castov.com" },
                  { name: "authorization", value: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOTkifQ.sig987654321" },
                  { name: "cookie", value: "__Host-session=live_sess_887766; cf_clearance=abc" },
                  { name: "x-shopify-access-token", value: "shpat_live_token_1122334455" },
                  { name: "user-agent", value: "Mozilla/5.0 Chrome/130.0.0.0" },
                ],
                queryString: [
                  { name: "access_token", value: "ghp_1234567890abcdefghijklmn" },
                  { name: "locale", value: "en" },
                ],
                cookies: [
                  { name: "__Host-session", value: "live_sess_887766", path: "/", domain: "api.castov.com", httpOnly: true, secure: true },
                ],
                headersSize: -1,
                bodySize: 128,
                postData: {
                  mimeType: "application/json",
                  text: '{"userEmail":"buyer@merchant.com","client_secret":"secret_9988","awsKey":"AKIAIOSFODNN7EXAMPLE"}',
                },
              },
              response: {
                status: 200,
                statusText: "",
                httpVersion: "http/2.0",
                headers: [
                  { name: "content-type", value: "application/json; charset=utf-8" },
                  { name: "set-cookie", value: "__Host-session=rotated_9911; Path=/; Secure; HttpOnly" },
                ],
                cookies: [
                  { name: "__Host-session", value: "rotated_9911", path: "/", httpOnly: true, secure: true },
                ],
                content: {
                  size: 145,
                  mimeType: "application/json",
                  text: '{"status":"ok","refresh_token":"rt_live_9988776655","webhookSecret":"whsec_live_1122334455","note":"Plain unkeyed custom string ABC-999-INTERNAL"}',
                },
                redirectURL: "",
                headersSize: -1,
                bodySize: -1,
              },
              serverIPAddress: "104.21.44.10",
              timings: { blocked: 1.2, dns: 0, ssl: 12.1, connect: 15.0, send: 0.4, wait: 64.2, receive: 1.6 },
            },
          ],
        },
      });

      const out = convertHarSanitizer(chromeHarArchive, {
        scrubBodies: true,
        scrubEmails: true,
        includeAuditHeader: false,
      });

      const sanitized = JSON.parse(out);
      const entry = sanitized.log.entries[0];

      // 1. Scrubbed items
      expect(entry.request.url).toBe(
        "https://api.castov.com/v1/sessions?access_token=[REDACTED_QUERY_SECRET]&locale=en"
      );
      expect(entry.request.queryString[0].value).toBe("[REDACTED_QUERY_SECRET]");
      expect(entry.request.queryString[1].value).toBe("en");
      expect(entry.request.headers[1].value).toBe("[REDACTED_AUTHORIZATION]");
      expect(entry.request.headers[2].value).toBe("[REDACTED_COOKIE]");
      expect(entry.request.headers[3].value).toBe("[REDACTED_X_SHOPIFY_ACCESS_TOKEN]");
      expect(entry.request.cookies[0].value).toBe("[REDACTED_COOKIE_VALUE]");
      expect(entry.response.headers[1].value).toBe("[REDACTED_SET_COOKIE]");
      expect(entry.response.cookies[0].value).toBe("[REDACTED_COOKIE_VALUE]");

      const reqBody = JSON.parse(entry.request.postData.text);
      expect(reqBody.userEmail).toBe("[REDACTED_EMAIL]");
      expect(reqBody.client_secret).toBe("[REDACTED_CLIENT_SECRET]");
      expect(reqBody.awsKey).toBe("[REDACTED_AWS_ACCESS_KEY]");

      const resBody = JSON.parse(entry.response.content.text);
      expect(resBody.refresh_token).toBe("[REDACTED_REFRESH_TOKEN]");
      expect(resBody.webhookSecret).toBe("[REDACTED_WHSEC_LIVE_KEY]");

      // 2. Preserved structural & non-secret metadata
      expect(entry.serverIPAddress).toBe("104.21.44.10");
      expect(resBody.note).toBe("Plain unkeyed custom string ABC-999-INTERNAL");
    });
  });
});
