"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { AI_CATEGORIES, AI_TOOLS } from "@/lib/ai-tools";
import { LayoutDashboardIcon, FolderIcon, WrenchIcon, ArrowRightIcon, ChevronDownIcon, PlusIcon, ArchiveIcon, TrashIcon, KeyIcon, LogOutIcon } from "lucide-react";
import { useWorkspace } from "@/context/workspace-context";
import { useKeyManager } from "@/context/key-manager-context";

export function AiSidebar() {
  const pathname = usePathname();
  const { workspaces, activeWorkspaceId, switchWorkspace, createWorkspace, getWorkspaceConfigs, deleteSavedConfig, user, signInWithGithub, signOut } = useWorkspace();
  const { setKeyModalOpen, keys } = useKeyManager();
  const [isWsOpen, setIsWsOpen] = useState(false);
  const [newWsName, setNewWsName] = useState("");

  const isActive = (path: string) => pathname === path;
  const activeWs = workspaces.find(w => w.id === activeWorkspaceId);
  const savedConfigs = getWorkspaceConfigs(activeWorkspaceId);

  const handleCreateWs = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWsName.trim()) {
      createWorkspace(newWsName);
      setNewWsName("");
      setIsWsOpen(false);
    }
  };

  const groupedTools = AI_CATEGORIES.map(category => ({
    category,
    tools: AI_TOOLS.filter(t => t.category === category).slice(0, 4)
  }));

  return (
    <div className="h-full overflow-y-auto pr-4 scrollbar-thin pb-20 space-y-6">
      
      {/* Workspace Switcher */}
      <div className="relative">
        <button 
          onClick={() => setIsWsOpen(!isWsOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-field border border-line rounded-lg text-sm text-fg hover:border-accent/40 transition-colors"
        >
          <span className="font-semibold truncate">{activeWs?.name || "Workspace"}</span>
          <ChevronDownIcon className="w-4 h-4 text-muted" />
        </button>

        {isWsOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-card border border-line rounded-lg shadow-xl z-50">
            <div className="space-y-1 mb-2 max-h-40 overflow-y-auto scrollbar-thin">
              {workspaces.map(ws => (
                <button
                  key={ws.id}
                  onClick={() => { switchWorkspace(ws.id); setIsWsOpen(false); }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${ws.id === activeWorkspaceId ? "bg-accent/10 text-accent font-medium" : "text-fg hover:bg-hover"}`}
                >
                  {ws.name}
                </button>
              ))}
            </div>
            <form onSubmit={handleCreateWs} className="flex items-center gap-2 pt-2 border-t border-line/40">
              <input 
                type="text" value={newWsName} onChange={e => setNewWsName(e.target.value)}
                placeholder="New workspace..." className="flex-1 bg-field border border-line rounded px-2 py-1 text-xs focus:outline-none focus:border-accent"
              />
              <button type="submit" disabled={!newWsName.trim()} className="p-1 bg-accent/10 text-accent rounded hover:bg-accent/20 disabled:opacity-50">
                <PlusIcon className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* BYOK Vault Trigger */}
      <button 
        onClick={() => setKeyModalOpen(true)}
        className="w-full flex items-center justify-between px-3 py-2 bg-card border border-line/50 rounded-lg text-sm text-fg hover:border-accent/40 transition-colors"
      >
        <span className="flex items-center gap-2">
          <KeyIcon className="w-4 h-4 text-accent" />
          <span className="font-semibold">BYOK Vault</span>
        </span>
        <span className="text-[10px] font-mono text-muted bg-field px-1.5 py-0.5 rounded border border-line/40">
          {(keys.openai || keys.anthropic || keys.gemini) ? 'ACTIVE' : 'SETUP'}
        </span>
      </button>

      {/* Global Search Trigger */}
      <button 
        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
        aria-label="Search tools"
        className="w-full flex items-center justify-between px-3 py-2 bg-field hover:bg-hover border border-line rounded-lg text-sm text-muted hover:text-fg hover:border-accent/40 transition-colors shadow-2xs group"
      >
        <span className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted group-hover:text-accent transition-colors">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <span className="font-medium text-muted group-hover:text-fg transition-colors">Search tools...</span>
        </span>
        <kbd className="inline-flex items-center h-5 px-1.5 text-[10px] font-medium bg-card text-muted rounded border border-line/60 font-mono shadow-2xs group-hover:text-accent group-hover:border-accent/30 transition-colors">
          ⌘K
        </kbd>
      </button>

      {/* Auth UI */}
      <div className="pt-2">
        {user ? (
          <div className="flex items-center justify-between px-3 py-2 bg-field border border-line rounded-lg text-sm">
            <div className="flex items-center gap-2 truncate">
              <Image src={user.user_metadata?.avatar_url || "https://github.com/ghost.png"} alt="Avatar" width={24} height={24} className="w-6 h-6 rounded-full bg-line" />
              <span className="text-fg text-xs font-semibold truncate">{user.user_metadata?.user_name || user.email}</span>
            </div>
            <button onClick={signOut} className="text-muted hover:text-danger" title="Sign Out">
              <LogOutIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={signInWithGithub}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#2b3137] hover:bg-[#24292e] border border-line/50 rounded-lg text-sm text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
            <span className="font-semibold">Sign in for Cloud Sync</span>
          </button>
        )}
      </div>

      <div className="space-y-6 pt-2 border-t border-line/30">
        {/* Main Hub */}
        <div>
          <Link
            href="/ai"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive("/ai") ? "bg-accent/10 text-accent font-semibold" : "text-muted hover:bg-hover hover:text-fg"
            }`}
          >
            <LayoutDashboardIcon className="w-4 h-4 shrink-0" />
            AI Developer Hub
          </Link>
        </div>

        {/* Saved Configs */}
        {savedConfigs.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-fg/70 uppercase tracking-wider">
              <ArchiveIcon className="w-3.5 h-3.5" />
              Saved Configs
            </div>
            <div className="pl-3 space-y-0.5 border-l border-line/40 ml-4 mt-1">
              {savedConfigs.map(config => (
                <div key={config.id} className="group flex items-center justify-between gap-2 px-3 py-1.5 rounded-md text-sm text-muted hover:bg-hover hover:text-fg transition-colors">
                  <span className="truncate flex-1 text-xs cursor-pointer" title={config.title}>{config.title}</span>
                  <button onClick={() => deleteSavedConfig(config.id)} className="opacity-0 group-hover:opacity-100 text-danger hover:bg-danger/10 p-1 rounded transition-all">
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        {groupedTools.map(group => {
          const catName = group.category.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase());
          return (
            <div key={group.category} className="space-y-1">
              <Link 
                href={`/ai/${group.category}`}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-fg/70 uppercase tracking-wider hover:text-fg transition-colors"
              >
                <FolderIcon className="w-3.5 h-3.5" />
                {catName}
              </Link>
              
              <div className="pl-3 space-y-0.5 border-l border-line/40 ml-4 mt-1">
                {group.tools.map(tool => (
                  <Link
                    key={tool.slug}
                    href={`/ai/${tool.slug}`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      isActive(`/ai/${tool.slug}`) ? "bg-accent/10 text-accent font-medium border border-accent/20" : "text-muted hover:bg-hover hover:text-fg"
                    }`}
                  >
                    <WrenchIcon className="w-3 h-3 shrink-0 opacity-50" />
                    <span className="truncate">{tool.name}</span>
                  </Link>
                ))}
                <Link
                  href={`/ai/${group.category}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-muted hover:text-accent transition-colors mt-1"
                >
                  View all <ArrowRightIcon className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
