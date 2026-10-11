"use client";

import { useState, useCallback } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { RefreshCw, Check, Copy } from "lucide-react";

type UuidVersion = "v4" | "v7";

function generateUuidV4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // v4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generateUuidV7(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const now = Date.now();

  // 48-bit timestamp in milliseconds
  bytes[0] = Math.floor(now / 0x10000000000) & 0xff;
  bytes[1] = Math.floor(now / 0x100000000) & 0xff;
  bytes[2] = (now >>> 24) & 0xff;
  bytes[3] = (now >>> 16) & 0xff;
  bytes[4] = (now >>> 8) & 0xff;
  bytes[5] = now & 0xff;

  // Version 7: high 4 bits = 0111
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  // Variant: high 2 bits = 10
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function UuidGeneratorTool() {
  const [version, setVersion] = useState<UuidVersion>("v4");
  const [quantity, setQuantity] = useState<number>(5);
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [noHyphens, setNoHyphens] = useState<boolean>(false);

  const generateList = useCallback(
    (ver: UuidVersion, count: number, isUpper: boolean, withoutHyphens: boolean): string[] => {
      const items: string[] = [];
      const clampedCount = Math.max(1, Math.min(100, count));
      for (let i = 0; i < clampedCount; i++) {
        let id = ver === "v7" ? generateUuidV7() : generateUuidV4();
        if (withoutHyphens) id = id.replace(/-/g, "");
        if (isUpper) id = id.toUpperCase();
        items.push(id);
      }
      return items;
    },
    []
  );

  const [uuids, setUuids] = useState<string[]>(() => generateList("v4", 5, false, false));

  const handleGenerate = (
    targetVer = version,
    targetCount = quantity,
    targetUpper = uppercase,
    targetNoHyphens = noHyphens
  ) => {
    setUuids(generateList(targetVer, targetCount, targetUpper, targetNoHyphens));
  };

  const handleVersionChange = (newVer: UuidVersion) => {
    setVersion(newVer);
    handleGenerate(newVer, quantity, uppercase, noHyphens);
  };

  const handleQuantityChange = (newCount: number) => {
    const clamped = Math.max(1, Math.min(100, newCount));
    setQuantity(clamped);
    handleGenerate(version, clamped, uppercase, noHyphens);
  };

  const handleUppercaseChange = (checked: boolean) => {
    setUppercase(checked);
    handleGenerate(version, quantity, checked, noHyphens);
  };

  const handleNoHyphensChange = (checked: boolean) => {
    setNoHyphens(checked);
    handleGenerate(version, quantity, uppercase, checked);
  };

  const allUuidsText = uuids.join("\n");

  return (
    <div className="space-y-6">
      {/* Controls Card */}
      <div className="p-4 bg-card border border-line rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Version Tabs */}
            <div className="inline-flex rounded-lg border border-line bg-field p-0.5" role="group" aria-label="UUID version">
              <button
                type="button"
                onClick={() => handleVersionChange("v4")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  version === "v4" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-fg"
                }`}
              >
                UUID v4 (Random)
              </button>
              <button
                type="button"
                onClick={() => handleVersionChange("v7")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  version === "v7" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-fg"
                }`}
              >
                UUID v7 (Time-Ordered)
              </button>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-2">
              <label htmlFor="uuid-qty-input" className="text-sm text-muted font-medium">Quantity:</label>
              <input
                id="uuid-qty-input"
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10) || 1)}
                className="w-16 px-2.5 py-1.5 text-sm bg-field border border-line rounded-lg text-fg focus:outline-none focus:ring-2 focus:ring-accent text-center font-mono"
              />
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5">
            {[1, 5, 10, 25, 50, 100].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleQuantityChange(num)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  quantity === num
                    ? "bg-accent text-white border-accent"
                    : "border-line bg-field text-muted hover:text-fg"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Format Options & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-line">
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-fg cursor-pointer select-none">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => handleUppercaseChange(e.target.checked)}
                className="rounded border-line text-accent focus:ring-accent"
              />
              <span>Uppercase (A-F)</span>
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-fg cursor-pointer select-none">
              <input
                type="checkbox"
                checked={noHyphens}
                onChange={(e) => handleNoHyphensChange(e.target.checked)}
                className="rounded border-line text-accent focus:ring-accent"
              />
              <span>No Hyphens (32 chars)</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton value={allUuidsText} label={`all ${uuids.length} UUIDs`}>
              Copy All ({uuids.length})
            </CopyButton>
            <button
              type="button"
              onClick={() => handleGenerate()}
              className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Generate New
            </button>
          </div>
        </div>
      </div>

      {/* Generated List */}
      <div className="p-4 bg-card border border-line rounded-xl space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <span className="text-sm font-semibold text-fg">
            Generated {version === "v7" ? "UUIDv7" : "UUIDv4"} Identifiers ({uuids.length})
          </span>
          <span className="text-xs text-muted font-mono">
            {version === "v7" ? "RFC 9562 timestamp-sortable" : "RFC 4122 cryptographically secure"}
          </span>
        </div>

        <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
          {uuids.map((uuid, idx) => (
            <div
              key={`${uuid}-${idx}`}
              className="flex items-center justify-between gap-3 p-2.5 bg-field hover:bg-hover rounded-lg border border-line/50 transition-colors group"
            >
              <span className="text-xs text-muted font-mono w-6 text-right select-none">{idx + 1}</span>
              <span className="font-mono text-sm text-fg font-medium flex-1 select-all break-all">{uuid}</span>
              <CopyButton
                value={uuid}
                label={`UUID ${idx + 1}`}
                className="btn btn-secondary btn-sm opacity-80 group-hover:opacity-100"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
