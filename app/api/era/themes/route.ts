import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { trackUsage } from "@/lib/usage";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { responses } = await req.json();

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const prompt = `Tu es un expert en analyse qualitative pour l'OIF. Code thématiquement les réponses ouvertes suivantes selon les thèmes prédéfinis : ressources, accompagnement, confiance, accès, emploi, éducation, culture, participation.

Réponses à analyser :
${responses.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n")}

Pour chaque thème identifié, fournis :
- Le nom du thème
- Le nombre de réponses liées
- 2-3 verbatims représentatifs (anonymisés)

Réponds en JSON : { "themes": [{ "name": "...", "count": N, "verbatims": ["...", "..."] }] }`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { themes: [] };

  await trackUsage({
    userId,
    action: "era_themes",
    usage: response.usage,
  });

  return NextResponse.json(result);
}
