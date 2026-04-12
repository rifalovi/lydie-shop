import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  hairType: z.array(z.string()).default([]),
  desiredLength: z.array(z.string()).default([]),
  favoriteColors: z.array(z.string()).default([]),
  budgetRange: z.string().nullable().optional(),
  occasions: z.array(z.string()).default([]),
  notes: z.string().max(500).nullable().optional(),
});

// GET /api/user/beauty-profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const profile = await prisma.beautyProfile.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json(profile ?? { hairType: [], desiredLength: [], favoriteColors: [], budgetRange: null, occasions: [], notes: null });
}

// PUT /api/user/beauty-profile — upsert
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  const profile = await prisma.beautyProfile.upsert({
    where: { userId: session.user.id },
    update: parsed.data,
    create: { userId: session.user.id, ...parsed.data },
  });
  return NextResponse.json(profile);
}
