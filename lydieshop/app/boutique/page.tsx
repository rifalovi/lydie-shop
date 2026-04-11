import { products } from "@/lib/products";
import { categories, getCategoryBySlug } from "@/lib/categories";
import { ProductCard } from "@/components/shop/ProductCard";
import { Filters } from "@/components/shop/Filters";
import type { Product } from "@/lib/types";

type SearchParams = {
  categorie?: string;
  tri?: string;
};

function applyFilters(list: Product[], params: SearchParams) {
  let result = [...list];
  if (params.categorie) {
    result = result.filter((p) => p.categorySlug === params.categorie);
  }
  switch (params.tri) {
    case "prix-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "prix-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "nouveautes":
      result.sort((a, b) => Number(b.isNew ?? 0) - Number(a.isNew ?? 0));
      break;
    case "note":
      result.sort((a, b) => b.rating - a.rating);
      break;
    default:
      result.sort((a, b) => b.reviewCount - a.reviewCount);
  }
  return result;
}

export default function BoutiquePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filtered = applyFilters(products, searchParams);
  const currentCategory = searchParams.categorie
    ? getCategoryBySlug(searchParams.categorie)
    : null;

  return (
    <div className="bg-cream">
      <div className="border-b border-borderSoft bg-gradient-rose-soft">
        <div className="container-page py-14">
          <nav className="mb-4 text-xs text-ink-muted">
            <a href="/" className="hover:text-rose-dark">
              Accueil
            </a>{" "}
            / <span className="text-ink">Boutique</span>
            {currentCategory && (
              <>
                {" "}
                / <span className="text-ink">{currentCategory.name}</span>
              </>
            )}
          </nav>
          <h1 className="font-serif text-4xl md:text-5xl">
            {currentCategory ? (
              <>
                {currentCategory.name}{" "}
                <span className="font-script title-gold">— notre sélection</span>
              </>
            ) : (
              <>
                La{" "}
                <span className="font-script title-gold">boutique</span> des
                Reines
              </>
            )}
          </h1>
          <p className="mt-3 max-w-2xl text-ink-muted">
            {currentCategory
              ? currentCategory.description
              : "Explorez l'ensemble de nos perruques, tissages et accessoires — tous sélectionnés avec le même soin maniaque."}
          </p>
        </div>
      </div>

      <div className="container-page grid gap-8 py-12 lg:grid-cols-[280px_1fr]">
        <Filters />

        <div>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-ink-muted">
              <span className="font-bold text-ink">{filtered.length}</span>{" "}
              produit{filtered.length > 1 ? "s" : ""}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="card-luxe p-12 text-center">
              <p className="font-serif text-xl">
                Aucun produit ne correspond à vos critères
              </p>
              <p className="mt-2 text-ink-muted">
                Essayez de retirer certains filtres.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
