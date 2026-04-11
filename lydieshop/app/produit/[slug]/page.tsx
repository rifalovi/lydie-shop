import { notFound } from "next/navigation";
import Link from "next/link";
import { Truck, RefreshCcw, ShieldCheck, Share2 } from "lucide-react";
import {
  getProductBySlug,
  getRelatedProducts,
  getApprovedReviewsForProduct,
} from "@/lib/data/products";
import { formatEUR } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { AddToCart } from "@/components/shop/AddToCart";
import { ProductCard } from "@/components/shop/ProductCard";
import { ReviewList } from "@/components/shop/ReviewList";
import { ReviewForm } from "@/components/shop/ReviewForm";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const [related, reviews] = await Promise.all([
    getRelatedProducts(product.id),
    getApprovedReviewsForProduct(product.id),
  ]);
  const hasSale = product.comparePrice && product.comparePrice > product.price;

  return (
    <div className="bg-cream">
      <div className="container-page pt-10">
        <nav className="text-xs text-ink-muted">
          <Link href="/" className="hover:text-rose-dark">
            Accueil
          </Link>{" "}
          /{" "}
          <Link href="/boutique" className="hover:text-rose-dark">
            Boutique
          </Link>{" "}
          /{" "}
          <Link
            href={`/boutique?categorie=${product.categorySlug}`}
            className="hover:text-rose-dark capitalize"
          >
            {product.categorySlug}
          </Link>{" "}
          / <span className="text-ink">{product.name}</span>
        </nav>
      </div>

      <div className="container-page grid gap-12 py-10 lg:grid-cols-2">
        <ProductGallery images={product.images} alt={product.name} />

        <div>
          <div className="flex flex-wrap gap-2">
            {product.isNew && <Badge variant="new">Nouveau</Badge>}
            {product.tags.includes("bestseller") && (
              <Badge variant="bestseller">Bestseller</Badge>
            )}
          </div>

          <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <StarRating
              value={product.rating}
              showValue
              reviewCount={product.reviewCount}
            />
            <span className="text-xs text-ink-muted">
              · {product.stock > 0 ? "En stock" : "Épuisé"}
            </span>
          </div>

          <p className="mt-4 font-serif text-lg italic text-ink-muted">
            {product.shortDesc}
          </p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-num text-4xl font-bold text-ink">
              {formatEUR(product.price)}
            </span>
            {hasSale && (
              <>
                <span className="font-num text-xl text-ink-muted line-through">
                  {formatEUR(product.comparePrice!)}
                </span>
                <Badge variant="sale">
                  -
                  {Math.round(
                    ((product.comparePrice! - product.price) /
                      product.comparePrice!) *
                      100,
                  )}
                  %
                </Badge>
              </>
            )}
          </div>

          {product.stock <= 5 && product.stock > 0 && (
            <p className="mt-2 inline-block rounded-full bg-gold-light/40 px-3 py-1 text-xs font-ui font-semibold text-gold-dark">
              Plus que {product.stock} en stock !
            </p>
          )}

          <div className="mt-8">
            <AddToCart product={product} />
          </div>

          <div className="mt-8 grid gap-3 rounded-luxe border border-borderSoft bg-white p-5 text-sm">
            <div className="flex items-center gap-3">
              <Truck className="h-4 w-4 text-gold-dark" />
              Livraison offerte dès 60€ — expédition sous 24h
            </div>
            <div className="flex items-center gap-3">
              <RefreshCcw className="h-4 w-4 text-gold-dark" />
              Retours gratuits sous 14 jours
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-gold-dark" />
              Paiement 100% sécurisé (Stripe)
            </div>
          </div>

          <button className="mt-6 inline-flex items-center gap-2 text-sm text-ink-muted hover:text-rose-dark">
            <Share2 className="h-4 w-4" /> Partager ce produit
          </button>
        </div>
      </div>

      {/* Description + features */}
      <div className="container-page grid gap-10 py-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-serif text-2xl">Description</h2>
          <p className="mt-3 whitespace-pre-line text-ink-muted leading-relaxed">
            {product.description}
          </p>

          <h3 className="mt-8 font-serif text-xl">Entretien</h3>
          <p className="mt-2 text-ink-muted">{product.careInstructions}</p>
        </div>

        <div className="card-luxe h-fit p-6">
          <h3 className="font-serif text-xl">Caractéristiques</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {product.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Avis clients */}
      <section className="container-page py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl">
                Avis des{" "}
                <span className="font-script title-gold">Reines</span>
              </h2>
              {product.reviewCount > 0 && (
                <StarRating
                  value={product.rating}
                  showValue
                  reviewCount={product.reviewCount}
                />
              )}
            </div>
            <div className="mt-5">
              <ReviewList reviews={reviews} />
            </div>
          </div>
          <div>
            <ReviewForm productId={product.id} />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-white py-16">
          <div className="container-page">
            <h2 className="mb-8 font-serif text-3xl">
              Vous aimerez{" "}
              <span className="font-script title-gold">aussi</span>
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
