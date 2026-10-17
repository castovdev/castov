"use client";

import { useState, useEffect, useRef } from "react";
import { History, Play, Pause, UploadCloudIcon, FastForward, Rewind, FileJson, AlertCircle, ArrowLeft } from "lucide-react";

interface HarEntry {
  id: string;
  relativeTime: number; // in seconds from start
  method: string;
  url: string;
  path: string;
  status: number;
  statusText: string;
  durationMs: number;
  mimeType: string;
  responseBody?: string;
}

const DEMO_ENTRIES: HarEntry[] = [
  { id: "1", relativeTime: 2, method: "GET", url: "https://api.example.com/api/user", path: "/api/user", status: 200, statusText: "OK", durationMs: 120, mimeType: "application/json", responseBody: '{"id": "usr_42", "name": "Alex Rivers", "tier": "pro"}' },
  { id: "2", relativeTime: 8, method: "GET", url: "https://api.example.com/api/projects", path: "/api/projects", status: 200, statusText: "OK", durationMs: 240, mimeType: "application/json", responseBody: '[{"id": 1, "name": "Castov CLI"}]' },
  { id: "3", relativeTime: 18, method: "POST", url: "https://api.example.com/api/payment", path: "/api/payment", status: 409, statusText: "Conflict", durationMs: 310, mimeType: "application/json", responseBody: '{"error": "Idempotency key collision"}' },
  { id: "4", relativeTime: 32, method: "GET", url: "https://api.example.com/api/notifications", path: "/api/notifications", status: 200, statusText: "OK", durationMs: 95, mimeType: "application/json", responseBody: '[]' },
  { id: "5", relativeTime: 46, method: "GET", url: "https://api.example.com/api/status", path: "/api/status", status: 500, statusText: "Internal Error", durationMs: 500, mimeType: "application/json", responseBody: '{"error": "Database timeout"}' },
];

export function ApiTimeMachineTool() {
  const [hasHar, setHasHar] = useState(false);
  const [entries, setEntries] = useState<HarEntry[]>(DEMO_ENTRIES);
  const [sourceName, setSourceName] = useState("Demo HAR Session");
  const [time, setTime] = useState(0);
  const [maxTime, setMaxTime] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<HarEntry | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-play timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setTime((prev) => {
          if (prev >= maxTime) {
            setIsPlaying(false);
            return maxTime;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, maxTime]);

  const loadDemo = () => {
    setEntries(DEMO_ENTRIES);
    setSourceName("Demo Session (Chrome Network)");
    setMaxTime(60);
    setTime(0);
    setIsPlaying(false);
    setSelectedEntry(null);
    setUploadError(null);
    setHasHar(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.log || !Array.isArray(json.log.entries) || json.log.entries.length === 0) {
          throw new Error("The uploaded file does not contain a valid 'log.entries' array.");
        }

        const rawEntries = json.log.entries;
        // Sort by startedDateTime
        const parsedList: { entry: any; startMs: number }[] = [];
        for (const item of rawEntries) {
          const dateStr = item.startedDateTime;
          const startMs = dateStr ? new Date(dateStr).getTime() : 0;
          parsedList.push({ entry: item, startMs });
        }
        parsedList.sort((a, b) => a.startMs - b.startMs);

        const firstStart = parsedList[0].startMs;
        const mapped: HarEntry[] = parsedList.map((item, idx) => {
          const raw = item.entry;
          const req = raw.request || {};
          const res = raw.response || {};
          const fullUrl = req.url || "/";
          let path = fullUrl;
          try {
            path = new URL(fullUrl).pathname;
          } catch {
            path = fullUrl;
          }

          const relativeSeconds = firstStart > 0 && item.startMs > 0
            ? Math.max(0, Math.round((item.startMs - firstStart) / 1000))
            : idx * 2;

          return {
            id: `har_${idx + 1}`,
            relativeTime: relativeSeconds,
            method: (req.method || "GET").toUpperCase(),
            url: fullUrl,
            path: path || "/",
            status: typeof res.status === "number" ? res.status : 200,
            statusText: res.statusText || "OK",
            durationMs: Math.round(raw.time || 0),
            mimeType: res.content?.mimeType || "application/json",
            responseBody: res.content?.text || undefined,
          };
        });

        const calculatedMax = Math.max(30, Math.min(600, mapped[mapped.length - 1].relativeTime + 5));

        setEntries(mapped);
        setSourceName(file.name);
        setMaxTime(calculatedMax);
        setTime(0);
        setIsPlaying(false);
        setSelectedEntry(null);
        setHasHar(true);
      } catch (err: any) {
        setUploadError(`Failed to parse HAR file: ${err.message || String(err)}`);
      }
    };

    reader.onerror = () => {
      setUploadError("Error reading file from disk.");
    };

    reader.readAsText(file);
  };

  const interceptedSoFar = entries.filter((e) => e.relativeTime <= time);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
          <History className="w-8 h-8 text-primary" /> Chrono-Debug API Replay
        </h2>
        <p className="text-muted max-w-2xl mx-auto text-sm sm:text-base">
          Upload a Network HAR log or explore the demo. Inspect real API requests and replay historical responses across the chronological timeline.
        </p>
      </div>

      {!hasHar ? (
        <div className="card p-12 text-center border-dashed border-2 border-line bg-card max-w-2xl mx-auto space-y-6">
          <UploadCloudIcon className="w-16 h-16 text-muted mx-auto opacity-50" />
          <div>
            <h3 className="text-xl font-bold mb-2 text-fg">Upload HAR Network Log</h3>
            <p className="text-sm text-muted">
              Export a <code>.har</code> file from Chrome, Firefox, or Safari DevTools (Network Tab &gt; Export HAR).
            </p>
          </div>

          {uploadError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2 justify-center">
              <AlertCircle className="w-4 h-4" /> {uploadError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4">
            <label htmlFor="har-file-upload" className="btn btn-primary cursor-pointer gap-2">
              <FileJson className="w-4 h-4" /> Upload .HAR File
              <input
                id="har-file-upload"
                ref={fileInputRef}
                type="file"
                accept=".har,application/json"
                aria-label="Upload HAR file"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button type="button" onClick={loadDemo} className="btn btn-secondary">
              Load Demo Session
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-6 bg-card border-line space-y-6">
          {/* Header Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-fg">{sourceName}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {entries.length} requests parsed
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                Scrub through the timeline to inspect replayed API calls.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="font-mono text-3xl font-extrabold text-accent">
                {Math.floor(time / 60).toString().padStart(2, "0")}:{(time % 60).toString().padStart(2, "0")}s
              </div>
              <button
                type="button"
                onClick={() => {
                  setHasHar(false);
                  setIsPlaying(false);
                }}
                className="btn btn-secondary btn-sm text-xs gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Upload Another
              </button>
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="relative pt-2 pb-4">
            <input
              type="range"
              min="0"
              max={maxTime}
              value={time}
              onChange={(e) => setTime(parseInt(e.target.value, 10))}
              aria-label="Timeline position in seconds"
              className="w-full h-2.5 bg-line rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted mt-2 font-mono">
              <span>T-0s</span>
              <span>T-{Math.round(maxTime / 2)}s</span>
              <span>T-{maxTime}s</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center items-center gap-4">
            <button
              type="button"
              onClick={() => setTime(0)}
              className="btn btn-secondary p-3 rounded-full"
              title="Reset to 0s"
              aria-label="Rewind to start"
            >
              <Rewind className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="btn btn-primary p-4 rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-primary/25"
              aria-label={isPlaying ? "Pause replay" : "Play replay"}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={() => setTime(Math.min(maxTime, time + 5))}
              className="btn btn-secondary p-3 rounded-full"
              title="Fast Forward 5s"
              aria-label="Fast forward 5 seconds"
            >
              <FastForward className="w-5 h-5" />
            </button>
          </div>

          {/* Request Stream & Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Stream */}
            <div className="bg-bg border border-line rounded-xl p-4 flex flex-col h-72 overflow-hidden">
              <div className="text-xs text-muted font-mono mb-2 flex items-center justify-between">
                <span>// Intercepted Requests up to T-{time}s ({interceptedSoFar.length}/{entries.length})</span>
                <span className="text-accent text-[11px]">Click row to inspect</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
                {interceptedSoFar.length === 0 ? (
                  <div className="text-muted/60 italic text-center py-12">
                    No requests dispatched yet at T-{time}s. Scrub forward to replay.
                  </div>
                ) : (
                  interceptedSoFar.map((item) => {
                    const isSelected = selectedEntry?.id === item.id;
                    const isError = item.status >= 400;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedEntry(item)}
                        className={`p-2 rounded-lg cursor-pointer transition-all border flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-primary/10 border-primary text-fg"
                            : "bg-card hover:bg-hover border-line/60 text-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded ${
                            item.method === "GET" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {item.method}
                          </span>
                          <span className="truncate text-fg font-medium">{item.path}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-[11px]">
                          <span className={isError ? "text-danger font-bold" : "text-emerald-500"}>
                            {item.status}
                          </span>
                          <span className="text-muted/60">{item.durationMs}ms</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Inspector Details */}
            <div className="bg-bg border border-line rounded-xl p-4 flex flex-col h-72 overflow-hidden">
              <div className="text-xs text-muted font-mono mb-2">
                // Payload &amp; Header Inspector
              </div>
              {selectedEntry ? (
                <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs pr-1">
                  <div className="p-2.5 rounded-lg bg-card border border-line space-y-1">
                    <div className="text-muted text-[11px]">Full URL</div>
                    <div className="break-all text-fg font-medium">{selectedEntry.url}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-card border border-line">
                      <span className="text-muted block">Status</span>
                      <span className="font-bold text-fg">{selectedEntry.status} {selectedEntry.statusText}</span>
                    </div>
                    <div className="p-2 rounded bg-card border border-line">
                      <span className="text-muted block">Latency</span>
                      <span className="font-bold text-fg">{selectedEntry.durationMs} ms</span>
                    </div>
                    <div className="p-2 rounded bg-card border border-line">
                      <span className="text-muted block">Content-Type</span>
                      <span className="font-bold text-fg truncate block">{selectedEntry.mimeType}</span>
                    </div>
                  </div>
                  {selectedEntry.responseBody && (
                    <div className="space-y-1">
                      <span className="text-muted text-[11px]">Response Body Preview:</span>
                      <pre className="p-2.5 rounded-lg bg-card border border-line overflow-x-auto text-fg text-[11px] leading-relaxed max-h-28">
                        {selectedEntry.responseBody}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted/60 italic text-xs text-center p-6">
                  Select an intercepted request from the left list to inspect its URL, latency, and response body.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
