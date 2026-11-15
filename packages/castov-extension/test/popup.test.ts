// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initPopup } from "../src/popup/popup";
import { recordSecretBlock, getSettings, updateSettings } from "../src/storage/counter";

describe("Castov Secret Shield - Popup Interface & i18n", () => {
  beforeEach(async () => {
    // Reset settings
    await updateSettings({ enabled: true, countingEnabled: true, siteToggles: {} });

    document.body.innerHTML = `
      <h1 class="app-title" data-i18n="popupTitle">Castov Secret Shield</h1>
      <p class="app-tagline" data-i18n="popupTagline">AI Paste & Secret Leak Protection</p>
      <span class="privacy-badge" data-i18n="popupPrivacyBadge">Offline Only</span>
      <div id="stat-weekly-count">0</div>
      <div class="stat-label" data-i18n="popupWeeklyLabel">Secrets Blocked This Week</div>
      <div id="today-breakdown"></div>
      <input type="checkbox" id="toggle-master-shield" data-i18n-aria="popupShieldAria" aria-label="Toggle global shield protection" />
      <input type="checkbox" id="toggle-counting" data-i18n-aria="popupCounterAria" aria-label="Toggle local anonymous secret counters" />
      <div id="sites-list"></div>
      <a id="link-castov" href="https://castov.com" data-i18n="popupFooterLink">castov.com ↗</a>
    `;
  });

  afterEach(() => {
    delete (globalThis as any).chrome;
    vi.restoreAllMocks();
  });

  it("loads weekly count and updates the DOM", async () => {
    await recordSecretBlock(["AWS_KEY", "OPENAI_KEY"]);

    await initPopup();

    const countEl = document.getElementById("stat-weekly-count");
    expect(countEl?.textContent).toBe("2");

    const breakdownEl = document.getElementById("today-breakdown");
    expect(breakdownEl?.innerHTML).toContain("AWS_KEY: 1");
    expect(breakdownEl?.innerHTML).toContain("OPENAI_KEY: 1");
  });

  it("applies chrome.i18n.getMessage to popup text and aria-label elements", async () => {
    (globalThis as any).chrome = {
      i18n: {
        getMessage: vi.fn((key: string) => `[i18n:${key}]`),
      },
    };

    await initPopup();

    expect(document.querySelector(".app-title")?.textContent).toBe("[i18n:popupTitle]");
    expect(document.querySelector(".app-tagline")?.textContent).toBe("[i18n:popupTagline]");
    expect(document.querySelector(".privacy-badge")?.textContent).toBe("[i18n:popupPrivacyBadge]");
    expect(document.getElementById("toggle-master-shield")?.getAttribute("aria-label")).toBe(
      "[i18n:popupShieldAria]"
    );
    expect(document.getElementById("toggle-counting")?.getAttribute("aria-label")).toBe(
      "[i18n:popupCounterAria]"
    );
  });

  it("toggles master protection and persists setting", async () => {
    await initPopup();

    const masterToggle = document.getElementById("toggle-master-shield") as HTMLInputElement;
    expect(masterToggle.checked).toBe(true);

    // Toggle off
    masterToggle.checked = false;
    masterToggle.dispatchEvent(new Event("change"));

    // Allow async storage update
    await new Promise((r) => setTimeout(r, 10));

    const updated = await getSettings();
    expect(updated.enabled).toBe(false);
  });

  it("renders all 11 AI chat sites with individual accessible toggles", async () => {
    await initPopup();

    const siteItems = document.querySelectorAll(".site-item");
    expect(siteItems.length).toBe(11);

    // Verify all 3 deepseek toggles are present and distinct
    const deepseekChatToggle = document.getElementById("toggle-site-deepseek") as HTMLInputElement;
    expect(deepseekChatToggle).not.toBeNull();
    expect(deepseekChatToggle.checked).toBe(true);
    expect(deepseekChatToggle.getAttribute("aria-label")).toContain("chat.deepseek.com");

    const deepseekMainToggle = document.getElementById("toggle-site-deepseek_main") as HTMLInputElement;
    expect(deepseekMainToggle).not.toBeNull();
    expect(deepseekMainToggle.checked).toBe(true);
    expect(deepseekMainToggle.getAttribute("aria-label")).toContain("deepseek.com");

    const deepseekWwwToggle = document.getElementById("toggle-site-deepseek_www") as HTMLInputElement;
    expect(deepseekWwwToggle).not.toBeNull();
    expect(deepseekWwwToggle.checked).toBe(true);
    expect(deepseekWwwToggle.getAttribute("aria-label")).toContain("www.deepseek.com");

    // Verify all 3 copilot toggles are present and distinct
    const copilotToggle = document.getElementById("toggle-site-copilot") as HTMLInputElement;
    expect(copilotToggle).not.toBeNull();
    expect(copilotToggle.checked).toBe(true);
    expect(copilotToggle.getAttribute("aria-label")).toContain("copilot.microsoft.com");

    const copilotCloudToggle = document.getElementById("toggle-site-copilot_cloud") as HTMLInputElement;
    expect(copilotCloudToggle).not.toBeNull();
    expect(copilotCloudToggle.checked).toBe(true);
    expect(copilotCloudToggle.getAttribute("aria-label")).toContain("copilot.cloud.microsoft");

    const copilotConsumerToggle = document.getElementById("toggle-site-copilot_consumer") as HTMLInputElement;
    expect(copilotConsumerToggle).not.toBeNull();
    expect(copilotConsumerToggle.checked).toBe(true);
    expect(copilotConsumerToggle.getAttribute("aria-label")).toContain("copilot.com");

    // Toggle off ChatGPT
    const chatGptToggle = document.getElementById("toggle-site-chatgpt") as HTMLInputElement;
    expect(chatGptToggle).not.toBeNull();
    chatGptToggle.checked = false;
    chatGptToggle.dispatchEvent(new Event("change"));

    await new Promise((r) => setTimeout(r, 10));

    const updated = await getSettings();
    expect(updated.siteToggles["chatgpt.com"]).toBe(false);
  });
});
