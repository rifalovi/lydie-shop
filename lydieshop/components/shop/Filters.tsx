"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { categories } from "@/lib/categories";

const sortOptions = [
  { value: "popularite", label: "Popularité" },
  { value: "nouveautes", label: "Nouveautés" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
  { value: "note", label: "Meilleures notes" },
];

export function Filters() {
  const router = useRouter();
  const params = useSearchParams();

  const activeCategory = params.get("categorie");
  const activeSort = params.get("tri") ?? "popularite";

  const buildHref = useMemo(
    () => (next: Record<string, string | null>) => {
      const sp = new URLSearchParams(params.toString());
      Object.entries(next).forEach(([key, value]) => {
        if (value === null) sp.delete(key);
        else sp.set(key, value);
      });
      const qs = sp.toString();
      return qs ? `/boutique?${qs}` : "/boutique";
    },
    [params],
  );

  return (
    <aside className="card-luxe sticky top-28 h-fit p-5">
      <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
        Filtrer
      </p>

      <div className="mt-4">
        <h3 className="font-ui font-bold text-ink">Catégorie</h3>
        <ul className="mt-2 space-y-1 text-sm">
          <li>
            <button
              onClick={() => router.push(buildHref({ categorie: null }))}
              className={`block w-full rounded-soft px-3 py-2 text-left transition-colors ${
                !activeCategory
                  ? "bg-rose-light font-semibold text-rose-dark"
                  : "hover:bg-cream"
              }`}
            >
              Toutes les catégories
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.slug}>
              <button
                onClick={() => router.push(buildHref({ categorie: cat.slug }))}
                className={`block w-full rounded-soft px-3 py-2 text-left transition-colors ${
                  activeCategory === cat.slug
                    ? "bg-rose-light font-semibold text-rose-dark"
                    : "hover:bg-cream"
                }`}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <h3 className="font-ui font-bold text-ink">Trier par</h3>
        <select
          value={activeSort}
          onChange={(e) => router.push(buildHref({ tri: e.target.value }))}
          className="mt-2 w-full rounded-soft border border-borderSoft bg-white px-3 py-2 text-sm focus:border-rose-dark focus:outline-none"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        <h3 className="font-ui font-bold text-ink">Longueur</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {["14\"", "16\"", "18\"", "20\"", "22\"", "24\""].map((len) => (
            <button
              key={len}
              className="rounded-full border border-borderSoft px-3 py-1 text-xs font-ui font-semibold text-ink transition-colors hover:border-rose-dark hover:bg-rose-light"
            >
              {len}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-ui font-bold text-ink">Prix</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {["0-50€", "50-150€", "150-250€", "250€+"].map((range) => (
            <button
              key={range}
              className="rounded-full border border-borderSoft px-3 py-1 text-xs font-ui font-semibold text-ink transition-colors hover:border-rose-dark hover:bg-rose-light"
            >
              {range}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
