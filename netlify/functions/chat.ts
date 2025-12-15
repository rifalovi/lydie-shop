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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Supabase (lecture / RPC = anon key)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/* =========================
   Utils RAG (améliorations)
   ========================= */
type Ref = {
  i: number;
  title: string;
  source: string;
  content: string;
  similarity: number;
  modified?: string;
};

async function expandQueries(q: string): Promise<string[]> {
  const p = `Donne 3 reformulations brèves et différentes de cette question, une par ligne, sans numérotation :
"${q}"`;
  const r = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.2,
    messages: [{ role: "user", content: p }],
  });
  const lines =
    r.choices[0]?.message?.content?.split("\n").map((s) => s.trim()).filter(Boolean) ?? [];
  return [q, ...lines].slice(0, 4); // original + 3 variantes
}

function dedupeBy<T>(arr: T[], key: (x: T) => string) {
  const m = new Map<string, T>();
  for (const x of arr) {
    const k = key(x);
    if (!m.has(k)) m.set(k, x);
  }
  return [...m.values()];
}
/* ========================= */

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors, body: "" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const top_k_env = Number(process.env.RAG_TOP_K || "");
    const min_sim_env = Number(process.env.RAG_MIN_SIMILARITY || "");

    const {
      messages,
      top_k = Number.isFinite(top_k_env) && top_k_env > 0 ? top_k_env : 6,
      temperature = 0.2,
      min_similarity = Number.isFinite(min_sim_env) ? min_sim_env : 0.22,
    } = body;

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
      const variants = await expandQueries(userText); // original + 3 reformulations
      const gathered: Ref[] = [];

      for (const v of variants) {
        const emb = await openai.embeddings.create({ model: embedModel, input: v });
        const query_embedding = emb.data[0].embedding;

        // RPC : match_documents(query_embedding, match_count, min_similarity)
        const { data, error } = await (supabase as any).rpc("match_documents", {
          query_embedding,
          match_count: Math.max(8, top_k), // récupère large
          min_similarity: 0.20,            // seuil bas côté SQL
        });
        if (error) {
          console.error("Supabase error:", error);
          continue;
        }
        for (const d of data || []) {
          gathered.push({
            i: 0,
            title: d.title,
            source: d.source,
            content: d.content,
            similarity: Number(d.similarity ?? 0),
            modified: d.modifiedTime ?? undefined,
          });
        }
      }

      // Dédoublonne, reclasse et filtre par seuil (app)
      const unique = dedupeBy(gathered, (x) => `${x.title}::${x.source}`)
        .map((x) => {
          let score = x.similarity;
          // Bonus récence possible si "modified" est exposé par la RPC :
          // if (x.modified && Date.now() - Date.parse(x.modified) < 365*24*3600*1000) score += 0.02;
          return { ...x, similarity: score };
        })
        .filter((x) => x.similarity >= min_similarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, Math.max(3, Math.min(6, top_k)));

      if (unique.length) {
        context = unique
          .map(
            (d, idx) =>
              `[${idx + 1}] TITRE: ${d.title}\nSOURCE: ${d.source}\n${d.content}`
          )
          .join("\n---\n");
        references = unique.map((d, idx) => ({
          i: idx + 1,
          title: d.title,
          source: d.source,
        }));
      }
    }
    // -----------------------------------------------------------------

    const system =
      `Tu es "Assistant SCSP" de l'OIF (Service de la Conception et du Suivi).\n` +
      `Règles :\n` +
      `- Réponds en français, de façon concise et structurée (puces si utile).\n` +
      `- Si tu t'appuies sur des documents internes, cite les références sous forme [n] (titre + lien Drive si présent).\n` +
      `- Si le contexte interne est insuffisant, dis-le clairement et pose une question de clarification.\n` +
      `- Reste dans le cadre OIF/SCS et la GAR ; pas de spéculation.`;

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
