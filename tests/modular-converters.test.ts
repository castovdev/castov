import { describe, it, expect } from "vitest";
import { convert } from "@/lib/converters/engines/json-to-zod";
import { jsonToZodMeta } from "@/content/converters/json-to-zod";
import { MODULAR_CONVERTERS, getModularConverter } from "@/content/converters";

describe("Modular Code Converters Architecture", () => {
  describe("Metadata & Quality Standards", () => {
    it("has valid metadata for json-to-zod", () => {
      const meta = getModularConverter("json-to-zod");
      expect(meta).toBeDefined();
      expect(meta?.slug).toBe("json-to-zod");
      expect(meta?.isQualityApproved).toBe(true);
      expect(meta?.isIndexed).toBe(true);
    });

    it("satisfies strict SEO quality constraints", () => {
      expect(jsonToZodMeta.edgeCases.length).toBeGreaterThanOrEqual(2);
      expect(jsonToZodMeta.faqs.length).toBeGreaterThanOrEqual(3);
      expect(jsonToZodMeta.deepDive.whyDevelopersUseThis.length).toBeGreaterThanOrEqual(3);
      expect(jsonToZodMeta.deepDive.commonPitfalls.length).toBeGreaterThanOrEqual(2);
      expect(jsonToZodMeta.deepDive.overview.length).toBeGreaterThanOrEqual(120);

      // Verify no misleading claims
      const fullContent = JSON.stringify(jsonToZodMeta);
      expect(fullContent).not.toContain("zero runtime overhead");
      expect(fullContent).not.toContain("100% type safety");
    });
  });

  describe("JSON to Zod Engine Accuracy", () => {
    it("detects ISO datetimes with timezone offsets correctly", () => {
      const input = JSON.stringify({
        createdAt: "2026-11-01T20:30:00+02:00",
        endpoint: "https://castov.com",
        contact: "dev@castov.com",
        userId: "123e4567-e89b-12d3-a456-426614174000",
      });

      const res = convert(input);
      expect(res).toContain('createdAt: z.string().datetime({ offset: true })');
      expect(res).toContain('endpoint: z.string().url()');
      expect(res).toContain('contact: z.string().email()');
      expect(res).toContain('userId: z.string().uuid()');
    });

    it("merges heterogeneous object arrays with .optional()", () => {
      const input = JSON.stringify([
        { id: 1, name: "Alpha" },
        { id: 2, name: "Beta", tags: ["a", "b"] },
      ]);

      const res = convert(input);
      expect(res).toContain("tags: z.array(z.string()).optional()");
      expect(res).toContain("id: z.number().int()");
      expect(res).toContain("name: z.string()");
    });

    it("supports null handling configurations", () => {
      const input = JSON.stringify({ bio: null });

      const resNullable = convert(input, { nullHandling: "nullable" });
      expect(resNullable).toContain("bio: z.unknown().nullable()");

      const resNull = convert(input, { nullHandling: "null" });
      expect(resNull).toContain("bio: z.null()");

      const resNullish = convert(input, { nullHandling: "nullish" });
      expect(resNullish).toContain("bio: z.unknown().nullish()");
    });

    it("supports strict mode and custom naming", () => {
      const input = JSON.stringify({ sku: "A100" });

      const res = convert(input, {
        rootName: "Product",
        strictMode: true,
        zodVersion: "v4",
      });

      expect(res).toContain("export const ProductSchema = z.object({");
      expect(res).toContain("}).strict();");
      expect(res).toContain("export type Product = z.infer<typeof ProductSchema>;");
      expect(res).toContain("Target: Zod v4");
    });
  });
});
