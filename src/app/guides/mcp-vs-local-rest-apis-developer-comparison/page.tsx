import React from 'react';
import Link from 'next/link';

export default function GuidePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 text-gray-900 dark:text-gray-100">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/guides" className="hover:underline">Guides</Link> / MCP vs Local REST APIs
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
        Model Context Protocol (MCP) vs Local REST APIs: A Developer Comparison
      </h1>

      {/* Intro */}
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed font-medium">
        You have a capability, such as searching a codebase or querying a local database, and an LLM client needs to call it. You can expose it over the Model Context Protocol (MCP) or as a localhost REST API. They solve overlapping problems with different trade-offs.
      </p>

      {/* Content Body */}
      <article className="space-y-8 text-base md:text-lg leading-relaxed text-gray-800 dark:text-gray-200">
        
        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">The Engineering Challenge</h2>
          <p className="mb-4">
            Both options hit the same questions: how does the client discover what tools exist, how are arguments validated, how is access controlled, and what does it cost to integrate each new client?
          </p>
          
          <div className="overflow-x-auto my-6">
            <table className="w-full text-left border-collapse border border-gray-300 dark:border-gray-700">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="border border-gray-300 dark:border-gray-700 p-3">Concern</th>
                  <th className="border border-gray-300 dark:border-gray-700 p-3">MCP</th>
                  <th className="border border-gray-300 dark:border-gray-700 p-3">Local REST</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 dark:border-gray-700 p-3 font-semibold">Discovery</td>
                  <td className="border border-gray-300 dark:border-gray-700 p-3">Built in (tools/list, typed schemas)</td>
                  <td className="border border-gray-300 dark:border-gray-700 p-3">Custom (OpenAPI or hand-written)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 dark:border-gray-700 p-3 font-semibold">Transport</td>
                  <td className="border border-gray-300 dark:border-gray-700 p-3">stdio or streamable HTTP</td>
                  <td className="border border-gray-300 dark:border-gray-700 p-3">HTTP on a port</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 dark:border-gray-700 p-3 font-semibold">Client integration</td>
                  <td className="border border-gray-300 dark:border-gray-700 p-3">One implementation works with any MCP-aware host</td>
                  <td className="border border-gray-300 dark:border-gray-700 p-3">One adapter per client</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 dark:border-gray-700 p-3 font-semibold">Auth surface</td>
                  <td className="border border-gray-300 dark:border-gray-700 p-3">stdio: process-level trust, no open port</td>
                  <td className="border border-gray-300 dark:border-gray-700 p-3">Open port: needs host checks, tokens</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4">
            The security difference matters most. A localhost HTTP server is reachable by any process on the machine and, through DNS rebinding or cross-site requests, potentially by web pages in your browser. A stdio MCP server has no listening socket at all.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Architecture: One Tool Definition, Two Transports</h2>
          <p className="mb-4">
            Don't pick a protocol and fuse your logic to it. Define the tool once with a Zod schema, then adapt it to each transport.
          </p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm my-6 border border-gray-800 shadow-lg">
            <code>{`import { z } from "zod";
import http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// 1. Transport-agnostic tool definition
const searchInput = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(50).default(10),
});

async function searchCode(args: z.infer<typeof searchInput>) {
  // ...real implementation
  return { matches: [] as { file: string; line: number }[] };
}

// 2a. MCP adapter (stdio: no open port)
export async function startMcp() {
  const server = new McpServer({ name: "local-tools", version: "1.0.0" });
  server.registerTool(
    "search_code",
    { description: "Search the workspace", inputSchema: searchInput.shape },
    async (args) => ({
      content: [{ type: "text", text: JSON.stringify(await searchCode(args)) }],
    }),
  );
  await server.connect(new StdioServerTransport());
}

// 2b. REST adapter (hardened localhost)
export function startRest(token: string, port = 4317) {
  const server = http.createServer(async (req, res) => {
    const host = req.headers.host ?? "";
    const ok =
      (host === \`127.0.0.1:\${port}\` || host === \`localhost:\${port}\`) &&
      req.headers.authorization === \`Bearer \${token}\` &&
      !req.headers.origin; // reject browser-originated requests

    if (!ok) { res.writeHead(403).end(); return; }

    if (req.method === "POST" && req.url === "/tools/search_code") {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const parsed = searchInput.safeParse(JSON.parse(Buffer.concat(chunks).toString() || "{}"));
      if (!parsed.success) { res.writeHead(400).end(JSON.stringify(parsed.error.issues)); return; }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(await searchCode(parsed.data)));
      return;
    }
    res.writeHead(404).end();
  });
  server.listen(port, "127.0.0.1"); // never 0.0.0.0
  return server;
}`}</code>
          </pre>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Best Practices and Trade-offs</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Choose MCP</strong> when you want interoperability with multiple hosts and no open port.</li>
            <li><strong>Choose REST</strong> when non-LLM consumers (scripts, dashboards, CI) also need the capability.</li>
            <li>If you open a port: bind to 127.0.0.1, validate the Host header, require a bearer token, and reject Origin headers.</li>
            <li>Validate at the boundary in both cases. MCP's schema advertisement does not mean clients send valid input.</li>
          </ul>
        </section>

        <section className="bg-blue-50 dark:bg-gray-800 p-6 rounded-2xl border border-blue-100 dark:border-gray-700 mt-10">
          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Conclusion</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            The protocol is a transport decision; the tool contract is the asset. Keep it transport-agnostic and local. Castov follows this model: local-first tools with explicit schemas, with no cloud hop in the tool path. More at{' '}
            <a href="https://castov.com/guides/mcp-vs-local-rest-apis-developer-comparison" className="text-blue-600 dark:text-blue-400 underline font-semibold" target="_blank" rel="noopener noreferrer">
              castov.com/guides/mcp-vs-local-rest-apis-developer-comparison
            </a>.
          </p>
        </section>

      </article>
    </main>
  );
}