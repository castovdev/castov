import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "castov-vscode-0.1.0.vsix");
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": 'attachment; filename="castov-vscode-0.1.0.vsix"',
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    }
  } catch {}

  // Fallback direct URL redirect
  return NextResponse.redirect("https://castov.com/castov-vscode-0.1.0.vsix", 307);
}
