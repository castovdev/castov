"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { User as UserIcon, LogOut, Shield, LogIn } from "lucide-react";

interface AuthNavButtonProps {
  mobile?: boolean;
  onAction?: () => void;
}

export function AuthNavButton({ mobile = false, onAction }: AuthNavButtonProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    // Fetch initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) {
        setUser(user);
        setLoading(false);
      }
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSignOut = async () => {
    setOpen(false);
    if (onAction) onAction();
    await supabase.auth.signOut();
    router.refresh();
  };

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.user_name ||
    user?.email?.split("@")[0] ||
    "Developer";
  const userInitial = (user?.email?.[0] || displayName[0] || "U").toUpperCase();

  // Loading skeleton placeholder
  if (loading) {
    if (mobile) {
      return (
        <div className="h-10 w-full animate-pulse rounded-lg bg-field/60 border border-line" />
      );
    }
    return (
      <div className="h-9 w-9 animate-pulse rounded-lg bg-field/60 border border-line" />
    );
  }

  // MOBILE VIEW
  if (mobile) {
    if (!user) {
      return (
        <Link
          href="/login"
          onClick={onAction}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:text-[#050505]"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In</span>
        </Link>
      );
    }

    return (
      <div className="space-y-2 rounded-xl border border-line bg-card/60 p-3">
        <div className="flex items-center gap-3 pb-2 border-b border-line/60">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="h-9 w-9 rounded-full border border-line object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 border border-accent/40 font-mono text-xs font-bold text-accent">
              {userInitial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-fg">{displayName}</div>
            <div className="truncate font-mono text-xs text-muted">{user.email}</div>
          </div>
        </div>

        <div className="space-y-1 pt-1">
          <Link
            href="/env-vault/team"
            onClick={onAction}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-fg transition-colors hover:bg-hover"
          >
            <Shield className="w-4 h-4 text-accent" />
            <span>Team Vaults</span>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-danger transition-colors hover:bg-hover"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  // DESKTOP VIEW: LOGGED OUT
  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 h-9 px-3 text-xs sm:text-sm font-medium rounded-lg bg-field hover:bg-hover border border-line text-fg transition-colors"
      >
        <UserIcon className="w-3.5 h-3.5 text-muted" />
        <span className="hidden sm:inline">Sign In</span>
      </Link>
    );
  }

  // DESKTOP VIEW: LOGGED IN WITH DROPDOWN
  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 items-center gap-2 rounded-lg border border-line bg-field px-2 text-sm text-fg transition-colors hover:bg-hover focus:outline-none focus:ring-2 focus:ring-accent/40"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User menu"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            referrerPolicy="no-referrer"
            className="h-6 w-6 rounded-full border border-line/60 object-cover"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 border border-accent/40 font-mono text-[11px] font-bold text-accent">
            {userInitial}
          </div>
        )}
        <span className="max-w-[100px] truncate text-xs font-medium hidden md:inline">
          {displayName}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-line bg-card/95 backdrop-blur-xl p-1.5 shadow-2xl z-50 animate-in fade-in-0 zoom-in-95"
        >
          {/* User Info Header */}
          <div className="px-3 py-2 border-b border-line/60 mb-1">
            <p className="text-xs font-semibold text-fg truncate">{displayName}</p>
            <p className="font-mono text-[11px] text-muted truncate">{user.email}</p>
          </div>

          {/* Links */}
          <div className="space-y-0.5">
            <Link
              href="/env-vault/team"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-hover"
            >
              <Shield className="w-3.5 h-3.5 text-accent" />
              <span>Team Vaults</span>
            </Link>
          </div>

          <div className="my-1 border-t border-line/60" />

          {/* Sign Out Action */}
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-hover"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
