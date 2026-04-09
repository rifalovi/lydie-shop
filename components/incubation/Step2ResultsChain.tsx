"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { RESULT_LEVELS } from "@/lib/types";
import type { ResultChainItem } from "@/lib/types";
import SuggestButton from "./SuggestButton";
import { Plus, Trash2, ChevronLeft, ChevronRight, Save, Sparkles, Loader2 } from "lucide-react";

interface Step2Props {
  projectId: string;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step2ResultsChain({ projectId, onNext, onPrev }: Step2Props) {
  const supabase = createClient();
  const [results, setResults] = useState<Record<string, { id?: string; title: string; description: string }[]>>({});
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("results_chain")
        .select("*")
        .eq("project_id", projectId)
        .order("order_index");

      if (data) {
        const grouped: Record<string, { id?: string; title: string; description: string }[]> = {};
        RESULT_LEVELS.forEach((l) => { grouped[l.value] = []; });
        data.forEach((r: ResultChainItem) => {
          if (!grouped[r.level]) grouped[r.level] = [];
          grouped[r.level].push({ id: r.id, title: r.title, description: r.description || "" });
        });
        setResults(grouped);
      } else {
        const empty: Record<string, { id?: string; title: string; description: string }[]> = {};
        RESULT_LEVELS.forEach((l) => { empty[l.value] = []; });
        setResults(empty);
      }
    }
    load();
  }, [projectId]);

  function addItem(level: string) {
    setResults({
      ...results,
      [level]: [...(results[level] || []), { title: "", description: "" }],
    });
  }

  function removeItem(level: string, index: number) {
    const items = [...(results[level] || [])];
    items.splice(index, 1);
    setResults({ ...results, [level]: items });
  }

  function updateItem(level: string, index: number, field: "title" | "description", value: string) {
    const items = [...(results[level] || [])];
    items[index] = { ...items[index], [field]: value };
    setResults({ ...results, [level]: items });
  }

  async function handleSave() {
    setSaving(true);

    // Delete existing and re-insert
    await supabase.from("results_chain").delete().eq("project_id", projectId);

    const inserts: any[] = [];
    for (const level of RESULT_LEVELS) {
      (results[level.value] || []).forEach((item, idx) => {
        if (item.title.trim()) {
          inserts.push({
            project_id: projectId,
            level: level.value,
            title: item.title,
            description: item.description,
            order_index: idx,
          });
        }
      });
    }

    if (inserts.length > 0) {
      await supabase.from("results_chain").insert(inserts);
    }

    await supabase.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", projectId);
    setSaving(false);
  }

  async function analyzeCoherence() {
    setAnalyzing(true);
    try {
      const chainDescription = RESULT_LEVELS.map((l) => {
        const items = results[l.value] || [];
        return `${l.label} :\n${items.map((i) => `- ${i.title}`).join("\n") || "- (aucun)"}`;
      }).join("\n\n");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Analyse la cohérence de cette chaîne de résultats et identifie les éventuelles faiblesses dans la logique causale :\n\n${chainDescription}` }],
          projectId,
          currentStep: 2,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let text = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && line.slice(6) !== "[DONE]") {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.text) text += parsed.text;
              } catch {}
            }
          }
        }
      }
      setAnalysis(text);
    } catch {
      setAnalysis("Erreur lors de l'analyse.");
    }
    setAnalyzing(false);
  }

  async function handleNext() {
    await handleSave();
    await supabase.from("projects").update({ current_step: 3 }).eq("id", projectId);
    onNext();
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-oif-blue">Étape 2 — Chaîne de résultats &amp; cadre logique</h2>
        <p className="text-sm text-oif-gray-500 mt-1">Construisez votre chaîne de résultats à travers les 6 niveaux.</p>
      </div>

      {/* Results chain visualization */}
      <div className="bg-white rounded-xl border border-oif-gray-200 overflow-hidden">
        <div className="overflow-x-auto p-4">
          <div className="flex gap-3 min-w-max">
            {RESULT_LEVELS.map((level) => {
              const items = results[level.value] || [];
              return (
                <div key={level.value} className="w-56 flex-shrink-0">
                  <div
                    className="text-xs font-semibold text-white px-3 py-2 rounded-t-lg text-center"
                    style={{ backgroundColor: level.color }}
                  >
                    {level.label}
                  </div>
                  <div className="border border-t-0 border-oif-gray-200 rounded-b-lg p-2 space-y-1.5 min-h-[100px] bg-oif-gray-50">
                    {items.map((item, idx) => (
                      <div key={idx} className="bg-white rounded px-2 py-1 text-xs text-oif-gray-600 border border-oif-gray-100 truncate">
                        {item.title || "(sans titre)"}
                      </div>
                    ))}
                    {items.length === 0 && (
                      <p className="text-[10px] text-oif-gray-300 text-center py-4">Vide</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit forms per level */}
      {RESULT_LEVELS.map((level) => {
        const items = results[level.value] || [];
        return (
          <div key={level.value} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm" style={{ color: level.color }}>
                {level.label}
              </h3>
              <button
                type="button"
                onClick={() => addItem(level.value)}
                className="inline-flex items-center gap-1 text-xs text-oif-blue-light hover:text-oif-blue font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItem(level.value, idx, "title", e.target.value)}
                      className="input-field text-sm"
                      placeholder="Titre"
                    />
                    <textarea
                      value={item.description}
                      onChange={(e) => updateItem(level.value, idx, "description", e.target.value)}
                      className="input-field text-sm min-h-[40px]"
                      placeholder="Description (optionnel)"
                      rows={1}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(level.value, idx)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-sm text-oif-gray-400 py-2">
                  Aucun élément. Cliquez sur &quot;Ajouter&quot; pour commencer.
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Coherence analysis */}
      <div className="card">
        <button
          onClick={analyzeCoherence}
          disabled={analyzing}
          className="btn-secondary flex items-center gap-2"
        >
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Analyser la cohérence
        </button>
        {analysis && (
          <div className="mt-4 bg-oif-blue-50 border border-oif-blue-100 rounded-lg p-4 text-sm text-oif-gray-700 whitespace-pre-wrap">
            {analysis}
          </div>
        )}
      </div>

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
