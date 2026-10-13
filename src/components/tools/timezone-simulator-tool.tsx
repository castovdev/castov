"use client";

import { useState, useEffect } from "react";
import { PlusIcon, XIcon, GlobeIcon, SunIcon, MoonIcon } from "lucide-react";

export function TimezoneSimulatorTool() {
  const [utcOffsetHours, setUtcOffsetHours] = useState(12); // Slider value 0-24
  const [timezones, setTimezones] = useState<string[]>(["UTC", "America/New_York", "Asia/Tokyo"]);
  const [newTz, setNewTz] = useState("");
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0); // Start of day UTC
  now.setUTCMilliseconds(utcOffsetHours * 3600000);
  const currentTime = now;

  const addTimezone = () => {
    if (newTz && !timezones.includes(newTz)) {
      try {
        // test validity
        new Intl.DateTimeFormat('en-US', { timeZone: newTz });
        setTimezones([...timezones, newTz]);
        setNewTz("");
      } catch {
        alert("Invalid timezone name. Try format like 'Europe/London'.");
      }
    }
  };

  const removeTimezone = (tz: string) => {
    setTimezones(timezones.filter(t => t !== tz));
  };

  const renderTimezoneCard = (tz: string) => {
    try {
      const formatterTime = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
      const formatterDate = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' });
      
      const timeParts = formatterTime.formatToParts(currentTime);
      const hourStr = timeParts.find(p => p.type === 'hour')?.value || '00';
      const hour = parseInt(hourStr, 10);
      
      const isNight = hour < 6 || hour >= 18;

      return (
        <div key={tz} className={`relative overflow-hidden rounded-xl border p-4 transition-colors duration-300 ${isNight ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-blue-50 border-blue-200 text-blue-950'}`}>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <span className="font-semibold text-sm opacity-80">{tz}</span>
            <button onClick={() => removeTimezone(tz)} aria-label={`Remove ${tz}`} className="opacity-50 hover:opacity-100">
              <XIcon size={14} />
            </button>
          </div>
          
          <div className="flex items-center gap-3 relative z-10">
            {isNight ? <MoonIcon size={24} className="text-indigo-400" /> : <SunIcon size={24} className="text-amber-500" />}
            <div>
              <div className="text-3xl font-bold tracking-tight">
                {formatterTime.format(currentTime)}
              </div>
              <div className="text-xs opacity-75 mt-1">
                {formatterDate.format(currentTime)}
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none ${isNight ? 'bg-indigo-500' : 'bg-amber-400'}`} />
        </div>
      );
    } catch {
      return null;
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
        <label className="flex items-center justify-between mb-4">
          <span className="font-semibold text-fg">Timeline (UTC Time)</span>
          <span className="font-mono bg-field px-2 py-1 rounded text-sm text-muted">
            {Math.floor(utcOffsetHours).toString().padStart(2, '0')}:
            {((utcOffsetHours % 1) * 60).toString().padStart(2, '0')} UTC
          </span>
        </label>
        <input 
          type="range" 
          aria-label="Timeline UTC Time"
          min="0" max="23.99" step="0.25" 
          value={utcOffsetHours} 
          onChange={(e) => setUtcOffsetHours(parseFloat(e.target.value))}
          className="w-full h-2 bg-line rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-muted mt-2">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-fg flex items-center gap-2">
            <GlobeIcon size={18} className="text-primary" /> Tracking Timezones
          </h2>
          <div className="flex gap-2">
            <input 
              type="text" 
              aria-label="Timezone name"
              placeholder="e.g. Europe/Paris" 
              value={newTz}
              onChange={e => setNewTz(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTimezone()}
              className="bg-field border border-line rounded-lg px-3 py-1.5 text-sm w-48"
            />
            <button onClick={addTimezone} aria-label="Add timezone" className="btn btn-primary btn-sm px-3">
              <PlusIcon size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {timezones.map(renderTimezoneCard)}
        </div>
      </div>
    </div>
  );
}
