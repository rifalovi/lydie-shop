"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ResultChainItem, Indicator } from "@/lib/types";
import { Plus, Trash2, ChevronLeft, ChevronRight, Save, Sparkles, Loader2, CheckCircle, XCircle } from "lucide-react";

interface Step4Props {
  projectId: string;
  onNext: () => void;
  onPrev: () => void;
}

const INDICATOR_LEVELS = ["extrant", "effet_immediat", "effet_intermediaire", "impact"];
const LEVEL_LABELS: Record<string, string> = {
  extrant: "Extrants",
  effet_immediat: "Effets immédiats",
  effet_intermediaire: "Effets intermédiaires",
  impact: "Impacts",
};

interface IndicatorForm {
  id?: string;
  result_id?: string | null;
  code: string;
  title: string;
  definition: string;
  formula: string;
  unit: string;
  frequency: string;
  baseline_value: number | null;
  baseline_year: number | null;
  baseline_source: string;
  target_2024: number | null;
  target_2025: number | null;
  target_2026: number | null;
  target_2027: number | null;
  disaggregations: string[];
  data_source: string;
  collection_method: string;
  responsible: string;
  smart_score: any;
  level: string;
}

const emptyIndicator = (level: string): IndicatorForm => ({
  code: "",
  title: "",
  definition: "",
  formula: "",
  unit: "%",
  frequency: "annuelle",
  baseline_value: null,
  baseline_year: null,
  baseline_source: "",
  target_2024: null,
  target_2025: null,
  target_2026: null,
  target_2027: null,
  disaggregations: [],
  data_source: "",
  collection_method: "",
  responsible: "",
  smart_score: null,
  level,
});

export default function Step4Indicators({ projectId, onNext, onPrev }: Step4Props) {
  const supabase = createClient();
  const [indicators, setIndicators] = useState<Record<string, IndicatorForm[]>>({});
  const [results, setResults] = useState<ResultChainItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [generatingLevel, setGeneratingLevel] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: chain }, { data: existing }] = await Promise.all([
        supabase.from("results_chain").select("*").eq("project_id", projectId).order("order_index"),
        supabase.from("indicators").select("*").eq("project_id", projectId).eq("type", "quantitatif"),
      ]);

      if (chain) setResults(chain);

      const grouped: Record<string, IndicatorForm[]> = {};
      INDICATOR_LEVELS.forEach((l) => { grouped[l] = []; });

      if (existing && existing.length > 0) {
        existing.forEach((ind: Indicator) => {
          const level = chain?.find((r) => r.id === ind.result_id)?.level || "extrant";
          if (!grouped[level]) grouped[level] = [];
          grouped[level].push({
            ...ind,
            baseline_source: ind.baseline_source || "",
            data_source: ind.data_source || "",
            collection_method: ind.collection_method || "",
            responsible: ind.responsible || "",
            definition: ind.definition || "",
            formula: ind.formula || "",
            code: ind.code || "",
            unit: ind.unit || "%",
            frequency: ind.frequency || "annuelle",
            level,
          });
        });
      }

      setIndicators(grouped);
    }
    load();
  }, [projectId]);

  function addIndicator(level: string) {
    setIndicators({
      ...indicators,
      [level]: [...(indicators[level] || []), emptyIndicator(level)],
    });
  }

  function removeIndicator(level: string, idx: number) {
    const items = [...(indicators[level] || [])];
    items.splice(idx, 1);
    setIndicators({ ...indicators, [level]: items });
  }

  function updateIndicator(level: string, idx: number, field: string, value: any) {
    const items = [...(indicators[level] || [])];
    items[idx] = { ...items[idx], [field]: value };
    setIndicators({ ...indicators, [level]: items });
  }

  async function generateIndicators(level: string) {
    setGeneratingLevel(level);
    const levelResults = results.filter((r) => r.level === level);
    const description = levelResults.map((r) => r.title).join("; ") || `Résultats de niveau ${level}`;

    try {
      const res = await fetch("/api/indicators/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, level, description }),
      });
      const data = await res.json();
      if (data.indicators && data.indicators.length) {
        const newIndicators = data.indicators.map((ind: any) => ({
          ...emptyIndicator(level),
          title: ind.title || "",
          definition: ind.definition || "",
          formula: ind.formula || "",
          unit: ind.unit || "%",
          frequency: ind.frequency || "annuelle",
          disaggregations: ind.disaggregations || [],
          collection_method: ind.collection_method || "",
        }));
        setIndicators({
          ...indicators,
          [level]: [...(indicators[level] || []), ...newIndicators],
        });
      }
    } catch {}
    setGeneratingLevel(null);
  }

  async function testSmart(level: string, idx: number) {
    const ind = indicators[level][idx];
    const key = `${level}-${idx}`;
    setTestingId(key);
    try {
      const res = await fetch("/api/indicators/test-smart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indicator: { title: ind.title, definition: ind.definition, formula: ind.formula, unit: ind.unit } }),
      });
      const data = await res.json();
      updateIndicator(level, idx, "smart_score", data.scores);
    } catch {}
    setTestingId(null);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from("indicators").delete().eq("project_id", projectId).eq("type", "quantitatif");

    const inserts: any[] = [];
    for (const level of INDICATOR_LEVELS) {
      for (const ind of indicators[level] || []) {
        if (ind.title.trim()) {
          const resultForLevel = results.find((r) => r.level === level);
          inserts.push({
            project_id: projectId,
            result_id: ind.result_id || resultForLevel?.id || null,
            code: ind.code,
            title: ind.title,
            definition: ind.definition,
            formula: ind.formula,
            unit: ind.unit,
            type: "quantitatif",
            frequency: ind.frequency,
            baseline_value: ind.baseline_value,
            baseline_year: ind.baseline_year,
            baseline_source: ind.baseline_source,
            target_2024: ind.target_2024,
            target_2025: ind.target_2025,
            target_2026: ind.target_2026,
            target_2027: ind.target_2027,
            disaggregations: ind.disaggregations,
            data_source: ind.data_source,
            collection_method: ind.collection_method,
            responsible: ind.responsible,
            smart_score: ind.smart_score,
          });
        }
      }
    }

    if (inserts.length > 0) await supabase.from("indicators").insert(inserts);
    await supabase.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", projectId);
    setSaving(false);
  }

  async function handleNext() {
    await handleSave();
    await supabase.from("projects").update({ current_step: 5 }).eq("id", projectId);
    onNext();
  }

  function SmartBadge({ score }: { score: any }) {
    if (!score) return null;
    const criteria = ["S", "M", "A", "R", "T"];
    const passed = criteria.filter((c) => score[c]?.pass).length;
    const pct = Math.round((passed / 5) * 100);
    const color = pct >= 85 ? "text-green-600" : pct >= 60 ? "text-yellow-600" : "text-red-600";

    return (
      <div className="flex items-center gap-2">
        {criteria.map((c) => (
          <span key={c} className="flex items-center gap-0.5 text-xs">
            {score[c]?.pass ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-red-400" />
            )}
            {c}
          </span>
        ))}
        <span className={`text-xs font-semibold ${color}`}>{pct}%</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-oif-blue">Étape 4 — Indicateurs SMART quantitatifs</h2>
        <p className="text-sm text-oif-gray-500 mt-1">
          Définissez des indicateurs pour chaque niveau de résultat.
        </p>
      </div>

      {INDICATOR_LEVELS.map((level) => {
        const items = indicators[level] || [];
        return (
          <div key={level} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-oif-blue">{LEVEL_LABELS[level]}</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => generateIndicators(level)}
                  disabled={generatingLevel === level}
                  className="inline-flex items-center gap-1.5 text-xs text-oif-blue-light hover:text-oif-blue font-medium disabled:opacity-50"
                >
                  {generatingLevel === level ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Générer via IA
                </button>
                <button onClick={() => addIndicator(level)} className="inline-flex items-center gap-1 text-xs text-oif-blue-light hover:text-oif-blue font-medium">
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>
            </div>

            {items.map((ind, idx) => (
              <div key={idx} className="card space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 grid sm:grid-cols-[1fr_120px] gap-3">
                    <div>
                      <label className="label-field">Intitulé SMART</label>
                      <input
                        type="text"
                        value={ind.title}
                        onChange={(e) => updateIndicator(level, idx, "title", e.target.value)}
                        className="input-field"
                        placeholder="Ex: % d'usagers déclarant une amélioration..."
                      />
                    </div>
                    <div>
                      <label className="label-field">Code</label>
                      <input
                        type="text"
                        value={ind.code}
                        onChange={(e) => updateIndicator(level, idx, "code", e.target.value)}
                        className="input-field font-mono"
                        placeholder="IND-PS1-..."
                      />
                    </div>
                  </div>
                  <button onClick={() => removeIndicator(level, idx)} className="p-2 text-red-400 hover:text-red-600 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="label-field">Définition et portée</label>
                  <textarea value={ind.definition} onChange={(e) => updateIndicator(level, idx, "definition", e.target.value)} className="input-field min-h-[40px]" placeholder="Description détaillée..." />
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="label-field">Formule</label>
                    <input type="text" value={ind.formula} onChange={(e) => updateIndicator(level, idx, "formula", e.target.value)} className="input-field" placeholder="Num / Dén × 100" />
                  </div>
                  <div>
                    <label className="label-field">Unité</label>
                    <select value={ind.unit} onChange={(e) => updateIndicator(level, idx, "unit", e.target.value)} className="input-field">
                      <option value="%">%</option>
                      <option value="#">#</option>
                      <option value="indice">Indice</option>
                      <option value="score">Score</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-field">Fréquence</label>
                    <select value={ind.frequency} onChange={(e) => updateIndicator(level, idx, "frequency", e.target.value)} className="input-field">
                      <option value="mensuelle">Mensuelle</option>
                      <option value="trimestrielle">Trimestrielle</option>
                      <option value="semestrielle">Semestrielle</option>
                      <option value="annuelle">Annuelle</option>
                    </select>
                  </div>
                </div>

                {/* Targets */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="label-field">Cible 2024</label>
                    <input type="number" value={ind.target_2024 ?? ""} onChange={(e) => updateIndicator(level, idx, "target_2024", Number(e.target.value) || null)} className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Cible 2025</label>
                    <input type="number" value={ind.target_2025 ?? ""} onChange={(e) => updateIndicator(level, idx, "target_2025", Number(e.target.value) || null)} className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Cible 2026</label>
                    <input type="number" value={ind.target_2026 ?? ""} onChange={(e) => updateIndicator(level, idx, "target_2026", Number(e.target.value) || null)} className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Cible 2027</label>
                    <input type="number" value={ind.target_2027 ?? ""} onChange={(e) => updateIndicator(level, idx, "target_2027", Number(e.target.value) || null)} className="input-field" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label-field">Source de données</label>
                    <input type="text" value={ind.data_source} onChange={(e) => updateIndicator(level, idx, "data_source", e.target.value)} className="input-field" placeholder="Ex: Enquête ERA" />
                  </div>
                  <div>
                    <label className="label-field">Méthode de collecte</label>
                    <input type="text" value={ind.collection_method} onChange={(e) => updateIndicator(level, idx, "collection_method", e.target.value)} className="input-field" placeholder="Ex: Questionnaire" />
                  </div>
                </div>

                {/* SMART test */}
                <div className="flex items-center justify-between pt-2 border-t border-oif-gray-100">
                  <SmartBadge score={ind.smart_score} />
                  <button
                    onClick={() => testSmart(level, idx)}
                    disabled={testingId === `${level}-${idx}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-oif-blue-light hover:text-oif-blue disabled:opacity-50"
                  >
                    {testingId === `${level}-${idx}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Test SMART
                  </button>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="card text-center py-6 text-sm text-oif-gray-400">
                Aucun indicateur. Utilisez &quot;Générer via IA&quot; ou &quot;Ajouter&quot;.
              </div>
            )}
          </div>
        );
      })}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button onClick={onPrev} className="btn-secondary flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Précédent
        </button>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-secondary flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? "Enregistrement..." : "Sauvegarder"}
          </button>
          <button onClick={handleNext} className="btn-primary flex items-center gap-2">
            Suivant <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
