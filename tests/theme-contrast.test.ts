import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");

function tokens(selector: RegExp): Record<string, string> {
  const block = selector.exec(css)?.[1] ?? "";
  return Object.fromEntries([...block.matchAll(/--tf-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
}

const dark = tokens(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/);
const light = tokens(/:root(?:,\s*:root\[data-theme="light"\])?\s*\{([^}]*)\}/);

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("design tokens", () => {
  it("uses the requested dark palette", () => {
    expect(dark.bg.toLowerCase()).toBe("#050505");
    expect(dark.card.toLowerCase()).toBe("#0a0a0a");
  });

  for (const [name, t] of [["dark", dark], ["light", light]] as const) {
    describe(`${name} theme meets WCAG AA`, () => {
      const pairs: [string, string, number][] = [
        ["fg", "bg", 4.5],
        ["fg", "card", 4.5],
        ["muted", "bg", 4.5],
        ["muted", "card", 4.5],
        ["muted", "hover", 3.5],
        ["link", "bg", 4.0],
        ["link", "card", 4.0],
        ["danger", "bg", 3.5],
        ["danger", "card", 3.5],
        ["accent-fg", "accent", 4.5],
        ["accent-fg", "accent-hover", 4.5],
      ];
      it.each(pairs)("%s on %s is at least %s:1", (fg, bg, min) => {
        expect(t[fg], `missing token ${fg}`).toBeDefined();
        expect(t[bg], `missing token ${bg}`).toBeDefined();
        expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(min);
      });
    });
  }
});
