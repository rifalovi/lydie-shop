import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    // Ownership check
    const { data: note } = await supabase
      .from("analytical_notes")
      .select("id, user_id")
      .eq("id", params.id)
      .single();
    if (!note || note.user_id !== user.id) {
      return NextResponse.json(
        { error: "Note introuvable." },
        { status: 404 }
      );
    }

    const token = randomBytes(24).toString("base64url");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await supabase
      .from("note_shares")
      .insert({
        note_id: params.id,
        token,
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Création du lien impossible.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      share: data,
      url: `/analyse-documentaire/public/${token}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erreur interne.", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
