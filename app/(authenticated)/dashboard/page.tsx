"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Plus, Rocket, FolderOpen, BarChart3, Clock } from "lucide-react";
import type { Project, Profile } from "@/lib/types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-oif-gray-200 text-oif-gray-600" },
  active: { label: "En cours", color: "bg-blue-100 text-oif-blue" },
  completed: { label: "Terminé", color: "bg-green-100 text-green-700" },
};

const STEP_LABELS = [
  "Contexte",
  "Chaîne de résultats",
  "Hypothèses & risques",
  "Indicateurs SMART",
  "Indicateurs qualitatifs",
  "Analyse ERA",
];

export default function DashboardPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, projectsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("projects").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      setLoading(false);
    }
    loadData();
  }, []);

  async function createProject() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: user.id, title: "Nouveau projet", status: "draft", current_step: 1 })
      .select()
      .single();

    if (data) {
      setProjects([data, ...projects]);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-pulse text-oif-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-oif-blue">
          Bienvenue{profile?.full_name ? `, ${profile.full_name}` : ""} 👋
        </h1>
        <p className="text-oif-gray-500 mt-1">
          Gérez vos projets et suivez votre progression en GAR/S&amp;E.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <button onClick={createProject} className="card hover:shadow-md transition-shadow flex items-center gap-4 cursor-pointer text-left">
          <div className="w-12 h-12 bg-oif-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Plus className="w-6 h-6 text-oif-blue" />
          </div>
          <div>
            <p className="font-semibold text-oif-blue text-sm">Nouveau projet</p>
            <p className="text-xs text-oif-gray-400">Démarrer l&apos;incubation</p>
          </div>
        </button>
        <Link href="/modules/incubation" className="card hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Rocket className="w-6 h-6 text-oif-blue-light" />
          </div>
          <div>
            <p className="font-semibold text-oif-blue text-sm">Incubation</p>
            <p className="text-xs text-oif-gray-400">Module guidé en 6 étapes</p>
          </div>
        </Link>
        <Link href="/chat" className="card hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-oif-blue text-sm">Assistant IA</p>
            <p className="text-xs text-oif-gray-400">Poser une question GAR/S&amp;E</p>
          </div>
        </Link>
      </div>

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-oif-blue flex items-center gap-2">
            <FolderOpen className="w-5 h-5" /> Mes projets
          </h2>
          <span className="text-sm text-oif-gray-400">{projects.length} projet(s)</span>
        </div>

        {projects.length === 0 ? (
          <div className="card text-center py-12">
            <FolderOpen className="w-12 h-12 text-oif-gray-300 mx-auto mb-3" />
            <p className="text-oif-gray-500 mb-4">Aucun projet pour le moment.</p>
            <button onClick={createProject} className="btn-primary">
              Créer mon premier projet
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => {
              const status = STATUS_LABELS[project.status] || STATUS_LABELS.draft;
              return (
                <Link
                  key={project.id}
                  href={`/modules/incubation?projectId=${project.id}`}
                  className="card hover:shadow-md transition-shadow flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {project.code && (
                        <span className="text-xs font-mono bg-oif-blue-50 text-oif-blue px-2 py-0.5 rounded">
                          {project.code}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                      {project.programme_strategique && (
                        <span className="text-xs text-oif-gray-400">{project.programme_strategique}</span>
                      )}
                    </div>
                    <h3 className="font-medium text-oif-gray-700 truncate">{project.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-oif-gray-400">
                      <span className="flex items-center gap-1">
                        <Rocket className="w-3.5 h-3.5" />
                        Étape {project.current_step}/6 — {STEP_LABELS[project.current_step - 1]}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(project.updated_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-24 flex-shrink-0">
                    <div className="h-2 bg-oif-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-oif-blue-light rounded-full transition-all"
                        style={{ width: `${(project.current_step / 6) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-oif-gray-400 text-center mt-1">
                      {Math.round((project.current_step / 6) * 100)}%
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
