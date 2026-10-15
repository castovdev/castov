import { NextResponse } from "next/server";

export const revalidate = 86400;

export async function GET() {
  const instructions = `# Castov AI Rules Generator API
# Generate instant .cursorrules and CLAUDE.md for your projects directly from terminal.

## Quick Usage:
  curl -s https://castov.com/api/rules/nextjs > .cursorrules
  curl -s https://castov.com/api/rules/nextjs-tailwind > .cursorrules
  curl -s https://castov.com/api/rules/fastapi > .cursorrules
  curl -s https://castov.com/api/rules/python > .cursorrules
  curl -s https://castov.com/api/rules/react > .cursorrules
  curl -s https://castov.com/api/rules/supabase > .cursorrules
  curl -s https://castov.com/api/rules/docker > .cursorrules
  curl -s https://castov.com/api/rules/typescript > .cursorrules

## Web Generator Interface:
  Visit: https://castov.com/ai/cursorrules-generator
`;

  return new NextResponse(instructions, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
