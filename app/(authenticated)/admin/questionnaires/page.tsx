"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ClipboardList, Plus, Trash2, Edit3 } from "lucide-react";
import type { Questionnaire, Project } from "@/lib/types";

export default function AdminQuestionnairesPage() {
  const supabase = createClient();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const [{ data: projs }, { data: qs }] = await Promise.all([
      supabase.from("projects").select("*").eq("user_id", user.id),
      supabase
        .from("questionnaires")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (projs) setProjects(projs as Project[]);
    if (qs) setQuestionnaires(qs as Questionnaire[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate() {
    setError(null);
    if (!selectedProject) {
      setError("Sélectionnez un projet.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/questionnaire/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProject }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        setError(payload.error || "Génération impossible.");
      } else {
        await load();
      }
    } catch (err: any) {
      setError(err?.message || "Erreur réseau.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce questionnaire ?")) return;
    const res = await fetch(`/api/admin/questionnaires/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setQuestionnaires((prev) => prev.filter((q) => q.id !== id));
    } else {
      const payload = await res.json().catch(() => ({}));
      alert(payload.error || "Suppression impossible.");
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-oif-blue flex items-center gap-2">
          <ClipboardList className="w-6 h-6" /> Questionnaires ERA
        </h1>
        <p className="text-oif-gray-500 mt-1">
          Générer, modifier puis activer les questionnaires à partir des indicateurs du projet.
        </p>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold text-oif-gray-700 mb-3">Générer un questionnaire</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="input-field sm:max-w-sm"
          >
            <option value="">— Sélectionner un projet —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code ? `[${p.code}] ` : ""}
                {p.title}
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedProject}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            {generating ? "Génération..." : "Générer"}
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-3">
            {error}
          </p>
        )}
      </div>

      <h2 className="text-sm font-semibold text-oif-gray-500 uppercase tracking-wider mb-3">
        Questionnaires existants
      </h2>
      {loading ? (
        <div className="text-oif-gray-400 animate-pulse">Chargement...</div>
      ) : questionnaires.length === 0 ? (
        <div className="card text-center py-12">
          <ClipboardList className="w-12 h-12 text-oif-gray-300 mx-auto mb-3" />
          <p className="text-oif-gray-500">Aucun questionnaire pour le moment.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {questionnaires.map((q) => (
            <li key={q.id} className="card flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      q.status === "active"
                        ? "bg-green-100 text-green-700"
                        : q.status === "archived"
                          ? "bg-oif-gray-100 text-oif-gray-600"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {q.status}
                  </span>
                  <span className="text-xs text-oif-gray-400">
                    {Array.isArray(q.questions) ? q.questions.length : 0} questions
                  </span>
                </div>
                <p className="font-medium text-oif-gray-700 truncate">{q.title}</p>
                {q.description && (
                  <p className="text-xs text-oif-gray-400 mt-0.5 line-clamp-2">{q.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/questionnaires/${q.id}`}
                  className="text-oif-blue hover:bg-oif-blue-50 p-2 rounded-md"
                  title="Modifier"
                >
                  <Edit3 className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded-md"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
