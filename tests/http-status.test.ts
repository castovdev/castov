import { describe, it, expect } from "vitest";
import { HTTP_STATUS_CODES, HTTP_STATUS_LIST } from "@/lib/http-statuses";
import { generateStaticParams } from "@/app/http-status/[code]/page";

describe("HTTP Status Codes System", () => {
  it("populates comprehensive HTTP status list", () => {
    expect(HTTP_STATUS_LIST.length).toBeGreaterThanOrEqual(25);
  });

  it("includes critical status codes (200, 301, 400, 401, 403, 404, 429, 500, 502)", () => {
    const codes = ["200", "301", "400", "401", "403", "404", "429", "500", "502"];
    for (const code of codes) {
      expect(HTTP_STATUS_CODES[code]).toBeDefined();
      expect(HTTP_STATUS_CODES[code].title).toBeTruthy();
      expect(HTTP_STATUS_CODES[code].description).toBeTruthy();
      expect(HTTP_STATUS_CODES[code].why).toBeTruthy();
      expect(HTTP_STATUS_CODES[code].fix).toBeTruthy();
    }
  });

  it("generateStaticParams generates valid route parameter objects", () => {
    const params = generateStaticParams();
    expect(params.length).toBe(HTTP_STATUS_LIST.length);
    expect(params.some((p) => p.code === "404")).toBe(true);
    expect(params.some((p) => p.code === "200")).toBe(true);
  });
});
