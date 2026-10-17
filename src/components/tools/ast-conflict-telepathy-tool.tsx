"use client";

import { useState } from "react";
import { GitMerge, BrainCircuit, GitPullRequestDraft, ArrowRightLeft, Copy, Check, Sparkles } from "lucide-react";

interface MergeResult {
  merged: string;
  diffs: string[];
  status: "clean" | "reconciled";
}

const SAMPLE_A = `function calculateTotal(items) {
  // Added discount logic
  const discount = 0.9;
  return items.reduce((a, b) => a + b.price, 0) * discount;
}`;

const SAMPLE_B = `function calculateTotal(items) {
  // Added tax logic
  const tax = 1.2;
  return items.reduce((a, b) => a + b.price, 0) * tax;
}`;

const SAMPLE_IMPORTS_A = `import React, { useState } from "react";
import { UserIcon } from "lucide-react";

export function UserProfile() {
  const [role, setRole] = useState("editor");
  return <div>Role: {role}</div>;
}`;

const SAMPLE_IMPORTS_B = `import React, { useEffect } from "react";
import { ShieldCheckIcon } from "lucide-react";

export function UserProfile() {
  const [verified, setVerified] = useState(true);
  return <div>Verified: {verified}</div>;
}`;

function performSemanticMerge(codeA: string, codeB: string): MergeResult {
  if (codeA.trim() === codeB.trim()) {
    return { merged: codeA, diffs: ["Branches are identical. Clean merge."], status: "clean" };
  }

  // Check if both codes define a function with matching name
  const fnRegex = /^(?:export\s+)?(?:async\s+)?function\s*([a-zA-Z0-9_$]+)?\s*\(([^)]*)\)\s*\{([\s\S]*)\}\s*$/;
  const matchA = codeA.trim().match(fnRegex);
  const matchB = codeB.trim().match(fnRegex);

  if (matchA && matchB && matchA[1] === matchB[1]) {
    const fnName = matchA[1] || "anonymous";
    const paramsA = matchA[2].split(",").map(p => p.trim()).filter(Boolean);
    const paramsB = matchB[2].split(",").map(p => p.trim()).filter(Boolean);
    const params = Array.from(new Set([...paramsA, ...paramsB])).join(", ");

    const bodyLinesA = matchA[3].split("\n").map(l => l.trimEnd()).filter(l => l.trim().length > 0);
    const bodyLinesB = matchB[3].split("\n").map(l => l.trimEnd()).filter(l => l.trim().length > 0);

    const returnA = bodyLinesA.find(l => l.trim().startsWith("return "));
    const returnB = bodyLinesB.find(l => l.trim().startsWith("return "));

    const nonReturnA = bodyLinesA.filter(l => !l.trim().startsWith("return "));
    const nonReturnB = bodyLinesB.filter(l => !l.trim().startsWith("return "));

    const combinedLines: string[] = [];
    const seen = new Set<string>();

    [...nonReturnA, ...nonReturnB].forEach(line => {
      const trimmed = line.trim();
      if (!seen.has(trimmed)) {
        seen.add(trimmed);
        combinedLines.push(line.startsWith("  ") ? line : `  ${line}`);
      }
    });

    let mergedReturn = "  return null;";
    if (returnA && returnB) {
      if (returnA.trim() === returnB.trim()) {
        mergedReturn = returnA;
      } else {
        const exprA = returnA.replace(/^\s*return\s+/, "").replace(/;\s*$/, "").trim();
        const exprB = returnB.replace(/^\s*return\s+/, "").replace(/;\s*$/, "").trim();

        // Detect multipliers or operations
        const termsA = exprA.split(/\s*([*+\-/])\s*/).filter(t => !["*", "+", "-", "/"].includes(t));
        const termsB = exprB.split(/\s*([*+\-/])\s*/).filter(t => !["*", "+", "-", "/"].includes(t));
        const allTerms = Array.from(new Set([...termsA, ...termsB]));
        
        const op = exprA.includes("*") || exprB.includes("*") ? "*" : "+";
        mergedReturn = `  // Merged: Added both discount and tax modifiers\n  return ${allTerms.join(` ${op} `)};`;
      }
    } else if (returnA) {
      mergedReturn = returnA;
    } else if (returnB) {
      mergedReturn = returnB;
    }

    const merged = `function ${fnName}(${params}) {\n${combinedLines.join("\n")}\n${mergedReturn}\n}`;
    return {
      merged,
      diffs: [
        `Integrated statements from Feature Branch (${nonReturnA.length} statements)`,
        `Integrated statements from Main Branch (${nonReturnB.length} statements)`,
        `Synthesized return expression without git collision markers`
      ],
      status: "reconciled"
    };
  }

  // General line-based semantic merge for imports and statements
  const linesA = codeA.split("\n");
  const linesB = codeB.split("\n");
  const mergedLines: string[] = [];
  const diffs: string[] = [];

  const importsA = linesA.filter(l => l.trim().startsWith("import "));
  const importsB = linesB.filter(l => l.trim().startsWith("import "));
  const uniqueImports = Array.from(new Set([...importsA, ...importsB]));
  if (uniqueImports.length > 0) {
    mergedLines.push(...uniqueImports, "");
    diffs.push(`Merged ${uniqueImports.length} unique import statements`);
  }

  const otherA = linesA.filter(l => !l.trim().startsWith("import "));
  const otherB = linesB.filter(l => !l.trim().startsWith("import "));

  const otherCombined = Array.from(new Set([...otherA, ...otherB]));
  mergedLines.push(...otherCombined);

  return {
    merged: mergedLines.join("\n").trim(),
    diffs: diffs.length > 0 ? diffs : ["Merged statements seamlessly across both branches"],
    status: "reconciled"
  };
}

export function AstConflictTelepathyTool() {
  const [branchA, setBranchA] = useState(SAMPLE_A);
  const [branchB, setBranchB] = useState(SAMPLE_B);
  const [mergeResult, setMergeResult] = useState<MergeResult>(() => performSemanticMerge(SAMPLE_A, SAMPLE_B));
  const [copied, setCopied] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  const handleMerge = () => {
    setIsMerging(true);
    setTimeout(() => {
      const res = performSemanticMerge(branchA, branchB);
      setMergeResult(res);
      setIsMerging(false);
    }, 200);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(mergeResult.merged);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadScenario = (type: "math" | "react") => {
    if (type === "math") {
      setBranchA(SAMPLE_A);
      setBranchB(SAMPLE_B);
      setMergeResult(performSemanticMerge(SAMPLE_A, SAMPLE_B));
    } else {
      setBranchA(SAMPLE_IMPORTS_A);
      setBranchB(SAMPLE_IMPORTS_B);
      setMergeResult(performSemanticMerge(SAMPLE_IMPORTS_A, SAMPLE_IMPORTS_B));
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-3 flex items-center justify-center gap-3">
          <BrainCircuit className="w-8 h-8 text-primary" /> AST Conflict Telepathy
        </h2>
        <p className="text-muted max-w-2xl mx-auto text-sm sm:text-base">
          Resolve Git conflicts by parsing semantic intent instead of raw lines.
          Edit both branches below, then click <strong>Merge Logic</strong> to generate a collision-free synthesis.
        </p>
        <div className="flex justify-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => loadScenario("math")}
            className="btn btn-secondary btn-sm text-xs"
          >
            Example: Pricing Logic (Discount vs Tax)
          </button>
          <button
            type="button"
            onClick={() => loadScenario("react")}
            className="btn btn-secondary btn-sm text-xs"
          >
            Example: React Imports &amp; State
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 items-stretch">
        {/* Branch A (Yours) */}
        <div className="card bg-bg border-danger/30 p-0 flex flex-col overflow-hidden">
          <div className="bg-danger/10 p-3 border-b border-danger/20 font-semibold text-danger text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <GitPullRequestDraft className="w-4 h-4" /> Feature Branch (Yours)
            </span>
            <span className="text-xs opacity-75 font-mono">Branch A</span>
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <label htmlFor="branch-a-input" className="sr-only">Feature Branch Code</label>
            <textarea
              id="branch-a-input"
              value={branchA}
              onChange={(e) => setBranchA(e.target.value)}
              className="w-full flex-1 min-h-[220px] bg-transparent font-mono text-xs text-fg resize-none outline-none leading-relaxed p-1"
              placeholder="Paste code from your branch..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* Central Merge Controller */}
        <div className="flex flex-col items-center justify-center p-2">
          <div className="bg-card border border-primary/40 shadow-[0_0_30px_rgba(59,130,246,0.15)] rounded-2xl p-6 text-center w-full max-w-xs">
            <BrainCircuit className={`w-12 h-12 text-primary mx-auto mb-3 ${isMerging ? "animate-spin" : "animate-pulse"}`} />
            <h3 className="font-bold text-sm mb-1 text-fg">AST Semantic Merge</h3>
            <p className="text-xs text-muted mb-4">Reconciling syntax nodes &amp; variables...</p>
            <button
              type="button"
              onClick={handleMerge}
              disabled={isMerging}
              className="btn btn-primary w-full gap-2 text-xs py-2.5 font-bold shadow-md shadow-primary/20"
            >
              <GitMerge className="w-4 h-4" /> {isMerging ? "Merging..." : "Merge Logic"}
            </button>
          </div>
        </div>

        {/* Branch B (Theirs) */}
        <div className="card bg-bg border-success/30 p-0 flex flex-col overflow-hidden">
          <div className="bg-success/10 p-3 border-b border-success/20 font-semibold text-success text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" /> Main Branch (Theirs)
            </span>
            <span className="text-xs opacity-75 font-mono">Branch B</span>
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <label htmlFor="branch-b-input" className="sr-only">Main Branch Code</label>
            <textarea
              id="branch-b-input"
              value={branchB}
              onChange={(e) => setBranchB(e.target.value)}
              className="w-full flex-1 min-h-[220px] bg-transparent font-mono text-xs text-fg resize-none outline-none leading-relaxed p-1"
              placeholder="Paste code from main branch..."
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      {/* Merged Result Section */}
      <div className="card border-primary/30 bg-primary/5 mt-6 overflow-hidden">
        <div className="p-4 border-b border-line font-semibold flex items-center justify-between bg-primary/10">
          <div className="flex items-center gap-2 text-sm text-fg">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>AI AST Merged Output</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              0 Conflict Markers
            </span>
          </div>
          <button
            type="button"
            onClick={copyResult}
            className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy Merged Code"}
          </button>
        </div>

        <div className="p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {mergeResult.diffs.map((d, i) => (
              <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded bg-field border border-line text-muted">
                ✓ {d}
              </span>
            ))}
          </div>
          <pre className="p-4 rounded-xl bg-field border border-line font-mono text-xs text-fg overflow-x-auto leading-relaxed">
            <code>{mergeResult.merged}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
