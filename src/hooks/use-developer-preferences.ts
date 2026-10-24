"use client";

import { useState } from "react";

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

export function useDeveloperPreferences(): DeveloperPreferences {
  const [prefs] = useState<DeveloperPreferences>(() => {
    if (typeof window === "undefined") return DEFAULT_PREFERENCES;
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch {
      // fallback
    }
    return DEFAULT_PREFERENCES;
  });

  return prefs;
}
