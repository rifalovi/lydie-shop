import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recomputeProductRating } from "@/lib/reviews";
import { sendReviewApprovedEmail } from "@/lib/email";
import { isStaffRole } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role)) return null;
  return session;
}

// GET /api/admin/reviews?status=pending|approved|all
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status") ?? "pending";

  const where =
    status === "approved"
      ? { isApproved: true }
      : status === "all"
        ? {}
        : { isApproved: false };

  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ reviews });
}

const PatchSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "reject"]),
});

// PATCH /api/admin/reviews — modération.
// approve → isApproved true + recalcule rating
// reject  → supprime l'avis + recalcule rating
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Action invalide." },
      { status: 400 },
    );
  }

  const { id, action } = parsed.data;

  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!review) {
    return NextResponse.json({ error: "Avis introuvable." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    if (action === "approve") {
      await tx.review.update({
        where: { id },
        data: { isApproved: true },
      });
    } else {
      await tx.review.delete({ where: { id } });
    }
    await recomputeProductRating(review.product.id, tx as typeof prisma);
  });

  // Notifie la cliente lors d'une approbation — best effort.
  if (action === "approve" && review.user.email) {
    const baseUrl =
      process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "https://lydieshop.com";
    sendReviewApprovedEmail({
      to: review.user.email,
      customerName: review.user.name,
      productName: review.product.name,
      productUrl: `${baseUrl}/produit/${review.product.slug}`,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
    }).catch((e) =>
      console.error("[admin/reviews PATCH] email error", e),
    );
  }

  return NextResponse.json({ ok: true });
}
