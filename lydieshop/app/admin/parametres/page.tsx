"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Store, Truck, Globe, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cx } from "@/lib/format";

type Settings = {
  shopName: string;
  contactEmail: string;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  facebookUrl: string | null;
  promoBarMessage: string | null;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  freeShippingThreshold: number;
  colissimoPrice: number;
  mondialRelayPrice: number;
  chronopostPrice: number;
  colissimoEnabled: boolean;
  mondialRelayEnabled: boolean;
  chronopostEnabled: boolean;
};

const TABS = [
  { id: "general", label: "Général", icon: Store },
  { id: "livraison", label: "Livraison", icon: Truck },
  { id: "reseaux", label: "Réseaux sociaux", icon: Globe },
  { id: "maintenance", label: "Maintenance", icon: AlertTriangle },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function AdminParametresPage() {
  const [tab, setTab] = useState<TabId>("general");
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/settings");
      if (res.ok) setS(await res.json());
    })();
  }, []);

  const save = async () => {
    if (!s) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d?.error ?? "Erreur."); return; }
      const updated = await res.json();
      setS(updated);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  if (!s) return <div className="flex h-64 items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-rose-dark" /></div>;

  const u = (field: keyof Settings, val: unknown) => setS({ ...s, [field]: val } as Settings);

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">Configuration</p>
        <h1 className="mt-1 font-serif text-4xl">Paramètres</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={cx("flex items-center gap-2 rounded-full px-4 py-2 text-sm font-ui font-semibold whitespace-nowrap transition-colors", tab === t.id ? "bg-gradient-royal text-white" : "bg-white text-ink hover:bg-rose-light")}>
              <Icon className="h-4 w-4" />{t.label}
            </button>
          );
        })}
      </div>

      <div className="card-luxe mt-6 space-y-5 p-6">
        {tab === "general" && (
          <>
            <Input label="Nom de la boutique" value={s.shopName} onChange={(e) => u("shopName", e.target.value)} />
            <Input label="Email de contact" type="email" value={s.contactEmail} onChange={(e) => u("contactEmail", e.target.value)} />
            <div>
              <label className="mb-1.5 block text-sm font-ui font-semibold text-ink">Message bannière promo</label>
              <input value={s.promoBarMessage ?? ""} onChange={(e) => u("promoBarMessage", e.target.value || null)} className="input-luxe" placeholder="Livraison offerte dès 60€ · Cadeau surprise..." />
              <p className="mt-1 text-xs text-ink-muted">Affiché dans le ticker rose en haut du site.</p>
            </div>
          </>
        )}

        {tab === "livraison" && (
          <>
            <Input label="Seuil livraison gratuite (€)" type="number" step="0.01" value={String(s.freeShippingThreshold)} onChange={(e) => u("freeShippingThreshold", Number(e.target.value))} />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Input label="Colissimo (€)" type="number" step="0.01" value={String(s.colissimoPrice)} onChange={(e) => u("colissimoPrice", Number(e.target.value))} />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.colissimoEnabled} onChange={(e) => u("colissimoEnabled", e.target.checked)} className="accent-rose-dark" />Activé</label>
              </div>
              <div className="space-y-2">
                <Input label="Mondial Relay (€)" type="number" step="0.01" value={String(s.mondialRelayPrice)} onChange={(e) => u("mondialRelayPrice", Number(e.target.value))} />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.mondialRelayEnabled} onChange={(e) => u("mondialRelayEnabled", e.target.checked)} className="accent-rose-dark" />Activé</label>
              </div>
              <div className="space-y-2">
                <Input label="Chronopost (€)" type="number" step="0.01" value={String(s.chronopostPrice)} onChange={(e) => u("chronopostPrice", Number(e.target.value))} />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.chronopostEnabled} onChange={(e) => u("chronopostEnabled", e.target.checked)} className="accent-rose-dark" />Activé</label>
              </div>
            </div>
          </>
        )}

        {tab === "reseaux" && (
          <>
            <Input label="Instagram" value={s.instagramUrl ?? ""} onChange={(e) => u("instagramUrl", e.target.value || null)} placeholder="https://instagram.com/lydieshop" />
            <Input label="TikTok" value={s.tiktokUrl ?? ""} onChange={(e) => u("tiktokUrl", e.target.value || null)} placeholder="https://tiktok.com/@lydieshop" />
            <Input label="Facebook" value={s.facebookUrl ?? ""} onChange={(e) => u("facebookUrl", e.target.value || null)} placeholder="https://facebook.com/lydieshop" />
          </>
        )}

        {tab === "maintenance" && (
          <>
            <label className="flex items-center gap-3 rounded-soft bg-rose-light/40 p-4">
              <input type="checkbox" checked={s.maintenanceMode} onChange={(e) => u("maintenanceMode", e.target.checked)} className="h-5 w-5 accent-rose-dark" />
              <div>
                <p className="font-ui text-sm font-bold text-rose-dark">Mode maintenance</p>
                <p className="text-xs text-ink-muted">Ferme temporairement la boutique. Les visiteurs voient un message d&apos;attente.</p>
              </div>
            </label>
            <div>
              <label className="mb-1.5 block text-sm font-ui font-semibold text-ink">Message de maintenance</label>
              <textarea value={s.maintenanceMessage ?? ""} onChange={(e) => u("maintenanceMessage", e.target.value || null)} rows={3} className="input-luxe resize-none" />
            </div>
          </>
        )}
      </div>

      {error && <p className="mt-4 rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">{error}</p>}
      {saved && <p className="mt-4 rounded-soft bg-gold-light/40 px-3 py-2 text-sm text-gold-dark">Paramètres enregistrés.</p>}

      <div className="mt-6 flex justify-end">
        <Button size="lg" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
