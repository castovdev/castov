import React from 'react';
import Link from 'next/link';

export default function GuidePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 text-gray-900 dark:text-gray-100">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/guides" className="hover:underline">Guides</Link> / Zod Schemas for Agents
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
        Designing Deterministic Schema Interfaces Using Zod for Agentic Pipelines
      </h1>

      {/* Intro */}
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed font-medium">
        LLM output is probabilistic; your pipeline shouldn't be. Every boundary where model text becomes program input needs a contract that is enforced at runtime, not hoped for.
      </p>

      {/* Content Body */}
      <article className="space-y-8 text-base md:text-lg leading-relaxed text-gray-800 dark:text-gray-200">
        
        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">The Engineering Challenge</h2>
          <p className="mb-4">
            Without enforced schemas, agent pipelines fail in quiet ways: types drift, unexpected keys slip through, unions become ambiguous, and validation errors are swallowed. TypeScript types vanish entirely at runtime, offering no validation for raw JSON from models.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Architecture: Strict, Discriminated, Bounded, Self-Repairing</h2>
          <p className="mb-4">
            Four design rules govern robust schemas: strict object keys, discriminated unions on action fields, strict bounds on sizes and lengths, and self-repair loops fed back to the model.
          </p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm my-6 border border-gray-800 shadow-lg">
            <code>{`import { z } from "zod";

const ReadFile = z.strictObject({
  action: z.literal("read_file"),
  path: z.string().min(1).max(500),
});

const WriteFile = z.strictObject({
  action: z.literal("write_file"),
  path: z.string().min(1).max(500),
  content: z.string().max(100_000),
  overwrite: z.boolean().default(false),
});

const Search = z.strictObject({
  action: z.literal("search"),
  query: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(50).default(10),
});

export const AgentAction = z.discriminatedUnion("action", [ReadFile, WriteFile, Search]);
export type AgentAction = z.infer<typeof AgentAction>;

// Publish the same schema to the model as JSON Schema
export const actionJsonSchema = z.toJSONSchema(AgentAction);

type ModelCall = (messages: { role: "user" | "assistant"; content: string }[]) => Promise<string>;

export async function getValidAction(
  callModel: ModelCall,
  prompt: string,
  maxAttempts = 3,
): Promise<AgentAction> {
  const messages: { role: "user" | "assistant"; content: string }[] = [
    { role: "user", content: prompt },
  ];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const text = await callModel(messages);

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      messages.push(
        { role: "assistant", content: text },
        { role: "user", content: "Output was not valid JSON. Return only a JSON object." },
      );
      continue;
    }

    const result = AgentAction.safeParse(json);
    if (result.success) return result.data;

    const issues = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    messages.push(
      { role: "assistant", content: text },
      { role: "user", content: \`Schema validation failed: \${JSON.stringify(issues)}. Fix and resend.\` },
    );
  }
  throw new Error(\`No valid action after \${maxAttempts} attempts\`);
}`}</code>
          </pre>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Best Practices and Trade-offs</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Validate on both sides:</strong> Check model outputs into the pipeline and tool arguments before execution.</li>
            <li><strong>Use safeParse:</strong> Never use plain parse at model boundaries since failures are expected and recoverable.</li>
            <li><strong>Keep schemas small:</strong> Deeply nested structures raise error rates; split into multi-step actions instead.</li>
          </ul>
        </section>

        <section className="bg-blue-50 dark:bg-gray-800 p-6 rounded-2xl border border-blue-100 dark:border-gray-700 mt-10">
          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Conclusion</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Determinism in an agent pipeline comes from contracts at every boundary, not from better prompting. Zod gives you one definition that serves as runtime validation, static types, and model-facing documentation. Castov's local-first architecture runs these validation layers next to your tools, so contracts are enforced where execution happens. Learn more at{' '}
            <a href="https://castov.com/guides/designing-deterministic-schema-interfaces-with-zod-for-agentic-pipelines" className="text-blue-600 dark:text-blue-400 underline font-semibold" target="_blank" rel="noopener noreferrer">
              castov.com/guides/designing-deterministic-schema-interfaces-with-zod-for-agentic-pipelines
            </a>.
          </p>
        </section>

      </article>
    </main>
  );
}