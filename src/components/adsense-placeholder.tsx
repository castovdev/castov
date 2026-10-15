import { ADS } from "@/lib/site";

/**
 * AdSense Placeholder box.
 * Returns null if no AdSense client ID is configured in environment variables,
 * preventing empty or broken placeholder boxes in production.
 */
export function AdSensePlaceholder() {
  if (!ADS.client) return null;

  return (
    <div className="w-full min-h-[400px] bg-card border border-line rounded-xl flex flex-col items-center justify-center text-muted text-sm shadow-sm opacity-80 overflow-hidden relative group">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]" />
      <span className="relative z-10 font-mono text-xs mb-2">Advertisement</span>
      <span className="relative z-10 text-center max-w-[200px] leading-relaxed">
        AdSense space reserved.<br />Sticky placement for high RPM.
      </span>
    </div>
  );
}
