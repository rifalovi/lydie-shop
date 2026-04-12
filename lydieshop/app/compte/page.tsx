import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountClient, type AccountData } from "@/components/compte/AccountClient";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/compte");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { items: true },
      },
      addresses: { orderBy: [{ isDefault: "desc" }, { id: "asc" }] },
      wishlist: true,
      beautyProfile: true,
    },
  });

  if (!user) redirect("/login");

  const data: AccountData = {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    tier: user.tier,
    loyaltyPoints: user.loyaltyPoints,
    createdAt: user.createdAt.toISOString(),
    orders: user.orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      total: Number(o.total),
      itemsCount: o.items.reduce((s, i) => s + i.quantity, 0),
      createdAt: o.createdAt.toISOString(),
      trackingNumber: o.trackingNumber,
      carrier: o.carrier,
    })),
    addresses: user.addresses.map((a) => ({
      id: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
      street: a.street,
      city: a.city,
      postalCode: a.postalCode,
      country: a.country,
      phone: a.phone,
      isDefault: a.isDefault,
    })),
    wishlistCount: user.wishlist.length,
    beautyProfile: user.beautyProfile
      ? {
          hairType: user.beautyProfile.hairType,
          desiredLength: user.beautyProfile.desiredLength,
          favoriteColors: user.beautyProfile.favoriteColors,
          budgetRange: user.beautyProfile.budgetRange,
          occasions: user.beautyProfile.occasions,
          notes: user.beautyProfile.notes,
        }
      : null,
  };

  return <AccountClient data={data} />;
}
