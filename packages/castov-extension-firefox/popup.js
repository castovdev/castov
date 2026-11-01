/**
 * Castov Secret Shield - Firefox Extension Popup Script
 * Zero Network • Offline Only • Privacy-First
 */

const extApi = typeof browser !== "undefined" ? browser : chrome;

const SUPPORTED_SITES = [
  { id: "chatgpt", name: "ChatGPT", domain: "chatgpt.com" },
  { id: "claude", name: "Claude AI", domain: "claude.ai" },
  { id: "gemini", name: "Google Gemini", domain: "gemini.google.com" },
  { id: "copilot", name: "Microsoft Copilot", domain: "copilot.microsoft.com" },
  { id: "deepseek", name: "DeepSeek", domain: "chat.deepseek.com" },
  { id: "perplexity", name: "Perplexity AI", domain: "perplexity.ai" }
];

document.addEventListener("DOMContentLoaded", () => {
  const masterToggle = document.getElementById("toggle-master");
  const countingToggle = document.getElementById("toggle-counting");
  const weeklyCountEl = document.getElementById("stat-weekly-count");
  const sitesListEl = document.getElementById("sites-list");

  // Load current settings and counts
  extApi.storage.local.get(["castov_shield_settings", "castov_shield_counts"], (res) => {
    const settings = res.castov_shield_settings || {
      enabled: true,
      countingEnabled: true,
      siteToggles: {}
    };

    if (settings.siteToggles === undefined) {
      settings.siteToggles = {};
    }

    // Set switches
    masterToggle.checked = settings.enabled !== false;
    countingToggle.checked = settings.countingEnabled !== false;

    // Calculate weekly blocked count
    const counts = res.castov_shield_counts || {};
    let weeklyTotal = 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffStr = sevenDaysAgo.toISOString().slice(0, 10);

    for (const [dateStr, dayMap] of Object.entries(counts)) {
      if (dateStr >= cutoffStr && typeof dayMap === "object" && dayMap !== null) {
        for (const count of Object.values(dayMap)) {
          if (typeof count === "number") {
            weeklyTotal += count;
          }
        }
      }
    }
    weeklyCountEl.textContent = weeklyTotal.toLocaleString();

    // Render sites list
    renderSites(settings, sitesListEl);

    // Save changes on master toggle
    masterToggle.addEventListener("change", () => {
      settings.enabled = masterToggle.checked;
      saveSettings(settings);
    });

    // Save changes on counting toggle
    countingToggle.addEventListener("change", () => {
      settings.countingEnabled = countingToggle.checked;
      saveSettings(settings);
    });
  });
});

function renderSites(settings, container) {
  container.textContent = "";

  SUPPORTED_SITES.forEach((site) => {
    const item = document.createElement("div");
    item.className = "site-item";

    const info = document.createElement("div");
    info.className = "site-info";

    const isSiteEnabled = settings.siteToggles[site.id] !== false;

    const dot = document.createElement("span");
    dot.className = "site-dot";
    dot.style.backgroundColor = isSiteEnabled ? "#10b981" : "#64748b";

    const name = document.createElement("span");
    name.className = "site-name";
    name.textContent = site.name;

    info.appendChild(dot);
    info.appendChild(name);

    const switchLabel = document.createElement("label");
    switchLabel.className = "switch switch-sm";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = isSiteEnabled;

    const slider = document.createElement("span");
    slider.className = "slider";

    checkbox.addEventListener("change", () => {
      settings.siteToggles[site.id] = checkbox.checked;
      dot.style.backgroundColor = checkbox.checked ? "#10b981" : "#64748b";
      saveSettings(settings);
    });

    switchLabel.appendChild(checkbox);
    switchLabel.appendChild(slider);

    item.appendChild(info);
    item.appendChild(switchLabel);
    container.appendChild(item);
  });
}

function saveSettings(settings) {
  extApi.storage.local.set({ castov_shield_settings: settings });
}
