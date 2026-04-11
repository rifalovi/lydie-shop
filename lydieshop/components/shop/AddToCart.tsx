"use client";

import { useState } from "react";
import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

export function AddToCart({ product }: { product: Product }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");

  const selectedVariant = product.variants.find((v) => v.id === variantId);
  const price = selectedVariant?.price ?? product.price;

  const handleAdd = (goToCart: boolean) => {
    add({
      productId: product.id,
      variantId: selectedVariant?.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      price,
      quantity,
      variantLabel: selectedVariant?.name,
    });
    if (goToCart) router.push("/panier");
  };

  return (
    <div className="space-y-5">
      {product.variants.length > 0 && (
        <div>
          <p className="mb-2 font-ui text-sm font-bold text-ink">
            Longueur / Couleur
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariantId(v.id)}
                className={`rounded-full border-2 px-4 py-2 text-sm font-ui font-semibold transition-all ${
                  variantId === v.id
                    ? "border-rose-dark bg-rose-light text-rose-dark"
                    : "border-borderSoft text-ink hover:border-rose-dark"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 font-ui text-sm font-bold text-ink">Quantité</p>
        <div className="inline-flex items-center rounded-full border-2 border-borderSoft bg-white">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="p-3 text-ink transition-colors hover:text-rose-dark"
            aria-label="Diminuer"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[2.5rem] text-center font-num font-bold">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="p-3 text-ink transition-colors hover:text-rose-dark"
            aria-label="Augmenter"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={() => handleAdd(false)} className="flex-1">
          <ShoppingBag className="h-4 w-4" />
          Ajouter au panier
        </Button>
        <Button
          variant="secondary"
          size="lg"
          aria-label="Ajouter aux favoris"
          className="!px-4"
        >
          <Heart className="h-5 w-5" />
        </Button>
      </div>

      <button
        onClick={() => handleAdd(true)}
        className="w-full rounded-full border-2 border-gold-dark bg-white py-3 text-sm font-ui font-semibold text-gold-dark transition-all hover:bg-gold-dark hover:text-white"
      >
        Acheter maintenant →
      </button>
    </div>
  );
}
