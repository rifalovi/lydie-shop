import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireUser() {
  const s = await getServerSession(authOptions);
  return s?.user?.id ?? null;
}

const AddressSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(80),
  postalCode: z.string().min(1).max(20),
  country: z.string().max(2).default("FR"),
  phone: z.string().max(20).nullable().optional(),
  isDefault: z.boolean().default(false),
});

// GET — list user's addresses
export async function GET() {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });
  return NextResponse.json({ addresses });
}

// POST — add address
export async function POST(req: NextRequest) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = AddressSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalide." }, { status: 400 });

  // Si la nouvelle est "default", les autres perdent le flag.
  if (parsed.data.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({ data: { userId, ...parsed.data } });
  return NextResponse.json(address, { status: 201 });
}

// PATCH — update address (id in body)
export async function PATCH(req: NextRequest) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = body?.id;
  if (!id) return NextResponse.json({ error: "id requis." }, { status: 400 });

  const parsed = AddressSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalide." }, { status: 400 });

  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Adresse introuvable." }, { status: 404 });

  if (parsed.data.isDefault) {
    await prisma.address.updateMany({ where: { userId, id: { not: id } }, data: { isDefault: false } });
  }

  const updated = await prisma.address.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

// DELETE — remove address (?id=xxx)
export async function DELETE(req: NextRequest) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis." }, { status: 400 });

  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Adresse introuvable." }, { status: 404 });

  await prisma.address.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
