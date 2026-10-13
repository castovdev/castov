import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolPage } from "@/components/tool-page";
import { getTool, toolPath } from "@/content/tools";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getTool("nexus-grid");
  if (!tool) return {};
  return buildMetadata({ title: tool.seoTitle, description: tool.metaDescription, path: toolPath(tool.slug) });
}

export default function NexusGridPage() {
  const tool = getTool("nexus-grid");
  if (!tool) notFound();
  return <ToolPage tool={tool} />;
}
