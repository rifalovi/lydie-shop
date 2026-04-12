import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!isSuperAdmin(session?.user?.role)) return null;
  return session;
}

// GET /api/admin/admins — liste tous les utilisateurs ADMIN et SUPER_ADMIN.
export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ staff });
}

const PatchSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["promote", "demote"]),
});

// PATCH /api/admin/admins — promouvoir un CUSTOMER en ADMIN ou rétrograder
// un ADMIN en CUSTOMER. SUPER_ADMIN ne peut pas être rétrogradé via l'API
// (protection contre l'auto-lock-out).
export async function PATCH(req: NextRequest) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides." },
      { status: 400 },
    );
  }

  const { userId, action } = parsed.data;

  // Empêche de s'auto-modifier.
  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas modifier votre propre rôle." },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!target) {
    return NextResponse.json(
      { error: "Utilisateur introuvable." },
      { status: 404 },
    );
  }

  // Empêche de rétrograder un SUPER_ADMIN.
  if (target.role === "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Impossible de modifier un SUPER_ADMIN." },
      { status: 403 },
    );
  }

  const newRole = action === "promote" ? "ADMIN" : "CUSTOMER";

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  return NextResponse.json({ ok: true, newRole });
}
