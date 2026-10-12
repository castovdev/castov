import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "castov-extension.zip");
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="castov-extension.zip"',
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    }
  } catch {}

  return NextResponse.redirect("https://castov.com/castov-extension.zip", 307);
}
