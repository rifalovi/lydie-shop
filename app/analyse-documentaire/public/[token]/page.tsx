"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { FileText, Printer } from "lucide-react";

interface PublicNote {
  id: string;
  subject: string;
  content: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

export default function PublicNotePage() {
  const params = useParams<{ token: string }>();
  const [note, setNote] = useState<PublicNote | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/analyse-documentaire/public/${params.token}`);
        const payload = await res.json();
        if (!res.ok) {
          setError(payload.error || "Lien invalide.");
        } else {
          setNote(payload.note);
          setExpiresAt(payload.expires_at);
        }
      } catch (err: any) {
        setError(err?.message || "Erreur réseau.");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-oif-gray-50">
        <div className="animate-pulse text-oif-gray-400">Chargement...</div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-oif-gray-50 p-6">
        <div className="max-w-md text-center">
          <FileText className="w-12 h-12 text-oif-gray-300 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-oif-gray-700 mb-2">
            Note non accessible
          </h1>
          <p className="text-sm text-oif-gray-500">{error ?? "Lien invalide."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-oif-gray-50 py-8 px-4 print:py-0 print:px-0 print:bg-white">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-4 print:hidden">
          <div>
            <h1 className="text-lg font-bold text-oif-blue flex items-center gap-2">
              <FileText className="w-5 h-5" /> {note.subject}
            </h1>
            {expiresAt && (
              <p className="text-xs text-oif-gray-400 mt-0.5">
                Lien public valide jusqu&apos;au{" "}
                {new Date(expiresAt).toLocaleDateString("fr-FR")}
              </p>
            )}
          </div>
          <button
            onClick={() => window.print()}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Imprimer
          </button>
        </header>

        <article className="print-area bg-white border border-oif-gray-200 rounded-xl p-6 print:border-0 print:p-0 print:shadow-none">
          <header className="hidden print:block text-center border-b border-oif-gray-300 pb-2 mb-4">
            <div className="text-xs text-oif-gray-500">
              Organisation Internationale de la Francophonie — Service de Conception et de Suivi des projets
            </div>
          </header>

          {note.content ? (
            <MarkdownRenderer content={note.content} />
          ) : (
            <p className="text-oif-gray-500 text-sm">Aucun contenu.</p>
          )}

          <footer className="hidden print:block text-center border-t border-oif-gray-300 pt-2 mt-6 text-xs text-oif-gray-500">
            Assistant SCS — OIF Confidentiel
          </footer>
        </article>
      </div>
    </div>
  );
}
