/**
 * Castov Secret Shield - Firefox Background Service
 * Zero Network • Offline Only • Privacy-First
 */

const extApi = typeof browser !== "undefined" ? browser : chrome;

// Initialize context menus and default settings
extApi.runtime.onInstalled.addListener(() => {
  extApi.contextMenus.create({
    id: "castov-decode-selection",
    title: "Castov: Decode Selection",
    contexts: ["selection"]
  });

  // Ensure default settings exist
  extApi.storage.local.get(["castov_shield_settings"], (res) => {
    if (!res.castov_shield_settings) {
      extApi.storage.local.set({
        castov_shield_settings: {
          enabled: true,
          countingEnabled: true,
          siteToggles: {}
        }
      });
    }
  });
});

// Context Menu Click Handler -> In-Memory Decoder
extApi.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "castov-decode-selection" && tab?.id) {
    const rawText = (info.selectionText || "").trim();
    if (!rawText) return;

    const decoded = decodeSelection(rawText);
    extApi.tabs.sendMessage(tab.id, {
      type: "CASTOV_SHOW_DECODE_TOOLTIP",
      payload: decoded
    }).catch(() => {
      // Tab may not have content script injected (non-AI site)
    });
  }
});

// Listener for counter increment from content script
extApi.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "CASTOV_RECORD_BLOCK") {
    incrementBlockCount(msg.categories || []);
    sendResponse({ ok: true });
    return true;
  }
});

function decodeSelection(text) {
  // 1. Try JWT
  const jwtParts = text.split(".");
  if (jwtParts.length === 3) {
    try {
      const header = JSON.parse(decodeBase64Url(jwtParts[0]));
      const payload = JSON.parse(decodeBase64Url(jwtParts[1]));
      let expiryInfo = "No exp claim";
      if (typeof payload.exp === "number") {
        const expDate = new Date(payload.exp * 1000);
        const now = Date.now();
        const diffMs = expDate.getTime() - now;
        if (diffMs > 0) {
          const hours = Math.floor(diffMs / 3600000);
          const mins = Math.floor((diffMs % 3600000) / 60000);
          expiryInfo = `Valid (expires in \${hours}h \${mins}m - \${expDate.toISOString()})`;
        } else {
          expiryInfo = `Expired on \${expDate.toISOString()}`;
        }
      }
      return {
        kind: "JWT",
        status: "Valid Token Format",
        header,
        payload,
        expiry: expiryInfo
      };
    } catch {
      // not a valid json jwt
    }
  }

  // 2. Try Unix Timestamp
  if (/^\\d{10}$/.test(text) || /^\\d{13}$/.test(text)) {
    const num = parseInt(text, 10);
    const date = new Date(text.length === 10 ? num * 1000 : num);
    if (!isNaN(date.getTime()) && date.getFullYear() > 1990 && date.getFullYear() < 2100) {
      return {
        kind: "TIMESTAMP",
        status: "Unix Epoch Timestamp",
        iso: date.toISOString(),
        utc: date.toUTCString(),
        local: date.toLocaleString()
      };
    }
  }

  // 3. Try Base64
  if (text.length >= 8 && /^[A-Za-z0-9+/=]+$/.test(text)) {
    try {
      const decodedUtf8 = atob(text);
      if (decodedUtf8 && /[\\x20-\\x7E]/.test(decodedUtf8)) {
        return {
          kind: "BASE64",
          status: "Decoded String",
          result: decodedUtf8
        };
      }
    } catch {
      // invalid base64
    }
  }

  return {
    kind: "TEXT",
    status: "Raw Selection",
    result: text.slice(0, 100)
  };
}

function decodeBase64Url(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
}

async function incrementBlockCount(categories) {
  extApi.storage.local.get(["castov_shield_settings", "castov_shield_counts"], (res) => {
    const settings = res.castov_shield_settings || { countingEnabled: true };
    if (!settings.countingEnabled) return;

    const counts = res.castov_shield_counts || {};
    const today = new Date().toISOString().slice(0, 10);
    const dayMap = counts[today] || {};

    for (const cat of categories) {
      dayMap[cat] = (dayMap[cat] || 0) + 1;
    }
    counts[today] = dayMap;

    // Prune entries older than 30 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    for (const k of Object.keys(counts)) {
      if (k < cutoffStr) delete counts[k];
    }

    extApi.storage.local.set({ castov_shield_counts: counts });
  });
}
