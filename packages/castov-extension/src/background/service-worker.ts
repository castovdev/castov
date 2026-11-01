/**
 * Castov Secret Shield - Background Service Worker (Manifest V3)
 *
 * Responsibilities:
 * - Manages the "Castov: Decode Selection" context menu.
 * - Decodes selected text (JWT, Timestamp, Base64) purely locally.
 * - Sends the decoded result to the active tab's content script to display the tooltip.
 * - ZERO network calls, zero telemetry, zero background timers.
 */

import { decodeSelectionLocally } from "../decoder";

const CONTEXT_MENU_ID = "castov-decode-selection";

// Initialize context menu on install or update
if (typeof chrome !== "undefined" && chrome.runtime && chrome.contextMenus) {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: CONTEXT_MENU_ID,
        title: "Castov: Decode Selection",
        contexts: ["selection"],
      });
    });
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === CONTEXT_MENU_ID && info.selectionText && tab && typeof tab.id === "number") {
      const decoded = decodeSelectionLocally(info.selectionText);

      chrome.tabs.sendMessage(tab.id, {
        type: "CASTOV_SHOW_DECODE_TOOLTIP",
        data: decoded,
      }).catch(() => {
        // Tab might not have content script loaded (e.g. chrome:// or non-supported URL)
      });
    }
  });
}
