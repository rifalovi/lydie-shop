"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  ImageDropzone,
  type UploadedImage,
} from "@/components/admin/ImageDropzone";

type CategoryOption = { slug: string; name: string };

type GeneratedContent = {
  description: string;
  shortDesc: string;
  features: string[];
  careInstructions: string;
  tags: string[];
  seoTitle: string;
  seoDesc: string;
};

export function ProductForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("perruques");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [stock, setStock] = useState("");
  const [weight, setWeight] = useState("");
  const [isFeatured, setIsFeatured] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Dynamic attributes per category
  type AttrTemplate = {
    id: string;
    name: string;
    type: string;
    unit: string | null;
    options: string[];
    isRequired: boolean;
  };
  const [attrTemplates, setAttrTemplates] = useState<AttrTemplate[]>([]);
  const [attrValues, setAttrValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!category) return;
    (async () => {
      try {
        const res = await fetch(`/api/attributes?categorySlug=${category}`);
        if (res.ok) {
          const data = (await res.json()) as { templates: AttrTemplate[] };
          setAttrTemplates(data.templates);
          // Keep existing values, init missing ones to ""
          setAttrValues((prev) => {
            const next = { ...prev };
            data.templates.forEach((t) => {
              if (!(t.id in next)) next[t.id] = "";
            });
            return next;
          });
        }
      } catch { /* keep empty */ }
    })();
  }, [category]);

  // Dynamic categories from DB
  const [categories, setCategories] = useState<CategoryOption[]>([
    { slug: "perruques", name: "Perruques" },
    { slug: "tissages", name: "Tissages" },
    { slug: "accessoires", name: "Accessoires" },
    { slug: "cadeaux", name: "Cadeaux" },
  ]);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSaving, setNewCatSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = (await res.json()) as { categories: CategoryOption[] };
          if (data.categories.length > 0) setCategories(data.categories);
        }
      } catch { /* keep defaults */ }
    })();
  }, []);

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    setNewCatSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      if (res.ok) {
        const cat = (await res.json()) as CategoryOption;
        setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
        setCategory(cat.slug);
        setNewCatName("");
        setShowNewCat(false);
      }
    } finally { setNewCatSaving(false); }
  };

  const generate = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/ai/generate-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, category, additionalInfo }),
      });
      if (res.ok) {
        const data = (await res.json()) as GeneratedContent;
        setGenerated(data);
        setStep(4);
      } else {
        const d = await res.json().catch(() => ({}));
        setGenerateError(
          d?.error ?? "Erreur lors de la génération. Vérifiez que OPENAI_API_KEY est configuré.",
        );
      }
    } catch {
      setGenerateError("Erreur réseau. Réessayez.");
    } finally {
      setGenerating(false);
    }
  };

  const goToStep = (target: 1 | 2 | 3 | 4) => {
    setStepError(null);
    if (target === 2 && images.length === 0) {
      setStepError("Ajoutez au moins une photo avant de continuer.");
      return;
    }
    if (target === 3 && !productName.trim()) {
      setStepError("Le nom du produit est requis.");
      return;
    }
    setStep(target);
  };

  const publish = async () => {
    setPublishError(null);

    if (images.length === 0) {
      setPublishError("Ajoutez au moins une image.");
      setStep(1);
      return;
    }
    if (!productName.trim()) {
      setPublishError("Le nom du produit est requis.");
      setStep(2);
      return;
    }
    const priceNumber = Number(price);
    if (!price || Number.isNaN(priceNumber) || priceNumber <= 0) {
      setPublishError("Le prix est requis et doit être positif.");
      return;
    }
    const stockNumber = Number(stock || "0");

    // Si l'IA n'a pas été invoquée, on part des infos saisies manuellement.
    const fallbackShort =
      additionalInfo.split(/\n|\. /)[0]?.slice(0, 280) || productName;
    const fallbackDesc =
      additionalInfo.trim() || `${productName} — fiche produit à compléter.`;

    const payload = {
      name: productName.trim(),
      categorySlug: category,
      shortDesc: generated?.shortDesc || fallbackShort,
      description: generated?.description || fallbackDesc,
      price: priceNumber,
      comparePrice: comparePrice ? Number(comparePrice) : null,
      stock: stockNumber,
      weight: weight ? Number(weight) : null,
      tags: generated?.tags ?? [],
      features: generated?.features ?? [],
      careInstructions: generated?.careInstructions ?? null,
      seoTitle: generated?.seoTitle ?? null,
      seoDesc: generated?.seoDesc ?? null,
      isFeatured,
      isNew: true,
      images: images.map((img) => ({ url: img.url })),
      attributes: Object.entries(attrValues)
        .filter(([, v]) => v.trim())
        .map(([templateId, value]) => ({ templateId, value })),
    };

    setPublishing(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setPublishError(
          data?.error ?? "Enregistrement impossible. Réessayez.",
        );
        return;
      }

      router.push("/admin/produits");
      router.refresh();
    } catch (err) {
      console.error(err);
      setPublishError("Erreur réseau pendant la publication.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <ol className="mb-10 flex items-center justify-between gap-2">
        {[
          { n: 1, label: "Photos" },
          { n: 2, label: "Informations" },
          { n: 3, label: "IA Description" },
          { n: 4, label: "Tarif & stock" },
        ].map((s, i) => (
          <li key={s.n} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-ui font-bold ${
                step >= s.n
                  ? "bg-gradient-royal text-white"
                  : "bg-borderSoft text-ink-muted"
              }`}
            >
              {s.n}
            </div>
            <span className="text-xs font-ui font-semibold">{s.label}</span>
            {i < 3 && <div className="h-px flex-1 bg-borderSoft" />}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className="card-luxe p-8">
          <h2 className="font-serif text-2xl">1. Photos du produit</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Ajoutez au moins 1 photo. Les images sont stockées sur Cloudinary et
            optimisées automatiquement.
          </p>
          <div className="mt-6">
            <ImageDropzone value={images} onChange={setImages} />
          </div>
          {stepError && step === 1 && (
            <p className="mt-4 rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">{stepError}</p>
          )}
          <div className="mt-8 flex justify-end">
            <Button onClick={() => goToStep(2)}>
              Suivant →
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card-luxe space-y-5 p-8">
          <h2 className="font-serif text-2xl">2. Informations de base</h2>
          <Input
            label="Nom du produit"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Perruque Majesté — Noir Naturel"
          />
          <div>
            <label className="mb-1.5 block text-sm font-ui font-semibold text-ink">
              Catégorie
            </label>
            <div className="flex gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-luxe flex-1"
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewCat(!showNewCat)}
                className="shrink-0 rounded-soft border border-borderSoft bg-white px-3 text-sm font-ui font-semibold text-rose-dark hover:bg-rose-light"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {showNewCat && (
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Nom de la catégorie"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                <Button
                  onClick={addCategory}
                  disabled={newCatSaving || !newCatName.trim()}
                >
                  {newCatSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajouter"}
                </Button>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-ui font-semibold text-ink">
              Informations supplémentaires
            </label>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={4}
              placeholder="Lace frontale 13x4, 18 pouces, 100% cheveux humains Remy..."
              className="input-luxe resize-none"
            />
          </div>

          {/* Dynamic attributes for this category */}
          {attrTemplates.length > 0 && (
            <div className="rounded-luxe border border-gold/40 bg-gradient-rose-soft p-5">
              <p className="mb-3 font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
                Caractéristiques — {categories.find((c) => c.slug === category)?.name ?? category}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {attrTemplates.map((t) => {
                  const val = attrValues[t.id] ?? "";
                  const setVal = (v: string) =>
                    setAttrValues((prev) => ({ ...prev, [t.id]: v }));

                  if (t.type === "SELECT" && t.options.length > 0) {
                    return (
                      <div key={t.id}>
                        <label className="mb-1 block text-xs font-ui font-semibold text-ink">
                          {t.name} {t.unit ? `(${t.unit})` : ""} {t.isRequired && <span className="text-rose-dark">*</span>}
                        </label>
                        <select value={val} onChange={(e) => setVal(e.target.value)} className="input-luxe text-sm">
                          <option value="">— Choisir —</option>
                          {t.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    );
                  }
                  if (t.type === "NUMBER") {
                    return (
                      <Input key={t.id} label={`${t.name}${t.unit ? ` (${t.unit})` : ""}`} type="number" value={val} onChange={(e) => setVal(e.target.value)} placeholder={t.unit ?? ""} />
                    );
                  }
                  if (t.type === "BOOLEAN") {
                    return (
                      <label key={t.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={val === "true"} onChange={(e) => setVal(e.target.checked ? "true" : "false")} className="accent-rose-dark" />
                        {t.name}
                      </label>
                    );
                  }
                  return (
                    <Input key={t.id} label={t.name} value={val} onChange={(e) => setVal(e.target.value)} />
                  );
                })}
              </div>
            </div>
          )}

          {stepError && step === 2 && (
            <p className="rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">{stepError}</p>
          )}
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => { setStepError(null); setStep(1); }}>
              ← Retour
            </Button>
            <Button onClick={() => goToStep(3)}>
              Suivant →
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card-luxe p-8">
          <h2 className="font-serif text-2xl">3. Génération par l&apos;IA</h2>
          <p className="mt-2 text-sm text-ink-muted">
            L&apos;IA rédige la fiche produit complète à partir du nom et des
            informations que vous avez saisies. Vous pourrez tout modifier ensuite.
          </p>

          <div className="mt-6 rounded-luxe bg-gradient-royal p-8 text-white">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6" />
              <h3 className="font-serif text-2xl">
                Génération intelligente
              </h3>
            </div>
            <ul className="mt-4 space-y-1 text-sm text-white/90">
              <li>• Description longue et vendeuse (200-300 mots)</li>
              <li>• Accroche courte</li>
              <li>• Liste de caractéristiques</li>
              <li>• Instructions d&apos;entretien</li>
              <li>• Tags SEO et meta description</li>
            </ul>
          </div>

          {/* Bouton HORS du bloc violet pour le rendre plus visible */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={generate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Générer avec l&apos;IA
                </>
              )}
            </Button>
            {generateError && (
              <p className="rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">{generateError}</p>
            )}
            {generated && (
              <p className="rounded-soft bg-gold-light/40 px-3 py-2 text-sm text-gold-dark">
                Contenu généré avec succès — vous pouvez le voir à l&apos;étape suivante.
              </p>
            )}
          </div>

          <div className="mt-8 flex justify-between">
            <Button variant="secondary" onClick={() => { setStepError(null); setStep(2); }}>
              ← Retour
            </Button>
            <Button variant="secondary" onClick={() => setStep(4)}>
              {generated ? "Voir & publier →" : "Passer (remplir manuellement) →"}
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card-luxe space-y-6 p-8">
          <h2 className="font-serif text-2xl">4. Tarif & finalisation</h2>

          {generated && (
            <div className="rounded-luxe border border-gold/40 bg-gradient-rose-soft p-5">
              <div className="flex items-center gap-2 text-gold-dark">
                <Sparkles className="h-4 w-4" />
                <p className="font-ui text-xs font-bold uppercase tracking-widest">
                  Contenu généré par l&apos;IA — modifiable
                </p>
              </div>
              <p className="mt-3 font-serif text-lg italic">
                {generated.shortDesc}
              </p>
              <p className="mt-2 text-sm text-ink">{generated.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {generated.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-white px-2 py-1 text-[10px] font-ui font-semibold text-rose-dark"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Prix (€)"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="249.00"
            />
            <Input
              label="Prix barré (€)"
              type="number"
              step="0.01"
              value={comparePrice}
              onChange={(e) => setComparePrice(e.target.value)}
              placeholder="299.00"
            />
            <Input
              label="Stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="12"
            />
            <Input
              label="Poids (g)"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="450"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-soft bg-gradient-rose-soft p-4">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 accent-rose-dark"
            />
            <div>
              <p className="font-ui text-sm font-bold">Produit vedette</p>
              <p className="text-xs text-ink-muted">
                Apparaît dans les bestsellers de la page d&apos;accueil.
              </p>
            </div>
          </label>

          {publishError && (
            <p className="rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">
              {publishError}
            </p>
          )}

          <div className="flex justify-between">
            <Button
              variant="secondary"
              onClick={() => setStep(3)}
              disabled={publishing}
            >
              ← Retour
            </Button>
            <Button size="lg" onClick={publish} disabled={publishing}>
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publication...
                </>
              ) : (
                "Publier le produit"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
