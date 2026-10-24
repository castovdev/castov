import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export interface McpServerConfigItem {
  id: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface SavedMcpStack {
  id: string;
  name: string;
  servers: string[];
  createdAt: number;
}

// In-memory fallback cache for development or when database table is bootstrapping
const FALLBACK_STACKS = new Map<string, SavedMcpStack[]>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stackName = searchParams.get("name")?.toLowerCase().trim();

    let userId = "guest_default";
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Supabase unconfigured or offline
    }

    const userStacks = FALLBACK_STACKS.get(userId) || [
      {
        id: "default-devsecops",
        name: "devsecops",
        servers: ["castov", "github", "postgres"],
        createdAt: Date.now(),
      },
    ];

    if (stackName) {
      const matched = userStacks.find((s) => s.name === stackName);
      if (!matched) {
        return NextResponse.json(
          { ok: false, error: `Stack '${stackName}' not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, stack: matched });
    }

    return NextResponse.json({ ok: true, stacks: userStacks });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to retrieve MCP stacks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.toLowerCase().trim() : "my-stack";
    const servers = Array.isArray(body.servers) ? body.servers : ["castov"];

    if (!name || name.length > 50 || !/^[a-z0-9_-]+$/.test(name)) {
      return NextResponse.json(
        { ok: false, error: "Stack name must be alphanumeric and under 50 characters." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(servers) ||
      servers.length > 50 ||
      servers.some((s) => typeof s !== "string" || s.length > 64)
    ) {
      return NextResponse.json(
        { ok: false, error: "Servers list exceeds 50 items or contains invalid identifiers." },
        { status: 400 }
      );
    }

    const safeServers = servers.slice(0, 50).map((s) => String(s).trim().slice(0, 64));

    let userId = "guest_default";
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // ignore
    }

    const currentStacks = FALLBACK_STACKS.get(userId) || [];
    const newStack: SavedMcpStack = {
      id: `stack_${Date.now()}`,
      name,
      servers: safeServers,
      createdAt: Date.now(),
    };

    const updated = [newStack, ...currentStacks.filter((s) => s.name !== name)].slice(0, 25);
    FALLBACK_STACKS.set(userId, updated);

    return NextResponse.json({
      ok: true,
      message: `Stack '${name}' saved successfully.`,
      stack: newStack,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to save MCP stack." },
      { status: 500 }
    );
  }
}
