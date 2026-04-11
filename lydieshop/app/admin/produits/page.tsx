import Link from "next/link";
import { Plus, Search, Edit } from "lucide-react";
import { products } from "@/lib/products";
import { formatEUR } from "@/lib/format";
import { Button } from "@/components/ui/Button";

export default function AdminProductsPage() {
  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
            Catalogue
          </p>
          <h1 className="mt-1 font-serif text-4xl">Produits</h1>
        </div>
        <Link href="/admin/produits/nouveau">
          <Button>
            <Plus className="h-4 w-4" />
            Nouveau produit
          </Button>
        </Link>
      </div>

      <div className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            placeholder="Rechercher un produit..."
            className="input-luxe pl-10"
          />
        </div>
        <select className="rounded-soft border border-borderSoft bg-white px-4 text-sm">
          <option>Toutes les catégories</option>
          <option>Perruques</option>
          <option>Tissages</option>
          <option>Accessoires</option>
          <option>Cadeaux</option>
        </select>
      </div>

      <div className="card-luxe mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gradient-rose-soft text-left text-xs uppercase tracking-widest text-ink-muted">
            <tr>
              <th className="px-5 py-3">Produit</th>
              <th className="px-5 py-3">Catégorie</th>
              <th className="px-5 py-3 text-right">Prix</th>
              <th className="px-5 py-3 text-right">Stock</th>
              <th className="px-5 py-3 text-right">Statut</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className="border-t border-borderSoft/60 hover:bg-cream"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="h-12 w-10 rounded-soft object-cover"
                    />
                    <div>
                      <p className="font-ui font-semibold">{p.name}</p>
                      <p className="text-xs text-ink-muted">{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 capitalize">{p.categorySlug}</td>
                <td className="px-5 py-4 text-right font-num font-semibold">
                  {formatEUR(p.price)}
                </td>
                <td className="px-5 py-4 text-right font-num">
                  <span
                    className={
                      p.stock <= 5
                        ? "font-bold text-rose-dark"
                        : "text-ink"
                    }
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-ui font-bold uppercase tracking-widest text-emerald-700">
                    Actif
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button className="rounded-full p-2 text-ink-muted hover:bg-rose-light hover:text-rose-dark">
                    <Edit className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
