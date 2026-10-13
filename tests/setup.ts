import { afterEach, vi } from "vitest";

if (typeof document !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
}

if (typeof global !== "undefined") {
  (global as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

vi.mock("sql.js", () => ({
  default: vi.fn().mockResolvedValue({
    Database: class {
      exec() { return []; }
      close() {}
    },
  }),
}));

afterEach(async () => {
  if (typeof document !== "undefined") {
    const { cleanup } = await import("@testing-library/react");
    cleanup();
  }
});
