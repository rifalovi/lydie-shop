import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Le contenu doit être multipart/form-data." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const titleField = formData.get("title");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "Aucun fichier fourni." },
        { status: 400 }
      );
    }

    const filename = (file as File).name || "document.pdf";
    const fileType = (file as File).type || "";

    if (
      !filename.toLowerCase().endsWith(".pdf") &&
      !fileType.toLowerCase().includes("pdf")
    ) {
      return NextResponse.json(
        { error: "Seuls les fichiers PDF sont acceptés." },
        { status: 400 }
      );
    }

    const arrayBuffer = await (file as File).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json(
        { error: "Le fichier est vide." },
        { status: 400 }
      );
    }

    // Import pdf-parse via its internal module to avoid the debug-mode
    // bootstrap test in the package index that reads a fixture file at runtime.
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js" as any))
      .default as (data: Buffer) => Promise<{
      text: string;
      numpages: number;
    }>;

    let parsed: { text: string; numpages: number };
    try {
      parsed = await pdfParse(buffer);
    } catch (parseError: any) {
      console.error("PDF parse error:", parseError);
      return NextResponse.json(
        {
          error:
            "Impossible de lire le PDF. Vérifiez qu'il n'est pas protégé ou corrompu.",
          details: parseError?.message ?? String(parseError),
        },
        { status: 422 }
      );
    }

    const text = (parsed.text || "").trim();
    const title =
      typeof titleField === "string" && titleField.trim().length > 0
        ? titleField.trim()
        : filename.replace(/\.pdf$/i, "");

    const { data: inserted, error: insertError } = await supabase
      .from("knowledge_documents")
      .insert({
        uploaded_by: user.id,
        title,
        filename,
        content: text,
        page_count: parsed.numpages ?? null,
        char_count: text.length,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Knowledge insert error:", insertError);
      return NextResponse.json(
        {
          error: "Impossible d'enregistrer le document.",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document: inserted,
    });
  } catch (err: any) {
    console.error("Upload route unexpected error:", err);
    return NextResponse.json(
      {
        error: "Erreur interne lors du traitement du document.",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
