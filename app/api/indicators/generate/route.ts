import Anthropic from "@anthropic-ai/sdk";
import { getIndicatorGenerationPrompt } from "@/lib/prompts/system";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { trackUsage } from "@/lib/usage";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { projectId, resultId, level, description } = await req.json();

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  const projectContext = project
    ? `Titre: ${project.title}\nProgramme: ${project.programme_strategique}\nObjectif: ${project.global_objective}`
    : "Aucun contexte disponible";

  const prompt = getIndicatorGenerationPrompt(level, description, projectContext);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "[]";

  // Extract JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  const indicators = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

  await trackUsage({
    userId,
    action: "indicator_generate",
    usage: response.usage,
  });

  return NextResponse.json({ indicators });
}
