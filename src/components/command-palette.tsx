"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { SearchIcon, BoxIcon, CodeIcon, SettingsIcon, ClockIcon, HashIcon, TypeIcon, LinkIcon, PaletteIcon } from "lucide-react";
import { AI_TOOLS } from "@/lib/ai-tools";
import { AI_HUB_LIVE } from "@/lib/flags";
import { TOOLS } from "@/content/tools";
import { parseTimestamp } from "@/lib/time/timestamp";
import { toIsoUtc } from "@/lib/time/format";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    
    const openPalette = () => setOpen(true);
    
    document.addEventListener("keydown", down);
    window.addEventListener("open-command-palette", openPalette);
    
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-palette", openPalette);
    };
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setOpen(false);
    setSearch("");
  };

  if (!open) return null;

  const rawSearch = search.trim();
  
  // Smart inline parsing
  const isNumber = /^\d+$/.test(rawSearch);
  const parsedTime = isNumber ? parseTimestamp(rawSearch, "auto") : null;
  const isUuid = rawSearch.toLowerCase() === "uuid";
  
  // Base64 detection
  const isBase64Encode = rawSearch.toLowerCase().startsWith("b64 ");
  const base64Str = isBase64Encode ? rawSearch.slice(4) : "";
  let base64Encoded = "";
  try { if (isBase64Encode) base64Encoded = btoa(base64Str); } catch {}

  // Color Hex detection
  const isHex = /^#([0-9A-F]{3}){1,2}$/i.test(rawSearch);
  let rgbColor = "";
  if (isHex) {
    const hex = rawSearch.replace("#", "");
    const r = parseInt(hex.length === 3 ? hex[0]+hex[0] : hex.substring(0,2), 16);
    const g = parseInt(hex.length === 3 ? hex[1]+hex[1] : hex.substring(2,4), 16);
    const b = parseInt(hex.length === 3 ? hex[2]+hex[2] : hex.substring(4,6), 16);
    rgbColor = `rgb(${r}, ${g}, ${b})`;
  }

  // URL Encode
  const isUrl = rawSearch.toLowerCase().startsWith("url ");
  const urlStr = isUrl ? rawSearch.slice(4) : "";
  const urlEncoded = isUrl ? encodeURIComponent(urlStr) : "";

  const hasInlineActions = isUuid || (parsedTime && parsedTime.ok) || isBase64Encode || isHex || isUrl;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={() => setOpen(false)}
      />

      <Command
        className="relative w-full max-w-2xl bg-card border border-line/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        label="Global Command Menu"
        shouldFilter={true}
      >
        <div className="flex items-center border-b border-line/50 px-4">
          <SearchIcon className="w-5 h-5 text-muted shrink-0" />
          <Command.Input 
            autoFocus
            value={search}
            onValueChange={setSearch}
            className="flex-1 bg-transparent border-none outline-none h-14 px-4 text-fg placeholder:text-muted/60 text-lg"
            placeholder="Search tools, or type 'uuid', 'b64 text', 'url text', '#hex'..."
          />
          <kbd className="hidden sm:inline-flex items-center h-6 px-2 text-[10px] font-medium bg-field text-muted rounded border border-line/40 font-mono">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[350px] overflow-y-auto p-2 scrollbar-thin">
          <Command.Empty className="p-6 text-center text-sm text-muted">
            No results found. Try typing 'uuid' or a timestamp.
          </Command.Empty>

          {/* Inline Compute Tools */}
          {hasInlineActions && (
            <Command.Group heading="Inline Actions" className="text-xs font-medium text-muted/60 px-2 py-1">
              {isUuid && (
                <Command.Item
                  value="generate uuid"
                  onSelect={() => copyToClipboard(crypto.randomUUID())}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
                >
                  <HashIcon className="w-4 h-4 text-accent" />
                  <span className="font-semibold text-accent">Generate UUID</span>
                  <span className="text-xs text-muted ml-auto">Press Enter to copy</span>
                </Command.Item>
              )}
              {parsedTime && parsedTime.ok && (
                <Command.Item
                  value={search}
                  onSelect={() => copyToClipboard(toIsoUtc(parsedTime.value.ms))}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
                >
                  <ClockIcon className="w-4 h-4 text-success" />
                  <span className="font-semibold">{toIsoUtc(parsedTime.value.ms)}</span>
                  <span className="text-xs text-muted ml-auto">Press Enter to copy ISO</span>
                </Command.Item>
              )}
              {isBase64Encode && base64Encoded && (
                <Command.Item
                  value={search}
                  onSelect={() => copyToClipboard(base64Encoded)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
                >
                  <TypeIcon className="w-4 h-4 text-warning" />
                  <span className="font-semibold font-mono truncate max-w-sm">{base64Encoded}</span>
                  <span className="text-xs text-muted ml-auto shrink-0">Press Enter to copy Base64</span>
                </Command.Item>
              )}
              {isUrl && urlEncoded && (
                <Command.Item
                  value={search}
                  onSelect={() => copyToClipboard(urlEncoded)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
                >
                  <LinkIcon className="w-4 h-4 text-primary" />
                  <span className="font-semibold font-mono truncate max-w-sm">{urlEncoded}</span>
                  <span className="text-xs text-muted ml-auto shrink-0">Press Enter to copy</span>
                </Command.Item>
              )}
              {isHex && rgbColor && (
                <Command.Item
                  value={search}
                  onSelect={() => copyToClipboard(rgbColor)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
                >
                  <PaletteIcon className="w-4 h-4" style={{ color: rawSearch }} />
                  <span className="font-semibold font-mono">{rgbColor}</span>
                  <span className="text-xs text-muted ml-auto">Press Enter to copy RGB</span>
                </Command.Item>
              )}
            </Command.Group>
          )}

          <Command.Group heading="General" className="text-xs font-medium text-muted/60 px-2 py-1">
            <Command.Item
              onSelect={() => runCommand(() => router.push("/"))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
            >
              <BoxIcon className="w-4 h-4" /> Home
            </Command.Item>
            {AI_HUB_LIVE && (
              <Command.Item
                onSelect={() => runCommand(() => router.push("/ai"))}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
              >
                <CodeIcon className="w-4 h-4" /> AI Developer Directory
              </Command.Item>
            )}
            <Command.Item
              onSelect={() => runCommand(() => router.push("/tools"))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
            >
              <SettingsIcon className="w-4 h-4" /> Time & Date Tools
            </Command.Item>
          </Command.Group>
          
          <Command.Group heading="Developer Tools" className="text-xs font-medium text-muted/60 px-2 py-1 mt-2">
            {TOOLS.map((tool) => (
              <Command.Item
                key={tool.slug}
                value={tool.name + ' ' + tool.category}
                onSelect={() => runCommand(() => router.push(`/${tool.slug}`))}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
              >
                <div className="flex flex-col pointer-events-none">
                  <span className="font-semibold">{tool.name}</span>
                  <span className="text-xs text-muted font-normal capitalize">{tool.category.replace('-', ' ')}</span>
                </div>
              </Command.Item>
            ))}
          </Command.Group>

          {AI_HUB_LIVE && (
            <Command.Group heading="AI Tools" className="text-xs font-medium text-muted/60 px-2 py-1 mt-2">
              {AI_TOOLS.map((tool) => (
                <Command.Item
                  key={tool.slug}
                  value={tool.name}
                  onSelect={() => runCommand(() => router.push(`/ai/${tool.slug}`))}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{tool.name}</span>
                    <span className="text-xs text-muted font-normal">{tool.category}</span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  );
}
