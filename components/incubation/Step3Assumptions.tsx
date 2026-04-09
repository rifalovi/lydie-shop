"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ResultChainItem, AssumptionRisk } from "@/lib/types";
import SuggestButton from "./SuggestButton";
import { Plus, Trash2, ChevronLeft, ChevronRight, Save, AlertTriangle } from "lucide-react";

interface Step3Props {
  projectId: string;
  onNext: () => void;
  onPrev: () => void;
}

const PROBABILITY_LABELS = { faible: "Faible", moyen: "Moyen", eleve: "Élevé" };
const IMPACT_LABELS = { faible: "Faible", moyen: "Moyen", eleve: "Élevé" };

const RISK_COLOR: Record<string, string> = {
  "faible-faible": "bg-green-100 text-green-700",
  "faible-moyen": "bg-green-100 text-green-700",
  "faible-eleve": "bg-yellow-100 text-yellow-700",
  "moyen-faible": "bg-green-100 text-green-700",
  "moyen-moyen": "bg-yellow-100 text-yellow-700",
  "moyen-eleve": "bg-orange-100 text-orange-700",
  "eleve-faible": "bg-yellow-100 text-yellow-700",
  "eleve-moyen": "bg-orange-100 text-orange-700",
  "eleve-eleve": "bg-red-100 text-red-700",
};

interface AssumptionRow {
  id?: string;
  linkLabel: string;
  assumption: string;
  risk: string;
  probability: string;
  impact: string;
  mitigation: string;
}

export default function Step3Assumptions({ projectId, onNext, onPrev }: Step3Props) {
  const supabase = createClient();
  const [rows, setRows] = useState<AssumptionRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: chain } = await supabase
        .from("results_chain")
        .select("*")
        .eq("project_id", projectId)
        .order("order_index");

      const { data: existing } = await supabase
        .from("assumptions_risks")
        .select("*")
        .eq("project_id", projectId);

      if (existing && existing.length > 0) {
        setRows(existing.map((e: AssumptionRisk) => ({
          id: e.id,
          linkLabel: "Lien",
          assumption: e.assumption || "",
          risk: e.risk || "",
          probability: e.probability || "moyen",
          impact: e.impact || "moyen",
          mitigation: e.mitigation || "",
        })));
      } else {
        // Generate default links
        const links = [
          { from: "Activités", to: "Extrants" },
          { from: "Extrants", to: "Effets immédiats" },
          { from: "Effets immédiats", to: "Effets intermédiaires" },
          { from: "Effets intermédiaires", to: "Impacts" },
        ];
        setRows(links.map((l) => ({
          linkLabel: `${l.from} → ${l.to}`,
          assumption: "",
          risk: "",
          probability: "moyen",
          impact: "moyen",
          mitigation: "",
        })));
      }
    }
    load();
  }, [projectId]);

  function addRow() {
    setRows([...rows, {
      linkLabel: "Nouveau lien",
      assumption: "",
      risk: "",
      probability: "moyen",
      impact: "moyen",
      mitigation: "",
    }]);
  }

  function removeRow(idx: number) {
    setRows(rows.filter((_, i) => i !== idx));
  }

  function updateRow(idx: number, field: keyof AssumptionRow, value: string) {
    const updated = [...rows];
    updated[idx] = { ...updated[idx], [field]: value };
    setRows(updated);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from("assumptions_risks").delete().eq("project_id", projectId);

    const inserts = rows
      .filter((r) => r.assumption || r.risk)
      .map((r) => ({
        project_id: projectId,
        assumption: r.assumption,
        risk: r.risk,
        probability: r.probability,
        impact: r.impact,
        mitigation: r.mitigation,
      }));

    if (inserts.length > 0) {
      await supabase.from("assumptions_risks").insert(inserts);
    }
    await supabase.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", projectId);
    setSaving(false);
  }

  async function handleNext() {
    await handleSave();
    await supabase.from("projects").update({ current_step: 4 }).eq("id", projectId);
    onNext();
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-oif-blue">Étape 3 — Hypothèses &amp; risques</h2>
        <p className="text-sm text-oif-gray-500 mt-1">
          Pour chaque lien de la chaîne, identifiez les hypothèses et risques associés.
        </p>
      </div>

      {/* Risk matrix mini */}
      <div className="card">
        <h3 className="font-semibold text-oif-blue mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Matrice de risques
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-oif-gray-500">
                <th className="text-left py-2 px-3">Probabilité ↓ / Impact →</th>
                <th className="py-2 px-3">Faible</th>
                <th className="py-2 px-3">Moyen</th>
                <th className="py-2 px-3">Élevé</th>
              </tr>
            </thead>
            <tbody>
              {(["eleve", "moyen", "faible"] as const).map((prob) => (
                <tr key={prob}>
                  <td className="py-2 px-3 font-medium text-oif-gray-600 capitalize">{PROBABILITY_LABELS[prob]}</td>
                  {(["faible", "moyen", "eleve"] as const).map((imp) => {
                    const count = rows.filter((r) => r.probability === prob && r.impact === imp).length;
                    return (
                      <td key={imp} className="py-2 px-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${RISK_COLOR[`${prob}-${imp}`]}`}>
                          {count}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assumption/risk rows */}
      {rows.map((row, idx) => (
        <div key={idx} className="card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-oif-blue-light bg-oif-blue-50 px-3 py-1 rounded-full">
              {row.linkLabel}
            </span>
            <button onClick={() => removeRow(idx)} className="p-1 text-red-400 hover:text-red-600 rounded">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="label-field">Hypothèse</label>
            <textarea
              value={row.assumption}
              onChange={(e) => updateRow(idx, "assumption", e.target.value)}
              className="input-field min-h-[50px]"
              placeholder="Condition nécessaire pour que le lien soit valide..."
            />
          </div>

          <div>
            <label className="label-field">Risque associé</label>
            <textarea
              value={row.risk}
              onChange={(e) => updateRow(idx, "risk", e.target.value)}
              className="input-field min-h-[50px]"
              placeholder="Risque identifié..."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Probabilité</label>
              <select value={row.probability} onChange={(e) => updateRow(idx, "probability", e.target.value)} className="input-field">
                <option value="faible">Faible</option>
                <option value="moyen">Moyen</option>
                <option value="eleve">Élevé</option>
              </select>
            </div>
            <div>
              <label className="label-field">Impact</label>
              <select value={row.impact} onChange={(e) => updateRow(idx, "impact", e.target.value)} className="input-field">
                <option value="faible">Faible</option>
                <option value="moyen">Moyen</option>
                <option value="eleve">Élevé</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-field">Mesure d&apos;atténuation</label>
            <textarea
              value={row.mitigation}
              onChange={(e) => updateRow(idx, "mitigation", e.target.value)}
              className="input-field min-h-[50px]"
              placeholder="Mesure prévue pour réduire le risque..."
            />
          </div>
        </div>
      ))}

      <button onClick={addRow} className="btn-secondary flex items-center gap-2">
        <Plus className="w-4 h-4" /> Ajouter un lien
      </button>

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
