// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { initPopup } from "../src/popup/popup";
import { recordSecretBlock, getSettings, updateSettings } from "../src/storage/counter";

describe("Castov Secret Shield - Popup Interface", () => {
  beforeEach(async () => {
    // Reset settings
    await updateSettings({ enabled: true, countingEnabled: true, siteToggles: {} });

    document.body.innerHTML = `
      <div id="stat-weekly-count">0</div>
      <div id="today-breakdown"></div>
      <input type="checkbox" id="toggle-master-shield" />
      <input type="checkbox" id="toggle-counting" />
      <div id="sites-list"></div>
      <a id="link-castov" href="https://castov.com">castov.com</a>
    `;
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

  it("renders all 11 AI chat sites with individual toggles", async () => {
    await initPopup();

    const siteItems = document.querySelectorAll(".site-item");
    expect(siteItems.length).toBe(11);

    // Verify all 3 deepseek toggles are present and distinct
    const deepseekChatToggle = document.getElementById("toggle-site-deepseek") as HTMLInputElement;
    expect(deepseekChatToggle).not.toBeNull();
    expect(deepseekChatToggle.checked).toBe(true);

    const deepseekMainToggle = document.getElementById("toggle-site-deepseek_main") as HTMLInputElement;
    expect(deepseekMainToggle).not.toBeNull();
    expect(deepseekMainToggle.checked).toBe(true);

    const deepseekWwwToggle = document.getElementById("toggle-site-deepseek_www") as HTMLInputElement;
    expect(deepseekWwwToggle).not.toBeNull();
    expect(deepseekWwwToggle.checked).toBe(true);

    // Verify copilot consumer toggle is present
    const copilotConsumerToggle = document.getElementById("toggle-site-copilot_consumer") as HTMLInputElement;
    expect(copilotConsumerToggle).not.toBeNull();
    expect(copilotConsumerToggle.checked).toBe(true);

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
