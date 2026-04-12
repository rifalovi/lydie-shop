import Link from "next/link";
import { Tag, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatEUR, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = {
  PERCENT: "Pourcentage",
  FIXED: "Montant fixe",
  FREE_SHIPPING: "Livraison offerte",
};

export default async function AdminPromotionsPage() {
  const codes = await prisma.promoCode.findMany({
    orderBy: { isActive: "desc" },
    include: {
      _count: { select: { orders: true } },
    },
  });

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
            Marketing
          </p>
          <h1 className="mt-1 font-serif text-4xl">Codes promo</h1>
          <p className="mt-2 text-ink-muted">
            {codes.length} code{codes.length > 1 ? "s" : ""} configuré
            {codes.length > 1 ? "s" : ""}.
          </p>
        </div>
      </div>

      <div className="card-luxe mt-6 overflow-hidden">
        {codes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center text-ink-muted">
            <Tag className="h-10 w-10" />
            <p className="font-serif text-xl">Aucun code promo</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gradient-rose-soft text-left text-xs uppercase tracking-widest text-ink-muted">
              <tr>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3 text-right">Valeur</th>
                <th className="px-5 py-3 text-right">Utilisations</th>
                <th className="px-5 py-3 text-right">Max</th>
                <th className="px-5 py-3 text-right">Expire</th>
                <th className="px-5 py-3 text-right">Statut</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-borderSoft/60 hover:bg-cream"
                >
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-gradient-rose-soft px-3 py-1 font-mono text-xs font-bold text-rose-dark">
                      {c.code}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-ink-muted">
                    {typeLabel[c.type] ?? c.type}
                  </td>
                  <td className="px-5 py-4 text-right font-num font-bold">
                    {c.type === "PERCENT"
                      ? `${Number(c.value)}%`
                      : c.type === "FREE_SHIPPING"
                        ? "—"
                        : formatEUR(Number(c.value))}
                  </td>
                  <td className="px-5 py-4 text-right font-num">
                    {c._count.orders}
                  </td>
                  <td className="px-5 py-4 text-right font-num text-ink-muted">
                    {c.maxUses ?? "∞"}
                  </td>
                  <td className="px-5 py-4 text-right text-xs text-ink-muted">
                    {c.expiresAt
                      ? formatDate(c.expiresAt.toISOString())
                      : "Jamais"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[10px] font-ui font-bold uppercase tracking-wider ${
                        c.isActive
                          ? "bg-gradient-gold text-white"
                          : "bg-borderSoft text-ink-muted"
                      }`}
                    >
                      {c.isActive ? "Actif" : "Inactif"}
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
