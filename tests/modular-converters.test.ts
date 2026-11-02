import { describe, it, expect } from "vitest";
import { convert as convertJsonToZod } from "@/lib/converters/engines/json-to-zod";
import { convert as convertJsonToTs, singularize } from "@/lib/converters/engines/json-to-typescript";
import { convert as convertCurlToFetch } from "@/lib/converters/engines/curl-to-fetch";
import { jsonToTypescriptMeta } from "@/content/converters/json-to-typescript";
import { MODULAR_CONVERTERS, getModularConverter } from "@/content/converters";

describe("Modular Code Converters Architecture", () => {
  describe("Metadata & Quality Standards", () => {
    it("registers json-to-zod, json-to-typescript, and curl-to-fetch with quality approval", () => {
      for (const slug of ["json-to-zod", "json-to-typescript", "curl-to-fetch"]) {
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

  describe("cURL to Fetch Engine (-H, -d, -X, --data-raw, -u, -F)", () => {
    it("parses -H custom headers accurately", () => {
      const cmd = `curl https://api.example.com/users -H "Accept: application/json" -H 'X-Custom-Token: abc-123'`;
      const res = convertCurlToFetch(cmd);
      expect(res).toContain('method: "GET"');
      expect(res).toContain('"Accept": "application/json"');
      expect(res).toContain('"X-Custom-Token": "abc-123"');
    });

    it("parses -d payload and defaults method to POST", () => {
      const cmd = `curl https://api.example.com/login -d "username=admin&role=superuser"`;
      const res = convertCurlToFetch(cmd);
      expect(res).toContain('method: "POST"');
      expect(res).toContain('body: "username=admin&role=superuser"');
    });

    it("parses explicit -X method flag (PUT, DELETE, PATCH)", () => {
      const cmd = `curl -X DELETE https://api.example.com/items/42`;
      const res = convertCurlToFetch(cmd);
      expect(res).toContain('method: "DELETE"');
      expect(res).toContain('fetch("https://api.example.com/items/42"');
    });

    it("parses --data-raw JSON payload and formats as JSON.stringify", () => {
      const cmd = `curl https://api.example.com/events --data-raw '{"event":"signup","email":"user@domain.com"}'`;
      const res = convertCurlToFetch(cmd);
      expect(res).toContain('method: "POST"');
      expect(res).toContain("body: JSON.stringify(");
      expect(res).toContain('"email": "user@domain.com"');
    });

    it("parses -u Basic Auth into Authorization: Basic btoa(...)", () => {
      const cmd = `curl -u "admin:s3cr3t" https://api.example.com/private`;
      const res = convertCurlToFetch(cmd);
      expect(res).toContain('"Authorization": `Basic ${btoa("admin:s3cr3t")}`');
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
  });
});
