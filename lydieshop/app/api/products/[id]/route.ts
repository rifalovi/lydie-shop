import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  shortDesc: z.string().min(1).max(500).optional(),
  description: z.string().min(1).max(8000).optional(),
  price: z.number().positive().optional(),
  comparePrice: z.number().positive().nullable().optional(),
  stock: z.number().int().nonnegative().optional(),
  weight: z.number().positive().nullable().optional(),
  categorySlug: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  careInstructions: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDesc: z.string().nullable().optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isActive: z.boolean().optional(),
  images: z.array(z.object({ url: z.string().url() })).optional(),
});

// GET /api/products/[id] — public, used by the edit page to load data.
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      category: { select: { slug: true } },
      images: { orderBy: { position: "asc" } },
      variants: true,
    },
  });
  if (!product) {
    return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  }
  return NextResponse.json({
    ...product,
    price: Number(product.price),
    comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    categorySlug: product.category.slug,
  });
}

// PATCH /api/products/[id] — admin only.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const existing = await prisma.product.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Resolve category slug → id if provided.
  let categoryId: string | undefined;
  if (data.categorySlug) {
    const cat = await prisma.category.findUnique({
      where: { slug: data.categorySlug },
      select: { id: true },
    });
    if (!cat) {
      return NextResponse.json(
        { error: "Catégorie introuvable." },
        { status: 400 },
      );
    }
    categoryId = cat.id;
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Update product fields.
      const { images: _images, categorySlug: _cs, ...fields } = data;
      await tx.product.update({
        where: { id: params.id },
        data: {
          ...fields,
          ...(categoryId ? { categoryId } : {}),
        },
      });

      // Sync images: delete all, recreate from payload to reflect new
      // ordering and additions/removals.
      if (data.images) {
        await tx.productImage.deleteMany({ where: { productId: params.id } });
        if (data.images.length > 0) {
          await tx.productImage.createMany({
            data: data.images.map((img, position) => ({
              productId: params.id,
              url: img.url,
              position,
            })),
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/products/[id]] error", err);
    return NextResponse.json(
      { error: "Mise à jour impossible." },
      { status: 500 },
    );
  }
}
