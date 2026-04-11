import { listProducts } from "@/lib/data/products";
import { getCategoryBySlug } from "@/lib/categories";
import { ProductCard } from "@/components/shop/ProductCard";
import { Filters } from "@/components/shop/Filters";

type SearchParams = {
  categorie?: string;
  tri?: string;
};

const VALID_SORTS = [
  "popularite",
  "nouveautes",
  "prix-asc",
  "prix-desc",
  "note",
] as const;

export const dynamic = "force-dynamic";

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sort = (VALID_SORTS as readonly string[]).includes(searchParams.tri ?? "")
    ? (searchParams.tri as (typeof VALID_SORTS)[number])
    : undefined;

  const products = await listProducts({
    categorySlug: searchParams.categorie,
    sort,
  });

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
              <span className="font-bold text-ink">{products.length}</span>{" "}
              produit{products.length > 1 ? "s" : ""}
            </p>
          </div>

          {products.length === 0 ? (
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
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
