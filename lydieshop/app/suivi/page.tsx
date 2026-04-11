"use client";

import { useState } from "react";
import { Package, Check, Truck, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cx } from "@/lib/format";

const stages = [
  { id: "PENDING", label: "Commandée", icon: Package },
  { id: "CONFIRMED", label: "Confirmée", icon: Check },
  { id: "PROCESSING", label: "En préparation", icon: Package },
  { id: "SHIPPED", label: "Expédiée", icon: Truck },
  { id: "DELIVERED", label: "Livrée", icon: Home },
] as const;

export default function TrackingPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [tracking, setTracking] = useState<{
    current: number;
    order: string;
    carrier: string;
    eta: string;
  } | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock tracking — en production, interroger /api/orders/[id]
    setTracking({
      current: 3,
      order: orderNumber || "LYD-2026-0042",
      carrier: "Colissimo",
      eta: "Livraison estimée : 8 avril",
    });
  };

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
          Service client
        </p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">
          Suivre ma <span className="font-script title-gold">commande</span>
        </h1>
        <p className="mt-3 text-ink-muted">
          Entrez votre numéro de commande et l&apos;email utilisé pour passer la
          commande.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-[1fr_1fr_auto]"
      >
        <Input
          placeholder="LYD-2026-0042"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          label="N° de commande"
        />
        <Input
          type="email"
          placeholder="email@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          label="Email"
        />
        <Button type="submit" className="self-end">
          <Search className="h-4 w-4" />
          Rechercher
        </Button>
      </form>

      {tracking && (
        <div className="mx-auto mt-12 max-w-3xl">
          <div className="card-luxe p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-ink-muted">Commande</p>
                <p className="font-ui text-xl font-bold">{tracking.order}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-muted">Transporteur</p>
                <p className="font-ui font-bold">{tracking.carrier}</p>
              </div>
            </div>

            <p className="mt-4 rounded-full bg-gradient-rose-soft px-4 py-2 text-center text-sm font-ui font-semibold text-ink">
              {tracking.eta}
            </p>

            <div className="relative mt-10">
              <div className="absolute left-0 right-0 top-5 h-0.5 bg-borderSoft" />
              <div
                className="absolute left-0 top-5 h-0.5 bg-gradient-royal transition-all"
                style={{
                  width: `${(tracking.current / (stages.length - 1)) * 100}%`,
                }}
              />
              <ol className="relative grid grid-cols-5 gap-2">
                {stages.map((s, i) => {
                  const Icon = s.icon;
                  const done = i <= tracking.current;
                  return (
                    <li key={s.id} className="flex flex-col items-center">
                      <div
                        className={cx(
                          "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                          done
                            ? "border-rose-dark bg-gradient-royal text-white shadow-gold"
                            : "border-borderSoft bg-white text-ink-muted",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <p
                        className={cx(
                          "mt-2 text-center text-xs font-ui font-semibold",
                          done ? "text-ink" : "text-ink-muted",
                        )}
                      >
                        {s.label}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
