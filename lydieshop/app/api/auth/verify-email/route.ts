import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({ token: z.string().min(1) });

// POST /api/auth/verify-email — validates the token and marks email as verified.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Token requis." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { verificationToken: parsed.data.token },
    select: {
      id: true,
      emailVerified: true,
      verificationTokenExpiry: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Lien invalide. Demandez un nouveau lien de vérification." },
      { status: 400 },
    );
  }

  // Already verified — idempotent.
  if (user.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  // Expired.
  if (
    user.verificationTokenExpiry &&
    user.verificationTokenExpiry < new Date()
  ) {
    return NextResponse.json(
      { error: "Ce lien a expiré. Demandez un nouveau lien de vérification." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });

  return NextResponse.json({ ok: true });
}
