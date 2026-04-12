import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductEditForm } from "./ProductEditForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      category: { select: { slug: true } },
      images: { orderBy: { position: "asc" } },
    },
  });
  if (!product) notFound();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
          Catalogue
        </p>
        <h1 className="mt-1 font-serif text-4xl">Modifier le produit</h1>
        <p className="mt-2 text-ink-muted">{product.name}</p>
      </div>
      <ProductEditForm
        productId={product.id}
        initial={{
          name: product.name,
          shortDesc: product.shortDesc,
          description: product.description,
          categorySlug: product.category.slug,
          price: Number(product.price),
          comparePrice: product.comparePrice
            ? Number(product.comparePrice)
            : null,
          stock: product.stock,
          weight: product.weight,
          tags: product.tags,
          features: product.features,
          careInstructions: product.careInstructions,
          seoTitle: product.seoTitle,
          seoDesc: product.seoDesc,
          isFeatured: product.isFeatured,
          isNew: product.isNew,
          isActive: product.isActive,
          images: product.images.map((i) => ({
            url: i.url,
            publicId: i.id,
          })),
        }}
        categories={categories}
      />
    </div>
  );
}
