import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireUser() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

// GET /api/wishlist → { productIds: string[] }
export async function GET() {
  const userId = await requireUser();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { productId: true },
  });

  return NextResponse.json({ productIds: items.map((i) => i.productId) });
}

const BodySchema = z.object({
  productId: z.string().min(1),
});

// POST /api/wishlist — ajoute un produit aux favoris (idempotent).
export async function POST(req: NextRequest) {
  const userId = await requireUser();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "productId requis." },
      { status: 400 },
    );
  }

  try {
    await prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId,
          productId: parsed.data.productId,
        },
      },
      update: {},
      create: { userId, productId: parsed.data.productId },
    });
    return NextResponse.json({ ok: true, added: true });
  } catch (err) {
    console.error("[/api/wishlist POST] error", err);
    return NextResponse.json(
      { error: "Ajout impossible." },
      { status: 500 },
    );
  }
}

// DELETE /api/wishlist?productId=...
export async function DELETE(req: NextRequest) {
  const userId = await requireUser();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json(
      { error: "productId requis." },
      { status: 400 },
    );
  }

  await prisma.wishlistItem
    .delete({
      where: { userId_productId: { userId, productId } },
    })
    .catch(() => {
      /* déjà absent — idempotent */
    });

  return NextResponse.json({ ok: true, removed: true });
}
