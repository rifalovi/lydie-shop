"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileSearch, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Project } from "@/lib/types";

export default function AnalyseEraPage() {
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (data) setProjects(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><div className="animate-pulse text-oif-gray-400">Chargement...</div></div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-oif-blue flex items-center gap-2">
          <FileSearch className="w-6 h-6" /> Analyse ERA
        </h1>
        <p className="text-oif-gray-500 mt-1">
          Importez et analysez vos données ERA selon les critères CAD/OCDE.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-oif-gray-500 uppercase tracking-wider">
          Sélectionnez un projet pour l&apos;analyse ERA
        </h2>
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/modules/incubation?projectId=${p.id}`}
            className="card flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                {p.code && <span className="text-xs font-mono bg-oif-blue-50 text-oif-blue px-2 py-0.5 rounded">{p.code}</span>}
              </div>
              <p className="font-medium text-oif-gray-700">{p.title}</p>
              <p className="text-xs text-oif-gray-400 mt-0.5">Étape {p.current_step}/6</p>
            </div>
            <ArrowRight className="w-5 h-5 text-oif-gray-400" />
          </Link>
        ))}

        {projects.length === 0 && (
          <div className="card text-center py-12">
            <FileSearch className="w-12 h-12 text-oif-gray-300 mx-auto mb-3" />
            <p className="text-oif-gray-500">Créez un projet dans le module d&apos;incubation pour commencer l&apos;analyse ERA.</p>
          </div>
        )}
      </div>
    </div>
  );
}
