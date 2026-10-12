"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
  title?: string;
  url?: string;
  className?: string;
}

export function ShareButton({ title, url, className = "" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    const shareTitle = title || (typeof document !== "undefined" ? document.title : "Castov Developer Tool");

    // Attempt navigator.share on mobile if supported
    if (typeof navigator !== "undefined" && navigator.share && window.innerWidth < 768) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard if user dismissed or share failed
      }
    }

    // Direct clipboard copy
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback prompt if clipboard API blocked
      prompt("Copy link:", shareUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
        copied
          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
          : "bg-field border-line text-muted hover:text-fg hover:bg-hover active:scale-95"
      } ${className}`}
      aria-label="Share tool link"
      title={copied ? "Link copied to clipboard!" : "Share this tool"}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400 animate-in fade-in zoom-in-50 duration-200" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </>
      )}
    </button>
  );
}
