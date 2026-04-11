// Accès produits côté serveur — lit Prisma et mappe vers le type `Product`
// utilisé par les composants UI (qui restent agnostiques de Prisma).

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/lib/types";

const productInclude = {
  category: true,
  images: { orderBy: { position: "asc" as const } },
  variants: true,
};

type DbProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

function toUiProduct(p: DbProduct): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDesc: p.shortDesc,
    description: p.description,
    price: Number(p.price),
    comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
    stock: p.stock,
    categorySlug: p.category.slug,
    images: p.images.map((i) => i.url),
    variants: p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      color: v.color ?? undefined,
      length: v.length ?? undefined,
      stock: v.stock,
      price: v.price ? Number(v.price) : undefined,
    })),
    tags: p.tags,
    isFeatured: p.isFeatured,
    isNew: p.isNew,
    rating: p.rating,
    reviewCount: p.reviewCount,
    features: p.features,
    careInstructions: p.careInstructions ?? "",
  };
}

type Sort = "popularite" | "nouveautes" | "prix-asc" | "prix-desc" | "note";

function buildOrderBy(
  sort: Sort | undefined,
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "prix-asc":
      return [{ price: "asc" }];
    case "prix-desc":
      return [{ price: "desc" }];
    case "nouveautes":
      return [{ isNew: "desc" }, { createdAt: "desc" }];
    case "note":
      return [{ rating: "desc" }, { reviewCount: "desc" }];
    case "popularite":
    default:
      return [{ reviewCount: "desc" }, { createdAt: "desc" }];
  }
}

export async function listProducts(opts: {
  categorySlug?: string;
  sort?: Sort;
  query?: string;
} = {}): Promise<Product[]> {
  const query = opts.query?.trim();

  const searchFilter: Prisma.ProductWhereInput | undefined = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { shortDesc: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { tags: { has: query.toLowerCase() } },
        ],
      }
    : undefined;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(opts.categorySlug ? { category: { slug: opts.categorySlug } } : {}),
    ...(searchFilter ?? {}),
  };

  const rows = await prisma.product.findMany({
    where,
    include: productInclude,
    orderBy: buildOrderBy(opts.sort),
  });

  return rows.map(toUiProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({
    where: { slug },
    include: productInclude,
  });
  if (!row || !row.isActive) return null;
  return toUiProduct(row);
}

export async function getRelatedProducts(
  productId: string,
  limit = 4,
): Promise<Product[]> {
  const source = await prisma.product.findUnique({
    where: { id: productId },
    select: { categoryId: true },
  });
  if (!source) return [];

  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: source.categoryId,
      id: { not: productId },
    },
    include: productInclude,
    take: limit,
    orderBy: { reviewCount: "desc" },
  });

  return rows.map(toUiProduct);
}

export async function getFeaturedProductsDb(limit = 8): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: productInclude,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toUiProduct);
}

export type PublicReview = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  authorName: string;
};

export async function getApprovedReviewsForProduct(
  productId: string,
  limit = 20,
): Promise<PublicReview[]> {
  const rows = await prisma.review.findMany({
    where: { productId, isApproved: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true } } },
  });

  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    authorName: r.user.name?.split(" ")[0] ?? "Reine",
  }));
}
