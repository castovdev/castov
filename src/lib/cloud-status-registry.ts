export interface CloudServiceStatus {
  slug: string;
  name: string;
  category: "AI & LLM" | "Cloud & Hosting" | "Developer Tools" | "APIs & Payments";
  url: string;
  statusPageUrl: string;
  checkUrl: string;
  description: string;
  commonErrors: string[];
  fallbackTip: string;
}

export const CLOUD_SERVICES: CloudServiceStatus[] = [
  {
    slug: "openai",
    name: "OpenAI & ChatGPT API",
    category: "AI & LLM",
    url: "https://openai.com",
    statusPageUrl: "https://status.openai.com",
    checkUrl: "https://api.openai.com/v1/models",
    description: "Status and live health radar for ChatGPT, OpenAI API endpoints, Whisper, and Embeddings.",
    commonErrors: ["502 Bad Gateway", "429 Rate Limit Exceeded", "503 Service Unavailable"],
    fallbackTip: "Switch to Anthropic Claude 3.5 Sonnet or run a local model via Ollama (port 11434)."
  },
  {
    slug: "anthropic",
    name: "Anthropic Claude API",
    category: "AI & LLM",
    url: "https://anthropic.com",
    statusPageUrl: "https://status.anthropic.com",
    checkUrl: "https://api.anthropic.com",
    description: "Live operational status of Claude 3.5 Sonnet, Claude Opus, and Anthropic developer console.",
    commonErrors: ["529 Overloaded", "429 Rate Limit", "500 Internal Error"],
    fallbackTip: "Fallback to OpenAI GPT-4o or DeepSeek R1 while Anthropic services recover."
  },
  {
    slug: "github",
    name: "GitHub & GitHub Actions",
    category: "Developer Tools",
    url: "https://github.com",
    statusPageUrl: "https://www.githubstatus.com",
    checkUrl: "https://api.github.com/zen",
    description: "Real-time incident feed for GitHub Git operations, Webhooks, Actions CI/CD runners, and Packages.",
    commonErrors: ["Webhook Delivery Delays", "Actions Workflow Queued", "Git Push Timeout"],
    fallbackTip: "Queue commits locally or mirror to an alternate Git remote (GitLab/Bitbucket)."
  },
  {
    slug: "vercel",
    name: "Vercel Edge & Deployments",
    category: "Cloud & Hosting",
    url: "https://vercel.com",
    statusPageUrl: "https://www.vercel-status.com",
    checkUrl: "https://api.vercel.com",
    description: "Live status of Vercel Edge Network, Serverless Function execution, and DNS routing.",
    commonErrors: ["FUNCTION_INVOCATION_TIMEOUT", "504 Gateway Timeout", "Deployment Queue Delay"],
    fallbackTip: "Check Edge Function region latency or deploy to preview branches."
  },
  {
    slug: "cloudflare",
    name: "Cloudflare CDN & Workers",
    category: "Cloud & Hosting",
    url: "https://cloudflare.com",
    statusPageUrl: "https://www.cloudflarestatus.com",
    checkUrl: "https://1.1.1.1",
    description: "Global network status, Cloudflare Workers, DNS, and DDoS mitigation availability.",
    commonErrors: ["Error 521 Web Server Down", "Error 522 Connection Timed Out", "Error 525 SSL Handshake Failed"],
    fallbackTip: "Temporarily enable Cloudflare 'Always Online' or bypass CDN proxy during origin maintenance."
  },
  {
    slug: "supabase",
    name: "Supabase & Postgres Edge",
    category: "Developer Tools",
    url: "https://supabase.com",
    statusPageUrl: "https://status.supabase.com",
    checkUrl: "https://api.supabase.com",
    description: "Operational status for Supabase PostgreSQL databases, Auth, Edge Functions, and Realtime sync.",
    commonErrors: ["Database Connection Pool Exhausted", "503 Service Unavailable", "JWT Auth Expired"],
    fallbackTip: "Check connection pooling via Supavisor (Port 6543) or fall back to local Docker Postgres."
  },
  {
    slug: "stripe",
    name: "Stripe Payments & Webhooks",
    category: "APIs & Payments",
    url: "https://stripe.com",
    statusPageUrl: "https://status.stripe.com",
    checkUrl: "https://api.stripe.com/v1",
    description: "Global status of Stripe Checkout, Charge API, Webhook deliveries, and billing engine.",
    commonErrors: ["Webhook Delivery Failure", "API Connection Error", "Card Processing Degraded"],
    fallbackTip: "Enable exponential backoff and replay webhooks from the Stripe Dashboard."
  },
  {
    slug: "npm",
    name: "npm Package Registry",
    category: "Developer Tools",
    url: "https://npmjs.com",
    statusPageUrl: "https://status.npmjs.org",
    checkUrl: "https://registry.npmjs.org",
    description: "Status for npm package installations, downloads, and package publishing.",
    commonErrors: ["503 Service Unavailable", "E500 Registry Error", "Package Publish Timeout"],
    fallbackTip: "Use Cloudflare npm mirror or Yarn/pnpm local caches: npm config set registry https://registry.yarnpkg.com."
  }
];

export function getCloudService(slug: string): CloudServiceStatus | undefined {
  return CLOUD_SERVICES.find(s => s.slug === slug.toLowerCase().trim());
}
