// netlify/functions/chat.ts
import type { Handler } from "@netlify/functions";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const cors = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Supabase (optionnel pour RAG)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors, body: "" };
  }

  try {
    const { messages, top_k = 6, temperature = 0.2 } = JSON.parse(event.body || "{}");
    const userText = (messages || [])
      .filter((m: any) => m.role === "user")
      .map((m: any) => String(m.content ?? ""))
      .join("\n")
      .trim();

    // ---------- RAG : construire le contexte depuis Supabase ----------
    let context = "";
    let references: Array<{ i: number; title: string; source: string }> = [];

    if (supabase && userText) {
      const embedModel = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";
      const emb = await openai.embeddings.create({ model: embedModel, input: userText });
      const query_embedding = emb.data[0].embedding;

      // match_documents(query_embedding, match_count, min_similarity)
      const { data, error } = await (supabase as any).rpc("match_documents", {
        query_embedding,
        match_count: top_k,
        min_similarity: 0.2,
      });

      if (error) {
        console.error("Supabase error:", error);
      } else if (data?.length) {
        references = data.map((d: any, i: number) => ({
          i: i + 1,
          title: d.title,
          source: d.source,
        }));
        context = data
          .map(
            (d: any, i: number) =>
              `[${i + 1}] TITRE: ${d.title}\nSOURCE: ${d.source}\n${d.content}`
          )
          .join("\n---\n");
      }
    }
    // -----------------------------------------------------------------

    const system =
      `Tu es "Assistant SCSP" de l'OIF (Service de la Conception et du Suivi).\n` +
      `- Tu appliques la GAR et utilises le corpus interne quand disponible.\n` +
      `- Si tu t'appuies sur des documents internes, cite les références (numéro [n], titre et lien Drive si présent).\n` +
      `- Reste concis, en français.`;

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const completion = await openai.chat.completions.create({
      model,
      temperature,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            `Question:\n${userText || "(vide)"}\n\n` +
            (context ? `Contexte interne (extraits):\n${context}\n` : ""),
        },
      ],
    });

    const answer = completion.choices?.[0]?.message?.content?.trim() || "";

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ answer, references }),
    };
  } catch (e: any) {
    console.error("chat error:", e?.response?.data || e);
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: e?.message || "Erreur serveur" }),
    };
  }
};
