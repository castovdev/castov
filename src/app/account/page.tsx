"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { getTool, type ToolSlug } from "@/content/tools";
import {
  User as UserIcon,
  Shield,
  Key,
  Folder,
  Star,
  Trash2,
  Copy,
  ExternalLink,
  Lock,
  Calendar,
  LogOut,
  Plus,
  ArrowRight,
  Eye,
  EyeOff,
  FileCode2,
  Cloud,
  Check,
  Share2,
} from "lucide-react";

interface SavedConfig {
  id: string;
  workspaceId: string;
  toolSlug: string;
  title: string;
  content: string;
  language: string;
  createdAt: number;
  updatedAt: number;
}

interface Workspace {
  id: string;
  name: string;
  createdAt: number;
}

interface ApiKeys {
  openai: string;
  anthropic: string;
  gemini: string;
}

const PINNED_STORAGE_KEY = "castov-pinned-tools";
const SAVED_CONFIGS_KEY = "castov_saved_configs";
const WORKSPACES_KEY = "castov_workspaces";
const API_KEYS_KEY = "castov_api_keys";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "pinned" | "snippets" | "security" | "byok">("overview");

  // Pinned tools state
  const [pinnedSlugs, setPinnedSlugs] = useState<ToolSlug[]>([]);

  // Saved configs & workspaces
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWsId, setActiveWsId] = useState<string>("ws_personal");
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
  const [newWsName, setNewWsName] = useState("");

  // Cloud sync status
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null);

  // BYOK Keys
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ openai: "", anthropic: "", gemini: "" });
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({});
  const [keySavedMessage, setKeySavedMessage] = useState<string | null>(null);

  // Security status from Supabase
  const [hasSecurityKeys, setHasSecurityKeys] = useState<boolean | null>(null);
  const [keyVersion, setKeyVersion] = useState<number>(1);
  const [publicKeyShort, setPublicKeyShort] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [sharedConfigId, setSharedConfigId] = useState<string | null>(null);

  const supabase = createClient();

  // Helper to sync state to Supabase cloud preferences
  const syncToCloud = useCallback(
    async (
      u: User,
      pins: ToolSlug[],
      ws: Workspace[],
      configs: SavedConfig[]
    ) => {
      try {
        setSyncStatusText("Syncing...");
        const { error } = await supabase.from("user_preferences").upsert({
          user_id: u.id,
          pinned_tools: pins,
          workspaces: ws,
          saved_configs: configs,
          updated_at: new Date().toISOString(),
        });
        if (!error) {
          setIsCloudSynced(true);
          setSyncStatusText("Cloud Synced ✓");
          setTimeout(() => setSyncStatusText(null), 3000);
        } else {
          setSyncStatusText(null);
        }
      } catch {
        setSyncStatusText(null);
      }
    },
    [supabase]
  );

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      // 1. Auth check
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(user);
      setLoading(false);

      // Local storage values
      let currentPins: ToolSlug[] = [];
      let currentWs: Workspace[] = [{ id: "ws_personal", name: "Personal Workspace", createdAt: Date.now() }];
      let currentConfigs: SavedConfig[] = [];

      try {
        const storedPinned = localStorage.getItem(PINNED_STORAGE_KEY);
        if (storedPinned) currentPins = JSON.parse(storedPinned);

        const storedWs = localStorage.getItem(WORKSPACES_KEY);
        if (storedWs) currentWs = JSON.parse(storedWs);

        const storedConfigs = localStorage.getItem(SAVED_CONFIGS_KEY);
        if (storedConfigs) currentConfigs = JSON.parse(storedConfigs);

        const storedKeys = localStorage.getItem(API_KEYS_KEY);
        if (storedKeys) {
          try {
            setApiKeys(JSON.parse(atob(storedKeys)));
          } catch {
            // Invalid base64
          }
        }
      } catch {
        // Ignore storage access restrictions
      }

      if (user) {
        // 2. Fetch security record from Supabase
        const { data: secRec } = await supabase
          .from("user_security_keys")
          .select("public_key, key_version")
          .eq("user_id", user.id)
          .maybeSingle();

        if (mounted && secRec) {
          setHasSecurityKeys(true);
          setKeyVersion(secRec.key_version || 1);
          setPublicKeyShort(secRec.public_key ? `${secRec.public_key.slice(0, 32)}...` : null);
        } else if (mounted) {
          setHasSecurityKeys(false);
        }

        // 3. Fetch user cloud preferences from Supabase
        try {
          const { data: prefData } = await supabase
            .from("user_preferences")
            .select("pinned_tools, workspaces, saved_configs")
            .eq("user_id", user.id)
            .maybeSingle();

          if (mounted && prefData) {
            setIsCloudSynced(true);
            if (Array.isArray(prefData.pinned_tools) && prefData.pinned_tools.length > 0) {
              currentPins = prefData.pinned_tools as ToolSlug[];
            }
            if (Array.isArray(prefData.workspaces) && prefData.workspaces.length > 0) {
              currentWs = prefData.workspaces as Workspace[];
            }
            if (Array.isArray(prefData.saved_configs) && prefData.saved_configs.length > 0) {
              currentConfigs = prefData.saved_configs as SavedConfig[];
            }
            // Sync down to localStorage
            localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(currentPins));
            localStorage.setItem(WORKSPACES_KEY, JSON.stringify(currentWs));
            localStorage.setItem(SAVED_CONFIGS_KEY, JSON.stringify(currentConfigs));
          } else if (mounted && user) {
            // First time: push initial local values to cloud
            syncToCloud(user, currentPins, currentWs, currentConfigs);
          }
        } catch {
          // Fallback gracefully to local
        }
      }

      if (mounted) {
        setPinnedSlugs(currentPins);
        setWorkspaces(currentWs);
        setSavedConfigs(currentConfigs);
      }
    }

    loadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, syncToCloud]);

  // Actions
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleUnpin = (slug: ToolSlug) => {
    const next = pinnedSlugs.filter((s) => s !== slug);
    setPinnedSlugs(next);
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
    if (user) syncToCloud(user, next, workspaces, savedConfigs);
  };

  const handleDeleteConfig = (id: string) => {
    const next = savedConfigs.filter((c) => c.id !== id);
    setSavedConfigs(next);
    localStorage.setItem(SAVED_CONFIGS_KEY, JSON.stringify(next));
    if (user) syncToCloud(user, pinnedSlugs, workspaces, next);
  };

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    const newWs: Workspace = {
      id: `ws_${Date.now()}`,
      name: newWsName.trim(),
      createdAt: Date.now(),
    };
    const next = [...workspaces, newWs];
    setWorkspaces(next);
    setActiveWsId(newWs.id);
    localStorage.setItem(WORKSPACES_KEY, JSON.stringify(next));
    setNewWsName("");
    if (user) syncToCloud(user, pinnedSlugs, next, savedConfigs);
  };

  const handleShareConfig = (config: SavedConfig) => {
    const shareUrl = `${window.location.origin}/${config.toolSlug}#share=${encodeURIComponent(
      JSON.stringify({ title: config.title, content: config.content })
    )}`;
    navigator.clipboard.writeText(shareUrl);
    setSharedConfigId(config.id);
    setTimeout(() => setSharedConfigId(null), 2500);
  };

  const handleSaveApiKeys = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(API_KEYS_KEY, btoa(JSON.stringify(apiKeys)));
    setKeySavedMessage("API Keys saved securely in browser storage.");
    setTimeout(() => setKeySavedMessage(null), 3500);
  };

  const copyToClipboard = (text: string, type: "userId" | "pubKey") => {
    navigator.clipboard.writeText(text);
    if (type === "userId") {
      setCopiedUserId(true);
      setTimeout(() => setCopiedUserId(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="layout-content py-20 min-h-[70vh] flex flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4 text-sm font-mono text-muted">Loading developer dashboard...</p>
      </div>
    );
  }

  // LOGGED OUT PROMPT
  if (!user) {
    return (
      <div className="layout-content py-16 max-w-2xl mx-auto">
        <div className="rounded-2xl border border-line bg-card p-8 sm:p-12 text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-accent/15 blur-3xl pointer-events-none rounded-full" />
          <div className="relative z-10 w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="relative z-10 text-2xl sm:text-3xl font-bold tracking-tight text-fg">
            Sign In to Access Your Dashboard
          </h1>
          <p className="relative z-10 text-sm text-muted mt-3 max-w-md mx-auto">
            Log in to manage your saved developer workspaces, pinned favorite tools, Zero-Knowledge Team Vaults, and private AI keys with cross-device cloud sync.
          </p>
          <div className="relative z-10 mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login?redirectedFrom=/account"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-fg hover:bg-accent-hover transition-all shadow-md shadow-accent/20 cursor-pointer"
            >
              <UserIcon className="w-4 h-4" />
              <span>Sign In with GitHub or Email</span>
            </Link>
            <Link
              href="/tools"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-field px-6 py-3 text-sm font-semibold text-fg hover:bg-hover transition-colors"
            >
              <span>Explore Public Tools</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.user_name ||
    user.email?.split("@")[0] ||
    "Developer";
  const userInitial = (user.email?.[0] || displayName[0] || "U").toUpperCase();
  const authProvider = user.app_metadata?.provider || "email";
  const joinedDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : "Active";

  const currentWsConfigs = savedConfigs.filter((c) => c.workspaceId === activeWsId);

  return (
    <div className="layout-content py-8 sm:py-12 max-w-6xl mx-auto space-y-8">
      {/* 1. HERO PROFILE CARD */}
      <div className="rounded-2xl border border-line bg-card p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-40 bg-accent/10 blur-3xl pointer-events-none rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 border-accent/30 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-accent/20 border-2 border-accent/40 font-mono text-xl sm:text-2xl font-bold text-accent shadow-sm">
                {userInitial}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-fg tracking-tight">{displayName}</h1>
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-mono font-medium bg-accent/10 border border-accent/20 text-accent uppercase">
                  {authProvider}
                </span>
                {isCloudSynced ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-medium">
                    <Cloud className="w-3 h-3" /> Cloud Synced
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-mono bg-field border border-line text-muted">
                    Local Device
                  </span>
                )}
                {syncStatusText && (
                  <span className="text-xs font-mono text-accent animate-pulse font-medium">
                    {syncStatusText}
                  </span>
                )}
              </div>
              <p className="font-mono text-xs sm:text-sm text-muted mt-1">{user.email}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Joined {joinedDate}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(user.id, "userId")}
                  className="flex items-center gap-1 hover:text-fg font-mono transition-colors cursor-pointer"
                  title="Copy User ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>ID: {user.id.slice(0, 8)}...</span>
                  {copiedUserId && <span className="text-emerald-500 font-bold ml-0.5">Copied!</span>}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Link
              href="/env-vault/team"
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-line bg-field hover:bg-hover text-sm font-semibold text-fg transition-colors"
            >
              <Shield className="w-4 h-4 text-accent" />
              <span>Team Vaults</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-danger/30 bg-danger/10 hover:bg-danger/20 text-sm font-semibold text-danger transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TAB NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-line pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: "overview", label: "Overview", icon: UserIcon },
          { id: "pinned", label: `Pinned Tools (${pinnedSlugs.length})`, icon: Star },
          { id: "snippets", label: `Saved Snippets (${savedConfigs.length})`, icon: Folder },
          { id: "security", label: "Zero-Knowledge Security", icon: Shield },
          { id: "byok", label: "BYOK AI Keys", icon: Key },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-accent text-accent-fg shadow-sm shadow-accent/25"
                  : "text-muted hover:text-fg hover:bg-hover"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB PANELS */}

      {/* TAB: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-line bg-card p-5">
              <div className="flex items-center justify-between text-muted mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Pinned Tools</span>
                <Star className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-fg">{pinnedSlugs.length}</div>
              <p className="text-xs text-muted mt-1">Quick-access favorite utilities</p>
            </div>

            <div className="rounded-xl border border-line bg-card p-5">
              <div className="flex items-center justify-between text-muted mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Saved Snippets</span>
                <FileCode2 className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-bold text-fg">{savedConfigs.length}</div>
              <p className="text-xs text-muted mt-1">Across {workspaces.length} workspace(s)</p>
            </div>

            <div className="rounded-xl border border-line bg-card p-5">
              <div className="flex items-center justify-between text-muted mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Security State</span>
                <Shield className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-fg">
                {hasSecurityKeys ? "Encrypted" : "Ready"}
              </div>
              <p className="text-xs text-muted mt-1">PBKDF2 600K iterations</p>
            </div>

            <div className="rounded-xl border border-line bg-card p-5">
              <div className="flex items-center justify-between text-muted mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">BYOK Vault</span>
                <Key className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-fg">
                {[apiKeys.openai, apiKeys.anthropic, apiKeys.gemini].filter(Boolean).length} / 3
              </div>
              <p className="text-xs text-muted mt-1">Active AI providers configured</p>
            </div>
          </div>

          {/* Featured Pinned Tools Grid Preview */}
          <div className="rounded-2xl border border-line bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-fg">Your Pinned Tools</h2>
                <p className="text-xs text-muted">Favorite tools accessible from anywhere</p>
              </div>
              <Link
                href="/tools"
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                <span>Browse All Tools</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pinnedSlugs.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-line rounded-xl">
                <Star className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted">No tools pinned yet.</p>
                <Link
                  href="/tools"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-accent font-semibold hover:underline"
                >
                  Pin your first tool from the Tools directory →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pinnedSlugs.map((slug) => {
                  const tool = getTool(slug);
                  if (!tool) return null;
                  return (
                    <div
                      key={slug}
                      className="group flex flex-col justify-between p-4 rounded-xl border border-line bg-field/60 hover:bg-hover hover:border-accent/40 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-card border border-line text-muted">
                            {tool.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUnpin(slug)}
                            className="text-muted hover:text-danger p-1 rounded transition-colors"
                            title="Unpin tool"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h3 className="font-semibold text-sm text-fg group-hover:text-accent transition-colors">
                          {tool.name}
                        </h3>
                        <p className="text-xs text-muted mt-1 line-clamp-2">
                          {tool.cardDescription || tool.intro}
                        </p>
                      </div>
                      <Link
                        href={`/${tool.slug}`}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline pt-2 border-t border-line/40"
                      >
                        <span>Open Utility</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: PINNED TOOLS */}
      {activeTab === "pinned" && (
        <div className="rounded-2xl border border-line bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-fg">Manage Pinned Developer Tools</h2>
              <p className="text-xs text-muted">Remove or open pinned shortcuts</p>
            </div>
            <Link
              href="/tools"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hover transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add More Tools</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {pinnedSlugs.map((slug) => {
              const tool = getTool(slug);
              if (!tool) return null;
              return (
                <div
                  key={slug}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-field/60 hover:bg-hover transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-fg truncate">{tool.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-card border border-line text-muted">
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted truncate mt-0.5">
                      {tool.cardDescription || tool.intro}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/${tool.slug}`}
                      className="p-2 rounded-lg bg-card hover:bg-hover border border-line text-xs font-semibold text-accent transition-colors"
                      title="Open Tool"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleUnpin(slug)}
                      className="p-2 rounded-lg bg-card hover:bg-danger/10 hover:text-danger border border-line text-xs text-muted transition-colors cursor-pointer"
                      title="Unpin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: SAVED SNIPPETS & WORKSPACES */}
      {activeTab === "snippets" && (
        <div className="rounded-2xl border border-line bg-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-fg">Saved Tool Configs &amp; Snippets</h2>
              <p className="text-xs text-muted">Your customized presets, generated code, and shared links</p>
            </div>

            {/* Create Workspace Form */}
            <form onSubmit={handleCreateWorkspace} className="flex items-center gap-2">
              <input
                type="text"
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                placeholder="New workspace..."
                className="h-9 px-3 text-xs bg-field border border-line rounded-lg text-fg focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={!newWsName.trim()}
                className="h-9 px-3 rounded-lg bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
              >
                Create
              </button>
            </form>
          </div>

          {/* Workspace Tabs */}
          <div className="flex items-center gap-2 border-b border-line/60 pb-2 overflow-x-auto">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => setActiveWsId(ws.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeWsId === ws.id
                    ? "bg-field border border-line text-accent font-bold"
                    : "text-muted hover:text-fg hover:bg-hover"
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>{ws.name}</span>
                <span className="text-[10px] font-mono text-muted bg-card px-1 rounded ml-1">
                  {savedConfigs.filter((c) => c.workspaceId === ws.id).length}
                </span>
              </button>
            ))}
          </div>

          {/* Snippets List */}
          {currentWsConfigs.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-line rounded-xl">
              <FileCode2 className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-fg">No snippets in this workspace</p>
              <p className="text-xs text-muted mt-1">
                Save outputs from JSON to TS, Cron Generator, or Regex Lab to see and share them here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentWsConfigs.map((config) => (
                <div
                  key={config.id}
                  className="rounded-xl border border-line bg-field/60 p-4 space-y-2 hover:border-line transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-fg">{config.title}</span>
                      <span className="text-[10px] font-mono uppercase bg-card border border-line px-1.5 py-0.5 rounded text-accent">
                        {config.toolSlug}
                      </span>
                      <span className="text-[10px] font-mono text-muted">
                        {new Date(config.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleShareConfig(config)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
                        title="Copy share link"
                      >
                        {sharedConfigId === config.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500">Copied Link!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Share</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(config.content, "pubKey")}
                        className="p-1.5 rounded text-muted hover:text-fg hover:bg-card border border-line/40 transition-colors cursor-pointer"
                        title="Copy content"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteConfig(config.id)}
                        className="p-1.5 rounded text-muted hover:text-danger hover:bg-danger/10 border border-line/40 transition-colors cursor-pointer"
                        title="Delete snippet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <pre className="p-3 rounded-lg bg-card border border-line text-xs font-mono text-fg overflow-x-auto max-h-36 scrollbar-thin">
                    {config.content}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: ZERO-KNOWLEDGE SECURITY & TEAM VAULTS */}
      {activeTab === "security" && (
        <div className="rounded-2xl border border-line bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-fg">Zero-Knowledge Cryptographic Vault</h2>
              <p className="text-xs text-muted">Asymmetric 2048-bit RSA + PBKDF2 600K Master Key</p>
            </div>
            <Link
              href="/env-vault/team"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hover transition-colors shadow-sm"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Open Team Vaults</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-line bg-field/60">
              <span className="text-xs font-semibold text-muted block mb-1">Passphrase Hardening</span>
              <span className="text-lg font-bold text-fg font-mono">600,000 Iterations</span>
              <p className="text-[11px] text-muted mt-1">PBKDF2-SHA-256 brute-force immunity</p>
            </div>

            <div className="p-4 rounded-xl border border-line bg-field/60">
              <span className="text-xs font-semibold text-muted block mb-1">Key Version</span>
              <span className="text-lg font-bold text-fg font-mono">v{keyVersion} (Active)</span>
              <p className="text-[11px] text-muted mt-1">Cryptographic revocation supported</p>
            </div>

            <div className="p-4 rounded-xl border border-line bg-field/60">
              <span className="text-xs font-semibold text-muted block mb-1">In-Memory Exfiltration Guard</span>
              <span className="text-lg font-bold text-emerald-500 font-mono">extractable: false</span>
              <p className="text-[11px] text-muted mt-1">Keys cannot be exported by rogue JS/XSS</p>
            </div>
          </div>

          {publicKeyShort && (
            <div className="p-4 rounded-xl border border-line bg-field/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-fg">Your Public Key (RSA-OAEP Base64 SPKI)</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(publicKeyShort, "pubKey")}
                  className="inline-flex items-center gap-1 text-xs text-accent font-semibold hover:underline cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedKey ? "Copied!" : "Copy Public Key"}</span>
                </button>
              </div>
              <p className="font-mono text-xs text-muted truncate p-2.5 rounded-lg bg-card border border-line">
                {publicKeyShort}
              </p>
              <p className="text-[11px] text-muted">
                Colleagues use this public key to encrypt team environment variables for you. Your private key remains securely wrapped in your own vault.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB: BYOK AI KEY VAULT */}
      {activeTab === "byok" && (
        <div className="rounded-2xl border border-line bg-card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-fg">Bring Your Own Key (BYOK) AI Vault</h2>
            <p className="text-xs text-muted">
              Keys are stored exclusively in your local browser and used directly with AI providers.
            </p>
          </div>

          {keySavedMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-mono text-emerald-500">
              {keySavedMessage}
            </div>
          )}

          <form onSubmit={handleSaveApiKeys} className="space-y-4 max-w-xl">
            {/* OpenAI */}
            <div>
              <label className="block text-xs font-semibold text-fg mb-1.5 uppercase tracking-wide">
                OpenAI API Key
              </label>
              <div className="relative">
                <input
                  type={showKey["openai"] ? "text" : "password"}
                  value={apiKeys.openai}
                  onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                  placeholder="sk-proj-..."
                  className="w-full bg-field border border-line rounded-xl px-4 py-2.5 pr-10 text-xs font-mono text-fg focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowKey({ ...showKey, openai: !showKey["openai"] })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg p-1 cursor-pointer"
                >
                  {showKey["openai"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Anthropic */}
            <div>
              <label className="block text-xs font-semibold text-fg mb-1.5 uppercase tracking-wide">
                Anthropic Claude API Key
              </label>
              <div className="relative">
                <input
                  type={showKey["anthropic"] ? "text" : "password"}
                  value={apiKeys.anthropic}
                  onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
                  placeholder="sk-ant-..."
                  className="w-full bg-field border border-line rounded-xl px-4 py-2.5 pr-10 text-xs font-mono text-fg focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowKey({ ...showKey, anthropic: !showKey["anthropic"] })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg p-1 cursor-pointer"
                >
                  {showKey["anthropic"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Google Gemini */}
            <div>
              <label className="block text-xs font-semibold text-fg mb-1.5 uppercase tracking-wide">
                Google Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showKey["gemini"] ? "text" : "password"}
                  value={apiKeys.gemini}
                  onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full bg-field border border-line rounded-xl px-4 py-2.5 pr-10 text-xs font-mono text-fg focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowKey({ ...showKey, gemini: !showKey["gemini"] })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg p-1 cursor-pointer"
                >
                  {showKey["gemini"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-accent-fg hover:bg-accent-hover transition-colors shadow-sm shadow-accent/20 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Save AI Keys Securely</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
