import type { Handler } from "@netlify/functions";
import { google } from "googleapis";
import OpenAI from "openai";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const handler: Handler = async () => {
  try {
    if (!process.env.GDRIVE_FOLDER_ID) throw new Error("GDRIVE_FOLDER_ID manquant");

    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      undefined,
      (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/drive.readonly"]
    );
    const drive = google.drive({ version: "v3", auth });

    const list = await drive.files.list({
      q: `'${process.env.GDRIVE_FOLDER_ID}' in parents and trashed=false`,
      fields: "files(id, name, mimeType, modifiedTime)"
    });

    const items = list.data.files || [];
    for (const f of items) {
      const fileId = f.id!;
      const name = f.name || "Sans titre";
      const mime = f.mimeType || "";

      const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
      const buf = Buffer.from(res.data as any);

      let text = "";
      if (mime.includes("pdf")) {
        const parsed = await pdf(buf);
        text = parsed.text;
      } else if (mime.includes("word") || name.endsWith(".docx")) {
        const parsed = await mammoth.extractRawText({ buffer: buf });
        text = parsed.value;
      } else if (mime.startsWith("text/") || name.endsWith(".txt")) {
        text = buf.toString("utf-8");
      } else {
        continue;
      }

      const chunks: string[] = [];
      const max = 1200;
      for (let i = 0; i < text.length; i += max) chunks.push(text.slice(i, i + max));

      if (supabase && chunks.length) {
        for (const c of chunks) {
          const emb = await openai.embeddings.create({
            model: process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small",
            input: c,
          });
          const vector = emb.data[0].embedding;
          await supabase.from("documents").insert({
            doc_id: fileId,
            title: name,
            content: c,
            source: `https://drive.google.com/open?id=${fileId}`,
            embedding: vector,
          });
        }
      }
    }

    return { statusCode: 200, body: JSON.stringify({ indexed: (items || []).length }) };
  } catch (e: any) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
