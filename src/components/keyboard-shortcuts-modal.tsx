"use client";

import { useEffect, useState } from "react";
import { X, Command, Keyboard } from "lucide-react";

interface ShortcutGroup {
  category: string;
  items: {
    keys: string[];
    description: string;
  }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: "Global Navigation",
    items: [
      { keys: ["Ctrl", "K"], description: "Open Command Palette / Omnibox" },
      { keys: ["?"], description: "Toggle this Keyboard Shortcuts cheatsheet" },
      { keys: ["Esc"], description: "Close active modal, palette, or Zen editor" },
    ],
  },
  {
    category: "Editor & Tools",
    items: [
      { keys: ["Ctrl", "S"], description: "Quick-save tool config to workspace" },
      { keys: ["Ctrl", "Shift", "C"], description: "Instant copy output or generated code" },
      { keys: ["Alt", "Enter"], description: "Toggle Fullscreen / Zen Editor mode" },
    ],
  },
  {
    category: "Terminal CLI (castov)",
    items: [
      { keys: ["castov", "login"], description: "Authenticate terminal with your PAT" },
      { keys: ["castov", "fix"], description: "Diagnose terminal crash log with 1-line fix" },
      { keys: ["castov", "port"], description: "Inspect listening ports or kill process" },
      { keys: ["castov", "mcp"], description: "Launch Model Context Protocol server" },
    ],
  },
];

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest(".monaco-editor"));

      if (e.key === "?" && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    const handleOpen = () => setOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-shortcuts-modal", handleOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-shortcuts-modal", handleOpen);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => setOpen(false)}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-2xl border border-line bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-fg">Keyboard Shortcuts</h2>
              <p className="text-xs text-muted">Navigate and operate Castov at warp speed</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg border border-line bg-field hover:bg-hover text-muted hover:text-fg transition-colors cursor-pointer"
            aria-label="Close shortcuts modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} className="space-y-2.5">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                {group.category}
              </h3>
              <div className="space-y-1.5 rounded-xl border border-line/60 bg-field/40 p-2.5">
                {group.items.map((item) => (
                  <div
                    key={item.description}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-hover/60 transition-colors text-sm"
                  >
                    <span className="text-fg text-xs sm:text-sm">{item.description}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-0.5 text-[11px] font-mono font-medium rounded-md border border-line bg-card text-fg shadow-sm min-w-[24px] text-center"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-line bg-field/40 flex items-center justify-between text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Command className="w-3.5 h-3.5 text-accent" />
            <span>Castov High-Velocity DevUX</span>
          </span>
          <span className="font-mono text-[11px]">Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
