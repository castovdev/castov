"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ArrowUp, Copy, Check, Mail, ShieldCheck } from "lucide-react";
import { useUserSession } from "@/hooks/use-user-session";

export function FooterLiveTicker() {
  const [time, setTime] = useState<{ utc: string; epoch: number } | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime({
        utc: now.toISOString().slice(11, 19) + " UTC",
        epoch: Math.floor(now.getTime() / 1000),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-field/90 border border-line text-xs font-mono text-fg shadow-xs transition-colors hover:border-accent/40"
      aria-label="Live UTC time and Unix epoch timestamp"
    >
      <Clock className="w-3.5 h-3.5 text-accent shrink-0 animate-pulse" />
      <span className="font-semibold tracking-tight">{time ? time.utc : "00:00:00 UTC"}</span>
      <span className="text-muted/40">•</span>
      <span className="text-muted font-normal">EPOCH</span>
      <span className="text-accent font-bold tracking-tight">{time ? time.epoch : "--------"}</span>
    </div>
  );
}

export function FooterCliCopy() {
  const [copied, setCopied] = useState(false);
  const command = "npm i -g castov";

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-field hover:bg-hover border border-line hover:border-accent/40 text-xs font-mono transition-all cursor-pointer shadow-xs active:scale-95"
      aria-label="Copy CLI installation command"
      title="Click to copy npm install command"
    >
      <span className="text-accent select-none font-bold">$</span>
      <span className="text-fg font-medium">{command}</span>
      <span className="text-muted group-hover:text-fg transition-colors ml-1">
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-500 animate-in fade-in" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </span>
      {copied && (
        <span className="text-[10px] text-emerald-500 font-sans font-semibold">Copied!</span>
      )}
    </button>
  );
}

export function FooterNewsletter() {
  const { user } = useUserSession();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const emailToCheck = user?.email || "";
    if (emailToCheck && localStorage.getItem(`castov_subscribed_${emailToCheck}`)) {
      queueMicrotask(() => {
        setSubscribed(true);
      });
    }
  }, [user]);

  const handleSubscribe = async (targetEmail: string) => {
    if (!targetEmail.trim() || !targetEmail.includes("@")) return;
    setLoading(true);

    try {
      await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, source: user ? "account_1click" : "footer_form" }),
      });

      if (typeof window !== "undefined") {
        localStorage.setItem(`castov_subscribed_${targetEmail}`, "true");
      }
      setSubscribed(true);
      setEmail("");
    } catch {
      // Fallback local acknowledgment
      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubscribe(email);
  };

  // State 1: User is already subscribed
  if (subscribed) {
    return (
      <div className="w-full max-w-sm rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Subscribed to developer releases ✓</span>
        </div>
        <Link
          href="/account"
          className="text-[11px] font-mono text-muted hover:text-fg underline shrink-0"
        >
          Preferences
        </Link>
      </div>
    );
  }

  // State 2: User is logged in but not yet subscribed -> 1-Click Subscribe
  if (user && user.email) {
    return (
      <div className="w-full max-w-sm space-y-1.5">
        <button
          type="button"
          onClick={() => handleSubscribe(user.email!)}
          disabled={loading}
          className="btn bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 w-full shadow-sm transition-all"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>{loading ? "Subscribing..." : `Subscribe with ${user.email}`}</span>
        </button>
        <p className="text-[10px] text-muted text-center">
          1-Click opt-in. No spam, only major CLI releases &amp; tools.
        </p>
      </div>
    );
  }

  // State 3: Visitor -> Regular Email Input
  return (
    <div className="w-full max-w-sm">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <label htmlFor="footer-newsletter-input" className="sr-only">
          Email address for developer updates
        </label>
        <div className="relative w-full">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            id="footer-newsletter-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="developer@domain.com"
            aria-label="Your email address for developer updates"
            required
            className="w-full pl-9 pr-24 py-2 text-xs rounded-xl bg-field border border-line text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all shadow-xs"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          aria-label="Subscribe to developer updates"
          className="absolute right-1.5 px-3 py-1 rounded-lg bg-accent text-accent-fg hover:opacity-90 font-semibold text-xs transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
        >
          {loading ? "..." : "Subscribe"}
        </button>
      </form>
    </div>
  );
}

export function BackToTopButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-field hover:bg-hover border border-line hover:border-accent/40 text-xs font-medium text-muted hover:text-fg transition-all cursor-pointer active:scale-95 shadow-xs"
      aria-label="Back to top of page"
    >
      <span>Back to top</span>
      <ArrowUp className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
    </button>
  );
}
