"use client";
import React from 'react';

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

  const icon =
    mode === 'light'
      ? "<svg class='theme-icon-sun' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' aria-hidden='true'><circle cx='12' cy='12' r='4'/><path d='M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'/></svg>"
      : mode === 'dark'
      ? "<svg class='theme-icon-moon' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'/></svg>"
      : "<svg class='theme-icon-monitor' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><rect x='2' y='3' width='20' height='14' rx='2' ry='2'/><line x1='8' y1='21' x2='16' y2='21'/><line x1='12' y1='17' x2='12' y2='21'/></svg>";

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center justify-center h-9 w-9 rounded-lg bg-field/80 hover:bg-hover border border-line text-muted hover:text-fg transition-colors shrink-0 cursor-pointer"
      aria-label="Switch theme (light, dark, system)"
      title={`Theme: ${mode} (click to toggle)`}
    >
      <span dangerouslySetInnerHTML={{ __html: icon }} />
    </button>
  );
}
