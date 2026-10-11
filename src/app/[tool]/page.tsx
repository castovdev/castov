import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolPage } from "@/components/tool-page";
import { TOOLS, getTool, toolPath } from "@/content/tools";
import { buildMetadata } from "@/lib/seo";

type Params = { tool: string };

export const dynamicParams = false;


const DEDICATED_ROUTES = new Set(["nexus-grid", "sonic-gap", "quantum"]);

export function generateStaticParams(): Params[] {
  return TOOLS.filter((t) => !DEDICATED_ROUTES.has(t.slug)).map((t) => ({ tool: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { tool: slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  return buildMetadata({ title: tool.seoTitle, description: tool.metaDescription, path: toolPath(tool.slug) });
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { tool: slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  return <ToolPage tool={tool} />;
}
