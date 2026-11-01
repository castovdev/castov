/**
 * Castov Secret Shield - Popup Controller
 *
 * Privacy Guarantees:
 * - Reads only local aggregated counts and user preferences from chrome.storage.local.
 * - Zero network calls, zero tracking pixels, zero analytics.
 * - No upsells, no subscription nagging.
 */

import { AI_CHAT_SITES } from "../config/sites";
import {
  getSettings,
  updateSettings,
  getWeeklyBlockedCount,
  getDailyBreakdown,
  ShieldSettings,
} from "../storage/counter";

export async function initPopup(): Promise<void> {
  const [settings, weeklyCount, todayBreakdown] = await Promise.all([
    getSettings(),
    getWeeklyBlockedCount(),
    getDailyBreakdown(),
  ]);

  renderWeeklyStat(weeklyCount);
  renderTodayBreakdown(todayBreakdown);
  bindMasterControls(settings);
  renderSitesList(settings);
  bindExternalLink();
}

function renderWeeklyStat(count: number): void {
  const el = document.getElementById("stat-weekly-count");
  if (el) {
    el.textContent = String(count);
  }
}

function renderTodayBreakdown(breakdown: Record<string, number>): void {
  const container = document.getElementById("today-breakdown");
  if (!container) return;

  const entries = Object.entries(breakdown);
  if (entries.length === 0) {
    container.style.display = "none";
    return;
  }

  container.style.display = "flex";
  container.innerHTML = entries
    .map(([type, count]) => `<span class="breakdown-pill">${type}: ${count}</span>`)
    .join("");
}

function bindMasterControls(settings: ShieldSettings): void {
  const masterToggle = document.getElementById("toggle-master-shield") as HTMLInputElement | null;
  const countingToggle = document.getElementById("toggle-counting") as HTMLInputElement | null;

  if (masterToggle) {
    masterToggle.checked = settings.enabled;
    masterToggle.addEventListener("change", async () => {
      await updateSettings({ enabled: masterToggle.checked });
    });
  }

  if (countingToggle) {
    countingToggle.checked = settings.countingEnabled;
    countingToggle.addEventListener("change", async () => {
      await updateSettings({ countingEnabled: countingToggle.checked });
    });
  }
}

function renderSitesList(settings: ShieldSettings): void {
  const container = document.getElementById("sites-list");
  if (!container) return;

  container.innerHTML = "";

  for (const site of AI_CHAT_SITES) {
    const isEnabled = settings.siteToggles[site.domain] ?? true;

    const row = document.createElement("div");
    row.className = "site-item";

    row.innerHTML = `
      <div>
        <div class="site-name">${site.name}</div>
        <div class="site-domain">${site.domain}</div>
      </div>
      <label class="switch">
        <input type="checkbox" id="toggle-site-${site.id}" ${isEnabled ? "checked" : ""} />
        <span class="slider"></span>
      </label>
    `;

    const input = row.querySelector("input") as HTMLInputElement;
    input.addEventListener("change", async () => {
      const current = await getSettings();
      await updateSettings({
        siteToggles: {
          ...current.siteToggles,
          [site.domain]: input.checked,
        },
      });
    });

    container.appendChild(row);
  }
}

function bindExternalLink(): void {
  const link = document.getElementById("link-castov");
  if (link) {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const url = "https://castov.com";
      if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url });
      } else {
        window.open(url, "_blank");
      }
    });
  }
}

// Auto-run if executed in a DOM environment
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initPopup().catch(() => {});
  });
}
