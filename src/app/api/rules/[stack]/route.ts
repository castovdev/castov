import { NextRequest, NextResponse } from "next/server";

export const revalidate = 86400; // Cache for 24 hours

const STACK_RULES: Record<string, { name: string; content: string }> = {
  nextjs: {
    name: "Next.js 15+ & React 19 (App Router)",
    content: `# Next.js (App Router) & React Guidelines for AI Assistant
- You are an expert in Next.js 15+, React 19, TypeScript, and Tailwind CSS.
- Prioritize Server Components (RSC). Use 'use client' only when hooks, state, or browser APIs are required.
- Do not use legacy Pages router conventions (no getServerSideProps, getStaticProps).
- Use Next.js Image component for images with width/height or fill.
- Keep route handlers in app/api/.../route.ts and return NextResponse.json().
- Guard browser-only globals (window, localStorage) with useEffect or dynamic(..., { ssr: false }).
- Always use strict TypeScript. Avoid 'any' type.
- Prefer Server Actions for form submissions and data mutations.
`,
  },
  react: {
    name: "React & TypeScript",
    content: `# React & TypeScript Best Practices for AI Assistant
- Write clean, functional components with explicit TypeScript interfaces for props.
- Never use 'any'. Leverage discriminated unions and generics where appropriate.
- Keep state local whenever possible. Minimize unnecessary useEffect triggers.
- For data fetching, prefer React Query (TanStack Query) or modern async patterns.
- Follow a11y standards: provide aria-label, semantic HTML tags, and keyboard navigable controls.
`,
  },
  tailwind: {
    name: "Tailwind CSS v4+",
    content: `# Tailwind CSS Standards for AI Assistant
- Use standard utility classes, semantic spacing, and responsive prefixes (sm:, md:, lg:, xl:).
- Respect dark mode design tokens with data-theme or class strategies.
- Avoid arbitrary values (e.g. w-[342px]) when standard theme tokens (w-80, w-96) suffice.
- Ensure high contrast for text and interactive states (hover:, focus-visible:).
`,
  },
  python: {
    name: "Python 3.12+ & FastAPI",
    content: `# Modern Python & FastAPI Standards for AI Assistant
- Use Python 3.11+ syntax: type hints, match/case, async/await everywhere appropriate.
- For FastAPI: use Pydantic v2 models for request/response schemas.
- Use dependency injection (Depends) for database sessions, auth, and services.
- Never use print() for application logging; use loguru or standard logging with structured format.
- Write unit tests using pytest and pytest-asyncio.
`,
  },
  fastapi: {
    name: "FastAPI & Pydantic v2",
    content: `# FastAPI & Pydantic v2 Standards
- Structure endpoints in APIRouter modules under api/v1/...
- Use async def for endpoints doing I/O.
- Validate all incoming payloads with Pydantic BaseModel with strict validation.
- Return explicit HTTP status codes (HTTP_201_CREATED, HTTP_204_NO_CONTENT).
`,
  },
  supabase: {
    name: "Supabase & PostgreSQL",
    content: `# Supabase & PostgreSQL Standards for AI Assistant
- Enforce Row Level Security (RLS) on all tables with explicit policies.
- Keep database keys secure: Never expose SUPABASE_SERVICE_ROLE_KEY to client code.
- In Next.js App Router, use @supabase/ssr for server/client cookie-based authentication.
- Write migrations in SQL rather than relying on manual dashboard edits.
`,
  },
  docker: {
    name: "Docker & Containerization",
    content: `# Docker & Containerization Best Practices
- Always use multi-stage builds to minimize production image size.
- Run as a non-root user in the final image (USER node or USER appuser).
- Use .dockerignore to exclude node_modules, .git, and local secrets.
- Pin base image tags (e.g., node:20-alpine or python:3.12-slim) instead of using :latest.
`,
  },
  typescript: {
    name: "Strict TypeScript",
    content: `# Strict TypeScript Standards for AI Assistant
- Enable strict mode in tsconfig.json. No implicit any, strictNullChecks: true.
- Prefer interfaces for object structures and types for unions/intersections.
- Use 'readonly' for immutable arrays and object properties when applicable.
- Leverage zod or valibot for runtime schema validation on external inputs.
`,
  },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ stack: string }> }
) {
  const { stack } = await params;
  const normalized = stack.toLowerCase().replace(/[^a-z0-9_-]/g, "");

  // Check direct or compound match (e.g., nextjs-tailwind)
  const parts = normalized.split(/[-_]/);
  let combinedContent = "";
  let matchedNames: string[] = [];

  for (const part of parts) {
    if (STACK_RULES[part]) {
      matchedNames.push(STACK_RULES[part].name);
      combinedContent += `\n${STACK_RULES[part].content}\n`;
    }
  }

  if (!combinedContent && STACK_RULES[normalized]) {
    matchedNames.push(STACK_RULES[normalized].name);
    combinedContent = STACK_RULES[normalized].content;
  }

  if (!combinedContent) {
    // Fallback default rules
    return new NextResponse(
      `# Castov AI Coding Standards (.cursorrules / CLAUDE.md)
# Powered by https://castov.com/ai/cursorrules-generator
- You are a senior principal software engineer.
- Write clean, modular, production-ready code with comprehensive error handling.
- Follow strict typing and zero-tolerance for silent failures.
- When generating fixes, provide concise terminal commands and exact code diffs.
`,
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      }
    );
  }

  const header = `# Generated by Castov AI Rules Generator (https://castov.com/ai/cursorrules-generator)
# Stacks: ${matchedNames.join(", ")}
# Usage: curl -s https://castov.com/api/rules/${normalized} > .cursorrules
\n`;

  return new NextResponse(header + combinedContent.trim() + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
