/**
 * Castov Secret Shield - Privacy-First Local Counter Storage
 *
 * Invariants:
 * - NEVER stores matched secret strings, surrounding text, prompt contents, or URLs.
 * - Stores ONLY aggregated counts by secret type per calendar day (UTC): e.g. { "2026-10-28": { "AWS_KEY": 2 } }
 * - Provides a toggle (`countingEnabled`) allowing users to completely disable counting.
 */

import { SecretType } from "../detector/types";

export interface DailyCounts {
  [dateIso: string]: {
    [type in SecretType]?: number;
  };
}

export interface ShieldSettings {
  enabled: boolean;
  countingEnabled: boolean;
  siteToggles: Record<string, boolean>; // domain -> enabled (true by default)
}

const STORAGE_KEY_COUNTS = "castov_shield_counts";
const STORAGE_KEY_SETTINGS = "castov_shield_settings";

const DEFAULT_SETTINGS: ShieldSettings = {
  enabled: true,
  countingEnabled: true,
  siteToggles: {},
};

// Memory fallback for tests and environments without chrome.storage
const memoryStore: Record<string, any> = {};

async function storageGet<T>(key: string, defaultVal: T): Promise<T> {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    try {
      const res = await chrome.storage.local.get(key);
      return (res[key] as T) ?? defaultVal;
    } catch {
      return defaultVal;
    }
  }
  return (memoryStore[key] as T) ?? defaultVal;
}

async function storageSet(key: string, value: any): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    try {
      await chrome.storage.local.set({ [key]: value });
      return;
    } catch {
      // Fall through to memory
    }
  }
  memoryStore[key] = value;
}

export function getTodayDateKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export async function getSettings(): Promise<ShieldSettings> {
  return await storageGet<ShieldSettings>(STORAGE_KEY_SETTINGS, DEFAULT_SETTINGS);
}

export async function updateSettings(partial: Partial<ShieldSettings>): Promise<ShieldSettings> {
  const current = await getSettings();
  const updated: ShieldSettings = {
    ...current,
    ...partial,
    siteToggles:
      partial.siteToggles !== undefined ? { ...partial.siteToggles } : { ...current.siteToggles },
  };
  await storageSet(STORAGE_KEY_SETTINGS, updated);
  return updated;
}

/**
 * Records blocked secrets by type for the current date.
 * If counting is disabled, this is a no-op.
 */
export async function recordSecretBlock(types: readonly SecretType[]): Promise<void> {
  if (!types || types.length === 0) return;

  const settings = await getSettings();
  if (!settings.countingEnabled) return;

  const counts = await storageGet<DailyCounts>(STORAGE_KEY_COUNTS, {});
  const today = getTodayDateKey();
  const todayEntry = counts[today] || {};

  for (const t of types) {
    todayEntry[t] = (todayEntry[t] || 0) + 1;
  }
  counts[today] = todayEntry;

  // Prune entries older than 30 days to keep storage strictly minimal
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);

  for (const dateKey of Object.keys(counts)) {
    if (dateKey < cutoffStr) {
      delete counts[dateKey];
    }
  }

  await storageSet(STORAGE_KEY_COUNTS, counts);
}

/**
 * Returns total count of secrets blocked in the last 7 days.
 */
export async function getWeeklyBlockedCount(): Promise<number> {
  const counts = await storageGet<DailyCounts>(STORAGE_KEY_COUNTS, {});
  const now = new Date();
  let total = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayData = counts[key];
    if (dayData) {
      for (const count of Object.values(dayData)) {
        if (typeof count === "number") {
          total += count;
        }
      }
    }
  }

  return total;
}

/**
 * Returns the count breakdown by secret type for today (or specified date).
 */
export async function getDailyBreakdown(dateIso: string = getTodayDateKey()): Promise<Record<string, number>> {
  const counts = await storageGet<DailyCounts>(STORAGE_KEY_COUNTS, {});
  const dayData = counts[dateIso] || {};
  return { ...dayData };
}

/**
 * Checks if extension protection is enabled for a given site hostname.
 */
export async function isProtectionActiveForSite(hostname: string): Promise<boolean> {
  const settings = await getSettings();
  if (!settings.enabled) return false;

  const hostLower = (hostname || "").toLowerCase().split(":")[0];

  // 1. Exact match has highest priority
  if (typeof settings.siteToggles[hostLower] === "boolean") {
    return settings.siteToggles[hostLower];
  }

  // 2. Parent domain toggle fallback
  for (const [domain, isEnabled] of Object.entries(settings.siteToggles)) {
    if (hostLower.endsWith(`.${domain}`)) {
      return isEnabled;
    }
  }

  return true; // Default enabled
}
