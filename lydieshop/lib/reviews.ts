import { prisma } from "@/lib/prisma";

// Recalcule et cache rating + reviewCount sur Product, à partir des reviews
// approuvées uniquement. À appeler dans la même transaction que le changement
// de statut d'un review.
export async function recomputeProductRating(
  productId: string,
  // Accepte aussi un client de transaction Prisma.
  client: typeof prisma = prisma,
) {
  const agg = await client.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });

  await client.product.update({
    where: { id: productId },
    data: {
      rating: agg._avg.rating ?? 0,
      reviewCount: agg._count._all,
    },
  });
}
