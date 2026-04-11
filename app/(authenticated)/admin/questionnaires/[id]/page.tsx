"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Sparkles,
  Check,
  Save,
  ClipboardList,
} from "lucide-react";
import type { Questionnaire, QuestionnaireQuestion, QuestionType } from "@/lib/types";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "oui_non", label: "Oui / Non" },
  { value: "echelle_1_5", label: "Échelle 1 à 5" },
  { value: "texte_libre", label: "Texte libre" },
  { value: "choix_multiple", label: "Choix multiple" },
  { value: "nombre", label: "Nombre" },
];

function makeId() {
  return `q-${Math.random().toString(36).slice(2, 10)}`;
}

export default function EditQuestionnairePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [improvingId, setImprovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [q, setQ] = useState<Questionnaire | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("questionnaires")
        .select("*")
        .eq("id", params.id)
        .single();
      if (data) {
        const questionnaire = data as Questionnaire;
        if (!Array.isArray(questionnaire.questions)) questionnaire.questions = [];
        setQ(questionnaire);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  function updateQuestion(id: string, patch: Partial<QuestionnaireQuestion>) {
    setQ((prev) =>
      prev
        ? {
            ...prev,
            questions: prev.questions.map((item) =>
              item.id === id ? { ...item, ...patch } : item
            ),
          }
        : prev
    );
  }

  function removeQuestion(id: string) {
    setQ((prev) =>
      prev ? { ...prev, questions: prev.questions.filter((item) => item.id !== id) } : prev
    );
  }

  function move(id: string, delta: -1 | 1) {
    setQ((prev) => {
      if (!prev) return prev;
      const idx = prev.questions.findIndex((item) => item.id === id);
      const target = idx + delta;
      if (idx < 0 || target < 0 || target >= prev.questions.length) return prev;
      const next = [...prev.questions];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return { ...prev, questions: next };
    });
  }

  function addQuestion() {
    setQ((prev) =>
      prev
        ? {
            ...prev,
            questions: [
              ...prev.questions,
              {
                id: makeId(),
                text: "Nouvelle question",
                type: "texte_libre",
                required: false,
              },
            ],
          }
        : prev
    );
  }

  async function improveWithAI(id: string) {
    if (!q) return;
    const question = q.questions.find((item) => item.id === id);
    if (!question) return;
    setImprovingId(id);
    setError(null);
    try {
      const res = await fetch("/api/questionnaire/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: question.text, type: question.type }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error || "Amélioration impossible.");
      } else if (payload.text) {
        updateQuestion(id, { text: payload.text });
      }
    } catch (err: any) {
      setError(err?.message || "Erreur réseau.");
    } finally {
      setImprovingId(null);
    }
  }

  async function save(nextStatus?: Questionnaire["status"]) {
    if (!q) return;
    if (nextStatus === "active") setActivating(true);
    else setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const body: any = {
        title: q.title,
        description: q.description ?? "",
        questions: q.questions,
      };
      if (nextStatus) body.status = nextStatus;

      const res = await fetch(`/api/admin/questionnaires/${q.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error || "Échec de la sauvegarde.");
      } else {
        setInfo(nextStatus === "active" ? "Questionnaire activé." : "Modifications enregistrées.");
        if (payload.questionnaire) setQ(payload.questionnaire as Questionnaire);
        if (nextStatus === "active") {
          setTimeout(() => router.push("/admin/questionnaires"), 600);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Erreur réseau.");
    } finally {
      setSaving(false);
      setActivating(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-pulse text-oif-gray-400">Chargement...</div>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="p-8 text-center text-oif-gray-500">Questionnaire introuvable.</div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-oif-blue flex items-center gap-2">
          <ClipboardList className="w-6 h-6" /> Modifier le questionnaire
        </h1>
        <p className="text-oif-gray-500 mt-1 text-sm">
          Ajustez le texte, le type de réponse et l&apos;ordre des questions, puis activez le
          questionnaire lorsque vous êtes prêt·e.
        </p>
      </div>

      <div className="card mb-6 space-y-4">
        <div>
          <label className="label-field">Titre</label>
          <input
            className="input-field"
            value={q.title}
            onChange={(e) => setQ({ ...q, title: e.target.value })}
          />
        </div>
        <div>
          <label className="label-field">Description</label>
          <textarea
            className="input-field min-h-[80px]"
            value={q.description ?? ""}
            onChange={(e) => setQ({ ...q, description: e.target.value })}
          />
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-oif-gray-500 uppercase tracking-wider">
          Questions ({q.questions.length})
        </h2>
        <button
          onClick={addQuestion}
          className="btn-secondary inline-flex items-center gap-1.5 text-sm"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {q.questions.map((question, idx) => (
          <div key={question.id} className="card">
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-1 pt-1">
                <button
                  onClick={() => move(question.id, -1)}
                  disabled={idx === 0}
                  className="p-1 rounded hover:bg-oif-gray-100 disabled:opacity-30"
                  title="Monter"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => move(question.id, 1)}
                  disabled={idx === q.questions.length - 1}
                  className="p-1 rounded hover:bg-oif-gray-100 disabled:opacity-30"
                  title="Descendre"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-2 text-xs text-oif-gray-400">
                  <span>Q{idx + 1}</span>
                  {question.indicator_code && (
                    <span className="font-mono bg-oif-blue-50 text-oif-blue px-1.5 py-0.5 rounded">
                      {question.indicator_code}
                    </span>
                  )}
                </div>
                <textarea
                  className="input-field min-h-[60px]"
                  value={question.text}
                  onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={question.type}
                    onChange={(e) =>
                      updateQuestion(question.id, { type: e.target.value as QuestionType })
                    }
                    className="input-field max-w-xs"
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1 text-sm text-oif-gray-600">
                    <input
                      type="checkbox"
                      checked={!!question.required}
                      onChange={(e) =>
                        updateQuestion(question.id, { required: e.target.checked })
                      }
                    />
                    Obligatoire
                  </label>
                  <button
                    onClick={() => improveWithAI(question.id)}
                    disabled={improvingId === question.id}
                    className="inline-flex items-center gap-1 text-xs font-medium text-oif-blue hover:bg-oif-blue-50 px-2 py-1 rounded-md disabled:opacity-60"
                    title="Améliorer avec l'IA"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {improvingId === question.id ? "..." : "Améliorer avec l'IA"}
                  </button>
                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="ml-auto text-red-600 hover:bg-red-50 p-1.5 rounded-md"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {q.questions.length === 0 && (
          <div className="card text-center py-8 text-sm text-oif-gray-500">
            Aucune question pour le moment. Cliquez sur &quot;Ajouter&quot;.
          </div>
        )}
      </div>

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

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => save()}
          disabled={saving || activating}
          className="btn-secondary inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" /> {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
        <button
          onClick={() => save("active")}
          disabled={saving || activating || q.status === "active" || q.questions.length === 0}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Check className="w-4 h-4" />{" "}
          {activating ? "Activation..." : q.status === "active" ? "Actif" : "Activer"}
        </button>
      </div>
    </div>
  );
}
