import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  code: z.string().min(1).max(30).optional(),
  type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]).optional(),
  value: z.number().nonnegative().optional(),
  minOrder: z.number().positive().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role))
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const existing = await prisma.promoCode.findUnique({ where: { id: params.id } });
  if (!existing)
    return NextResponse.json({ error: "Code introuvable." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 },
    );

  const data = parsed.data;
  const updated = await prisma.promoCode.update({
    where: { id: params.id },
    data: {
      ...data,
      ...(data.code ? { code: data.code.toUpperCase().trim() } : {}),
      ...(data.expiresAt !== undefined
        ? { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }
        : {}),
    },
  });

  return NextResponse.json(updated);
}
