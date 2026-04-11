import { NextRequest } from "next/server";
import { openai, MODEL_CHAT } from "@/lib/openai";
import { buildChatSystemPrompt } from "@/lib/prompts";
import { getFeaturedProducts } from "@/lib/products";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/chat — chatbot Lydie, streaming SSE
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      messages: ChatMessage[];
      userId?: string;
      sessionId?: string;
    };

    const { messages } = body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages requis" }),
        { status: 400 },
      );
    }

    // Contexte dynamique — en production, injecter le stock réel et la
    // dernière commande de la cliente connectée depuis Prisma.
    const topProducts = getFeaturedProducts();
    const systemPrompt = buildChatSystemPrompt({ topProducts });

    const stream = await openai.chat.completions.create({
      model: MODEL_CHAT,
      stream: true,
      temperature: 0.7,
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    // Convertit les chunks OpenAI en stream texte simple consommable côté client.
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? "";
            if (delta) controller.enqueue(encoder.encode(delta));
          }
        } catch (err) {
          controller.error(err);
          return;
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err) {
    console.error("[/api/chat] error", err);
    return new Response(
      JSON.stringify({ error: "Erreur du chatbot. Réessayez dans un instant." }),
      { status: 500 },
    );
  }
}
