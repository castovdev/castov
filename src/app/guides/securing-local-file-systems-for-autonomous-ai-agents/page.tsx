import React from 'react';
import Link from 'next/link';

export default function GuidePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 text-gray-900 dark:text-gray-100">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/guides" className="hover:underline">Guides</Link> / Securing Local File Systems
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
        Securing Local File Systems for Autonomous AI Agents
      </h1>

      {/* Intro */}
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed font-medium">
        An agent with file access can read source code, SSH keys, .env files, and browser profiles, and it can overwrite any of them. Whatever the model's intent, its inputs include untrusted text: web pages, issue comments, PDFs, tool output. Treat every path the model produces as attacker-controlled input.
      </p>

      {/* Content Body */}
      <article className="space-y-8 text-base md:text-lg leading-relaxed text-gray-800 dark:text-gray-200">
        
        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">The Engineering Challenge</h2>
          <p className="mb-4">
            Naive file tools take a path string from the model and pass it to <code>fs.readFile</code>. That fails in four ways:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Path traversal:</strong> <code>../../.ssh/id_ed25519</code> escapes the intended working directory.</li>
            <li><strong>Symlink escape:</strong> A link inside the workspace points to <code>/etc</code> or <code>~</code>. A lexical check on the string passes; the kernel follows the link anyway.</li>
            <li><strong>Unbounded reads and writes:</strong> A 40 GB file read exhausts memory, and an unbounded write fills the disk.</li>
            <li><strong>Sensitive-file access inside the allowed root:</strong> <code>.env</code>, <code>.git/config</code>, and credentials files often live in the project directory.</li>
          </ul>
          <p className="mt-4">
            String-prefix checks (<code>path.startsWith(root)</code>) are not a defense. <code>/work/project-evil</code> starts with <code>/work/project</code>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Architecture: Resolve, Then Verify, Then Open</h2>
          <p className="mb-4">
            The rule is to canonicalize first and authorize second, always against real paths. Resolve symlinks with realpath, compare with path.relative, and reject anything that lands outside an explicit allowlist of roots.
          </p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm my-6 border border-gray-800 shadow-lg">
            <code>{`import { promises as fs } from "node:fs";
import path from "node:path";

export class PathPolicyError extends Error {}

export interface FsPolicy {
  roots: string[];              // absolute, already realpath'd at startup
  denyNames: RegExp[];          // e.g. /^\\.env/, /^id_(rsa|ed25519)/
  maxReadBytes: number;
  maxWriteBytes: number;
}

function isInside(root: string, target: string): boolean {
  const rel = path.relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

export async function resolveSafe(
  policy: FsPolicy,
  requested: string,
  mode: "read" | "write",
): Promise<string> {
  if (requested.includes("\\0")) throw new PathPolicyError("NUL byte in path");

  const absolute = path.resolve(policy.roots[0], requested);

  let real: string;
  if (mode === "write") {
    const parent = await fs.realpath(path.dirname(absolute));
    real = path.join(parent, path.basename(absolute));
  } else {
    real = await fs.realpath(absolute);
  }

  if (!policy.roots.some((r) => isInside(r, real))) {
    throw new PathPolicyError("Path escapes allowed roots");
  }
  if (real.split(path.sep).some((seg) => policy.denyNames.some((d) => d.test(seg)))) {
    throw new PathPolicyError("Path matches deny list");
  }
  return real;
}

export async function readFileSafe(policy: FsPolicy, requested: string): Promise<string> {
  const real = await resolveSafe(policy, requested, "read");
  const stat = await fs.stat(real);
  if (!stat.isFile()) throw new PathPolicyError("Not a regular file");
  if (stat.size > policy.maxReadBytes) throw new PathPolicyError("File exceeds read limit");
  return fs.readFile(real, "utf8");
}`}</code>
          </pre>

          <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-2">
            This code still has a time-of-check/time-of-use gap: a link could be swapped between realpath and open. For hostile environments, open with O_NOFOLLOW or run the tool in a sandbox.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Best Practices and Trade-offs</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Allowlist roots, not denylists.</strong> Denylists are a second layer, not the primary control.</li>
            <li><strong>Separate read and write scopes.</strong> Many agents need to read broadly but write to one directory.</li>
            <li><strong>Cap everything:</strong> file size, directory listing length, files per task.</li>
            <li><strong>Log every access</strong> (resolved path, mode, outcome) to an append-only audit file.</li>
            <li><strong>Require confirmation</strong> for destructive operations such as delete, overwrite, and move.</li>
            <li><strong>Trade-off:</strong> strict policies make agents fail more often. Return precise errors so the model can correct itself.</li>
          </ul>
        </section>

        <section className="bg-blue-50 dark:bg-gray-800 p-6 rounded-2xl border border-blue-100 dark:border-gray-700 mt-10">
          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Conclusion</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            File safety for agents is a path-canonicalization problem plus a scoping problem. Enforce both in the tool layer, not in the prompt. Castov runs agents locally against your own file system, so these policies sit between the model and your disk on your machine. See the full approach at{' '}
            <a href="https://castov.com/guides/securing-local-file-systems-for-autonomous-ai-agents" className="text-blue-600 dark:text-blue-400 underline font-semibold" target="_blank" rel="noopener noreferrer">
              castov.com/guides/securing-local-file-systems-for-autonomous-ai-agents
            </a>.
          </p>
        </section>

      </article>
    </main>
  );
}