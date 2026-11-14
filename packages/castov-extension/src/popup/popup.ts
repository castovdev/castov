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

function getPopupI18n(key: string, fallback: string): string {
  try {
    if (typeof chrome !== "undefined" && chrome.i18n && typeof chrome.i18n.getMessage === "function") {
      const msg = chrome.i18n.getMessage(key);
      if (msg) return msg;
    }
  } catch {
    // Fallback to English text
  }
  return fallback;
}

export function applyPopupI18n(): void {
  const elements = document.querySelectorAll<HTMLElement>("[data-i18n]");
  for (const el of elements) {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = getPopupI18n(key, el.textContent || "");
    }
  }

  const ariaElements = document.querySelectorAll<HTMLElement>("[data-i18n-aria]");
  for (const el of ariaElements) {
    const key = el.getAttribute("data-i18n-aria");
    if (key) {
      el.setAttribute("aria-label", getPopupI18n(key, el.getAttribute("aria-label") || ""));
    }
  }
}

export async function initPopup(): Promise<void> {
  applyPopupI18n();

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
  container.replaceChildren();
  for (const [type, count] of entries) {
    const pill = document.createElement("span");
    pill.className = "breakdown-pill";
    pill.textContent = `${type}: ${count}`;
    container.appendChild(pill);
  }
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

  container.replaceChildren();

  for (const site of AI_CHAT_SITES) {
    const isEnabled = settings.siteToggles[site.domain] ?? true;

    const row = document.createElement("div");
    row.className = "site-item";

    const infoDiv = document.createElement("div");
    const nameDiv = document.createElement("div");
    nameDiv.className = "site-name";
    nameDiv.textContent = site.name;

    const domainDiv = document.createElement("div");
    domainDiv.className = "site-domain";
    domainDiv.textContent = site.domain;

    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(domainDiv);

    const label = document.createElement("label");
    label.className = "switch";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = `toggle-site-${site.id}`;
    input.checked = isEnabled;
    input.setAttribute("aria-label", `Toggle protection for ${site.name} (${site.domain})`);

    const slider = document.createElement("span");
    slider.className = "slider";

    label.appendChild(input);
    label.appendChild(slider);

    row.appendChild(infoDiv);
    row.appendChild(label);

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
