import Anthropic from "@anthropic-ai/sdk";
import { getSystemPrompt } from "@/lib/prompts/system";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { messages, projectId, currentStep } = await req.json();

  let projectContext = "";

  if (projectId) {
    const supabase = createServerSupabaseClient();
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (project) {
      const { data: results } = await supabase
        .from("results_chain")
        .select("*")
        .eq("project_id", projectId)
        .order("order_index");

      const { data: indicators } = await supabase
        .from("indicators")
        .select("*")
        .eq("project_id", projectId);

      projectContext = `Titre : ${project.title}
Code : ${project.code || "Non défini"}
Programme stratégique : ${project.programme_strategique || "Non défini"}
Pays : ${project.countries?.join(", ") || "Non défini"}
Budget total : ${project.budget_total ? project.budget_total + " €" : "Non défini"}
Objectif global : ${project.global_objective || "Non défini"}
Statut : ${project.status}
${results?.length ? `\nChaîne de résultats :\n${results.map((r) => `- [${r.level}] ${r.title}`).join("\n")}` : ""}
${indicators?.length ? `\nIndicateurs :\n${indicators.map((i) => `- [${i.code}] ${i.title}`).join("\n")}` : ""}`;
    }
  }

  const systemPrompt = getSystemPrompt(projectContext, currentStep);

  const formattedMessages = messages.map((m: { role: string; content: string }) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: formattedMessages,
  });

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
