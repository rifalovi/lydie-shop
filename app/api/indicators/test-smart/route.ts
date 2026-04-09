import Anthropic from "@anthropic-ai/sdk";
import { getSmartTestPrompt } from "@/lib/prompts/system";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { indicator } = await req.json();

  const prompt = getSmartTestPrompt(indicator);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const scores = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

  return NextResponse.json({ scores });
}
