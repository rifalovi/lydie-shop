"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Loader2, Plus, Power, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatEUR, formatDate } from "@/lib/format";
import { cx } from "@/lib/format";

type PromoCode = {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
};

const typeLabel: Record<string, string> = {
  PERCENT: "Pourcentage",
  FIXED: "Montant fixe",
  FREE_SHIPPING: "Livraison offerte",
};

const EMPTY_FORM = {
  code: "",
  type: "PERCENT" as string,
  value: "",
  minOrder: "",
  maxUses: "",
  expiresAt: "",
};

export function PromoClient({
  initialCodes,
}: {
  initialCodes: PromoCode[];
}) {
  const router = useRouter();
  const [codes] = useState(initialCodes);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
    setError(null);
  };

  const startEdit = (c: PromoCode) => {
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      minOrder: c.minOrder ? String(c.minOrder) : "",
      maxUses: c.maxUses ? String(c.maxUses) : "",
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
    });
    setEditId(c.id);
    setShowForm(true);
  };

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: Number(form.value) || 0,
        minOrder: form.minOrder ? Number(form.minOrder) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
        isActive: true,
      };
      const url = editId ? `/api/promotions/${editId}` : "/api/promotions";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d?.error ?? "Erreur.");
        return;
      }
      resetForm();
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: PromoCode) => {
    setToggling(c.id);
    try {
      await fetch(`/api/promotions/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      router.refresh();
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
            Marketing
          </p>
          <h1 className="mt-1 font-serif text-4xl">Codes promo</h1>
          <p className="mt-2 text-ink-muted">
            {codes.length} code{codes.length > 1 ? "s" : ""}.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4" />
          Nouveau code promo
        </Button>
      </div>

      {/* Modal / inline form */}
      {showForm && (
        <div className="card-luxe mt-6 space-y-4 p-6">
          <h2 className="font-serif text-xl">
            {editId ? "Modifier le code" : "Nouveau code promo"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="REINE20"
            />
            <div>
              <label className="mb-1.5 block text-sm font-ui font-semibold text-ink">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="input-luxe"
              >
                <option value="PERCENT">Pourcentage (%)</option>
                <option value="FIXED">Montant fixe (€)</option>
                <option value="FREE_SHIPPING">Livraison offerte</option>
              </select>
            </div>
            <Input
              label={form.type === "PERCENT" ? "Valeur (%)" : "Valeur (€)"}
              type="number"
              step="0.01"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder={form.type === "PERCENT" ? "10" : "5.00"}
            />
            <Input
              label="Commande minimum (€)"
              type="number"
              step="0.01"
              value={form.minOrder}
              onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
              placeholder="Optionnel"
            />
            <Input
              label="Utilisations max"
              type="number"
              value={form.maxUses}
              onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
              placeholder="Illimité"
            />
            <Input
              label="Date d'expiration"
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </div>
          {error && (
            <p className="rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button onClick={save} disabled={saving || !form.code.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editId ? "Mettre à jour" : "Créer le code"}
            </Button>
            <Button variant="secondary" onClick={resetForm}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card-luxe mt-6 overflow-hidden">
        {codes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center text-ink-muted">
            <Tag className="h-10 w-10" />
            <p className="font-serif text-xl">Aucun code promo</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gradient-rose-soft text-left text-xs uppercase tracking-widest text-ink-muted">
              <tr>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3 text-right">Valeur</th>
                <th className="px-5 py-3 text-right">Utilisations</th>
                <th className="px-5 py-3 text-right">Expire</th>
                <th className="px-5 py-3 text-right">Statut</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className="border-t border-borderSoft/60 hover:bg-cream">
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-gradient-rose-soft px-3 py-1 font-mono text-xs font-bold text-rose-dark">
                      {c.code}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-ink-muted">
                    {typeLabel[c.type] ?? c.type}
                  </td>
                  <td className="px-5 py-4 text-right font-num font-bold">
                    {c.type === "PERCENT"
                      ? `${c.value}%`
                      : c.type === "FREE_SHIPPING"
                        ? "—"
                        : formatEUR(c.value)}
                  </td>
                  <td className="px-5 py-4 text-right font-num">
                    {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}
                  </td>
                  <td className="px-5 py-4 text-right text-xs text-ink-muted">
                    {c.expiresAt ? formatDate(c.expiresAt) : "Jamais"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className={cx(
                        "inline-block rounded-full px-3 py-1 text-[10px] font-ui font-bold uppercase tracking-wider",
                        c.isActive
                          ? "bg-gradient-gold text-white"
                          : "bg-borderSoft text-ink-muted",
                      )}
                    >
                      {c.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => startEdit(c)}
                        className="rounded-full p-2 text-ink-muted hover:bg-rose-light hover:text-rose-dark"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(c)}
                        disabled={toggling === c.id}
                        className={cx(
                          "rounded-full p-2 transition-colors",
                          c.isActive
                            ? "text-ink-muted hover:bg-rose-light hover:text-rose-dark"
                            : "text-gold-dark hover:bg-gold-light/40",
                        )}
                        title={c.isActive ? "Désactiver" : "Activer"}
                      >
                        {toggling === c.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
