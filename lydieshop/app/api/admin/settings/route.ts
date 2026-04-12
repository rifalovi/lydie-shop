import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/settings — returns the singleton settings row.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role))
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  let settings = await prisma.shopSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await prisma.shopSettings.create({ data: { id: "singleton" } });
  }
  return NextResponse.json(settings);
}

const PatchSchema = z.object({
  shopName: z.string().min(1).max(100).optional(),
  contactEmail: z.string().email().optional(),
  instagramUrl: z.string().url().nullable().optional(),
  tiktokUrl: z.string().url().nullable().optional(),
  facebookUrl: z.string().url().nullable().optional(),
  promoBarMessage: z.string().max(200).nullable().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().max(500).nullable().optional(),
  freeShippingThreshold: z.number().nonnegative().optional(),
  colissimoPrice: z.number().nonnegative().optional(),
  mondialRelayPrice: z.number().nonnegative().optional(),
  chronopostPrice: z.number().nonnegative().optional(),
  colissimoEnabled: z.boolean().optional(),
  mondialRelayEnabled: z.boolean().optional(),
  chronopostEnabled: z.boolean().optional(),
});

// PATCH /api/admin/settings — admin only, upsert singleton.
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role))
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  const settings = await prisma.shopSettings.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  });
  return NextResponse.json(settings);
}
