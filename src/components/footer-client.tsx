"use client";

import { useEffect, useState } from "react";
import { Clock, ArrowUp, Copy, Check, Mail, Sparkles } from "lucide-react";

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
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes("@")) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

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
          aria-label="Subscribe to developer updates"
          className="absolute right-1.5 px-3 py-1 rounded-lg bg-accent text-accent-fg hover:opacity-90 font-semibold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
        >
          {subscribed ? "Joined!" : "Subscribe"}
        </button>
      </form>
      {subscribed && (
        <p className="mt-1.5 text-[11px] text-emerald-500 font-medium flex items-center gap-1 animate-in fade-in">
          <Sparkles className="w-3 h-3" /> You&apos;re in! We only send meaningful developer releases.
        </p>
      )}
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
