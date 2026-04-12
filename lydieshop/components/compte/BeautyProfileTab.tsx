"use client";

import { useState } from "react";
import { Loader2, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cx } from "@/lib/format";

export type BeautyData = {
  hairType: string[];
  desiredLength: string[];
  favoriteColors: string[];
  budgetRange: string | null;
  occasions: string[];
  notes: string | null;
};

const HAIR_TYPES = ["Fins", "Normaux", "Épais", "Lisses", "Ondulés", "Bouclés", "Frisés", "Crépus"];
const LENGTHS = ["Courte (< 14\")", "Mi-longue (14-18\")", "Longue (18-22\")", "Très longue (22\"+)"];
const COLORS = ["Noir naturel", "Châtain", "Brun", "Blond", "Miel", "Bordeaux", "Rouge", "Ombré", "Fantaisie"];
const BUDGETS = ["Moins de 100 €", "100 – 200 €", "200 – 300 €", "Plus de 300 €"];
const OCCASIONS = ["Quotidien", "Travail / bureau", "Soirée", "Mariage / cérémonie", "Sport / plein air", "Vacances"];

type Props = { initial: BeautyData | null };

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-full border-2 px-3 py-1.5 text-xs font-ui font-semibold transition-all",
        active
          ? "border-rose-dark bg-rose-dark text-white"
          : "border-borderSoft bg-white text-ink hover:border-rose-dark",
      )}
    >
      {label}
    </button>
  );
}

export function BeautyProfileTab({ initial }: Props) {
  const [hairType, setHairType] = useState<string[]>(initial?.hairType ?? []);
  const [desiredLength, setDesiredLength] = useState<string[]>(initial?.desiredLength ?? []);
  const [favoriteColors, setFavoriteColors] = useState<string[]>(initial?.favoriteColors ?? []);
  const [budgetRange, setBudgetRange] = useState<string | null>(initial?.budgetRange ?? null);
  const [occasions, setOccasions] = useState<string[]>(initial?.occasions ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/user/beauty-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hairType, desiredLength, favoriteColors, budgetRange, occasions, notes: notes.trim() || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d?.error ?? "Erreur.");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-gold-dark">
        <Sparkles className="h-5 w-5" />
        <p className="text-sm text-ink-muted">
          Ces préférences sont utilisées par notre chatbot IA pour vous recommander les perruques et tissages qui vous correspondent le mieux.
        </p>
      </div>

      <section className="card-luxe p-6">
        <h3 className="font-serif text-lg">Type de cheveux naturels</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {HAIR_TYPES.map((t) => (
            <Toggle key={t} label={t} active={hairType.includes(t)} onClick={() => toggle(hairType, t, setHairType)} />
          ))}
        </div>
      </section>

      <section className="card-luxe p-6">
        <h3 className="font-serif text-lg">Longueur souhaitée</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {LENGTHS.map((l) => (
            <Toggle key={l} label={l} active={desiredLength.includes(l)} onClick={() => toggle(desiredLength, l, setDesiredLength)} />
          ))}
        </div>
      </section>

      <section className="card-luxe p-6">
        <h3 className="font-serif text-lg">Couleurs préférées</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <Toggle key={c} label={c} active={favoriteColors.includes(c)} onClick={() => toggle(favoriteColors, c, setFavoriteColors)} />
          ))}
        </div>
      </section>

      <section className="card-luxe p-6">
        <h3 className="font-serif text-lg">Budget moyen</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {BUDGETS.map((b) => (
            <Toggle key={b} label={b} active={budgetRange === b} onClick={() => setBudgetRange(budgetRange === b ? null : b)} />
          ))}
        </div>
      </section>

      <section className="card-luxe p-6">
        <h3 className="font-serif text-lg">Occasions</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {OCCASIONS.map((o) => (
            <Toggle key={o} label={o} active={occasions.includes(o)} onClick={() => toggle(occasions, o, setOccasions)} />
          ))}
        </div>
      </section>

      <section className="card-luxe p-6">
        <h3 className="font-serif text-lg">Notes supplémentaires</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Allergies, préférences de texture, commentaire libre..."
          className="input-luxe mt-3 resize-none"
        />
      </section>

      {error && <p className="rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">{error}</p>}
      {saved && <p className="rounded-soft bg-gold-light/40 px-3 py-2 text-sm text-gold-dark">Préférences enregistrées — le chatbot les prendra en compte.</p>}

      <Button onClick={save} disabled={saving} size="lg">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Enregistrer mes préférences
      </Button>
    </div>
  );
}
