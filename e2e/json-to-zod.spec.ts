import { test, expect } from "@playwright/test";

test.describe("JSON to Zod Converter E2E", () => {
  test("loads /convert/json-to-zod, waits for output, and verifies it contains z.object", async ({ page }) => {
    await page.goto("/convert/json-to-zod", { waitUntil: "domcontentloaded" });

    // Verify page title
    await expect(page).toHaveTitle(/JSON to Zod Schema Converter/i);

    // Locate the read-only output textarea
    const outputTextarea = page.locator("textarea[readonly]");
    await expect(outputTextarea).toBeVisible();

    // Verify output contains z.object
    await expect(outputTextarea).toHaveValue(/z\.object/, { timeout: 10000 });

    // Verify key fields are properly inferred
    const outputValue = await outputTextarea.inputValue();
    expect(outputValue).toContain("export const UserSchema = z.object({");
    expect(outputValue).toContain("email: z.string().email()");
    expect(outputValue).toContain("createdAt: z.string().datetime({ offset: true })");
    expect(outputValue).toContain("export type User = z.infer<typeof UserSchema>;");
  });
});
