import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/attributes?categorySlug=perruques OR ?categoryId=xxx
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("categorySlug");
  const categoryId = req.nextUrl.searchParams.get("categoryId");

  let resolvedId = categoryId;
  if (!resolvedId && slug) {
    const cat = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
    resolvedId = cat?.id ?? null;
  }
  if (!resolvedId) return NextResponse.json({ templates: [] });

  const templates = await prisma.attributeTemplate.findMany({
    where: { categoryId: resolvedId },
    orderBy: { position: "asc" },
    select: { id: true, name: true, type: true, unit: true, options: true, isRequired: true, position: true },
  });
  return NextResponse.json({ templates });
}

const CreateSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(60),
  type: z.enum(["TEXT", "SELECT", "NUMBER", "BOOLEAN"]).default("TEXT"),
  unit: z.string().max(20).nullable().optional(),
  options: z.array(z.string()).default([]),
  isRequired: z.boolean().default(false),
});

// POST /api/attributes — admin only
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role))
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalide." }, { status: 400 });

  const maxPos = await prisma.attributeTemplate.aggregate({
    where: { categoryId: parsed.data.categoryId },
    _max: { position: true },
  });

  const template = await prisma.attributeTemplate.create({
    data: {
      ...parsed.data,
      unit: parsed.data.unit ?? null,
      position: (maxPos._max.position ?? -1) + 1,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
