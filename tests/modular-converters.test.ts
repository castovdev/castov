import { describe, it, expect } from "vitest";
import { convert as convertJsonToZod } from "@/lib/converters/engines/json-to-zod";
import { convert as convertJsonToTs, singularize } from "@/lib/converters/engines/json-to-typescript";
import { convert as convertCurlToFetch, encodeBasicAuthUtf8 } from "@/lib/converters/engines/curl-to-fetch";
import { convert as convertYamlToJson } from "@/lib/converters/engines/yaml-to-json";
import { jsonToTypescriptMeta } from "@/content/converters/json-to-typescript";
import { MODULAR_CONVERTERS, getModularConverter } from "@/content/converters";

describe("Modular Code Converters Architecture", () => {
  describe("Metadata & Quality Standards", () => {
    it("registers json-to-zod, json-to-typescript, curl-to-fetch, and yaml-to-json with quality approval", () => {
      for (const slug of ["json-to-zod", "json-to-typescript", "curl-to-fetch", "yaml-to-json"]) {
        const meta = getModularConverter(slug);
        expect(meta).toBeDefined();
        expect(meta?.slug).toBe(slug);
        expect(meta?.isQualityApproved).toBe(true);
        expect(meta?.isIndexed).toBe(true);
        expect(meta?.initialOutput).toBeTruthy();
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

  describe("YAML to JSON Engine (Anchors/Aliases, Multi-doc, YAML 1.1 vs 1.2, Line Error Reporting)", () => {
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

    it("differentiates YAML 1.2 vs YAML 1.1 for yes/no booleans, 0o14 octals, and ISO dates", () => {
      const scalarYaml = `
country: NO
confirm: yes
modernOctal: 0o14
legacyOctal: 014
releaseDate: 2026-11-02T10:00:00Z
`;

      // YAML 1.2 (Default): yes/NO stay strings, 0o14 is 12, 014 is 14
      const v12 = JSON.parse(convertYamlToJson(scalarYaml, { yamlVersion: "1.2" }));
      expect(v12.country).toBe("NO");
      expect(v12.confirm).toBe("yes");
      expect(v12.modernOctal).toBe(12);
      expect(v12.legacyOctal).toBe(14);
      expect(v12.releaseDate).toBe("2026-11-02T10:00:00Z");

      // YAML 1.1: NO -> false, yes -> true, 014 -> 12
      const v11 = JSON.parse(convertYamlToJson(scalarYaml, { yamlVersion: "1.1" }));
      expect(v11.country).toBe(false);
      expect(v11.confirm).toBe(true);
      expect(v11.modernOctal).toBe(12);
      expect(v11.legacyOctal).toBe(12);
    });

    it("throws a clear error message containing exact line and column numbers on invalid YAML", () => {
      const badYaml = `server:\n  port: 8080\n   badIndent: true\n  unclosed: "hello`;
      expect(() => convertYamlToJson(badYaml)).toThrow(/YAML Syntax Error at line \d+, column \d+/);
    });
  });
});
