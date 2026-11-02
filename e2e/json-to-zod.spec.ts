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

    await expect(page).toHaveTitle(/cURL to Fetch, Node\.js & Axios Converter/i);

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

  test("yaml-to-json resolves anchors, differentiates 0755 vs 0o755 in YAML 1.2 vs 1.1, and shows Copy JSON button", async ({ page }) => {
    await page.goto("/convert/yaml-to-json", { waitUntil: "networkidle" });

    await expect(page).toHaveTitle(/YAML to JSON Converter/i);
    await expect(page.getByRole("button", { name: /Copy JSON/i })).toBeVisible();

    const outputTextarea = page.locator("textarea[readonly]");
    await expect(outputTextarea).toBeVisible();
    await expect(outputTextarea).toHaveValue(/"countryCode": "NO"/, { timeout: 10000 });

    const yaml12Value = await outputTextarea.inputValue();
    expect(yaml12Value).toContain('"filePermissions": 755');
    expect(yaml12Value).toContain('"octalExplicit": 493');
    expect(yaml12Value).toContain('"driver": "json-file"');

    // Switch to YAML 1.1 and verify "NO" becomes boolean false and 0755 becomes 493
    const versionSelect = page.locator("#opt-yamlVersion");
    await versionSelect.selectOption("1.1");
    await expect(outputTextarea).toHaveValue(/"countryCode": false/, { timeout: 10000 });
    const yaml11Value = await outputTextarea.inputValue();
    expect(yaml11Value).toContain('"filePermissions": 493');
  });

  test("sql-to-prisma renders models, enums, 1:1 and 1:n relations, and @@index", async ({ page }) => {
    await page.goto("/convert/sql-to-prisma", { waitUntil: "networkidle" });

    await expect(page).toHaveTitle(/SQL to Prisma Schema Converter/i);
    await expect(page.getByRole("button", { name: /Copy Prisma Schema/i })).toBeVisible();

    const outputTextarea = page.locator("textarea[readonly]");
    await expect(outputTextarea).toBeVisible();
    await expect(outputTextarea).toHaveValue(/model User \{/, { timeout: 10000 });

    const prismaVal = await outputTextarea.inputValue();
    expect(prismaVal).toContain("enum UserRole {");
    expect(prismaVal).toContain("userProfile UserProfile?");
    expect(prismaVal).toContain("posts Post[]");
    expect(prismaVal).toContain('@@index([authorId, published], map: "idx_posts_author")');
  });

  test("env-to-zod renders Zod v4 schema without leaking values, switches to Zod v3, @t3-oss/env-nextjs, and .env.example, and warns on NEXT_PUBLIC_ secret", async ({ page }) => {
    await page.goto("/convert/env-to-zod", { waitUntil: "networkidle" });

    await expect(page).toHaveTitle(/\.env to Zod & T3 Env Schema Generator/i);

    const outputTextarea = page.locator("textarea[readonly]");
    await expect(outputTextarea).toBeVisible();
    await expect(outputTextarea).toHaveValue(/export const envSchema = z\.object/, { timeout: 10000 });

    const v4Out = await outputTextarea.inputValue();
    expect(v4Out).toContain('NODE_ENV: z.enum(["development", "production", "test"]),');
    expect(v4Out).toContain("PORT: z.coerce.number().int().positive(),");
    expect(v4Out).toContain("DATABASE_URL: z.url(),");
    expect(v4Out).toContain("ENABLE_RATE_LIMIT: z.stringbool(),");
    expect(v4Out).toContain("ADMIN_EMAIL: z.email(),");
    expect(v4Out).toContain("OPTIONAL_SENTRY_DSN: z.string().optional(),");
    // Privacy check: dummy password and keys are not in the output
    expect(v4Out).not.toContain("dummy_password");
    expect(v4Out).not.toContain("sk_live_dummy_key_val");

    // Switch to @t3-oss/env-nextjs (createEnv)
    const modeSelect = page.locator("#opt-outputMode");
    await modeSelect.selectOption("t3-env");
    await expect(outputTextarea).toHaveValue(/createEnv\(\{/, { timeout: 10000 });
    const t3Out = await outputTextarea.inputValue();
    expect(t3Out).toContain("server: {");
    expect(t3Out).toContain("client: {");
    expect(t3Out).toContain("experimental__runtimeEnv: {");

    // Click Generate .env.example button
    await page.getByRole("button", { name: /Generate \.env\.example/i }).click();
    await expect(outputTextarea).toHaveValue(/Safe \.env\.example Template/, { timeout: 10000 });

    // Paste a NEXT_PUBLIC_ secret variable and verify security alert banner
    await page.getByRole("button", { name: /Back to Zod Schema/i }).click();
    const inputTextarea = page.locator("textarea").first();
    await inputTextarea.fill("NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_live_123456\nPORT=3000");
    await expect(page.getByTestId("public-secret-warning")).toBeVisible();
  });
});
