import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RegisterSchema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(60),
  lastName: z.string().min(1, "Nom requis").max(60),
  email: z.string().email("Email invalide"),
  phone: z.string().max(20).optional().nullable(),
  password: z.string().min(8, "8 caractères minimum").max(120),
});

// Sérialise proprement une erreur (y compris Prisma) pour Vercel Functions logs.
// À ne JAMAIS renvoyer au client — juste à logger.
function describeError(err: unknown) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      kind: "PrismaClientKnownRequestError",
      code: err.code,
      meta: err.meta,
      message: err.message,
    };
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return {
      kind: "PrismaClientInitializationError",
      errorCode: err.errorCode,
      message: err.message,
    };
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return { kind: "PrismaClientValidationError", message: err.message };
  }
  if (err instanceof Error) {
    return { kind: err.name, message: err.message, stack: err.stack };
  }
  return { kind: "unknown", value: String(err) };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[/api/auth/register] invalid JSON body", describeError(err));
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    console.warn("[/api/auth/register] zod validation failed", {
      issues: parsed.error.issues,
    });
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 },
    );
  }

  const { firstName, lastName, email, phone, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check de doublon explicite pour donner une erreur claire au client
    // avant même de hasher un mot de passe.
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
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
    sendWelcomeEmail({ to: user.email, name: user.name }).catch((e) => {
      console.error("[/api/auth/register] welcome email failed", describeError(e));
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    const described = describeError(err);
    // Log exhaustif côté serveur — visible dans Vercel Functions logs.
    console.error("[/api/auth/register] signup failed", described);

    // Gestion explicite des erreurs Prisma connues.
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 : violation d'unique (race condition sur l'email).
      if (err.code === "P2002") {
        return NextResponse.json(
          { error: "Un compte existe déjà avec cet email." },
          { status: 409 },
        );
      }
      // P1001 : can't reach database — Supabase down / URL incorrecte.
      // P1002 : connection timed out.
      // P1008 : operations timed out.
      // P2021 : table does not exist — schéma pas migré.
      // Dans tous ces cas, on renvoie 503 pour signaler un souci backend.
      if (["P1001", "P1002", "P1008", "P2021"].includes(err.code)) {
        return NextResponse.json(
          {
            error:
              "Service indisponible. Réessayez dans un instant ou contactez le support.",
          },
          { status: 503 },
        );
      }
    }
    if (err instanceof Prisma.PrismaClientInitializationError) {
      // L'URL de la base est manquante ou mal formée.
      return NextResponse.json(
        {
          error:
            "Service indisponible. Réessayez dans un instant ou contactez le support.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Erreur serveur pendant l'inscription." },
      { status: 500 },
    );
  }
}
