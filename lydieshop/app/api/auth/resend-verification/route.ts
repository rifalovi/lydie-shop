import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sendVerificationEmail,
  generateVerificationToken,
  isResendConfigured,
} from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limit: 1 resend per 5 minutes, tracked via verificationTokenExpiry.
const COOLDOWN_MS = 5 * 60 * 1000;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// POST /api/auth/resend-verification — resends the verification email.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      verificationTokenExpiry: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  // Cooldown: refuse if the last token was generated less than 5 min ago.
  if (user.verificationTokenExpiry) {
    const tokenCreatedAt =
      user.verificationTokenExpiry.getTime() - TOKEN_TTL_MS;
    if (Date.now() - tokenCreatedAt < COOLDOWN_MS) {
      return NextResponse.json(
        { error: "Veuillez patienter 5 minutes avant de renvoyer l'email." },
        { status: 429 },
      );
    }
  }

  const verificationToken = generateVerificationToken();
  const verificationTokenExpiry = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken, verificationTokenExpiry },
  });

  const baseUrl =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "https://lydie-shop.fr";
  const verifyUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`;

  if (!isResendConfigured) {
    console.warn(
      `[resend-verification] RESEND_API_KEY absent — lien :\n${verifyUrl}`,
    );
  }

  sendVerificationEmail({
    to: user.email,
    name: user.name,
    verifyUrl,
  }).catch((e) =>
    console.error("[resend-verification] email error", e),
  );

  return NextResponse.json({ ok: true });
}
