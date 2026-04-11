import Link from "next/link";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatEUR, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

const statusStyle: Record<string, string> = {
  PENDING: "bg-borderSoft text-ink",
  CONFIRMED: "bg-rose-light text-rose-dark",
  PROCESSING: "bg-gold-light/40 text-gold-dark",
  SHIPPED: "bg-gradient-royal text-white",
  DELIVERED: "bg-gradient-gold text-white",
  CANCELLED: "bg-borderSoft text-ink-muted",
  REFUNDED: "bg-borderSoft text-ink-muted",
};

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { email: true, name: true } },
      items: { select: { quantity: true } },
    },
  });

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
            Commandes
          </p>
          <h1 className="mt-1 font-serif text-4xl">Gestion des commandes</h1>
          <p className="mt-2 text-ink-muted">
            {orders.length} commande{orders.length > 1 ? "s" : ""} affichée
            {orders.length > 1 ? "s" : ""}.
          </p>
        </div>
        <Link href="/api/admin/orders/export" prefetch={false}>
          <Button variant="secondary">
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
        </Link>
      </div>

      <div className="card-luxe mt-6 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-ink-muted">
            Aucune commande pour l&apos;instant.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gradient-rose-soft text-left text-xs uppercase tracking-widest text-ink-muted">
              <tr>
                <th className="px-5 py-3">Commande</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Articles</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-right">Paiement</th>
                <th className="px-5 py-3 text-right">Statut</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const itemsCount = o.items.reduce(
                  (acc, it) => acc + it.quantity,
                  0,
                );
                const customerName = o.user?.name ?? "Invitée";
                const customerEmail = o.user?.email ?? o.guestEmail ?? "—";
                return (
                  <tr
                    key={o.id}
                    className="border-t border-borderSoft/60 hover:bg-cream"
                  >
                    <td className="px-5 py-4 font-ui font-semibold">
                      {o.orderNumber}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink">{customerName}</p>
                      <p className="text-xs text-ink-muted">
                        {customerEmail}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-ink-muted">
                      {formatDate(o.createdAt.toISOString())}
                    </td>
                    <td className="px-5 py-4 text-right font-num">
                      {itemsCount}
                    </td>
                    <td className="px-5 py-4 text-right font-num font-bold">
                      {formatEUR(Number(o.total))}
                    </td>
                    <td className="px-5 py-4 text-right text-xs font-ui font-bold uppercase tracking-wider text-ink-muted">
                      {o.paymentStatus}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-[10px] font-ui font-bold uppercase tracking-wider ${
                          statusStyle[o.status] ?? "bg-borderSoft text-ink"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
