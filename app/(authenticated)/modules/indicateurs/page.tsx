"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarChart3 } from "lucide-react";
import type { Indicator } from "@/lib/types";
import IndicatorSheetModal from "@/components/indicators/IndicatorSheetModal";

export default function IndicateursPage() {
  const supabase = createClient();
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Indicator | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: projects } = await supabase.from("projects").select("id").eq("user_id", user.id);
      if (!projects) { setLoading(false); return; }

      const ids = projects.map((p) => p.id);
      const { data } = await supabase.from("indicators").select("*").in("project_id", ids);
      if (data) setIndicators(data);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><div className="animate-pulse text-oif-gray-400">Chargement...</div></div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-oif-blue flex items-center gap-2">
          <BarChart3 className="w-6 h-6" /> Indicateurs SMART
        </h1>
        <p className="text-oif-gray-500 mt-1">
          Cliquez sur un indicateur pour consulter sa fiche complète.
        </p>
      </div>

      {indicators.length === 0 ? (
        <div className="card text-center py-12">
          <BarChart3 className="w-12 h-12 text-oif-gray-300 mx-auto mb-3" />
          <p className="text-oif-gray-500">Aucun indicateur défini. Utilisez le module d&apos;incubation pour créer vos indicateurs.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {indicators.map((ind) => {
            const smartScore = ind.smart_score;
            const passed = smartScore ? Object.values(smartScore).filter(Boolean).length : 0;
            const pct = smartScore ? Math.round((passed / 5) * 100) : null;

            return (
              <button
                key={ind.id}
                onClick={() => setSelected(ind)}
                className="card flex items-start gap-4 w-full text-left hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {ind.code && <span className="text-xs font-mono bg-oif-blue-50 text-oif-blue px-2 py-0.5 rounded">{ind.code}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ind.type === "quantitatif" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                      {ind.type}
                    </span>
                  </div>
                  <p className="font-medium text-oif-gray-700 text-sm">{ind.title}</p>
                  {ind.definition && <p className="text-xs text-oif-gray-400 mt-1 line-clamp-2">{ind.definition}</p>}
                </div>
                {pct !== null && (
                  <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    pct >= 85 ? "bg-green-100 text-green-700" : pct >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                  }`}>
                    SMART {pct}%
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <IndicatorSheetModal indicator={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
