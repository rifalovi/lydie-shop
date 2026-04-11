import { Truck, Gift, Sparkles, ShieldCheck } from "lucide-react";

const items = [
  {
    icon: Truck,
    title: "Livraison rapide",
    desc: "Expédition sous 24h, livraison offerte dès 60€",
  },
  {
    icon: Gift,
    title: "Cadeau surprise",
    desc: "Une petite douceur dans chaque commande",
  },
  {
    icon: Sparkles,
    title: "Qualité premium",
    desc: "Cheveux 100% naturels Remy sélectionnés",
  },
  {
    icon: ShieldCheck,
    title: "Satisfaite ou remboursée",
    desc: "Retours gratuits sous 14 jours",
  },
];

export function ValueProps() {
  return (
    <section className="border-y border-borderSoft bg-gradient-rose-soft py-12">
      <div className="container-page grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-gold-dark shadow-soft">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-ui font-bold text-ink">{title}</p>
              <p className="text-sm text-ink-muted">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
