"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Target, Save, Plus, Trash2 } from "lucide-react";
import type {
  CmrConfig,
  CmrPeriod,
  CmrIndicatorTargets,
  Indicator,
  Project,
} from "@/lib/types";

function makePeriodKey(label: string, index: number) {
  const slug = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "periode"}-${index}`;
}

export default function CmrConfigPage() {
  const params = useParams<{ projectId: string }>();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [config, setConfig] = useState<CmrConfig | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: proj }, { data: inds }, { data: cfg }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", params.projectId).single(),
        supabase.from("indicators").select("*").eq("project_id", params.projectId),
        supabase
          .from("cmr_configs")
          .select("*")
          .eq("project_id", params.projectId)
          .maybeSingle(),
      ]);

      if (proj) setProject(proj as Project);
      if (inds) setIndicators(inds as Indicator[]);
      if (cfg) {
        setConfig(cfg as CmrConfig);
      } else {
        setConfig({
          id: "",
          project_id: params.projectId,
          periods: [],
          targets: {},
          created_at: "",
          updated_at: "",
        });
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.projectId]);

  const periodKeys = useMemo(
    () => (config?.periods ?? []).map((p) => p.key),
    [config]
  );

  function addPeriod() {
    setConfig((prev) => {
      if (!prev) return prev;
      const index = prev.periods.length + 1;
      const label = `Période ${index}`;
      const newPeriod: CmrPeriod = {
        key: makePeriodKey(label, index),
        label,
        start: null,
        end: null,
      };
      return { ...prev, periods: [...prev.periods, newPeriod] };
    });
  }

  function updatePeriod(idx: number, patch: Partial<CmrPeriod>) {
    setConfig((prev) => {
      if (!prev) return prev;
      const periods = prev.periods.map((p, i) => (i === idx ? { ...p, ...patch } : p));
      return { ...prev, periods };
    });
  }

  function removePeriod(idx: number) {
    setConfig((prev) => {
      if (!prev) return prev;
      const removed = prev.periods[idx];
      const periods = prev.periods.filter((_, i) => i !== idx);
      const targets: Record<string, CmrIndicatorTargets> = {};
      for (const [indId, entry] of Object.entries(prev.targets ?? {})) {
        const { [removed.key]: _, ...rest } = entry.periods;
        targets[indId] = { baseline: entry.baseline, periods: rest };
      }
      return { ...prev, periods, targets };
    });
  }

  function setBaseline(indicatorId: string, value: string) {
    setConfig((prev) => {
      if (!prev) return prev;
      const entry = prev.targets[indicatorId] ?? { baseline: null, periods: {} };
      const parsed = value === "" ? null : Number(value);
      return {
        ...prev,
        targets: {
          ...prev.targets,
          [indicatorId]: { ...entry, baseline: Number.isNaN(parsed as number) ? null : parsed },
        },
      };
    });
  }

  function setTarget(indicatorId: string, periodKey: string, value: string) {
    setConfig((prev) => {
      if (!prev) return prev;
      const entry = prev.targets[indicatorId] ?? { baseline: null, periods: {} };
      const parsed = value === "" ? null : Number(value);
      return {
        ...prev,
        targets: {
          ...prev.targets,
          [indicatorId]: {
            ...entry,
            periods: {
              ...entry.periods,
              [periodKey]: Number.isNaN(parsed as number) ? null : parsed,
            },
          },
        },
      };
    });
  }

  async function save() {
    if (!config) return;
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const payload = {
        project_id: params.projectId,
        periods: config.periods,
        targets: config.targets,
        updated_at: new Date().toISOString(),
      };

      const { data, error: upsertErr } = await supabase
        .from("cmr_configs")
        .upsert(payload, { onConflict: "project_id" })
        .select()
        .single();

      if (upsertErr) {
        setError(upsertErr.message);
      } else if (data) {
        setConfig(data as CmrConfig);
        setInfo("Configuration enregistrée.");
      }
    } catch (err: any) {
      setError(err?.message || "Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-pulse text-oif-gray-400">Chargement...</div>
      </div>
    );
  }

  if (!project || !config) {
    return <div className="p-8 text-oif-gray-500">Projet introuvable.</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-oif-blue flex items-center gap-2">
          <Target className="w-6 h-6" /> CMR — {project.title}
        </h1>
        <p className="text-oif-gray-500 mt-1 text-sm">
          Configurez les paramètres du cadre de mesure du rendement (CMR) pour ce projet.
        </p>
      </div>

      {/* Section 1 — Informations projet */}
      <section className="card mb-6">
        <h2 className="font-semibold text-oif-gray-700 mb-3">1. Informations du projet</h2>
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-oif-gray-400 text-xs uppercase">Code</dt>
            <dd className="font-mono">{project.code || "—"}</dd>
          </div>
          <div>
            <dt className="text-oif-gray-400 text-xs uppercase">Programme</dt>
            <dd>{project.programme_strategique || "—"}</dd>
          </div>
          <div>
            <dt className="text-oif-gray-400 text-xs uppercase">Pays</dt>
            <dd>{project.countries?.join(", ") || "—"}</dd>
          </div>
          <div>
            <dt className="text-oif-gray-400 text-xs uppercase">Objectif global</dt>
            <dd>{project.global_objective || "—"}</dd>
          </div>
        </dl>
      </section>

      {/* Section 2 — Périodes de mesure */}
      <section className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-oif-gray-700">2. Périodes de mesure</h2>
          <button
            onClick={addPeriod}
            className="btn-secondary inline-flex items-center gap-1.5 text-sm"
          >
            <Plus className="w-4 h-4" /> Ajouter une période
          </button>
        </div>
        {config.periods.length === 0 ? (
          <p className="text-sm text-oif-gray-500">
            Aucune période définie. Ajoutez au moins une période pour configurer les cibles.
          </p>
        ) : (
          <div className="space-y-2">
            {config.periods.map((period, idx) => (
              <div
                key={period.key}
                className="flex flex-col md:flex-row md:items-center gap-2 border border-oif-gray-200 rounded-lg p-3"
              >
                <input
                  className="input-field md:max-w-xs"
                  value={period.label}
                  onChange={(e) => updatePeriod(idx, { label: e.target.value })}
                  placeholder="Libellé (ex : 2024-T1)"
                />
                <input
                  className="input-field md:max-w-[11rem]"
                  type="date"
                  value={period.start ?? ""}
                  onChange={(e) => updatePeriod(idx, { start: e.target.value || null })}
                />
                <input
                  className="input-field md:max-w-[11rem]"
                  type="date"
                  value={period.end ?? ""}
                  onChange={(e) => updatePeriod(idx, { end: e.target.value || null })}
                />
                <button
                  onClick={() => removePeriod(idx)}
                  className="ml-auto text-red-600 hover:bg-red-50 p-2 rounded-md"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 3 — Cibles par indicateur */}
      <section className="card mb-6">
        <h2 className="font-semibold text-oif-gray-700 mb-3">
          3. Baseline et cibles par indicateur
        </h2>
        {indicators.length === 0 ? (
          <p className="text-sm text-oif-gray-500">
            Aucun indicateur n&apos;a encore été défini pour ce projet.
          </p>
        ) : config.periods.length === 0 ? (
          <p className="text-sm text-oif-gray-500">
            Définissez d&apos;abord les périodes ci-dessus.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-oif-gray-500 border-b border-oif-gray-200">
                  <th className="py-2 pr-3">Indicateur</th>
                  <th className="py-2 pr-3">Unité</th>
                  <th className="py-2 pr-3">Baseline</th>
                  {config.periods.map((p) => (
                    <th key={p.key} className="py-2 pr-3 whitespace-nowrap">
                      {p.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {indicators.map((ind) => {
                  const entry = config.targets[ind.id] ?? {
                    baseline: null,
                    periods: {},
                  };
                  return (
                    <tr key={ind.id} className="border-b border-oif-gray-100 align-top">
                      <td className="py-2 pr-3">
                        <div className="font-medium text-oif-gray-700 max-w-xs">
                          {ind.title}
                        </div>
                        {ind.code && (
                          <div className="text-xs font-mono text-oif-gray-400 mt-0.5">
                            {ind.code}
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-oif-gray-500">{ind.unit || "—"}</td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          className="input-field w-24"
                          value={entry.baseline ?? ""}
                          onChange={(e) => setBaseline(ind.id, e.target.value)}
                        />
                      </td>
                      {periodKeys.map((key) => (
                        <td key={key} className="py-2 pr-3">
                          <input
                            type="number"
                            className="input-field w-24"
                            value={entry.periods[key] ?? ""}
                            onChange={(e) => setTarget(ind.id, key, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">
          {error}
        </p>
      )}
      {info && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 mb-3">
          {info}
        </p>
      )}

      <div>
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Enregistrement..." : "Enregistrer la configuration"}
        </button>
      </div>
    </div>
  );
}
