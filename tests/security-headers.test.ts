import { describe, it, expect } from "vitest";
import nextConfig from "../next.config";

describe("Security Headers", () => {
  it("allows same-origin microphone access for Sonic-Gap while restricting others", async () => {
    if (typeof nextConfig.headers !== "function") {
      throw new Error("headers configuration function missing");
    }

    const headersList = await nextConfig.headers();
    const globalEntry = headersList.find((h) => h.source === "/:path*");
    expect(globalEntry).toBeDefined();

    const permPolicy = globalEntry?.headers.find((h) => h.key === "Permissions-Policy");
    expect(permPolicy).toBeDefined();
    expect(permPolicy?.value).toContain("microphone=(self)");
    expect(permPolicy?.value).toContain("camera=()");
    expect(permPolicy?.value).toContain("geolocation=()");
  });
});
