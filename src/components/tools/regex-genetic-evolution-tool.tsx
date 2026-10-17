"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Dna, Play, Square, CheckCircle2, XCircle, Plus, Trash2, Copy, Check, Sparkles } from "lucide-react";

const INITIAL_PASSING = ["user@gmail.com", "admin.123@company.co.uk", "test-email@domain.com"];
const INITIAL_FAILING = ["user@gmail", "admin@.com", "test@domain.", "invalid email"];

const DEFAULT_BLOCKS = [
  "[a-zA-Z0-9._%+-]+",
  "[a-zA-Z0-9.-]+",
  "[a-zA-Z]{2,}",
  "[a-zA-Z]+",
  "\\d+",
  "[0-9]+",
  "\\w+",
  "@",
  "\\.",
  "-",
  "_",
  ":",
  "/",
  ".*",
  "[a-z]+",
  "[A-Z]+"
];

export function RegexGeneticEvolutionTool() {
  const [passing, setPassing] = useState<string[]>(INITIAL_PASSING);
  const [failing, setFailing] = useState<string[]>(INITIAL_FAILING);
  const [newPassing, setNewPassing] = useState("");
  const [newFailing, setNewFailing] = useState("");

  const [evolving, setEvolving] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [bestRegex, setBestRegex] = useState("");
  const [fitness, setFitness] = useState(0);
  const [copied, setCopied] = useState(false);

  // References for live loop state
  const evolvingRef = useRef(false);
  const passingRef = useRef(passing);
  const failingRef = useRef(failing);
  const bestFitnessRef = useRef(0);
  const bestRegexRef = useRef("");

  useEffect(() => {
    passingRef.current = passing;
    failingRef.current = failing;
  }, [passing, failing]);

  // Dynamically extract unique literal symbols from passing inputs to enrich block heuristic
  const dynamicBlocks = useMemo(() => {
    const blocks = new Set(DEFAULT_BLOCKS);
    passing.forEach((str) => {
      // Find special punctuation
      const punctuation = str.match(/[^a-zA-Z0-9\s]/g) || [];
      punctuation.forEach((ch) => {
        const escaped = ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        blocks.add(escaped);
      });
      // Extract domain or word chunks
      const words = str.split(/[^a-zA-Z0-9]/).filter((w) => w.length > 2);
      words.forEach((w) => blocks.add(w));
    });
    return Array.from(blocks);
  }, [passing]);

  const evaluateCandidate = (regexStr: string, passList: string[], failList: string[]): number => {
    if (!regexStr || (passList.length === 0 && failList.length === 0)) return 0;
    try {
      const r = new RegExp(regexStr);
      let score = 0;
      passList.forEach((p) => {
        if (r.test(p)) score += 10;
      });
      failList.forEach((f) => {
        if (!r.test(f)) score += 10;
      });

      const maxScore = (passList.length + failList.length) * 10;
      return (score / maxScore) * 100;
    } catch {
      return 0; // Malformed regex
    }
  };

  const startEvolution = () => {
    if (passing.length === 0) return;
    setEvolving(true);
    evolvingRef.current = true;
    setGeneration(0);
    setFitness(0);
    bestFitnessRef.current = 0;
    bestRegexRef.current = "";
    setBestRegex("");
  };

  const stopEvolution = () => {
    setEvolving(false);
    evolvingRef.current = false;
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (evolving) {
      timer = setInterval(() => {
        if (!evolvingRef.current) return;

        setGeneration((prevGen) => {
          const currentGen = prevGen + 1;

          // Generate 12 mutated candidate regexes per generation
          const candidatePool: string[] = [];
          for (let p = 0; p < 12; p++) {
            const length = Math.floor(Math.random() * 4) + 2;
            let expr = "^";
            for (let i = 0; i < length; i++) {
              expr += dynamicBlocks[Math.floor(Math.random() * dynamicBlocks.length)];
            }
            expr += "$";
            candidatePool.push(expr);
          }

          // Also try combining prefix and suffix heuristics from passing cases
          if (passingRef.current.length > 0) {
            const first = passingRef.current[0];
            const parts = first.split(/([@._\-/])/);
            if (parts.length > 1) {
              candidatePool.push(`^${parts.map((pt) => (/^[a-zA-Z]+$/.test(pt) ? "[a-zA-Z]+" : /^\d+$/.test(pt) ? "\\d+" : pt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).join("")}$`);
            }
          }

          // Evaluate pool
          let currentBestCand = bestRegexRef.current;
          let currentBestScore = bestFitnessRef.current;

          for (const cand of candidatePool) {
            const score = evaluateCandidate(cand, passingRef.current, failingRef.current);
            if (score > currentBestScore) {
              currentBestScore = score;
              currentBestCand = cand;
            }
          }

          if (currentBestScore > bestFitnessRef.current) {
            bestFitnessRef.current = currentBestScore;
            bestRegexRef.current = currentBestCand;
            setBestRegex(currentBestCand);
            setFitness(currentBestScore);
          }

          // Natural termination on 100% real fitness or 250 generations cap
          if (currentBestScore >= 100 || currentGen >= 250) {
            stopEvolution();
          }

          return currentGen;
        });
      }, 40);
    }

    return () => clearInterval(timer);
  }, [evolving, dynamicBlocks]);

  const addPassingItem = () => {
    if (newPassing.trim() && !passing.includes(newPassing.trim())) {
      setPassing([...passing, newPassing.trim()]);
      setNewPassing("");
    }
  };

  const removePassingItem = (index: number) => {
    setPassing(passing.filter((_, i) => i !== index));
  };

  const addFailingItem = () => {
    if (newFailing.trim() && !failing.includes(newFailing.trim())) {
      setFailing([...failing, newFailing.trim()]);
      setNewFailing("");
    }
  };

  const removeFailingItem = (index: number) => {
    setFailing(failing.filter((_, i) => i !== index));
  };

  const loadPreset = (type: "email" | "digits" | "slug") => {
    stopEvolution();
    setGeneration(0);
    setFitness(0);
    setBestRegex("");
    if (type === "email") {
      setPassing(INITIAL_PASSING);
      setFailing(INITIAL_FAILING);
    } else if (type === "digits") {
      setPassing(["12345", "9876543210", "42"]);
      setFailing(["abc", "12a34", "text", "12-34"]);
    } else {
      setPassing(["next-js-tool", "react_component", "castov_v1"]);
      setFailing(["Hello World", "invalid/slug", "name with spaces", "test@domain"]);
    }
  };

  const copyRegex = () => {
    if (!bestRegex) return;
    navigator.clipboard.writeText(bestRegex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3 flex items-center justify-center gap-3">
          <Dna className="w-8 h-8 text-primary" /> Genetic Regex Auto-Healer
        </h2>
        <p className="text-muted max-w-2xl mx-auto text-sm sm:text-base">
          Define test cases for what to accept and reject. Our genetic algorithm mutates expressions against your real data until it finds the optimal surviving pattern.
        </p>

        {/* Presets */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <span className="text-xs text-muted mr-1">Load Preset:</span>
          <button
            type="button"
            onClick={() => loadPreset("email")}
            className="btn btn-secondary btn-sm text-xs"
          >
            Email Addresses
          </button>
          <button
            type="button"
            onClick={() => loadPreset("digits")}
            className="btn btn-secondary btn-sm text-xs"
          >
            Positive Digits
          </button>
          <button
            type="button"
            onClick={() => loadPreset("slug")}
            className="btn btn-secondary btn-sm text-xs"
          >
            URL Slugs / Identifiers
          </button>
        </div>
      </div>

      {/* Editable Passing / Failing Columns */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Should Match (Passing) */}
        <div className="card bg-bg border-line p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 text-success text-base">
              <CheckCircle2 className="w-5 h-5" /> Should Match ({passing.length})
            </h3>
            <span className="text-xs text-muted font-mono">Positive Cases</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newPassing}
              onChange={(e) => setNewPassing(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPassingItem()}
              placeholder="e.g. valid-sample@domain.com"
              aria-label="Add positive test string"
              className="flex-1 bg-field border border-line rounded-lg px-3 py-1.5 text-xs font-mono text-fg outline-none focus:border-success"
            />
            <button
              type="button"
              onClick={addPassingItem}
              className="btn btn-secondary btn-sm text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {passing.map((item, idx) => (
              <div
                key={idx}
                className="bg-success/10 text-success px-3 py-2 rounded-lg border border-success/20 font-mono text-xs flex items-center justify-between gap-2"
              >
                <span className="truncate">{item}</span>
                <button
                  type="button"
                  onClick={() => removePassingItem(idx)}
                  className="opacity-60 hover:opacity-100 hover:text-danger transition-opacity"
                  aria-label={`Remove ${item}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Should Reject (Failing) */}
        <div className="card bg-bg border-line p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 text-danger text-base">
              <XCircle className="w-5 h-5" /> Should Reject ({failing.length})
            </h3>
            <span className="text-xs text-muted font-mono">Negative Cases</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newFailing}
              onChange={(e) => setNewFailing(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFailingItem()}
              placeholder="e.g. invalid@@domain"
              aria-label="Add negative test string"
              className="flex-1 bg-field border border-line rounded-lg px-3 py-1.5 text-xs font-mono text-fg outline-none focus:border-danger"
            />
            <button
              type="button"
              onClick={addFailingItem}
              className="btn btn-secondary btn-sm text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {failing.map((item, idx) => (
              <div
                key={idx}
                className="bg-danger/10 text-danger px-3 py-2 rounded-lg border border-danger/20 font-mono text-xs flex items-center justify-between gap-2"
              >
                <span className="truncate">{item}</span>
                <button
                  type="button"
                  onClick={() => removeFailingItem(idx)}
                  className="opacity-60 hover:opacity-100 hover:text-danger transition-opacity"
                  aria-label={`Remove ${item}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evolution Dashboard */}
      <div className="card p-8 bg-card border-line text-center space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 max-w-xl mx-auto">
          <div className="text-left">
            <div className="text-xs text-muted mb-1 font-semibold uppercase tracking-wider">Generation</div>
            <div className="text-3xl font-extrabold font-mono text-fg">{generation}</div>
          </div>

          <div>
            {!evolving ? (
              <button
                type="button"
                onClick={startEvolution}
                disabled={passing.length === 0}
                className="btn btn-primary gap-2 rounded-full px-8 py-3 text-sm font-bold shadow-lg shadow-primary/20"
              >
                <Play className="w-4 h-4" /> Start Evolution
              </button>
            ) : (
              <button
                type="button"
                onClick={stopEvolution}
                className="btn btn-secondary !bg-red-500/10 !text-red-500 !border-red-500/20 gap-2 rounded-full px-8 py-3 text-sm font-bold"
              >
                <Square className="w-4 h-4" /> Stop Evolution
              </button>
            )}
          </div>

          <div className="text-right">
            <div className="text-xs text-muted mb-1 font-semibold uppercase tracking-wider">Fitness Score</div>
            <div
              className={`text-3xl font-extrabold font-mono ${
                fitness >= 100 ? "text-success" : fitness >= 75 ? "text-accent" : "text-warning"
              }`}
            >
              {fitness.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Best Regex Display */}
        <div className="pt-6 border-t border-line space-y-3">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-accent" /> Best Surviving Regular Expression
            </div>
            {bestRegex && (
              <button
                type="button"
                onClick={copyRegex}
                className="btn btn-secondary btn-sm text-xs gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy Pattern"}
              </button>
            )}
          </div>

          <div className="bg-black text-emerald-400 p-6 rounded-2xl font-mono text-base sm:text-lg overflow-x-auto whitespace-nowrap shadow-inner border border-white/10 max-w-2xl mx-auto">
            {bestRegex || "// Awaiting evolution initiation..."}
          </div>
        </div>
      </div>
    </div>
  );
}
