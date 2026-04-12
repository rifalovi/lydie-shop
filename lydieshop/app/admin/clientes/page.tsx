import { Users, Mail, Phone, Crown as CrownLucide } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatEUR } from "@/lib/format";

export const dynamic = "force-dynamic";

const tierStyle: Record<string, string> = {
  ROSE: "bg-rose-light text-rose-dark",
  GOLD: "bg-gradient-gold text-white",
  DIAMOND: "bg-gradient-royal text-white",
};

export default async function AdminClientesPage() {
  // On ne liste que les CUSTOMER — les ADMIN et SUPER_ADMIN ont leur propre
  // page (/admin/admins pour le SUPER_ADMIN).
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      orders: {
        select: { total: true, status: true },
      },
      _count: {
        select: { orders: true, wishlist: true, reviews: true },
      },
    },
  });

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce(
    (acc, c) =>
      acc +
      c.orders.reduce(
        (sum, o) =>
          o.status === "DELIVERED" ||
          o.status === "SHIPPED" ||
          o.status === "CONFIRMED"
            ? sum + Number(o.total)
            : sum,
        0,
      ),
    0,
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
          Catalogue clientes
        </p>
        <h1 className="mt-1 font-serif text-4xl">Clientes</h1>
        <p className="mt-2 text-ink-muted">
          {totalCustomers} cliente{totalCustomers > 1 ? "s" : ""} ·{" "}
          {formatEUR(totalRevenue)} générés par les commandes confirmées.
        </p>
      </div>

      <div className="card-luxe overflow-hidden">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center text-ink-muted">
            <Users className="h-10 w-10" />
            <p className="font-serif text-xl">Aucune cliente enregistrée</p>
            <p className="text-sm">
              Les comptes créés via /register apparaîtront ici.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gradient-rose-soft text-left text-xs uppercase tracking-widest text-ink-muted">
              <tr>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Inscription</th>
                <th className="px-5 py-3 text-right">Commandes</th>
                <th className="px-5 py-3 text-right">Favoris</th>
                <th className="px-5 py-3 text-right">Points</th>
                <th className="px-5 py-3 text-right">Niveau</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-borderSoft/60 hover:bg-cream"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-ink">
                      {c.name ?? "Cliente"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="flex items-center gap-1 text-xs text-ink-muted">
                      <Mail className="h-3 w-3" />
                      {c.email}
                    </p>
                    {c.phone && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
                        <Phone className="h-3 w-3" />
                        {c.phone}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-ink-muted">
                    {formatDate(c.createdAt.toISOString())}
                  </td>
                  <td className="px-5 py-4 text-right font-num">
                    {c._count.orders}
                  </td>
                  <td className="px-5 py-4 text-right font-num">
                    {c._count.wishlist}
                  </td>
                  <td className="px-5 py-4 text-right font-num font-bold">
                    {c.loyaltyPoints.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-ui font-bold uppercase tracking-wider ${
                        tierStyle[c.tier] ?? "bg-borderSoft text-ink"
                      }`}
                    >
                      <CrownLucide className="h-3 w-3" />
                      {c.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
