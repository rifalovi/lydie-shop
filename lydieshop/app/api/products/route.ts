import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/data/products";
import { slugify } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SORTS = [
  "popularite",
  "nouveautes",
  "prix-asc",
  "prix-desc",
  "note",
] as const;

// GET /api/products?categorie=perruques&tri=prix-asc&q=majeste
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorie = searchParams.get("categorie") ?? undefined;
  const triRaw = searchParams.get("tri") ?? undefined;
  const tri = (VALID_SORTS as readonly string[]).includes(triRaw ?? "")
    ? (triRaw as (typeof VALID_SORTS)[number])
    : undefined;
  const query = searchParams.get("q")?.trim() || undefined;

  try {
    const products = await listProducts({
      categorySlug: categorie,
      sort: tri,
      query,
    });
    return NextResponse.json({ products, count: products.length });
  } catch (err) {
    console.error("[/api/products] error", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des produits." },
      { status: 500 },
    );
  }
}

const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  categorySlug: z.string().min(1),
  shortDesc: z.string().min(1).max(500),
  description: z.string().min(1).max(8000),
  price: z.number().positive(),
  comparePrice: z.number().positive().nullable().optional(),
  stock: z.number().int().nonnegative(),
  weight: z.number().positive().nullable().optional(),
  tags: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  careInstructions: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDesc: z.string().nullable().optional(),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(true),
  images: z
    .array(z.object({ url: z.string().url() }))
    .min(1, "Au moins une image est requise."),
});

// S'assure qu'un slug est unique en appendant -2, -3, ... si besoin.
async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "produit";
  let candidate = root;
  let i = 2;
  while (
    await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
  ) {
    candidate = `${root}-${i++}`;
  }
  return candidate;
}

// POST /api/products — création d'un produit (admin uniquement).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = CreateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const category = await prisma.category.findUnique({
    where: { slug: data.categorySlug },
    select: { id: true },
  });
  if (!category) {
    return NextResponse.json(
      { error: "Catégorie introuvable." },
      { status: 400 },
    );
  }

  const slug = await uniqueSlug(data.name);

  try {
    const product = await prisma.product.create({
      data: {
        slug,
        name: data.name,
        shortDesc: data.shortDesc,
        description: data.description,
        price: data.price,
        comparePrice: data.comparePrice ?? null,
        stock: data.stock,
        categoryId: category.id,
        tags: data.tags,
        features: data.features,
        careInstructions: data.careInstructions ?? null,
        seoTitle: data.seoTitle ?? null,
        seoDesc: data.seoDesc ?? null,
        weight: data.weight ?? null,
        isFeatured: data.isFeatured,
        isNew: data.isNew,
        images: {
          create: data.images.map((img, position) => ({
            url: img.url,
            position,
          })),
        },
      },
      select: { id: true, slug: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("[/api/products POST] error", err);
    return NextResponse.json(
      { error: "Enregistrement impossible." },
      { status: 500 },
    );
  }
}
