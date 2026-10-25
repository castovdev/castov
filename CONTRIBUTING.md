# Contributing to Castov

Thank you for your interest in contributing to **Castov**! We welcome contributions from developers worldwide to help build the fastest, most private, and most reliable developer execution layer.

---

## 🧭 Code of Conduct & Core Philosophy

Castov is built on three unshakeable principles:
1. **Zero Payload Logging**: Tools must execute 100% client-side in the browser or locally in the terminal. No user input or secrets may ever be sent to remote analytics servers.
2. **Sub-Millisecond Performance**: Zero unnecessary network round-trips. Instant reactivity.
3. **Deterministic Output**: Always prefer standard Web APIs (`crypto.subtle`, `crypto.getRandomValues`, `TextEncoder`, standard IANA timezones) over unverified dependencies.

---

## 🛠️ Development Setup

Castov is a monorepo built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **Vitest**.

### Prerequisites
- **Node.js**: `v20.9.0` or higher
- **npm**: `v10.0.0` or higher

### 1. Fork & Clone
```bash
git clone https://github.com/YOUR_USERNAME/castov.git
cd castov
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚡ How to Add a New Web Tool (in 5 Minutes)

Every tool in Castov follows a clean, modular structure:

### Step 1: Define Tool Metadata in `src/content/tools.ts`
Add your tool definition to the `TOOLS` array:
```typescript
{
  slug: "my-awesome-tool",
  name: "My Awesome Tool",
  category: "data", // "time" | "crypto" | "data" | "network" | "frontend" | "ai"
  intro: "A concise 1-sentence explanation of what this tool does.",
  seoTitle: "My Awesome Tool Online | Fast & Private | Castov",
  metaDescription: "Instant in-browser tool for developers with zero tracking.",
  sections: [
    {
      heading: "How it works",
      paragraphs: ["Detailed explanation for developers and SEO."]
    }
  ],
  howTo: [
    "Step 1: Paste or enter your input.",
    "Step 2: Choose your formatting options.",
    "Step 3: Copy the deterministic output."
  ]
}
```

### Step 2: Build the Component in `src/components/tools/`
Create `src/components/tools/my-awesome-tool.tsx`:
```tsx
"use client";

import { useState } from "react";
import { CopyButton } from "@/components/ui/copy-button";

export function MyAwesomeTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleProcess = () => {
    // 100% Client-side processing
    setOutput(input.toUpperCase());
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="field-label">Input</label>
        <textarea
          className="input input-mono w-full h-32"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste input here..."
        />
      </div>
      <button onClick={handleProcess} className="btn btn-primary">
        Process
      </button>
      {output && (
        <div className="card p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase text-muted">Result</span>
            <CopyButton text={output} />
          </div>
          <pre className="font-mono text-sm overflow-x-auto">{output}</pre>
        </div>
      )}
    </div>
  );
}
```

### Step 3: Register in `src/components/tool-interface.tsx`
Import your component and add a switch case:
```tsx
import { MyAwesomeTool } from "./tools/my-awesome-tool";

// In ToolInterface switch:
case "my-awesome-tool":
  return <MyAwesomeTool />;
```

### Step 4: Verify Integrity
Run the automated verification suite:
```bash
npm run typecheck       # Must pass with 0 TypeScript errors
npm run audit:links     # Verifies route integrity and link validity
npm test                # Runs the full Vitest suite
```

---

## 🤖 Adding or Modifying CLI / MCP Tools

The Castov CLI and MCP Server live in `packages/castov-cli`:

1. Core logic lives in `packages/castov-cli/src/engine.ts`.
2. MCP tool handlers live in `packages/castov-cli/src/mcp-server.ts`.
3. CLI command flags live in `packages/castov-cli/src/cli.ts`.

Test CLI changes:
```bash
cd packages/castov-cli
npm test
```

---

## 🧪 Testing Guidelines

Before opening a Pull Request, please ensure:
1. `npm run typecheck` passes with zero errors.
2. `npm run audit:links` confirms zero broken links or invalid routes.
3. `npm test` passes all test suites.
4. All code changes adhere to the repository's ESLint configuration.

---

## 📬 Submitting a Pull Request (PR)

1. Create a feature branch:
   ```bash
   git checkout -b feature/my-new-tool
   ```
2. Commit your changes with descriptive Conventional Commits (e.g., `feat(tools): add YAML to JSON converter`):
   ```bash
   git commit -m "feat(tools): add YAML to JSON converter"
   ```
3. Push to your fork:
   ```bash
   git push origin feature/my-new-tool
   ```
4. Open a Pull Request on GitHub against the `main` branch.

We review and merge community PRs quickly! 🚀
