import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Heart } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FavorisPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/compte/favoris");
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          category: true,
          images: { orderBy: { position: "asc" } },
          variants: true,
        },
      },
    },
  });

  const products: Product[] = items
    .filter((i) => i.product.isActive)
    .map((i) => ({
      id: i.product.id,
      slug: i.product.slug,
      name: i.product.name,
      shortDesc: i.product.shortDesc,
      description: i.product.description,
      price: Number(i.product.price),
      comparePrice: i.product.comparePrice
        ? Number(i.product.comparePrice)
        : undefined,
      stock: i.product.stock,
      categorySlug: i.product.category.slug,
      images: i.product.images.map((img) => img.url),
      variants: i.product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        color: v.color ?? undefined,
        length: v.length ?? undefined,
        stock: v.stock,
        price: v.price ? Number(v.price) : undefined,
      })),
      tags: i.product.tags,
      isFeatured: i.product.isFeatured,
      isNew: i.product.isNew,
      rating: i.product.rating,
      reviewCount: i.product.reviewCount,
      features: i.product.features,
      careInstructions: i.product.careInstructions ?? "",
    }));

  return (
    <div className="container-page py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
            Votre espace
          </p>
          <h1 className="mt-1 font-serif text-4xl md:text-5xl">
            Mes <span className="font-script title-gold">favoris</span>
          </h1>
          <p className="mt-2 text-ink-muted">
            {products.length === 0
              ? "Vous n'avez pas encore ajouté de produit à vos favoris."
              : `${products.length} produit${products.length > 1 ? "s" : ""} dans votre sélection.`}
          </p>
        </div>
        <Link href="/compte">
          <Button variant="secondary">← Retour au compte</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="card-luxe mt-10 p-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-rose-dark" />
          <p className="mt-4 font-serif text-2xl">
            Aucun favori pour l&apos;instant
          </p>
          <p className="mt-2 text-ink-muted">
            Parcourez la boutique et cliquez sur le ♡ pour enregistrer vos
            coups de cœur.
          </p>
          <Link href="/boutique" className="mt-6 inline-block">
            <Button>Découvrir la boutique</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
