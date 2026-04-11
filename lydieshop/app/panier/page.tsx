"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, Tag } from "lucide-react";
import { useState } from "react";
import { useCart, SHIPPING, computeShipping } from "@/lib/cart";
import { formatEUR } from "@/lib/format";
import { Button } from "@/components/ui/Button";

export default function CartPage() {
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const subtotalFn = useCart((s) => s.subtotal);
  const subtotal = subtotalFn();

  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState<{
    code: string;
    amount: number;
  } | null>(null);

  const shipping = computeShipping(subtotal);
  const discount = promoApplied?.amount ?? 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const applyPromo = () => {
    if (promo.toUpperCase() === "REINE10") {
      setPromoApplied({ code: "REINE10", amount: subtotal * 0.1 });
    } else if (promo.toUpperCase() === "BIENVENUE") {
      setPromoApplied({ code: "BIENVENUE", amount: 10 });
    }
  };

  if (lines.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-rose-dark" />
        <h1 className="mt-6 font-serif text-4xl">Votre panier est vide</h1>
        <p className="mt-3 text-ink-muted">
          Mais ça ne saurait tarder — nous avons de quoi ravir votre couronne.
        </p>
        <div className="mt-8">
          <Link href="/boutique">
            <Button size="lg">Découvrir la boutique</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <h1 className="font-serif text-4xl md:text-5xl">
        Votre <span className="font-script title-gold">panier</span>
      </h1>
      <p className="mt-2 text-ink-muted">
        {lines.length} article{lines.length > 1 ? "s" : ""} — on s&apos;occupe
        de vous.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {lines.map((line) => (
            <article
              key={`${line.productId}-${line.variantId ?? "default"}`}
              className="card-luxe flex gap-4 p-4"
            >
              <Link
                href={`/produit/${line.slug}`}
                className="h-28 w-24 shrink-0 overflow-hidden rounded-soft bg-rose-light"
              >
                <img
                  src={line.image}
                  alt={line.name}
                  className="h-full w-full object-cover"
                />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/produit/${line.slug}`}
                      className="font-serif text-lg font-semibold text-ink hover:text-rose-dark"
                    >
                      {line.name}
                    </Link>
                    {line.variantLabel && (
                      <p className="text-xs text-ink-muted">
                        {line.variantLabel}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => remove(line.productId, line.variantId)}
                    className="rounded-full p-2 text-ink-muted transition-colors hover:bg-rose-light hover:text-rose-dark"
                    aria-label="Retirer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-auto flex items-end justify-between">
                  <div className="inline-flex items-center rounded-full border border-borderSoft bg-white">
                    <button
                      onClick={() =>
                        setQuantity(
                          line.productId,
                          line.quantity - 1,
                          line.variantId,
                        )
                      }
                      className="p-2 text-ink transition-colors hover:text-rose-dark"
                      aria-label="Diminuer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-[2rem] text-center font-num font-bold">
                      {line.quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(
                          line.productId,
                          line.quantity + 1,
                          line.variantId,
                        )
                      }
                      className="p-2 text-ink transition-colors hover:text-rose-dark"
                      aria-label="Augmenter"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="font-num text-lg font-bold">
                    {formatEUR(line.price * line.quantity)}
                  </p>
                </div>
              </div>
            </article>
          ))}

          <Link
            href="/boutique"
            className="inline-block text-sm font-ui font-semibold text-rose-dark hover:underline"
          >
            ← Continuer mes achats
          </Link>
        </div>

        <aside className="card-luxe h-fit p-6">
          <h2 className="font-serif text-2xl">Résumé</h2>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Sous-total</dt>
              <dd className="font-num font-semibold">{formatEUR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Livraison</dt>
              <dd className="font-num font-semibold">
                {shipping === 0 ? "Offerte" : formatEUR(shipping)}
              </dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-rose-dark">
                <dt>Code {promoApplied?.code}</dt>
                <dd className="font-num font-semibold">
                  -{formatEUR(discount)}
                </dd>
              </div>
            )}
            {subtotal < SHIPPING.FREE_THRESHOLD && (
              <div className="rounded-soft bg-gradient-rose-soft p-3 text-xs text-ink">
                Plus que{" "}
                <span className="font-bold">
                  {formatEUR(SHIPPING.FREE_THRESHOLD - subtotal)}
                </span>{" "}
                pour la livraison offerte ✨
              </div>
            )}
          </dl>

          <div className="mt-5">
            <label className="flex items-center gap-2 text-sm font-ui font-semibold text-ink">
              <Tag className="h-4 w-4" /> Code promo
            </label>
            <div className="mt-2 flex gap-2">
              <input
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder="REINE10"
                className="input-luxe flex-1"
              />
              <Button variant="secondary" onClick={applyPromo}>
                Appliquer
              </Button>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Essayez <code className="font-ui font-bold">REINE10</code> ou{" "}
              <code className="font-ui font-bold">BIENVENUE</code>
            </p>
          </div>

          <div className="my-5 h-px bg-borderSoft" />

          <div className="flex items-baseline justify-between">
            <p className="font-ui font-bold text-ink">Total</p>
            <p className="font-num text-2xl font-bold">{formatEUR(total)}</p>
          </div>

          <Link href="/checkout">
            <Button className="mt-5 w-full" size="lg">
              Passer au paiement
            </Button>
          </Link>

          <p className="mt-3 text-center text-xs text-ink-muted">
            Paiement sécurisé par Stripe · Cryptage SSL
          </p>
        </aside>
      </div>
    </div>
  );
}
