import React from 'react';
import Link from 'next/link';

export default function GuidePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 text-gray-900 dark:text-gray-100">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/guides" className="hover:underline">Guides</Link> / Zero-Latency Local Tools
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
        Building Zero-Latency Local Tools for LLM Workflows
      </h1>

      {/* Intro */}
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed font-medium">
        "Zero-latency" is shorthand: tool overhead should be small enough to vanish next to model inference. A model call takes hundreds of milliseconds to seconds. If your tool layer adds 50–200 ms per call through process spawns, HTTP round-trips, and serialization, an agent loop with 20 tool calls pays that tax 20 times.
      </p>

      {/* Content Body */}
      <article className="space-y-8 text-base md:text-lg leading-relaxed text-gray-800 dark:text-gray-200">
        
        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">The Engineering Challenge</h2>
          <p className="mb-4">
            Typical sources of tool overhead include:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Process spawning:</strong> Running <code>python script.py</code> or shell wrappers for every single call.</li>
            <li><strong>Network hops:</strong> Local server requests including connection setup and JSON encoding/decoding.</li>
            <li><strong>Serial execution:</strong> Running independent calls sequentially instead of in parallel when requested in one turn.</li>
            <li><strong>Repeated work:</strong> Re-reading and re-parsing the same files or indexes without caching.</li>
            <li><strong>No cancellation:</strong> Abandoned or redundant tool calls continuing to consume CPU resources.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Architecture: In-Process Registry, Parallel Dispatch, Cache</h2>
          <p className="mb-4">
            Run tools as plain async functions in the agent's own process. Dispatch independent calls concurrently, cache pure reads, and thread an <code>AbortSignal</code> through everything.
          </p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm my-6 border border-gray-800 shadow-lg">
            <code>{`import { z } from "zod";

interface ToolDef<I extends z.ZodTypeAny, O> {
  name: string;
  input: I;
  pure?: boolean; // safe to cache for the TTL
  run: (args: z.infer<I>, ctx: { signal: AbortSignal }) => Promise<O>;
}

type AnyTool = ToolDef<z.ZodTypeAny, unknown>;

export class ToolRegistry {
  private tools = new Map<string, AnyTool>();
  private cache = new Map<string, { at: number; value: unknown }>();
  constructor(private ttlMs = 5_000, private maxEntries = 500) {}

  register<I extends z.ZodTypeAny, O>(tool: ToolDef<I, O>) {
    this.tools.set(tool.name, tool as unknown as AnyTool);
  }

  async call(name: string, rawArgs: unknown, signal: AbortSignal) {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(\`Unknown tool: \${name}\`);

    const args = tool.input.parse(rawArgs);
    const key = tool.pure ? \`\${name}:\${JSON.stringify(args)}\` : null;

    if (key) {
      const hit = this.cache.get(key);
      if (hit && Date.now() - hit.at < this.ttlMs) return hit.value;
    }

    const t0 = performance.now();
    const value = await tool.run(args, { signal });
    const ms = performance.now() - t0;
    if (ms > 100) console.warn(\`[tool:\${name}] slow call: \${ms.toFixed(1)}ms\`);

    if (key) {
      if (this.cache.size >= this.maxEntries) {
        this.cache.delete(this.cache.keys().next().value!);
      }
      this.cache.set(key, { at: Date.now(), value });
    }
    return value;
  }

  callMany(
    calls: { name: string; args: unknown }[],
    signal: AbortSignal,
  ) {
    return Promise.allSettled(calls.map((c) => this.call(c.name, c.args, signal)));
  }
}`}</code>
          </pre>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Best Practices and Trade-offs</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Measure first:</strong> Wrap every call with timing and log p50/p95 metrics before optimizing.</li>
            <li><strong>Cache selectively:</strong> Only cache pure reads with short TTLs and invalidate on file-watcher events.</li>
            <li><strong>Cap concurrency:</strong> Use a semaphore (4–8) to avoid saturating disk or CPU resources.</li>
            <li><strong>Return compact results:</strong> Large payloads cost more tokens than the tool saved in execution milliseconds.</li>
          </ul>
        </section>

        <section className="bg-blue-50 dark:bg-gray-800 p-6 rounded-2xl border border-blue-100 dark:border-gray-700 mt-10">
          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Conclusion</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            The fastest tool call is a function call in the same process. Keep trusted tools in-process and cache and parallelize them, and spend the isolation budget only where the risk justifies it. Castov's local-first design keeps the tool path on your machine, with no network round-trip. Details at{' '}
            <a href="https://castov.com/guides/building-zero-latency-local-tools-for-llm-workflows" className="text-blue-600 dark:text-blue-400 underline font-semibold" target="_blank" rel="noopener noreferrer">
              castov.com/guides/building-zero-latency-local-tools-for-llm-workflows
            </a>.
          </p>
        </section>

      </article>
    </main>
  );
}