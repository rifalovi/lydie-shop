"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, ChevronLeft, Save, Loader2, FileText, BarChart3, MessageSquare, BookOpen, Download } from "lucide-react";

interface Step6Props {
  projectId: string;
  onPrev: () => void;
}

interface EraAnalysisResult {
  analysis?: {
    pertinence?: string;
    coherence?: string;
    efficacite?: string;
    efficience?: string;
    impact?: string;
    durabilite?: string;
  };
  scorecard?: { indicator: string; status: string; value: string }[];
  recommendations?: string[];
  lessons_learned?: string[];
}

const CAD_LABELS: Record<string, { label: string; icon: string }> = {
  pertinence: { label: "Pertinence", icon: "🎯" },
  coherence: { label: "Cohérence", icon: "🔗" },
  efficacite: { label: "Efficacité", icon: "✅" },
  efficience: { label: "Efficience", icon: "⚡" },
  impact: { label: "Impact", icon: "💥" },
  durabilite: { label: "Durabilité", icon: "🌱" },
};

const STATUS_COLORS: Record<string, string> = {
  vert: "bg-green-100 text-green-700 border-green-200",
  jaune: "bg-yellow-100 text-yellow-700 border-yellow-200",
  rouge: "bg-red-100 text-red-700 border-red-200",
  green: "bg-green-100 text-green-700 border-green-200",
  yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
  red: "bg-red-100 text-red-700 border-red-200",
};

export default function Step6EraAnalysis({ projectId, onPrev }: Step6Props) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"import" | "quantitative" | "qualitative" | "cad" | "export">("import");
  const [manualData, setManualData] = useState<Record<string, string>>({});
  const [qualitativeResponses, setQualitativeResponses] = useState("");
  const [analysisResult, setAnalysisResult] = useState<EraAnalysisResult | null>(null);
  const [themes, setThemes] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [indicators, setIndicators] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data: inds } = await supabase.from("indicators").select("*").eq("project_id", projectId);
      if (inds) setIndicators(inds);

      const { data: era } = await supabase
        .from("era_data")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (era) {
        if (era.aggregated_data) setManualData(era.aggregated_data);
        if (era.analysis) setAnalysisResult(era.analysis);
        if (era.qualitative_themes) setThemes(era.qualitative_themes);
      }
    }
    load();
  }, [projectId]);

  async function runAnalysis() {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/era/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, eraData: manualData, indicators }),
      });
      const data = await res.json();
      setAnalysisResult(data);
      setActiveTab("cad");
    } catch {}
    setAnalyzing(false);
  }

  async function analyzeThemes() {
    if (!qualitativeResponses.trim()) return;
    setAnalyzing(true);
    try {
      const responses = qualitativeResponses.split("\n").filter((l) => l.trim());
      const res = await fetch("/api/era/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      });
      const data = await res.json();
      setThemes(data);
    } catch {}
    setAnalyzing(false);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from("era_data").upsert({
      project_id: projectId,
      year: new Date().getFullYear(),
      aggregated_data: manualData,
      analysis: analysisResult,
      qualitative_themes: themes,
      scorecard: analysisResult?.scorecard,
      recommendations: analysisResult?.recommendations,
    }, { onConflict: "project_id" });

    await supabase.from("projects").update({
      status: "active",
      updated_at: new Date().toISOString(),
    }).eq("id", projectId);
    setSaving(false);
  }

  const tabs = [
    { id: "import", label: "Import des données", icon: Upload },
    { id: "quantitative", label: "Analyse quantitative", icon: BarChart3 },
    { id: "qualitative", label: "Analyse qualitative", icon: MessageSquare },
    { id: "cad", label: "Critères CAD/OCDE", icon: BookOpen },
    { id: "export", label: "Livrable final", icon: Download },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-oif-blue">Étape 6 — Analyse ERA</h2>
        <p className="text-sm text-oif-gray-500 mt-1">
          Importez et analysez vos données ERA selon les critères CAD/OCDE.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-oif-gray-100 rounded-lg p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id ? "bg-white text-oif-blue shadow-sm" : "text-oif-gray-500 hover:text-oif-gray-700"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "import" && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-oif-blue">Saisie des données agrégées</h3>
          <p className="text-sm text-oif-gray-500">
            Saisissez les résultats agrégés (%) pour chaque indicateur défini aux étapes précédentes.
          </p>

          <div className="space-y-3">
            {indicators.map((ind) => (
              <div key={ind.id} className="flex items-center gap-3">
                <label className="text-sm text-oif-gray-600 flex-1 min-w-0 truncate" title={ind.title}>
                  {ind.code && <span className="font-mono text-xs text-oif-blue mr-1">{ind.code}</span>}
                  {ind.title}
                </label>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input
                    type="number"
                    value={manualData[ind.id] || ""}
                    onChange={(e) => setManualData({ ...manualData, [ind.id]: e.target.value })}
                    className="input-field w-24 text-right"
                    placeholder="—"
                  />
                  <span className="text-xs text-oif-gray-400 w-6">{ind.unit || "%"}</span>
                </div>
              </div>
            ))}
          </div>

          {indicators.length === 0 && (
            <p className="text-sm text-oif-gray-400 py-4 text-center">
              Aucun indicateur défini. Retournez aux étapes 4 et 5.
            </p>
          )}

          <button onClick={runAnalysis} disabled={analyzing} className="btn-primary flex items-center gap-2">
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
            Lancer l&apos;analyse
          </button>
        </div>
      )}

      {activeTab === "quantitative" && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-oif-blue">Scorecard — Feux tricolores</h3>

          {analysisResult?.scorecard ? (
            <div className="space-y-2">
              {analysisResult.scorecard.map((item, idx) => (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${STATUS_COLORS[item.status] || "bg-gray-50"}`}>
                  <span className="text-sm font-medium">{item.indicator}</span>
                  <span className="text-sm font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-oif-gray-400 py-4 text-center">
              Lancez l&apos;analyse depuis l&apos;onglet &quot;Import des données&quot; pour voir les résultats.
            </p>
          )}
        </div>
      )}

      {activeTab === "qualitative" && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-oif-blue">Analyse qualitative</h3>
          <p className="text-sm text-oif-gray-500">
            Collez les réponses ouvertes du questionnaire ERA (une par ligne).
          </p>
          <textarea
            value={qualitativeResponses}
            onChange={(e) => setQualitativeResponses(e.target.value)}
            className="input-field min-h-[150px]"
            placeholder="Réponse 1&#10;Réponse 2&#10;Réponse 3&#10;..."
          />
          <button onClick={analyzeThemes} disabled={analyzing} className="btn-secondary flex items-center gap-2">
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            Coder les thèmes
          </button>

          {themes?.themes && (
            <div className="space-y-3 mt-4">
              {themes.themes.map((theme: any, idx: number) => (
                <div key={idx} className="bg-oif-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-oif-blue">{theme.name}</span>
                    <span className="text-xs bg-oif-blue-50 text-oif-blue px-2 py-0.5 rounded-full">{theme.count} réponses</span>
                  </div>
                  {theme.verbatims?.map((v: string, vi: number) => (
                    <p key={vi} className="text-xs text-oif-gray-500 italic border-l-2 border-oif-blue-100 pl-2 mt-1.5">
                      &laquo; {v} &raquo;
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "cad" && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-oif-blue">Analyse selon les critères CAD/OCDE</h3>

          {analysisResult?.analysis ? (
            <div className="space-y-4">
              {Object.entries(CAD_LABELS).map(([key, { label, icon }]) => {
                const text = (analysisResult.analysis as any)?.[key];
                return text ? (
                  <div key={key} className="bg-oif-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-sm text-oif-blue mb-2">{icon} {label}</h4>
                    <p className="text-sm text-oif-gray-600 whitespace-pre-wrap">{text}</p>
                  </div>
                ) : null;
              })}

              {analysisResult.recommendations && (
                <div className="bg-oif-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-oif-blue mb-2">Recommandations</h4>
                  <ul className="space-y-1.5">
                    {analysisResult.recommendations.map((r, i) => (
                      <li key={i} className="text-sm text-oif-gray-600 flex gap-2">
                        <span className="text-oif-blue font-semibold">{i + 1}.</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-oif-gray-400 py-4 text-center">
              Aucune analyse disponible. Lancez l&apos;analyse depuis l&apos;onglet Import.
            </p>
          )}
        </div>
      )}

      {activeTab === "export" && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-oif-blue">Note de synthèse</h3>
          <p className="text-sm text-oif-gray-500">
            Générez une note de synthèse complète comprenant le résumé exécutif, le scorecard, l&apos;analyse narrative et les recommandations.
          </p>

          {analysisResult ? (
            <div className="bg-oif-gray-50 rounded-lg p-6 space-y-4">
              <h4 className="text-lg font-bold text-oif-blue">Résumé exécutif</h4>
              {analysisResult.analysis?.pertinence && (
                <p className="text-sm text-oif-gray-600">{analysisResult.analysis.pertinence}</p>
              )}

              {analysisResult.scorecard && analysisResult.scorecard.length > 0 && (
                <>
                  <h4 className="font-semibold text-oif-blue mt-4">Scorecard</h4>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {analysisResult.scorecard.map((item, idx) => (
                      <div key={idx} className={`p-2 rounded border text-xs ${STATUS_COLORS[item.status] || "bg-gray-50"}`}>
                        <span className="font-medium">{item.indicator}</span>: {item.value}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {analysisResult.lessons_learned && (
                <>
                  <h4 className="font-semibold text-oif-blue mt-4">Leçons apprises</h4>
                  <ul className="text-sm text-oif-gray-600 space-y-1">
                    {analysisResult.lessons_learned.map((l, i) => (
                      <li key={i}>• {l}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-oif-gray-400 py-4 text-center">
              Complétez l&apos;analyse ERA pour générer la note de synthèse.
            </p>
          )}

          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Enregistrement..." : "Sauvegarder l'analyse"}
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={onPrev} className="btn-secondary flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Précédent
        </button>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" /> {saving ? "Enregistrement..." : "Terminer et sauvegarder"}
        </button>
      </div>
    </div>
  );
}
