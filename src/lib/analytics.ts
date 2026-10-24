/**
 * Privacy-respecting client event tracking helper for Castov.
 * Dispatches a DOM CustomEvent('castov_analytics') and safely forwards
 * to internal analytics API, Vercel Analytics, or Plausible if available.
 */
export function trackEvent(name: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    const event = new CustomEvent("castov_analytics", { detail: { name, ...props } });
    window.dispatchEvent(event);

    // Forward to internal analytics endpoint
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, props }),
      keepalive: true,
    }).catch(() => {
      // Ignore background analytics network errors
    });

    const win = window as Window & {
      va?: (type: string, data: Record<string, unknown>) => void;
      plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
    };

    if (typeof win.va === "function") {
      win.va("event", { name, ...props });
    }
    if (typeof win.plausible === "function") {
      win.plausible(name, { props });
    }
  } catch {
    // Ignore tracking failures gracefully
  }
}
