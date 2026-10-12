import { OG_SIZE } from "@/lib/og-constants";
import { renderOgImage } from "@/lib/og-image";
import { getTool } from "@/content/tools";

export const size = { width: OG_SIZE.width, height: OG_SIZE.height };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ tool: string }> }) {
  const { tool: slug } = await params;
  const tool = getTool(slug);

  if (!tool) {
    return renderOgImage();
  }

  return renderOgImage(
    tool.name,
    tool.intro,
    tool.category.replace("-", " ")
  );
}
