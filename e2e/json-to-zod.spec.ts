import { test, expect } from "@playwright/test";

test.describe("Modular Converters E2E", () => {
  test("json-to-zod renders v4 output, toggles to v3 syntax, and displays <pre><code> example output", async ({ page }) => {
    await page.goto("/convert/json-to-zod", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveTitle(/JSON to Zod Schema Converter/i);

    const outputTextarea = page.locator("textarea[readonly]");
    await expect(outputTextarea).toBeVisible();

    // 1. Default v4 output
    await expect(outputTextarea).toHaveValue(/z\.object/, { timeout: 10000 });
    const v4Value = await outputTextarea.inputValue();
    expect(v4Value).toContain("email: z.email()");
    expect(v4Value).toContain("website: z.url()");
    expect(v4Value).toContain("createdAt: z.iso.datetime({ offset: true })");

    // 2. Toggle to Zod v3 and verify output changes to v3 chained syntax
    const versionSelect = page.locator("#opt-zodVersion");
    await versionSelect.selectOption("v3");
    await expect(outputTextarea).toHaveValue(/z\.string\(\)\.email\(\)/, { timeout: 5000 });
    const v3Value = await outputTextarea.inputValue();
    expect(v3Value).toContain("website: z.string().url()");
    expect(v3Value).toContain("createdAt: z.string().datetime({ offset: true })");

    // 3. Verify static <pre><code> Example Output section is visible in HTML
    const exampleCode = page.locator("#example-output-heading ~ div pre code").nth(1);
    await expect(exampleCode).toBeVisible();
    await expect(exampleCode).toContainText("export const UserSchema = z.object");
  });

  test("json-to-typescript renders OrderResponse interface and <pre><code> example output", async ({ page }) => {
    await page.goto("/convert/json-to-typescript", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveTitle(/JSON to TypeScript Interface & Type Converter/i);

    const outputTextarea = page.locator("textarea[readonly]");
    await expect(outputTextarea).toBeVisible();
    await expect(outputTextarea).toHaveValue(/export interface OrderResponse/, { timeout: 10000 });

    const tsValue = await outputTextarea.inputValue();
    expect(tsValue).toContain("export interface OrderResponseCustomer");
    expect(tsValue).toContain("notes?: string;");

    // Verify <pre><code> Example Output section
    const exampleCode = page.locator("#example-output-heading ~ div pre code").nth(1);
    await expect(exampleCode).toBeVisible();
    await expect(exampleCode).toContainText("export interface OrderResponse");
  });
});
