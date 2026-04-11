import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { openai, MODEL_PRODUCT } from "@/lib/openai";
import { buildProductGenerationPrompt } from "@/lib/prompts";

export const runtime = "nodejs";

const bodySchema = z.object({
  productName: z.string().min(2),
  category: z.string().min(2),
  additionalInfo: z.string().optional(),
});

// POST /api/ai/generate-product
// Génère une fiche produit complète à partir du nom + catégorie + infos libres.
// Utilise `response_format: json_object` pour garantir un JSON valide.
export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const prompt = buildProductGenerationPrompt(parsed.data);

    const completion = await openai.chat.completions.create({
      model: MODEL_PRODUCT,
      response_format: { type: "json_object" },
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/ai/generate-product] error", err);
    return NextResponse.json(
      { error: "Erreur de génération. Réessayez dans un instant." },
      { status: 500 },
    );
  }
}
