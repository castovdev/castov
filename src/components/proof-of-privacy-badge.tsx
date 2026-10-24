"use client";

import { useState, useRef, useEffect } from "react";
import { ShieldCheck, Info, X } from "lucide-react";

export function ProofOfPrivacyBadge() {
  const [showDetails, setShowDetails] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDetails) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowDetails(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDetails]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 transition-all cursor-pointer shadow-xs"
        title="Verified Client-Side Privacy: Data never leaves your device"
        aria-expanded={showDetails}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>100% Client-Side • Works Offline</span>
        <Info className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {showDetails && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-72 sm:w-80 rounded-xl border border-line bg-card/95 backdrop-blur-xl p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-line/60">
            <div className="flex items-center gap-1.5 font-bold text-xs text-fg">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Zero-Data Logging Guarantee</span>
            </div>
            <button
              type="button"
              onClick={() => setShowDetails(false)}
              className="text-muted hover:text-fg p-0.5"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2.5 space-y-2 text-xs text-muted leading-relaxed">
            <p>
              Your inputs, keys, and transformed outputs are processed <strong className="text-fg">100% locally in browser memory</strong> via WebCrypto and client execution.
            </p>
            <ul className="space-y-1 font-mono text-[11px] text-fg/80 pt-1 border-t border-line/40">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500">✓</span> No server-side payload logging
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500">✓</span> Functional in Airplane / Offline mode
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500">✓</span> Certified zero third-party telemetry
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
