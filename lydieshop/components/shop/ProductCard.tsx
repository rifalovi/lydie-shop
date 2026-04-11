"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatEUR } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { WishlistButton } from "@/components/shop/WishlistButton";

export function ProductCard({ product }: { product: Product }) {
  const hasSale = product.comparePrice && product.comparePrice > product.price;
  const savings = hasSale
    ? Math.round(
        ((product.comparePrice! - product.price) / product.comparePrice!) * 100,
      )
    : 0;

  return (
    <article className="card-luxe group relative flex flex-col overflow-hidden">
      <Link href={`/produit/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-rose-light">
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.isNew && <Badge variant="new">Nouveau</Badge>}
            {product.tags.includes("bestseller") && (
              <Badge variant="bestseller">Bestseller</Badge>
            )}
            {hasSale && <Badge variant="sale">-{savings}%</Badge>}
          </div>
          <div className="absolute right-3 top-3">
            <WishlistButton productId={product.id} />
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/produit/${product.slug}`}>
          <h3 className="font-serif text-lg font-semibold leading-tight text-ink transition-colors hover:text-rose-dark">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
          {product.shortDesc}
        </p>

        <div className="mt-2">
          <StarRating
            value={product.rating}
            reviewCount={product.reviewCount}
          />
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-num text-xl font-bold text-ink">
              {formatEUR(product.price)}
            </span>
            {hasSale && (
              <span className="font-num text-sm text-ink-muted line-through">
                {formatEUR(product.comparePrice!)}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
