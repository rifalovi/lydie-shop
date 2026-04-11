import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Indicator } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const runtime = "nodejs";

// Administrative-data signals — these indicators should NOT end up in the
// beneficiary questionnaire. They are collected via project reports instead.
const ADMIN_KEYWORDS = [
  "budget",
  "décaissement",
  "decaissement",
  "dépense",
  "depense",
  "taux d'exécution",
  "taux d'execution",
  "nombre de rapports",
  "ponctualité",
  "ponctualite",
  "nombre d'activités",
  "nombre d'activites",
  "nombre de réunions",
  "nombre de reunions",
  "coût",
  "cout ",
];

function isAdministrative(ind: Indicator): boolean {
  const text = `${ind.title ?? ""} ${ind.definition ?? ""}`.toLowerCase();
  return ADMIN_KEYWORDS.some((k) => text.includes(k));
}

function slug(base: string): string {
  return (
    base
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "q"
  );
}

function buildBaseQuestion(ind: Indicator, idx: number) {
  const unit = (ind.unit || "").trim();
  const title = ind.title || "l'activité";
  const lowered = title.toLowerCase();
  // Heuristic — "nombre" / "#" indicators ask for participation (yes/no)
  if (unit === "#" || unit.toLowerCase().startsWith("nombre")) {
    return {
      id: `q-${idx}-${slug(title)}`,
      indicator_id: ind.id,
      indicator_code: ind.code,
      text: `Avez-vous bénéficié de ${lowered} ?`,
      type: "oui_non" as const,
      required: true,
    };
  }
  // Percentage / proportion indicators: self-reported intensity on 1-5 scale
  if (unit === "%" || unit.toLowerCase().includes("pourcent") || unit.toLowerCase().includes("proportion")) {
    return {
      id: `q-${idx}-${slug(title)}`,
      indicator_id: ind.id,
      indicator_code: ind.code,
      text: `Dans quelle mesure ${lowered.replace(/^taux d(e|u|es) /, "").replace(/^proportion d(e|u|es) /, "")} ?`,
      type: "echelle_1_5" as const,
      required: true,
    };
  }
  // Qualitative indicator — open question
  if (ind.type === "qualitatif") {
    return {
      id: `q-${idx}-${slug(title)}`,
      indicator_id: ind.id,
      indicator_code: ind.code,
      text: `Selon vous, ${lowered} ? Merci de détailler.`,
      type: "texte_libre" as const,
      required: false,
    };
  }
  // Default fallback: 1-5 satisfaction scale
  return {
    id: `q-${idx}-${slug(title)}`,
    indicator_id: ind.id,
    indicator_code: ind.code,
    text: `Dans quelle mesure êtes-vous d'accord avec : "${title}" ?`,
    type: "echelle_1_5" as const,
    required: true,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId requis." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
    if (projErr || !project) {
      return NextResponse.json(
        { error: "Projet introuvable." },
        { status: 404 }
      );
    }

    const { data: indicators } = await supabase
      .from("indicators")
      .select("*")
      .eq("project_id", projectId);

    const all = (indicators ?? []) as Indicator[];
    const eligible = all.filter((i) => !isAdministrative(i));

    // Build deterministic base questions first
    const baseQuestions = eligible.map((ind, idx) =>
      buildBaseQuestion(ind, idx)
    );

    // Optional: ask Claude to rephrase them cleanly. We keep the mapping
    // between original indicators and question IDs stable.
    let finalQuestions = baseQuestions;
    try {
      if (baseQuestions.length > 0 && process.env.ANTHROPIC_API_KEY) {
        const prompt = `Tu es un expert S&E de l'OIF. Reformule les questions suivantes d'un questionnaire de bénéficiaires pour qu'elles soient claires, bienveillantes et neutres. N'ajoute, ne supprime ni ne réordonne AUCUNE question. Conserve le même "id" et le même "type". Renvoie STRICTEMENT un tableau JSON avec la forme: [{"id": "...", "text": "...", "type": "..."}]. En français.

Questions sources:
${JSON.stringify(baseQuestions.map(({ id, text, type }) => ({ id, text, type })), null, 2)}`;

        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
        });
        const text =
          response.content[0].type === "text" ? response.content[0].text : "[]";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const rephrased = JSON.parse(jsonMatch[0]) as Array<{
            id: string;
            text: string;
          }>;
          const map = new Map(rephrased.map((q) => [q.id, q.text]));
          finalQuestions = baseQuestions.map((q) => ({
            ...q,
            text: map.get(q.id) || q.text,
          }));
        }
      }
    } catch (aiErr) {
      console.warn("AI rephrase failed, falling back to base questions:", aiErr);
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("questionnaires")
      .insert({
        project_id: projectId,
        title: `Questionnaire ERA — ${project.title}`,
        description:
          "Questionnaire généré automatiquement à partir des indicateurs du projet. Modifiable avant activation.",
        status: "draft",
        questions: finalQuestions,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json(
        {
          error: "Impossible de créer le questionnaire.",
          details: insertErr.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      questionnaire: inserted,
      excluded_admin_indicators: all.length - eligible.length,
    });
  } catch (err: any) {
    console.error("Questionnaire generate error:", err);
    return NextResponse.json(
      { error: "Erreur interne.", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
