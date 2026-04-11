"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  ImageDropzone,
  type UploadedImage,
} from "@/components/admin/ImageDropzone";

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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("perruques");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);

  const generate = async () => {
    setGenerating(true);
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
      }
    } finally {
      setGenerating(false);
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
          <div className="mt-8 flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={images.length === 0}
            >
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
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-luxe"
            >
              <option value="perruques">Perruques</option>
              <option value="tissages">Tissages</option>
              <option value="accessoires">Accessoires</option>
              <option value="cadeaux">Cadeaux</option>
            </select>
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
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>
              ← Retour
            </Button>
            <Button onClick={() => setStep(3)} disabled={!productName}>
              Suivant →
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card-luxe p-8">
          <h2 className="font-serif text-2xl">3. Génération par l&apos;IA</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Notre IA va rédiger une fiche produit complète, attractive et
            optimisée SEO. Vous pourrez tout modifier à l&apos;étape suivante.
          </p>

          <div className="mt-6 rounded-luxe bg-gradient-royal p-8 text-white">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6" />
              <h3 className="font-serif text-2xl">
                Génération intelligente
              </h3>
            </div>
            <ul className="mt-4 space-y-1 text-sm text-white/90">
              <li>• Description longue et vendeuse</li>
              <li>• Accroche courte</li>
              <li>• Liste de caractéristiques</li>
              <li>• Instructions d&apos;entretien</li>
              <li>• Tags SEO et meta description</li>
            </ul>
            <Button
              className="mt-6 bg-white !text-rose-dark hover:!bg-cream"
              onClick={generate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Générer avec l&apos;IA
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(2)}>
              ← Retour
            </Button>
            <button
              onClick={() => setStep(4)}
              className="text-sm text-ink-muted hover:underline"
            >
              Passer (remplir manuellement)
            </button>
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
              placeholder="299.00"
            />
            <Input
              label="Stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="12"
            />
            <Input label="Poids (g)" type="number" placeholder="450" />
          </div>

          <div className="flex items-center gap-3 rounded-soft bg-gradient-rose-soft p-4">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 accent-rose-dark"
            />
            <div>
              <p className="font-ui text-sm font-bold">Produit vedette</p>
              <p className="text-xs text-ink-muted">
                Apparaît dans les bestsellers de la page d&apos;accueil.
              </p>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(3)}>
              ← Retour
            </Button>
            <Button size="lg">Publier le produit</Button>
          </div>
        </div>
      )}
    </div>
  );
}
