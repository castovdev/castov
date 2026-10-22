export interface CastovExtension {
  id: string;
  name: string;
  shortName: string;
  category: "Security" | "AI & LLM" | "Debugging & Testing" | "Developer Productivity";
  description: string;
  marketplaceUrl: string;
  installCommand: string;
  badge?: string;
  iconName: string;
}

export const CASTOV_EXTENSIONS: CastovExtension[] = [
  {
    id: "dependency-lens-castov",
    name: "Dependency Risk Lens",
    shortName: "Dependency Lens",
    category: "Security",
    description:
      "Supply chain security, typosquatting detector & license compliance auditor for package.json & requirements.txt directly in your editor.",
    marketplaceUrl: "https://marketplace.visualstudio.com/items?itemName=Castov.dependency-lens-castov",
    installCommand: "code --install-extension Castov.dependency-lens-castov",
    badge: "Security",
    iconName: "ShieldAlert",
  },
  {
    id: "mcp-security-castov",
    name: "MCP Config Security Scanner",
    shortName: "MCP Security",
    category: "Security",
    description:
      "Audit Model Context Protocol (MCP) configs, mcp.json, and Claude desktop settings. Detects exposed API keys, unsafe commands, and prompt injection risks.",
    marketplaceUrl: "https://marketplace.visualstudio.com/items?itemName=Castov.mcp-security-castov",
    installCommand: "code --install-extension Castov.mcp-security-castov",
    badge: "MCP",
    iconName: "ShieldCheck",
  },
  {
    id: "bidi-guard-castov",
    name: "Bidi & Unicode Guard",
    shortName: "Bidi Guard",
    category: "Security",
    description:
      "Trojan Source and bidirectional Unicode attack detector. Highlights invisible zero-width characters and homoglyph spoofing in your source code.",
    marketplaceUrl: "https://marketplace.visualstudio.com/items?itemName=Castov.bidi-guard-castov",
    installCommand: "code --install-extension Castov.bidi-guard-castov",
    badge: "Security",
    iconName: "Shield",
  },
  {
    id: "env-doctor-castov",
    name: "Env Doctor",
    shortName: "Env Doctor",
    category: "Security",
    description:
      "Environment variable validator, secret leak auditor, and cross-team .env synchronization tool with zero-knowledge encryption.",
    marketplaceUrl: "https://marketplace.visualstudio.com/items?itemName=Castov.env-doctor-castov",
    installCommand: "code --install-extension Castov.env-doctor-castov",
    badge: "DevOps",
    iconName: "KeyRound",
  },
  {
    id: "token-lens-castov",
    name: "Token Lens (LLM Cost Counter)",
    shortName: "Token Lens",
    category: "AI & LLM",
    description:
      "Real-time token counter & cost calculator for GPT-4o, Claude 3.5, Gemini 1.5, and Llama 3 across highlighted code, prompts, and system messages.",
    marketplaceUrl: "https://marketplace.visualstudio.com/items?itemName=Castov.token-lens-castov",
    installCommand: "code --install-extension Castov.token-lens-castov",
    badge: "AI Tool",
    iconName: "Coins",
  },
  {
    id: "prompt-tester-castov",
    name: "Prompt Tester & Evals",
    shortName: "Prompt Tester",
    category: "AI & LLM",
    description:
      "Run unit tests and regression evals on system prompts across multiple LLM providers directly in VS Code before deploying to production.",
    marketplaceUrl: "https://marketplace.visualstudio.com/items?itemName=Castov.prompt-tester-castov",
    installCommand: "code --install-extension Castov.prompt-tester-castov",
    badge: "Evals",
    iconName: "Sparkles",
  },
  {
    id: "ai-blame-castov",
    name: "AI Blame",
    shortName: "AI Blame",
    category: "AI & LLM",
    description:
      "Code attribution lens that distinguishes between human-written and AI-generated code snippets (Copilot, Cursor, Claude) in git commits.",
    marketplaceUrl: "https://marketplace.visualstudio.com/items?itemName=Castov.ai-blame-castov",
    installCommand: "code --install-extension Castov.ai-blame-castov",
    badge: "Git Lens",
    iconName: "Bot",
  },
  {
    id: "agent-replay-castov",
    name: "Agent Replay",
    shortName: "Agent Replay",
    category: "AI & LLM",
    description:
      "Visual timeline and context window debugger for autonomous AI agent trajectories, step inspects, and tool execution traces.",
    marketplaceUrl: "https://marketplace.visualstudio.com/items?itemName=Castov.agent-replay-castov",
    installCommand: "code --install-extension Castov.agent-replay-castov",
    badge: "Agents",
    iconName: "History",
  },
  {
    id: "mcp-inspector-castov",
    name: "MCP Inspector & Traffic Logger",
    shortName: "MCP Inspector",
    category: "Debugging & Testing",
    description:
      "Interactive debugger, schema validator, and live JSON-RPC traffic monitor for Model Context Protocol servers in VS Code and Cursor.",
    marketplaceUrl: "https://marketplace.visualstudio.com/items?itemName=Castov.mcp-inspector-castov",
    installCommand: "code --install-extension Castov.mcp-inspector-castov",
    badge: "MCP",
    iconName: "TerminalSquare",
  },
  {
    id: "webhook-catcher-castov",
    name: "Webhook Catcher",
    shortName: "Webhook Catcher",
    category: "Debugging & Testing",
    description:
      "Receive, inspect, and replay webhooks (Stripe, GitHub, Shopify) directly inside VS Code without needing external ngrok setups.",
    marketplaceUrl: "https://marketplace.visualstudio.com/items?itemName=Castov.webhook-catcher-castov",
    installCommand: "code --install-extension Castov.webhook-catcher-castov",
    badge: "Webhooks",
    iconName: "Webhook",
  },
  {
    id: "chaos-proxy-castov",
    name: "Chaos Proxy",
    shortName: "Chaos Proxy",
    category: "Debugging & Testing",
    description:
      "Network fault injection tool. Simulate high latency, HTTP 500 drops, and jitter directly on your local dev server requests.",
    marketplaceUrl: "https://marketplace.visualstudio.com/items?itemName=Castov.chaos-proxy-castov",
    installCommand: "code --install-extension Castov.chaos-proxy-castov",
    badge: "Testing",
    iconName: "Flame",
  },
  {
    id: "log-story-castov",
    name: "Log Story",
    shortName: "Log Story",
    category: "Debugging & Testing",
    description:
      "Transform messy server logs and distributed traces into a clean, human-readable visual narrative timeline in VS Code.",
    marketplaceUrl: "https://marketplace.visualstudio.com/items?itemName=Castov.log-story-castov",
    installCommand: "code --install-extension Castov.log-story-castov",
    badge: "Logs",
    iconName: "FileSpreadsheet",
  },
  {
    id: "castov-vscode",
    name: "Castov Developer Suite (Primary)",
    shortName: "Castov Suite",
    category: "Developer Productivity",
    description:
      "The flagship offline developer companion: hover timestamps (UTC/ISO), UUID v4/v7 generators, JWT decoders, and Base64 inspect right at your cursor.",
    marketplaceUrl: "https://marketplace.visualstudio.com/items?itemName=castov.castov-vscode",
    installCommand: "code --install-extension castov.castov-vscode",
    badge: "Official",
    iconName: "Zap",
  },
];
