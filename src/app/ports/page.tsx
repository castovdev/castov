import type { Metadata } from "next";
import Link from "next/link";
import { NETWORK_PORTS, CIDR_BLOCKS } from "@/lib/network-ports-registry";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { Server, Network, ArrowRight } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Network Ports & IPv4 CIDR Subnet Encyclopedia – Port Numbers & Netmasks",
  description: "Developer reference for common TCP/UDP network ports (80, 443, 22, 3000, 5432, 6379, 8080, 27017), EADDRINUSE process kill commands, and IPv4 CIDR subnet masks (/8 to /32).",
  path: "/ports",
});

export default function NetworkPortsHubPage() {
  return (
    <div className="layout-content py-10 space-y-12">
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Home", href: "/" },
            { name: "Network Ports & CIDR Subnets" },
          ],
          "/ports"
        )}
      />

      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
          <Server className="w-3.5 h-3.5" /> Network Engineering &amp; DevOps Reference
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
          Network Ports &amp; IPv4 CIDR Subnet Encyclopedia
        </h1>
        <p className="text-muted max-w-3xl text-sm sm:text-base">
          Instant lookup for standard TCP/UDP port numbers, process termination commands (Linux, macOS, Windows), Docker port mappings, and IPv4 CIDR subnet calculations.
        </p>
      </header>

      {/* Network Ports Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-fg flex items-center gap-2">
          <Server className="w-5 h-5 text-accent" /> Common TCP/UDP Network Ports
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {NETWORK_PORTS.map((p) => (
            <Link
              key={p.port}
              href={`/ports/${p.port}`}
              className="group p-4 rounded-xl bg-card hover:bg-hover border border-line transition-all flex flex-col justify-between no-underline"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-extrabold text-lg text-accent">Port {p.port}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-field border border-line text-muted">
                    {p.protocol}
                  </span>
                </div>
                <div className="font-bold text-sm text-fg group-hover:text-accent transition-colors">
                  {p.service}
                </div>
                <div className="text-xs text-muted line-clamp-2 mt-1">{p.summary}</div>
              </div>
              <div className="mt-3 pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-muted">
                <span className="font-mono truncate">{p.defaultProcess}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CIDR Blocks Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-fg flex items-center gap-2">
          <Network className="w-5 h-5 text-accent" /> IPv4 CIDR Subnet Calculator Reference (/8 to /32)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CIDR_BLOCKS.map((c) => (
            <Link
              key={c.prefix}
              href={`/cidr/${c.prefix}`}
              className="p-3.5 rounded-xl bg-card hover:bg-hover border border-line transition-colors no-underline"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-base text-accent">/{c.prefix}</span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  {c.usableHosts.toLocaleString("en-US")} hosts
                </span>
              </div>
              <div className="text-xs font-mono text-fg mt-1">{c.subnetMask}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
