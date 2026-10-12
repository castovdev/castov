import { OG_SIZE } from "@/lib/og-constants";
import { renderOgImage } from "@/lib/og-image";

export const size = { width: OG_SIZE.width, height: OG_SIZE.height };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ expression: string }> }) {
  const { expression } = await params;
  const decoded = expression.replace(/_/g, " ");

  return renderOgImage(
    `Cron: ${decoded}`,
    `Human-readable schedule explanation, timing visualizer, and next run times.`,
    "CRON SCHEDULE"
  );
}
