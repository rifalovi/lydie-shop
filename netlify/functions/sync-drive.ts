// netlify/functions/sync-drive.ts
import type { Handler } from "@netlify/functions";
import { google } from "googleapis";
import OpenAI from "openai";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Supabase (optionnel)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const handler: Handler = async () => {
  try {
    const folderId = process.env.GDRIVE_FOLDER_ID;
    if (!folderId) throw new Error("GDRIVE_FOLDER_ID manquant");
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error("Variables Google manquantes (GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY)");
    }

    // ✅ Auth robuste avec GoogleAuth (et gestion des \n)
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const drive = google.drive({ version: "v3", auth });

    // ✅ Support des Drives partagés
    const list = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id, name, mimeType, modifiedTime)",
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });

    const files = list.data.files || [];
    let indexed = 0;

    for (const f of files) {
      const fileId = f.id!;
      const name = f.name || "Sans titre";
      const mime = f.mimeType || "";

      // Téléchargement du contenu
      const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
      const buf = Buffer.from(res.data as any);

      // Extraction texte selon le type
      let text = "";
      if (mime.includes("pdf")) {
        const parsed = await pdf(buf);
        text = parsed.text;
      } else if (mime.includes("word") || name.toLowerCase().endsWith(".docx")) {
        const parsed = await mammoth.extractRawText({ buffer: buf });
        text = parsed.value;
      } else if (mime.startsWith("text/") || name.toLowerCase().endsWith(".txt")) {
        text = buf.toString("utf-8");
      } else {
        // Type non géré : on ignore
        continue;
      }

      // Découpage en morceaux
      const chunks: string[] = [];
      const max = 1200;
      for (let i = 0; i < text.length; i += max) chunks.push(text.slice(i, i + max));

      // Indexation (si Supabase configuré)
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

      indexed++;
    }

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ indexed }) };
  } catch (e: any) {
    console.error(e);
    return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: e.message }) };
  }
};
