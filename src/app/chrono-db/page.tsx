import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { ChronoStateDbTool } from "@/components/tools/chrono-state-db-tool";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Chrono-State DB | Local-First Git NoSQL Database | Castov",
  description: "Local-First Git-Versioned NoSQL Database Simulator with Merkle timeline branching and instant time travel.",
  path: "/chrono-db",
});

export default function ChronoDbPage() {
  return (
    <div className="layout-content max-w-5xl py-8 sm:py-12">
      <Breadcrumb
        path="/chrono-db"
        crumbs={[{ name: "Home", href: "/" }, { name: "Tools", href: "/tools" }, { name: "Chrono-State DB" }]}
      />
      <div className="mt-6 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg">Chrono-State DB</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">
          Local-First Git-Versioned NoSQL Database Simulator with Merkle timeline branching and instant time travel.
        </p>
      </div>
      <ChronoStateDbTool />
    </div>
  );
}
