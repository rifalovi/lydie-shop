// netlify/functions/sync-drive.ts
import type { Handler } from "@netlify/functions";
import { google } from "googleapis";
import OpenAI from "openai";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { createClient } from "@supabase/supabase-js";

// OpenAI (embeddings pour RAG si SUPABASE_* définis)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Supabase (optionnel)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/** Normalisation très tolérante du PEM si on passe par GOOGLE_PRIVATE_KEY(_B64) */
function normalizePem(raw: string): string {
  let s = raw || "";
  // Décode \n échappés
  s = s.replace(/\\n/g, "\n");
  // Supprime les retours chariot Windows
  s = s.replace(/\r/g, "");
  // Retire d'éventuels guillemets autour
  if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
  // Retire espaces parasites en début/fin de lignes
  s = s
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .trim();
  return s;
}

/** Récupère des credentials valides depuis 3 sources possibles */
function getGoogleCredentials():
  | { client_email: string; private_key: string }
  | undefined {
  // 1) On privilégie le JSON COMPLET encodé en Base64 (le plus sûr)
  const jsonB64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64;
  if (jsonB64 && jsonB64.trim()) {
    try {
      const json = Buffer.from(jsonB64, "base64").toString("utf8");
      const creds = JSON.parse(json);
      if (creds.client_email && creds.private_key) return creds;
    } catch {
      // on essaiera les méthodes suivantes
    }
  }

  // 2) Sinon, on accepte la private key en Base64 seule
  const keyB64 = process.env.GOOGLE_PRIVATE_KEY_B64;
  if (keyB64 && keyB64.trim()) {
    try {
      const pem = Buffer.from(keyB64, "base64").toString("utf8");
      return {
        client_email: process.env.GOOGLE_CLIENT_EMAIL || "",
        private_key: normalizePem(pem),
      };
    } catch {
      // fallback plus bas
    }
  }

  // 3) Sinon, on lit GOOGLE_PRIVATE_KEY multi-ligne
  const pem = normalizePem(process.env.GOOGLE_PRIVATE_KEY || "");
  if ((process.env.GOOGLE_CLIENT_EMAIL || "") && pem.includes("PRIVATE KEY"))
    return {
      client_email: process.env.GOOGLE_CLIENT_EMAIL || "",
      private_key: pem,
    };

  return undefined;
}

export const handler: Handler = async () => {
  try {
    const folderId = process.env.GDRIVE_FOLDER_ID;
    if (!folderId) throw new Error("GDRIVE_FOLDER_ID manquant");

    const creds = getGoogleCredentials();
    if (!creds) {
      throw new Error(
        "Identifiants Google invalides. Fournir GOOGLE_SERVICE_ACCOUNT_JSON_B64 (recommandé) OU GOOGLE_PRIVATE_KEY(_B64) + GOOGLE_CLIENT_EMAIL."
      );
    }

    // Auth robuste via GoogleAuth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: creds.client_email,
        private_key: creds.private_key,
      },
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const drive = google.drive({ version: "v3", auth });

    // Support aussi les Drives partagés
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

      // Téléchargement
      const res = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "arraybuffer" }
      );
      const buf = Buffer.from(res.data as any);

      // Extraction texte
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
        continue; // type non géré
      }

      // Découpage pour embeddings
      const max = 1200;
      const chunks: string[] = [];
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

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ indexed }),
    };
  } catch (e: any) {
    console.error(e);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: e.message }),
    };
  }
};
