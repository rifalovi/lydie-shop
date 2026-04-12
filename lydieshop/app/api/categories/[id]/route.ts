import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/roles";
import { slugify } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  slug: z.string().min(1).max(60).optional(),
  image: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
  position: z.number().int().nonnegative().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role))
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const existing = await prisma.category.findUnique({ where: { id: params.id } });
  if (!existing)
    return NextResponse.json({ error: "Catégorie introuvable." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  const data = parsed.data;
  if (data.slug) data.slug = slugify(data.slug);

  const updated = await prisma.category.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(updated);
}
