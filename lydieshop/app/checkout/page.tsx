"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, CreditCard, Truck, User } from "lucide-react";
import { useCart, computeShipping } from "@/lib/cart";
import { useRewardStore } from "@/lib/reward-store";
import { formatEUR, cx } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Step = 1 | 2 | 3;
type ShippingMethod = "COLISSIMO" | "MONDIAL_RELAY" | "CHRONOPOST";

type AddressFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
};

export default function CheckoutPage() {
  const lines = useCart((s) => s.lines);
  const subtotal = useCart((s) => s.subtotal());
  const reward = useRewardStore((s) => s.reward);

  const [step, setStep] = useState<Step>(1);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>(
    "COLISSIMO",
  );
  const [address, setAddress] = useState<AddressFields>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    postalCode: "",
    city: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping = computeShipping(subtotal, shippingMethod);
  const rewardAmount = reward
    ? Math.min(reward.discount, subtotal)
    : 0;
  const total = Math.max(0, subtotal + shipping - rewardAmount);

  const steps = [
    { n: 1 as Step, label: "Informations", icon: User },
    { n: 2 as Step, label: "Livraison", icon: Truck },
    { n: 3 as Step, label: "Paiement", icon: CreditCard },
  ];

  const updateAddress = (field: keyof AddressFields, value: string) =>
    setAddress((a) => ({ ...a, [field]: value }));

  const goToPayment = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId ?? null,
            quantity: l.quantity,
          })),
          shippingMethod,
          address: { ...address, country: "FR" },
          reward: reward ?? null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.url) {
        setLoading(false);
        setError(
          data?.error ??
            "Impossible de démarrer le paiement. Réessayez dans un instant.",
        );
        return;
      }

      // Redirection vers Stripe Checkout. Ne pas vider le panier ici :
      // l'utilisateur peut annuler. Le panier sera vidé sur la page de
      // confirmation après paiement réussi.
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    }
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
        <div className="space-y-6">
          {step === 1 && (
            <div className="card-luxe p-6">
              <h2 className="font-serif text-2xl">Vos informations</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Input
                  label="Prénom"
                  name="firstName"
                  required
                  value={address.firstName}
                  onChange={(e) => updateAddress("firstName", e.target.value)}
                />
                <Input
                  label="Nom"
                  name="lastName"
                  required
                  value={address.lastName}
                  onChange={(e) => updateAddress("lastName", e.target.value)}
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  required
                  className="sm:col-span-2"
                  value={address.email}
                  onChange={(e) => updateAddress("email", e.target.value)}
                />
                <Input
                  label="Téléphone"
                  name="phone"
                  type="tel"
                  value={address.phone}
                  onChange={(e) => updateAddress("phone", e.target.value)}
                />
                <Input
                  label="Adresse"
                  name="street"
                  required
                  className="sm:col-span-2"
                  value={address.street}
                  onChange={(e) => updateAddress("street", e.target.value)}
                />
                <Input
                  label="Code postal"
                  name="postalCode"
                  required
                  value={address.postalCode}
                  onChange={(e) => updateAddress("postalCode", e.target.value)}
                />
                <Input
                  label="Ville"
                  name="city"
                  required
                  value={address.city}
                  onChange={(e) => updateAddress("city", e.target.value)}
                />
              </div>
              <Button
                type="button"
                className="mt-6 w-full"
                onClick={() => setStep(2)}
                size="lg"
                disabled={
                  !address.firstName ||
                  !address.lastName ||
                  !address.email ||
                  !address.street ||
                  !address.postalCode ||
                  !address.city
                }
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
                  Continuer
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card-luxe p-6">
              <h2 className="font-serif text-2xl">Paiement sécurisé</h2>
              <p className="mt-2 text-sm text-ink-muted">
                Vous allez être redirigée vers la page de paiement sécurisée
                Stripe. Vos données bancaires ne transitent jamais par nos
                serveurs.
              </p>

              <div className="mt-6 rounded-luxe border border-borderSoft bg-rose-light/40 p-5 text-sm">
                <p className="font-ui font-bold text-ink">
                  Récapitulatif de livraison
                </p>
                <p className="mt-2 text-ink-muted">
                  {address.firstName} {address.lastName}
                  <br />
                  {address.street}
                  <br />
                  {address.postalCode} {address.city}
                  <br />
                  {address.email}
                </p>
              </div>

              {error && (
                <p className="mt-4 rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">
                  {error}
                </p>
              )}

              <div className="mt-6 flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(2)}
                  className="flex-1"
                  disabled={loading}
                >
                  Retour
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={goToPayment}
                  disabled={loading}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {loading
                    ? "Redirection..."
                    : `Payer ${formatEUR(total)}`}
                </Button>
              </div>
            </div>
          )}
        </div>

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
            {rewardAmount > 0 && reward && (
              <div className="flex justify-between text-gold-dark">
                <dt>Points Couronne ({reward.points} pts)</dt>
                <dd className="font-num">-{formatEUR(rewardAmount)}</dd>
              </div>
            )}
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
