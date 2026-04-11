"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  Plus,
  ChevronRight,
} from "lucide-react";
import type {
  AnalyticalNote,
  Project,
} from "@/lib/types";
import { ANALYTICAL_NOTE_SECTIONS } from "@/lib/types";

const DETAIL_LEVELS = [
  { value: "synthetique", label: "Synthétique" },
  { value: "standard", label: "Standard" },
  { value: "approfondi", label: "Approfondi" },
] as const;

const AUDIENCES = [
  { value: "equipe_projet", label: "Équipe projet" },
  { value: "management", label: "Management OIF" },
  { value: "comite_pilotage", label: "Comité de pilotage" },
  { value: "bailleurs", label: "Bailleurs / partenaires" },
] as const;

export default function AnalyseDocumentairePage() {
  const supabase = createClient();
  const router = useRouter();

  const [notes, setNotes] = useState<AnalyticalNote[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [detailLevel, setDetailLevel] =
    useState<(typeof DETAIL_LEVELS)[number]["value"]>("standard");
  const [audience, setAudience] =
    useState<(typeof AUDIENCES)[number]["value"]>("equipe_projet");
  const [sections, setSections] = useState<string[]>(
    ANALYTICAL_NOTE_SECTIONS.map((s) => s.value)
  );

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const [{ data: ns }, { data: ps }] = await Promise.all([
        supabase
          .from("analytical_notes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("projects").select("*").eq("user_id", user.id),
      ]);
      if (ns) setNotes(ns as AnalyticalNote[]);
      if (ps) setProjects(ps as Project[]);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSection(value: string) {
    setSections((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function toggleProject(id: string) {
    setSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  async function handleCreate() {
    setError(null);
    if (!subject.trim()) {
      setError("Le sujet est requis.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/analyse-documentaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          scopeProjects: selectedProjects,
          scopePs: [],
          scopeCountries: [],
          periodStart,
          periodEnd,
          sectionsSelected: sections,
          detailLevel,
          audience,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.note) {
        setError(payload.error || "Création impossible.");
        return;
      }

      const noteId = payload.note.id;
      // Kick off generation, then navigate to result page which will stream
      fetch("/api/analyse-documentaire/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId,
          subject: subject.trim(),
          scopeProjects: selectedProjects,
          scopePs: [],
          scopeCountries: [],
          periodStart,
          periodEnd,
          sectionsSelected: sections,
          detailLevel,
          audience,
        }),
      }).catch(() => {
        /* the result page will show the final content regardless */
      });

      router.push(`/analyse-documentaire/${noteId}/resultat`);
    } catch (err: any) {
      setError(err?.message || "Erreur réseau.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-pulse text-oif-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-oif-blue flex items-center gap-2">
          <FileText className="w-6 h-6" /> Analyse documentaire
        </h1>
        <p className="text-oif-gray-500 text-sm mt-1">
          Génère automatiquement des notes analytiques OIF à partir des données
          projet, ERA et de la base de connaissances.
        </p>
      </div>

      <div className="card mb-6 space-y-4">
        <h2 className="font-semibold text-oif-gray-700">Nouvelle note</h2>

        <div>
          <label className="label-field">Sujet de l&apos;analyse</label>
          <input
            className="input-field"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex : Efficacité du dispositif CLAC P05 en 2024"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label-field">Période — début</label>
            <input
              type="date"
              className="input-field"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field">Période — fin</label>
            <input
              type="date"
              className="input-field"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label-field">Niveau de détail</label>
            <select
              className="input-field"
              value={detailLevel}
              onChange={(e) =>
                setDetailLevel(
                  e.target.value as (typeof DETAIL_LEVELS)[number]["value"]
                )
              }
            >
              {DETAIL_LEVELS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Public cible</label>
            <select
              className="input-field"
              value={audience}
              onChange={(e) =>
                setAudience(
                  e.target.value as (typeof AUDIENCES)[number]["value"]
                )
              }
            >
              {AUDIENCES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label-field">Projets à inclure</label>
          {projects.length === 0 ? (
            <p className="text-xs text-oif-gray-500">
              Aucun projet disponible.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-1">
              {projects.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 text-sm text-oif-gray-700 py-1"
                >
                  <input
                    type="checkbox"
                    checked={selectedProjects.includes(p.id)}
                    onChange={() => toggleProject(p.id)}
                  />
                  <span className="truncate">
                    {p.code ? `[${p.code}] ` : ""}
                    {p.title}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="label-field">Sections à inclure</label>
          <div className="grid sm:grid-cols-2 gap-1">
            {ANALYTICAL_NOTE_SECTIONS.map((s) => (
              <label
                key={s.value}
                className="flex items-center gap-2 text-sm text-oif-gray-700 py-1"
              >
                <input
                  type="checkbox"
                  checked={sections.includes(s.value)}
                  onChange={() => toggleSection(s.value)}
                />
                {s.label}
              </label>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleCreate}
          disabled={creating}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Plus className="w-4 h-4" />
          {creating ? "Création..." : "Créer et générer"}
        </button>
      </div>

      <h2 className="text-sm font-semibold text-oif-gray-500 uppercase tracking-wider mb-3">
        Notes existantes
      </h2>
      {notes.length === 0 ? (
        <div className="card text-center py-10 text-sm text-oif-gray-500">
          Aucune note pour le moment.
        </div>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id}>
              <Link
                href={`/analyse-documentaire/${n.id}/resultat`}
                className="card flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        n.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : n.status === "generating"
                            ? "bg-yellow-100 text-yellow-700"
                            : n.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-oif-gray-100 text-oif-gray-500"
                      }`}
                    >
                      {n.status}
                    </span>
                    <span className="text-xs text-oif-gray-400">
                      {new Date(n.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <p className="font-medium text-oif-gray-700 truncate">
                    {n.subject}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-oif-gray-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
