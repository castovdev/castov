"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, Terminal, ArrowRight } from "lucide-react";

interface PermSet {
  read: boolean;
  write: boolean;
  execute: boolean;
}

const PRESETS = [
  { code: "777", label: "Full Access (rwxrwxrwx)", desc: "Everyone can read, write, execute. Insecure." },
  { code: "755", label: "Standard Executable (rwxr-xr-x)", desc: "Owner has full access, others can read & execute." },
  { code: "644", label: "Standard File (rw-r--r--)", desc: "Owner can read & write, others can only read." },
  { code: "600", label: "Private File (rw-------)", desc: "Only owner can read & write (ideal for SSH keys)." },
  { code: "700", label: "Private Directory (rwx------)", desc: "Only owner has full control." },
  { code: "666", label: "Read & Write All (rw-rw-rw-)", desc: "All users can read and write without execution." },
  { code: "400", label: "Read-Only Owner (r--------)", desc: "Strict read-only for file owner." },
];

function permsToDigit(p: PermSet): number {
  return (p.read ? 4 : 0) + (p.write ? 2 : 0) + (p.execute ? 1 : 0);
}

function digitToPerms(d: number): PermSet {
  return {
    read: (d & 4) !== 0,
    write: (d & 2) !== 0,
    execute: (d & 1) !== 0,
  };
}

function permsToString(p: PermSet): string {
  return `${p.read ? "r" : "-"}${p.write ? "w" : "-"}${p.execute ? "x" : "-"}`;
}

function describeRole(p: PermSet): string {
  const parts: string[] = [];
  if (p.read) parts.push("Read");
  if (p.write) parts.push("Write");
  if (p.execute) parts.push("Execute");
  return parts.length > 0 ? parts.join(", ") : "No permissions";
}

export function ChmodCalculatorClient() {
  const [owner, setOwner] = useState<PermSet>({ read: true, write: true, execute: true }); // 7
  const [group, setGroup] = useState<PermSet>({ read: true, write: false, execute: true }); // 5
  const [publicPerms, setPublicPerms] = useState<PermSet>({ read: true, write: false, execute: true }); // 5
  const [copied, setCopied] = useState<string | null>(null);

  const ownerDigit = permsToDigit(owner);
  const groupDigit = permsToDigit(group);
  const publicDigit = permsToDigit(publicPerms);
  const octal = `${ownerDigit}${groupDigit}${publicDigit}`;
  const symbolic = `-${permsToString(owner)}${permsToString(group)}${permsToString(publicPerms)}`;
  const chmodCommand = `chmod ${octal} filename`;

  const handleOctalChange = (val: string) => {
    const clean = val.replace(/[^0-7]/g, "").slice(0, 3);
    if (clean.length === 3) {
      setOwner(digitToPerms(parseInt(clean[0], 10)));
      setGroup(digitToPerms(parseInt(clean[1], 10)));
      setPublicPerms(digitToPerms(parseInt(clean[2], 10)));
    }
  };

  const applyPreset = (code: string) => {
    setOwner(digitToPerms(parseInt(code[0], 10)));
    setGroup(digitToPerms(parseInt(code[1], 10)));
    setPublicPerms(digitToPerms(parseInt(code[2], 10)));
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Result Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-card border border-line rounded-2xl shadow-sm text-center">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
            Octal Notation
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-4xl font-extrabold text-accent">{octal}</span>
            <button
              onClick={() => copyText(octal, "octal")}
              className="p-1.5 rounded-lg hover:bg-hover text-muted hover:text-fg transition-colors"
              aria-label="Copy octal code"
            >
              {copied === "octal" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="p-5 bg-card border border-line rounded-2xl shadow-sm text-center">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
            Symbolic Notation
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-2xl font-bold text-fg">{symbolic}</span>
            <button
              onClick={() => copyText(symbolic, "symbolic")}
              className="p-1.5 rounded-lg hover:bg-hover text-muted hover:text-fg transition-colors"
              aria-label="Copy symbolic notation"
            >
              {copied === "symbolic" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="p-5 bg-card border border-line rounded-2xl shadow-sm text-center">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
            Command
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-sm font-semibold text-fg bg-field px-3 py-1.5 rounded-lg border border-line">
              {chmodCommand}
            </span>
            <button
              onClick={() => copyText(chmodCommand, "cmd")}
              className="p-1.5 rounded-lg hover:bg-hover text-muted hover:text-fg transition-colors"
              aria-label="Copy command"
            >
              {copied === "cmd" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Permission Checkbox Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Owner */}
        <div className="card p-6 border-line bg-card space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="font-bold text-fg text-lg">Owner (User)</h3>
              <p className="text-xs text-muted">File owner permissions</p>
            </div>
            <span className="font-mono text-2xl font-bold text-accent">{ownerDigit}</span>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={owner.read}
                onChange={(e) => setOwner({ ...owner, read: e.target.checked })}
                className="w-4 h-4 rounded border-line text-accent accent-accent focus:ring-accent"
              />
              <span className="text-sm font-medium text-fg">Read (r - 4)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={owner.write}
                onChange={(e) => setOwner({ ...owner, write: e.target.checked })}
                className="w-4 h-4 rounded border-line text-accent accent-accent focus:ring-accent"
              />
              <span className="text-sm font-medium text-fg">Write (w - 2)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={owner.execute}
                onChange={(e) => setOwner({ ...owner, execute: e.target.checked })}
                className="w-4 h-4 rounded border-line text-accent accent-accent focus:ring-accent"
              />
              <span className="text-sm font-medium text-fg">Execute (x - 1)</span>
            </label>
          </div>

          <div className="pt-2 border-t border-line text-xs text-muted">
            Grants: <strong className="text-fg">{describeRole(owner)}</strong>
          </div>
        </div>

        {/* Group */}
        <div className="card p-6 border-line bg-card space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="font-bold text-fg text-lg">Group</h3>
              <p className="text-xs text-muted">User group permissions</p>
            </div>
            <span className="font-mono text-2xl font-bold text-accent">{groupDigit}</span>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={group.read}
                onChange={(e) => setGroup({ ...group, read: e.target.checked })}
                className="w-4 h-4 rounded border-line text-accent accent-accent focus:ring-accent"
              />
              <span className="text-sm font-medium text-fg">Read (r - 4)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={group.write}
                onChange={(e) => setGroup({ ...group, write: e.target.checked })}
                className="w-4 h-4 rounded border-line text-accent accent-accent focus:ring-accent"
              />
              <span className="text-sm font-medium text-fg">Write (w - 2)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={group.execute}
                onChange={(e) => setGroup({ ...group, execute: e.target.checked })}
                className="w-4 h-4 rounded border-line text-accent accent-accent focus:ring-accent"
              />
              <span className="text-sm font-medium text-fg">Execute (x - 1)</span>
            </label>
          </div>

          <div className="pt-2 border-t border-line text-xs text-muted">
            Grants: <strong className="text-fg">{describeRole(group)}</strong>
          </div>
        </div>

        {/* Public / Others */}
        <div className="card p-6 border-line bg-card space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="font-bold text-fg text-lg">Public (Others)</h3>
              <p className="text-xs text-muted">All other users permissions</p>
            </div>
            <span className="font-mono text-2xl font-bold text-accent">{publicDigit}</span>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={publicPerms.read}
                onChange={(e) => setPublicPerms({ ...publicPerms, read: e.target.checked })}
                className="w-4 h-4 rounded border-line text-accent accent-accent focus:ring-accent"
              />
              <span className="text-sm font-medium text-fg">Read (r - 4)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={publicPerms.write}
                onChange={(e) => setPublicPerms({ ...publicPerms, write: e.target.checked })}
                className="w-4 h-4 rounded border-line text-accent accent-accent focus:ring-accent"
              />
              <span className="text-sm font-medium text-fg">Write (w - 2)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={publicPerms.execute}
                onChange={(e) => setPublicPerms({ ...publicPerms, execute: e.target.checked })}
                className="w-4 h-4 rounded border-line text-accent accent-accent focus:ring-accent"
              />
              <span className="text-sm font-medium text-fg">Execute (x - 1)</span>
            </label>
          </div>

          <div className="pt-2 border-t border-line text-xs text-muted">
            Grants: <strong className="text-fg">{describeRole(publicPerms)}</strong>
          </div>
        </div>
      </div>

      {/* Manual Direct Input */}
      <div className="p-6 bg-card border border-line rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-fg">Quick Octal Input</h4>
          <p className="text-xs text-muted">Type any 3-digit octal value (000–777) to update the matrix instantly:</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={octal}
            onChange={(e) => handleOctalChange(e.target.value)}
            maxLength={3}
            aria-label="Direct 3-digit octal input"
            className="w-24 text-center font-mono text-2xl font-bold bg-field border border-line rounded-xl px-3 py-1.5 text-accent outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Popular Presets & Subroute Links */}
      <div className="space-y-4">
        <h3 className="font-bold text-fg text-lg flex items-center gap-2">
          <Terminal className="w-5 h-5 text-accent" /> Popular Chmod Presets &amp; Direct Explanations
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESETS.map((p) => (
            <div
              key={p.code}
              className="p-4 rounded-xl bg-card border border-line hover:border-accent/40 transition-all flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <button
                    type="button"
                    onClick={() => applyPreset(p.code)}
                    className="font-mono font-extrabold text-lg text-accent hover:underline text-left"
                  >
                    chmod {p.code}
                  </button>
                  <Link
                    href={`/chmod/${p.code}`}
                    className="text-xs text-muted hover:text-accent flex items-center gap-1"
                    title={`View dedicated page for chmod ${p.code}`}
                  >
                    Guide <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="text-xs font-semibold text-fg">{p.label}</div>
                <p className="text-xs text-muted mt-1">{p.desc}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-line/60">
                <button
                  type="button"
                  onClick={() => applyPreset(p.code)}
                  className="btn btn-secondary btn-sm flex-1 text-xs"
                >
                  Set in Calculator
                </button>
                <Link
                  href={`/chmod/${p.code}`}
                  className="btn btn-primary btn-sm text-xs px-3"
                >
                  Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
