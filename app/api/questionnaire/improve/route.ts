import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { trackUsage } from "@/lib/usage";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text, type } = await req.json();
    if (!text) {
      return NextResponse.json(
        { error: "Le champ 'text' est requis." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id ?? null;

    const prompt = `Tu es un expert S&E de l'OIF. Reformule cette question d'enquête pour qu'elle soit claire, neutre, bienveillante et compréhensible par un bénéficiaire. La question doit rester compatible avec le type de réponse "${type ?? "texte_libre"}". Renvoie UNIQUEMENT la nouvelle formulation, sans guillemets ni commentaires. En français.

Question originale : ${text}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    await trackUsage({
      userId,
      action: "questionnaire_improve",
      usage: response.usage,
    });

    const out =
      response.content[0].type === "text"
        ? response.content[0].text.trim()
        : text;

    return NextResponse.json({ text: out });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erreur interne.", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
