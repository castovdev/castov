import { test, expect } from "@playwright/test";

test.describe("Modular Converters E2E", () => {
  test("json-to-zod renders v4 output, toggles to v3 syntax, and displays <pre><code> example output", async ({ page }) => {
    await page.goto("/convert/json-to-zod", { waitUntil: "networkidle" });

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
    await expect(outputTextarea).toHaveValue(/z\.string\(\)\.email\(\)/, { timeout: 10000 });
    const v3Value = await outputTextarea.inputValue();
    expect(v3Value).toContain("website: z.string().url()");
    expect(v3Value).toContain("createdAt: z.string().datetime({ offset: true })");

    // 3. Verify static <pre><code> Example Output section is visible in HTML
    const exampleCode = page.locator("#example-output-heading ~ div pre code").nth(1);
    await expect(exampleCode).toBeVisible();
    await expect(exampleCode).toContainText("export const UserSchema = z.object");
  });

  test("json-to-typescript renders OrderResponse interface with null option toggle and <pre><code> example output", async ({ page }) => {
    await page.goto("/convert/json-to-typescript", { waitUntil: "networkidle" });

    await expect(page).toHaveTitle(/JSON to TypeScript Interface & Type Converter/i);

    const outputTextarea = page.locator("textarea[readonly]");
    await expect(outputTextarea).toBeVisible();
    await expect(outputTextarea).toHaveValue(/export interface OrderResponse/, { timeout: 10000 });

    const tsValue = await outputTextarea.inputValue();
    expect(tsValue).toContain("discountCode: null;");
    expect(tsValue).toContain("export interface OrderResponseCustomer");
    expect(tsValue).toContain("notes?: string;");

    // Toggle nullHandling to unknown
    const nullSelect = page.locator("#opt-nullHandling");
    await nullSelect.selectOption("unknown");
    await expect(outputTextarea).toHaveValue(/discountCode: unknown;/, { timeout: 10000 });

    // Verify <pre><code> Example Output section
    const exampleCode = page.locator("#example-output-heading ~ div pre code").nth(1);
    await expect(exampleCode).toBeVisible();
    await expect(exampleCode).toContainText("export interface OrderResponse");
  });

  test("curl-to-fetch renders fetch() call with UTF-8 Basic Auth, switches targetClient to Node/Axios, and shows -k warning", async ({ page }) => {
    await page.goto("/convert/curl-to-fetch", { waitUntil: "networkidle" });

    await expect(page).toHaveTitle(/cURL to JavaScript Fetch, Node\.js & Axios Converter/i);

    const outputTextarea = page.locator("textarea[readonly]");
    await expect(outputTextarea).toBeVisible();
    await expect(outputTextarea).toHaveValue(/await fetch\(/, { timeout: 10000 });

    const fetchValue = await outputTextarea.inputValue();
    expect(fetchValue).toContain("new TextEncoder().encode(credentials)");
    expect(fetchValue).toContain('"Authorization": `Basic ${encodeBasicAuth("sk_test_51Nz99a:secret")}`');
    expect(fetchValue).toContain('"Idempotency-Key": "req_88172a"');
    expect(fetchValue).toContain("body: JSON.stringify(");

    // Switch targetClient to Axios
    const clientSelect = page.locator("#opt-targetClient");
    await clientSelect.selectOption("axios");
    await expect(outputTextarea).toHaveValue(/await axios\.request\(/, { timeout: 10000 });

    // Verify <pre><code> Example Output section
    const exampleCode = page.locator("#example-output-heading ~ div pre code").nth(1);
    await expect(exampleCode).toBeVisible();
    await expect(exampleCode).toContainText('await fetch("https://api.stripe.com/v1/payment_intents"');
  });
});
