import { Download } from "lucide-react";
import { formatEUR } from "@/lib/format";
import { Button } from "@/components/ui/Button";

const orders = [
  {
    id: "LYD-2026-0048",
    date: "11 avril 2026",
    customer: "Aminata Diop",
    email: "aminata@example.com",
    total: 319,
    items: 1,
    status: "PENDING",
  },
  {
    id: "LYD-2026-0047",
    date: "11 avril 2026",
    customer: "Sarah Benali",
    email: "sarah@example.com",
    total: 189,
    items: 1,
    status: "CONFIRMED",
  },
  {
    id: "LYD-2026-0046",
    date: "10 avril 2026",
    customer: "Priscillia Ngangue",
    email: "priscillia@example.com",
    total: 289,
    items: 1,
    status: "SHIPPED",
  },
  {
    id: "LYD-2026-0045",
    date: "10 avril 2026",
    customer: "Lucie Martin",
    email: "lucie@example.com",
    total: 49,
    items: 1,
    status: "DELIVERED",
  },
  {
    id: "LYD-2026-0044",
    date: "9 avril 2026",
    customer: "Fatou Sow",
    email: "fatou@example.com",
    total: 428,
    items: 2,
    status: "DELIVERED",
  },
];

const statusStyle: Record<string, string> = {
  PENDING: "bg-borderSoft text-ink",
  CONFIRMED: "bg-rose-light text-rose-dark",
  PROCESSING: "bg-gold-light/40 text-gold-dark",
  SHIPPED: "bg-gradient-royal text-white",
  DELIVERED: "bg-gradient-gold text-white",
};

export default function AdminOrdersPage() {
  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
            Commandes
          </p>
          <h1 className="mt-1 font-serif text-4xl">Gestion des commandes</h1>
        </div>
        <Button variant="secondary">
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      <div className="mt-6 flex gap-3">
        <select className="rounded-soft border border-borderSoft bg-white px-4 py-2 text-sm">
          <option>Tous les statuts</option>
          <option>En attente</option>
          <option>Confirmées</option>
          <option>Expédiées</option>
          <option>Livrées</option>
        </select>
        <input
          type="date"
          className="rounded-soft border border-borderSoft bg-white px-4 py-2 text-sm"
        />
      </div>

      <div className="card-luxe mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gradient-rose-soft text-left text-xs uppercase tracking-widest text-ink-muted">
            <tr>
              <th className="px-5 py-3">Commande</th>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3 text-right">Articles</th>
              <th className="px-5 py-3 text-right">Total</th>
              <th className="px-5 py-3 text-right">Statut</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className="border-t border-borderSoft/60 hover:bg-cream"
              >
                <td className="px-5 py-4 font-ui font-semibold">{o.id}</td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-ink">{o.customer}</p>
                  <p className="text-xs text-ink-muted">{o.email}</p>
                </td>
                <td className="px-5 py-4 text-ink-muted">{o.date}</td>
                <td className="px-5 py-4 text-right font-num">{o.items}</td>
                <td className="px-5 py-4 text-right font-num font-bold">
                  {formatEUR(o.total)}
                </td>
                <td className="px-5 py-4 text-right">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-[10px] font-ui font-bold uppercase tracking-wider ${statusStyle[o.status]}`}
                  >
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
