"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { validateTimestamp, type TimestampValidation, type UnitChoice } from "@/lib/time";
import { UnitSelect } from "../ui/unit-select";
import { Share2 } from "lucide-react";
import { useUrlState } from "@/hooks/use-url-state";

const UNITS: UnitChoice[] = ["auto", "seconds", "milliseconds"];

export function UnixValidatorTool() {
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue, shareState] = useUrlState("ts", "");
  const [unit, setUnit] = useState<UnitChoice>("auto");
  const [result, setResult] = useState<TimestampValidation | null>(() =>
    value ? validateTimestamp(value, "auto") : null
  );
  const [copied, setCopied] = useState(false);

  function run(raw: string, choice: UnitChoice) {
    setResult(validateTimestamp(raw, choice));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    run(value, unit);
  }

  function handleClear() {
    setValue("");
    setUnit("auto");
    setResult(null);
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Unix timestamp validator">
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <div>
          <label htmlFor={`${uid}-value`} className="field-label">
            Value to check
          </label>
          <input
            ref={inputRef}
            id={`${uid}-value`}
            className="input input-mono"
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="e.g. 1790000000"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <UnitSelect id={`${uid}-unit`} value={unit} onChange={setUnit} choices={UNITS} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
        <button type="submit" className="btn btn-primary col-span-2 sm:col-auto">
          Validate
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleClear}>
          Clear
        </button>
        <button 
          type="button" 
          className="btn btn-secondary sm:ml-auto flex items-center gap-2" 
          onClick={() => {
            shareState();
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          disabled={!value}
        >
          <Share2 size={16} />
          {copied ? "Link Copied!" : "Share State"}
        </button>
      </div>

      <div aria-live="polite" className="mt-6">
        {result ? (
          <div className={`card p-4 ${result.valid ? "" : ""}`} style={{ borderColor: result.valid ? "var(--tf-accent)" : "var(--tf-danger)" }}>
            <p className="!mt-0 flex items-center gap-2 text-lg font-semibold">
              <span aria-hidden="true">{result.valid ? "\u2705" : "\u274C"}</span>
              {result.valid ? "Valid" : "Invalid"}
            </p>
            <p className="mt-1">{result.valid ? result.message : result.message}</p>
            {result.valid ? (
              <dl className="mt-3 space-y-1 text-sm">
                <div>
                  <dt className="inline text-muted">Unit: </dt>
                  <dd className="inline font-mono">{result.unit}</dd>
                </div>
                <div>
                  <dt className="inline text-muted">Digits: </dt>
                  <dd className="inline font-mono">{result.digits}</dd>
                </div>
              </dl>
            ) : null}
            {result.valid && result.notes.length > 0 ? (
              <ul className="mt-3 list-disc pl-5 text-sm text-muted">
                {result.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}
