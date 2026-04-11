"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Truck, User } from "lucide-react";
import { useCart, computeShipping } from "@/lib/cart";
import { formatEUR } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cx } from "@/lib/format";

type Step = 1 | 2 | 3;

export default function CheckoutPage() {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clear);

  const [step, setStep] = useState<Step>(1);
  const [shippingMethod, setShippingMethod] = useState<
    "COLISSIMO" | "MONDIAL_RELAY" | "CHRONOPOST"
  >("COLISSIMO");

  const shipping = computeShipping(subtotal, shippingMethod);
  const total = subtotal + shipping;

  const steps = [
    { n: 1 as Step, label: "Informations", icon: User },
    { n: 2 as Step, label: "Livraison", icon: Truck },
    { n: 3 as Step, label: "Paiement", icon: CreditCard },
  ];

  const placeOrder = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: remplacer par un appel à Stripe Checkout / Payment Intents
    clear();
    router.push("/checkout/confirmation?orderNumber=LYD-2026-0042");
  };

  if (lines.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-serif text-3xl">Votre panier est vide</h1>
        <Link href="/boutique" className="mt-6 inline-block">
          <Button>Retour à la boutique</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <nav className="mb-10 flex items-center justify-center gap-4">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const active = step >= s.n;
          return (
            <div key={s.n} className="flex items-center gap-4">
              <div
                className={cx(
                  "flex items-center gap-2 rounded-full border-2 px-4 py-2 transition-colors",
                  active
                    ? "border-rose-dark bg-rose-light text-rose-dark"
                    : "border-borderSoft text-ink-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="font-ui text-sm font-semibold">
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cx(
                    "h-px w-8 transition-colors",
                    step > s.n ? "bg-rose-dark" : "bg-borderSoft",
                  )}
                />
              )}
            </div>
          );
        })}
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <form onSubmit={placeOrder} className="space-y-6">
          {step === 1 && (
            <div className="card-luxe p-6">
              <h2 className="font-serif text-2xl">Vos informations</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Input label="Prénom" name="firstName" required />
                <Input label="Nom" name="lastName" required />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  required
                  className="sm:col-span-2"
                />
                <Input label="Téléphone" name="phone" type="tel" />
                <Input
                  label="Adresse"
                  name="street"
                  required
                  className="sm:col-span-2"
                />
                <Input label="Code postal" name="postalCode" required />
                <Input label="Ville" name="city" required />
              </div>
              <Button
                type="button"
                className="mt-6 w-full"
                onClick={() => setStep(2)}
                size="lg"
              >
                Continuer vers la livraison
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="card-luxe p-6">
              <h2 className="font-serif text-2xl">Mode de livraison</h2>
              <div className="mt-5 space-y-3">
                {(
                  [
                    {
                      id: "COLISSIMO",
                      label: "Colissimo",
                      price: 5.9,
                      delay: "2-3 jours ouvrés",
                    },
                    {
                      id: "MONDIAL_RELAY",
                      label: "Mondial Relay",
                      price: 3.9,
                      delay: "3-5 jours ouvrés",
                    },
                    {
                      id: "CHRONOPOST",
                      label: "Chronopost express",
                      price: 12.9,
                      delay: "24h",
                    },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.id}
                    className={cx(
                      "flex cursor-pointer items-center gap-4 rounded-luxe border-2 p-4 transition-all",
                      shippingMethod === opt.id
                        ? "border-rose-dark bg-rose-light"
                        : "border-borderSoft hover:border-rose",
                    )}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === opt.id}
                      onChange={() => setShippingMethod(opt.id)}
                      className="h-4 w-4 accent-rose-dark"
                    />
                    <div className="flex-1">
                      <p className="font-ui font-bold text-ink">{opt.label}</p>
                      <p className="text-xs text-ink-muted">{opt.delay}</p>
                    </div>
                    <p className="font-num font-bold text-ink">
                      {subtotal >= 60 ? "Offert" : formatEUR(opt.price)}
                    </p>
                  </label>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1"
                >
                  Paiement
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card-luxe p-6">
              <h2 className="font-serif text-2xl">Paiement sécurisé</h2>
              <p className="mt-2 text-sm text-ink-muted">
                Vos données bancaires sont chiffrées par Stripe — jamais stockées
                sur nos serveurs.
              </p>
              <div className="mt-5 grid gap-4">
                <Input
                  label="Numéro de carte"
                  name="cardNumber"
                  placeholder="4242 4242 4242 4242"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Expiration"
                    name="expiry"
                    placeholder="12/27"
                  />
                  <Input label="CVC" name="cvc" placeholder="123" />
                </div>
                <Input
                  label="Nom sur la carte"
                  name="cardName"
                  placeholder="Marie Reine"
                />
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button type="submit" className="flex-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Payer {formatEUR(total)}
                </Button>
              </div>
            </div>
          )}
        </form>

        <aside className="card-luxe h-fit p-6">
          <h2 className="font-serif text-xl">Votre commande</h2>
          <ul className="mt-4 space-y-3">
            {lines.map((l) => (
              <li
                key={`${l.productId}-${l.variantId ?? "d"}`}
                className="flex gap-3"
              >
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-soft bg-rose-light">
                  <img
                    src={l.image}
                    alt={l.name}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-gold text-[10px] font-bold text-white">
                    {l.quantity}
                  </span>
                </div>
                <div className="flex flex-1 flex-col">
                  <p className="text-sm font-semibold leading-tight">
                    {l.name}
                  </p>
                  {l.variantLabel && (
                    <p className="text-xs text-ink-muted">{l.variantLabel}</p>
                  )}
                  <p className="mt-auto font-num text-sm font-bold">
                    {formatEUR(l.price * l.quantity)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="my-5 h-px bg-borderSoft" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Sous-total</dt>
              <dd className="font-num">{formatEUR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Livraison</dt>
              <dd className="font-num">
                {shipping === 0 ? "Offerte" : formatEUR(shipping)}
              </dd>
            </div>
          </dl>
          <div className="my-4 h-px bg-borderSoft" />
          <div className="flex justify-between">
            <p className="font-ui font-bold">Total</p>
            <p className="font-num text-2xl font-bold">{formatEUR(total)}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
