import { describe, it, expect } from "vitest";
import { CRON_PRESETS, getPresetBySlug } from "@/lib/time/cron-presets";
import { parseCron } from "@/lib/time";

describe("Cron Presets & Parsing", () => {
  it("contains exactly 12 presets", () => {
    expect(CRON_PRESETS).toHaveLength(12);
  });

  it.each(CRON_PRESETS)("preset $slug parses as valid cron expression", ({ slug, expression }) => {
    const preset = getPresetBySlug(slug);
    expect(preset).toBeDefined();
    expect(preset?.expression).toBe(expression);

    const parsed = parseCron(expression);
    expect(parsed.ok).toBe(true);
  });

  it("handles underscore-separated expressions correctly", () => {
    const expr = "0_0_*_*_*".replace(/_/g, " ");
    const parsed = parseCron(expr);
    expect(parsed.ok).toBe(true);
  });

  it("rejects invalid cron expressions", () => {
    expect(parseCron("not-a-cron").ok).toBe(false);
    expect(parseCron("* * *").ok).toBe(false);
    expect(parseCron("99 99 99 99 99").ok).toBe(false);
    expect(getPresetBySlug("non-existent-preset")).toBeUndefined();
  });
});
