import Anthropic from "@anthropic-ai/sdk";
import { getSuggestionPrompt } from "@/lib/prompts/system";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { trackUsage } from "@/lib/usage";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { step, projectData, field } = await req.json();

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const prompt = getSuggestionPrompt(step, field, projectData);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  await trackUsage({
    userId,
    action: "incubation_suggest",
    usage: response.usage,
  });

  return NextResponse.json({ suggestion: text });
}
