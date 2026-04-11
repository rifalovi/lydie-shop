"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import {
  FileText,
  Download,
  Printer,
  Share2,
  RotateCw,
  Check,
  Copy,
} from "lucide-react";
import type { AnalyticalNote } from "@/lib/types";

export default function AnalyticalNoteResultPage() {
  const params = useParams<{ id: string }>();
  const supabase = createClient();
  const [note, setNote] = useState<AnalyticalNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("analytical_notes")
      .select("*")
      .eq("id", params.id)
      .single();
    if (data) setNote(data as AnalyticalNote);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleRegenerate() {
    if (!note) return;
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/analyse-documentaire/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId: note.id,
          subject: note.subject,
          scopeProjects: note.scope_projects,
          scopePs: note.scope_ps,
          scopeCountries: note.scope_countries,
          periodStart: note.period_start,
          periodEnd: note.period_end,
          sectionsSelected: note.sections_selected,
          detailLevel: note.detail_level,
          audience: note.audience,
        }),
      });
      if (!res.ok || !res.body) {
        setError("Régénération impossible.");
        setRegenerating(false);
        return;
      }
      // Stream markdown back into the preview live
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setNote((prev) =>
          prev ? { ...prev, content: accumulated, status: "generating" } : prev
        );
      }
      await load();
    } catch (err: any) {
      setError(err?.message || "Erreur réseau.");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleDownloadDocx() {
    if (!note?.content) return;
    setDownloading(true);
    try {
      const { markdownToDocxBlob } = await import("@/lib/markdown-to-docx");
      const blob = await markdownToDocxBlob(note.content, note.subject);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.subject.replace(/[^a-z0-9]+/gi, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || "Échec du téléchargement.");
    } finally {
      setDownloading(false);
    }
  }

  function handlePrintPdf() {
    window.print();
  }

  async function handleShare() {
    if (!note) return;
    setError(null);
    try {
      const res = await fetch(`/api/analyse-documentaire/${note.id}/share`, {
        method: "POST",
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error || "Partage impossible.");
        return;
      }
      const fullUrl = `${window.location.origin}${payload.url}`;
      setShareUrl(fullUrl);
    } catch (err: any) {
      setError(err?.message || "Erreur réseau.");
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-pulse text-oif-gray-400">Chargement...</div>
      </div>
    );
  }

  if (!note) {
    return <div className="p-8 text-oif-gray-500">Note introuvable.</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-oif-blue flex items-center gap-2">
          <FileText className="w-6 h-6" /> Note analytique
        </h1>
        <p className="text-oif-gray-500 text-sm mt-1">
          Statut : <span className="font-medium">{note.status}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 print:hidden">
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="btn-secondary inline-flex items-center gap-2 disabled:opacity-60"
        >
          <RotateCw className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
          {regenerating ? "Régénération..." : "Régénérer"}
        </button>
        <button
          onClick={handleDownloadDocx}
          disabled={!note.content || downloading}
          className="btn-secondary inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          {downloading ? "Génération..." : "Télécharger Word"}
        </button>
        <button
          onClick={handlePrintPdf}
          disabled={!note.content}
          className="btn-secondary inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Printer className="w-4 h-4" /> Télécharger PDF
        </button>
        <button
          onClick={handleShare}
          disabled={!note.content}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Share2 className="w-4 h-4" /> Partager (7 jours)
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3 print:hidden">
          {error}
        </p>
      )}

      {shareUrl && (
        <div className="mb-4 p-3 border border-oif-blue-50 bg-oif-blue-50 rounded-md flex items-center gap-2 print:hidden">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 bg-white border border-oif-gray-200 rounded-md px-3 py-1.5 text-xs font-mono"
          />
          <button
            onClick={copyShareUrl}
            className="inline-flex items-center gap-1 text-sm text-oif-blue hover:bg-white px-2 py-1 rounded-md"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
      )}

      <article className="print-area bg-white border border-oif-gray-200 rounded-xl p-6 print:border-0 print:p-0 print:shadow-none">
        <header className="hidden print:block text-center border-b border-oif-gray-300 pb-2 mb-4">
          <div className="text-xs text-oif-gray-500">
            Organisation Internationale de la Francophonie — Service de Conception et de Suivi des projets
          </div>
        </header>

        {note.content ? (
          <MarkdownRenderer content={note.content} />
        ) : (
          <p className="text-oif-gray-500 text-sm">
            Aucun contenu pour le moment. Cliquez sur « Régénérer » pour lancer l&apos;analyse.
          </p>
        )}

        <footer className="hidden print:block text-center border-t border-oif-gray-300 pt-2 mt-6 text-xs text-oif-gray-500">
          Assistant SCS — OIF Confidentiel
        </footer>
      </article>
    </div>
  );
}
