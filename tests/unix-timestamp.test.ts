import { describe, it, expect } from "vitest";
import { parseTimestampParam } from "@/app/unix/[timestamp]/page";

describe("Unix Timestamp Parameter Parser", () => {
  it("parses valid seconds timestamp", () => {
    const res = parseTimestampParam("1700000000");
    expect(res).not.toBeNull();
    expect(res?.ts).toBe(1700000000);
    expect(res?.date.getUTCFullYear()).toBe(2023);
  });

  it("parses valid milliseconds timestamp", () => {
    const res = parseTimestampParam("1700000000000");
    expect(res).not.toBeNull();
    expect(res?.ts).toBe(1700000000000);
    expect(res?.date.getUTCFullYear()).toBe(2023);
  });

  it("parses zero timestamp (epoch start)", () => {
    const res = parseTimestampParam("0");
    expect(res).not.toBeNull();
    expect(res?.ts).toBe(0);
    expect(res?.date.toISOString()).toBe("1970-01-01T00:00:00.000Z");
  });

  it("parses negative timestamps (pre-1970)", () => {
    const res = parseTimestampParam("-100000000");
    expect(res).not.toBeNull();
    expect(res?.ts).toBe(-100000000);
    expect(res?.date.getUTCFullYear()).toBe(1966);
  });

  it("rejects non-numeric characters and mixed alphanumeric", () => {
    expect(parseTimestampParam("abc")).toBeNull();
    expect(parseTimestampParam("1234abc")).toBeNull();
    expect(parseTimestampParam("12.34")).toBeNull();
    expect(parseTimestampParam("")).toBeNull();
    expect(parseTimestampParam("   ")).toBeNull();
  });

  it("rejects out-of-bounds extreme years", () => {
    // 1e16 results in year beyond year 3000 boundary
    expect(parseTimestampParam("999999999999999")).toBeNull();
  });
});
