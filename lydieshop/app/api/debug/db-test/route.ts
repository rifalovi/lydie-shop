import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================================
// Route de diagnostic TEMPORAIRE — à retirer une fois le bug résolu.
// ============================================================================
//
// Pourquoi un token statique et pas une session admin :
//
//   Cette route est destinée à diagnostiquer /login et /register en panne.
//   Utiliser `getServerSession` + contrôle de rôle créerait un deadlock :
//   si NextAuth/Prisma sont le problème, on ne peut plus s'authentifier pour
//   l'exécuter. On utilise donc un secret DEBUG_TOKEN, stocké dans les env
//   vars Vercel, comparé en temps constant.
//
// Usage :
//
//   1. Définir DEBUG_TOKEN sur Vercel (Production) avec une valeur aléatoire
//      générée par `openssl rand -hex 32` — puis redeploy.
//   2. Appeler l'endpoint :
//        curl -H "Authorization: Bearer <token>" https://lydie-shop.fr/api/debug/db-test
//      ou en query string :
//        https://lydie-shop.fr/api/debug/db-test?token=<token>
//
// Nettoyage après diagnostic :
//
//   - Supprimer ce fichier (git rm lydieshop/app/api/debug/db-test/route.ts)
//   - Supprimer la variable DEBUG_TOKEN des env vars Vercel
//   - Commit + push pour redeployer sans la route
//
// Sécurité :
//
//   - Si DEBUG_TOKEN n'est pas défini, la route renvoie 404 systématique
//     (mode "off"). Ça évite de laisser une porte dérobée ouverte si on
//     oublie de la supprimer.
//   - En cas de token manquant/invalide, on répond aussi 404 (pas 401) pour
//     ne pas signaler l'existence de l'endpoint à un scan.
//   - Toutes les informations sensibles (password, hash bcrypt intégral)
//     sont masquées dans la réponse : on voit la longueur et le préfixe,
//     pas le contenu. De même pour DATABASE_URL.
// ============================================================================

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// Comparaison en temps constant : évite un side-channel sur la durée de
// comparaison caractère par caractère (bonne pratique pour toute comparaison
// de secret, même si l'exposition réelle ici est faible).
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function authorized(req: NextRequest): boolean {
  const expected = process.env.DEBUG_TOKEN;
  if (!expected || expected.length < 16) return false;

  const header = req.headers.get("authorization") ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : null;
  const query = req.nextUrl.searchParams.get("token");

  const provided = bearer ?? query;
  if (!provided) return false;

  return safeEqual(provided, expected);
}

// Masque un connection string Postgres : on garde host/port/db pour le
// diagnostic, on remplace le mot de passe par "***". Si le parse échoue
// (URL malformée), on renvoie "<unparseable>" — c'est DÉJÀ une information
// utile côté diagnostic.
function maskDbUrl(raw: string | undefined): string {
  if (!raw) return "<unset>";
  try {
    const u = new URL(raw);
    const masked = new URL(raw);
    if (masked.password) masked.password = "***";
    return `${u.protocol}//${masked.username}${masked.password ? ":***" : ""}@${u.host}${u.pathname}${u.search}`;
  } catch {
    return "<unparseable>";
  }
}

// Sérialisation d'erreur structurée — identique à celle utilisée dans les
// routes auth, mais inlinée ici pour garder ce fichier complètement
// autonome (plus facile à retirer au nettoyage).
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
    return { kind: err.name, message: err.message };
  }
  return { kind: "unknown", value: String(err) };
}

type StepResult = {
  ok: boolean;
  ms: number;
  result?: unknown;
  error?: ReturnType<typeof describeError>;
};

async function runStep<T>(fn: () => Promise<T>): Promise<StepResult> {
  const start = Date.now();
  try {
    const result = await fn();
    return { ok: true, ms: Date.now() - start, result };
  } catch (err) {
    return { ok: false, ms: Date.now() - start, error: describeError(err) };
  }
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return notFound();

  const started = Date.now();

  // Étape 1 : ping de la connexion via une requête sans schema (SELECT 1).
  // C'est LE test pour savoir si Prisma arrive à joindre la DB, indépendant
  // de la présence des tables Lydie'shop.
  const ping = await runStep(async () => {
    const rows = await prisma.$queryRaw<Array<{ value: number }>>`SELECT 1 AS value`;
    return { rows };
  });

  // Étape 2 : comptage des tables métier — détecte un schéma non migré
  // (la requête de ping réussit mais les tables sont absentes).
  const counts = await runStep(async () => {
    const [users, categories, products, orders, promoCodes] = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.promoCode.count(),
    ]);
    return { users, categories, products, orders, promoCodes };
  });

  // Étape 3 : lookup de l'admin — permet de vérifier que le hash bcrypt en
  // base est lisible, de la bonne longueur et du bon format. Aucune info
  // sensible n'est renvoyée (pas de hash complet, pas de mot de passe).
  const admin = await runStep(async () => {
    const user = await prisma.user.findUnique({
      where: { email: "admin@lydieshop.com" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tier: true,
        loyaltyPoints: true,
        passwordHash: true,
        createdAt: true,
      },
    });
    if (!user) return { exists: false };
    return {
      exists: true,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tier: user.tier,
      loyaltyPoints: user.loyaltyPoints,
      passwordHashLength: user.passwordHash.length,
      passwordHashPrefix: user.passwordHash.slice(0, 7),
      passwordHashLooksValid:
        user.passwordHash.length === 60 &&
        /^\$2[aby]\$\d{2}\$/.test(user.passwordHash),
      createdAt: user.createdAt.toISOString(),
    };
  });

  // Étape 4 : sanity check sur une colonne ajoutée en Phase 1 (Product.features).
  // Si elle existe, ça prouve que le schéma est bien en version Phase 1+.
  // Si elle n'existe pas, P2022 (column does not exist) pointe la cause.
  const productSchemaProbe = await runStep(async () => {
    const rows = await prisma.$queryRaw<
      Array<{ column_name: string; data_type: string }>
    >`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Product'
      ORDER BY ordinal_position
    `;
    const names = rows.map((r) => r.column_name);
    const requiredSinceV2 = [
      "features",
      "careInstructions",
      "isNew",
      "rating",
      "reviewCount",
    ];
    const missing = requiredSinceV2.filter((c) => !names.includes(c));
    return {
      totalColumns: names.length,
      missingSinceV2: missing,
      hasPasswordResetTokenTable: false, // rempli juste après
    };
  });

  // Étape 5 : la table PasswordResetToken (Phase 4) existe-t-elle ?
  const passwordResetTokenTable = await runStep(async () => {
    const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'PasswordResetToken'
      ) AS exists
    `;
    return { exists: rows[0]?.exists === true };
  });

  const totalMs = Date.now() - started;

  return NextResponse.json(
    {
      ok:
        ping.ok &&
        counts.ok &&
        admin.ok &&
        productSchemaProbe.ok &&
        passwordResetTokenTable.ok,
      totalMs,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV ?? null,
        VERCEL_REGION: process.env.VERCEL_REGION ?? null,
        databaseUrl: maskDbUrl(process.env.DATABASE_URL),
        directUrl: maskDbUrl(process.env.DIRECT_URL),
        nextauthUrl: process.env.NEXTAUTH_URL ?? "<unset>",
        hasNextauthSecret: Boolean(process.env.NEXTAUTH_SECRET),
        hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
      },
      prismaVersion: Prisma.prismaVersion?.client ?? "<unknown>",
      node: process.version,
      steps: {
        ping,
        counts,
        admin,
        productSchemaProbe,
        passwordResetTokenTable,
      },
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
