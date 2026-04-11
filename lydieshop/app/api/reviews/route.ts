import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional().nullable(),
  comment: z.string().max(2000).optional().nullable(),
});

// POST /api/reviews — création d'un avis (utilisateur connecté uniquement).
// Les avis restent en attente de modération (isApproved = false).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 },
    );
  }

  const { productId, rating, title, comment } = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json(
      { error: "Produit introuvable." },
      { status: 404 },
    );
  }

  try {
    const review = await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        rating,
        title: title || null,
        comment: comment || null,
        isApproved: false,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: review.id, pending: true }, { status: 201 });
  } catch (err) {
    // Violation de l'unique ([userId, productId]) → doublon.
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Vous avez déjà laissé un avis sur ce produit." },
        { status: 409 },
      );
    }
    console.error("[/api/reviews] error", err);
    return NextResponse.json(
      { error: "Impossible d'enregistrer l'avis." },
      { status: 500 },
    );
  }
}
