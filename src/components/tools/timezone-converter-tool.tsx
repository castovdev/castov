"use client";

import { useId, useState, type FormEvent } from "react";
import { useDeveloperPreferences } from "@/hooks/use-developer-preferences";
import {
  DEFAULT_COMPARE_ZONES,
  formatCompact,
  formatLong,
  formatOffsetLabel,
  getOffsetMs,
  getZonedParts,
  humanDuration,
  pad,
  parseDateInput,
  parseTimeInput,
  wallClockToInstant,
  zoneAbbreviation,
  zoneLabel,
  type ResultRowData,
} from "@/lib/time";
import { ResultList } from "../ui/result-list";
import { TimezoneSelect } from "../ui/timezone-select";

interface Converted {
  ms: number;
  from: string;
  to: string;
  input: string;
  ambiguous: boolean;
}

const DEFAULT_TIME = "12:00:00";

function relation(ms: number, from: string, to: string): string {
  const diff = getOffsetMs(ms, to) - getOffsetMs(ms, from);
  if (diff === 0) return `${zoneLabel(to)} and ${zoneLabel(from)} have the same UTC offset at this moment.`;
  return `${zoneLabel(to)} is ${humanDuration(Math.abs(diff))} ${diff > 0 ? "ahead of" : "behind"} ${zoneLabel(from)} at this moment.`;
}

export function TimezoneConverterTool() {
  const uid = useId();
  const prefs = useDeveloperPreferences();
  const [selectedFrom, setSelectedFrom] = useState<string | null>(null);
  const from = selectedFrom ?? (prefs.timezone || "UTC");
  const setFrom = (val: string) => setSelectedFrom(val);
  const [to, setTo] = useState("America/New_York");
  const [date, setDate] = useState("");
  const [time, setTime] = useState(DEFAULT_TIME);
  const [error, setError] = useState<string | null>(null);
  const [converted, setConverted] = useState<Converted | null>(null);
  const [compare, setCompare] = useState<string[]>(DEFAULT_COMPARE_ZONES);
  const [addZone, setAddZone] = useState("Asia/Kolkata");

  function run(d: string, t: string, f: string, tz: string) {
    const pd = parseDateInput(d);
    if (!pd.ok) return fail(pd.error);
    const pt = parseTimeInput(t);
    if (!pt.ok) return fail(pt.error);
    const r = wallClockToInstant({ ...pd.value, ...pt.value }, f);
    if (!r.ok) return fail(r.error);
    setError(null);
    setConverted({ ms: r.value.ms, from: f, to: tz, input: `${d} ${t}`, ambiguous: r.value.ambiguous });
  }

  function fail(message: string) {
    setError(message);
    setConverted(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    run(date, time, from, to);
  }

  function handleNow() {
    const p = getZonedParts(Date.now(), from);
    const d = `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}`;
    const t = `${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
    setDate(d);
    setTime(t);
    run(d, t, from, to);
  }

  function handleSwap() {
    const newFrom = to;
    const newTo = from;
    setFrom(newFrom);
    setTo(newTo);
    if (converted) {
      // Keep the same moment: show it as a clock reading in the new "From" zone.
      const p = getZonedParts(converted.ms, newFrom);
      const d = `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}`;
      const t = `${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
      setDate(d);
      setTime(t);
      run(d, t, newFrom, newTo);
    }
  }

  function handleClear() {
    setDate("");
    setTime(DEFAULT_TIME);
    setFrom("UTC");
    setTo("America/New_York");
    setError(null);
    setConverted(null);
  }

  const errorId = `${uid}-error`;
  const hasError = error !== null;

  let rows: ResultRowData[] = [];
  if (converted) {
    const { ms, to: tz } = converted;
    rows = [
      { id: "long", label: `Time in ${zoneLabel(tz)}`, value: formatLong(ms, tz) },
      { id: "compact", label: "Date and time (24-hour)", value: formatCompact(ms, tz) },
      {
        id: "offset",
        label: "UTC offset",
        value: `${formatOffsetLabel(getOffsetMs(ms, tz))} (${zoneAbbreviation(ms, tz)})`,
      },
      { id: "relation", label: "Difference between zones", value: relation(ms, converted.from, tz) },
      { id: "unix", label: "Unix timestamp (seconds)", value: String(Math.floor(ms / 1000)) },
    ];
  }

  return (
    <div>
      <form onSubmit={handleSubmit} noValidate aria-label="Time zone converter">
        <div className="grid gap-4 sm:grid-cols-2">
          <TimezoneSelect id={`${uid}-from`} label="From" value={from} onChange={setFrom} />
          <TimezoneSelect id={`${uid}-to`} label="To" value={to} onChange={setTo} />
          <div>
            <label htmlFor={`${uid}-date`} className="field-label">
              Date
            </label>
            <input
              id={`${uid}-date`}
              className="input input-mono"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-invalid={hasError}
              aria-describedby={hasError ? errorId : undefined}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-time`} className="field-label">
              Time
            </label>
            <input
              id={`${uid}-time`}
              className="input input-mono"
              type="time"
              step={1}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-invalid={hasError}
              aria-describedby={hasError ? errorId : undefined}
            />
          </div>
        </div>

        {hasError ? (
          <p id={errorId} role="alert" className="error-text">
            {error}
          </p>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          <button type="submit" className="btn btn-primary col-span-2 sm:col-auto">
            Convert
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleNow}>
            Use current time
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleSwap}>
            Swap zones
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleClear}>
            Clear
          </button>
        </div>
      </form>

      <div aria-live="polite" className="mt-6">
        {converted ? (
          <>
            <h2 className="mb-1 text-lg font-semibold">Result</h2>
            <p className="field-hint mb-3 mt-0">
              {converted.input} in {converted.from}.
            </p>
            {converted.ambiguous ? (
              <p className="field-hint mb-3 mt-0">
                That clock time happens twice because clocks go back. The earlier occurrence was used.
              </p>
            ) : null}
            <ResultList rows={rows} />
          </>
        ) : null}
      </div>

      {converted ? (
        <section className="mt-8" aria-labelledby={`${uid}-compare`}>
          <h2 id={`${uid}-compare`} className="mb-3 text-lg font-semibold">
            Compare time zones
          </h2>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="data-table">
              <caption className="sr-only">The same moment in several time zones</caption>
              <thead>
                <tr>
                  <th scope="col">Time zone</th>
                  <th scope="col">Local time</th>
                  <th scope="col">Offset</th>
                  <th scope="col">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {compare.map((z) => (
                  <tr key={z}>
                    <th scope="row" className="font-medium">
                      {zoneLabel(z)}
                      <span className="block text-xs font-normal text-muted">{z}</span>
                    </th>
                    <td className="num">{formatCompact(converted.ms, z)}</td>
                    <td className="num">
                      {formatOffsetLabel(getOffsetMs(converted.ms, z))}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setCompare((list) => list.filter((x) => x !== z))}
                        aria-label={`Remove ${zoneLabel(z)}`}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_auto]">
            <TimezoneSelect id={`${uid}-add`} label="Add a time zone" value={addZone} onChange={setAddZone} />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCompare((list) => (list.includes(addZone) ? list : [...list, addZone]))}
            >
              Add zone
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
