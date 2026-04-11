import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

export const runtime = "nodejs";

const RegisterSchema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(60),
  lastName: z.string().min(1, "Nom requis").max(60),
  email: z.string().email("Email invalide"),
  phone: z.string().max(20).optional().nullable(),
  password: z.string().min(8, "8 caractères minimum").max(120),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 },
    );
  }

  const { firstName, lastName, email, phone, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: `${firstName} ${lastName}`.trim(),
      phone: phone || null,
      passwordHash,
      role: "CUSTOMER",
      loyaltyPoints: 100, // bonus d'inscription
    },
    select: { id: true, email: true, name: true },
  });

  // Envoi best-effort, on ne bloque pas l'inscription si Resend échoue.
  sendWelcomeEmail({ to: user.email, name: user.name }).catch(() => {});

  return NextResponse.json({ user }, { status: 201 });
}
