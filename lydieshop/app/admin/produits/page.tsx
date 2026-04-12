import Link from "next/link";
import { Edit, Plus, Tags } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatEUR } from "@/lib/format";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true, slug: true } },
      images: { orderBy: { position: "asc" }, take: 1 },
    },
  });

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
            Catalogue
          </p>
          <h1 className="mt-1 font-serif text-4xl">Produits</h1>
          <p className="mt-2 text-ink-muted">
            {products.length} produit{products.length > 1 ? "s" : ""}.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/produits/nouveau">
            <Button>
              <Plus className="h-4 w-4" />
              Nouveau produit
            </Button>
          </Link>
        </div>
      </div>

      <div className="card-luxe mt-6 overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center text-ink-muted">
            Aucun produit. Créez-en un avec le bouton ci-dessus.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gradient-rose-soft text-left text-xs uppercase tracking-widest text-ink-muted">
              <tr>
                <th className="px-5 py-3">Produit</th>
                <th className="px-5 py-3">Catégorie</th>
                <th className="px-5 py-3 text-right">Prix</th>
                <th className="px-5 py-3 text-right">Stock</th>
                <th className="px-5 py-3 text-right">Statut</th>
                <th className="px-5 py-3" />
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
                      {p.images[0] ? (
                        <img
                          src={p.images[0].url}
                          alt={p.name}
                          className="h-12 w-10 rounded-soft object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-10 items-center justify-center rounded-soft bg-rose-light text-rose-dark">
                          <Tags className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <p className="font-ui font-semibold">{p.name}</p>
                        <p className="text-xs text-ink-muted">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 capitalize text-ink-muted">
                    {p.category.name}
                  </td>
                  <td className="px-5 py-4 text-right font-num font-semibold">
                    {formatEUR(Number(p.price))}
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
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[10px] font-ui font-bold uppercase tracking-widest ${
                        p.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-borderSoft text-ink-muted"
                      }`}
                    >
                      {p.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/produits/${p.id}/edit`}
                      className="inline-flex rounded-full p-2 text-ink-muted hover:bg-rose-light hover:text-rose-dark"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
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
