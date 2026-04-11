"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section className="container-page py-16">
      <div className="relative overflow-hidden rounded-luxe bg-gradient-royal p-10 text-white shadow-lift sparkle-bg md:p-14">
        <div className="relative mx-auto max-w-2xl text-center">
          <Mail className="mx-auto mb-4 h-8 w-8" />
          <h2 className="font-serif text-3xl md:text-4xl">
            Rejoignez le cercle des Reines
          </h2>
          <p className="mt-3 text-white/90">
            Offres privées, avant-premières, et un code promo de{" "}
            <span className="font-bold">-10%</span> dès votre inscription.
          </p>

          {sent ? (
            <p className="mt-6 rounded-full bg-white/20 px-6 py-3 font-ui font-semibold backdrop-blur">
              Bienvenue parmi nous. Surveillez votre boîte mail !
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="mt-6 flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                className="flex-1 rounded-full border-0 bg-white/95 px-5 py-3 text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold"
              />
              <Button
                type="submit"
                className="bg-white !text-rose-dark hover:!bg-cream"
              >
                Je m&apos;inscris
              </Button>
            </form>
          )}

          <p className="mt-4 text-xs text-white/70">
            En vous inscrivant, vous acceptez de recevoir nos emails marketing.
            Désinscription en un clic.
          </p>
        </div>
      </div>
    </section>
  );
}
