"use client";

import { useState, useMemo, useId } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  RotateCcw,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Code2,
  Sliders,
} from "lucide-react";
import {
  RegexPattern,
  REGEX_PATTERNS,
  getPatternBySlug,
} from "@/lib/regex-patterns-registry";

interface ToolProps {
  slug?: string;
  patternData?: RegexPattern;
}

interface InnerProps {
  patternData: RegexPattern;
}

export function RegexPatternTesterTool({ slug, patternData: propPattern }: ToolProps) {
  const patternData = propPattern || (slug ? getPatternBySlug(slug) : undefined) || REGEX_PATTERNS[0];
  return <RegexPatternTesterToolInner key={patternData.slug} patternData={patternData} />;
}

type LangTab = "js" | "python" | "go" | "rust" | "php" | "java";

function RegexPatternTesterToolInner({ patternData }: InnerProps) {
  const router = useRouter();
  const patternInputId = useId();
  const testInputId = useId();
  const switcherId = useId();

  const [pattern, setPattern] = useState(patternData.pattern);
  const [flags, setFlags] = useState(patternData.flags || "");
  const [testString, setTestString] = useState(patternData.validSamples[0] || "");
  const [selectedLang, setSelectedLang] = useState<LangTab>("js");
  const [copiedRegex, setCopiedRegex] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Compile regex safely
  const { regexObj, regexError } = useMemo(() => {
    try {
      const r = new RegExp(pattern, flags);
      return { regexObj: r, regexError: null };
    } catch (err: any) {
      return { regexObj: null, regexError: err?.message || "Invalid regular expression." };
    }
  }, [pattern, flags]);

  // Evaluate matches on current test string
  const matchResult = useMemo(() => {
    if (!regexObj || !testString) {
      return { isMatch: false, matches: [] };
    }

    try {
      if (flags.includes("g")) {
        const matches: string[] = [];
        let m: RegExpExecArray | null;
        // Limit loop to prevent catastrophic backtracking freezing
        let count = 0;
        const re = new RegExp(regexObj.source, regexObj.flags);
        while ((m = re.exec(testString)) !== null && count < 100) {
          matches.push(m[0]);
          if (m.index === re.lastIndex) re.lastIndex++;
          count++;
        }
        return { isMatch: matches.length > 0, matches };
      } else {
        const m = regexObj.exec(testString);
        return { isMatch: Boolean(m), matches: m ? [m[0]] : [] };
      }
    } catch {
      return { isMatch: false, matches: [] };
    }
  }, [regexObj, testString, flags]);

  // Run Matrix Validation against default valid & invalid samples
  const sampleMatrix = useMemo(() => {
    if (!regexObj) return { validResults: [], invalidResults: [] };

    const validResults = patternData.validSamples.map((sample) => {
      try {
        const passed = new RegExp(pattern, flags).test(sample);
        return { sample, expected: true, passed };
      } catch {
        return { sample, expected: true, passed: false };
      }
    });

    const invalidResults = patternData.invalidSamples.map((sample) => {
      try {
        const matched = new RegExp(pattern, flags).test(sample);
        // For invalid sample, passing means it didn't match!
        return { sample, expected: false, passed: !matched };
      } catch {
        return { sample, expected: false, passed: false };
      }
    });

    return { validResults, invalidResults };
  }, [regexObj, pattern, flags, patternData]);

  // Generate code snippets in 6 languages
  const codeSnippet = useMemo(() => {
    const pEsc = pattern.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    switch (selectedLang) {
      case "js":
        return `// JavaScript / TypeScript (ES6+)
const pattern = /${pattern}/${flags};
const text = ${JSON.stringify(testString)};

const isMatch = pattern.test(text);
console.log("Is Match:", isMatch);

if (isMatch) {
  const matches = text.match(pattern);
  console.log("Matches:", matches);
}`;
      case "python":
        return `# Python (re module)
import re

pattern = re.compile(r"${pattern}"${flags.includes("i") ? ", re.IGNORECASE" : ""}${flags.includes("m") ? ", re.MULTILINE" : ""})
text = ${JSON.stringify(testString)}

match = pattern.search(text)
if match:
    print("Match found:", match.group())
else:
    print("No match")`;
      case "go":
        return `// Golang (regexp)
package main

import (
\t"fmt"
\t"regexp"
)

func main() {
\tre := regexp.MustCompile(\`${pattern}\`)
\ttext := ${JSON.stringify(testString)}

\tif re.MatchString(text) {
\t\tfmt.Println("Matched:", re.FindString(text))
\t} else {
\t\tfmt.Println("No match")
\t}
}`;
      case "rust":
        return `// Rust (regex crate)
use regex::Regex;

fn main() {
    let re = Regex::new(r"${pattern}").unwrap();
    let text = ${JSON.stringify(testString)};

    if re.is_match(text) {
        println!("Matched!");
    } else {
        println!("No match");
    }
}`;
      case "php":
        return `<?php
// PHP (PCRE)
$pattern = '/${pattern.replace(/\//g, "\\/")}/${flags}';
$text = ${JSON.stringify(testString)};

if (preg_match($pattern, $text, $matches)) {
    echo "Match found: " . $matches[0];
} else {
    echo "No match";
}`;
      case "java":
        return `// Java (java.util.regex)
import java.util.regex.Pattern;
import java.util.regex.Matcher;

public class Main {
    public static void main(String[] args) {
        Pattern pattern = Pattern.compile("${pEsc}");
        Matcher matcher = pattern.matcher(${JSON.stringify(testString)});

        if (matcher.find()) {
            System.out.println("Match: " + matcher.group());
        } else {
            System.out.println("No match");
        }
    }
}`;
      default:
        return "";
    }
  }, [pattern, flags, testString, selectedLang]);

  const toggleFlag = (flagChar: string) => {
    if (flags.includes(flagChar)) {
      setFlags(flags.replace(flagChar, ""));
    } else {
      setFlags(flags + flagChar);
    }
  };

  const handleCopyRegex = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`/${pattern}/${flags}`);
        setCopiedRegex(true);
        setTimeout(() => setCopiedRegex(false), 2000);
      }
    } catch {
      // Ignored
    }
  };

  const handleCopySnippet = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(codeSnippet);
        setCopiedSnippet(true);
        setTimeout(() => setCopiedSnippet(false), 2000);
      }
    } catch {
      // Ignored
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 1. Header Toolbar & Pattern Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-card border border-line shadow-xs">
        <div className="flex items-center gap-2">
          <label htmlFor={switcherId} className="text-xs font-semibold text-muted uppercase tracking-wider shrink-0">
            Pattern:
          </label>
          <div className="relative inline-block w-full sm:w-auto">
            <select
              id={switcherId}
              aria-label="Select regex pattern"
              value={patternData.slug}
              onChange={(e) => router.push(`/regex-patterns/${e.target.value}`)}
              className="w-full sm:w-auto appearance-none bg-field border border-line rounded-lg px-3 py-1.5 pr-8 text-xs font-bold text-fg cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {REGEX_PATTERNS.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => {
              setPattern(patternData.pattern);
              setFlags(patternData.flags || "");
              setTestString(patternData.validSamples[0] || "");
            }}
            className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs"
            aria-label="Reset regex to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleCopyRegex}
            className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs"
            aria-label="Copy regular expression"
          >
            {copiedRegex ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedRegex ? "Copied" : "Copy /Regex/"}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Regex Builder Input with Flags */}
      <div className="rounded-xl bg-card border border-line p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <label htmlFor={patternInputId} className="text-xs font-bold uppercase tracking-wider text-muted">
            Regular Expression Pattern & Flags
          </label>
          {/* Flag Toggle Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted mr-1 flex items-center gap-1">
              <Sliders className="w-3 h-3" /> Flags:
            </span>
            {[
              { flag: "g", label: "Global (g)" },
              { flag: "i", label: "Ignore Case (i)" },
              { flag: "m", label: "Multiline (m)" },
              { flag: "s", label: "DotAll (s)" },
              { flag: "u", label: "Unicode (u)" },
            ].map(({ flag, label }) => {
              const active = flags.includes(flag);
              return (
                <button
                  key={flag}
                  type="button"
                  onClick={() => toggleFlag(flag)}
                  aria-pressed={active}
                  className={`px-2 py-0.5 rounded text-xs font-mono transition-colors border ${
                    active
                      ? "bg-accent text-white border-accent font-bold"
                      : "bg-field text-muted border-line hover:text-fg"
                  }`}
                  title={label}
                >
                  {flag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pattern Input Container */}
        <div className="flex items-center rounded-lg border border-line bg-field px-3 py-2 font-mono text-sm focus-within:ring-2 focus-within:ring-accent/50">
          <span className="text-accent font-bold select-none mr-1.5 text-base">/</span>
          <input
            id={patternInputId}
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            aria-label="Regular expression pattern input"
            spellCheck={false}
            className="w-full bg-transparent text-fg outline-none font-mono"
            placeholder="Type regex pattern here..."
          />
          <span className="text-accent font-bold select-none mx-1 text-base">/</span>
          <span className="text-amber-500 font-bold select-none text-xs">{flags || "none"}</span>
        </div>

        {regexError && (
          <div role="status" className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-mono">
            Regex Syntax Error: {regexError}
          </div>
        )}
      </div>

      {/* 3. Live Test String Area & Match Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Interactive Input */}
        <div className="rounded-xl bg-card border border-line p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor={testInputId} className="text-xs font-bold uppercase tracking-wider text-muted">
              Live Test String
            </label>
            <div className="flex items-center gap-2">
              {matchResult.isMatch ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Match Found
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/15 text-muted border border-line">
                  <XCircle className="w-3.5 h-3.5" />
                  No Match
                </span>
              )}
            </div>
          </div>
          <textarea
            id={testInputId}
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            aria-label="Live regex test string"
            placeholder="Type or paste sample text here to test the regular expression..."
            rows={5}
            spellCheck={false}
            className="w-full p-3 font-mono text-xs bg-field rounded-lg border border-line text-fg outline-none focus:ring-1 focus:ring-accent leading-relaxed resize-none"
          />

          {/* Quick preset pills */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted text-[11px]">Load Sample:</span>
            {patternData.validSamples.slice(0, 3).map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTestString(s)}
                className="px-2 py-0.5 rounded bg-field border border-line text-[11px] font-mono text-muted hover:text-fg hover:border-accent transition-colors truncate max-w-[150px]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Matches & Capture Groups Output */}
        <div className="rounded-xl bg-card border border-line p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Match Inspection & Details
            </span>
            <span className="text-xs font-mono text-muted">
              {matchResult.matches.length} {matchResult.matches.length === 1 ? "match" : "matches"}
            </span>
          </div>

          <div className="flex-1 bg-field rounded-lg border border-line p-3 overflow-y-auto max-h-48 text-xs font-mono">
            {matchResult.matches.length > 0 ? (
              <div className="space-y-2">
                {matchResult.matches.map((m, idx) => (
                  <div key={idx} className="p-2 rounded bg-accent/10 border border-accent/20 text-fg">
                    <span className="text-[10px] text-accent font-bold uppercase block mb-1">
                      Match #{idx + 1}:
                    </span>
                    <span className="break-all">{m}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted italic py-4 text-center">
                No match found for current test string.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Pass/Fail Verification Matrix */}
      <div className="rounded-xl bg-card border border-line p-5 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-fg mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Test Samples Verification Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Valid Samples Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
              Expected Valid Samples (Should Match)
            </h4>
            <div className="space-y-1.5">
              {sampleMatrix.validResults.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg bg-field border border-line text-xs font-mono"
                >
                  <span className="truncate mr-2 text-fg">{item.sample}</span>
                  {item.passed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 shrink-0">
                      <XCircle className="w-3.5 h-3.5" /> Fail
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Invalid Samples Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider">
              Expected Invalid Samples (Must Reject)
            </h4>
            <div className="space-y-1.5">
              {sampleMatrix.invalidResults.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg bg-field border border-line text-xs font-mono"
                >
                  <span className="truncate mr-2 text-muted">{item.sample}</span>
                  {item.passed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Rejected (Pass)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 shrink-0">
                      <XCircle className="w-3.5 h-3.5" /> Accepted (Fail)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. 6-Language Code Snippet Generator */}
      <div className="rounded-xl bg-card border border-line overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line bg-field/60 px-4 py-2.5 gap-2">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold uppercase tracking-wider text-fg">
              Code Implementation Generator
            </span>
          </div>

          {/* Language selector tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "js", label: "JS / TS" },
              { id: "python", label: "Python" },
              { id: "go", label: "Go" },
              { id: "rust", label: "Rust" },
              { id: "php", label: "PHP" },
              { id: "java", label: "Java" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedLang(tab.id as LangTab)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  selectedLang === tab.id
                    ? "bg-accent text-white"
                    : "text-muted hover:text-fg hover:bg-hover"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopySnippet}
            aria-label="Copy code snippet"
            className="btn btn-secondary btn-sm py-1 px-2.5 flex items-center gap-1 text-xs cursor-pointer self-end sm:self-auto"
          >
            {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSnippet ? "Copied" : "Copy Code"}</span>
          </button>
        </div>

        <pre className="p-4 bg-field/30 text-xs font-mono text-fg overflow-x-auto leading-relaxed max-h-64 whitespace-pre">
          {codeSnippet}
        </pre>
      </div>
    </div>
  );
}
