"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cx } from "@/lib/format";

type Template = {
  id: string;
  name: string;
  type: string;
  unit: string | null;
  options: string[];
  isRequired: boolean;
  position: number;
};

const TYPE_LABELS: Record<string, string> = {
  TEXT: "Texte libre",
  SELECT: "Liste de choix",
  NUMBER: "Nombre",
  BOOLEAN: "Oui / Non",
};

const EMPTY = { name: "", type: "TEXT", unit: "", options: "", isRequired: false };

export function AttributesClient({
  categoryId,
  initialTemplates,
}: {
  categoryId: string;
  initialTemplates: Template[];
}) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const resetForm = () => { setForm(EMPTY); setEditId(null); setShowForm(false); setError(null); };

  const startEdit = (t: Template) => {
    setForm({ name: t.name, type: t.type, unit: t.unit ?? "", options: t.options.join(", "), isRequired: t.isRequired });
    setEditId(t.id); setShowForm(true);
  };

  const save = async () => {
    setError(null); setSaving(true);
    try {
      const payload = {
        ...(editId ? {} : { categoryId }),
        name: form.name.trim(),
        type: form.type,
        unit: form.unit.trim() || null,
        options: form.type === "SELECT" ? form.options.split(",").map((o) => o.trim()).filter(Boolean) : [],
        isRequired: form.isRequired,
      };
      const url = editId ? `/api/attributes/${editId}` : "/api/attributes";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d?.error ?? "Erreur."); return; }
      resetForm(); router.refresh();
      // Reload from server
      const r2 = await fetch(`/api/attributes?categoryId=${categoryId}`);
      if (r2.ok) { const data = await r2.json(); setTemplates(data.templates); }
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/attributes/${id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setDeleting(null);
  };

  return (
    <>
      <Link href="/admin/categories" className="mb-6 inline-flex items-center gap-2 text-sm font-ui font-semibold text-rose-dark hover:underline">
        <ArrowLeft className="h-4 w-4" /> Retour aux catégories
      </Link>

      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">{templates.length} attribut{templates.length > 1 ? "s" : ""}</p>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="h-4 w-4" />Ajouter un attribut</Button>
      </div>

      {showForm && (
        <div className="card-luxe mt-4 space-y-4 p-6">
          <h3 className="font-serif text-lg">{editId ? "Modifier" : "Nouvel attribut"}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Texture" />
            <div>
              <label className="mb-1.5 block text-sm font-ui font-semibold text-ink">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-luxe">
                <option value="TEXT">Texte libre</option>
                <option value="SELECT">Liste de choix</option>
                <option value="NUMBER">Nombre</option>
                <option value="BOOLEAN">Oui / Non</option>
              </select>
            </div>
            {form.type === "SELECT" && (
              <Input label="Options (séparées par des virgules)" value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} placeholder="Lisse, Ondulée, Bouclée" className="sm:col-span-2" />
            )}
            {form.type === "NUMBER" && (
              <Input label="Unité (optionnel)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="g, cm, ml..." />
            )}
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isRequired} onChange={(e) => setForm({ ...form, isRequired: e.target.checked })} className="accent-rose-dark" />Obligatoire</label>
          {error && <p className="rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">{error}</p>}
          <div className="flex gap-3">
            <Button onClick={save} disabled={saving || !form.name.trim()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{editId ? "Mettre à jour" : "Ajouter"}</Button>
            <Button variant="secondary" onClick={resetForm}>Annuler</Button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {templates.map((t, i) => (
          <div key={t.id} className="card-luxe flex items-center gap-4 p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-rose-soft text-xs font-ui font-bold text-rose-dark">{i + 1}</span>
            <div className="flex-1">
              <p className="font-ui font-bold text-ink">
                {t.name} {t.isRequired && <span className="text-rose-dark">*</span>}
              </p>
              <p className="text-xs text-ink-muted">
                {TYPE_LABELS[t.type] ?? t.type}
                {t.unit && ` · ${t.unit}`}
                {t.options.length > 0 && ` · ${t.options.length} options`}
              </p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => startEdit(t)} className="rounded-full p-2 text-ink-muted hover:bg-rose-light hover:text-rose-dark"><Edit className="h-4 w-4" /></button>
              <button onClick={() => remove(t.id)} disabled={deleting === t.id} className="rounded-full p-2 text-ink-muted hover:bg-rose-light hover:text-rose-dark">
                {deleting === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
