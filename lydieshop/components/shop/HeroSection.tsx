import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SparklesBg } from "@/components/ui/Sparkles";
import { CrownIcon } from "@/components/ui/Crown";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-rose-soft">
      <SparklesBg />

      <div className="container-page relative grid gap-12 py-20 lg:grid-cols-2 lg:py-28">
        <div className="flex flex-col justify-center">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-gold/30 bg-white/70 px-4 py-1.5 text-xs font-ui font-semibold uppercase tracking-widest text-gold-dark backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Nouvelle collection Printemps 2026
          </div>

          <h1 className="font-serif text-5xl leading-[1.05] text-ink md:text-6xl lg:text-7xl">
            Vous portez
            <br />
            une couronne.
            <br />
            <span className="font-script text-6xl title-gold md:text-7xl lg:text-[5.5rem]">
              Nous la sublimons.
            </span>
          </h1>

          <p className="mt-6 max-w-xl font-serif text-xl italic text-ink-muted">
            Perruques et tissages naturels haut de gamme, sélectionnés pour les
            Reines qui ne font aucun compromis.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/boutique">
              <Button size="lg">
                <CrownIcon className="h-4 w-4" />
                Découvrir la collection
              </Button>
            </Link>
            <Link href="/boutique?tri=nouveautes">
              <Button variant="secondary" size="lg">
                Les nouveautés
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-6 text-sm text-ink-muted">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-cream bg-gradient-royal"
                  />
                ))}
              </div>
              <span>+12 000 Reines satisfaites</span>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="relative h-[500px] w-full max-w-md">
            <div className="absolute inset-0 rotate-3 rounded-luxe bg-gradient-royal opacity-20 blur-2xl" />
            <div className="relative h-full w-full overflow-hidden rounded-luxe border-4 border-white shadow-lift">
              <img
                src="https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=85"
                alt="Modèle portant une perruque Lydie'shop"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 w-56 rounded-luxe border border-borderSoft bg-white p-5 shadow-lift">
              <div className="flex items-center gap-2 text-xs font-ui font-bold uppercase tracking-widest text-gold-dark">
                <CrownIcon className="h-3.5 w-3.5" />
                Premium
              </div>
              <p className="mt-2 font-serif text-lg font-semibold leading-snug">
                100% cheveux naturels Remy
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Teintables, coiffables, longue durée
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
