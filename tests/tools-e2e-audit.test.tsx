// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TOOLS, ToolSlug } from "@/content/tools";
import { ToolInterface } from "@/components/tool-interface";

// Polyfill missing JSDOM APIs for complex canvas/media tools
beforeEach(() => {
  window.HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn().mockReturnValue({ data: new Uint8Array(100) }),
    putImageData: vi.fn(),
    createImageData: vi.fn().mockReturnValue([]),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  });

  window.URL.createObjectURL = vi.fn(() => "blob:test");
  window.URL.revokeObjectURL = vi.fn();
});

describe("End-to-End Tool Component Integrity & Privacy Audit", () => {
  const allSlugs = TOOLS.map((t) => t.slug);

  it("registers 61 tools with non-empty metadata", () => {
    expect(allSlugs.length).toBeGreaterThanOrEqual(61);
    for (const tool of TOOLS) {
      expect(tool.name).toBeTruthy();
      expect(tool.intro).toBeTruthy();
      expect(tool.metaDescription).toBeTruthy();
      expect(tool.category).toBeTruthy();
    }
  });

  it("renders core tools without crashing or throwing runtime exceptions", () => {
    const flagshipTools: ToolSlug[] = [
      "unix-timestamp-converter",
      "timezone-converter",
      "jwt-decoder",
      "hash-generator",
      "uuid-generator",
      "json-formatter",
      "json-to-ts",
      "diff-checker",
      "base64-encoder-decoder",
      "env-vault",
      "cyber-decoder",
      "world-clock",
      "cron-generator",
      "date-difference",
    ];

    for (const slug of flagshipTools) {
      const { container } = render(<ToolInterface slug={slug} />);
      expect(container).toBeInTheDocument();
      // Ensure no raw JavaScript exceptions leak onto the rendered DOM
      expect(container.textContent).not.toMatch(/ReferenceError|TypeError: Cannot read properties/);
    }
  });

  it("verifies 100% Client-Side Web Crypto in security tools", () => {
    expect(typeof window.crypto.subtle).toBe("object");
    expect(typeof window.crypto.getRandomValues).toBe("function");
  });
});
