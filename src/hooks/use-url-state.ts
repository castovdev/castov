"use client";

import { useState, useCallback } from "react";

/**
 * A hook that syncs a string state with the URL hash.
 * This is zero-server friendly because URL hashes (#) are never sent to the server.
 */
export function useUrlState(key: string, defaultValue: string): [string, (val: string) => void, () => void] {
  // Initialize from hash if available
  const [value, setValue] = useState<string>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const params = new URLSearchParams(hash);
        const urlVal = params.get(key);
        if (urlVal) {
          // Attempt to decode base64 to avoid URL escaping nightmares for complex code
          return decodeURIComponent(escape(atob(urlVal)));
        }
      }
    } catch {
      // ignore
    }
    return defaultValue;
  });

  // Update state normally
  const setUrlState = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  // Function to actually "Share" / push to URL (we don't do this on every keystroke to avoid history bloat)
  const generateShareLink = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      
      // Encode as base64 to handle JSON/Regex strings cleanly in the URL
      const encoded = btoa(unescape(encodeURIComponent(value)));
      params.set(key, encoded);
      
      const newUrl = `${window.location.pathname}${window.location.search}#${params.toString()}`;
      window.history.pushState(null, "", newUrl);
      
      // Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    } catch (e) {
      console.error("Failed to generate share link", e);
    }
  }, [value, key]);

  return [value, setUrlState, generateShareLink];
}
