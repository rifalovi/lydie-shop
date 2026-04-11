import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackUsage } from "@/lib/usage";
import { ANALYTICAL_NOTE_SECTIONS } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenerateBody = {
  noteId: string;
  subject: string;
  scopeProjects: string[];
  scopePs: string[];
  scopeCountries: string[];
  periodStart: string;
  periodEnd: string;
  sectionsSelected: string[];
  detailLevel: "synthetique" | "standard" | "approfondi";
  audience: string;
};

const SECTION_LABELS: Record<string, string> = Object.fromEntries(
  ANALYTICAL_NOTE_SECTIONS.map((s) => [s.value, s.label])
);

const DETAIL_GUIDANCE: Record<string, string> = {
  synthetique:
    "Produis une analyse très synthétique : 1 à 2 paragraphes maximum par section, va à l'essentiel.",
  standard:
    "Produis une analyse de niveau standard : 2 à 4 paragraphes par section, inclus des exemples concrets.",
  approfondi:
    "Produis une analyse approfondie : 4 à 6 paragraphes par section, développe la méthodologie et les nuances analytiques.",
};

const AUDIENCE_GUIDANCE: Record<string, string> = {
  equipe_projet:
    "Le public cible est l'équipe projet : reste opérationnel·le et concrèt·e, évite le jargon institutionnel.",
  management:
    "Le public cible est le management OIF : privilégie une vision stratégique, chiffrée et actionnable.",
  comite_pilotage:
    "Le public cible est le comité de pilotage : équilibre vision stratégique et éléments de gouvernance.",
  bailleurs:
    "Le public cible est un bailleur ou partenaire institutionnel : mise en avant des résultats et de la redevabilité.",
};

function formatDate(date: string | null | undefined): string {
  if (!date) return "non précisée";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("fr-FR");
}

export async function POST(req: NextRequest) {
  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const userId = user.id;

  if (!body.noteId || !body.subject) {
    return NextResponse.json(
      { error: "noteId et subject sont requis." },
      { status: 400 }
    );
  }

  // ------------------------------------------------------------------
  // 1. Fetch scoped project data
  // ------------------------------------------------------------------
  const scopeProjects = body.scopeProjects ?? [];
  const { data: projects } =
    scopeProjects.length > 0
      ? await supabase.from("projects").select("*").in("id", scopeProjects)
      : { data: [] as any[] };

  const projectIds = (projects ?? []).map((p) => p.id);

  const [
    { data: indicators },
    { data: eraData },
    { data: cmrConfigs },
  ] = await Promise.all([
    projectIds.length > 0
      ? supabase.from("indicators").select("*").in("project_id", projectIds)
      : Promise.resolve({ data: [] as any[] } as const),
    projectIds.length > 0
      ? supabase.from("era_data").select("*").in("project_id", projectIds)
      : Promise.resolve({ data: [] as any[] } as const),
    projectIds.length > 0
      ? supabase.from("cmr_configs").select("*").in("project_id", projectIds)
      : Promise.resolve({ data: [] as any[] } as const),
  ]);

  // ------------------------------------------------------------------
  // 2. Retrieve RAG chunks from knowledge_base
  //    Simple keyword search across the subject words.
  // ------------------------------------------------------------------
  const keywords = body.subject
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^\wéèêàùôîâç-]/g, ""))
    .filter((w) => w.length > 4)
    .slice(0, 3);

  let knowledgeChunks: { title: string | null; content: string }[] = [];
  if (keywords.length > 0) {
    const orClauses = keywords.map((k) => `content.ilike.%${k}%`).join(",");
    const { data: chunks } = await supabase
      .from("knowledge_base")
      .select("title, content")
      .or(orClauses)
      .limit(5);
    if (chunks) knowledgeChunks = chunks as typeof knowledgeChunks;
  }

  // ------------------------------------------------------------------
  // 3. Build the prompt
  // ------------------------------------------------------------------
  const sections = body.sectionsSelected?.length
    ? body.sectionsSelected
    : ANALYTICAL_NOTE_SECTIONS.map((s) => s.value);

  const sectionsList = sections
    .map((s) => `- ${SECTION_LABELS[s] ?? s}`)
    .join("\n");

  const projectSummaries = (projects ?? [])
    .map((p) => {
      const projectIndicators = (indicators ?? []).filter(
        (i) => i.project_id === p.id
      );
      const projectEra = (eraData ?? []).filter((e) => e.project_id === p.id);
      const indicatorLines = projectIndicators
        .slice(0, 20)
        .map(
          (i) =>
            `    - [${i.code ?? "—"}] ${i.title} — baseline=${
              i.baseline_value ?? "—"
            } | cible 2024=${i.target_2024 ?? "—"} | 2025=${
              i.target_2025 ?? "—"
            } | 2026=${i.target_2026 ?? "—"} | 2027=${i.target_2027 ?? "—"}`
        )
        .join("\n");
      return `### ${p.code ?? "—"} — ${p.title}
  - Programme : ${p.programme_strategique ?? "non précisé"}
  - Pays : ${(p.countries ?? []).join(", ") || "non précisé"}
  - Budget : ${p.budget_total ? `${p.budget_total} €` : "non précisé"}
  - Objectif global : ${p.global_objective ?? "non précisé"}
  - Indicateurs (${projectIndicators.length}) :
${indicatorLines || "    (aucun indicateur)"}
  - Données ERA disponibles : ${projectEra.length > 0 ? "oui" : "non"}`;
    })
    .join("\n\n");

  const ragContext =
    knowledgeChunks.length > 0
      ? knowledgeChunks
          .map(
            (c, i) =>
              `(${i + 1}) ${c.title ?? "Document"} — ${c.content.slice(0, 600).replace(/\s+/g, " ")}`
          )
          .join("\n\n")
      : "(aucun extrait pertinent trouvé dans la base de connaissances)";

  const systemPrompt = `Tu es un expert en analyse documentaire et évaluation de projets pour l'Organisation Internationale de la Francophonie (OIF), spécialisé en Gestion Axée sur les Résultats (GAR) et Suivi-Évaluation (S&E).

Tu produis des notes analytiques rigoureuses mobilisant les critères CAD/OCDE (pertinence, cohérence, efficacité, efficience, impact, durabilité) et le Référentiel SSE OIF.

${DETAIL_GUIDANCE[body.detailLevel] ?? DETAIL_GUIDANCE.standard}
${AUDIENCE_GUIDANCE[body.audience] ?? AUDIENCE_GUIDANCE.equipe_projet}

IMPORTANT : tu réponds en **français** et en **markdown structuré uniquement** (aucun JSON, aucun bloc de code, aucun préambule). Utilise des titres \`#\`/\`##\`/\`###\`, des listes, et du texte en gras pour les points saillants.`;

  const userPrompt = `Rédige une note analytique complète pour l'OIF.

## Paramètres

- Sujet : ${body.subject}
- Période : ${formatDate(body.periodStart)} → ${formatDate(body.periodEnd)}
- Programmes stratégiques : ${body.scopePs?.length ? body.scopePs.join(", ") : "tous"}
- Pays : ${body.scopeCountries?.length ? body.scopeCountries.join(", ") : "tous"}
- Niveau de détail : ${body.detailLevel}
- Public cible : ${body.audience}

## Sections à inclure (dans cet ordre)
${sectionsList}

## Données projet mobilisables
${projectSummaries || "(aucun projet dans le périmètre)"}

## Extraits de la base de connaissances OIF
${ragContext}

## Format attendu

Démarre directement par le bloc d'en-tête suivant (sans autre préambule) :

# NOTE ANALYTIQUE — ${body.subject.toUpperCase()}
**Organisation Internationale de la Francophonie**
**Service de Conception et de Suivi des projets**
Date : ${new Date().toLocaleDateString("fr-FR")} | Période : ${formatDate(body.periodStart)} → ${formatDate(body.periodEnd)}

---

Puis enchaîne **uniquement** les sections sélectionnées ci-dessus, dans l'ordre, en utilisant des titres niveau \`##\`. Dans la section « Analyse par projet », crée une sous-section \`###\` par projet listé ci-dessus, avec résultats clés vs cibles, points forts et points faibles. Dans « Recommandations stratégiques », propose 3 à 5 recommandations priorisées. Termine par les annexes si demandées.`;

  // ------------------------------------------------------------------
  // 4. Mark the note as generating
  // ------------------------------------------------------------------
  const admin = createAdminClient();
  await admin
    .from("analytical_notes")
    .update({
      status: "generating",
      subject: body.subject,
      scope_projects: scopeProjects,
      scope_ps: body.scopePs ?? [],
      scope_countries: body.scopeCountries ?? [],
      period_start: body.periodStart || null,
      period_end: body.periodEnd || null,
      sections_selected: sections,
      detail_level: body.detailLevel,
      audience: body.audience,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.noteId)
    .eq("user_id", userId);

  // ------------------------------------------------------------------
  // 5. Stream Claude markdown to the client
  // ------------------------------------------------------------------
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      let fullContent = "";
      let inputTokens = 0;
      let outputTokens = 0;
      let failed = false;

      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullContent += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          } else if (event.type === "message_start") {
            inputTokens = event.message?.usage?.input_tokens ?? inputTokens;
            outputTokens = event.message?.usage?.output_tokens ?? outputTokens;
          } else if (event.type === "message_delta") {
            outputTokens =
              (event as any).usage?.output_tokens ?? outputTokens;
          }
        }
      } catch (err) {
        failed = true;
        console.error("Analyse documentaire stream error:", err);
      } finally {
        controller.close();

        // Persist the final content + status
        await admin
          .from("analytical_notes")
          .update({
            content: fullContent || null,
            status: failed ? "failed" : "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", body.noteId)
          .eq("user_id", userId);

        await trackUsage(supabase, userId, "analyse_documentaire", {
          input_tokens: inputTokens,
          output_tokens: outputTokens,
        });
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Note-Id": body.noteId,
    },
  });
}
