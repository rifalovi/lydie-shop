import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  type: z.enum(["TEXT", "SELECT", "NUMBER", "BOOLEAN"]).optional(),
  unit: z.string().max(20).nullable().optional(),
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().optional(),
  position: z.number().int().nonnegative().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role))
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  const updated = await prisma.attributeTemplate.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role))
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  await prisma.attributeTemplate.delete({ where: { id: params.id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
