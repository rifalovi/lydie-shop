import type { Handler } from "@netlify/functions";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, body: "" };
  }
  try {
    const { messages, top_k = 6, temperature = 0.2 } = JSON.parse(event.body || "{}");
    const userText = (messages || []).filter((m: any) => m.role === "user").map((m: any) => m.content).join("\n");

    let context = "";
    if (supabase) {
      const { data, error } = await (supabase as any).rpc("match_documents", {
        query_text: userText,
        match_count: top_k,
      });
      if (error) console.error("Supabase error:", error);
      if (data?.length) {
        context = data.map((d: any) => `TITRE: ${d.title}\nSOURCE: ${d.source}\n${d.content}`).join("\n---\n");
      }
    }

    const system = `Tu es "Assistant SCSP" de l'OIF (Service de la Conception et du Suivi).
- Tu appliques la GAR et cites la source interne quand pertinent.
- Si la réponse dépend de documents internes, résume et renvoie les références (titre + lien Drive si disponible).
- Reste concis, en français.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Question:\n${userText}\n\nContexte interne (extraits):\n${context}` },
      ],
    });

    const answer = completion.choices[0]?.message?.content || "";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    };
  } catch (e: any) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
