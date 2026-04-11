import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "8 caractères minimum").max(120),
});

// POST /api/auth/reset-password
//
// Flux :
//   1. Hashe le token reçu (SHA-256) pour faire la recherche en base
//   2. Vérifie qu'il existe, n'est pas utilisé et n'est pas expiré
//   3. Hashe le nouveau mot de passe (bcrypt cost 12)
//   4. Dans une transaction : met à jour le User.passwordHash et marque le
//      token comme consommé (usedAt = NOW())
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 },
    );
  }

  const { token, password } = parsed.data;
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
    },
  });

  if (!record || record.usedAt !== null || record.expiresAt < new Date()) {
    return NextResponse.json(
      {
        error:
          "Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.",
      },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
