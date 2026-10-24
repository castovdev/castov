import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export interface StoredVaultItem {
  id: string;
  userId: string;
  slug: string;
  name: string;
  ciphertext: string;
  iv: string;
  salt: string;
  createdAt: number;
  updatedAt: number;
}

// In-memory fallback cache when database table is not yet migrated or offline
const FALLBACK_VAULTS = new Map<string, StoredVaultItem[]>();

async function getAuthenticatedUserId(request: Request): Promise<string | null> {
  // 1. Check CLI PAT Token in Authorization Header (Bearer cst_live_...)
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token.startsWith("cst_live_") && token.length >= 16) {
      // Use token-derived identity
      return `cli_${token.slice(9, 25)}`;
    }
  }

  // 2. Check Supabase User Session
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return user.id;
    }
  } catch {
    // Supabase unavailable or unconfigured
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Sign in or provide a CLI token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.toLowerCase().trim();

    // Try Supabase first
    try {
      const supabase = await createClient();
      let query = supabase
        .from("env_vaults")
        .select("id, slug, name, ciphertext, iv, salt, created_at, updated_at")
        .eq("user_id", userId);

      if (slug) {
        query = query.eq("slug", slug);
        const { data, error } = await query.single();
        if (!error && data) {
          return NextResponse.json({
            ok: true,
            vault: {
              id: data.id,
              slug: data.slug,
              name: data.name,
              ciphertext: data.ciphertext,
              iv: data.iv,
              salt: data.salt,
              createdAt: new Date(data.created_at).getTime(),
              updatedAt: new Date(data.updated_at).getTime(),
            },
          });
        }
      } else {
        const { data, error } = await query.order("updated_at", { ascending: false });
        if (!error && data && data.length > 0) {
          return NextResponse.json({
            ok: true,
            vaults: data.map((d) => ({
              id: d.id,
              slug: d.slug,
              name: d.name,
              ciphertext: d.ciphertext,
              iv: d.iv,
              salt: d.salt,
              createdAt: new Date(d.created_at).getTime(),
              updatedAt: new Date(d.updated_at).getTime(),
            })),
          });
        }
      }
    } catch {
      // Fallback to local cache
    }

    // Fallback in-memory query
    const userVaults = FALLBACK_VAULTS.get(userId) || [];
    if (slug) {
      const found = userVaults.find((v) => v.slug === slug);
      if (!found) {
        return NextResponse.json(
          { ok: false, error: `Vault '${slug}' not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, vault: found });
    }

    return NextResponse.json({ ok: true, vaults: userVaults });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to retrieve vaults" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Sign in or provide a CLI token" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const slug = String(body.slug || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/^-+|-+$/g, "");
    const name = String(body.name || slug || "Personal Env Vault").trim();
    const ciphertext = String(body.ciphertext || "").trim();
    const iv = String(body.iv || "").trim();
    const salt = String(body.salt || "").trim();

    if (!slug) {
      return NextResponse.json(
        { ok: false, error: "Vault slug is required (e.g. 'prod-api' or 'staging')" },
        { status: 400 }
      );
    }

    if (!ciphertext || !iv || !salt) {
      return NextResponse.json(
        { ok: false, error: "Encrypted payload (ciphertext, iv, salt) is required" },
        { status: 400 }
      );
    }

    const now = Date.now();
    const isoNow = new Date(now).toISOString();

    const newVault: StoredVaultItem = {
      id: `vlt_${slug}_${now.toString(36)}`,
      userId,
      slug,
      name,
      ciphertext,
      iv,
      salt,
      createdAt: now,
      updatedAt: now,
    };

    // Try saving in Supabase
    try {
      const supabase = await createClient();
      await supabase.from("env_vaults").upsert(
        {
          user_id: userId,
          slug,
          name,
          ciphertext,
          iv,
          salt,
          encrypted_payload: `${salt}:${iv}:${ciphertext}`,
          updated_at: isoNow,
        },
        { onConflict: "user_id,slug" }
      );
    } catch {
      // In-memory fallback
    }

    // Always keep in-memory cache synchronized
    const existing = FALLBACK_VAULTS.get(userId) || [];
    const index = existing.findIndex((v) => v.slug === slug);
    if (index >= 0) {
      existing[index] = { ...existing[index], name, ciphertext, iv, salt, updatedAt: now };
    } else {
      existing.unshift(newVault);
    }
    FALLBACK_VAULTS.set(userId, existing);

    return NextResponse.json({ ok: true, vault: newVault });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to save vault" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Sign in or provide a CLI token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    let slug = searchParams.get("slug")?.toLowerCase().trim();

    if (!slug) {
      const body = await request.json().catch(() => ({}));
      slug = body?.slug?.toLowerCase()?.trim();
    }

    if (!slug) {
      return NextResponse.json(
        { ok: false, error: "Vault slug is required to delete" },
        { status: 400 }
      );
    }

    // Try Supabase delete
    try {
      const supabase = await createClient();
      await supabase
        .from("env_vaults")
        .delete()
        .eq("user_id", userId)
        .eq("slug", slug);
    } catch {
      // ignore
    }

    // Delete from in-memory fallback
    const userVaults = FALLBACK_VAULTS.get(userId) || [];
    FALLBACK_VAULTS.set(
      userId,
      userVaults.filter((v) => v.slug !== slug)
    );

    return NextResponse.json({ ok: true, deleted: slug });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to delete vault" },
      { status: 500 }
    );
  }
}
