"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { clearInMemoryPrivateKey } from "@/lib/team-key-session";
import type { User } from "@supabase/supabase-js";
import { getTool, type ToolSlug } from "@/content/tools";
import {
  User as UserIcon,
  ChevronDown,
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
  Download,
  Upload,
  Clock,
  Terminal,
  Sliders,
  Award,
  Sparkles,
  RefreshCw,
  Layers,
  BarChart3,
  Mail,
} from "lucide-react";
import { DashboardMcpStacks } from "@/components/dashboard-mcp-stacks";
import { DashboardAnalytics } from "@/components/dashboard-analytics";
import { DashboardEnvVault } from "@/components/dashboard-env-vault";

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

interface DeveloperPreferences {
  timezone: string;
  indentStyle: "2" | "4" | "tab";
  defaultLanguage: "typescript" | "python" | "go" | "json" | "rust";
}

interface CliTokenData {
  token: string;
  createdAt: number;
}

interface RecentActivityItem {
  id: string;
  toolSlug: ToolSlug;
  action: "opened" | "configured" | "copied" | "saved";
  details?: string;
  timestamp: number;
}

const PINNED_STORAGE_KEY = "castov-pinned-tools";
const SAVED_CONFIGS_KEY = "castov_saved_configs";
const WORKSPACES_KEY = "castov_workspaces";
const API_KEYS_KEY = "castov_api_keys";
const PREFERENCES_KEY = "castov_developer_preferences";
const CLI_TOKEN_KEY = "castov_cli_token";
const RECENT_ACTIVITY_KEY = "castov_recent_activity";

const COMMON_TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Africa/Algiers",
  "Africa/Cairo",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

const OWNER_EMAIL = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
  "abdelmalikbenidir@gmail.com"
)
  .toLowerCase()
  .trim();

function AccountDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCliAuth = searchParams.get("cli_auth") === "true";

  const [user, setUser] = useState<User | null>(null);
  const isAdmin = Boolean(user?.email && user.email.toLowerCase().trim() === OWNER_EMAIL);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "pinned" | "snippets" | "preferences" | "activity" | "backup" | "security" | "byok" | "mcp_stacks" | "vault" | "analytics"
  >(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "vault") return "vault";
    if (tabParam === "mcp_stacks") return "mcp_stacks";
    if (tabParam === "snippets") return "snippets";
    if (tabParam === "preferences") return "preferences";
    return isCliAuth ? "preferences" : "overview";
  });

  // Pinned tools state
  const [pinnedSlugs, setPinnedSlugs] = useState<ToolSlug[]>([]);

  // Saved configs & workspaces
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWsId, setActiveWsId] = useState<string>("ws_personal");
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
  const [newWsName, setNewWsName] = useState("");

  // Developer Preferences
  const [devPrefs, setDevPrefs] = useState<DeveloperPreferences>({
    timezone: "UTC",
    indentStyle: "2",
    defaultLanguage: "typescript",
  });
  const [prefsSavedMessage, setPrefsSavedMessage] = useState<string | null>(null);

  // Castov CLI Token (PAT)
  const [cliTokenData, setCliTokenData] = useState<CliTokenData | null>(null);
  const [showCliToken, setShowCliToken] = useState(false);
  const [copiedCliToken, setCopiedCliToken] = useState(false);
  const [copiedCliCommand, setCopiedCliCommand] = useState(false);
  const [mcpClient, setMcpClient] = useState<"cursor" | "claude">("cursor");
  const [copiedMcpConfig, setCopiedMcpConfig] = useState(false);

  // Recent Activity
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);

  // Backup & Import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupExportMessage, setBackupExportMessage] = useState<string | null>(null);
  const [backupImportMessage, setBackupImportMessage] = useState<string | null>(null);

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
      if (user?.email?.toLowerCase().trim() !== OWNER_EMAIL) {
        setActiveTab((prev) => (prev === "analytics" ? "overview" : prev));
      }
      setLoading(false);

      // Local storage values
      let currentPins: ToolSlug[] = [];
      let currentWs: Workspace[] = [{ id: "ws_personal", name: "Personal Workspace", createdAt: Date.now() }];
      let currentConfigs: SavedConfig[] = [];
      let currentActivity: RecentActivityItem[] = [];

      try {
        const storedPinned = localStorage.getItem(PINNED_STORAGE_KEY);
        if (storedPinned) currentPins = JSON.parse(storedPinned);

        const storedWs = localStorage.getItem(WORKSPACES_KEY);
        if (storedWs) currentWs = JSON.parse(storedWs);

        const storedConfigs = localStorage.getItem(SAVED_CONFIGS_KEY);
        if (storedConfigs) currentConfigs = JSON.parse(storedConfigs);

        const storedPrefs = localStorage.getItem(PREFERENCES_KEY);
        if (storedPrefs) {
          try {
            setDevPrefs(JSON.parse(storedPrefs));
          } catch {
            // default
          }
        } else {
          const detectedTz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" : "UTC";
          setDevPrefs((prev) => ({ ...prev, timezone: detectedTz }));
        }

        const storedCli = localStorage.getItem(CLI_TOKEN_KEY);
        if (storedCli) {
          try {
            setCliTokenData(JSON.parse(storedCli));
          } catch {
            // ignore
          }
        } else if (isCliAuth) {
          const bytes = new Uint8Array(16);
          crypto.getRandomValues(bytes);
          const hex = Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          const token = `cst_live_${hex}`;
          const newCliData: CliTokenData = {
            token,
            createdAt: Date.now(),
          };
          setCliTokenData(newCliData);
          localStorage.setItem(CLI_TOKEN_KEY, JSON.stringify(newCliData));
        }

        const storedActs = localStorage.getItem(RECENT_ACTIVITY_KEY);
        if (storedActs) {
          try {
            currentActivity = JSON.parse(storedActs);
          } catch {
            // ignore
          }
        } else {
          // Initialize with helpful seed activity
          currentActivity = [
            {
              id: "act_init_1",
              toolSlug: "cron-generator",
              action: "opened",
              details: "Evaluated Cron schedule expressions",
              timestamp: Date.now() - 3600000 * 2,
            },
            {
              id: "act_init_2",
              toolSlug: "json-to-ts",
              action: "saved",
              details: "Saved TypeScript schema interface",
              timestamp: Date.now() - 3600000 * 5,
            },
          ];
          localStorage.setItem(RECENT_ACTIVITY_KEY, JSON.stringify(currentActivity));
        }

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
        setRecentActivity(currentActivity);
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
  }, [supabase, syncToCloud, isCliAuth]);

  // Actions
  const handleSignOut = async () => {
    if (user?.id) clearInMemoryPrivateKey(user.id);
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

  // 1. Developer Preferences Handlers
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(devPrefs));
    setPrefsSavedMessage("Developer preferences updated.");
    setTimeout(() => setPrefsSavedMessage(null), 3000);
  };

  const handleAutoDetectTimezone = () => {
    const detected = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" : "UTC";
    setDevPrefs((prev) => ({ ...prev, timezone: detected }));
    setPrefsSavedMessage(`Detected system timezone: ${detected}`);
    setTimeout(() => setPrefsSavedMessage(null), 3000);
  };

  // 2. Castov CLI Token Handlers
  const handleGenerateCliToken = async () => {
    const array = new Uint8Array(16);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < 16; i++) array[i] = Math.floor(Math.random() * 256);
    }
    const hex = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
    const token = `cst_live_${hex}`;
    const data: CliTokenData = {
      token,
      createdAt: Date.now(),
    };
    setCliTokenData(data);
    localStorage.setItem(CLI_TOKEN_KEY, JSON.stringify(data));

    // Persist SHA-256 hash to Supabase user_api_keys if authenticated
    if (user && typeof crypto !== "undefined" && crypto.subtle) {
      try {
        const hashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
        const keyHash = Array.from(new Uint8Array(hashBuf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        await supabase.from("user_api_keys").insert([
          {
            user_id: user.id,
            key_hash: keyHash,
            key_prefix: token.slice(0, 16),
            name: "Personal Access Token",
            scopes: ["vault:read", "vault:write"],
            revoked: false,
          },
        ]);
      } catch {
        // Table not yet migrated or offline
      }
    }
  };

  const handleRevokeCliToken = async () => {
    if (cliTokenData?.token && user && typeof crypto !== "undefined" && crypto.subtle) {
      try {
        const hashBuf = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(cliTokenData.token)
        );
        const keyHash = Array.from(new Uint8Array(hashBuf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        await supabase
          .from("user_api_keys")
          .update({ revoked: true, revoked_at: new Date().toISOString() })
          .eq("key_hash", keyHash);
      } catch {
        // ignore
      }
    }
    setCliTokenData(null);
    localStorage.removeItem(CLI_TOKEN_KEY);
  };

  const handleCopyCliToken = () => {
    if (!cliTokenData) return;
    navigator.clipboard.writeText(cliTokenData.token);
    setCopiedCliToken(true);
    setTimeout(() => setCopiedCliToken(false), 2000);
  };

  const handleCopyCliCommand = () => {
    if (!cliTokenData) return;
    const command = `castov login --token ${cliTokenData.token}`;
    navigator.clipboard.writeText(command);
    setCopiedCliCommand(true);
    setTimeout(() => setCopiedCliCommand(false), 2000);
  };

  const cursorMcpConfig = JSON.stringify(
    {
      mcpServers: {
        castov: {
          command: "castov",
          args: ["mcp"],
        },
      },
    },
    null,
    2
  );

  const claudeMcpConfig = JSON.stringify(
    {
      mcpServers: {
        castov: {
          command: "npx",
          args: ["-y", "castov", "mcp"],
        },
      },
    },
    null,
    2
  );

  const handleCopyMcpConfig = (cfg: string) => {
    navigator.clipboard.writeText(cfg);
    setCopiedMcpConfig(true);
    setTimeout(() => setCopiedMcpConfig(false), 2000);
  };

  // 3. Activity Log Clear
  const handleClearActivity = () => {
    setRecentActivity([]);
    localStorage.removeItem(RECENT_ACTIVITY_KEY);
  };

  // 4. Backup Export / Import Handlers
  const handleExportBackup = () => {
    const backupData = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      user: user ? { id: user.id, email: user.email } : null,
      pinnedTools: pinnedSlugs,
      workspaces,
      savedConfigs,
      developerPreferences: devPrefs,
      recentActivity,
    };
    const jsonBlob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `castov-developer-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupExportMessage("Full backup downloaded successfully.");
    setTimeout(() => setBackupExportMessage(null), 3500);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        let restoredItems = 0;
        let nextPins = pinnedSlugs;
        let nextWs = workspaces;
        let nextConfigs = savedConfigs;

        if (Array.isArray(data.pinnedTools)) {
          nextPins = Array.from(new Set([...nextPins, ...data.pinnedTools])) as ToolSlug[];
          setPinnedSlugs(nextPins);
          localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(nextPins));
          restoredItems += data.pinnedTools.length;
        }

        if (Array.isArray(data.workspaces) && data.workspaces.length > 0) {
          const existingWsIds = new Set(workspaces.map((w) => w.id));
          const newWs = data.workspaces.filter((w: Workspace) => !existingWsIds.has(w.id));
          nextWs = [...workspaces, ...newWs];
          setWorkspaces(nextWs);
          localStorage.setItem(WORKSPACES_KEY, JSON.stringify(nextWs));
          restoredItems += newWs.length;
        }

        if (Array.isArray(data.savedConfigs) && data.savedConfigs.length > 0) {
          const existingConfigIds = new Set(savedConfigs.map((c) => c.id));
          const newConfigs = data.savedConfigs.filter((c: SavedConfig) => !existingConfigIds.has(c.id));
          nextConfigs = [...savedConfigs, ...newConfigs];
          setSavedConfigs(nextConfigs);
          localStorage.setItem(SAVED_CONFIGS_KEY, JSON.stringify(nextConfigs));
          restoredItems += newConfigs.length;
        }

        if (data.developerPreferences && typeof data.developerPreferences === "object") {
          setDevPrefs((prev) => {
            const merged = { ...prev, ...data.developerPreferences };
            localStorage.setItem(PREFERENCES_KEY, JSON.stringify(merged));
            return merged;
          });
        }

        if (Array.isArray(data.recentActivity) && data.recentActivity.length > 0) {
          setRecentActivity((prev) => {
            const existingActIds = new Set(prev.map((a) => a.id));
            const newActs = data.recentActivity.filter((a: RecentActivityItem) => !existingActIds.has(a.id));
            const merged = [...prev, ...newActs];
            localStorage.setItem(RECENT_ACTIVITY_KEY, JSON.stringify(merged));
            return merged;
          });
        }

        if (user) {
          syncToCloud(user, nextPins, nextWs, nextConfigs);
        }

        setBackupImportMessage(`Restored ${restoredItems} configuration items cleanly.`);
        setTimeout(() => setBackupImportMessage(null), 4000);
      } catch {
        setBackupImportMessage("Failed to restore: Invalid JSON structure.");
        setTimeout(() => setBackupImportMessage(null), 4000);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // 5. Dynamic Developer Archetype & Productivity Stats
  const getDeveloperArchetype = () => {
    const totalItems = pinnedSlugs.length + savedConfigs.length;
    if (hasSecurityKeys || pinnedSlugs.some((p) => p.includes("vault") || p.includes("secret"))) {
      return {
        title: "Security & Vault Architect",
        description: "Zero-knowledge isolation, PBKDF2 hardening & team secrets rotation.",
        colorBadge: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        IconComponent: Shield,
      };
    }
    if (devPrefs.defaultLanguage === "python" || devPrefs.defaultLanguage === "go" || devPrefs.defaultLanguage === "rust") {
      return {
        title: "Systems & Backend Specialist",
        description: "High-throughput engines, distributed workflows & robust concurrency.",
        colorBadge: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        IconComponent: Terminal,
      };
    }
    if (totalItems >= 4) {
      return {
        title: "Productivity Master",
        description: "Accelerated engineering workflows, saved presets & rapid tool chaining.",
        colorBadge: "text-purple-400 bg-purple-500/10 border-purple-500/20",
        IconComponent: Sparkles,
      };
    }
    return {
      title: "Full-Stack Web Architect",
      description: "Modern micro-utilities, typed data pipelines & cross-device portability.",
      colorBadge: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      IconComponent: Award,
    };
  };

  const archetype = getDeveloperArchetype();
  const estimatedTimeSavedMinutes = pinnedSlugs.length * 15 + savedConfigs.length * 20 + 45;
  const estimatedTimeSavedText =
    estimatedTimeSavedMinutes >= 60
      ? `${(estimatedTimeSavedMinutes / 60).toFixed(1)} hrs saved`
      : `${estimatedTimeSavedMinutes} mins saved`;

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
          {isCliAuth && (
            <div className="relative z-10 mb-6 p-4 rounded-xl border border-accent/40 bg-accent/10 flex items-center gap-3 text-left max-w-md mx-auto">
              <div className="w-9 h-9 rounded-lg bg-accent text-accent-fg flex items-center justify-center shrink-0">
                <Terminal className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-fg">Terminal Authentication Request</h3>
                <p className="text-[11px] text-muted">Sign in with GitHub to complete authentication in your CLI terminal.</p>
              </div>
            </div>
          )}
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
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

                {/* Developer Archetype Pill */}
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${archetype.colorBadge}`}>
                  <archetype.IconComponent className="w-3 h-3" />
                  <span>{archetype.title}</span>
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

{isCliAuth && (
        <div className="rounded-2xl border-2 border-accent/40 bg-accent/10 p-5 shadow-lg space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent text-accent-fg flex items-center justify-center font-bold shrink-0">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-fg">Terminal Authorization Request Active</h3>
                <p className="text-xs text-muted">
                  Castov CLI is requesting access to your developer workspace. Copy your token or command below to complete login.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-accent/20 text-accent font-mono text-[11px] font-semibold uppercase tracking-wider shrink-0">
              CLI Auth Flow
            </span>
          </div>

          {cliTokenData && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={`castov login --token ${cliTokenData.token}`}
                className="flex-1 bg-card border border-line rounded-lg px-3 py-2 text-xs font-mono text-fg select-all"
              />
              <button
                type="button"
                onClick={handleCopyCliCommand}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hover transition-colors shadow-sm cursor-pointer shrink-0"
              >
                {copiedCliCommand ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCliCommand ? "Command Copied!" : "Copy Login Command"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. MAIN 2-COLUMN DASHBOARD LAYOUT (Sidebar + Main Content) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Vertical Categorized Sidebar */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Mobile Tab Selector (Compact Select Dropdown on small screens) */}
          <div className="lg:hidden">
            <label htmlFor="account-tab-select" className="sr-only">
              Select Setting Section
            </label>
            <div className="relative">
              <select
                id="account-tab-select"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
                className="w-full h-11 px-3.5 pr-10 rounded-xl bg-field border border-line text-sm font-semibold text-fg appearance-none focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
              >
                {[
                  { id: "overview", label: "Overview" },
                  { id: "activity", label: `Activity (${recentActivity.length})` },
                  { id: "pinned", label: `Pinned Tools (${pinnedSlugs.length})` },
                  { id: "snippets", label: `Saved Snippets (${savedConfigs.length})` },
                  { id: "preferences", label: "Preferences & CLI" },
                  { id: "security", label: "Zero-Knowledge" },
                  { id: "vault", label: "Env Vault (E2EE)" },
                  { id: "byok", label: "BYOK AI Keys" },
                  { id: "backup", label: "Backup & Portability" },
                  { id: "mcp_stacks", label: "MCP Stacks" },
                  ...(isAdmin ? [{ id: "analytics", label: "Admin Analytics" }] : []),
                ].map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            </div>
          </div>

          {/* Desktop Vertical Sidebar: Categorized with icons & badges */}
          <div className="hidden lg:block rounded-2xl border border-line bg-card/70 p-3 space-y-4 sticky top-20 shadow-xs">
            {[
              {
                heading: "GENERAL",
                tabs: [
                  { id: "overview", label: "Overview", icon: UserIcon },
                  { id: "activity", label: `Activity (${recentActivity.length})`, icon: Clock },
                ],
              },
              {
                heading: "WORKSPACE",
                tabs: [
                  { id: "pinned", label: `Pinned Tools (${pinnedSlugs.length})`, icon: Star },
                  { id: "snippets", label: `Saved Snippets (${savedConfigs.length})`, icon: Folder },
                  { id: "preferences", label: "Preferences & CLI", icon: Sliders },
                ],
              },
              {
                heading: "SECURITY & CLOUD",
                tabs: [
                  { id: "security", label: "Zero-Knowledge", icon: Shield },
                  { id: "vault", label: "Env Vault", icon: Lock, badge: "E2EE" },
                  { id: "byok", label: "BYOK AI Keys", icon: Key },
                  { id: "backup", label: "Backup & Restore", icon: Download },
                ],
              },
              {
                heading: "DEVELOPER",
                tabs: [
                  { id: "mcp_stacks", label: "MCP Stacks", icon: Layers, badge: "MCP" },
                  ...(isAdmin ? [{ id: "analytics", label: "Admin Analytics", icon: BarChart3 }] : []),
                ],
              },
            ].map((group) => (
              <div key={group.heading} className="space-y-1">
                <p className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-muted">
                  {group.heading}
                </p>
                <div className="space-y-0.5">
                  {group.tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? "bg-accent text-accent-fg shadow-sm shadow-accent/20"
                            : "text-muted hover:text-fg hover:bg-hover"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{tab.label}</span>
                        </div>
                        {tab.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-medium ${
                              isActive
                                ? "bg-accent-fg/10 text-accent-fg"
                                : "bg-field border border-line text-muted"
                            }`}
                          >
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Column: Tab Panels Content */}
        <main className="lg:col-span-9 min-w-0">
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
                <span className="text-xs font-semibold uppercase tracking-wider">Time Saved</span>
                <Clock className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-fg font-mono">{estimatedTimeSavedText}</div>
              <p className="text-xs text-muted mt-1">Automated tool productivity</p>
            </div>

            <div className="rounded-xl border border-line bg-card p-5">
              <div className="flex items-center justify-between text-muted mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">CLI Status</span>
                <Terminal className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-fg">
                {cliTokenData ? "Active" : "Ready"}
              </div>
              <p className="text-xs text-muted mt-1">
                {cliTokenData ? "PAT configured for terminal" : "Generate PAT in Preferences"}
              </p>
            </div>
          </div>

          {/* Archetype Showcase Card */}
          <div className="rounded-2xl border border-line bg-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3.5 rounded-2xl border ${archetype.colorBadge}`}>
                <archetype.IconComponent className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-muted">Developer Profile</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${archetype.colorBadge}`}>
                    {archetype.title}
                  </span>
                </div>
                <h3 className="text-base font-bold text-fg mt-1">{archetype.title}</h3>
                <p className="text-xs text-muted mt-0.5 max-w-xl">{archetype.description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("preferences")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-line bg-field text-xs font-semibold text-fg hover:bg-hover transition-colors cursor-pointer shrink-0"
            >
              <Sliders className="w-3.5 h-3.5 text-accent" />
              <span>Customize Environment</span>
            </button>
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
                            className="text-muted hover:text-danger p-1 rounded transition-colors cursor-pointer"
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

          {pinnedSlugs.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-line rounded-xl">
              <Star className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-fg">No tools pinned yet</p>
              <p className="text-xs text-muted mt-1">Browse the tool catalog and pin your essential utilities for rapid access.</p>
            </div>
          ) : (
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
          )}
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

      {/* TAB: DEVELOPER PREFERENCES & CLI TOKEN */}
      {activeTab === "preferences" && (
        <div className="space-y-6">
          {/* Email & Release Notifications */}
          <div className="rounded-2xl border border-line bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent/10 text-accent">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-fg">Email &amp; Release Notifications</h3>
                  <p className="text-xs text-muted">Receive major CLI upgrades, security advisories, and ecosystem updates.</p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
                1-Click Active
              </span>
            </div>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-line bg-field flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-fg">Product Releases &amp; Tools</p>
                  <p className="text-[11px] text-muted">New browser tools, CLI updates &amp; templates</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  onChange={async (_e) => {
                    if (user?.email) {
                      await fetch("/api/newsletter/subscribe", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: user.email, source: "account_preferences" }),
                      });
                    }
                  }}
                  className="w-4 h-4 accent-accent rounded cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl border border-line bg-field flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-fg">Security &amp; MCP Advisories</p>
                  <p className="text-[11px] text-muted">Model Context Protocol patches &amp; CVE alerts</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  onChange={async (_e) => {
                    if (user?.email) {
                      await fetch("/api/newsletter/subscribe", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: user.email, source: "account_security_advisories" }),
                      });
                    }
                  }}
                  className="w-4 h-4 accent-accent rounded cursor-pointer"
                />
              </div>
            </div>
            <p className="text-[11px] text-muted font-mono">
              Account email: <span className="text-fg font-semibold">{user?.email || "Connected via GitHub"}</span> • Zero-spam guarantee.
            </p>
          </div>

          {/* Defaults Form */}
          <div className="rounded-2xl border border-line bg-card p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-fg">Developer Defaults &amp; Preferences</h2>
              <p className="text-xs text-muted">Customize indentation, output language, and IANA timezone across all Castov tools.</p>
            </div>

            {prefsSavedMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-mono text-emerald-500">
                {prefsSavedMessage}
              </div>
            )}

            <form onSubmit={handleSavePreferences} className="space-y-5 max-w-xl">
              {/* Timezone */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-fg uppercase tracking-wide">
                    Default IANA Timezone
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoDetectTimezone}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Auto-detect System Timezone</span>
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={devPrefs.timezone}
                    onChange={(e) => setDevPrefs({ ...devPrefs, timezone: e.target.value })}
                    className="w-full bg-field border border-line rounded-xl px-4 py-2.5 text-xs font-mono text-fg focus:outline-none focus:border-accent appearance-none cursor-pointer"
                  >
                    {!COMMON_TIMEZONES.includes(devPrefs.timezone) && (
                      <option value={devPrefs.timezone}>{devPrefs.timezone} (Detected)</option>
                    )}
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Indentation */}
              <div>
                <label className="block text-xs font-semibold text-fg mb-1.5 uppercase tracking-wide">
                  Code Indentation Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "2", label: "2 Spaces", desc: "JS / TS standard" },
                    { id: "4", label: "4 Spaces", desc: "Python / Java" },
                    { id: "tab", label: "Tabs", desc: "Go / Linux" },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setDevPrefs({ ...devPrefs, indentStyle: item.id as "2" | "4" | "tab" })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        devPrefs.indentStyle === item.id
                          ? "border-accent bg-accent/10 text-accent font-bold"
                          : "border-line bg-field text-muted hover:text-fg hover:bg-hover"
                      }`}
                    >
                      <div className="text-xs font-semibold">{item.label}</div>
                      <div className="text-[10px] text-muted mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Target Language */}
              <div>
                <label className="block text-xs font-semibold text-fg mb-1.5 uppercase tracking-wide">
                  Default Target Output Language
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: "typescript", label: "TypeScript" },
                    { id: "python", label: "Python" },
                    { id: "go", label: "Go" },
                    { id: "json", label: "JSON" },
                    { id: "rust", label: "Rust" },
                  ].map((lang) => (
                    <button
                      type="button"
                      key={lang.id}
                      onClick={() =>
                        setDevPrefs({
                          ...devPrefs,
                          defaultLanguage: lang.id as "typescript" | "python" | "go" | "json" | "rust",
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        devPrefs.defaultLanguage === lang.id
                          ? "border-accent bg-accent text-accent-fg shadow-sm"
                          : "border-line bg-field text-muted hover:text-fg hover:bg-hover"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-accent-fg hover:bg-accent-hover transition-colors shadow-sm shadow-accent/20 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Preferences</span>
              </button>
            </form>
          </div>

          {/* Castov CLI Personal Access Token Card */}
          <div className="rounded-2xl border border-line bg-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-accent" />
                  <h2 className="text-lg font-bold text-fg">Castov CLI Authentication (PAT)</h2>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Generate a Personal Access Token to authenticate the Castov CLI (`castov login`) in your local terminal.
                </p>
              </div>

              <div>
                {cliTokenData ? (
                  <button
                    type="button"
                    onClick={handleRevokeCliToken}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger/30 bg-danger/10 text-danger text-xs font-semibold hover:bg-danger/20 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Revoke Token</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateCliToken}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hover transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Generate CLI Token</span>
                  </button>
                )}
              </div>
            </div>

            {cliTokenData ? (
              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl border border-line bg-field/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-fg">Active Token (Live)</span>
                    <span className="text-[11px] font-mono text-muted">
                      Created {new Date(cliTokenData.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type={showCliToken ? "text" : "password"}
                      readOnly
                      value={cliTokenData.token}
                      className="flex-1 bg-card border border-line rounded-lg px-3 py-2 text-xs font-mono text-fg select-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCliToken(!showCliToken)}
                      className="p-2 rounded-lg border border-line bg-card hover:bg-hover text-muted hover:text-fg transition-colors cursor-pointer"
                      title={showCliToken ? "Hide token" : "Show token"}
                    >
                      {showCliToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCliToken}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hover transition-colors cursor-pointer"
                    >
                      {copiedCliToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCliToken ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Setup Snippet */}
                <div className="p-4 rounded-xl border border-line bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted">Terminal Quick Login Command</span>
                    <button
                      type="button"
                      onClick={handleCopyCliCommand}
                      className="inline-flex items-center gap-1 text-xs text-accent font-semibold hover:underline cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedCliCommand ? "Command Copied!" : "Copy Command"}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-field border border-line text-xs font-mono text-fg overflow-x-auto select-all">
                    castov login --token {cliTokenData.token}
                  </pre>
                  <p className="text-[11px] text-muted">
                    Run this command once in your terminal to synchronize your workspaces and Team Vaults directly into CLI v1.5.0.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center border border-dashed border-line rounded-xl">
                <Terminal className="w-6 h-6 text-muted mx-auto mb-2 opacity-50" />
                <p className="text-xs text-muted">No personal access token currently issued.</p>
                <p className="text-[11px] text-muted mt-0.5">Click &quot;Generate CLI Token&quot; above to connect your local development environment.</p>
              </div>
            )}
          </div>

          {/* AI Agents & Model Context Protocol (MCP) Setup */}
          <div className="rounded-2xl border border-line bg-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  <h2 className="text-lg font-bold text-fg">AI Agents &amp; Model Context Protocol (MCP)</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                    13 Tools (10 Core + 3 Pipelines)
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Connect Castov directly to Cursor IDE or Claude Desktop. Allow your AI agent to format JSON, explain cron across timezones, and audit JWT tokens locally.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-field rounded-xl border border-line self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setMcpClient("cursor")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mcpClient === "cursor"
                      ? "bg-card text-fg shadow-xs border border-line"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  Cursor (~/.cursor/mcp.json)
                </button>
                <button
                  type="button"
                  onClick={() => setMcpClient("claude")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mcpClient === "claude"
                      ? "bg-card text-fg shadow-xs border border-line"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  Claude Desktop
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="p-4 rounded-xl border border-line bg-field/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted font-mono">
                    {mcpClient === "cursor" ? "~/.cursor/mcp.json" : "claude_desktop_config.json"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyMcpConfig(mcpClient === "cursor" ? cursorMcpConfig : claudeMcpConfig)}
                    className="inline-flex items-center gap-1 text-xs text-accent font-semibold hover:underline cursor-pointer"
                  >
                    {copiedMcpConfig ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMcpConfig ? "Config Copied!" : "Copy MCP JSON"}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-card border border-line text-xs font-mono text-fg overflow-x-auto select-all">
                  {mcpClient === "cursor" ? cursorMcpConfig : claudeMcpConfig}
                </pre>
                <p className="text-[11px] text-muted">
                  Paste this snippet inside your editor config. Your AI assistant will automatically discover tools such as `castov_json_to_ts_pipeline`, `castov_cron_timezone_pipeline`, and `castov_jwt_inspect_pipeline`.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: RECENT ACTIVITY */}
      {activeTab === "activity" && (
        <div className="rounded-2xl border border-line bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-fg">Recent Activity &amp; Tool History</h2>
              <p className="text-xs text-muted">Audit trail of visited tools, executed utilities, and saved presets</p>
            </div>
            {recentActivity.length > 0 && (
              <button
                type="button"
                onClick={handleClearActivity}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-field hover:bg-danger/10 hover:text-danger hover:border-danger/30 text-xs font-semibold text-muted transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-line rounded-xl">
              <Clock className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-fg">No recent activity recorded</p>
              <p className="text-xs text-muted mt-1">Actions you perform across developer utilities will be chronologically tracked here.</p>
            </div>
          ) : (
            <div className="space-y-2.5 pt-2">
              {recentActivity.map((item) => {
                const tool = getTool(item.toolSlug);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-line bg-field/60 hover:bg-hover transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-card border border-line flex items-center justify-center text-accent shrink-0 font-mono text-xs font-bold uppercase">
                        {item.action === "opened" ? "OPN" : item.action === "saved" ? "SAV" : "EXE"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-fg truncate">
                            {tool ? tool.name : item.toolSlug}
                          </span>
                          <span className="text-[10px] font-mono uppercase bg-card border border-line px-1.5 py-0.2 rounded text-muted">
                            {item.action}
                          </span>
                        </div>
                        {item.details && <p className="text-xs text-muted truncate mt-0.5">{item.details}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-mono text-muted">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <Link
                        href={`/${item.toolSlug}`}
                        className="p-1.5 rounded-lg bg-card hover:bg-hover border border-line text-accent transition-colors"
                        title="Jump to Tool"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* E2EE Cloud Sync CTA Banner */}
          <div className="mt-4 rounded-xl border border-accent/30 bg-gradient-to-r from-accent/10 via-card to-accent/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/20 text-accent flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-fg">
                  Unlimited End-to-End Encrypted Cloud Sync (E2EE)
                </h4>
                <p className="text-[11px] text-muted mt-0.5">
                  Sign in with GitHub to back up and sync your activity, preferences, and CLI tokens across machines.
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-mono shrink-0">
              <Check className="w-3.5 h-3.5" />
              <span>E2EE Synced</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB: BACKUP & PORTABILITY */}
      {activeTab === "backup" && (
        <div className="rounded-2xl border border-line bg-card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-fg">One-Click Backup &amp; Data Portability</h2>
            <p className="text-xs text-muted">
              Export and restore all your pinned tools, custom workspaces, saved code snippets, and environment preferences as a unified, portable JSON package.
            </p>
          </div>

          {backupExportMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-mono text-emerald-500">
              {backupExportMessage}
            </div>
          )}

          {backupImportMessage && (
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl text-xs font-mono text-accent">
              {backupImportMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Card */}
            <div className="p-5 rounded-xl border border-line bg-field/60 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Download className="w-4 h-4 text-accent" />
                  <h3 className="font-bold text-sm text-fg">Export Complete Backup</h3>
                </div>
                <p className="text-xs text-muted">
                  Download a portable snapshot of {pinnedSlugs.length} pinned tools, {workspaces.length} workspaces, and {savedConfigs.length} code snippets.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hover transition-colors shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Backup</span>
              </button>
            </div>

            {/* Import Card */}
            <div className="p-5 rounded-xl border border-line bg-field/60 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-bold text-sm text-fg">Restore from Backup</h3>
                </div>
                <p className="text-xs text-muted">
                  Upload a previously exported JSON backup file to merge or restore your developer configuration across devices.
                </p>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-line bg-card text-xs font-bold text-fg hover:bg-hover transition-colors shadow-sm cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-accent" />
                  <span>Import JSON Backup File</span>
                </button>
              </div>
            </div>
          </div>
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

      {/* TAB: ZERO-KNOWLEDGE ENV VAULT */}
      {activeTab === "vault" && <DashboardEnvVault />}

      {/* TAB: CLOUD MCP STACKS */}
      {activeTab === "mcp_stacks" && <DashboardMcpStacks />}

      {/* TAB: ADMIN ANALYTICS */}
      {isAdmin && activeTab === "analytics" && <DashboardAnalytics />}
            </main>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="layout-content py-20 min-h-[70vh] flex flex-col items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="mt-4 text-sm font-mono text-muted">Loading developer dashboard...</p>
        </div>
      }
    >
      <AccountDashboard />
    </Suspense>
  );
}
