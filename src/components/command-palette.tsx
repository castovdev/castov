"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  SearchIcon,
  BoxIcon,
  CodeIcon,
  SettingsIcon,
  ClockIcon,
  HashIcon,
  TypeIcon,
  LinkIcon,
  PaletteIcon,
  CpuIcon,
  TerminalIcon,
  CopyIcon,
  ShieldIcon,
  UserIcon,
  KeyboardIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { AI_TOOLS } from "@/lib/ai-tools";
import { AI_HUB_LIVE } from "@/lib/flags";
import { TOOLS } from "@/content/tools";
import { parseTimestamp } from "@/lib/time/timestamp";
import { toIsoUtc } from "@/lib/time/format";

const MCP_STDIO_JSON_CONFIG = `{
  "mcpServers": {
    "castov": {
      "command": "npx",
      "args": ["-y", "castov@latest", "mcp"]
    }
  }
}`;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
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
  const isMcpQuery = ["mcp", "claude", "cursor", "windsurf"].includes(rawSearch.toLowerCase());

  // JWT Detection
  const isJwt = rawSearch.startsWith("eyJ") && rawSearch.split(".").length >= 2;
  let jwtPayloadPreview = "";
  if (isJwt) {
    try {
      const parts = rawSearch.split(".");
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      jwtPayloadPreview = atob(base64);
    } catch {
      // ignore
    }
  }

  // Terminal Error Log Detection
  const isErrorLog =
    rawSearch.includes("EADDRINUSE") ||
    rawSearch.includes("ECONNREFUSED") ||
    rawSearch.includes("Hydration failed") ||
    rawSearch.includes("Cannot find module") ||
    rawSearch.toLowerCase().startsWith("error:");

  // Base64 detection
  const isBase64Encode = rawSearch.toLowerCase().startsWith("b64 ");
  const base64Str = isBase64Encode ? rawSearch.slice(4) : "";
  let base64Encoded = "";
  try {
    if (isBase64Encode) base64Encoded = btoa(base64Str);
  } catch {
    // invalid input for btoa
  }

  // Color Hex detection
  const isHex = /^#([0-9A-F]{3}){1,2}$/i.test(rawSearch);
  let rgbColor = "";
  if (isHex) {
    const hex = rawSearch.replace("#", "");
    const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
    rgbColor = `rgb(${r}, ${g}, ${b})`;
  }

  // URL Encode
  const isUrl = rawSearch.toLowerCase().startsWith("url ");
  const urlStr = isUrl ? rawSearch.slice(4) : "";
  const urlEncoded = isUrl ? encodeURIComponent(urlStr) : "";

  const hasInlineActions =
    isUuid ||
    isMcpQuery ||
    isJwt ||
    isErrorLog ||
    (parsedTime && parsedTime.ok) ||
    isBase64Encode ||
    isHex ||
    isUrl;

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
            placeholder="Search tools, paste tokens, errors, or type 'uuid', 'mcp'..."
          />
          <kbd className="hidden sm:inline-flex items-center h-6 px-2 text-[10px] font-medium bg-field text-muted rounded border border-line/40 font-mono">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[350px] overflow-y-auto p-2 scrollbar-thin">
          <Command.Empty className="p-6 text-center text-sm text-muted">
            No results found. Try typing &apos;mcp&apos;, &apos;uuid&apos;, or paste a timestamp/JWT.
          </Command.Empty>

          {/* Inline Compute Tools */}
          {hasInlineActions && (
            <Command.Group heading="Smart Actions &amp; Auto-Detection" className="text-xs font-medium text-muted/60 px-2 py-1">
              {isJwt && (
                <Command.Item
                  value={search}
                  onSelect={() => runCommand(() => router.push(`/jwt-decoder#token=${encodeURIComponent(rawSearch)}`))}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
                >
                  <CodeIcon className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-semibold text-purple-400">Decode JWT Token</span>
                  {jwtPayloadPreview && (
                    <span className="text-xs text-muted font-mono truncate max-w-xs ml-2">
                      {jwtPayloadPreview.slice(0, 45)}...
                    </span>
                  )}
                  <span className="text-xs text-muted ml-auto shrink-0">Open in JWT Decoder &rarr;</span>
                </Command.Item>
              )}
              {isErrorLog && (
                <Command.Item
                  value={search}
                  onSelect={() => runCommand(() => router.push(`/error-fixes?q=${encodeURIComponent(rawSearch)}`))}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
                >
                  <AlertTriangleIcon className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-semibold text-amber-500">Terminal Error Detected</span>
                  <span className="text-xs text-muted ml-auto shrink-0">Diagnose with Castov Fix &rarr;</span>
                </Command.Item>
              )}
              {isMcpQuery && (
                <Command.Item
                  value={`${rawSearch} copy npx command mcp server`}
                  onSelect={() => copyToClipboard("npx -y castov@latest mcp")}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
                >
                  <CpuIcon className="w-4 h-4 text-accent" />
                  <span className="font-semibold text-accent font-mono">npx -y castov@latest mcp</span>
                  <span className="text-xs text-muted ml-auto">Press Enter to copy command</span>
                </Command.Item>
              )}
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
                  <ClockIcon className="w-4 h-4 text-emerald-500" />
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
                  <TypeIcon className="w-4 h-4 text-amber-500" />
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
                  <LinkIcon className="w-4 h-4 text-accent" />
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

          {/* Developer Quick Actions */}
          <Command.Group heading="Developer Quick Actions" className="text-xs font-medium text-muted/60 px-2 py-1">
            <Command.Item
              value="keyboard shortcuts hotkeys cheatsheet help"
              onSelect={() => {
                setOpen(false);
                window.dispatchEvent(new CustomEvent("open-shortcuts-modal"));
              }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
            >
              <KeyboardIcon className="w-4 h-4 text-accent" />
              <span>Keyboard Shortcuts Cheatsheet</span>
              <kbd className="text-[10px] font-mono bg-field border border-line px-1.5 py-0.5 rounded ml-auto">?</kbd>
            </Command.Item>

            <Command.Item
              value="account developer workspace preferences cli token"
              onSelect={() => runCommand(() => router.push("/account"))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
            >
              <UserIcon className="w-4 h-4 text-accent" />
              <span>Developer Account &amp; Workspaces</span>
            </Command.Item>

            <Command.Item
              value="team vaults secrets zero knowledge env"
              onSelect={() => runCommand(() => router.push("/env-vault/team"))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
            >
              <ShieldIcon className="w-4 h-4 text-emerald-500" />
              <span>Zero-Knowledge Team Vaults</span>
            </Command.Item>
          </Command.Group>

          {/* MCP Server */}
          <Command.Group heading="MCP Server &amp; Ecosystem (v1.4.0)" className="text-xs font-medium text-muted/60 px-2 py-1 mt-1">
            <Command.Item
              value="mcp server claude desktop cursor windsurf model context protocol playground"
              onSelect={() => runCommand(() => router.push("/mcp"))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
            >
              <CpuIcon className="w-4 h-4 text-accent" />
              <span className="font-semibold">Castov MCP Server &amp; Live Playground</span>
              <span className="text-[11px] font-mono bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded ml-auto">Grade A • v1.4.0</span>
            </Command.Item>
            <Command.Item
              value="copy mcp command npx castov mcp"
              onSelect={() => copyToClipboard("npx -y castov@latest mcp")}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
            >
              <CopyIcon className="w-4 h-4 text-accent" />
              <span>Copy MCP Command: <code className="font-mono text-xs text-accent">npx -y castov@latest mcp</code></span>
            </Command.Item>
            <Command.Item
              value="copy mcp json config claude desktop cursor windsurf"
              onSelect={() => copyToClipboard(MCP_STDIO_JSON_CONFIG)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
            >
              <CopyIcon className="w-4 h-4 text-accent" />
              <span>Copy MCP JSON Config (Claude / Cursor / Windsurf)</span>
            </Command.Item>
            <Command.Item
              value="cli command line interface terminal npx castov"
              onSelect={() => runCommand(() => router.push("/cli"))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
            >
              <TerminalIcon className="w-4 h-4" />
              <span>Castov CLI (v1.4.0)</span>
            </Command.Item>
            <Command.Item
              value="developer hub sdk vscode extension"
              onSelect={() => runCommand(() => router.push("/developer"))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
            >
              <CodeIcon className="w-4 h-4" />
              <span>Developer Hub &amp; SDK</span>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="General" className="text-xs font-medium text-muted/60 px-2 py-1 mt-1">
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
              onSelect={() => runCommand(() => router.push("/cheatsheets"))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
            >
              <CodeIcon className="w-4 h-4" /> Developer Cheat Sheets
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router.push("/sponsor"))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors"
            >
              <SettingsIcon className="w-4 h-4" /> Sponsor &amp; Advertise
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Developer Tools" className="text-xs font-medium text-muted/60 px-2 py-1 mt-2">
            {TOOLS.map((tool) => (
              <Command.Item
                key={tool.slug}
                value={tool.name + " " + tool.category}
                onSelect={() => runCommand(() => router.push(`/${tool.slug}`))}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg cursor-pointer aria-selected:bg-hover aria-selected:text-accent transition-colors mt-1"
              >
                <div className="flex flex-col pointer-events-none">
                  <span className="font-semibold">{tool.name}</span>
                  <span className="text-xs text-muted font-normal capitalize">
                    {tool.category.replace("-", " ")}
                  </span>
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
