import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Resolves a public share token → analytical note content, provided the
// share has not expired. Uses the admin client to bypass RLS since the
// caller is anonymous.
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const admin = createAdminClient();
    const { data: share } = await admin
      .from("note_shares")
      .select("note_id, expires_at")
      .eq("token", params.token)
      .maybeSingle();

    if (!share) {
      return NextResponse.json(
        { error: "Lien invalide." },
        { status: 404 }
      );
    }

    if (new Date(share.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Lien expiré." },
        { status: 410 }
      );
    }

    const { data: note } = await admin
      .from("analytical_notes")
      .select("id, subject, content, period_start, period_end, created_at")
      .eq("id", share.note_id)
      .single();

    if (!note) {
      return NextResponse.json(
        { error: "Note introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({ note, expires_at: share.expires_at });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erreur interne.", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
