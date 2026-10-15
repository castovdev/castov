"use client";

import { useState, useEffect } from "react";
import type { TimezoneNode } from "@/lib/timezone-pairs-registry";
import { Clock, ArrowRightLeft, Copy, Check, Calendar, Code2 } from "lucide-react";
import Link from "next/link";

interface Props {
  from: TimezoneNode;
  to: TimezoneNode;
  reverseSlug?: string;
}

function getHourInZone(baseDate: Date, iana: string): { time12: string; time24: string; hourNum: number; dateStr: string } {
  try {
    const time12 = new Intl.DateTimeFormat("en-US", {
      timeZone: iana,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(baseDate);

    const time24 = new Intl.DateTimeFormat("en-GB", {
      timeZone: iana,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(baseDate);

    const hourStr = new Intl.DateTimeFormat("en-US", {
      timeZone: iana,
      hour: "numeric",
      hour12: false,
    }).format(baseDate);

    const dateStr = new Intl.DateTimeFormat("en-US", {
      timeZone: iana,
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(baseDate);

    const hourNum = parseInt(hourStr, 10) % 24;
    return { time12, time24, hourNum, dateStr };
  } catch {
    return { time12: "12:00 PM", time24: "12:00", hourNum: 12, dateStr: "Today" };
  }
}

function getPeriodBadge(hour: number) {
  if (hour >= 9 && hour <= 17) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Work Hours</span>;
  }
  if ((hour >= 7 && hour < 9) || (hour > 17 && hour <= 22)) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Awake / Flex</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-500/10 text-muted border border-line">Sleeping</span>;
}

export function TimezonePairConverterWidget({ from, to, reverseSlug }: Props) {
  const [selectedHour, setSelectedHour] = useState<number>(9);
  const [now, setNow] = useState<Date>(() => new Date("2026-10-16T12:00:00Z"));
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const liveFrom = getHourInZone(now, from.iana);
  const liveTo = getHourInZone(now, to.iana);

  // Build 24-hour reference rows anchored to today in `from` zone
  const rows = Array.from({ length: 24 }, (_, h) => {
    // Approximate UTC anchor so that `from` hour iterates cleanly 0..23
    const baseUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, 0, 0));
    const f = getHourInZone(baseUtc, from.iana);
    const t = getHourInZone(baseUtc, to.iana);
    return { utcH: h, f, t };
  }).sort((a, b) => a.f.hourNum - b.f.hourNum);

  const activeRow = rows.find((r) => r.f.hourNum === selectedHour) || rows[0];

  const jsSnippet = `// Convert current time from ${from.code} (${from.iana}) to ${to.code} (${to.iana})
const now = new Date();
const in${to.code} = new Intl.DateTimeFormat('en-US', {
  timeZone: '${to.iana}',
  dateStyle: 'medium',
  timeStyle: 'long'
}).format(now);
console.log(in${to.code});`;

  const pySnippet = `# Python 3.9+ using standard zoneinfo
from datetime import datetime
from zoneinfo import ZoneInfo

dt_${from.code.toLowerCase()} = datetime.now(ZoneInfo("${from.iana}"))
dt_${to.code.toLowerCase()} = dt_${from.code.toLowerCase()}.astimezone(ZoneInfo("${to.iana}"))
print(f"${from.code}: {dt_${from.code.toLowerCase()}.strftime('%Y-%m-%d %H:%M %Z')}")
print(f"${to.code}: {dt_${to.code.toLowerCase()}.strftime('%Y-%m-%d %H:%M %Z')}")`;

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Live Clocks Banner */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center bg-card border border-line rounded-2xl p-6 shadow-sm">
        <div className="md:col-span-5 p-4 rounded-xl bg-field/60 border border-line">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">{from.code} — {from.city}</span>
            <span className="text-xs font-mono text-muted">{from.iana}</span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-fg tracking-tight my-1">
            {liveFrom.time12}
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{liveFrom.dateStr} ({liveFrom.time24})</span>
            {getPeriodBadge(liveFrom.hourNum)}
          </div>
        </div>

        <div className="md:col-span-1 flex justify-center">
          {reverseSlug ? (
            <Link
              href={`/time/${reverseSlug}`}
              className="p-3 rounded-full bg-field hover:bg-hover border border-line text-fg transition-colors"
              title={`Swap to ${to.code} to ${from.code}`}
              aria-label={`Swap to ${to.code} to ${from.code}`}
            >
              <ArrowRightLeft className="w-5 h-5" />
            </Link>
          ) : (
            <div className="p-3 rounded-full bg-field border border-line text-muted">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className="md:col-span-5 p-4 rounded-xl bg-field/60 border border-line">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{to.code} — {to.city}</span>
            <span className="text-xs font-mono text-muted">{to.iana}</span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-fg tracking-tight my-1">
            {liveTo.time12}
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{liveTo.dateStr} ({liveTo.time24})</span>
            {getPeriodBadge(liveTo.hourNum)}
          </div>
        </div>
      </div>

      {/* Interactive Hour Slider */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-bold text-fg flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            Interactive Hour Converter ({from.code} → {to.code})
          </h2>
          <span className="text-xs text-muted">Drag slider to test any hour</span>
        </div>

        <input
          type="range"
          min={0}
          max={23}
          value={selectedHour}
          onChange={(e) => setSelectedHour(Number(e.target.value))}
          aria-label={`Select hour in ${from.code}`}
          className="w-full accent-blue-600 cursor-pointer h-2 bg-field rounded-lg mb-6"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-field border border-line">
          <div>
            <div className="text-xs text-muted mb-1">When it is in {from.code} ({from.city}):</div>
            <div className="text-2xl font-bold font-mono text-fg">{activeRow.f.time12} <span className="text-sm font-normal text-muted">({activeRow.f.time24})</span></div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">It is in {to.code} ({to.city}):</div>
            <div className="text-2xl font-bold font-mono text-accent">{activeRow.t.time12} <span className="text-sm font-normal text-muted">({activeRow.t.time24})</span></div>
          </div>
        </div>
      </div>

      {/* 24-Hour Conversion Table */}
      <div className="bg-card border border-line rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-line flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-fg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              24-Hour {from.code} to {to.code} Time Conversion Table
            </h2>
            <p className="text-xs text-muted mt-1">
              Side-by-side hourly reference with business hours overlap indicators.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-field/70 border-b border-line text-xs uppercase text-muted">
                <th className="py-3 px-4 font-semibold">{from.code} ({from.city})</th>
                <th className="py-3 px-4 font-semibold">24h</th>
                <th className="py-3 px-4 font-semibold">{to.code} ({to.city})</th>
                <th className="py-3 px-4 font-semibold">24h</th>
                <th className="py-3 px-4 font-semibold">Status in {to.code}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r, idx) => {
                const isBothWork = r.f.hourNum >= 9 && r.f.hourNum <= 17 && r.t.hourNum >= 9 && r.t.hourNum <= 17;
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isBothWork ? "bg-emerald-500/5 hover:bg-emerald-500/10" : "hover:bg-hover/50"
                    }`}
                  >
                    <td className="py-2.5 px-4 font-mono font-semibold text-fg">{r.f.time12}</td>
                    <td className="py-2.5 px-4 font-mono text-muted text-xs">{r.f.time24}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-accent">{r.t.time12}</td>
                    <td className="py-2.5 px-4 font-mono text-muted text-xs">{r.t.time24}</td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        {getPeriodBadge(r.t.hourNum)}
                        {isBothWork && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">★ Best Meeting Overlap</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Developer Code Snippets */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-fg flex items-center gap-2">
          <Code2 className="w-5 h-5 text-accent" />
          Developer Code Snippets ({from.code} to {to.code})
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-line bg-field overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-line bg-card/50">
              <span className="text-xs font-semibold text-fg">JavaScript / TypeScript (Intl API)</span>
              <button
                type="button"
                onClick={() => copyCode(jsSnippet, "js")}
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg"
              >
                {copiedTab === "js" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedTab === "js" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-fg overflow-x-auto">{jsSnippet}</pre>
          </div>

          <div className="rounded-xl border border-line bg-field overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-line bg-card/50">
              <span className="text-xs font-semibold text-fg">Python 3.9+ (zoneinfo)</span>
              <button
                type="button"
                onClick={() => copyCode(pySnippet, "py")}
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg"
              >
                {copiedTab === "py" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedTab === "py" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-fg overflow-x-auto">{pySnippet}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
