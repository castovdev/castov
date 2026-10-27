"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { fetchProfileByUsername, type DeveloperProfile } from "@/lib/profile-service";
import { getTool } from "@/content/tools";
import {
  User as UserIcon,
  Globe,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Calendar,
  Cloud,
  Terminal,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const resolvedParams = use(params);
  const username = resolvedParams.username;

  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchProfileByUsername(username).then((data) => {
      if (mounted) {
        setProfile(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [username]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="layout-content py-20 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4 text-sm font-mono text-muted">Loading developer profile @{username}...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="layout-content py-20 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-field flex items-center justify-center text-muted border border-line">
          <UserIcon className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-fg">Developer Not Found</h1>
        <p className="text-sm text-muted max-w-md mx-auto">
          The developer profile <span className="font-mono text-accent">@{username}</span> either does not exist or has been made private.
        </p>
        <div className="pt-4">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-fg font-semibold text-xs hover:bg-accent-hover transition-colors"
          >
            <span>Explore Developer Tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const userInitial = (profile.fullName?.[0] || profile.username?.[0] || "U").toUpperCase();

  const joinedYearMonth = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Recent";

  return (
    <div className="layout-content py-8 sm:py-12 max-w-5xl mx-auto space-y-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-muted">
        <Link href="/" className="hover:text-fg transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-muted">Developers</span>
        <span>/</span>
        <span className="text-fg font-semibold">@{profile.username}</span>
      </nav>

      {/* 1. HERO DEVELOPER PROFILE CARD */}
      <div className="rounded-3xl border border-line bg-card p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-48 bg-accent/10 blur-3xl pointer-events-none rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                referrerPolicy="no-referrer"
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 border-accent/30 object-cover shadow-sm shrink-0"
              />
            ) : (
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-accent/20 border-2 border-accent/40 font-mono text-2xl sm:text-3xl font-bold text-accent shadow-sm shrink-0">
                {userInitial}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-fg tracking-tight">
                  {profile.fullName}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-field border border-line text-muted">
                  @{profile.username}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-accent/10 border border-accent/20 text-accent">
                  <Sparkles className="w-3 h-3" />
                  <span>{profile.headline}</span>
                </span>
              </div>

              {profile.bio && (
                <p className="text-sm text-fg/80 max-w-2xl leading-relaxed pt-1">
                  {profile.bio}
                </p>
              )}

              {/* Meta Stats & Social Links */}
              <div className="flex items-center gap-4 pt-2 text-xs text-muted flex-wrap">
                <span className="flex items-center gap-1.5 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {joinedYearMonth}</span>
                </span>
                <span className="flex items-center gap-1.5 font-mono text-emerald-500 font-medium">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Cloud Synced</span>
                </span>

                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-fg hover:text-accent transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3 text-muted" />
                  </a>
                )}
                {profile.githubUrl && (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-fg hover:text-accent transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3 text-muted" />
                  </a>
                )}
                {profile.twitterUrl && (
                  <a
                    href={profile.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-fg hover:text-accent transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span>Twitter/X</span>
                    <ExternalLink className="w-3 h-3 text-muted" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-field hover:bg-hover text-fg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted" />}
              <span>{copied ? "Link Copied!" : "Copy Profile Link"}</span>
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `Check out my developer workspace on Castov: ${profile.fullName} (@${profile.username})`
              )}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : `https://castov.com/user/${profile.username}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-9 w-9 rounded-xl border border-line bg-field hover:bg-hover text-muted hover:text-fg transition-all"
              aria-label="Share on X / Twitter"
              title="Share on X / Twitter"
            >
              <Share2 className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. DEVELOPER DAILY STACK (Pinned Tools Showcase) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-fg">
                {profile.fullName}&apos;s Favorite Stack
              </h2>
              <p className="text-xs text-muted">
                Hand-picked developer utilities curated by @{profile.username}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-field border border-line text-xs font-mono text-muted">
            {profile.pinnedTools.length} Utilities
          </span>
        </div>

        {profile.pinnedTools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {profile.pinnedTools.map((slug) => {
              const tool = getTool(slug);
              if (!tool) return null;
              return (
                <Link
                  key={slug}
                  href={`/${slug}`}
                  className="group rounded-2xl border border-line bg-card p-4 hover:border-accent/40 hover:bg-hover/60 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted group-hover:text-accent transition-colors font-semibold">
                        /{slug}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-muted group-hover:text-fg transition-colors" />
                    </div>
                    <h3 className="text-sm font-bold text-fg group-hover:text-accent transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                      {tool.cardDescription || tool.intro}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-line/60 mt-3 flex items-center justify-between text-[11px] font-medium text-accent">
                    <span>Open Utility</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-card p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-fg">No pinned tools shared yet</p>
            <p className="text-xs text-muted">
              @{profile.username} hasn&apos;t pinned any favorite tools to their public showcase.
            </p>
          </div>
        )}
      </div>

      {/* 3. CLOUD MCP STACK & AI AGENT CAPABILITIES */}
      <div className="rounded-3xl border border-line bg-card p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-fg">AI Agent &amp; MCP Integration</h3>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                v1.5.0
              </span>
            </div>
            <p className="text-xs text-muted">
              Connect this developer&apos;s workspace tools directly to Cursor, Windsurf, and Claude via Castov MCP.
            </p>
          </div>
        </div>

        <div className="bg-field/70 rounded-xl p-3 border border-line font-mono text-xs flex items-center justify-between">
          <span className="text-muted truncate select-all">
            castov mcp --user {profile.username}
          </span>
          <Link
            href="/mcp"
            className="text-xs font-semibold text-accent hover:underline shrink-0 ml-2"
          >
            Learn More →
          </Link>
        </div>
      </div>

      {/* 4. VIRAL FOOTER BANNER FOR NEW DEVELOPERS */}
      <div className="rounded-3xl border-2 border-accent/20 bg-accent/5 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h3 className="text-base font-bold text-fg">Want your own Castov Developer Profile?</h3>
          <p className="text-xs text-muted mt-1">
            Claim your custom <span className="font-mono text-accent">castov.com/user/yourname</span> link, pin your favorite tools, and sync across devices.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hover transition-colors shadow-sm shrink-0"
        >
          <span>Claim Your Profile</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
