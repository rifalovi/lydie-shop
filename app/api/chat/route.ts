import Anthropic from "@anthropic-ai/sdk";
import { getSystemPrompt } from "@/lib/prompts/system";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { trackUsage } from "@/lib/usage";
import { NextRequest } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ChatMessageIn = {
  role: "user" | "assistant";
  content: string;
  // optional attachment on the latest user turn
  imageBase64?: string;
  imageMediaType?: string;
};

type AllowedImageMediaType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp";

type AnthropicBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: AllowedImageMediaType;
        data: string;
      };
    };

function normalizeImageMediaType(raw?: string): AllowedImageMediaType {
  const allowed: AllowedImageMediaType[] = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  return allowed.includes(raw as AllowedImageMediaType)
    ? (raw as AllowedImageMediaType)
    : "image/jpeg";
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    messages,
    projectId,
    currentStep,
    imageBase64,
    imageMediaType,
    message,
  }: {
    messages: ChatMessageIn[];
    projectId?: string;
    currentStep?: number;
    imageBase64?: string;
    imageMediaType?: string;
    message?: string;
  } = body;

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  let projectContext = "";

  if (projectId) {
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

  // Build the request messages. If an image is attached to the latest turn,
  // rewrite that turn as a multimodal content array (image + text) as required
  // by the Anthropic Messages API.
  const formattedMessages: { role: "user" | "assistant"; content: string | AnthropicBlock[] }[] =
    (messages ?? []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

  if (imageBase64) {
    const text =
      (message && message.trim().length > 0 ? message : undefined) ||
      (formattedMessages.length > 0 &&
      typeof formattedMessages[formattedMessages.length - 1].content === "string"
        ? (formattedMessages[formattedMessages.length - 1].content as string)
        : "Analyse cette image");

    const imageBlock: AnthropicBlock = {
      type: "image",
      source: {
        type: "base64",
        media_type: normalizeImageMediaType(imageMediaType),
        data: imageBase64,
      },
    };
    const textBlock: AnthropicBlock = { type: "text", text };

    const userTurn = {
      role: "user" as const,
      content: [imageBlock, textBlock],
    };

    if (
      formattedMessages.length > 0 &&
      formattedMessages[formattedMessages.length - 1].role === "user"
    ) {
      formattedMessages[formattedMessages.length - 1] = userTurn;
    } else {
      formattedMessages.push(userTurn);
    }
  }

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: formattedMessages,
  });

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      let inputTokens = 0;
      let outputTokens = 0;
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
              )
            );
          } else if (event.type === "message_start") {
            inputTokens =
              event.message?.usage?.input_tokens ?? inputTokens;
            outputTokens =
              event.message?.usage?.output_tokens ?? outputTokens;
          } else if (event.type === "message_delta") {
            outputTokens =
              (event as any).usage?.output_tokens ?? outputTokens;
          }
        }
      } catch (err) {
        console.error("Chat stream error:", err);
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();

        await trackUsage({
          userId,
          action: "chat",
          usage: { input_tokens: inputTokens, output_tokens: outputTokens },
        });
      }
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
