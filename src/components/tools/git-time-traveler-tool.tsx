"use client";

import React, { useState } from "react";
import { Copy, Check, AlertTriangle, ShieldCheck, Terminal, ArrowRight, RefreshCw, GitBranch } from "lucide-react";

interface DisasterScenario {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  commands: string[];
  explanation: string[];
  safeTip: string;
}

const SCENARIOS: DisasterScenario[] = [
  {
    id: "lost-commits-reset-hard",
    title: "I ran 'git reset --hard' and lost all my commits!",
    description: "You reset your branch and thought your unpushed commits were destroyed forever.",
    severity: "critical",
    commands: [
      "# 1. View Git's local reference ledger (history of HEAD moves)",
      "git reflog",
      "# 2. Find the commit hash before the reset (e.g., HEAD@{1})",
      "# 3. Restore your branch to that exact moment:",
      "git reset --hard HEAD@{1}",
    ],
    explanation: [
      "Git almost never deletes commit objects immediately. 'git reflog' records every single move of HEAD.",
      "Even if you discarded commits with --hard, they are still present in your local Git database for at least 30 days.",
    ],
    safeTip: "Always check 'git reflog' first before panicking. Your work is almost certainly intact.",
  },
  {
    id: "committed-secrets",
    title: "I committed an API key / secret to GitHub!",
    description: "You committed an .env file or private token and pushed it to a public remote repo.",
    severity: "critical",
    commands: [
      "# 1. IMMEDIATELY revoke and rotate the exposed secret on the provider dashboard!",
      "# 2. Remove the file from Git index without deleting it locally:",
      "git rm --cached .env",
      "echo '.env' >> .gitignore",
      "git commit -m 'chore: remove secrets from tracking'",
      "# 3. Completely purge the secret from Git history using filter-repo:",
      "npx git-filter-repo --invert-paths --path .env --force",
      "git push origin --force --all",
    ],
    explanation: [
      "Committing an API key means web scrapers index it within seconds.",
      "A simple git revert does NOT remove the key from history; you must rotate it and rewrite history.",
    ],
    safeTip: "Always assume an exposed API key is compromised the instant 'git push' succeeds. Revoke it first.",
  },
  {
    id: "wrong-branch",
    title: "I wrote code on 'main' instead of a feature branch!",
    description: "You made several commits directly on the main/production branch by mistake.",
    severity: "warning",
    commands: [
      "# 1. Create and switch to a new feature branch with your current work:",
      "git branch feature/my-new-feature",
      "# 2. Reset the main branch back to the remote origin state:",
      "git reset --hard origin/main",
      "# 3. Switch over to your new branch with all your changes preserved:",
      "git checkout feature/my-new-feature",
    ],
    explanation: [
      "Creating a new branch from your current state copies the exact commit pointer.",
      "Then you safely rewind 'main' back to match origin without losing a single line.",
    ],
    safeTip: "No stash required! 'git branch <name>' snapshots your current commits immediately.",
  },
  {
    id: "undo-last-commit",
    title: "I made a commit but forgot to add files or made a typo!",
    description: "You want to undo the last commit but keep all your edited code intact in your editor.",
    severity: "info",
    commands: [
      "# 1. Undo the commit, keeping all changes staged in your working directory:",
      "git reset --soft HEAD~1",
      "# 2. Or modify the last commit directly without creating a new one:",
      "git add .",
      "git commit --amend --no-edit",
    ],
    explanation: [
      "--soft rewinds the commit history pointer by 1 step without touching your file contents.",
      "--amend replaces the previous commit with the current staged changes.",
    ],
    safeTip: "Never use --hard unless you genuinely intend to delete your code.",
  },
  {
    id: "merge-conflict-escape",
    title: "I'm trapped in a messy merge conflict and want to abort!",
    description: "You ran 'git merge' or 'git rebase' and now your terminal is full of conflict markers.",
    severity: "warning",
    commands: [
      "# If you are merging:",
      "git merge --abort",
      "# If you are rebasing:",
      "git rebase --abort",
      "# If you were cherry-picking:",
      "git cherry-pick --abort",
    ],
    explanation: [
      "These commands instantly restore your working directory to the clean state before the operation started.",
      "It completely cleans all <<<<<<< and >>>>>>> conflict markers from your code.",
    ],
    safeTip: "You are never trapped in a merge. '--abort' is your universal emergency exit.",
  },
];

export function GitTimeTravelerTool() {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCommand = (cmd: string, index: number) => {
    // Strip comments if copying
    const cleanCmd = cmd
      .split("\n")
      .filter((l) => !l.startsWith("#"))
      .join("\n");
    navigator.clipboard.writeText(cleanCmd);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(selectedScenario.commands.join("\n"));
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Header Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-field border border-line">
        <div className="flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-[#2563eb]" />
          <span className="text-xs font-semibold text-muted">Pick Your Git Emergency:</span>
        </div>

        <button
          type="button"
          onClick={copyAll}
          className="btn bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-bold px-4 py-1.5 shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2"
        >
          {copiedIndex === -1 ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
          {copiedIndex === -1 ? "Copied All Steps!" : "Copy Rescue Script"}
        </button>
      </div>

      {/* Grid of Scenarios */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SCENARIOS.map((s) => {
          const active = s.id === selectedScenario.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedScenario(s)}
              className={`p-4 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                active
                  ? "bg-bg border-[#2563eb] shadow-md ring-1 ring-[#2563eb]"
                  : "bg-field border-line hover:border-muted/50"
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {s.severity === "critical" && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30 uppercase">
                      Critical
                    </span>
                  )}
                  {s.severity === "warning" && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 uppercase">
                      Urgent
                    </span>
                  )}
                  {s.severity === "info" && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30 uppercase">
                      Safe Fix
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-fg leading-snug">{s.title}</h4>
              </div>
              <p className="text-[11px] text-muted mt-2 line-clamp-2">{s.description}</p>
            </button>
          );
        })}
      </div>

      {/* Rescue Plan Details */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Interactive Commands */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-field border border-line space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                <Terminal className="w-4 h-4 text-accent" />
                Step-by-Step Terminal Commands
              </h3>
              <span className="text-[11px] font-mono text-muted">Run in project root</span>
            </div>

            <div className="space-y-2">
              {selectedScenario.commands.map((cmd, idx) => {
                const isComment = cmd.startsWith("#");
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between font-mono text-xs ${
                      isComment
                        ? "bg-bg/40 border-transparent text-muted italic"
                        : "bg-bg border-line text-emerald-400 group"
                    }`}
                  >
                    <span className="truncate pr-2">{cmd}</span>
                    {!isComment && (
                      <button
                        type="button"
                        onClick={() => copyCommand(cmd, idx)}
                        className="p-1.5 rounded-lg bg-field hover:bg-hover text-muted hover:text-fg border border-line transition cursor-pointer"
                        title="Copy command"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Explanations & Safety Tips */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-field border border-line space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Why This Works (Under The Hood)
            </h3>

            <div className="space-y-3">
              {selectedScenario.explanation.map((exp, i) => (
                <p key={i} className="text-xs text-fg/80 leading-relaxed">
                  {exp}
                </p>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Golden Rule:</strong>
                {selectedScenario.safeTip}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
