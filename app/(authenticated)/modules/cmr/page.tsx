"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Target, ArrowRight } from "lucide-react";
import type { Project } from "@/lib/types";

export default function CmrIndexPage() {
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (data) setProjects(data as Project[]);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-pulse text-oif-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-oif-blue flex items-center gap-2">
          <Target className="w-6 h-6" /> Cadre de mesure du rendement (CMR)
        </h1>
        <p className="text-oif-gray-500 mt-1">
          Configurez les périodes de mesure et les cibles par indicateur pour chacun de vos projets.
        </p>
      </div>

      <h2 className="text-sm font-semibold text-oif-gray-500 uppercase tracking-wider mb-3">
        Sélectionnez un projet
      </h2>
      <div className="space-y-3">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/modules/cmr/${p.id}/config`}
            className="card flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                {p.code && (
                  <span className="text-xs font-mono bg-oif-blue-50 text-oif-blue px-2 py-0.5 rounded">
                    {p.code}
                  </span>
                )}
              </div>
              <p className="font-medium text-oif-gray-700">{p.title}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-oif-gray-400" />
          </Link>
        ))}
        {projects.length === 0 && (
          <div className="card text-center py-12">
            <Target className="w-12 h-12 text-oif-gray-300 mx-auto mb-3" />
            <p className="text-oif-gray-500">
              Créez un projet dans le module d&apos;incubation pour configurer son CMR.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
