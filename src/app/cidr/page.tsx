import type { Metadata } from "next";
import Link from "next/link";
import { CIDR_BLOCKS } from "@/lib/network-ports-registry";
import { buildMetadata, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { FaqSection } from "@/components/faq-section";
import { Network, ArrowRight, ShieldCheck, Server } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "IPv4 CIDR & Subnet Mask Reference Hub | Castov",
  description:
    "Comprehensive IPv4 CIDR subnet mask guide from /8 to /32. Inspect subnet masks, wildcard masks, usable host capacities, broadcast addresses, and networking formulas.",
  path: "/cidr",
});

const CIDR_FAQS = [
  {
    q: "What is CIDR notation?",
    a: "Classless Inter-Domain Routing (CIDR) notation expresses an IP address and its associated routing prefix using a slash followed by the prefix length in bits (for example, 192.168.1.0/24).",
  },
  {
    q: "How do I calculate usable hosts in a subnet?",
    a: "For standard IPv4 subnets (/0 to /30), the formula for usable hosts is 2^(32 - prefix) - 2, subtracting 2 for the network and broadcast addresses. Under RFC 3021, /31 point-to-point links allow 2 usable host addresses with no dedicated broadcast.",
  },
  {
    q: "What is a wildcard mask?",
    a: "A wildcard mask is the inverted representation of a subnet mask (255.255.255.255 minus the subnet mask), commonly used in Cisco access control lists (ACLs) and OSPF configuration.",
  },
];

export default function CidrHubPage() {
  const jsonLdData = [
    faqJsonLd(CIDR_FAQS),
    breadcrumbJsonLd(
      [
        { name: "Home", href: "/" },
        { name: "Networking & Ports", href: "/ports" },
        { name: "CIDR Reference", href: "/cidr" },
      ],
      "/cidr"
    ),
  ];

  return (
    <>
      <JsonLd data={jsonLdData} />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Breadcrumb
          path="/cidr"
          crumbs={[
            { name: "Home", href: "/" },
            { name: "Ports & Network", href: "/ports" },
            { name: "CIDR Subnet Reference" },
          ]}
        />

        <div className="hero-section -mx-4 px-4 py-12 md:py-16 text-center sm:text-left border-b border-line mb-8">
          <div className="flex items-center gap-2 mb-3 justify-center sm:justify-start">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <Network size={12} />
              IPv4 Subnet Directory
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-card border border-line text-muted">
              /8 – /32
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg mb-4">
            IPv4 CIDR & Subnet Mask Reference
          </h1>
          <p className="text-muted text-base sm:text-lg max-w-3xl leading-relaxed">
            Deterministic reference guide for all IPv4 subnet masks from /8 to /32. Compare total address pools, usable host capacities, wildcard masks, and RFC 3021 point-to-point configurations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card p-5 bg-card border-line">
            <div className="flex items-center gap-3 mb-2 text-primary font-bold">
              <Server className="w-5 h-5" />
              <span>Standard LAN Subnets</span>
            </div>
            <p className="text-sm text-muted mb-3">Common local development, VPC private subnets, and office networks.</p>
            <div className="flex flex-wrap gap-2">
              {["/16", "/24", "/28"].map((p) => (
                <Link key={p} href={`/cidr/${p.replace("/", "")}`} className="badge badge-subtle hover:border-primary transition-colors">
                  {p}
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-5 bg-card border-line">
            <div className="flex items-center gap-3 mb-2 text-success font-bold">
              <Network className="w-5 h-5" />
              <span>Point-to-Point Links</span>
            </div>
            <p className="text-sm text-muted mb-3">RFC 3021 point-to-point router interfaces and isolated single hosts.</p>
            <div className="flex flex-wrap gap-2">
              {["/30", "/31", "/32"].map((p) => (
                <Link key={p} href={`/cidr/${p.replace("/", "")}`} className="badge badge-subtle hover:border-success transition-colors">
                  {p}
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-5 bg-card border-line">
            <div className="flex items-center gap-3 mb-2 text-warning font-bold">
              <ShieldCheck className="w-5 h-5" />
              <span>Large ISP & Enterprise</span>
            </div>
            <p className="text-sm text-muted mb-3">High-capacity CIDR allocations for cloud VPCs and routing backbones.</p>
            <div className="flex flex-wrap gap-2">
              {["/8", "/12", "/20"].map((p) => (
                <Link key={p} href={`/cidr/${p.replace("/", "")}`} className="badge badge-subtle hover:border-warning transition-colors">
                  {p}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="card bg-card border-line overflow-hidden mb-12">
          <div className="p-4 border-b border-line bg-card/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-fg">Complete IPv4 CIDR Reference Table</h2>
            <span className="text-xs text-muted font-mono">{CIDR_BLOCKS.length} Subnet Blocks</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-mono text-muted uppercase bg-muted/5">
                  <th className="p-3">Prefix</th>
                  <th className="p-3">Subnet Mask</th>
                  <th className="p-3">Wildcard Mask</th>
                  <th className="p-3 text-right">Total IPs</th>
                  <th className="p-3 text-right">Usable Hosts</th>
                  <th className="p-3 text-right">Guide</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono text-xs">
                {CIDR_BLOCKS.map((c) => (
                  <tr key={c.prefix} className="hover:bg-muted/10 transition-colors">
                    <td className="p-3 font-bold text-primary">/{c.prefix}</td>
                    <td className="p-3 text-fg">{c.subnetMask}</td>
                    <td className="p-3 text-muted">{c.wildcardMask}</td>
                    <td className="p-3 text-right text-fg">{c.totalIps.toLocaleString("en-US")}</td>
                    <td className="p-3 text-right text-success font-semibold">{c.usableHosts.toLocaleString("en-US")}</td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/cidr/${c.prefix}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                      >
                        Inspect <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <FaqSection items={CIDR_FAQS} />
      </div>
    </>
  );
}
