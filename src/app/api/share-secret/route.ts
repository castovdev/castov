import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface StoredSecret {
  id: string;
  ciphertext: string;
  iv: string;
  expiresIn: "burn" | "1h" | "24h";
  createdAt: number;
  expiresAt: number;
  views: number;
}

// Global in-memory cache for fast, zero-configuration secret sharing & graceful fallback
const SECRET_STORAGE = new Map<string, StoredSecret>();

// Clean up expired items periodically (every 5 minutes)
function cleanExpired() {
  const now = Date.now();
  for (const [id, s] of SECRET_STORAGE.entries()) {
    if (s.expiresAt < now) {
      SECRET_STORAGE.delete(id);
    }
  }
}

export async function POST(request: Request) {
  try {
    cleanExpired();
    const body = await request.json().catch(() => ({}));
    const ciphertext = String(body.ciphertext || "").trim();
    const iv = String(body.iv || "").trim();
    const expiresIn = (body.expiresIn === "1h" || body.expiresIn === "24h") ? body.expiresIn : "burn";

    if (!ciphertext || !iv) {
      return NextResponse.json(
        { ok: false, error: "Encrypted payload (ciphertext and iv) is required." },
        { status: 400 }
      );
    }

    // Limit maximum ciphertext size to 256 KB
    if (ciphertext.length > 256 * 1024) {
      return NextResponse.json(
        { ok: false, error: "Payload exceeds 256 KB limit." },
        { status: 413 }
      );
    }

    const id = `sec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();
    let ttlMs = 24 * 3600 * 1000; // default 24h max for burn
    if (expiresIn === "1h") ttlMs = 3600 * 1000;
    if (expiresIn === "24h") ttlMs = 24 * 3600 * 1000;

    const stored: StoredSecret = {
      id,
      ciphertext,
      iv,
      expiresIn,
      createdAt: now,
      expiresAt: now + ttlMs,
      views: 0,
    };

    SECRET_STORAGE.set(id, stored);

    // Try saving in Supabase if table exists
    try {
      const supabase = await createClient();
      await supabase.from("secret_shares").insert({
        id,
        ciphertext,
        iv,
        expires_in: expiresIn,
        created_at: new Date(now).toISOString(),
        expires_at: new Date(now + ttlMs).toISOString(),
        views: 0,
      });
    } catch {
      // Fallback in-memory works
    }

    return NextResponse.json({
      ok: true,
      id,
      expiresIn,
      expiresAt: stored.expiresAt,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to create secret link." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    cleanExpired();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing secret ID." }, { status: 400 });
    }

    let secret = SECRET_STORAGE.get(id);

    // Check Supabase if not in memory
    if (!secret) {
      try {
        const supabase = await createClient();
        const { data } = await supabase
          .from("secret_shares")
          .select("*")
          .eq("id", id)
          .single();

        if (data) {
          secret = {
            id: data.id,
            ciphertext: data.ciphertext,
            iv: data.iv,
            expiresIn: data.expires_in,
            createdAt: new Date(data.created_at).getTime(),
            expiresAt: new Date(data.expires_at).getTime(),
            views: data.views || 0,
          };
        }
      } catch {
        // ignore
      }
    }

    if (!secret) {
      return NextResponse.json(
        { ok: false, error: "This secret has expired or has already been burned." },
        { status: 404 }
      );
    }

    const now = Date.now();
    if (now > secret.expiresAt) {
      SECRET_STORAGE.delete(id);
      return NextResponse.json(
        { ok: false, error: "This secret link has expired." },
        { status: 410 }
      );
    }

    const isBurn = secret.expiresIn === "burn";
    secret.views += 1;

    // If burn after reading, delete immediately so it cannot be read again
    if (isBurn) {
      SECRET_STORAGE.delete(id);
      try {
        const supabase = await createClient();
        await supabase.from("secret_shares").delete().eq("id", id);
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      ok: true,
      ciphertext: secret.ciphertext,
      iv: secret.iv,
      expiresIn: secret.expiresIn,
      isBurned: isBurn,
      remainingViews: isBurn ? 0 : Math.max(0, 5 - secret.views),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to retrieve secret." },
      { status: 500 }
    );
  }
}
