import type { Handler } from "@netlify/functions";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Supabase (optionnel)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// En-têtes CORS pour UI Web
const cors = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

    // Construit le contexte à partir de Supabase (si configuré)
    let context = "";
    if (supabase && userText) {
      // 1) Embedding de la question
      const embedModel = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";
      const emb = await openai.embeddings.create({ model: embedModel, input: userText });
      const query_embedding = emb.data[0].embedding;

      // 2) Appel RPC match_documents(query_embedding, match_count, min_similarity)
      const { data, error } = await (supabase as any).rpc("match_documents", {
        query_embedding,
        match_count: top_k,
        min_similarity: 0.2,
      });
      if (error) {
        console.error("Supabase error:", error);
      } else if (data?.length) {
        context = data
          .map(
            (d: any, i: number) =>
              `[${i + 1}] TITRE: ${d.title}\nSOURCE: ${d.source}\n${d.content}`
          )
          .join("\n---\n");
      }
    }

    const system =
      `Tu es "Assistant SCSP" de l'OIF (Service de la Conception et du Suivi).\n` +
      `- Tu appliques la GAR et utilises le corpus interne quand disponible.\n` +
      `- Si tu t'appuies sur des documents internes, cite les références (numéro entre crochets [n], titre et lien Drive si présent) à la fin de la réponse.\n` +
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
      body: JSON.stringify({ answer }),
    };
  } catch (e: any) {
    console.error("chat error:", e?.response?.data || e);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) };
  }
};
