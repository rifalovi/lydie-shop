import { prisma } from "@/lib/prisma";
import { PromoClient } from "./PromoClient";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const codes = await prisma.promoCode.findMany({
    orderBy: [{ isActive: "desc" }, { code: "asc" }],
    include: { _count: { select: { orders: true } } },
  });

  const serialized = codes.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type as string,
    value: Number(c.value),
    minOrder: c.minOrder ? Number(c.minOrder) : null,
    maxUses: c.maxUses,
    usedCount: c._count.orders,
    isActive: c.isActive,
    expiresAt: c.expiresAt?.toISOString() ?? null,
  }));

  return <PromoClient initialCodes={serialized} />;
}
