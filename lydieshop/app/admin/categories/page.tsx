"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, FolderTree, Loader2, Plus, Power, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cx } from "@/lib/format";

type Cat = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  isActive: boolean;
  position: number;
  _count: { products: number; attributeTemplates: number };
};

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/categories");
    if (res.ok) { const d = await res.json(); setCats(d.categories); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => { setName(""); setImage(""); setEditId(null); setShowForm(false); setError(null); };

  const startEdit = (c: Cat) => { setName(c.name); setImage(c.image ?? ""); setEditId(c.id); setShowForm(true); };

  const save = async () => {
    setError(null); setSaving(true);
    try {
      const url = editId ? `/api/categories/${editId}` : "/api/categories";
      const method = editId ? "PATCH" : "POST";
      const payload: Record<string, unknown> = { name: name.trim() };
      if (image.trim()) payload.image = image.trim();
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d?.error ?? "Erreur."); return; }
      resetForm(); load(); router.refresh();
    } finally { setSaving(false); }
  };

  const toggle = async (c: Cat) => {
    await fetch(`/api/categories/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !c.isActive }) });
    load();
  };

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">Catalogue</p>
          <h1 className="mt-1 font-serif text-4xl">Catégories</h1>
          <p className="mt-2 text-ink-muted">{cats.length} catégorie{cats.length > 1 ? "s" : ""}.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="h-4 w-4" />Nouvelle catégorie</Button>
      </div>

      {showForm && (
        <div className="card-luxe mt-6 space-y-4 p-6">
          <h2 className="font-serif text-xl">{editId ? "Modifier" : "Nouvelle catégorie"}</h2>
          <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} placeholder="Parfums & Cosmétiques" />
          <Input label="URL image (optionnel)" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
          {error && <p className="rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">{error}</p>}
          <div className="flex gap-3">
            <Button onClick={save} disabled={saving || !name.trim()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{editId ? "Mettre à jour" : "Créer"}</Button>
            <Button variant="secondary" onClick={resetForm}>Annuler</Button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="card-luxe p-12 text-center text-ink-muted"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
        ) : cats.length === 0 ? (
          <div className="card-luxe p-12 text-center text-ink-muted"><FolderTree className="mx-auto h-8 w-8" /><p className="mt-3 font-serif text-lg">Aucune catégorie</p></div>
        ) : (
          cats.map((c) => (
            <div key={c.id} className={cx("card-luxe flex items-center gap-4 p-4", !c.isActive && "opacity-50")}>
              {c.image ? (
                <img src={c.image} alt={c.name} className="h-14 w-14 rounded-soft object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-soft bg-rose-light text-rose-dark"><FolderTree className="h-5 w-5" /></div>
              )}
              <div className="flex-1">
                <p className="font-ui font-bold text-ink">{c.name}</p>
                <p className="text-xs text-ink-muted">/{c.slug} · {c._count.products} produit{c._count.products > 1 ? "s" : ""} · {c._count.attributeTemplates} attribut{c._count.attributeTemplates > 1 ? "s" : ""}</p>
              </div>
              <div className="flex gap-1">
                <Link href={`/admin/categories/${c.id}/attributs`} className="rounded-full p-2 text-ink-muted hover:bg-gold-light/40 hover:text-gold-dark" title="Attributs"><Settings className="h-4 w-4" /></Link>
                <button onClick={() => startEdit(c)} className="rounded-full p-2 text-ink-muted hover:bg-rose-light hover:text-rose-dark" title="Modifier"><Edit className="h-4 w-4" /></button>
                <button onClick={() => toggle(c)} className={cx("rounded-full p-2", c.isActive ? "text-ink-muted hover:text-rose-dark" : "text-gold-dark hover:bg-gold-light/40")} title={c.isActive ? "Désactiver" : "Activer"}><Power className="h-4 w-4" /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
