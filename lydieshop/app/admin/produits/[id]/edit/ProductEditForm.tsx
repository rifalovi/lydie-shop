"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  ImageDropzone,
  type UploadedImage,
} from "@/components/admin/ImageDropzone";

type InitialData = {
  name: string;
  shortDesc: string;
  description: string;
  categorySlug: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  weight: number | null;
  tags: string[];
  features: string[];
  careInstructions: string | null;
  seoTitle: string | null;
  seoDesc: string | null;
  isFeatured: boolean;
  isNew: boolean;
  isActive: boolean;
  images: UploadedImage[];
};

type CategoryOption = { slug: string; name: string };

export function ProductEditForm({
  productId,
  initial,
  categories,
}: {
  productId: string;
  initial: InitialData;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [shortDesc, setShortDesc] = useState(initial.shortDesc);
  const [description, setDescription] = useState(initial.description);
  const [categorySlug, setCategorySlug] = useState(initial.categorySlug);
  const [price, setPrice] = useState(String(initial.price));
  const [comparePrice, setComparePrice] = useState(
    initial.comparePrice ? String(initial.comparePrice) : "",
  );
  const [stock, setStock] = useState(String(initial.stock));
  const [weight, setWeight] = useState(
    initial.weight ? String(initial.weight) : "",
  );
  const [tags, setTags] = useState(initial.tags.join(", "));
  const [features, setFeatures] = useState(initial.features.join("\n"));
  const [careInstructions, setCareInstructions] = useState(
    initial.careInstructions ?? "",
  );
  const [isFeatured, setIsFeatured] = useState(initial.isFeatured);
  const [isActive, setIsActive] = useState(initial.isActive);
  const [images, setImages] = useState<UploadedImage[]>(initial.images);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const save = async () => {
    setError(null);
    setSuccess(false);
    setSaving(true);

    const payload = {
      name: name.trim(),
      shortDesc: shortDesc.trim(),
      description: description.trim(),
      categorySlug,
      price: Number(price),
      comparePrice: comparePrice ? Number(comparePrice) : null,
      stock: Number(stock),
      weight: weight ? Number(weight) : null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      features: features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      careInstructions: careInstructions.trim() || null,
      isFeatured,
      isActive,
      images: images.map((i) => ({ url: i.url })),
    };

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Mise à jour impossible.");
        return;
      }
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        href="/admin/produits"
        className="inline-flex items-center gap-2 text-sm font-ui font-semibold text-rose-dark hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au catalogue
      </Link>

      {/* Photos */}
      <section className="card-luxe p-6">
        <h2 className="font-serif text-xl">Photos</h2>
        <div className="mt-4">
          <ImageDropzone value={images} onChange={setImages} />
        </div>
      </section>

      {/* Informations */}
      <section className="card-luxe space-y-4 p-6">
        <h2 className="font-serif text-xl">Informations</h2>
        <Input
          label="Nom du produit"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div>
          <label className="mb-1.5 block text-sm font-ui font-semibold text-ink">
            Catégorie
          </label>
          <select
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="input-luxe"
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Accroche courte"
          value={shortDesc}
          onChange={(e) => setShortDesc(e.target.value)}
        />
        <div>
          <label className="mb-1.5 block text-sm font-ui font-semibold text-ink">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="input-luxe resize-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-ui font-semibold text-ink">
            Caractéristiques (une par ligne)
          </label>
          <textarea
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            rows={4}
            className="input-luxe resize-none"
            placeholder="100% cheveux humains Remy&#10;Lace HD 13x4"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-ui font-semibold text-ink">
            Entretien
          </label>
          <textarea
            value={careInstructions}
            onChange={(e) => setCareInstructions(e.target.value)}
            rows={3}
            className="input-luxe resize-none"
          />
        </div>
        <Input
          label="Tags (séparés par des virgules)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="bestseller, lace-frontal, naturel"
        />
      </section>

      {/* Tarif & stock */}
      <section className="card-luxe space-y-4 p-6">
        <h2 className="font-serif text-xl">Tarif &amp; stock</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Prix (€)"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Input
            label="Prix barré (€)"
            type="number"
            step="0.01"
            value={comparePrice}
            onChange={(e) => setComparePrice(e.target.value)}
          />
          <Input
            label="Stock"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
          <Input
            label="Poids (g)"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="accent-rose-dark"
            />
            Produit vedette
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-rose-dark"
            />
            Actif (visible en boutique)
          </label>
        </div>
      </section>

      {error && (
        <p className="rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-soft bg-gold-light/40 px-3 py-2 text-sm text-gold-dark">
          Produit mis à jour.
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Link href="/admin/produits">
          <Button variant="secondary">Annuler</Button>
        </Link>
        <Button size="lg" onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Mettre à jour
        </Button>
      </div>
    </div>
  );
}
