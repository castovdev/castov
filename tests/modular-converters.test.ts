import { describe, it, expect } from "vitest";
import { convert as convertJsonToZod } from "@/lib/converters/engines/json-to-zod";
import { convert as convertJsonToTs } from "@/lib/converters/engines/json-to-typescript";
import { jsonToZodMeta } from "@/content/converters/json-to-zod";
import { jsonToTypescriptMeta } from "@/content/converters/json-to-typescript";
import { MODULAR_CONVERTERS, getModularConverter } from "@/content/converters";

describe("Modular Code Converters Architecture", () => {
  describe("Metadata & Quality Standards", () => {
    it("registers json-to-zod and json-to-typescript with quality approval", () => {
      for (const slug of ["json-to-zod", "json-to-typescript"]) {
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
      expect(res).toContain('"x-request-id": string;');
      expect(res).toContain("customer: OrderResponseCustomer;");
      expect(res).toContain("lineItems: OrderResponseLineItem[];");
      expect(res).toContain("export interface OrderResponseCustomer {");
      expect(res).toContain("export interface OrderResponseLineItem {");
      expect(res).toContain("notes?: string;");
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
});
