import React from 'react';
import Link from 'next/link';

export default function GuidePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 text-gray-900 dark:text-gray-100">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/guides" className="hover:underline">Guides</Link> / Shell Execution Risks
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
        The Top 5 Security Risks of Unrestricted Shell Execution in AI Agents
      </h1>

      {/* Intro */}
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed font-medium">
        A <code>run_shell(command: string)</code> tool is the most powerful and most dangerous primitive you can give an agent. It converts any successful prompt injection into arbitrary code execution as your user.
      </p>

      {/* Content Body */}
      <article className="space-y-8 text-base md:text-lg leading-relaxed text-gray-800 dark:text-gray-200">
        
        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">The Engineering Challenge: Five Concrete Risks</h2>
          <ol className="list-decimal pl-6 space-y-3 text-gray-700 dark:text-gray-300">
            <li><strong>Indirect prompt injection:</strong> Reading a README, web page, or issue containing hidden malicious instructions.</li>
            <li><strong>Shell metacharacter injection:</strong> String interpolation breaking commands via quotes or semicolons (e.g., <code>; rm -rf ~</code>).</li>
            <li><strong>Secret exfiltration:</strong> Child processes inheriting environment variables, API keys, and SSH credentials.</li>
            <li><strong>Destructive actions:</strong> Commands like <code>rm -rf</code>, <code>git push --force</code>, or database drops executed by mistake.</li>
            <li><strong>Resource exhaustion:</strong> Fork bombs, infinite loops, and backgrounded processes that outlive the task.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Architecture: Structured Commands, No Shell, Scrubbed Environment</h2>
          <p className="mb-4">
            Replace "run this string" with "run this allowed program with these validated arguments". Never invoke a shell.
          </p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm my-6 border border-gray-800 shadow-lg">
            <code>{`import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";

const execFileAsync = promisify(execFile);

const ALLOWED = {
  git: z.tuple([z.enum(["status", "diff", "log"])]).rest(z.string().max(200)),
  ls: z.array(z.string().max(200)).max(10),
  rg: z.array(z.string().max(200)).min(1).max(10),
} as const;

const request = z.object({
  program: z.enum(["git", "ls", "rg"]),
  args: z.array(z.string()),
});

const SAFE_ENV = { PATH: "/usr/bin:/bin", LANG: "C.UTF-8" }; // no inherited secrets

export async function runCommand(raw: unknown, cwd: string) {
  const { program, args } = request.parse(raw);
  const validatedArgs = ALLOWED[program].parse(args) as string[];

  if (validatedArgs.some((a) => /^--(exec|upload-pack|output)\\b/.test(a))) {
    throw new Error("Disallowed flag");
  }

  const { stdout, stderr } = await execFileAsync(program, validatedArgs, {
    cwd,
    env: SAFE_ENV,
    timeout: 10_000,
    maxBuffer: 256 * 1024,
    shell: false,        // explicit: no shell interpretation
    killSignal: "SIGKILL",
  });
  return { stdout: stdout.slice(0, 20_000), stderr: stderr.slice(0, 5_000) };
}`}</code>
          </pre>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Best Practices and Trade-offs</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Prefer purpose-built tools:</strong> Use <code>read_file</code> or <code>git_diff</code> over a generic shell whenever possible.</li>
            <li><strong>Human approval gates:</strong> Require confirmation for anything mutating, networked, or outside the workspace.</li>
            <li><strong>Enforce strict timeouts:</strong> Ensure process groups are killed cleanly and nothing persists past the call.</li>
          </ul>
        </section>

        <section className="bg-blue-50 dark:bg-gray-800 p-6 rounded-2xl border border-blue-100 dark:border-gray-700 mt-10">
          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Conclusion</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Unrestricted shell access collapses the trust boundary between model text and your machine. Constrain it with structured arguments, minimal environments, and sandboxes. Castov's local-first model keeps execution on hardware you control, which makes explicit policy at this layer both possible and necessary. Read more at{' '}
            <a href="https://castov.com/guides/top-5-security-risks-of-unrestricted-shell-execution-in-ai-agents" className="text-blue-600 dark:text-blue-400 underline font-semibold" target="_blank" rel="noopener noreferrer">
              castov.com/guides/top-5-security-risks-of-unrestricted-shell-execution-in-ai-agents
            </a>.
          </p>
        </section>

      </article>
    </main>
  );
}