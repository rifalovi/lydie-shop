"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Upload, Trash2, FileText } from "lucide-react";
import type { KnowledgeDocument } from "@/lib/types";

export default function AdminKnowledgePage() {
  const supabase = createClient();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");

  async function loadDocs() {
    setLoading(true);
    const { data } = await supabase
      .from("knowledge_documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setDocuments(data as KnowledgeDocument[]);
    setLoading(false);
  }

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!file) {
      setError("Veuillez sélectionner un fichier PDF.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (title.trim()) fd.append("title", title.trim());

      const res = await fetch("/api/admin/knowledge/upload", {
        method: "POST",
        body: fd,
      });

      // The route always returns JSON, so this is safe.
      let payload: any = {};
      try {
        payload = await res.json();
      } catch {
        payload = { error: "Réponse non JSON." };
      }

      if (!res.ok || !payload.success) {
        setError(payload.error || "Échec de l'upload.");
      } else {
        setInfo(`Document importé (${payload.document.char_count ?? 0} caractères extraits).`);
        setFile(null);
        setTitle("");
        await loadDocs();
      }
    } catch (err: any) {
      setError(err?.message || "Erreur réseau.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce document ?")) return;
    const res = await fetch(`/api/admin/knowledge/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-oif-blue flex items-center gap-2">
          <BookOpen className="w-6 h-6" /> Base de connaissances
        </h1>
        <p className="text-oif-gray-500 mt-1">
          Importez des PDF de référentiels OIF (référentiel SSE, guide GAR, etc.).
        </p>
      </div>

      <form onSubmit={handleUpload} className="card mb-6 space-y-4">
        <div>
          <label className="label-field">Titre (optionnel)</label>
          <input
            className="input-field"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Référentiel SSE OIF 2024"
          />
        </div>
        <div>
          <label className="label-field">Fichier PDF</label>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-oif-gray-600"
          />
        </div>
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        {info && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
            {info}
          </p>
        )}
        <button
          type="submit"
          disabled={uploading || !file}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Import en cours..." : "Importer le PDF"}
        </button>
      </form>

      <h2 className="text-sm font-semibold text-oif-gray-500 uppercase tracking-wider mb-3">
        Documents importés
      </h2>
      {loading ? (
        <div className="text-oif-gray-400 animate-pulse">Chargement...</div>
      ) : documents.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-oif-gray-300 mx-auto mb-3" />
          <p className="text-oif-gray-500">Aucun document pour le moment.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="card flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-oif-gray-700 truncate">{doc.title}</p>
                <p className="text-xs text-oif-gray-400 mt-0.5">
                  {doc.filename} · {doc.page_count ?? "?"} pages · {doc.char_count ?? 0} caractères
                </p>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                className="text-red-600 hover:bg-red-50 p-2 rounded-md"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
