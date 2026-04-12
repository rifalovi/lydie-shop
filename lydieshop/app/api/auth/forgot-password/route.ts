import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail, isResendConfigured } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Durée de vie du lien de réinitialisation : 1 heure.
const TOKEN_TTL_MS = 60 * 60 * 1000;

const Schema = z.object({
  email: z.string().email(),
});

// POST /api/auth/forgot-password
//
// Principe anti-énumération : la réponse est la même (200 ok) que l'email
// existe ou non, pour ne pas indiquer à un attaquant qui est client de la
// boutique. Le travail réel (génération de token, envoi d'email) n'a lieu
// que si un utilisateur correspond.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    // Email invalide : on renvoie quand même 200 pour ne pas révéler quoi que
    // ce soit. L'UI côté client affichera le même message de succès.
    return NextResponse.json({ ok: true });
  }

  const email = parsed.data.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  if (user) {
    // Invalide tout lien précédent non utilisé pour cet utilisateur — une
    // seule session de récupération active à la fois.
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    // Token : 32 octets aléatoires en base64url. On ne stocke en base QUE le
    // hash SHA-256 : ainsi un dump de la DB ne donne pas de liens live, et
    // la vérification reste une simple égalité de hash.
    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.passwordResetToken.create({
      data: { tokenHash, userId: user.id, expiresAt },
    });

    const baseUrl =
      process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "https://lydieshop.com";
    const resetUrl = `${baseUrl}/auth/reset-password?token=${rawToken}`;

    // Si Resend n'est pas configuré, on loggue le lien de reset dans les
    // Vercel Functions Logs pour permettre le debug. En prod avec Resend,
    // le lien part par email et le log n'affiche que la confirmation.
    if (!isResendConfigured) {
      console.warn(
        `[/api/auth/forgot-password] RESEND_API_KEY absent — lien de reset (visible uniquement dans les logs serveur) :\n${resetUrl}`,
      );
    }

    sendPasswordResetEmail({
      to: user.email,
      customerName: user.name,
      resetUrl,
    }).catch((err) =>
      console.error("[/api/auth/forgot-password] email error", err),
    );
  }

  return NextResponse.json({ ok: true });
}
