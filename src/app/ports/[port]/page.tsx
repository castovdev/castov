import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { NETWORK_PORTS, getPortByNumber } from "@/lib/network-ports-registry";
import { buildMetadata, breadcrumbJsonLd, faqJsonLd, howToJsonLd, softwareAppJsonLd, techArticleJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { SponsorSlot } from "@/components/sponsor-slot";
import { Terminal } from "lucide-react";

export function generateStaticParams() {
  return NETWORK_PORTS.map((p) => ({ port: String(p.port) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ port: string }>;
}): Promise<Metadata> {
  const { port } = await params;
  const info = getPortByNumber(Number(port));
  if (!info) return {};

  return buildMetadata({
    title: `Port ${info.port} (${info.service}) – What Is It, How to Check & Kill Process`,
    description: `Complete developer guide for Port ${info.port} (${info.service} over ${info.protocol}). Learn how to check if port ${info.port} is open, kill EADDRINUSE processes on Linux/Mac/Windows, and configure Docker & firewalls.`,
    path: `/ports/${info.port}`,
  });
}

export default async function NetworkPortPage({
  params,
}: {
  params: Promise<{ port: string }>;
}) {
  const { port } = await params;
  const info = getPortByNumber(Number(port));
  if (!info) notFound();

  const faqs = [
    {
      q: `What is Port ${info.port} used for?`,
      a: `Port ${info.port} is the standard network port for ${info.service} (${info.summary}) operating over ${info.protocol}. The typical system daemon or process is ${info.defaultProcess}.`,
    },
    {
      q: `How do I kill a process running on Port ${info.port} (EADDRINUSE)?`,
      a: `Run npx castov port ${info.port} --kill in any terminal, or on macOS/Linux run: lsof -ti:${info.port} | xargs kill -9. On Windows PowerShell/CMD, run: netstat -ano | findstr :${info.port} and then taskkill /PID <PID> /F.`,
    },
    {
      q: `Is it safe to expose Port ${info.port} to the internet?`,
      a: `Port ${info.port} has a ${info.riskLevel} security risk profile. ${info.description}`,
    },
  ];

  const portHowToSteps = [
    {
      name: `Inspect Port ${info.port} with Castov CLI`,
      text: `Run npx castov port ${info.port} to inspect active listeners and protocol metadata for ${info.service}.`,
    },
    {
      name: `Check Listening PID on macOS / Linux / Windows`,
      text: `Run lsof -i :${info.port} on Unix or netstat -ano | findstr :${info.port} on Windows to find the process ID.`,
    },
    {
      name: `Free Port ${info.port} (Resolve EADDRINUSE)`,
      text: `Execute npx castov port ${info.port} --kill or lsof -ti:${info.port} | xargs kill -9 to terminate the conflicting process.`,
    },
  ];

  const riskColor =
    info.riskLevel === "Critical"
      ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
      : info.riskLevel === "High"
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      : info.riskLevel === "Medium"
      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";

  return (
    <div className="layout-content py-10 space-y-10">
      <JsonLd
        data={[
          breadcrumbJsonLd(
            [
              { name: "Home", href: "/" },
              { name: "Network Ports", href: "/ports" },
              { name: `Port ${info.port} (${info.service})` },
            ],
            `/ports/${info.port}`
          ),
          softwareAppJsonLd({
            name: `Port ${info.port} (${info.service}) Inspector & Process Killer`,
            description: info.description,
            url: `/ports/${info.port}`,
            category: "DeveloperApplication",
          }),
          techArticleJsonLd({
            headline: `Port ${info.port} (${info.service}) – Protocol, Security & EADDRINUSE Fix`,
            description: info.description,
            path: `/ports/${info.port}`,
            dependencies: `${info.protocol} Port ${info.port}, Castov CLI (npx castov port ${info.port})`,
          }),
          howToJsonLd({
            name: `How to Check and Kill Process on Port ${info.port} (${info.service})`,
            description: `Step-by-step instructions to diagnose and free TCP/UDP Port ${info.port} (${info.service}).`,
            steps: portHowToSteps,
          }),
          faqJsonLd(faqs),
        ]}
      />

      <nav aria-label="Breadcrumb" className="text-xs text-muted flex items-center gap-2">
        <Link href="/" className="hover:text-fg">Home</Link>
        <span>/</span>
        <Link href="/ports" className="hover:text-fg">Ports &amp; Subnets</Link>
        <span>/</span>
        <span className="text-fg font-semibold">Port {info.port}</span>
      </nav>

      {/* Hero Header */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold font-mono">
            PORT {info.port} / {info.protocol}
          </span>
          <span className="px-3 py-1 rounded-full bg-field border border-line text-muted text-xs font-medium">
            {info.category}
          </span>
          <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${riskColor}`}>
            Exposure Risk: {info.riskLevel}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
          Port {info.port}: {info.service} — {info.summary}
        </h1>
        <p className="text-muted max-w-3xl text-sm sm:text-base leading-relaxed">
          {info.description}
        </p>
      </header>

      {/* Quick Specs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-line">
          <div className="text-xs text-muted uppercase font-semibold mb-1">Default Service</div>
          <div className="text-xl font-bold text-fg">{info.service}</div>
          <div className="text-xs font-mono text-muted mt-1">Process: {info.defaultProcess}</div>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-line">
          <div className="text-xs text-muted uppercase font-semibold mb-1">Transport Protocol</div>
          <div className="text-xl font-bold font-mono text-accent">{info.protocol}</div>
          <div className="text-xs text-muted mt-1">IANA Registered Port {info.port}</div>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-line">
          <div className="text-xs text-muted uppercase font-semibold mb-1">Docker Port Flag</div>
          <div className="text-xl font-bold font-mono text-fg">{info.dockerFlag}</div>
          <div className="text-xs text-muted mt-1">Container to Host Mapping</div>
        </div>
      </div>

      {/* Terminal Commands Reference */}
      <section className="bg-card border border-line rounded-2xl p-6 space-y-6 shadow-sm">
        <h2 className="text-xl font-bold text-fg flex items-center gap-2">
          <Terminal className="w-5 h-5 text-accent" />
          How to Check &amp; Kill Process on Port {info.port} (EADDRINUSE Fix)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-field border border-line space-y-2">
            <div className="text-xs font-bold text-fg uppercase">macOS &amp; Linux (lsof / kill)</div>
            <pre className="text-xs font-mono text-fg overflow-x-auto p-3 rounded-lg bg-card border border-line">
{`# Find process using port ${info.port}
sudo lsof -i :${info.port}

# Instantly kill process on port ${info.port}
lsof -ti:${info.port} | xargs kill -9`}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-field border border-line space-y-2">
            <div className="text-xs font-bold text-fg uppercase">Windows (PowerShell &amp; CMD)</div>
            <pre className="text-xs font-mono text-fg overflow-x-auto p-3 rounded-lg bg-card border border-line">
{`# Find PID listening on port ${info.port}
netstat -ano | findstr :${info.port}

# Force kill by PID
taskkill /PID <PID_NUMBER> /F`}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-field border border-line space-y-2">
            <div className="text-xs font-bold text-fg uppercase">Cross-Platform Node.js One-Liner</div>
            <pre className="text-xs font-mono text-fg overflow-x-auto p-3 rounded-lg bg-card border border-line">
{`# Kill port ${info.port} via npx
npx kill-port ${info.port}

# Or diagnose via Castov CLI
npx castov fix "EADDRINUSE :::${info.port}"`}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-field border border-line space-y-2">
            <div className="text-xs font-bold text-fg uppercase">Linux Firewall (UFW) &amp; Connectivity Test</div>
            <pre className="text-xs font-mono text-fg overflow-x-auto p-3 rounded-lg bg-card border border-line">
{`# Test if port ${info.port} is reachable
nc -zv localhost ${info.port}

# Allow or deny port ${info.port} in UFW
sudo ufw allow ${info.port}/tcp`}
            </pre>
          </div>
        </div>
      </section>

      <SponsorSlot context="network" />

      {/* FAQ Section */}
      <section className="bg-card border border-line rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-fg">Frequently Asked Questions about Port {info.port}</h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="p-4 rounded-xl bg-field/60 border border-line">
              <h3 className="font-bold text-fg text-sm mb-1">{f.q}</h3>
              <p className="text-muted text-xs sm:text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related Ports */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-fg">Other Common Network Ports</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {NETWORK_PORTS.filter((p) => p.port !== info.port).slice(0, 18).map((p) => (
            <Link
              key={p.port}
              href={`/ports/${p.port}`}
              className="p-3 rounded-xl bg-card hover:bg-hover border border-line transition-colors no-underline"
            >
              <div className="font-mono font-bold text-sm text-accent">Port {p.port}</div>
              <div className="text-xs text-fg truncate font-medium">{p.service}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
