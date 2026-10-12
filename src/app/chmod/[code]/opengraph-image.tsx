import { OG_SIZE } from "@/lib/og-constants";
import { renderOgImage } from "@/lib/og-image";

export const size = { width: OG_SIZE.width, height: OG_SIZE.height };
export const contentType = "image/png";

function getPermissions(digit: string): string {
  const d = parseInt(digit, 10);
  const r = (d & 4) !== 0 ? "r" : "-";
  const w = (d & 2) !== 0 ? "w" : "-";
  const x = (d & 1) !== 0 ? "x" : "-";
  return `${r}${w}${x}`;
}

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const symbolic = code.length === 3 ? `${getPermissions(code[0])}${getPermissions(code[1])}${getPermissions(code[2])}` : "rwxr-xr-x";

  return renderOgImage(
    `Chmod ${code} (${symbolic})`,
    `Owner, Group, and Public permission breakdown and command reference.`,
    "UNIX PERMISSIONS"
  );
}
