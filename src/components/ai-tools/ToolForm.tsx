"use client";

import type { AiTool } from "@/lib/ai-tools";

/**
 * Generic AI tool form. It deliberately produces NO output yet: generation will be wired
 * to a real model using the visitor's own API key (BYOK). Until then the submit button is
 * disabled, so we never show fabricated "generated" results.
 */
export function ToolForm({ tool }: { tool: AiTool }) {
  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start w-full">
      <div className="card p-6 sm:p-8 bg-card/60 shadow-sm border-line/40">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6" aria-disabled="true">
          {tool.inputs.map((input) => (
            <div key={input.name}>
              <label htmlFor={input.name} className="field-label text-sm text-fg mb-1.5 block">
                {input.label}
              </label>
              {input.type === "textarea" ? (
                <textarea
                  id={input.name}
                  name={input.name}
                  className="input min-h-[120px] bg-field border-line focus:border-accent resize-y"
                  placeholder={input.placeholder}
                />
              ) : input.type === "select" ? (
                <select
                  id={input.name}
                  name={input.name}
                  className="input bg-field border-line focus:border-accent"
                >
                  {input.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={input.type}
                  id={input.name}
                  name={input.name}
                  className="input bg-field border-line focus:border-accent"
                  placeholder={input.placeholder}
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled
            className="btn btn-primary w-full h-11 text-sm font-semibold flex justify-center items-center gap-2 opacity-60 cursor-not-allowed"
          >
            Coming soon
          </button>
        </form>
      </div>

      <div className="card p-6 sm:p-8 bg-hover/30 shadow-sm border-line/30 min-h-[300px] flex flex-col h-full">
        <h3 className="text-sm font-semibold text-muted mb-4 tracking-wide uppercase">Output Console</h3>
        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted border-2 border-dashed border-line/40 rounded-xl p-8">
          <svg className="w-8 h-8 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <p className="text-sm">
            This generator is not live yet. It will run on a real model using your own API key (BYOK).
          </p>
        </div>
      </div>
    </div>
  );
}
