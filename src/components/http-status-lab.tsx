"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Play } from "lucide-react";
import type { StatusSnippets } from "@/lib/http-status-guides";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"] as const;
type Method = (typeof METHODS)[number];

const TABS: { key: keyof StatusSnippets; label: string; lang: string }[] = [
  { key: "nextjs", label: "Next.js", lang: "ts" },
  { key: "express", label: "Express", lang: "js" },
  { key: "nginx", label: "Nginx", lang: "nginx" },
  { key: "curl", label: "curl", lang: "bash" },
];

interface TestResult {
  status: number;
  statusText: string;
  durationMs: number;
  redirected: boolean;
  finalUrl: string;
  headers: [string, string][];
  body: string;
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-card px-2.5 py-1 text-xs font-semibold text-fg transition-colors hover:border-accent"
      aria-label={copied ? "Copied" : label}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function statusColor(status: number): string {
  if (status >= 500) return "text-purple-400 border-purple-500/30 bg-purple-500/10";
  if (status >= 400) return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  if (status >= 300) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
  return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
}

export function HttpStatusLab({
  code,
  snippets,
  mockable,
}: {
  code: string;
  snippets: StatusSnippets;
  mockable: boolean;
}) {
  const [tab, setTab] = useState<keyof StatusSnippets>("nextjs");
  const [method, setMethod] = useState<Method>("GET");
  const [delay, setDelay] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mockPath = `/api/mock/${code}${delay > 0 ? `?delay=${delay}` : ""}`;

  async function runTest() {
    setLoading(true);
    setError(null);
    setResult(null);
    const started = performance.now();
    try {
      const res = await fetch(mockPath, { method, cache: "no-store" });
      const body = method === "HEAD" ? "" : await res.text();
      let pretty = body;
      try {
        pretty = body ? JSON.stringify(JSON.parse(body), null, 2) : "";
      } catch {
        // Non-JSON body: show raw text.
      }
      setResult({
        status: res.status,
        statusText: res.statusText,
        durationMs: Math.round(performance.now() - started),
        redirected: res.redirected,
        finalUrl: res.url,
        headers: Array.from(res.headers.entries()),
        body: pretty,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const absoluteMockUrl = `https://castov.com/api/mock/${code}`;

  return (
    <div className="space-y-8">
      {/* Code snippets */}
      <section className="rounded-2xl border border-line bg-card p-5 sm:p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-fg">Return or handle {code} in your stack</h2>
          <CopyButton text={snippets[tab]} label="Copy code" />
        </div>
        <div role="tablist" aria-label="Code snippet language" className="mb-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md border px-3 py-1.5 text-xs font-bold font-mono transition-colors ${
                tab === t.key ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:text-fg"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <pre className="overflow-x-auto rounded-xl border border-line bg-[#0b0f17] p-4 text-xs leading-relaxed text-slate-200 sm:text-sm">
          <code>{snippets[tab]}</code>
        </pre>
      </section>

      {/* Live mock tester */}
      <section className="rounded-2xl border border-accent/30 bg-accent/5 p-5 sm:p-6 shadow-sm">
        <h2 className="mb-1 text-xl font-bold text-fg">Live {code} mock endpoint</h2>
        {mockable ? (
          <>
            <p className="mb-4 text-sm text-muted">
              Point your app, tests, or retry logic at this free public URL to reproduce a real <strong>{code}</strong> response
              (CORS enabled, optional <code className="font-mono">?delay=ms</code> up to 5000).
            </p>
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-card px-3 py-2">
              <code className="min-w-0 flex-1 break-all font-mono text-xs text-fg sm:text-sm">{absoluteMockUrl}</code>
              <CopyButton text={absoluteMockUrl} label="Copy URL" />
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                Method
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as Method)}
                  className="rounded-md border border-line bg-card px-3 py-2 font-mono text-sm text-fg"
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                Delay (ms)
                <input
                  type="number"
                  min={0}
                  max={5000}
                  step={250}
                  value={delay}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setDelay(Number.isFinite(v) ? Math.min(Math.max(Math.floor(v), 0), 5000) : 0);
                  }}
                  className="w-28 rounded-md border border-line bg-card px-3 py-2 font-mono text-sm text-fg"
                />
              </label>
              <button
                type="button"
                onClick={runTest}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:text-[#050505]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Send request
              </button>
            </div>

            {error && <p className="mt-4 text-sm font-semibold text-rose-400">Request failed: {error}</p>}

            {result && (
              <div className="mt-5 space-y-3" aria-live="polite">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-md border px-2.5 py-1 font-mono text-sm font-bold ${statusColor(result.status)}`}>
                    {result.status} {result.statusText}
                  </span>
                  <span className="font-mono text-xs text-muted">{result.durationMs} ms</span>
                  {result.redirected && (
                    <span className="text-xs text-amber-400">
                      Browser followed the redirect automatically → {new URL(result.finalUrl).pathname}
                    </span>
                  )}
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <div>
                    <div className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">Response headers</div>
                    <pre className="max-h-64 overflow-auto rounded-lg border border-line bg-[#0b0f17] p-3 text-xs text-slate-200">
                      {result.headers.map(([k, v]) => `${k}: ${v}`).join("\n")}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">Response body</div>
                    <pre className="max-h-64 overflow-auto rounded-lg border border-line bg-[#0b0f17] p-3 text-xs text-slate-200">
                      {result.body || "(empty body)"}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">
            {code} is an interim 1xx response. Browsers and the Fetch API never expose 1xx codes as a final response, so it cannot be
            mocked directly. Try <code className="font-mono">/api/mock/200</code> instead.
          </p>
        )}
      </section>
    </div>
  );
}
