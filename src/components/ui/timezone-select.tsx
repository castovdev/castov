"use client";

import { useId, useMemo, useState } from "react";
import { COMMON_TIME_ZONES, LOCAL_ZONE, zoneLabel, zoneLongName } from "@/lib/time";
import { useAllTimeZones, useLocalTimeZone } from "@/lib/use-time-zones";

const COMMON = new Set<string>(COMMON_TIME_ZONES);
const MAX_MATCHES = 60;

interface Entry {
  zone: string;
  city: string;
  region: string;
  search: string;
}

function toEntry(zone: string): Entry {
  const city = zoneLabel(zone);
  const region = zone === "UTC" ? "" : zone.split("/").slice(0, -1).join("/").replace(/_/g, " ");
  return { zone, city, region, search: `${city} ${zone} ${zoneLongName(zone)}`.toLowerCase() };
}

function optionLabel(e: Entry): string {
  return e.zone === "UTC" ? "UTC" : `${e.city} \u2014 ${e.zone}`;
}

/**
 * A time zone <select> with a search box above it that filters the option list by city name,
 * region or IANA identifier (e.g. typing "new" surfaces New York, Newfoundland and New Delhi).
 * The control itself stays a native <select> for full keyboard and mobile support.
 */
export function TimezoneSelect({
  id,
  label,
  value,
  onChange,
  includeLocal = false,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Adds a "Local time" option (value "local") that resolves to the browser's zone. */
  includeLocal?: boolean;
  hint?: string;
}) {
  const searchId = useId();
  const localZone = useLocalTimeZone();
  const allZones = useAllTimeZones();
  const [query, setQuery] = useState("");

  const commonEntries = useMemo(() => COMMON_TIME_ZONES.map(toEntry), []);
  const otherEntries = useMemo(() => allZones.filter((z) => !COMMON.has(z)).map(toEntry), [allZones]);

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return null;
    const all = [...commonEntries, ...otherEntries];
    return all.filter((e) => e.search.includes(q)).slice(0, MAX_MATCHES);
  }, [q, commonEntries, otherEntries]);

  return (
    <div>
      <label htmlFor={searchId} className="field-label">
        Search time zones for {label.toLowerCase()}
      </label>
      <input
        id={searchId}
        className="input mb-2"
        type="text"
        role="searchbox"
        placeholder="Search by city or region… e.g. New"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setQuery("");
        }}
        autoComplete="off"
      />
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select
        id={id}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
      >
        {includeLocal ? <option value={LOCAL_ZONE}>Local time ({localZone || "this device"})</option> : null}
        {matches ? (
          matches.length > 0 ? (
            <optgroup label={`Matching "${query.trim()}" (${matches.length}${matches.length === MAX_MATCHES ? "+" : ""})`}>
              {matches.map((e) => (
                <option key={e.zone} value={e.zone}>
                  {optionLabel(e)}
                </option>
              ))}
            </optgroup>
          ) : (
            <option value={value} disabled>
              No time zone matches &quot;{query.trim()}&quot;
            </option>
          )
        ) : (
          <>
            <optgroup label="Popular time zones">
              {commonEntries.map((e) => (
                <option key={e.zone} value={e.zone}>
                  {optionLabel(e)}
                </option>
              ))}
            </optgroup>
            {otherEntries.length > 0 ? (
              <optgroup label="All time zones">
                {otherEntries.map((e) => (
                  <option key={e.zone} value={e.zone}>
                    {optionLabel(e)}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </>
        )}
      </select>
      {hint ? (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
