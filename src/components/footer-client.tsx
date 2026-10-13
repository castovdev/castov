"use client";

import { useEffect, useState } from "react";
import { Clock, ArrowUp } from "lucide-react";

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
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-field/90 border border-line text-xs font-mono text-fg shadow-xs">
      <Clock className="w-3.5 h-3.5 text-accent shrink-0 animate-pulse" />
      <span className="font-semibold">{time ? time.utc : "00:00:00 UTC"}</span>
      <span className="text-muted/50">•</span>
      <span className="text-muted">EPOCH:</span>
      <span className="text-accent font-bold">{time ? time.epoch : "--------"}</span>
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
      className="inline-flex items-center gap-1.5 hover:text-fg transition-colors cursor-pointer text-muted hover:underline"
      aria-label="Back to top of page"
    >
      <span>Back to top</span>
      <ArrowUp className="w-3.5 h-3.5" />
    </button>
  );
}
