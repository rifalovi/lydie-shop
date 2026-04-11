import Link from "next/link";
import { CrownIcon } from "@/components/ui/Crown";
import { Heart, Package, User, Gift, Star } from "lucide-react";
import { formatEUR } from "@/lib/format";

const mockOrders = [
  {
    id: "LYD-2026-0042",
    date: "4 avril 2026",
    status: "SHIPPED" as const,
    total: 299,
    items: 2,
  },
  {
    id: "LYD-2026-0031",
    date: "18 mars 2026",
    status: "DELIVERED" as const,
    total: 189,
    items: 1,
  },
];

const statusLabel: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "bg-borderSoft text-ink" },
  CONFIRMED: { label: "Confirmée", color: "bg-rose-light text-rose-dark" },
  PROCESSING: { label: "En préparation", color: "bg-gold-light/40 text-gold-dark" },
  SHIPPED: { label: "Expédiée", color: "bg-gradient-royal text-white" },
  DELIVERED: { label: "Livrée", color: "bg-gradient-gold text-white" },
};

export default function AccountPage() {
  return (
    <div className="container-page py-12">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
            Votre espace
          </p>
          <h1 className="mt-1 font-serif text-4xl md:text-5xl">
            Bonjour, <span className="font-script title-gold">Marie</span> 👑
          </h1>
        </div>
        <div className="card-luxe px-6 py-4">
          <div className="flex items-center gap-3">
            <CrownIcon className="h-5 w-5 text-gold" />
            <div>
              <p className="text-xs text-ink-muted">Niveau actuel</p>
              <p className="font-ui font-bold text-ink">Reine Rose</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock
          icon={Package}
          label="Commandes"
          value="8"
          hint="2 en cours"
        />
        <StatBlock
          icon={Heart}
          label="Favoris"
          value="12"
          hint="nouvelle sélection"
        />
        <StatBlock
          icon={CrownIcon}
          label="Points Couronne"
          value="2 490"
          hint="Prochaine récompense : -12€"
        />
        <StatBlock
          icon={Gift}
          label="Parrainage"
          value="3"
          hint="amies parrainées"
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <h2 className="font-serif text-2xl">Mes commandes récentes</h2>
          <div className="mt-4 space-y-3">
            {mockOrders.map((o) => {
              const s = statusLabel[o.status];
              return (
                <div
                  key={o.id}
                  className="card-luxe flex items-center justify-between p-5"
                >
                  <div>
                    <p className="font-ui font-bold text-ink">{o.id}</p>
                    <p className="text-xs text-ink-muted">
                      {o.date} · {o.items} article{o.items > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[11px] font-ui font-semibold ${s.color}`}
                    >
                      {s.label}
                    </span>
                    <p className="mt-1 font-num text-lg font-bold">
                      {formatEUR(o.total)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            href="/suivi"
            className="mt-4 inline-block text-sm font-ui font-semibold text-rose-dark hover:underline"
          >
            Suivre une commande →
          </Link>
        </section>

        <aside className="space-y-4">
          <div className="card-luxe p-5">
            <div className="flex items-center gap-2 text-gold-dark">
              <User className="h-4 w-4" />
              <p className="font-ui text-xs font-bold uppercase tracking-widest">
                Profil
              </p>
            </div>
            <p className="mt-3 text-sm text-ink">
              Marie Dubois
              <br />
              marie.dubois@example.com
              <br />
              +33 6 12 34 56 78
            </p>
            <button className="mt-4 text-xs font-ui font-semibold text-rose-dark hover:underline">
              Modifier mes informations
            </button>
          </div>

          <div className="card-luxe p-5">
            <div className="flex items-center gap-2 text-gold-dark">
              <Star className="h-4 w-4" />
              <p className="font-ui text-xs font-bold uppercase tracking-widest">
                Laisser un avis
              </p>
            </div>
            <p className="mt-3 text-sm text-ink-muted">
              Partagez votre expérience sur vos derniers achats et gagnez 50
              points par avis.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatBlock({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: any;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="card-luxe p-5">
      <div className="flex items-center gap-2 text-gold-dark">
        <Icon className="h-4 w-4" />
        <p className="font-ui text-xs font-bold uppercase tracking-widest">
          {label}
        </p>
      </div>
      <p className="mt-3 font-num text-3xl font-bold text-ink">{value}</p>
      <p className="text-xs text-ink-muted">{hint}</p>
    </div>
  );
}
