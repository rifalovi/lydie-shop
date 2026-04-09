"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PROGRAMMES_STRATEGIQUES, STAKEHOLDER_TYPES } from "@/lib/types";
import type { Project, Stakeholder } from "@/lib/types";
import SuggestButton from "./SuggestButton";
import { Save, ChevronRight } from "lucide-react";

interface Step1Props {
  projectId: string;
  onNext: () => void;
}

const COUNTRIES = [
  "Bénin", "Burkina Faso", "Burundi", "Cameroun", "Canada", "Centrafrique",
  "Comores", "Congo", "Côte d'Ivoire", "Djibouti", "Gabon", "Guinée",
  "Guinée-Bissau", "Haïti", "Liban", "Madagascar", "Mali", "Maroc",
  "Maurice", "Mauritanie", "Niger", "RDC", "Rwanda", "Sénégal",
  "Tchad", "Togo", "Tunisie", "Vanuatu", "Vietnam", "Arménie",
];

export default function Step1Context({ projectId, onNext }: Step1Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Partial<Project>>({
    title: "",
    code: "",
    programme_strategique: "",
    countries: [],
    budget_total: null,
    budget_se: null,
    global_objective: "",
  });
  const [stakeholders, setStakeholders] = useState<Record<string, string>>({
    beneficiaire_direct: "",
    beneficiaire_indirect: "",
    partenaire: "",
    intermediaire: "",
  });

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from("projects").select("*").eq("id", projectId).single();
      if (p) setProject(p);

      const { data: s } = await supabase.from("stakeholders").select("*").eq("project_id", projectId);
      if (s) {
        const map: Record<string, string> = {};
        s.forEach((st: Stakeholder) => { map[st.type] = st.description || ""; });
        setStakeholders((prev) => ({ ...prev, ...map }));
      }
    }
    load();
  }, [projectId]);

  async function handleSave() {
    setSaving(true);
    await supabase.from("projects").update({
      title: project.title,
      code: project.code,
      programme_strategique: project.programme_strategique,
      countries: project.countries,
      budget_total: project.budget_total,
      budget_se: project.budget_se,
      global_objective: project.global_objective,
      updated_at: new Date().toISOString(),
    }).eq("id", projectId);

    // Upsert stakeholders
    for (const type of Object.keys(stakeholders)) {
      const { data: existing } = await supabase
        .from("stakeholders")
        .select("id")
        .eq("project_id", projectId)
        .eq("type", type)
        .single();

      if (existing) {
        await supabase.from("stakeholders").update({ description: stakeholders[type] }).eq("id", existing.id);
      } else if (stakeholders[type]) {
        await supabase.from("stakeholders").insert({ project_id: projectId, type, description: stakeholders[type] });
      }
    }
    setSaving(false);
  }

  async function handleNext() {
    await handleSave();
    await supabase.from("projects").update({ current_step: 2 }).eq("id", projectId);
    onNext();
  }

  function toggleCountry(country: string) {
    const current = project.countries || [];
    setProject({
      ...project,
      countries: current.includes(country)
        ? current.filter((c) => c !== country)
        : [...current, country],
    });
  }

  const projectData = { title: project.title, programme_strategique: project.programme_strategique, global_objective: project.global_objective };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-oif-blue">Étape 1 — Contexte &amp; parties prenantes</h2>
        <p className="text-sm text-oif-gray-500 mt-1">Renseignez les informations de base de votre projet.</p>
      </div>

      <div className="card space-y-5">
        {/* Title */}
        <div>
          <label className="label-field">Titre du projet</label>
          <input
            type="text"
            value={project.title || ""}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            className="input-field"
            placeholder="Ex: Acquérir des savoirs, découvrir le monde"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Code */}
          <div>
            <label className="label-field">Code projet</label>
            <input
              type="text"
              value={project.code || ""}
              onChange={(e) => setProject({ ...project, code: e.target.value })}
              className="input-field"
              placeholder="Ex: P05"
            />
          </div>
          {/* Programme stratégique */}
          <div>
            <label className="label-field">Programme stratégique OIF</label>
            <select
              value={project.programme_strategique || ""}
              onChange={(e) => setProject({ ...project, programme_strategique: e.target.value })}
              className="input-field"
            >
              <option value="">Sélectionner...</option>
              {PROGRAMMES_STRATEGIQUES.map((ps) => (
                <option key={ps.value} value={ps.value}>{ps.value} — {ps.label.split("—")[1]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Countries */}
        <div>
          <label className="label-field">Pays d&apos;intervention</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {COUNTRIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCountry(c)}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                  project.countries?.includes(c)
                    ? "bg-oif-blue text-white"
                    : "bg-oif-gray-100 text-oif-gray-500 hover:bg-oif-gray-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Budgets */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-field">Budget total (€)</label>
            <input
              type="number"
              value={project.budget_total || ""}
              onChange={(e) => setProject({ ...project, budget_total: Number(e.target.value) || null })}
              className="input-field"
              placeholder="Ex: 3900000"
            />
          </div>
          <div>
            <label className="label-field">Budget S&amp;E (€)</label>
            <input
              type="number"
              value={project.budget_se || ""}
              onChange={(e) => setProject({ ...project, budget_se: Number(e.target.value) || null })}
              className="input-field"
              placeholder="Ex: 100000"
            />
          </div>
        </div>

        {/* Objective */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label-field mb-0">Objectif global</label>
            <SuggestButton step={1} field="objectif global" projectData={projectData} onSuggestion={(s) => setProject({ ...project, global_objective: s })} />
          </div>
          <textarea
            value={project.global_objective || ""}
            onChange={(e) => setProject({ ...project, global_objective: e.target.value })}
            className="input-field min-h-[80px]"
            placeholder="Décrivez l'objectif global du projet..."
          />
        </div>
      </div>

      {/* Stakeholders */}
      <div className="card space-y-5">
        <h3 className="font-semibold text-oif-blue">Parties prenantes</h3>
        {STAKEHOLDER_TYPES.map((st) => (
          <div key={st.value}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label-field mb-0">{st.label}</label>
              <SuggestButton step={1} field={st.label} projectData={projectData} onSuggestion={(s) => setStakeholders({ ...stakeholders, [st.value]: s })} />
            </div>
            <textarea
              value={stakeholders[st.value] || ""}
              onChange={(e) => setStakeholders({ ...stakeholders, [st.value]: e.target.value })}
              className="input-field min-h-[60px]"
              placeholder={`Décrivez les ${st.label.toLowerCase()}...`}
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button onClick={handleSave} disabled={saving} className="btn-secondary flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Enregistrement..." : "Sauvegarder"}
        </button>
        <button onClick={handleNext} className="btn-primary flex items-center gap-2">
          Suivant <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
