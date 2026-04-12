import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Échappe une valeur pour CSV RFC 4180 : on double les guillemets et on
// entoure de " si la valeur contient ',', ';', '"' ou un saut de ligne.
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",;\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDateIso(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

// GET /api/admin/orders/export → fichier CSV UTF-8
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
      items: { select: { quantity: true } },
    },
  });

  const headers = [
    "orderNumber",
    "createdAt",
    "status",
    "paymentStatus",
    "customerName",
    "customerEmail",
    "itemsCount",
    "subtotal",
    "shippingCost",
    "discount",
    "total",
    "carrier",
    "trackingNumber",
  ];

  const rows = orders.map((o) => {
    const itemsCount = o.items.reduce((acc, it) => acc + it.quantity, 0);
    const customerName = o.user?.name ?? "";
    const customerEmail = o.user?.email ?? o.guestEmail ?? "";
    return [
      o.orderNumber,
      formatDateIso(o.createdAt),
      o.status,
      o.paymentStatus,
      customerName,
      customerEmail,
      itemsCount,
      Number(o.subtotal).toFixed(2),
      Number(o.shippingCost).toFixed(2),
      Number(o.discount).toFixed(2),
      Number(o.total).toFixed(2),
      o.carrier ?? "",
      o.trackingNumber ?? "",
    ];
  });

  const csvLines = [
    headers.join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ];
  // BOM UTF-8 pour qu'Excel ouvre correctement les accents.
  const csv = "\uFEFF" + csvLines.join("\r\n") + "\r\n";

  const today = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="commandes-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
