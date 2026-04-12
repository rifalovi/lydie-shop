import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// Sérialise une erreur (Prisma ou autre) pour Vercel Functions logs.
// Identique à celle utilisée dans /api/auth/register — on préfère dupliquer
// la helper plutôt que de créer un lib/errors.ts pour 15 lignes.
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
  if (err instanceof Error) {
    return { kind: err.name, message: err.message };
  }
  return { kind: "unknown", value: String(err) };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        // IMPORTANT : on attrape explicitement les erreurs Prisma/DB. Sans ça,
        // une panne de DB remonte à NextAuth qui renvoie un 500 générique
        // côté client, impossible à diagnostiquer côté utilisateur. Avec le
        // try/catch, le client voit "credentials incorrects" (comportement
        // inchangé pour la cliente) et l'admin voit la vraie cause dans
        // Vercel Functions logs.
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase().trim() },
          });
          if (!user) {
            return null;
          }

          const ok = await bcrypt.compare(
            credentials.password,
            user.passwordHash,
          );
          if (!ok) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            role: user.role,
            emailVerified: Boolean(user.emailVerified),
          };
        } catch (err) {
          // Log exhaustif côté serveur uniquement. Le client voit le même
          // message d'erreur qu'en cas de credentials incorrects, pour ne
          // pas leaker l'état de la DB à un attaquant.
          console.error(
            "[auth.authorize] unexpected error during login",
            describeError(err),
          );
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN" }).role;
        token.emailVerified = (user as { emailVerified: boolean }).emailVerified;
      }
      // On update (e.g. after email verification), refresh from DB.
      if (trigger === "update") {
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, emailVerified: true },
          });
          if (fresh) {
            token.role = fresh.role as "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
            token.emailVerified = Boolean(fresh.emailVerified);
          }
        } catch { /* keep existing values */ }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
