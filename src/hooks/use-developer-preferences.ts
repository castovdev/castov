"use client";

import { useSyncExternalStore } from "react";

export interface DeveloperPreferences {
  timezone: string;
  indentStyle: "2" | "4" | "tab";
  defaultLanguage: "typescript" | "python" | "go" | "json" | "rust";
}

const PREFERENCES_KEY = "castov_developer_preferences";

const DEFAULT_PREFERENCES: DeveloperPreferences = {
  timezone: "UTC",
  indentStyle: "2",
  defaultLanguage: "typescript",
};

function getSnapshot(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(PREFERENCES_KEY) || "";
}

function getServerSnapshot(): string {
  return "";
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useDeveloperPreferences(): DeveloperPreferences {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!raw) {
    const detectedTz =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
        : "UTC";
    return { ...DEFAULT_PREFERENCES, timezone: detectedTz };
  }
  try {
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}
