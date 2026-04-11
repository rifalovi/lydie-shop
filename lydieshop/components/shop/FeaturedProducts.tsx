import Link from "next/link";
import { getFeaturedProducts } from "@/lib/products";
import { ProductCard } from "./ProductCard";
import { Button } from "@/components/ui/Button";

export function FeaturedProducts() {
  const products = getFeaturedProducts().slice(0, 6);
  return (
    <section className="bg-white py-20">
      <div className="container-page">
        <div className="mb-10 flex flex-col items-center text-center">
          <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
            Les incontournables
          </p>
          <h2 className="mt-2 font-serif text-4xl md:text-5xl">
            Nos <span className="title-gold font-script">bestsellers</span>
          </h2>
          <p className="mt-3 max-w-2xl text-ink-muted">
            Les coups de cœur de nos Reines — sélectionnés avec amour,
            confectionnés avec exigence.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link href="/boutique">
            <Button variant="secondary" size="lg">
              Voir toute la boutique
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
