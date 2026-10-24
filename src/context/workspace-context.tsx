// "use client"

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export interface Workspace {
  id: string;
  name: string;
  createdAt: number;
}

export interface SavedConfig {
  id: string;
  workspaceId: string;
  toolSlug: string;
  title: string;
  content: string;
  language: string;
  createdAt: number;
  updatedAt: number;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  savedConfigs: SavedConfig[];
  user: User | null;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
  createWorkspace: (name: string) => void;
  switchWorkspace: (workspaceId: string) => void;
  saveToolConfig: (params: { toolSlug: string; title: string; content: string; language: string }) => void;
  deleteSavedConfig: (configId: string) => void;
  getWorkspaceConfigs: (workspaceId: string) => SavedConfig[];
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  // User auth state
  const [user, setUser] = useState<User | null>(null);

  // Lazy initialization from localStorage
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    if (typeof window === "undefined") {
      return [{ id: "ws_personal", name: "Personal Workspace", createdAt: Date.now() }];
    }
    const stored = localStorage.getItem("castov_workspaces");
    const ws: Workspace[] = stored ? JSON.parse(stored) : [];
    if (ws.length === 0) {
      const defaultWs: Workspace = { id: "ws_personal", name: "Personal Workspace", createdAt: Date.now() };
      localStorage.setItem("castov_workspaces", JSON.stringify([defaultWs]));
      return [defaultWs];
    }
    return ws;
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    if (typeof window === "undefined") return "ws_personal";
    const stored = localStorage.getItem("castov_active_workspace");
    if (stored) return stored;
    return workspaces[0]?.id || "";
  });

  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("castov_saved_configs");
    return stored ? JSON.parse(stored) : [];
  });

  // Auth listener effect (no localStorage writes here)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  // Sync state to localStorage on changes
  useEffect(() => {
    localStorage.setItem("castov_workspaces", JSON.stringify(workspaces));
    localStorage.setItem("castov_active_workspace", activeWorkspaceId);
    localStorage.setItem("castov_saved_configs", JSON.stringify(savedConfigs));
    // Cloud sync placeholder – would sync to Supabase in production
    if (user) {
      // e.g., supabase.from('workspaces').upsert(workspaces)
    }
  }, [workspaces, activeWorkspaceId, savedConfigs, user]);

  const signInWithGithub = async () => {
    await supabase.auth.signInWithOAuth({ provider: "github" });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const createWorkspace = (name: string) => {
    const suffix = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36);
    const newWs: Workspace = {
      id: `ws_${Date.now()}_${suffix}`,
      name: name.trim() || "New Workspace",
      createdAt: Date.now()
    };
    setWorkspaces([...workspaces, newWs]);
    setActiveWorkspaceId(newWs.id);
  };

  const switchWorkspace = (workspaceId: string) => {
    if (workspaces.find(w => w.id === workspaceId)) {
      setActiveWorkspaceId(workspaceId);
    }
  };

  const saveToolConfig = ({ toolSlug, title, content, language }: { toolSlug: string; title: string; content: string; language: string }) => {
    const suffix = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36);
    const newConfig: SavedConfig = {
      id: `cfg_${Date.now()}_${suffix}`,
      workspaceId: activeWorkspaceId,
      toolSlug,
      title: title.trim() || "Untitled Config",
      content,
      language,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setSavedConfigs([...savedConfigs, newConfig]);
  };

  const deleteSavedConfig = (configId: string) => {
    setSavedConfigs(savedConfigs.filter(c => c.id !== configId));
  };

  const getWorkspaceConfigs = (workspaceId: string) => {
    return savedConfigs.filter(c => c.workspaceId === workspaceId).sort((a, b) => b.updatedAt - a.updatedAt);
  };

  // No loading state needed – hooks run after hydration
  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      activeWorkspaceId,
      savedConfigs,
      user,
      signInWithGithub,
      signOut,
      createWorkspace,
      switchWorkspace,
      saveToolConfig,
      deleteSavedConfig,
      getWorkspaceConfigs
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
