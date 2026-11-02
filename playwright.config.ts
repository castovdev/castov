import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://castov.com",
    channel: "chrome",
    headless: true,
    viewport: { width: 1280, height: 900 },
  },
});
