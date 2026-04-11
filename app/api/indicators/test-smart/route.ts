import Anthropic from "@anthropic-ai/sdk";
import { getSmartTestPrompt } from "@/lib/prompts/system";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { trackUsage } from "@/lib/usage";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { indicator } = await req.json();

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const prompt = getSmartTestPrompt(indicator);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const scores = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

  await trackUsage({
    userId,
    action: "indicator_smart_test",
    usage: response.usage,
  });

  return NextResponse.json({ scores });
}
