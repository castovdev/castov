"use client";
import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export const THEME_STORAGE_KEY = "castov-theme";

// Possible themes: "light", "dark", "system"
const THEMES = ["light", "dark", "system"] as const;
type Theme = typeof THEMES[number];
function getNextTheme(current: Theme): Theme {
  const idx = THEMES.indexOf(current);
  return THEMES[(idx + 1) % THEMES.length];
}

export function ThemeToggle() {
  const [mode, setMode] = React.useState<Theme | 'system'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return stored ?? 'light';
  });

  // Apply theme whenever mode changes
  React.useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  function applyTheme(theme: Theme | 'system') {
    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = prefersDark ? 'dark' : 'light';
    } else {
      root.dataset.theme = theme;
    }
  }

  function toggle() {
    const next = getNextTheme(mode as Theme);
    setMode(next);
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center justify-center h-9 w-9 rounded-xl bg-field/60 hover:bg-hover/80 border border-line/70 hover:border-accent/40 text-muted hover:text-fg transition-all shrink-0 cursor-pointer shadow-2xs"
      aria-label="Switch theme (light, dark, system)"
      title={`Theme: ${mode} (click to toggle)`}
    >
      {mode === 'light' ? (
        <Sun className="w-4 h-4 text-amber-500 hover:text-amber-600 transition-transform hover:rotate-45" aria-hidden="true" />
      ) : mode === 'dark' ? (
        <Moon className="w-4 h-4 text-sky-400 hover:text-sky-300 transition-transform hover:-rotate-12" aria-hidden="true" />
      ) : (
        <Monitor className="w-4 h-4 text-muted hover:text-fg transition-transform" aria-hidden="true" />
      )}
    </button>
  );
}
