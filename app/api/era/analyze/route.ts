import Anthropic from "@anthropic-ai/sdk";
import { getEraAnalysisPrompt } from "@/lib/prompts/system";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { trackUsage } from "@/lib/usage";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { projectId, eraData, indicators } = await req.json();

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
    ? `Titre: ${project.title}\nProgramme: ${project.programme_strategique}\nObjectif: ${project.global_objective}\nPays: ${project.countries?.join(", ")}`
    : "";

  const prompt = getEraAnalysisPrompt(
    projectContext,
    JSON.stringify(indicators, null, 2),
    JSON.stringify(eraData, null, 2)
  );

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

  await trackUsage({
    userId,
    action: "era_analyze",
    usage: response.usage,
  });

  return NextResponse.json(analysis);
}
