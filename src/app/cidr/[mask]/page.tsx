import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CIDR_BLOCKS, getCidrByPrefix } from "@/lib/network-ports-registry";
import { buildMetadata, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { Network } from "lucide-react";

export function generateStaticParams() {
  return CIDR_BLOCKS.map((c) => ({ mask: String(c.prefix) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mask: string }>;
}): Promise<Metadata> {
  const { mask } = await params;
  const info = getCidrByPrefix(Number(mask));
  if (!info) return {};

  return buildMetadata({
    title: `/${info.prefix} CIDR Subnet Mask (${info.subnetMask}) – How Many IPs & Hosts?`,
    description: `/${info.prefix} CIDR block reference: Subnet mask ${info.subnetMask}, wildcard mask ${info.wildcardMask}, ${info.totalIps.toLocaleString("en-US")} total IPv4 addresses, and ${info.usableHosts.toLocaleString("en-US")} usable host IPs.`,
    path: `/cidr/${info.prefix}`,
  });
}

export default async function CidrMaskPage({
  params,
}: {
  params: Promise<{ mask: string }>;
}) {
  const { mask } = await params;
  const info = getCidrByPrefix(Number(mask));
  if (!info) notFound();

  const faqs = [
    {
      q: `How many IP addresses are in a /${info.prefix} CIDR block?`,
      a: `A /${info.prefix} CIDR subnet contains ${info.totalIps.toLocaleString("en-US")} total IPv4 addresses and ${info.usableHosts.toLocaleString("en-US")} usable host IP addresses (excluding network and broadcast addresses where applicable).`,
    },
    {
      q: `What is the subnet mask for /${info.prefix}?`,
      a: `The decimal IPv4 subnet mask for /${info.prefix} is ${info.subnetMask}, and its inverse wildcard mask is ${info.wildcardMask}.`,
    },
    {
      q: `Where is a /${info.prefix} subnet commonly used?`,
      a: `${info.commonUse} (${info.classType}).`,
    },
  ];

  return (
    <div className="layout-content py-10 space-y-10">
      <JsonLd
        data={[
          breadcrumbJsonLd(
            [
              { name: "Home", href: "/" },
              { name: "Ports & Subnets", href: "/ports" },
              { name: `/${info.prefix} CIDR Subnet` },
            ],
            `/cidr/${info.prefix}`
          ),
          faqJsonLd(faqs),
        ]}
      />

      <nav aria-label="Breadcrumb" className="text-xs text-muted flex items-center gap-2">
        <Link href="/" className="hover:text-fg">Home</Link>
        <span>/</span>
        <Link href="/ports" className="hover:text-fg">Ports &amp; Subnets</Link>
        <span>/</span>
        <span className="text-fg font-semibold">/{info.prefix} CIDR</span>
      </nav>

      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold font-mono">
          <Network className="w-3.5 h-3.5" /> IPv4 CIDR /{info.prefix} • {info.subnetMask}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
          /{info.prefix} CIDR Subnet Mask ({info.subnetMask}) — {info.usableHosts.toLocaleString("en-US")} Usable Hosts
        </h1>
        <p className="text-muted max-w-3xl text-sm sm:text-base">
          Complete technical breakdown for a <strong>/{info.prefix}</strong> IPv4 CIDR prefix: decimal netmask, wildcard mask, host capacity, and cloud VPC usage.
        </p>
      </header>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-line">
          <div className="text-xs text-muted uppercase font-semibold">Subnet Mask</div>
          <div className="text-2xl font-bold font-mono text-fg mt-1">{info.subnetMask}</div>
          <div className="text-xs text-muted mt-1">Prefix: /{info.prefix}</div>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-line">
          <div className="text-xs text-muted uppercase font-semibold">Total IPv4 Addresses</div>
          <div className="text-2xl font-bold font-mono text-accent mt-1">{info.totalIps.toLocaleString("en-US")}</div>
          <div className="text-xs text-muted mt-1">2^(32 - {info.prefix}) IPs</div>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-line">
          <div className="text-xs text-muted uppercase font-semibold">Usable Host IPs</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {info.usableHosts.toLocaleString("en-US")}
          </div>
          <div className="text-xs text-muted mt-1">Assignable to instances</div>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-line">
          <div className="text-xs text-muted uppercase font-semibold">Wildcard Mask</div>
          <div className="text-2xl font-bold font-mono text-fg mt-1">{info.wildcardMask}</div>
          <div className="text-xs text-muted mt-1">ACL / OSPF Inverse Mask</div>
        </div>
      </div>

      {/* Full Reference Table of All CIDR Blocks */}
      <section className="bg-card border border-line rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-line">
          <h2 className="text-lg font-bold text-fg">IPv4 CIDR Reference Cheat Sheet (/8 to /32)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-field/70 border-b border-line text-xs uppercase text-muted">
                <th className="py-3 px-4">CIDR</th>
                <th className="py-3 px-4">Subnet Mask</th>
                <th className="py-3 px-4">Wildcard</th>
                <th className="py-3 px-4">Total IPs</th>
                <th className="py-3 px-4">Usable Hosts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {CIDR_BLOCKS.map((c) => (
                <tr
                  key={c.prefix}
                  className={c.prefix === info.prefix ? "bg-accent/10 font-bold" : "hover:bg-hover/50"}
                >
                  <td className="py-2.5 px-4 font-mono">
                    <Link href={`/cidr/${c.prefix}`} className="text-accent hover:underline">
                      /{c.prefix}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-fg">{c.subnetMask}</td>
                  <td className="py-2.5 px-4 font-mono text-muted text-xs">{c.wildcardMask}</td>
                  <td className="py-2.5 px-4 font-mono text-fg">{c.totalIps.toLocaleString("en-US")}</td>
                  <td className="py-2.5 px-4 font-mono text-emerald-600 dark:text-emerald-400">
                    {c.usableHosts.toLocaleString("en-US")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-card border border-line rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-fg">Frequently Asked Questions (/{info.prefix} CIDR)</h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="p-4 rounded-xl bg-field/60 border border-line">
              <h3 className="font-bold text-fg text-sm mb-1">{f.q}</h3>
              <p className="text-muted text-xs sm:text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
