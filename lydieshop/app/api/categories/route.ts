import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/roles";
import { slugify } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/categories — returns all categories with product counts.
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      image: true,
      isActive: true,
      position: true,
      _count: { select: { products: true, attributeTemplates: true } },
    },
  });
  return NextResponse.json({ categories });
}

const CreateSchema = z.object({
  name: z.string().min(1).max(60),
  slug: z.string().min(1).max(60).optional(),
  image: z.string().url().nullable().optional(),
});

// POST /api/categories — admin only.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role))
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 },
    );

  const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.name);

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing)
    return NextResponse.json({ error: `Le slug « ${slug} » existe déjà.` }, { status: 409 });

  const maxPos = await prisma.category.aggregate({ _max: { position: true } });
  const category = await prisma.category.create({
    data: {
      slug,
      name: parsed.data.name.trim(),
      image: parsed.data.image ?? null,
      position: (maxPos._max.position ?? -1) + 1,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
