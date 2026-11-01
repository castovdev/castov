/**
 * Castov Secret Shield - SafePaste Content Script
 *
 * Intercepts the `paste` event on AI chat sites in the capture phase.
 * Never stores, transmits, or logs secrets.
 */

import { isSupportedAISite } from "../config/sites";
import { scanTextForSecrets } from "../detector/scanner";
import { redactSecrets } from "../detector/redaction";
import { recordSecretBlock, isProtectionActiveForSite } from "../storage/counter";
import {
  resolveEditableTarget,
  injectTextIntoEditor,
  captureSelectionState,
  restoreSelectionState,
} from "./editor-injector";
import { showSecretDetectedModal, ModalUserChoice } from "./shadow-modal";
import { showDecodeTooltip } from "./decode-tooltip";
import { UnifiedDecodeResult } from "../decoder";

/**
 * Handles an intercepted clipboard paste event.
 * Returns true if paste was intercepted/prevented, false if allowed through untouched.
 */
export async function handlePasteEvent(
  event: ClipboardEvent,
  modalOverride?: (findings: any) => Promise<ModalUserChoice>
): Promise<boolean> {
  const target = resolveEditableTarget(event);
  if (!target) {
    return false;
  }

  const clipboardData = event.clipboardData;
  if (!clipboardData) {
    return false;
  }

  const pastedText = clipboardData.getData("text/plain");
  if (!pastedText) {
    return false;
  }

  const scan = scanTextForSecrets(pastedText);
  if (!scan.hasFindings) {
    return false;
  }

  // Secret found! Halt the event immediately before host application sees it
  event.preventDefault();
  event.stopImmediatePropagation();

  // Capture selection / caret position before opening the modal
  const savedSelection = captureSelectionState(target);

  const showModal = modalOverride ?? showSecretDetectedModal;
  const choice = await showModal({
    findings: scan.findings,
  });

  if (choice === "redacted") {
    const redacted = redactSecrets(pastedText, scan.findings);
    // Record aggregated counter (never values or URLs)
    await recordSecretBlock(scan.findings.map((f) => f.type));
    restoreSelectionState(target, savedSelection);
    injectTextIntoEditor(target, redacted.redactedText);
    return true;
  }

  if (choice === "original") {
    restoreSelectionState(target, savedSelection);
    injectTextIntoEditor(target, pastedText);
    return true;
  }

  // Cancelled: do nothing (already prevented)
  return true;
}

/**
 * Handles an intercepted drag-and-drop event.
 * Prevents dropping secrets directly into chat inputs.
 */
export async function handleDropEvent(
  event: DragEvent,
  modalOverride?: (findings: any) => Promise<ModalUserChoice>
): Promise<boolean> {
  const target = resolveEditableTarget(event);
  if (!target) {
    return false;
  }

  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) {
    return false;
  }

  let droppedText = "";
  try {
    droppedText = dataTransfer.getData("text/plain");
  } catch {
    return false;
  }

  if (!droppedText) {
    return false;
  }

  const scan = scanTextForSecrets(droppedText);
  if (!scan.hasFindings) {
    return false;
  }

  // Secret detected in dropped text! Halt event before target handles it
  event.preventDefault();
  event.stopImmediatePropagation();

  // Capture selection / caret position before opening modal
  const savedSelection = captureSelectionState(target);

  const showModal = modalOverride ?? showSecretDetectedModal;
  const choice = await showModal({
    findings: scan.findings,
  });

  if (choice === "redacted") {
    const redacted = redactSecrets(droppedText, scan.findings);
    await recordSecretBlock(scan.findings.map((f) => f.type));
    restoreSelectionState(target, savedSelection);
    injectTextIntoEditor(target, redacted.redactedText);
    return true;
  }

  if (choice === "original") {
    restoreSelectionState(target, savedSelection);
    injectTextIntoEditor(target, droppedText);
    return true;
  }

  // Cancelled: do nothing (already prevented)
  return true;
}

/**
 * Initialize SafePaste content script on supported AI chat domains.
 */
export async function initSafePaste(): Promise<() => void> {
  const hostname = typeof window !== "undefined" && window.location ? window.location.hostname : "";

  // Guard: run only on approved AI chat sites
  if (hostname && !isSupportedAISite(hostname)) {
    return () => {};
  }

  const isActive = await isProtectionActiveForSite(hostname);
  if (!isActive) {
    return () => {};
  }

  const onPaste = (e: ClipboardEvent) => {
    handlePasteEvent(e).catch(() => {});
  };

  const onDrop = (e: DragEvent) => {
    handleDropEvent(e).catch(() => {});
  };

  const onMessage = (message: any) => {
    if (message && message.type === "CASTOV_SHOW_DECODE_TOOLTIP" && message.data) {
      showDecodeTooltip(message.data as UnifiedDecodeResult);
    }
  };

  window.addEventListener("paste", onPaste, true);
  window.addEventListener("drop", onDrop, true);

  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(onMessage);
  }

  return () => {
    window.removeEventListener("paste", onPaste, true);
    window.removeEventListener("drop", onDrop, true);
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.removeListener(onMessage);
    }
  };
}

// Auto-run if running in real browser context
if (typeof window !== "undefined" && typeof document !== "undefined") {
  initSafePaste().catch(() => {});
}
