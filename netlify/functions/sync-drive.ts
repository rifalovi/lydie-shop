// netlify/functions/sync-drive.ts
import type { Handler } from "@netlify/functions";
import { google } from "googleapis";
import OpenAI from "openai";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Supabase (insertion : on privilégie la service_role côté serveur)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && (supabaseServiceKey || supabaseAnonKey)
    ? createClient(supabaseUrl, (supabaseServiceKey || supabaseAnonKey)!)
    : null;

// ——— Normalisation robuste du PEM ———
function normalizePem(raw: string): string {
  let s = raw || "";
  s = s.replace(/\\n/g, "\n"); // convertir \n échappés
  s = s.replace(/\r/g, "");    // retirer \r windows
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1); // enlever guillemets englobants
  }
  s = s
    .split("\n")
    .map((l) => l.replace(/\s+$/g, ""))
    .join("\n")
    .trim();
  return s;
}

// ——— Credentials Google depuis 3 sources ———
function getGoogleCredentials(): { client_email: string; private_key: string } {
  // 1) JSON complet Base64 (recommandé)
  const jsonB64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64;
  if (jsonB64 && jsonB64.trim()) {
    const json = Buffer.from(jsonB64, "base64").toString("utf8");
    const creds = JSON.parse(json);
    creds.private_key = normalizePem(creds.private_key || "");
    return creds;
  }
  // 2) PEM Base64
  const keyB64 = process.env.GOOGLE_PRIVATE_KEY_B64;
  if (keyB64 && keyB64.trim()) {
    const pem = normalizePem(Buffer.from(keyB64, "base64").toString("utf8"));
    return { client_email: process.env.GOOGLE_CLIENT_EMAIL || "", private_key: pem };
  }
  // 3) PEM multi-ligne
  const pem = normalizePem(process.env.GOOGLE_PRIVATE_KEY || "");
  return { client_email: process.env.GOOGLE_CLIENT_EMAIL || "", private_key: pem };
}

export const handler: Handler = async () => {
  try {
    const folderId = process.env.GDRIVE_FOLDER_ID;
    if (!folderId) throw new Error("GDRIVE_FOLDER_ID manquant");

    const creds = getGoogleCredentials();
    if (!creds.client_email) throw new Error("GOOGLE_CLIENT_EMAIL / client_email manquant");
    if (!creds.private_key) throw new Error("GOOGLE_PRIVATE_KEY manquante");
    if (
      !creds.private_key.includes("-----BEGIN PRIVATE KEY-----") ||
      !creds.private_key.includes("-----END PRIVATE KEY-----")
    ) {
      throw new Error("private_key invalide (en-tête/pied PEM absent)");
    }

    // Auth Google (Drive Readonly)
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: creds.client_email,
        private_key: creds.private_key,
      },
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const drive = google.drive({ version: "v3", auth });

    // Lister les fichiers du dossier (compatible Drives partagés)
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

      // Télécharger le contenu
      const res = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "arraybuffer" }
      );
      const buf = Buffer.from(res.data as any);

      // Extraire le texte selon le type
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
        // type non géré -> on ignore
        continue;
      }

      // Découper en blocs pour l’index
      const max = 1200;
      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += max) chunks.push(text.slice(i, i + max));

      // Indexation (embeddings → Supabase)
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
