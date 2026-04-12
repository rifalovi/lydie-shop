"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Heart,
  LogOut,
  MapPin,
  Package,
  Sparkles,
  Truck,
  User,
  Plus,
  Star,
  Trash2,
  Loader2,
} from "lucide-react";
import { CrownIcon } from "@/components/ui/Crown";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cx, formatEUR, formatDate } from "@/lib/format";
import { getTierDefinition, getNextTier } from "@/lib/loyalty";
import { ProfileTab } from "./ProfileTab";
import { BeautyProfileTab, type BeautyData } from "./BeautyProfileTab";

// ────────────────────────────────────────────────────────────────────────────
// Types sérialisés depuis le server component page.tsx
// ────────────────────────────────────────────────────────────────────────────
export type AccountAddress = {
  id: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
};

export type AccountOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  itemsCount: number;
  createdAt: string;
  trackingNumber: string | null;
  carrier: string | null;
};

export type AccountData = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  tier: string;
  loyaltyPoints: number;
  createdAt: string;
  orders: AccountOrder[];
  addresses: AccountAddress[];
  wishlistCount: number;
  beautyProfile: BeautyData | null;
};

// ────────────────────────────────────────────────────────────────────────────
// Tabs
// ────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "profil", label: "Profil", icon: User },
  { id: "adresses", label: "Adresses", icon: MapPin },
  { id: "beaute", label: "Préférences beauté", icon: Sparkles },
  { id: "commandes", label: "Commandes", icon: Package },
  { id: "favoris", label: "Favoris", icon: Heart },
  { id: "deconnexion", label: "Se déconnecter", icon: LogOut },
] as const;

type TabId = (typeof TABS)[number]["id"];

const STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "bg-borderSoft text-ink" },
  CONFIRMED: { label: "Confirmée", color: "bg-rose-light text-rose-dark" },
  PROCESSING: { label: "En préparation", color: "bg-gold-light/40 text-gold-dark" },
  SHIPPED: { label: "Expédiée", color: "bg-gradient-royal text-white" },
  DELIVERED: { label: "Livrée", color: "bg-gradient-gold text-white" },
  CANCELLED: { label: "Annulée", color: "bg-borderSoft text-ink-muted" },
  REFUNDED: { label: "Remboursée", color: "bg-borderSoft text-ink-muted" },
};

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────
export function AccountClient({ data }: { data: AccountData }) {
  const [tab, setTab] = useState<TabId>("profil");
  const firstName = data.name?.split(" ")[0] ?? "Reine";
  const tierInfo = getTierDefinition(data.tier as "ROSE" | "GOLD" | "DIAMOND");
  const { next, remaining } = getNextTier(data.loyaltyPoints);

  return (
    <div className="container-page py-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">Mon espace</p>
          <h1 className="mt-1 font-serif text-4xl md:text-5xl">
            Bonjour, <span className="font-script title-gold">{firstName}</span> {tierInfo.emoji}
          </h1>
        </div>
        <div className="card-luxe flex items-center gap-3 px-5 py-3">
          <CrownIcon className="h-5 w-5 text-gold" />
          <div className="text-right">
            <p className="font-ui text-sm font-bold text-ink">{tierInfo.label}</p>
            <p className="font-num text-xs text-ink-muted">{data.loyaltyPoints.toLocaleString("fr-FR")} pts</p>
          </div>
        </div>
      </div>

      {/* Loyalty bar */}
      {next && (
        <div className="mt-6 rounded-luxe bg-gradient-royal p-4 text-white">
          <div className="flex items-center justify-between text-xs">
            <span>{tierInfo.emoji} {tierInfo.label}</span>
            <span>{next.emoji} {next.label}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${Math.min(100, (data.loyaltyPoints / next.threshold) * 100)}%` }} />
          </div>
          <p className="mt-1 text-xs text-white/80">Encore {remaining.toLocaleString("fr-FR")} pts pour le prochain palier</p>
        </div>
      )}

      {/* Layout */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Side nav */}
        <nav className="card-luxe h-fit p-3 lg:sticky lg:top-28">
          <ul className="space-y-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              if (t.id === "deconnexion") {
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex w-full items-center gap-3 rounded-soft px-3 py-2.5 text-sm font-ui font-semibold text-rose-dark transition-colors hover:bg-rose-light"
                    >
                      <Icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  </li>
                );
              }
              return (
                <li key={t.id}>
                  <button
                    onClick={() => setTab(t.id)}
                    className={cx(
                      "flex w-full items-center gap-3 rounded-soft px-3 py-2.5 text-sm font-ui font-semibold transition-colors",
                      tab === t.id ? "bg-gradient-rose-soft text-rose-dark" : "text-ink hover:bg-cream",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content */}
        <div className="min-w-0">
          {tab === "profil" && <ProfileTab name={data.name} email={data.email} phone={data.phone} />}
          {tab === "adresses" && <AddressesSection addresses={data.addresses} />}
          {tab === "beaute" && <BeautyProfileTab initial={data.beautyProfile} />}
          {tab === "commandes" && <OrdersSection orders={data.orders} />}
          {tab === "favoris" && <FavoritesSection count={data.wishlistCount} />}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Addresses section (inline)
// ────────────────────────────────────────────────────────────────────────────
function AddressesSection({ addresses: initial }: { addresses: AccountAddress[] }) {
  const [addresses, setAddresses] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", street: "", city: "", postalCode: "", country: "FR", phone: "", isDefault: false });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ firstName: "", lastName: "", street: "", city: "", postalCode: "", country: "FR", phone: "", isDefault: false });
    setEditId(null);
    setShowForm(false);
    setError(null);
  };

  const startEdit = (a: AccountAddress) => {
    setForm({ firstName: a.firstName, lastName: a.lastName, street: a.street, city: a.city, postalCode: a.postalCode, country: a.country, phone: a.phone ?? "", isDefault: a.isDefault });
    setEditId(a.id);
    setShowForm(true);
  };

  const saveAddress = async () => {
    setError(null);
    setSaving(true);
    try {
      const payload = { ...form, phone: form.phone || null, ...(editId ? { id: editId } : {}) };
      const res = await fetch("/api/user/addresses", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d?.error ?? "Erreur."); return; }
      const saved = await res.json();
      if (editId) {
        setAddresses((prev) => prev.map((a) => (a.id === editId ? saved : saved.isDefault ? { ...a, isDefault: false } : a)));
      } else {
        setAddresses((prev) => saved.isDefault ? [...prev.map((a: AccountAddress) => ({ ...a, isDefault: false })), saved] : [...prev, saved]);
      }
      resetForm();
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/user/addresses?id=${id}`, { method: "DELETE" });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } finally { setDeleting(null); }
  };

  return (
    <div className="space-y-4">
      {addresses.length === 0 && !showForm && (
        <div className="card-luxe p-8 text-center text-ink-muted">
          <MapPin className="mx-auto h-8 w-8" />
          <p className="mt-3 font-serif text-lg">Aucune adresse enregistrée</p>
        </div>
      )}
      {addresses.map((a) => (
        <div key={a.id} className="card-luxe flex items-start justify-between gap-4 p-5">
          <div>
            <p className="font-ui font-bold text-ink">
              {a.firstName} {a.lastName}
              {a.isDefault && <span className="ml-2 rounded-full bg-gradient-gold px-2 py-0.5 text-[10px] font-bold text-white">Par défaut</span>}
            </p>
            <p className="mt-1 text-sm text-ink-muted">{a.street}<br />{a.postalCode} {a.city}</p>
            {a.phone && <p className="text-xs text-ink-muted">{a.phone}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => startEdit(a)} className="text-xs font-ui font-semibold text-rose-dark hover:underline">Modifier</button>
            <button onClick={() => remove(a.id)} disabled={deleting === a.id} className="text-xs font-ui font-semibold text-ink-muted hover:text-rose-dark">
              {deleting === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </button>
          </div>
        </div>
      ))}
      {showForm ? (
        <div className="card-luxe space-y-3 p-5">
          <h3 className="font-serif text-lg">{editId ? "Modifier l'adresse" : "Nouvelle adresse"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Prénom" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input label="Nom" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            <Input label="Adresse" className="sm:col-span-2" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
            <Input label="Code postal" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
            <Input label="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="accent-rose-dark" />
            Adresse par défaut
          </label>
          {error && <p className="rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">{error}</p>}
          <div className="flex gap-3">
            <Button onClick={saveAddress} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer</Button>
            <Button variant="secondary" onClick={resetForm}>Annuler</Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="flex w-full items-center justify-center gap-2 rounded-luxe border-2 border-dashed border-borderSoft p-4 text-sm font-ui font-semibold text-ink-muted transition-colors hover:border-rose-dark hover:text-rose-dark">
          <Plus className="h-4 w-4" /> Ajouter une adresse
        </button>
      )}
    </div>
  );
}

// Need this import for the address save button icon
import { Save } from "lucide-react";

// ────────────────────────────────────────────────────────────────────────────
// Orders section
// ────────────────────────────────────────────────────────────────────────────
function OrdersSection({ orders }: { orders: AccountOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="card-luxe p-8 text-center text-ink-muted">
        <Package className="mx-auto h-8 w-8" />
        <p className="mt-3 font-serif text-lg">Aucune commande pour l&apos;instant</p>
        <Link href="/boutique" className="mt-4 inline-block font-ui font-semibold text-rose-dark hover:underline">Découvrir la boutique →</Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const s = STATUS[o.status] ?? STATUS.PENDING;
        return (
          <div key={o.id} className="card-luxe p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-ui font-bold text-ink">{o.orderNumber}</p>
                <p className="text-xs text-ink-muted">{formatDate(o.createdAt)} · {o.itemsCount} article{o.itemsCount > 1 ? "s" : ""}</p>
              </div>
              <div className="text-right">
                <span className={cx("inline-block rounded-full px-3 py-1 text-[11px] font-ui font-semibold", s.color)}>{s.label}</span>
                <p className="mt-1 font-num text-lg font-bold">{formatEUR(o.total)}</p>
              </div>
            </div>
            {o.trackingNumber && (
              <div className="mt-3 flex items-center gap-2 rounded-soft bg-gradient-rose-soft px-3 py-2 text-xs text-ink">
                <Truck className="h-3.5 w-3.5 text-rose-dark" />
                <span>Suivi : <strong>{o.carrier}</strong> — {o.trackingNumber}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Favorites section
// ────────────────────────────────────────────────────────────────────────────
function FavoritesSection({ count }: { count: number }) {
  return (
    <div className="card-luxe p-8 text-center">
      <Heart className="mx-auto h-8 w-8 text-rose-dark" />
      <p className="mt-3 font-serif text-xl">{count} favori{count > 1 ? "s" : ""}</p>
      <p className="mt-2 text-sm text-ink-muted">Retrouvez tous vos coups de cœur sur une page dédiée.</p>
      <Link href="/compte/favoris" className="mt-4 inline-block">
        <Button>Voir mes favoris</Button>
      </Link>
    </div>
  );
}
