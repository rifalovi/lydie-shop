"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, ChevronLeft, ChevronRight, Save, Sparkles, Loader2 } from "lucide-react";

interface Step5Props {
  projectId: string;
  onNext: () => void;
  onPrev: () => void;
}

interface QualitativeIndicator {
  id?: string;
  title: string;
  definition: string;
  collection_method: string;
  scale: string;
  cad_criterion: string;
  era_question_link: string;
}

const CAD_CRITERIA = [
  { value: "pertinence", label: "Pertinence" },
  { value: "coherence", label: "Cohérence" },
  { value: "efficacite", label: "Efficacité" },
  { value: "efficience", label: "Efficience" },
  { value: "impact", label: "Impact" },
  { value: "durabilite", label: "Durabilité" },
];

const COLLECTION_METHODS = [
  { value: "entretien", label: "Entretien individuel" },
  { value: "focus_group", label: "Focus group" },
  { value: "questionnaire_era", label: "Questionnaire ERA" },
  { value: "observation", label: "Observation" },
  { value: "etude_cas", label: "Étude de cas" },
];

const SCALES = [
  { value: "likert_5", label: "Échelle de Likert (1-5)" },
  { value: "oui_non", label: "Oui / Non" },
  { value: "texte_libre", label: "Texte libre" },
  { value: "pourcentage", label: "Pourcentage" },
];

const emptyIndicator = (): QualitativeIndicator => ({
  title: "",
  definition: "",
  collection_method: "questionnaire_era",
  scale: "likert_5",
  cad_criterion: "efficacite",
  era_question_link: "",
});

export default function Step5QualitativeIndicators({ projectId, onNext, onPrev }: Step5Props) {
  const supabase = createClient();
  const [indicators, setIndicators] = useState<QualitativeIndicator[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("indicators")
        .select("*")
        .eq("project_id", projectId)
        .eq("type", "qualitatif");

      if (data && data.length > 0) {
        setIndicators(data.map((d: any) => ({
          id: d.id,
          title: d.title,
          definition: d.definition || "",
          collection_method: d.collection_method || "questionnaire_era",
          scale: d.unit || "likert_5",
          cad_criterion: d.cad_criterion || "efficacite",
          era_question_link: d.data_source || "",
        })));
      }
    }
    load();
  }, [projectId]);

  function addIndicator() {
    setIndicators([...indicators, emptyIndicator()]);
  }

  function removeIndicator(idx: number) {
    setIndicators(indicators.filter((_, i) => i !== idx));
  }

  function updateIndicator(idx: number, field: keyof QualitativeIndicator, value: string) {
    const updated = [...indicators];
    updated[idx] = { ...updated[idx], [field]: value };
    setIndicators(updated);
  }

  async function generateIndicators() {
    setGenerating(true);
    try {
      const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single();

      const res = await fetch("/api/incubation/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 5,
          field: "indicateurs qualitatifs de changement",
          projectData: project,
        }),
      });
      const data = await res.json();
      if (data.suggestion) {
        // Parse suggestions into indicators
        const lines = data.suggestion.split("\n").filter((l: string) => l.trim().startsWith("-") || l.trim().startsWith("•"));
        const newIndicators = lines.slice(0, 4).map((line: string) => ({
          ...emptyIndicator(),
          title: line.replace(/^[-•]\s*/, "").trim(),
        }));
        if (newIndicators.length > 0) {
          setIndicators([...indicators, ...newIndicators]);
        }
      }
    } catch {}
    setGenerating(false);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from("indicators").delete().eq("project_id", projectId).eq("type", "qualitatif");

    const inserts = indicators
      .filter((ind) => ind.title.trim())
      .map((ind) => ({
        project_id: projectId,
        title: ind.title,
        definition: ind.definition,
        type: "qualitatif",
        collection_method: ind.collection_method,
        unit: ind.scale,
        cad_criterion: ind.cad_criterion,
        data_source: ind.era_question_link,
      }));

    if (inserts.length > 0) await supabase.from("indicators").insert(inserts);
    await supabase.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", projectId);
    setSaving(false);
  }

  async function handleNext() {
    await handleSave();
    await supabase.from("projects").update({ current_step: 6 }).eq("id", projectId);
    onNext();
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-oif-blue">Étape 5 — Indicateurs qualitatifs de changement</h2>
        <p className="text-sm text-oif-gray-500 mt-1">
          Mesurez les transformations réelles après intervention : comportements, satisfaction, perceptions.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={generateIndicators} disabled={generating} className="btn-secondary flex items-center gap-2">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Générer via IA
        </button>
        <button onClick={addIndicator} className="btn-secondary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Ajouter manuellement
        </button>
      </div>

      {indicators.map((ind, idx) => (
        <div key={idx} className="card space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-oif-blue-light bg-oif-blue-50 px-2 py-1 rounded-full">
              Indicateur qualitatif #{idx + 1}
            </span>
            <button onClick={() => removeIndicator(idx)} className="p-1 text-red-400 hover:text-red-600 rounded">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="label-field">Question / intitulé de mesure</label>
            <input
              type="text"
              value={ind.title}
              onChange={(e) => updateIndicator(idx, "title", e.target.value)}
              className="input-field"
              placeholder="Ex: % d'usagers déclarant une amélioration de leurs compétences"
            />
          </div>

          <div>
            <label className="label-field">Définition / portée</label>
            <textarea
              value={ind.definition}
              onChange={(e) => updateIndicator(idx, "definition", e.target.value)}
              className="input-field min-h-[40px]"
              placeholder="Description de ce que mesure cet indicateur..."
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="label-field">Méthode de collecte</label>
              <select value={ind.collection_method} onChange={(e) => updateIndicator(idx, "collection_method", e.target.value)} className="input-field">
                {COLLECTION_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Échelle de mesure</label>
              <select value={ind.scale} onChange={(e) => updateIndicator(idx, "scale", e.target.value)} className="input-field">
                {SCALES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Critère CAD/OCDE</label>
              <select value={ind.cad_criterion} onChange={(e) => updateIndicator(idx, "cad_criterion", e.target.value)} className="input-field">
                {CAD_CRITERIA.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label-field">Lien avec le questionnaire ERA</label>
            <input
              type="text"
              value={ind.era_question_link}
              onChange={(e) => updateIndicator(idx, "era_question_link", e.target.value)}
              className="input-field"
              placeholder="Ex: Questions Q15-Q17"
            />
          </div>
        </div>
      ))}

      {indicators.length === 0 && (
        <div className="card text-center py-8 text-sm text-oif-gray-400">
          Aucun indicateur qualitatif. Utilisez les boutons ci-dessus pour commencer.
        </div>
      )}

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
