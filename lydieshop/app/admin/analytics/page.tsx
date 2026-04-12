import {
  BarChart3,
  ShoppingBag,
  Users,
  TrendingUp,
  Euro,
  Star,
  Package,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatEUR } from "@/lib/format";
import { StatCard } from "@/components/admin/StatCard";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    usersThisMonth,
    totalOrders,
    ordersThisMonth,
    revenueAgg,
    revenueThisMonthAgg,
    totalProducts,
    totalReviews,
    avgRating,
    topProducts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({
      where: { role: "CUSTOMER", createdAt: { gte: startOfMonth } },
    }),
    prisma.order.count({ where: { paymentStatus: "PAID" } }),
    prisma.order.count({
      where: { paymentStatus: "PAID", createdAt: { gte: startOfMonth } },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID", createdAt: { gte: startOfMonth } },
      _sum: { total: true },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.review.count({ where: { isApproved: true } }),
    prisma.review.aggregate({
      where: { isApproved: true },
      _avg: { rating: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { reviewCount: "desc" },
      take: 5,
      select: {
        name: true,
        slug: true,
        rating: true,
        reviewCount: true,
        price: true,
        stock: true,
      },
    }),
  ]);

  const totalRevenue = Number(revenueAgg._sum.total ?? 0);
  const monthRevenue = Number(revenueThisMonthAgg._sum.total ?? 0);
  const monthName = now.toLocaleString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
          Statistiques
        </p>
        <h1 className="mt-1 font-serif text-4xl">Analytics</h1>
        <p className="mt-2 text-ink-muted">
          Vue d&apos;ensemble des performances de Lydie&apos;shop.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="CA total"
          value={formatEUR(totalRevenue)}
          icon={Euro}
        />
        <StatCard
          label={`CA ${monthName}`}
          value={formatEUR(monthRevenue)}
          icon={TrendingUp}
        />
        <StatCard
          label="Commandes (payées)"
          value={totalOrders.toString()}
          suffix={` (${ordersThisMonth} ce mois)`}
          icon={ShoppingBag}
        />
        <StatCard
          label="Clientes"
          value={totalUsers.toString()}
          suffix={` (+${usersThisMonth})`}
          icon={Users}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="card-luxe p-5">
          <div className="flex items-center gap-2 text-gold-dark">
            <Package className="h-4 w-4" />
            <p className="font-ui text-xs font-bold uppercase tracking-widest">
              Catalogue
            </p>
          </div>
          <p className="mt-3 font-num text-3xl font-bold text-ink">
            {totalProducts}
          </p>
          <p className="text-xs text-ink-muted">produits actifs</p>
        </div>

        <div className="card-luxe p-5">
          <div className="flex items-center gap-2 text-gold-dark">
            <Star className="h-4 w-4" />
            <p className="font-ui text-xs font-bold uppercase tracking-widest">
              Avis publiés
            </p>
          </div>
          <p className="mt-3 font-num text-3xl font-bold text-ink">
            {totalReviews}
          </p>
          <p className="text-xs text-ink-muted">
            Note moyenne : {(avgRating._avg.rating ?? 0).toFixed(1)} / 5
          </p>
        </div>

        <div className="card-luxe p-5">
          <div className="flex items-center gap-2 text-gold-dark">
            <BarChart3 className="h-4 w-4" />
            <p className="font-ui text-xs font-bold uppercase tracking-widest">
              Panier moyen
            </p>
          </div>
          <p className="mt-3 font-num text-3xl font-bold text-ink">
            {totalOrders > 0
              ? formatEUR(totalRevenue / totalOrders)
              : "—"}
          </p>
          <p className="text-xs text-ink-muted">sur les commandes payées</p>
        </div>
      </div>

      <section className="card-luxe mt-8 p-6">
        <h2 className="font-serif text-2xl">Produits les plus populaires</h2>
        {topProducts.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">Aucune donnée encore.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-ink-muted">
              <tr>
                <th className="py-2">Produit</th>
                <th className="py-2 text-right">Note</th>
                <th className="py-2 text-right">Avis</th>
                <th className="py-2 text-right">Prix</th>
                <th className="py-2 text-right">Stock</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr
                  key={p.slug}
                  className="border-t border-borderSoft/60 hover:bg-cream"
                >
                  <td className="py-3 font-semibold">{p.name}</td>
                  <td className="py-3 text-right font-num">
                    {p.rating.toFixed(1)}
                  </td>
                  <td className="py-3 text-right font-num">{p.reviewCount}</td>
                  <td className="py-3 text-right font-num">
                    {formatEUR(Number(p.price))}
                  </td>
                  <td className="py-3 text-right font-num">{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
