import {
  Euro,
  ShoppingBag,
  Users,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { formatEUR } from "@/lib/format";

const recentOrders = [
  { id: "LYD-2026-0048", customer: "Aminata D.", total: 319, status: "PENDING" },
  { id: "LYD-2026-0047", customer: "Sarah B.", total: 189, status: "CONFIRMED" },
  { id: "LYD-2026-0046", customer: "Priscillia N.", total: 289, status: "SHIPPED" },
  { id: "LYD-2026-0045", customer: "Lucie M.", total: 49, status: "DELIVERED" },
];

const lowStock = [
  { name: "Perruque Impératrice — Kinky Curl", stock: 5 },
  { name: "Perruque Diva — Body Wave Miel", stock: 7 },
];

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
            Tableau de bord
          </p>
          <h1 className="mt-1 font-serif text-4xl">Vue d&apos;ensemble</h1>
        </div>
        <div className="rounded-full bg-white px-4 py-2 text-sm font-ui font-semibold text-ink shadow-soft">
          Avril 2026
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="CA du mois"
          value={formatEUR(24830)}
          trend={18.4}
          icon={Euro}
        />
        <StatCard
          label="Commandes"
          value="142"
          trend={12.1}
          icon={ShoppingBag}
        />
        <StatCard
          label="Nouvelles clientes"
          value="38"
          trend={24.2}
          icon={Users}
        />
        <StatCard
          label="Taux de conversion"
          value="3.8"
          suffix="%"
          trend={-1.2}
          icon={TrendingUp}
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="card-luxe p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Commandes récentes</h2>
            <a
              href="/admin/commandes"
              className="text-xs font-ui font-semibold text-rose-dark hover:underline"
            >
              Voir tout →
            </a>
          </div>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-borderSoft text-left text-xs uppercase tracking-widest text-ink-muted">
                <th className="py-2">Commande</th>
                <th className="py-2">Cliente</th>
                <th className="py-2 text-right">Total</th>
                <th className="py-2 text-right">Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-borderSoft/60">
                  <td className="py-3 font-ui font-semibold">{o.id}</td>
                  <td className="py-3 text-ink">{o.customer}</td>
                  <td className="py-3 text-right font-num font-semibold">
                    {formatEUR(o.total)}
                  </td>
                  <td className="py-3 text-right">
                    <span className="rounded-full bg-rose-light px-2.5 py-1 text-[10px] font-ui font-semibold uppercase tracking-wider text-rose-dark">
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card-luxe p-6">
          <div className="flex items-center gap-2 text-rose-dark">
            <AlertCircle className="h-5 w-5" />
            <h2 className="font-serif text-2xl">Stock faible</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {lowStock.map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between rounded-soft bg-gradient-rose-soft p-3"
              >
                <span className="text-sm font-semibold">{p.name}</span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-num font-bold text-rose-dark">
                  {p.stock} restants
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-luxe bg-gradient-royal p-5 text-white">
            <p className="font-ui text-xs font-bold uppercase tracking-widest text-white/80">
              Action rapide
            </p>
            <p className="mt-2 font-serif text-xl">
              Ajoutez un nouveau produit avec l&apos;IA
            </p>
            <a
              href="/admin/produits/nouveau"
              className="mt-4 inline-block rounded-full bg-white px-4 py-2 text-xs font-ui font-bold text-rose-dark"
            >
              ✨ Générer avec l&apos;IA
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
