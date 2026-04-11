import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Creates a draft analytical note so the /generate route can update it
// incrementally while streaming.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("analytical_notes")
      .insert({
        user_id: user.id,
        subject: body.subject ?? "Note analytique",
        scope_projects: body.scopeProjects ?? [],
        scope_ps: body.scopePs ?? [],
        scope_countries: body.scopeCountries ?? [],
        period_start: body.periodStart || null,
        period_end: body.periodEnd || null,
        sections_selected: body.sectionsSelected ?? [],
        detail_level: body.detailLevel ?? "standard",
        audience: body.audience ?? "equipe_projet",
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Création impossible.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ note: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erreur interne.", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
